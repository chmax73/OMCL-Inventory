/**
 * Scan Actions
 * ------------
 * Server Actions für die Scan-Seite.
 * Lädt Lagerplätze, SOLL-Waren und speichert IST-Scans.
 */

"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ScanTyp } from "@prisma/client";

// Typ für das aktive Inventar
export type ActiveInventar = {
    id: string;
    erstelltAm: Date;
    sollWarenCount: number;
    istWarenCount: number;
};

// Typ für einen Lagerplatz mit Statistik
export type LagerplatzInfo = {
    code: string;
    raum: string | null;
    sollCount: number;
    istCount: number;
    completed: boolean;
};

// Typ für eine SOLL-Ware
export type SollWare = {
    id: string;
    primarschluessel: string;
    bezeichnung: string | null;
    temperatur: string | null;
    gescannt: boolean;
    scanTyp: ScanTyp | null;
};

// Typ für das Scan-Ergebnis
export type ScanResult = {
    success: boolean;
    scanTyp?: ScanTyp;
    message?: string;
    error?: string;
};

// Aktives (offenes) Inventar laden
export async function getActiveInventar(): Promise<ActiveInventar | null> {
    const inventar = await prisma.inventar.findFirst({
        where: { abgeschlossen: false },
        include: {
            _count: {
                select: {
                    sollWaren: true,
                    istWaren: true,
                },
            },
        },
    });

    if (!inventar) return null;

    return {
        id: inventar.id,
        erstelltAm: inventar.erstelltAm,
        sollWarenCount: inventar._count.sollWaren,
        istWarenCount: inventar._count.istWaren,
    };
}

// Alle Lagerplätze mit Statistik laden
export async function getLagerplaetze(inventarId: string): Promise<LagerplatzInfo[]> {
    // Alle SOLL-Waren gruppiert nach Lagerplatz
    const sollWaren = await prisma.wareSoll.findMany({
        where: { inventarId },
        select: {
            lagerplatzCode: true,
            raum: true,
        },
    });

    // Alle IST-Scans gruppiert nach Lagerplatz
    const istWaren = await prisma.wareIst.findMany({
        where: { inventarId },
        select: {
            lagerplatzCode: true,
        },
    });

    // Lagerplätze aggregieren
    const lagerplaetzeMap = new Map<string, LagerplatzInfo>();

    for (const soll of sollWaren) {
        const existing = lagerplaetzeMap.get(soll.lagerplatzCode);
        if (existing) {
            existing.sollCount++;
        } else {
            lagerplaetzeMap.set(soll.lagerplatzCode, {
                code: soll.lagerplatzCode,
                raum: soll.raum,
                sollCount: 1,
                istCount: 0,
                completed: false,
            });
        }
    }

    for (const ist of istWaren) {
        const existing = lagerplaetzeMap.get(ist.lagerplatzCode);
        if (existing) {
            existing.istCount++;
            existing.completed = existing.istCount >= existing.sollCount;
        }
    }

    // Als Array sortiert nach Code zurückgeben
    return Array.from(lagerplaetzeMap.values()).sort((a, b) =>
        a.code.localeCompare(b.code)
    );
}

// SOLL-Waren für einen Lagerplatz laden
export async function getSollWarenForLagerplatz(
    inventarId: string,
    lagerplatzCode: string
): Promise<SollWare[]> {
    const sollWaren = await prisma.wareSoll.findMany({
        where: {
            inventarId,
            lagerplatzCode,
        },
        orderBy: { primarschluessel: "asc" },
    });

    // IST-Scans für diesen Lagerplatz laden
    const istWaren = await prisma.wareIst.findMany({
        where: {
            inventarId,
            lagerplatzCode,
        },
        select: {
            primarschluessel: true,
            scanTyp: true,
        },
    });

    // Map für schnellen Lookup
    const istMap = new Map(istWaren.map((i) => [i.primarschluessel, i.scanTyp]));

    return sollWaren.map((soll) => ({
        id: soll.id,
        primarschluessel: soll.primarschluessel,
        bezeichnung: soll.bezeichnung,
        temperatur: soll.temperatur,
        gescannt: istMap.has(soll.primarschluessel),
        scanTyp: istMap.get(soll.primarschluessel) || null,
    }));
}

// Barcode scannen und IST-Eintrag erstellen
export async function scanBarcode(
    inventarId: string,
    lagerplatzCode: string,
    barcode: string,
    userId: string
): Promise<ScanResult> {
    try {
        // Prüfen ob bereits gescannt
        const existing = await prisma.wareIst.findFirst({
            where: {
                inventarId,
                primarschluessel: barcode,
            },
        });

        if (existing) {
            return {
                success: false,
                error: "Dieser Barcode wurde bereits gescannt",
            };
        }

        // Prüfen ob im SOLL-Bestand
        const sollWare = await prisma.wareSoll.findFirst({
            where: {
                inventarId,
                primarschluessel: barcode,
            },
        });

        let scanTyp: ScanTyp;
        let message: string;

        if (!sollWare) {
            // Nicht im SOLL = NEU (unerwartet gefunden)
            scanTyp = ScanTyp.neu;
            message = "Ware nicht im SOLL-Bestand - als NEU erfasst";

            // Abweichung erstellen
            await prisma.abweichung.create({
                data: {
                    inventarId,
                    primarschluessel: barcode,
                    typ: "neu",
                },
            });
        } else if (sollWare.lagerplatzCode !== lagerplatzCode) {
            // Falscher Lagerplatz
            scanTyp = ScanTyp.falsch;
            message = `Ware am falschen Ort - erwartet: ${sollWare.lagerplatzCode}`;

            // Abweichung erstellen
            await prisma.abweichung.create({
                data: {
                    inventarId,
                    primarschluessel: barcode,
                    typ: "falsch",
                    kommentar: `Erwartet: ${sollWare.lagerplatzCode}, Gefunden: ${lagerplatzCode}`,
                },
            });
        } else {
            // Alles OK
            scanTyp = ScanTyp.ok;
            message = "Ware erfolgreich erfasst";
        }

        // IST-Eintrag erstellen
        await prisma.wareIst.create({
            data: {
                inventarId,
                primarschluessel: barcode,
                lagerplatzCode,
                userId,
                scanTyp,
            },
        });

        // Cache invalidieren
        revalidatePath("/scan");
        revalidatePath("/");

        return { success: true, scanTyp, message };
    } catch (error) {
        console.error("Fehler beim Scannen:", error);
        return { success: false, error: "Ein unerwarteter Fehler ist aufgetreten" };
    }
}

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
    ueberprueft: boolean; // true wenn Lagerplatz als überprüft markiert
};

// Typ für eine Ware (SOLL oder NEU gefunden)
export type SollWare = {
    id: string;
    primarschluessel: string;
    bezeichnung: string | null;
    temperatur: string | null;
    gescannt: boolean;
    scanTyp: ScanTyp | null;
    isNeu: boolean; // true wenn nicht im SOLL-Bestand
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
                },
            },
        },
    });

    if (!inventar) return null;

    // Nur OK-Scans zählen (nicht NEU oder FALSCH)
    const okScansCount = await prisma.wareIst.count({
        where: {
            inventarId: inventar.id,
            scanTyp: ScanTyp.ok,
        },
    });

    return {
        id: inventar.id,
        erstelltAm: inventar.erstelltAm,
        sollWarenCount: inventar._count.sollWaren,
        istWarenCount: okScansCount,
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

    // Nur OK-Scans zählen (nicht NEU oder FALSCH)
    const istWaren = await prisma.wareIst.findMany({
        where: {
            inventarId,
            scanTyp: ScanTyp.ok,
        },
        select: {
            lagerplatzCode: true,
        },
    });

    // Überprüfte Lagerplätze laden
    const ueberpruefteLagerplaetze = await prisma.lagerplatzUeberprueft.findMany({
        where: { inventarId },
        select: { lagerplatzCode: true },
    });
    const ueberprueftSet = new Set(ueberpruefteLagerplaetze.map(u => u.lagerplatzCode));

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
                ueberprueft: ueberprueftSet.has(soll.lagerplatzCode),
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

// SOLL-Waren für einen Lagerplatz laden (inkl. NEU gefundene Waren)
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
            id: true,
            primarschluessel: true,
            scanTyp: true,
        },
    });

    // Map für schnellen Lookup
    const istMap = new Map(istWaren.map((i) => [i.primarschluessel, { scanTyp: i.scanTyp, id: i.id }]));

    // SOLL-Waren mit Scan-Status
    const result: SollWare[] = sollWaren.map((soll) => ({
        id: soll.id,
        primarschluessel: soll.primarschluessel,
        bezeichnung: soll.bezeichnung,
        temperatur: soll.temperatur,
        gescannt: istMap.has(soll.primarschluessel),
        scanTyp: istMap.get(soll.primarschluessel)?.scanTyp || null,
        isNeu: false,
    }));

    // NEU gefundene Waren hinzufügen (nicht im SOLL-Bestand)
    const sollPrimarschluessel = new Set(sollWaren.map((s) => s.primarschluessel));
    for (const ist of istWaren) {
        if (!sollPrimarschluessel.has(ist.primarschluessel)) {
            result.push({
                id: ist.id,
                primarschluessel: ist.primarschluessel,
                bezeichnung: null,
                temperatur: null,
                gescannt: true,
                scanTyp: ist.scanTyp,
                isNeu: true,
            });
        }
    }

    return result;
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

// Lagerplatz als überprüft markieren
export async function confirmLagerplatz(
    inventarId: string,
    lagerplatzCode: string,
    userId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Prüfen ob bereits überprüft
        const existing = await prisma.lagerplatzUeberprueft.findUnique({
            where: {
                inventarId_lagerplatzCode: {
                    inventarId,
                    lagerplatzCode,
                },
            },
        });

        if (existing) {
            return { success: false, error: "Lagerplatz wurde bereits als überprüft markiert" };
        }

        // Als überprüft markieren
        await prisma.lagerplatzUeberprueft.create({
            data: {
                inventarId,
                lagerplatzCode,
                ueberprueftVonId: userId,
            },
        });

        // Audit-Log erstellen
        await prisma.auditTrail.create({
            data: {
                userId,
                aktion: "lagerplatz_ueberprueft",
                entitaet: "lagerplatz",
                referenzId: lagerplatzCode,
                inventarId,
                details: JSON.stringify({ lagerplatzCode }),
            },
        });

        // Cache invalidieren
        revalidatePath("/scan");

        return { success: true };
    } catch (error) {
        console.error("Fehler beim Bestätigen:", error);
        return { success: false, error: "Ein unerwarteter Fehler ist aufgetreten" };
    }
}

// Prüfen ob Lagerplatz überprüft wurde
export async function isLagerplatzUeberprueft(
    inventarId: string,
    lagerplatzCode: string
): Promise<boolean> {
    const result = await prisma.lagerplatzUeberprueft.findUnique({
        where: {
            inventarId_lagerplatzCode: {
                inventarId,
                lagerplatzCode,
            },
        },
    });
    return !!result;
}

// Lagerplatz wiedereröffnen (Überprüft-Status entfernen)
export async function reopenLagerplatz(
    inventarId: string,
    lagerplatzCode: string,
    userId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.lagerplatzUeberprueft.delete({
            where: {
                inventarId_lagerplatzCode: {
                    inventarId,
                    lagerplatzCode,
                },
            },
        });

        // Audit-Log erstellen
        await prisma.auditTrail.create({
            data: {
                userId,
                aktion: "lagerplatz_wiedereroeffnet",
                entitaet: "lagerplatz",
                referenzId: lagerplatzCode,
                inventarId,
                details: JSON.stringify({ lagerplatzCode }),
            },
        });

        revalidatePath("/scan");
        return { success: true };
    } catch (error) {
        console.error("Fehler beim Wiedereröffnen:", error);
        return { success: false, error: "Lagerplatz konnte nicht wiedereröffnet werden" };
    }
}

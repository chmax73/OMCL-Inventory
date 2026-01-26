/**
 * Abweichungen Actions
 * --------------------
 * Server Actions für die Abweichungen-Seite.
 * Lädt alle Abweichungen und ermöglicht Bestätigung/Kommentierung.
 */

"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { AbweichungTyp } from "@prisma/client";

// Typ für eine Abweichung in der Liste
export type AbweichungItem = {
    id: string;
    primarschluessel: string;
    typ: AbweichungTyp;
    kommentar: string | null;
    bestaetigtAm: Date | null;
    bestaetigtDurch: string | null;
    lagerplatzCode: string | null;
    bezeichnung: string | null;
};

// Alle Abweichungen für ein Inventar laden
export async function getAbweichungen(inventarId: string): Promise<AbweichungItem[]> {
    const abweichungen = await prisma.abweichung.findMany({
        where: { inventarId },
        include: {
            bestaetigtDurch: {
                select: { name: true },
            },
        },
        orderBy: { typ: "asc" },
    });

    // Zusätzliche Infos aus SOLL-Waren laden
    const sollWaren = await prisma.wareSoll.findMany({
        where: { inventarId },
        select: {
            primarschluessel: true,
            lagerplatzCode: true,
            bezeichnung: true,
        },
    });
    const sollMap = new Map(sollWaren.map(s => [s.primarschluessel, s]));

    // IST-Waren für NEU-Abweichungen laden
    const istWaren = await prisma.wareIst.findMany({
        where: { inventarId },
        select: {
            primarschluessel: true,
            lagerplatzCode: true,
        },
    });
    const istMap = new Map(istWaren.map(i => [i.primarschluessel, i]));

    return abweichungen.map(a => {
        const soll = sollMap.get(a.primarschluessel);
        const ist = istMap.get(a.primarschluessel);

        return {
            id: a.id,
            primarschluessel: a.primarschluessel,
            typ: a.typ,
            kommentar: a.kommentar,
            bestaetigtAm: a.bestaetigtAm,
            bestaetigtDurch: a.bestaetigtDurch?.name || null,
            lagerplatzCode: soll?.lagerplatzCode || ist?.lagerplatzCode || null,
            bezeichnung: soll?.bezeichnung || null,
        };
    });
}

// Abweichung bestätigen
export async function confirmAbweichung(
    abweichungId: string,
    userId: string,
    kommentar: string | null
): Promise<{ success: boolean; error?: string }> {
    try {
        const abweichung = await prisma.abweichung.update({
            where: { id: abweichungId },
            data: {
                bestaetigtDurchId: userId,
                bestaetigtAm: new Date(),
                kommentar: kommentar || undefined,
            },
        });

        // Audit-Log erstellen
        await prisma.auditTrail.create({
            data: {
                userId,
                aktion: "abweichung_bestaetigt",
                entitaet: "abweichung",
                referenzId: abweichungId,
                inventarId: abweichung.inventarId,
                details: JSON.stringify({ primarschluessel: abweichung.primarschluessel, kommentar }),
            },
        });

        revalidatePath("/abweichungen");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Fehler beim Bestätigen:", error);
        return { success: false, error: "Abweichung konnte nicht bestätigt werden" };
    }
}

// Statistik für Abweichungen
export async function getAbweichungStats(inventarId: string): Promise<{
    total: number;
    bestaetigt: number;
    offen: number;
    nachTyp: { typ: AbweichungTyp; count: number }[];
}> {
    const abweichungen = await prisma.abweichung.findMany({
        where: { inventarId },
        select: {
            typ: true,
            bestaetigtAm: true,
        },
    });

    const total = abweichungen.length;
    const bestaetigt = abweichungen.filter(a => a.bestaetigtAm !== null).length;
    const offen = total - bestaetigt;

    // Nach Typ gruppieren
    const typCounts = new Map<AbweichungTyp, number>();
    for (const a of abweichungen) {
        typCounts.set(a.typ, (typCounts.get(a.typ) || 0) + 1);
    }

    const nachTyp = Array.from(typCounts.entries()).map(([typ, count]) => ({ typ, count }));

    return { total, bestaetigt, offen, nachTyp };
}

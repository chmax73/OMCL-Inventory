/**
 * Abweichungen Actions
 * --------------------
 * Server Actions für die Abweichungen-Seite.
 * Lädt alle Abweichungen und ermöglicht Bestätigung/Kommentierung.
 */

"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/auth/identity";
import { confirmAbweichungSchema } from "@/lib/abweichung-validation";
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
    kommentar: string | null
): Promise<{ success: boolean; error?: string }> {
    const parsed = confirmAbweichungSchema.safeParse({ abweichungId, kommentar });
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message ?? "Eingaben sind ungueltig." };
    }

    let user;
    try {
        user = await requireAdminUser();
    } catch {
        return { success: false, error: "Nur angemeldete Admins koennen Abweichungen bestaetigen." };
    }

    try {
        const abweichung = await prisma.abweichung.findUnique({
            where: { id: parsed.data.abweichungId },
            select: { inventarId: true, primarschluessel: true },
        });
        if (!abweichung) return { success: false, error: "Abweichung nicht gefunden." };

        const updated = await prisma.$transaction(async (tx) => {
            const result = await tx.abweichung.updateMany({
                where: {
                    id: parsed.data.abweichungId,
                    bestaetigtAm: null,
                    inventar: { is: { abgeschlossen: false, archiviert: false } },
                },
                data: {
                    bestaetigtDurchId: user.id,
                    bestaetigtAm: new Date(),
                    kommentar: parsed.data.kommentar || undefined,
                },
            });
            if (result.count === 0) return false;
            await tx.auditTrail.create({
                data: {
                    userId: user.id,
                    aktion: "abweichung_bestaetigt",
                    entitaet: "abweichung",
                    referenzId: parsed.data.abweichungId,
                    inventarId: abweichung.inventarId,
                    details: JSON.stringify({
                        primarschluessel: abweichung.primarschluessel,
                        kommentar: parsed.data.kommentar,
                    }),
                },
            });
            return true;
        });
        if (!updated) {
            return { success: false, error: "Abweichung ist bereits bestaetigt oder das Inventar ist abgeschlossen." };
        }

        revalidatePath("/abweichungen");
        revalidatePath(`/inventar/${abweichung.inventarId}/abweichungen`);
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Fehler beim Bestätigen:", error instanceof Error ? error.name : "unbekannt");
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

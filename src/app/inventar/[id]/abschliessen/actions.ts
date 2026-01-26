/**
 * Inventar Abschliessen Actions
 * -----------------------------
 * Server Actions zum Abschliessen eines Inventars.
 * Prüft Voraussetzungen und markiert das Inventar als abgeschlossen.
 */

"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Typ für den Abschluss-Status
export type AbschlussStatus = {
    canClose: boolean;
    reasons: string[];
    stats: {
        sollWaren: number;
        istScans: number;
        lagerplaetzeTotal: number;
        lagerplaetzeUeberprueft: number;
        abweichungenTotal: number;
        abweichungenOffen: number;
    };
};

// Prüfen ob Inventar abgeschlossen werden kann
export async function getAbschlussStatus(inventarId: string): Promise<AbschlussStatus> {
    // Statistiken laden
    const [sollWaren, istScans, abweichungen, lagerplaetzeUeberprueft] = await Promise.all([
        prisma.wareSoll.count({ where: { inventarId } }),
        prisma.wareIst.count({ where: { inventarId } }),
        prisma.abweichung.findMany({
            where: { inventarId },
            select: { bestaetigtAm: true },
        }),
        prisma.lagerplatzUeberprueft.count({ where: { inventarId } }),
    ]);

    // Anzahl Lagerplätze ermitteln
    const lagerplaetze = await prisma.wareSoll.findMany({
        where: { inventarId },
        select: { lagerplatzCode: true },
        distinct: ["lagerplatzCode"],
    });
    const lagerplaetzeTotal = lagerplaetze.length;

    const abweichungenTotal = abweichungen.length;
    const abweichungenOffen = abweichungen.filter(a => a.bestaetigtAm === null).length;

    const stats = {
        sollWaren,
        istScans,
        lagerplaetzeTotal,
        lagerplaetzeUeberprueft,
        abweichungenTotal,
        abweichungenOffen,
    };

    // Gründe sammeln, warum nicht abgeschlossen werden kann
    const reasons: string[] = [];

    if (lagerplaetzeUeberprueft < lagerplaetzeTotal) {
        reasons.push(`${lagerplaetzeTotal - lagerplaetzeUeberprueft} Lagerplätze sind noch nicht überprüft`);
    }

    if (abweichungenOffen > 0) {
        reasons.push(`${abweichungenOffen} Abweichungen sind noch nicht bestätigt`);
    }

    return {
        canClose: reasons.length === 0,
        reasons,
        stats,
    };
}

// Inventar abschliessen
export async function closeInventar(
    inventarId: string,
    userId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Status prüfen
        const status = await getAbschlussStatus(inventarId);

        if (!status.canClose) {
            return {
                success: false,
                error: "Inventar kann noch nicht abgeschlossen werden: " + status.reasons.join(", "),
            };
        }

        // Inventar als abgeschlossen markieren
        await prisma.inventar.update({
            where: { id: inventarId },
            data: {
                abgeschlossen: true,
                abgeschlossenAm: new Date(),
            },
        });

        // Audit-Log erstellen
        await prisma.auditTrail.create({
            data: {
                userId,
                aktion: "inventar_abgeschlossen",
                entitaet: "inventar",
                referenzId: inventarId,
                inventarId,
                details: JSON.stringify(status.stats),
            },
        });

        revalidatePath("/");
        revalidatePath("/scan");
        revalidatePath("/abweichungen");

        return { success: true };
    } catch (error) {
        console.error("Fehler beim Abschliessen:", error);
        return { success: false, error: "Inventar konnte nicht abgeschlossen werden" };
    }
}

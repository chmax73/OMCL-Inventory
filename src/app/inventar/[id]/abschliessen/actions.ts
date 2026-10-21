/**
 * Inventar Abschliessen Actions
 * -----------------------------
 * Server Actions zum Abschliessen eines Inventars.
 * Prüft Voraussetzungen und markiert das Inventar als abgeschlossen.
 */

"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/auth/identity";
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
    await requireAdminUser();

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
export async function closeInventar(inventarId: string): Promise<{ success: boolean; error?: string }> {
    let user;
    try {
        user = await requireAdminUser();
    } catch {
        return { success: false, error: "Nur angemeldete Admins koennen Inventare abschliessen." };
    }

    try {
        const inventar = await prisma.inventar.findFirst({
            where: { id: inventarId, abgeschlossen: false, archiviert: false },
            select: { id: true },
        });
        if (!inventar) {
            return { success: false, error: "Nur offene, nicht archivierte Inventare koennen abgeschlossen werden." };
        }

        // Status prüfen
        const status = await getAbschlussStatus(inventarId);

        if (!status.canClose) {
            return {
                success: false,
                error: "Inventar kann noch nicht abgeschlossen werden: " + status.reasons.join(", "),
            };
        }

        // Status und Audit-Protokoll werden gemeinsam gespeichert oder gar nicht.
        const updated = await prisma.$transaction(async (tx) => {
            const result = await tx.inventar.updateMany({
                where: { id: inventarId, abgeschlossen: false, archiviert: false },
                data: { abgeschlossen: true, abgeschlossenAm: new Date() },
            });
            if (result.count === 0) return false;
            await tx.auditTrail.create({
                data: {
                    userId: user.id,
                    aktion: "inventar_abgeschlossen",
                    entitaet: "inventar",
                    referenzId: inventarId,
                    inventarId,
                    details: JSON.stringify(status.stats),
                },
            });
            return true;
        });
        if (!updated) return { success: false, error: "Inventar wurde bereits abgeschlossen oder archiviert." };

        revalidatePath("/");
        revalidatePath("/scan");
        revalidatePath("/abweichungen");

        return { success: true };
    } catch (error) {
        console.error("Fehler beim Abschliessen:", error instanceof Error ? error.name : "unbekannt");
        return { success: false, error: "Inventar konnte nicht abgeschlossen werden" };
    }
}

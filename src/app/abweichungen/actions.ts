/**
 * Abweichungen Actions
 * --------------------
 * Server Actions für die Abweichungen-Seite.
 * Lädt alle Abweichungen und ermöglicht Bestätigung/Kommentierung.
 */

"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminUser, requireAuthenticatedAppUser } from "@/lib/auth/identity";
import { canChangeAbweichungStatus, confirmAbweichungSchema, discardAbweichungSchema, reopenAbweichungSchema } from "@/lib/abweichung-validation";
import { revalidatePath } from "next/cache";
import { AbweichungStatus, AbweichungTyp } from "@prisma/client";

// Typ für eine Abweichung in der Liste
export type AbweichungItem = {
    id: string;
    primarschluessel: string;
    typ: AbweichungTyp;
    status: AbweichungStatus;
    kommentar: string | null;
    bestaetigtAm: Date | null;
    bestaetigtDurch: string | null;
    lagerplatzCode: string | null;
    bezeichnung: string | null;
};

// Alle Abweichungen für ein Inventar laden
export async function getAbweichungen(inventarId: string): Promise<AbweichungItem[]> {
    await requireAuthenticatedAppUser();

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
            status: a.status,
            kommentar: a.kommentar,
            bestaetigtAm: a.bestaetigtAm,
            bestaetigtDurch: a.bestaetigtDurch?.name || null,
            lagerplatzCode: soll?.lagerplatzCode || ist?.lagerplatzCode || null,
            bezeichnung: soll?.bezeichnung || null,
        };
    });
}

async function changeAbweichungStatus(
    abweichungId: string,
    status: AbweichungStatus,
    kommentar: string | null
): Promise<{ success: boolean; error?: string }> {
    let user;
    try {
        user = await requireAdminUser();
    } catch {
        return { success: false, error: "Nur angemeldete Admins koennen Abweichungen bearbeiten." };
    }

    try {
        const abweichung = await prisma.abweichung.findUnique({
            where: { id: abweichungId },
            select: { inventarId: true, primarschluessel: true, status: true },
        });
        if (!abweichung) return { success: false, error: "Abweichung nicht gefunden." };
        if (!canChangeAbweichungStatus(abweichung.status, status)) {
            return { success: false, error: "Dieser Statuswechsel ist nicht möglich. Bitte die Abweichung zuerst wieder eröffnen." };
        }

        const updated = await prisma.$transaction(async (tx) => {
            const result = await tx.abweichung.updateMany({
                where: {
                    id: abweichungId,
                    status: abweichung.status,
                    inventar: { is: { abgeschlossen: false, archiviert: false } },
                },
                data: {
                    status,
                    bestaetigtDurchId: status === AbweichungStatus.bestaetigt ? user.id : null,
                    bestaetigtAm: status === AbweichungStatus.bestaetigt ? new Date() : null,
                    kommentar: status === AbweichungStatus.offen ? null : kommentar,
                },
            });
            if (result.count === 0) return false;
            await tx.auditTrail.create({
                data: {
                    userId: user.id,
                    aktion: status === AbweichungStatus.offen
                        ? "abweichung_wiedereroeffnet"
                        : status === AbweichungStatus.verworfen
                            ? "abweichung_verworfen"
                            : "abweichung_bestaetigt",
                    entitaet: "abweichung",
                    referenzId: abweichungId,
                    inventarId: abweichung.inventarId,
                    details: JSON.stringify({
                        primarschluessel: abweichung.primarschluessel,
                        vorherigerStatus: abweichung.status,
                        status,
                        kommentar,
                    }),
                },
            });
            return true;
        });
        if (!updated) {
            return { success: false, error: "Status wurde inzwischen geändert oder das Inventar ist abgeschlossen." };
        }

        revalidatePath("/abweichungen");
        revalidatePath(`/inventar/${abweichung.inventarId}/abweichungen`);
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Fehler beim Ändern des Abweichungsstatus:", error instanceof Error ? error.name : "unbekannt");
        return { success: false, error: "Abweichungsstatus konnte nicht geändert werden." };
    }
}

export async function confirmAbweichung(abweichungId: string, kommentar: string | null) {
    const parsed = confirmAbweichungSchema.safeParse({ abweichungId, kommentar });
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };
    return changeAbweichungStatus(parsed.data.abweichungId, AbweichungStatus.bestaetigt, parsed.data.kommentar);
}

export async function discardAbweichung(abweichungId: string, kommentar: string) {
    const parsed = discardAbweichungSchema.safeParse({ abweichungId, kommentar });
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };
    return changeAbweichungStatus(parsed.data.abweichungId, AbweichungStatus.verworfen, parsed.data.kommentar);
}

export async function reopenAbweichung(abweichungId: string) {
    const parsed = reopenAbweichungSchema.safeParse({ abweichungId });
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };
    return changeAbweichungStatus(parsed.data.abweichungId, AbweichungStatus.offen, null);
}

// Statistik für Abweichungen
export async function getAbweichungStats(inventarId: string): Promise<{
    total: number;
    bestaetigt: number;
    verworfen: number;
    offen: number;
    nachTyp: { typ: AbweichungTyp; count: number }[];
}> {
    await requireAuthenticatedAppUser();

    const abweichungen = await prisma.abweichung.findMany({
        where: { inventarId },
        select: {
            typ: true,
            status: true,
        },
    });

    const total = abweichungen.length;
    const bestaetigt = abweichungen.filter(a => a.status === AbweichungStatus.bestaetigt).length;
    const verworfen = abweichungen.filter(a => a.status === AbweichungStatus.verworfen).length;
    const offen = total - bestaetigt - verworfen;

    // Nach Typ gruppieren
    const typCounts = new Map<AbweichungTyp, number>();
    for (const a of abweichungen) {
        typCounts.set(a.typ, (typCounts.get(a.typ) || 0) + 1);
    }

    const nachTyp = Array.from(typCounts.entries()).map(([typ, count]) => ({ typ, count }));

    return { total, bestaetigt, verworfen, offen, nachTyp };
}

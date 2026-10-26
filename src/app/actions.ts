/**
 * Dashboard Actions
 * -----------------
 * Server Actions für die Dashboard-Seite.
 * Lädt Statistiken und Inventar-Liste aus der Datenbank.
 */

"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminUser, requireAuthenticatedAppUser } from "@/lib/auth/identity";
import { OK_SCAN_WHERE, SCANNABLE_SOLL_WHERE } from "@/lib/inventory-progress";
import { revalidatePath } from "next/cache";
import { InventarTyp } from "@prisma/client";

// Typ für Dashboard-Statistiken
export type DashboardStats = {
    offeneInventare: number;
    abgeschlosseneInventare: number;
    offeneAbweichungen: number;
    heuteGescannt: number;
};

// Typ für Inventar in der Liste
export type InventarListItem = {
    id: string;
    typ: InventarTyp;
    erstelltAm: Date;
    erstelltVon: string;
    abgeschlossen: boolean;
    abgeschlossenAm: Date | null;
    sollWaren: number;
    istScans: number;
};

// Dashboard-Statistiken laden
export async function getDashboardStats(): Promise<DashboardStats> {
    await requireAuthenticatedAppUser();

    // Heute um Mitternacht für "heute gescannt" Abfrage
    const heute = new Date();
    heute.setHours(0, 0, 0, 0);

    const [offeneInventare, abgeschlosseneInventare, offeneAbweichungen, heuteGescannt] =
        await Promise.all([
            // Offene Inventare zählen
            prisma.inventar.count({
                where: { abgeschlossen: false },
            }),
            // Abgeschlossene Inventare zählen (dieses Jahr)
            prisma.inventar.count({
                where: {
                    abgeschlossen: true,
                    abgeschlossenAm: {
                        gte: new Date(heute.getFullYear(), 0, 1), // Ab 1. Januar
                    },
                },
            }),
            // Nur noch nicht entschiedene Abweichungen zählen.
            prisma.abweichung.count({
                where: { status: "offen" },
            }),
            // Heute gescannte Waren zählen
            prisma.wareIst.count({
                where: {
                    timestamp: { gte: heute },
                },
            }),
        ]);

    return {
        offeneInventare,
        abgeschlosseneInventare,
        offeneAbweichungen,
        heuteGescannt,
    };
}

// Aktuelle Inventare laden (nicht archivierte), optional nach Typ filtern
export async function getInventarList(typ?: InventarTyp): Promise<InventarListItem[]> {
    await requireAuthenticatedAppUser();

    const inventare = await prisma.inventar.findMany({
        where: { archiviert: false, ...(typ ? { typ } : {}) },
        include: {
            erstelltVon: {
                select: { name: true },
            },
            _count: {
                select: {
                    sollWaren: { where: SCANNABLE_SOLL_WHERE },
                    istWaren: { where: OK_SCAN_WHERE },
                },
            },
        },
        orderBy: { erstelltAm: "desc" },
        take: 10,
    });

    return inventare.map((inv) => ({
        id: inv.id,
        typ: inv.typ,
        erstelltAm: inv.erstelltAm,
        erstelltVon: inv.erstelltVon.name,
        abgeschlossen: inv.abgeschlossen,
        abgeschlossenAm: inv.abgeschlossenAm,
        sollWaren: inv._count.sollWaren,
        istScans: inv._count.istWaren,
    }));
}

// Archivierte Inventare laden
export async function getArchivedInventarList(): Promise<InventarListItem[]> {
    await requireAuthenticatedAppUser();

    const inventare = await prisma.inventar.findMany({
        where: { archiviert: true },
        include: {
            erstelltVon: {
                select: { name: true },
            },
            _count: {
                select: {
                    sollWaren: { where: SCANNABLE_SOLL_WHERE },
                    istWaren: { where: OK_SCAN_WHERE },
                },
            },
        },
        orderBy: { erstelltAm: "desc" },
    });

    return inventare.map((inv) => ({
        id: inv.id,
        typ: inv.typ,
        erstelltAm: inv.erstelltAm,
        erstelltVon: inv.erstelltVon.name,
        abgeschlossen: inv.abgeschlossen,
        abgeschlossenAm: inv.abgeschlossenAm,
        sollWaren: inv._count.sollWaren,
        istScans: inv._count.istWaren,
    }));
}

// Inventar archivieren
export async function archiveInventar(inventarId: string): Promise<{ success: boolean; error?: string }> {
    try {
        await requireAdminUser();
    } catch {
        return { success: false, error: "Nur angemeldete Admins koennen Inventare archivieren." };
    }

    try {
        const result = await prisma.inventar.updateMany({
            where: { id: inventarId, abgeschlossen: true, archiviert: false },
            data: {
                archiviert: true,
                archiviertAm: new Date(),
            },
        });
        if (result.count === 0) {
            return { success: false, error: "Nur abgeschlossene, noch nicht archivierte Inventare koennen archiviert werden." };
        }
        revalidatePath("/");
        revalidatePath("/archiv");
        return { success: true };
    } catch (error) {
        console.error("Fehler beim Archivieren:", error instanceof Error ? error.name : "unbekannt");
        return { success: false, error: "Inventar konnte nicht archiviert werden" };
    }
}

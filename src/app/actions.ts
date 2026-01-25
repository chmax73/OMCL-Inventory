/**
 * Dashboard Actions
 * -----------------
 * Server Actions für die Dashboard-Seite.
 * Lädt Statistiken und Inventar-Liste aus der Datenbank.
 */

"use server";

import { prisma } from "@/lib/prisma";

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
    erstelltAm: Date;
    erstelltVon: string;
    abgeschlossen: boolean;
    abgeschlossenAm: Date | null;
    sollWaren: number;
    istScans: number;
};

// Dashboard-Statistiken laden
export async function getDashboardStats(): Promise<DashboardStats> {
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
            // Offene Abweichungen zählen (nicht bestätigt)
            prisma.abweichung.count({
                where: { bestaetigtDurchId: null },
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

// Aktuelle Inventare laden
export async function getInventarList(): Promise<InventarListItem[]> {
    const inventare = await prisma.inventar.findMany({
        include: {
            erstelltVon: {
                select: { name: true },
            },
            _count: {
                select: {
                    sollWaren: true,
                    istWaren: true,
                },
            },
        },
        orderBy: { erstelltAm: "desc" },
        take: 10, // Nur die letzten 10
    });

    return inventare.map((inv) => ({
        id: inv.id,
        erstelltAm: inv.erstelltAm,
        erstelltVon: inv.erstelltVon.name,
        abgeschlossen: inv.abgeschlossen,
        abgeschlossenAm: inv.abgeschlossenAm,
        sollWaren: inv._count.sollWaren,
        istScans: inv._count.istWaren,
    }));
}

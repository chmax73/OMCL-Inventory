/**
 * Report Actions
 * ---------------
 * Server Actions zum Laden der Daten für den PDF-Report.
 */

"use server";

import { prisma } from "@/lib/prisma";

// Typ für den Report
export type ReportData = {
    inventar: {
        id: string;
        erstelltAm: Date;
        abgeschlossenAm: Date | null;
        erstelltVon: string;
    };
    statistik: {
        sollWaren: number;
        istScans: number;
        lagerplaetze: number;
        abweichungenTotal: number;
        abweichungenFehlend: number;
        abweichungenFalsch: number;
        abweichungenNeu: number;
    };
    abweichungen: {
        primarschluessel: string;
        typ: string;
        bezeichnung: string | null;
        lagerplatzCode: string | null;
        kommentar: string | null;
        bestaetigtDurch: string | null;
    }[];
};

// Report-Daten laden
export async function getReportData(inventarId: string): Promise<ReportData | null> {
    const inventar = await prisma.inventar.findUnique({
        where: { id: inventarId },
        include: {
            erstelltVon: { select: { name: true } },
        },
    });

    if (!inventar) return null;

    // Statistiken laden
    const [sollWaren, istScans, lagerplaetze, abweichungen] = await Promise.all([
        prisma.wareSoll.count({ where: { inventarId } }),
        prisma.wareIst.count({ where: { inventarId } }),
        prisma.wareSoll.findMany({
            where: { inventarId },
            select: { lagerplatzCode: true },
            distinct: ["lagerplatzCode"],
        }),
        prisma.abweichung.findMany({
            where: { inventarId },
            include: {
                bestaetigtDurch: { select: { name: true } },
            },
        }),
    ]);

    // SOLL-Waren für Bezeichnungen laden
    const sollWarenMap = new Map(
        (await prisma.wareSoll.findMany({
            where: { inventarId },
            select: { primarschluessel: true, bezeichnung: true, lagerplatzCode: true },
        })).map(s => [s.primarschluessel, s])
    );

    // IST-Waren für Lagerplatz bei NEU-Abweichungen
    const istWarenMap = new Map(
        (await prisma.wareIst.findMany({
            where: { inventarId },
            select: { primarschluessel: true, lagerplatzCode: true },
        })).map(i => [i.primarschluessel, i])
    );

    return {
        inventar: {
            id: inventar.id,
            erstelltAm: inventar.erstelltAm,
            abgeschlossenAm: inventar.abgeschlossenAm,
            erstelltVon: inventar.erstelltVon.name,
        },
        statistik: {
            sollWaren,
            istScans,
            lagerplaetze: lagerplaetze.length,
            abweichungenTotal: abweichungen.length,
            abweichungenFehlend: abweichungen.filter(a => a.typ === "fehlend").length,
            abweichungenFalsch: abweichungen.filter(a => a.typ === "falsch").length,
            abweichungenNeu: abweichungen.filter(a => a.typ === "neu").length,
        },
        abweichungen: abweichungen.map(a => {
            const soll = sollWarenMap.get(a.primarschluessel);
            const ist = istWarenMap.get(a.primarschluessel);
            return {
                primarschluessel: a.primarschluessel,
                typ: a.typ,
                bezeichnung: soll?.bezeichnung || null,
                lagerplatzCode: soll?.lagerplatzCode || ist?.lagerplatzCode || null,
                kommentar: a.kommentar,
                bestaetigtDurch: a.bestaetigtDurch?.name || null,
            };
        }),
    };
}

/**
 * Audit Trail Actions
 * -------------------
 * Server Actions zum Laden des Audit Trails.
 */

"use server";

import { prisma } from "@/lib/prisma";

// Typ für einen Audit-Eintrag
export type AuditEntry = {
    id: string;
    zeitpunkt: Date;
    benutzer: string;
    aktion: string;
    entitaet: string;
    referenzId: string | null;
    details: string | null;
};

// Aktion-Labels für die Anzeige (nicht exportiert, wird in der Page verwendet)
function getAktionLabel(aktion: string): string {
    switch (aktion) {
        case "inventar_erstellt": return "Inventar erstellt";
        case "inventar_abgeschlossen": return "Inventar abgeschlossen";
        case "excel_upload": return "Excel hochgeladen";
        case "barcode_gescannt": return "Barcode gescannt";
        case "abweichung_erstellt": return "Abweichung erfasst";
        case "abweichung_bestaetigt": return "Abweichung bestätigt";
        case "lagerplatz_ueberprueft": return "Lagerplatz überprüft";
        case "lagerplatz_wiedereroeffnet": return "Lagerplatz wiedereröffnet";
        default: return aktion;
    }
}

// Entitäts-Labels für die Anzeige (nicht exportiert)
function getEntitaetLabel(entitaet: string): string {
    switch (entitaet) {
        case "inventar": return "Inventar";
        case "ware_ist": return "IST-Ware";
        case "abweichung": return "Abweichung";
        case "lagerplatz": return "Lagerplatz";
        default: return entitaet;
    }
}

// Audit Trail laden
export async function getAuditTrail(
    inventarId?: string,
    limit: number = 100
): Promise<AuditEntry[]> {
    const entries = await prisma.auditTrail.findMany({
        where: inventarId ? { inventarId } : undefined,
        include: {
            user: { select: { name: true } },
        },
        orderBy: { timestamp: "desc" },
        take: limit,
    });

    return entries.map(e => ({
        id: e.id,
        zeitpunkt: e.timestamp,
        benutzer: e.user.name,
        aktion: e.aktion,
        entitaet: e.entitaet,
        referenzId: e.referenzId,
        details: e.details,
    }));
}

// Aktive Inventare für Filter laden
export async function getInventareForFilter(): Promise<{ id: string; label: string }[]> {
    const inventare = await prisma.inventar.findMany({
        orderBy: { erstelltAm: "desc" },
        select: {
            id: true,
            erstelltAm: true,
            abgeschlossen: true,
        },
    });

    return inventare.map(inv => ({
        id: inv.id,
        label: `${new Date(inv.erstelltAm).toLocaleDateString("de-CH")} ${inv.abgeschlossen ? "(abgeschlossen)" : "(offen)"}`,
    }));
}

/**
 * Excel Upload Actions
 * --------------------
 * Server Actions für den Upload und das Parsen von Excel-Dateien.
 * Die Excel-Datei enthält die SOLL-Daten aus dem LIMS.
 */

"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import { WareTyp } from "@prisma/client";

// Typ für eine Zeile aus der Excel-Datei
type ExcelRow = {
    primarschluessel: string;
    lagerplatzCode: string;
    typ: WareTyp;
    raum?: string;
    bezeichnung?: string;
    temperatur?: string;
    expDatum?: Date;
};

// Typ für das Ergebnis des Uploads
export type UploadResult = {
    success: boolean;
    imported?: number;
    skipped?: number;
    errors?: string[];
    error?: string;
};

// Erkennt den Warentyp anhand des Primärschlüssels
function detectWareTyp(primarschluessel: string): WareTyp {
    // M-XXXXXX = Muster, S-XXXX-XXX = Substanz
    if (primarschluessel.startsWith("M-")) {
        return WareTyp.muster;
    } else if (primarschluessel.startsWith("S-")) {
        return WareTyp.substanz;
    }
    // Fallback: Muster
    return WareTyp.muster;
}

// Parst ein Datum aus verschiedenen Formaten
function parseDate(value: unknown): Date | undefined {
    if (!value) return undefined;

    // Excel-Seriennummer (Tage seit 1900)
    if (typeof value === "number") {
        const date = XLSX.SSF.parse_date_code(value);
        if (date) {
            return new Date(date.y, date.m - 1, date.d);
        }
    }

    // String-Datum
    if (typeof value === "string") {
        const parsed = new Date(value);
        if (!isNaN(parsed.getTime())) {
            return parsed;
        }
    }

    return undefined;
}

// Excel-Datei parsen und SOLL-Waren importieren
export async function uploadExcel(
    inventarId: string,
    formData: FormData
): Promise<UploadResult> {
    try {
        // Inventar prüfen
        const inventar = await prisma.inventar.findUnique({
            where: { id: inventarId },
        });

        if (!inventar) {
            return { success: false, error: "Inventar nicht gefunden" };
        }

        if (inventar.abgeschlossen) {
            return { success: false, error: "Inventar ist bereits abgeschlossen" };
        }

        // Datei aus FormData holen
        const file = formData.get("file") as File;
        if (!file) {
            return { success: false, error: "Keine Datei hochgeladen" };
        }

        // Datei als Buffer lesen
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });

        // Erstes Worksheet verwenden
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Als JSON konvertieren (erste Zeile = Header)
        const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

        if (rawData.length === 0) {
            return { success: false, error: "Die Excel-Datei enthält keine Daten" };
        }

        // Daten verarbeiten
        const rows: ExcelRow[] = [];
        const errors: string[] = [];

        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            const lineNum = i + 2; // +2 wegen Header und 0-Index

            // Pflichtfelder prüfen (flexible Spaltennamen - case-insensitive)
            const keys = Object.keys(row);

            // Primärschlüssel finden (inkl. "Muster Nr. LIMS")
            const primarschluesselKey = keys.find(k =>
                k.toLowerCase().includes("primär") ||
                k.toLowerCase().includes("primar") ||
                k.toLowerCase().includes("schlüssel") ||
                k.toLowerCase().includes("schluessel") ||
                k.toLowerCase().includes("muster nr") ||
                k.toLowerCase().includes("muster-nr") ||
                k.toLowerCase().includes("musternr") ||
                k.toLowerCase() === "barcode" ||
                k.toLowerCase() === "id"
            );
            const primarschluessel = primarschluesselKey ? row[primarschluesselKey] : undefined;

            // Lagerplatz finden
            const lagerplatzKey = keys.find(k =>
                k.toLowerCase().includes("lagerplatz") ||
                k.toLowerCase().includes("standort") ||
                k.toLowerCase().includes("location")
            );
            const lagerplatzCode = lagerplatzKey ? row[lagerplatzKey] : undefined;

            // Raum finden (inkl. "Räume - Raum Nr.")
            const raumKey = keys.find(k =>
                k.toLowerCase().includes("raum") ||
                k.toLowerCase().includes("räume")
            );

            // Bezeichnung finden (inkl. "Musterbezeichnung")
            const bezeichnungKey = keys.find(k =>
                k.toLowerCase().includes("bezeichnung") ||
                k.toLowerCase().includes("beschreibung") ||
                k.toLowerCase().includes("name")
            );

            // Temperatur finden (inkl. "Temperaturanforderung")
            const temperaturKey = keys.find(k =>
                k.toLowerCase().includes("temperatur")
            );

            if (!primarschluessel) {
                errors.push(`Zeile ${lineNum}: Primärschlüssel fehlt`);
                continue;
            }

            if (!lagerplatzCode) {
                errors.push(`Zeile ${lineNum}: Lagerplatz fehlt`);
                continue;
            }

            rows.push({
                primarschluessel: String(primarschluessel).trim(),
                lagerplatzCode: String(lagerplatzCode).trim(),
                typ: detectWareTyp(String(primarschluessel)),
                raum: raumKey && row[raumKey] ? String(row[raumKey]).trim() : undefined,
                bezeichnung: bezeichnungKey && row[bezeichnungKey] ? String(row[bezeichnungKey]).trim() : undefined,
                temperatur: temperaturKey && row[temperaturKey] ? String(row[temperaturKey]).trim() : undefined,
                expDatum: undefined, // Ablaufdatum nicht benötigt
            });
        }

        if (rows.length === 0) {
            return {
                success: false,
                error: "Keine gültigen Zeilen gefunden",
                errors
            };
        }

        // Bestehende SOLL-Waren löschen (falls erneuter Upload)
        await prisma.wareSoll.deleteMany({
            where: { inventarId },
        });

        // Neue SOLL-Waren einfügen
        await prisma.wareSoll.createMany({
            data: rows.map((row) => ({
                inventarId,
                primarschluessel: row.primarschluessel,
                lagerplatzCode: row.lagerplatzCode,
                typ: row.typ,
                raum: row.raum,
                bezeichnung: row.bezeichnung,
                temperatur: row.temperatur,
                expDatum: row.expDatum,
            })),
        });

        // Cache invalidieren
        revalidatePath("/");
        revalidatePath(`/inventar/${inventarId}`);

        return {
            success: true,
            imported: rows.length,
            skipped: errors.length,
            errors: errors.length > 0 ? errors : undefined,
        };
    } catch (error) {
        console.error("Fehler beim Excel-Upload:", error);
        return {
            success: false,
            error: "Ein unerwarteter Fehler ist aufgetreten"
        };
    }
}

// Inventar-Infos für die Upload-Seite laden
export async function getInventarInfo(inventarId: string) {
    const inventar = await prisma.inventar.findUnique({
        where: { id: inventarId },
        include: {
            erstelltVon: { select: { name: true } },
            _count: { select: { sollWaren: true } },
        },
    });

    if (!inventar) return null;

    return {
        id: inventar.id,
        erstelltAm: inventar.erstelltAm,
        erstelltVon: inventar.erstelltVon.name,
        sollWarenCount: inventar._count.sollWaren,
        abgeschlossen: inventar.abgeschlossen,
    };
}

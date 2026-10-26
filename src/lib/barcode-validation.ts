/**
 * Prueft das Barcode-Format fuer Muster und Substanzen.
 * Kleinbuchstaben duerfen erst nach ausdruecklicher Bestaetigung korrigiert werden.
 */

import type { InventarTyp } from "@prisma/client";
import { z } from "zod";

const musterBarcodeSchema = z.string().regex(/^M-\d{6}$/);
const substanzBarcodeSchema = z.string().regex(/^S-\d{4}(-\d{3})?$/);

export function isValidBarcode(barcode: string, inventarTyp: InventarTyp): boolean {
    return (inventarTyp === "SUBSTANZEN" ? substanzBarcodeSchema : musterBarcodeSchema)
        .safeParse(barcode).success;
}

export function getUppercaseBarcodeSuggestion(barcode: string, inventarTyp: InventarTyp): string | null {
    const lowercasePrefix = inventarTyp === "SUBSTANZEN" ? "s" : "m";
    if (!barcode.startsWith(`${lowercasePrefix}-`)) return null;

    const suggestion = `${lowercasePrefix.toUpperCase()}${barcode.slice(1)}`;
    return isValidBarcode(suggestion, inventarTyp) ? suggestion : null;
}

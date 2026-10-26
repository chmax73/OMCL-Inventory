/**
 * Prueft Barcode-Formate und Vorschlaege fuer falsch geschriebene Praefixe.
 * Es werden keine Inventurdaten geschrieben.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { getUppercaseBarcodeSuggestion, isValidBarcode } from "./barcode-validation";

test("nur Barcodes mit passendem Grossbuchstaben sind gueltig", () => {
    assert.equal(isValidBarcode("S-2290-006", "SUBSTANZEN"), true);
    assert.equal(isValidBarcode("S-2290", "SUBSTANZEN"), true);
    assert.equal(isValidBarcode("M-022280", "MUSTER"), true);
    assert.equal(isValidBarcode("s-2290-006", "SUBSTANZEN"), false);
    assert.equal(isValidBarcode("m-022280", "MUSTER"), false);
    assert.equal(isValidBarcode("M-022280", "SUBSTANZEN"), false);
    assert.equal(isValidBarcode("S-2290-006", "MUSTER"), false);
});

test("nur ein gueltiger Barcode mit kleinem Praefix erhaelt einen Vorschlag", () => {
    assert.equal(getUppercaseBarcodeSuggestion("s-2290-006", "SUBSTANZEN"), "S-2290-006");
    assert.equal(getUppercaseBarcodeSuggestion("m-022280", "MUSTER"), "M-022280");
    assert.equal(getUppercaseBarcodeSuggestion("s-2290-006", "MUSTER"), null);
    assert.equal(getUppercaseBarcodeSuggestion("s-abc", "SUBSTANZEN"), null);
    assert.equal(getUppercaseBarcodeSuggestion("S-2290-006", "SUBSTANZEN"), null);
});

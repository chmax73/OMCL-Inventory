/**
 * Prueft, dass der Import nur fuer offene, nicht archivierte Inventare gilt.
 * Es werden keine echten Excel-Dateien oder Datenbankdaten veraendert.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { canImportIntoInventory } from "./import-permission";

test("SOLL-Import verlangt ein offenes Inventar", () => {
    assert.equal(canImportIntoInventory({ abgeschlossen: false, archiviert: false }), true);
    assert.equal(canImportIntoInventory({ abgeschlossen: true, archiviert: false }), false);
    assert.equal(canImportIntoInventory({ abgeschlossen: false, archiviert: true }), false);
    assert.equal(canImportIntoInventory(null), false);
});

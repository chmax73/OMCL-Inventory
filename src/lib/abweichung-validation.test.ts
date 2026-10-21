/**
 * Prueft, dass ungueltige IDs und zu lange Kommentare keine Bestaetigung ausloesen.
 * Die Tests aendern keine Datenbankdaten.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { confirmAbweichungSchema } from "./abweichung-validation";

test("Bestaetigung braucht eine gueltige Abweichungs-ID", () => {
    const abweichungId = "c183f480-978f-42e5-9b0e-472f8e16df08";
    assert.equal(confirmAbweichungSchema.safeParse({ abweichungId, kommentar: null }).success, true);
    assert.equal(confirmAbweichungSchema.safeParse({ abweichungId: "unbekannt", kommentar: null }).success, false);
});

test("Kommentar wird gekuerzt und ist auf 1000 Zeichen begrenzt", () => {
    const abweichungId = "c183f480-978f-42e5-9b0e-472f8e16df08";
    assert.equal(confirmAbweichungSchema.parse({ abweichungId, kommentar: "  Geprueft  " }).kommentar, "Geprueft");
    assert.equal(confirmAbweichungSchema.safeParse({ abweichungId, kommentar: "x".repeat(1001) }).success, false);
});

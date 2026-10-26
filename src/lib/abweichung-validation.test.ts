/**
 * Prueft, dass ungueltige IDs und zu lange Kommentare keine Bestaetigung ausloesen.
 * Die Tests aendern keine Datenbankdaten.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { canChangeAbweichungStatus, confirmAbweichungSchema, discardAbweichungSchema, reopenAbweichungSchema } from "./abweichung-validation";

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

test("Verwerfen braucht einen Grund, Wiedereroeffnen eine gueltige ID", () => {
    const abweichungId = "c183f480-978f-42e5-9b0e-472f8e16df08";
    assert.equal(discardAbweichungSchema.safeParse({ abweichungId, kommentar: "  Tippfehler  " }).success, true);
    assert.equal(discardAbweichungSchema.safeParse({ abweichungId, kommentar: "  " }).success, false);
    assert.equal(reopenAbweichungSchema.safeParse({ abweichungId }).success, true);
    assert.equal(reopenAbweichungSchema.safeParse({ abweichungId: "ungueltig" }).success, false);
});

test("nur offene Abweichungen lassen sich entscheiden; Entscheidungen lassen sich wiedereroeffnen", () => {
    assert.equal(canChangeAbweichungStatus("offen", "bestaetigt"), true);
    assert.equal(canChangeAbweichungStatus("offen", "verworfen"), true);
    assert.equal(canChangeAbweichungStatus("bestaetigt", "offen"), true);
    assert.equal(canChangeAbweichungStatus("verworfen", "offen"), true);
    assert.equal(canChangeAbweichungStatus("bestaetigt", "verworfen"), false);
    assert.equal(canChangeAbweichungStatus("verworfen", "bestaetigt"), false);
    assert.equal(canChangeAbweichungStatus("offen", "offen"), false);
});

/**
 * Prueft den Gesamtzaehler der Lagerplatz-Uebersicht ohne Inventurdaten zu aendern.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { getScannedCountFromLagerplaetze } from "./scan-overview-progress";

test("ein weiterer Scan erscheint im Gesamtzaehler ohne Inventar-Neuladen", () => {
    const lagerplaetze = [{ istCount: 8 }, { istCount: 6 }];
    assert.equal(getScannedCountFromLagerplaetze(lagerplaetze), 14);
    assert.equal(getScannedCountFromLagerplaetze([{ istCount: 8 }, { istCount: 7 }]), 15);
    assert.equal(getScannedCountFromLagerplaetze([]), 0);
});

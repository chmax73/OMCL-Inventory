/**
 * Prueft die gemeinsamen Filter am Beispiel von drei aktiven und einer eliminierten Ware.
 * Es werden dabei keine Datenbankdaten veraendert.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { BearbStatus, ScanTyp } from "@prisma/client";
import { OK_SCAN_WHERE, SCANNABLE_SOLL_WHERE } from "./inventory-progress";

test("eliminierte Ware erhoeht den benoetigten Scan-Zaehler nicht", () => {
    const soll = [
        BearbStatus.erfasst,
        BearbStatus.erfasst,
        BearbStatus.freigabe,
        BearbStatus.vernichtet,
    ];
    assert.equal(soll.filter((status) => status !== SCANNABLE_SOLL_WHERE.bearbStatus.not).length, 3);
    assert.equal(OK_SCAN_WHERE.scanTyp, ScanTyp.ok);
});

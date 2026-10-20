/**
 * Testet, dass gesperrte Konten auch mit bestehender Session abgewiesen werden.
 * Vergangene Sperren lassen den Zugriff wieder zu.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { isAccountDeactivated } from "./account-status";

test("nur aktive oder abgelaufene Sperren erlauben wieder Zugang", () => {
    const now = Date.parse("2026-10-20T12:00:00.000Z");
    assert.equal(isAccountDeactivated(null, now), false);
    assert.equal(isAccountDeactivated("2026-10-21T12:00:00.000Z", now), true);
    assert.equal(isAccountDeactivated("2026-10-19T12:00:00.000Z", now), false);
    assert.equal(isAccountDeactivated("kaputtes Datum", now), true);
});

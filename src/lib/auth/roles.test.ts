/**
 * Prueft, dass nur die echte Admin-Rolle Admin-Rechte erhaelt.
 * Insbesondere die alte Rolle "verantwortlich" bleibt ausgeschlossen.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { isAdminRole } from "./roles";

test("nur Admins erhalten Zugriff auf die Benutzerverwaltung", () => {
    assert.equal(isAdminRole("admin"), true);
    assert.equal(isAdminRole("user"), false);
    assert.equal(isAdminRole("verantwortlich"), false);
    assert.equal(isAdminRole(null), false);
});

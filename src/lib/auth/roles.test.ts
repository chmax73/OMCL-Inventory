/**
 * Prueft, dass nur die echte Admin-Rolle Admin-Rechte erhaelt.
 * Insbesondere die alte Rolle "verantwortlich" bleibt ausgeschlossen.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { canUseInventory, isAdminRole } from "./roles";

test("nur Admins erhalten Zugriff auf die Benutzerverwaltung", () => {
    assert.equal(isAdminRole("admin"), true);
    assert.equal(isAdminRole("user"), false);
    assert.equal(isAdminRole("verantwortlich"), false);
    assert.equal(isAdminRole(null), false);
});

test("Inventur-Aktionen verlangen einen verknuepften Benutzer ohne Passwortpflicht", () => {
    assert.equal(canUseInventory(null), false);
    assert.equal(canUseInventory({ appUser: null, mustChangePassword: false }), false);
    assert.equal(canUseInventory({ appUser: { id: "auth-user" }, mustChangePassword: true }), false);
    assert.equal(canUseInventory({ appUser: { id: "auth-user" }, mustChangePassword: false }), true);
});

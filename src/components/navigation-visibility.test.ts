/**
 * Prueft die Sichtbarkeit von Admin-Menuepunkten.
 * Auch normale Benutzer behalten ihre allgemeinen Navigationslinks.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { canSeeNavigationLink } from "./navigation-visibility";

test("Benutzerverwaltung ist nur im Admin-Menue sichtbar", () => {
    assert.equal(canSeeNavigationLink("/auth/users", "admin"), true);
    assert.equal(canSeeNavigationLink("/auth/users", "user"), false);
    assert.equal(canSeeNavigationLink("/auth/users", null), false);
    assert.equal(canSeeNavigationLink("/", "user"), true);
});

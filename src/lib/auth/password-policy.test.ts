/**
 * Prueft die Kennzeichnung fuer den obligatorischen Passwortwechsel.
 * Nur der explizite Wert true darf einen Wechsel erzwingen.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { requiresPasswordChange } from "./password-policy";

test("nur die geschuetzte Kennzeichnung erzwingt einen Passwortwechsel", () => {
    assert.equal(requiresPasswordChange({ must_change_password: true }), true);
    assert.equal(requiresPasswordChange({ must_change_password: false }), false);
    assert.equal(requiresPasswordChange({ must_change_password: "true" }), false);
    assert.equal(requiresPasswordChange({}), false);
    assert.equal(requiresPasswordChange(null), false);
});

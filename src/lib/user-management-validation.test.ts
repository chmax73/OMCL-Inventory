/**
 * Kleine Tests fuer Eingabefehler bei Benutzeranlage und Passwortwechsel.
 * Sie laufen lokal und veraendern keine Benutzer in der Datenbank.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { changePasswordSchema, createUserSchema, loginSchema, resetPasswordSchema, updateAccountStatusSchema } from "./user-management-validation";

test("Benutzeranlage akzeptiert E-Mail und die beiden vorgesehenen Rollen", () => {
    assert.deepEqual(createUserSchema.parse({ email: "  TEST@EXAMPLE.CH  ", rolle: "admin" }), {
        email: "test@example.ch",
        rolle: "admin",
    });
    assert.equal(createUserSchema.safeParse({ email: "keine-email", rolle: "user" }).success, false);
    assert.equal(createUserSchema.safeParse({ email: "test@example.ch", rolle: "verantwortlich" }).success, false);
});

test("Login benoetigt E-Mail und Passwort", () => {
    assert.equal(loginSchema.safeParse({ email: "test@example.ch", password: "inventurliste" }).success, true);
    assert.equal(loginSchema.safeParse({ email: "test@example.ch", password: "" }).success, false);
});

test("Passwort-Reset akzeptiert nur eine gueltige Benutzer-ID", () => {
    assert.equal(resetPasswordSchema.safeParse({ userId: "5c992010-3194-4c90-841f-87c850358a26" }).success, true);
    assert.equal(resetPasswordSchema.safeParse({ userId: "unbekannt" }).success, false);
});

test("Konto-Status erlaubt nur eine gueltige ID und einen booleschen Wert", () => {
    const userId = "5c992010-3194-4c90-841f-87c850358a26";
    assert.equal(updateAccountStatusSchema.safeParse({ userId, active: false }).success, true);
    assert.equal(updateAccountStatusSchema.safeParse({ userId, active: "false" }).success, false);
    assert.equal(updateAccountStatusSchema.safeParse({ userId: "ungueltig", active: true }).success, false);
});

test("Neues Passwort muss wiederholt werden und darf nicht das Startpasswort sein", () => {
    assert.equal(changePasswordSchema.safeParse({
        newPassword: "NeuesPasswort123",
        confirmPassword: "NeuesPasswort123",
    }).success, true);
    assert.equal(changePasswordSchema.safeParse({
        newPassword: "NeuesPasswort123",
        confirmPassword: "AnderesPasswort123",
    }).success, false);
    assert.equal(changePasswordSchema.safeParse({
        newPassword: "inventurliste",
        confirmPassword: "inventurliste",
    }).success, false);
});

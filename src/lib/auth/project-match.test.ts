/**
 * Testet die Schutzpruefung vor einem Admin-Konto im falschen Projekt.
 * Die Beispiel-URLs enthalten keine echten Zugangsdaten.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { isSameSupabaseProject } from "./project-match";

test("Auth und Datenbank muessen zum selben Supabase-Projekt gehoeren", () => {
    const databaseUrl = "postgresql://postgres.projekta:test@pooler.supabase.com/postgres";
    assert.equal(isSameSupabaseProject("https://projekta.supabase.co", databaseUrl), true);
    assert.equal(isSameSupabaseProject("https://projektb.supabase.co", databaseUrl), false);
    assert.equal(isSameSupabaseProject("ungueltig", databaseUrl), false);
    assert.equal(isSameSupabaseProject("https://projekta.supabase.co", "ungueltig"), false);
});

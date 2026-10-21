/**
 * Prueft SSL-Konfiguration und lesbare Fehlermeldungen ohne echte Zugangsdaten.
 * Der Test verbindet sich nicht mit der Datenbank.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { getPostgresPoolConfig } from "./postgres-pool";

const exampleUrl = "postgresql://postgres.example:dummy@db.example.org:5432/postgres?sslmode=require";

test("Postgres-SSL bleibt ohne CA auf die Datenbankverbindung beschraenkt", () => {
    const previousTlsSetting = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    const config = getPostgresPoolConfig(exampleUrl);
    assert.equal(new URL(config.connectionString!).searchParams.has("sslmode"), false);
    assert.deepEqual(config.ssl, { rejectUnauthorized: false });
    assert.equal(process.env.NODE_TLS_REJECT_UNAUTHORIZED, previousTlsSetting);
});

test("Supabase-CA aktiviert Zertifikatspruefung", () => {
    const config = getPostgresPoolConfig(exampleUrl, "BEGIN\\nCERT");
    assert.deepEqual(config.ssl, { ca: "BEGIN\nCERT", rejectUnauthorized: true });
});

test("fehlende oder unpassende URL wird abgewiesen", () => {
    assert.throws(() => getPostgresPoolConfig(undefined), /DATABASE_URL fehlt/);
    assert.throws(() => getPostgresPoolConfig("https://example.com"), /PostgreSQL-Adresse/);
});

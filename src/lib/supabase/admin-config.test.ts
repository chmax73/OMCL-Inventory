/**
 * Prueft die Admin-Konfiguration ohne geheime Werte auszugeben.
 * Ein fehlender Schluessel soll eine klare Meldung liefern.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { getSupabaseAdminConfig } from "./admin-config";

test("Admin-Funktionen benoetigen einen separaten Server-Schluessel", () => {
    const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    try {
        process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
        delete process.env.SUPABASE_SERVICE_ROLE_KEY;
        assert.throws(getSupabaseAdminConfig, /SUPABASE_SERVICE_ROLE_KEY/);

        process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
        assert.deepEqual(getSupabaseAdminConfig(), {
            url: "https://example.supabase.co",
            serviceRoleKey: "test-key",
        });
    } finally {
        if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
        else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
        if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
        else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
    }
});

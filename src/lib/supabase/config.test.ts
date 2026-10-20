/**
 * Prueft die Konfiguration ohne Verbindung zum Supabase-Projekt.
 * Fehler sollen fehlende Einstellungen klar benennen.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { getSupabaseAuthConfig } from "./config";

test("Supabase Auth benoetigt beide oeffentlichen Einstellungen", () => {
    const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const previousKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    try {
        delete process.env.NEXT_PUBLIC_SUPABASE_URL;
        delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
        assert.throws(getSupabaseAuthConfig, /NEXT_PUBLIC_SUPABASE_URL/);

        process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-key";
        assert.deepEqual(getSupabaseAuthConfig(), {
            url: "https://example.supabase.co",
            publishableKey: "test-key",
        });
    } finally {
        if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
        else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
        if (previousKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
        else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = previousKey;
    }
});

/**
 * Erstellt die Supabase-Verbindung fuer interaktive Seiten im Browser.
 * Nur der oeffentliche Schluessel darf an den Browser weitergegeben werden.
 */

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseAuthConfig } from "./config";

export function createSupabaseBrowserClient() {
    const { url, publishableKey } = getSupabaseAuthConfig();
    return createBrowserClient(url, publishableKey);
}

/**
 * Stellt Supabase-Admin-Funktionen ausschliesslich fuer Servercode bereit.
 * Vor jedem Aufruf muss die Server Action selbst die Admin-Rolle pruefen.
 */

import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminConfig } from "./admin-config";

export function createSupabaseAdminClient() {
    const { url, serviceRoleKey } = getSupabaseAdminConfig();

    return createClient(url, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

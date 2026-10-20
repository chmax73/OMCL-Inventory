/**
 * Erstellt pro Anfrage eine Supabase-Verbindung fuer Server Actions und Seiten.
 * Cookies halten den Login auf dem Server und im Browser synchron.
 */

import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAuthConfig } from "./config";

export async function createSupabaseServerClient() {
    const { url, publishableKey } = getSupabaseAuthConfig();
    const cookieStore = await cookies();

    return createServerClient(url, publishableKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options);
                    });
                } catch {
                    // Server Components koennen Cookies nicht schreiben.
                    // Der Proxy erneuert die Session und setzt Cookies pro Anfrage.
                }
            },
        },
    });
}

/**
 * Erneuert Supabase-Logins bei Seitenaufrufen, bevor Server Components starten.
 * Dieser Proxy prueft noch keine Berechtigungen und sperrt noch keine Seiten.
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAuthConfig } from "./lib/supabase/config";

export async function proxy(request: NextRequest) {
    const { url, publishableKey } = getSupabaseAuthConfig();
    let response = NextResponse.next({ request });

    const supabase = createServerClient(url, publishableKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet, headers) {
                cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                response = NextResponse.next({ request });
                cookiesToSet.forEach(({ name, value, options }) => {
                    response.cookies.set(name, value, options);
                });
                Object.entries(headers).forEach(([name, value]) => {
                    response.headers.set(name, value);
                });
            },
        },
    });

    await supabase.auth.getClaims();
    return response;
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

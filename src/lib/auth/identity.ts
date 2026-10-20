/**
 * Verknuepft ein bestaetigtes Supabase-Konto mit einem Inventur-Benutzer.
 * Die Supabase-ID muss der ID in der bestehenden User-Tabelle entsprechen.
 */

import "server-only";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAccountDeactivated } from "./account-status";
import { requiresPasswordChange } from "./password-policy";
import { isAdminRole } from "./roles";

export async function getVerifiedIdentity() {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getClaims();

    if (error || !data?.claims?.sub) return null;

    // getUser liest den aktuellen Status auch nach einem Passwort-Reset neu.
    const { data: currentUser, error: userError } = await supabase.auth.getUser();
    if (userError || !currentUser.user || currentUser.user.id !== data.claims.sub) return null;
    if (isAccountDeactivated(currentUser.user.banned_until)) return null;

    const mustChangePassword = requiresPasswordChange(currentUser.user.app_metadata);
    const appUser = mustChangePassword ? null : await prisma.user.findUnique({
        where: { id: currentUser.user.id },
        select: { id: true, name: true, rolle: true },
    });

    return {
        email: currentUser.user.email ?? null,
        mustChangePassword,
        appUser,
    };
}

export async function requireAdminUser() {
    const identity = await getVerifiedIdentity();
    const appUser = identity?.appUser;

    if (!appUser || identity.mustChangePassword || !isAdminRole(appUser.rolle)) {
        throw new Error("Diese Funktion ist nur fuer angemeldete Admins verfuegbar.");
    }

    return appUser;
}

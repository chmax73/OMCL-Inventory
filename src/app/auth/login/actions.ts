/**
 * Meldet Benutzer bei Supabase Auth an und ab.
 * Passwoerter werden nur an Supabase gesendet, nie in unserer Datenbank gespeichert.
 */

"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/user-management-validation";

export async function signInWithEmail(input: unknown) {
    const result = loginSchema.safeParse(input);
    if (!result.success) {
        return { success: false, error: "Bitte E-Mail-Adresse und Passwort kontrollieren." };
    }

    try {
        const supabase = await createSupabaseServerClient();
        const { error } = await supabase.auth.signInWithPassword(result.data);
        if (error) {
            return {
                success: false,
                error: error.code === "user_banned"
                    ? "Dieses Konto wurde deaktiviert. Bitte einen Admin kontaktieren."
                    : "E-Mail-Adresse oder Passwort ist falsch.",
            };
        }
        return { success: true };
    } catch (error) {
        console.error("Supabase-Anmeldung fehlgeschlagen:", error);
        return { success: false, error: "Anmeldung derzeit nicht erreichbar. Bitte spaeter nochmals versuchen." };
    }
}

export async function signOutFromAuth() {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signOut();
    return error
        ? { success: false, error: "Abmelden fehlgeschlagen. Bitte nochmals versuchen." }
        : { success: true };
}

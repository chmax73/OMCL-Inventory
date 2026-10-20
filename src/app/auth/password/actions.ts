/**
 * Setzt nach dem ersten Login ein neues Passwort.
 * Erst nach erfolgreichem Wechsel wird die Pflicht in Supabase aufgehoben.
 */

"use server";

import { requiresPasswordChange } from "@/lib/auth/password-policy";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { changePasswordSchema } from "@/lib/user-management-validation";

export async function completeFirstPasswordChange(input: unknown) {
    const result = changePasswordSchema.safeParse(input);
    if (!result.success) {
        return { success: false, error: "Bitte neues Passwort und Wiederholung kontrollieren." };
    }

    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user || !requiresPasswordChange(user.app_metadata)) {
            return { success: false, error: "Bitte zuerst mit dem Startpasswort anmelden." };
        }

        const admin = createSupabaseAdminClient();
        const { error: passwordError } = await supabase.auth.updateUser({
            password: result.data.newPassword,
        });
        if (passwordError) {
            return { success: false, error: "Passwort konnte nicht geaendert werden. Bitte ein anderes waehlen." };
        }

        const { error: statusError } = await admin.auth.admin.updateUserById(user.id, {
            app_metadata: { ...user.app_metadata, must_change_password: false },
        });
        if (statusError) {
            console.error("Passwortwechsel-Status konnte nicht gespeichert werden:", statusError);
            return {
                success: false,
                error: "Passwort geaendert, aber die Freigabe ist fehlgeschlagen. Bitte einen Admin kontaktieren.",
            };
        }

        return { success: true };
    } catch (error) {
        console.error("Passwortwechsel fehlgeschlagen:", error);
        return { success: false, error: "Passwortwechsel derzeit nicht erreichbar. Bitte spaeter nochmals versuchen." };
    }
}

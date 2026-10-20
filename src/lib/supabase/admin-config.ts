/**
 * Prueft den geheimen Supabase-Schluessel fuer die Benutzerverwaltung.
 * Er darf nur auf dem Server gespeichert werden und nie NEXT_PUBLIC_ heissen.
 */

export function getSupabaseAdminConfig() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
        throw new Error(
            "Benutzerverwaltung ist nicht eingerichtet. Bitte NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY auf dem Server setzen.",
        );
    }

    return { url, serviceRoleKey };
}

/**
 * Prueft, ob die oeffentlichen Supabase-Zugangsdaten vorhanden sind.
 * Das sind keine geheimen Schluessel; geheime Admin-Schluessel gehoeren nie hierher.
 */

export function getSupabaseAuthConfig() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!url || !publishableKey) {
        throw new Error(
            "Supabase Auth ist nicht eingerichtet. Bitte NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY setzen.",
        );
    }

    return { url, publishableKey };
}

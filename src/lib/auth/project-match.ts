/**
 * Verhindert, dass ein Admin-Konto im falschen Supabase-Projekt landet.
 * Es werden nur Projektkennungen verglichen, keine Zugangsdaten ausgegeben.
 */

export function isSameSupabaseProject(authUrl: string, databaseUrl: string): boolean {
    try {
        const authRef = new URL(authUrl).hostname.match(/^([a-z0-9]+)\.supabase\.co$/)?.[1];
        const database = new URL(databaseUrl);
        const databaseRef = database.username.match(/^postgres\.([a-z0-9]+)$/)?.[1]
            ?? database.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/)?.[1];

        return Boolean(authRef && databaseRef && authRef === databaseRef);
    } catch {
        return false;
    }
}

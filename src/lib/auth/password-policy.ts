/**
 * Erkennt, ob ein Benutzer noch das Startpasswort ersetzen muss.
 * Dieses Merkmal wird nur in geschuetzter Supabase app_metadata gespeichert.
 */

export function requiresPasswordChange(appMetadata: Record<string, unknown> | null | undefined): boolean {
    return appMetadata?.must_change_password === true;
}

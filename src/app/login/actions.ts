/**
 * Die fruehere Benutzerauswahl ist ausser Betrieb.
 * Echte Logins laufen ausschliesslich ueber Supabase Auth.
 */

"use server";

export async function getUsers(): Promise<never> {
    throw new Error("Die Dummy-Benutzerauswahl wurde deaktiviert. Bitte /auth/login verwenden.");
}

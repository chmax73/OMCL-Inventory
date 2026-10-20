/**
 * Erkennt, ob Supabase ein Konto gesperrt hat.
 * Ein unlesbares Sperrdatum wird vorsichtshalber wie eine Sperre behandelt.
 */

export function isAccountDeactivated(bannedUntil: string | null | undefined, now = Date.now()): boolean {
    if (!bannedUntil) return false;
    const until = Date.parse(bannedUntil);
    return !Number.isFinite(until) || until > now;
}

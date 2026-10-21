/**
 * Entscheidet, welche Navigationspunkte fuer eine Rolle sichtbar sind.
 * Versteckte Links ersetzen keine Berechtigungspruefung auf dem Server.
 */

const adminOnlyPaths = new Set(["/inventar/neu", "/audit", "/auth/users"]);

export function canSeeNavigationLink(href: string, role: string | null | undefined): boolean {
    return !adminOnlyPaths.has(href) || role === "admin";
}

/**
 * Entscheidet anhand der Datenbankrolle, wer Admin-Funktionen nutzen darf.
 * Ein blosses Login oder eine Angabe im Browser reicht dafuer nicht aus.
 */

import type { UserRole } from "@prisma/client";

export function isAdminRole(rolle: UserRole | null | undefined): boolean {
    return rolle === "admin";
}

export function canUseInventory(identity: { appUser: unknown | null; mustChangePassword: boolean } | null): boolean {
    return Boolean(identity?.appUser && !identity.mustChangePassword);
}

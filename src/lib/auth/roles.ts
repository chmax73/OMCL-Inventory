/**
 * Entscheidet anhand der Datenbankrolle, wer Admin-Funktionen nutzen darf.
 * Ein blosses Login oder eine Angabe im Browser reicht dafuer nicht aus.
 */

import type { UserRole } from "@prisma/client";

export function isAdminRole(rolle: UserRole | null | undefined): boolean {
    return rolle === "admin";
}

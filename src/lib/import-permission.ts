/**
 * Entscheidet, ob SOLL-Daten in ein Inventar importiert werden duerfen.
 * Abgeschlossene oder archivierte Inventare bleiben unveraendert.
 */

export function canImportIntoInventory(inventar: { abgeschlossen: boolean; archiviert: boolean } | null): boolean {
    return Boolean(inventar && !inventar.abgeschlossen && !inventar.archiviert);
}

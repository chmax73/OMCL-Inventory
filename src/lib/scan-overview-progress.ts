/**
 * Zaehlt die bereits gescannten Waren aus den angezeigten Lagerplaetzen.
 * So nutzen Gesamtanzeige und Lagerplatz-Karten dieselben aktuellen Daten.
 */

export function getScannedCountFromLagerplaetze(
    lagerplaetze: readonly { istCount: number }[]
): number {
    return lagerplaetze.reduce((total, lagerplatz) => total + lagerplatz.istCount, 0);
}

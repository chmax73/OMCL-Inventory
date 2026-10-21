/**
 * Gemeinsame Zaehlregeln fuer den Inventur-Fortschritt.
 * Vernichtete Muster und eliminierte Substanzen bleiben dokumentiert, brauchen aber keinen Scan.
 */

import { BearbStatus, ScanTyp } from "@prisma/client";

export const SCANNABLE_SOLL_WHERE = {
    bearbStatus: { not: BearbStatus.vernichtet },
} as const;

export const OK_SCAN_WHERE = {
    scanTyp: ScanTyp.ok,
} as const;

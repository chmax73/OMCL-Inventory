/**
 * Prueft die Daten fuer die Bestaetigung einer Inventur-Abweichung.
 * Der Server verwendet die gleichen Regeln unabhaengig vom Browser.
 */

import { z } from "zod";
import type { AbweichungStatus } from "@prisma/client";

export const confirmAbweichungSchema = z.object({
    abweichungId: z.uuid("Bitte eine gueltige Abweichung auswaehlen."),
    kommentar: z.string().trim().max(1000, "Der Kommentar darf hoechstens 1000 Zeichen haben.").nullable(),
});

export const discardAbweichungSchema = confirmAbweichungSchema.extend({
    kommentar: z.string().trim().min(1, "Bitte einen Grund fuer das Verwerfen angeben.")
        .max(1000, "Der Kommentar darf hoechstens 1000 Zeichen haben."),
});

export const reopenAbweichungSchema = confirmAbweichungSchema.pick({ abweichungId: true });

export function canChangeAbweichungStatus(von: AbweichungStatus, nach: AbweichungStatus): boolean {
    return von === "offen"
        ? nach === "bestaetigt" || nach === "verworfen"
        : nach === "offen";
}

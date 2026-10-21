/**
 * Prueft die Daten fuer die Bestaetigung einer Inventur-Abweichung.
 * Der Server verwendet die gleichen Regeln unabhaengig vom Browser.
 */

import { z } from "zod";

export const confirmAbweichungSchema = z.object({
    abweichungId: z.uuid("Bitte eine gueltige Abweichung auswaehlen."),
    kommentar: z.string().trim().max(1000, "Der Kommentar darf hoechstens 1000 Zeichen haben.").nullable(),
});

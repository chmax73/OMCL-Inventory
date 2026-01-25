/**
 * Inventar Actions
 * ----------------
 * Server Actions für das Erstellen und Verwalten von Inventaren.
 */

"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Typ für das Ergebnis der Inventar-Erstellung
export type CreateInventarResult = {
    success: boolean;
    inventarId?: string;
    error?: string;
};

// Neues Inventar erstellen
export async function createInventar(userId: string): Promise<CreateInventarResult> {
    try {
        // Prüfen ob User existiert
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return { success: false, error: "Benutzer nicht gefunden" };
        }

        // Prüfen ob bereits ein offenes Inventar existiert
        const openInventar = await prisma.inventar.findFirst({
            where: { abgeschlossen: false },
        });

        if (openInventar) {
            return {
                success: false,
                error: "Es existiert bereits ein offenes Inventar. Bitte schliesse dieses zuerst ab."
            };
        }

        // Neues Inventar erstellen
        const inventar = await prisma.inventar.create({
            data: {
                erstelltVonId: userId,
            },
        });

        // Audit-Log erstellen
        await prisma.auditTrail.create({
            data: {
                userId: userId,
                aktion: "inventar_erstellt",
                entitaet: "inventar",
                referenzId: inventar.id,
                inventarId: inventar.id,
                details: JSON.stringify({ erstelltVon: user.name }),
            },
        });

        // Cache invalidieren damit Dashboard aktualisiert wird
        revalidatePath("/");

        return { success: true, inventarId: inventar.id };
    } catch (error) {
        console.error("Fehler beim Erstellen des Inventars:", error);
        return { success: false, error: "Ein unerwarteter Fehler ist aufgetreten" };
    }
}

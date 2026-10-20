/**
 * Inventar Actions
 * ----------------
 * Server Actions für das Erstellen und Verwalten von Inventaren.
 */

"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/auth/identity";
import { revalidatePath } from "next/cache";
import { InventarTyp } from "@prisma/client";

// Typ für das Ergebnis der Inventar-Erstellung
export type CreateInventarResult = {
    success: boolean;
    inventarId?: string;
    error?: string;
};

// Neues Inventar erstellen (Muster oder Substanzen)
export async function createInventar(typ: InventarTyp = InventarTyp.MUSTER): Promise<CreateInventarResult> {
    let user;
    try {
        user = await requireAdminUser();
    } catch {
        return { success: false, error: "Nur angemeldete Admins koennen Inventare erstellen." };
    }

    if (typ !== InventarTyp.MUSTER && typ !== InventarTyp.SUBSTANZEN) {
        return { success: false, error: "Bitte einen gueltigen Inventartyp waehlen." };
    }

    try {
        // Prüfen ob bereits ein offenes Inventar dieses Typs existiert
        const openInventar = await prisma.inventar.findFirst({
            where: { abgeschlossen: false, archiviert: false, typ },
        });

        const typLabel = typ === InventarTyp.MUSTER ? "Muster" : "RM & Substanzen";
        if (openInventar) {
            return {
                success: false,
                error: `Es existiert bereits ein offenes ${typLabel}-Inventar. Bitte schliesse dieses zuerst ab.`
            };
        }

        // Inventar und Protokoll werden gemeinsam gespeichert oder gar nicht.
        const inventar = await prisma.$transaction(async (tx) => {
            const created = await tx.inventar.create({
                data: { erstelltVonId: user.id, typ },
            });
            await tx.auditTrail.create({
                data: {
                    userId: user.id,
                    aktion: "inventar_erstellt",
                    entitaet: "inventar",
                    referenzId: created.id,
                    inventarId: created.id,
                    details: JSON.stringify({ erstelltVon: user.name, typ }),
                },
            });
            return created;
        });

        // Cache invalidieren damit Dashboard aktualisiert wird
        revalidatePath("/");

        return { success: true, inventarId: inventar.id };
    } catch (error) {
        console.error("Fehler beim Erstellen des Inventars:", error instanceof Error ? error.name : "unbekannt");
        return { success: false, error: "Ein unerwarteter Fehler ist aufgetreten" };
    }
}

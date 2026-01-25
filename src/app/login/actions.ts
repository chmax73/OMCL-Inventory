/**
 * Login Actions
 * -------------
 * Server Actions für die Benutzerauswahl.
 * Lädt alle verfügbaren Benutzer aus der Datenbank.
 */

"use server";

import { prisma } from "@/lib/prisma";

// Typ für die Rückgabe (ohne sensible Daten)
export type UserOption = {
    id: string;
    name: string;
    rolle: "admin" | "verantwortlich" | "user";
};

// Alle Benutzer laden
export async function getUsers(): Promise<UserOption[]> {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            rolle: true,
        },
        orderBy: {
            name: "asc",
        },
    });

    return users;
}

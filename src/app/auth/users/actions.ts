/**
 * Legt Benutzer an, setzt Passwoerter zurueck und sperrt Login-Konten.
 * Die Admin-Berechtigung wird vor jedem Zugriff auf dem Server geprueft.
 */

"use server";

import { requireAdminUser } from "@/lib/auth/identity";
import { isAccountDeactivated } from "@/lib/auth/account-status";
import { requiresPasswordChange } from "@/lib/auth/password-policy";
import { prisma } from "@/lib/prisma";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createUserSchema, resetPasswordSchema, updateAccountStatusSchema } from "@/lib/user-management-validation";

export type ManagedUser = {
    id: string;
    email: string;
    rolle: string;
    mustChangePassword: boolean;
    active: boolean;
};

export async function createInventoryUser(input: unknown) {
    const parsed = createUserSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: "Bitte eine korrekte E-Mail-Adresse und Rolle angeben." };
    }

    try {
        await requireAdminUser();
    } catch {
        return { success: false, error: "Nur angemeldete Admins koennen Benutzer erstellen." };
    }

    const { email, rolle } = parsed.data;

    try {
        const existing = await prisma.user.findFirst({
            where: { name: email },
            select: { id: true },
        });
        if (existing) {
            return { success: false, error: "Fuer diese E-Mail existiert bereits ein Inventur-Konto." };
        }

        const admin = createSupabaseAdminClient();
        const { data, error } = await admin.auth.admin.createUser({
            email,
            password: "inventurliste",
            email_confirm: true,
            app_metadata: { must_change_password: true },
        });
        if (error) {
            console.error("Supabase-Benutzeranlage fehlgeschlagen:", error.code ?? "unbekannt", error.status);
            return {
                success: false,
                error: error.code === "email_exists"
                    ? "Diese E-Mail ist bereits registriert."
                    : "Supabase konnte den Benutzer nicht erstellen. Bitte Verbindung und Einstellungen pruefen.",
            };
        }
        if (!data.user) {
            return { success: false, error: "Supabase hat keinen neuen Benutzer zurueckgegeben." };
        }

        try {
            await prisma.user.create({
                data: { id: data.user.id, name: email, rolle },
            });
        } catch {
            // Nicht automatisch loeschen: das Auth-Konto existiert bereits.
            console.error("Inventur-Rolle fehlt fuer Supabase-Benutzer:", data.user.id);
            return {
                success: false,
                error: "Login erstellt, aber Inventur-Rolle fehlt. Bitte einen Admin kontaktieren und nicht erneut anlegen.",
            };
        }

        return { success: true, email };
    } catch (error) {
        console.error("Benutzeranlage: Betriebsfehler:", error instanceof Error ? error.name : "unbekannt");
        return { success: false, error: "Benutzerverwaltung ist derzeit nicht erreichbar. Bitte Verbindung pruefen." };
    }
}

export async function getManagedUsers(): Promise<{ users: ManagedUser[]; hasMore: boolean }> {
    await requireAdminUser();
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 100 });
    if (error) throw new Error("Benutzerliste konnte nicht geladen werden.");

    const inventoryUsers = await prisma.user.findMany({
        where: { id: { in: data.users.map((user) => user.id) } },
        select: { id: true, rolle: true },
    });
    const rolesById = new Map(inventoryUsers.map((user) => [user.id, user.rolle]));

    const users = data.users.flatMap((user) => {
        const rolle = rolesById.get(user.id);
        if (!rolle || !user.email) return [];
        return [{
            id: user.id,
            email: user.email,
            rolle,
            mustChangePassword: requiresPasswordChange(user.app_metadata),
            active: !isAccountDeactivated(user.banned_until),
        }];
    });
    users.sort((a, b) => a.email.localeCompare(b.email, "de"));

    return { users, hasMore: data.nextPage !== null };
}

export async function resetInventoryUserPassword(input: unknown) {
    const parsed = resetPasswordSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: "Bitte einen gueltigen Benutzer auswaehlen." };
    }

    try {
        await requireAdminUser();
    } catch {
        return { success: false, error: "Nur angemeldete Admins koennen Passwoerter zuruecksetzen." };
    }

    try {
        const inventoryUser = await prisma.user.findUnique({
            where: { id: parsed.data.userId },
            select: { id: true },
        });
        if (!inventoryUser) {
            return { success: false, error: "Benutzer wurde in der Inventur nicht gefunden." };
        }

        const admin = createSupabaseAdminClient();
        const { data, error: lookupError } = await admin.auth.admin.getUserById(inventoryUser.id);
        if (lookupError || !data.user) {
            return { success: false, error: "Dieser Benutzer hat noch keinen Supabase-Login." };
        }

        const { error: resetError } = await admin.auth.admin.updateUserById(inventoryUser.id, {
            password: "inventurliste",
            app_metadata: { ...data.user.app_metadata, must_change_password: true },
        });
        if (resetError) {
            console.error("Passwort-Reset fehlgeschlagen:", resetError.code ?? "unbekannt", resetError.status);
            return { success: false, error: "Passwort konnte nicht zurueckgesetzt werden. Bitte spaeter nochmals versuchen." };
        }

        return { success: true };
    } catch (error) {
        console.error("Passwort-Reset: Betriebsfehler:", error instanceof Error ? error.name : "unbekannt");
        return { success: false, error: "Benutzerverwaltung ist derzeit nicht erreichbar. Bitte Verbindung pruefen." };
    }
}

export async function updateInventoryUserStatus(input: unknown) {
    const parsed = updateAccountStatusSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: "Bitte einen gueltigen Benutzer und Status auswaehlen." };
    }

    let adminUser;
    try {
        adminUser = await requireAdminUser();
    } catch {
        return { success: false, error: "Nur angemeldete Admins koennen Konten sperren oder entsperren." };
    }

    const { userId, active } = parsed.data;
    if (!active && adminUser.id === userId) {
        return { success: false, error: "Das eigene Admin-Konto kann nicht deaktiviert werden." };
    }

    try {
        const inventoryUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });
        if (!inventoryUser) {
            return { success: false, error: "Benutzer wurde in der Inventur nicht gefunden." };
        }

        const admin = createSupabaseAdminClient();
        const { data, error: lookupError } = await admin.auth.admin.getUserById(userId);
        if (lookupError || !data.user) {
            return { success: false, error: "Dieser Benutzer hat noch keinen Supabase-Login." };
        }
        if (active === !isAccountDeactivated(data.user.banned_until)) {
            return { success: true };
        }

        const { error } = await admin.auth.admin.updateUserById(userId, {
            ban_duration: active ? "none" : "876000h",
        });
        if (error) {
            console.error("Kontostatus konnte nicht geaendert werden:", error.code ?? "unbekannt", error.status);
            return { success: false, error: "Kontostatus konnte nicht geaendert werden. Bitte spaeter nochmals versuchen." };
        }
        return { success: true };
    } catch (error) {
        console.error("Kontostatus: Betriebsfehler:", error instanceof Error ? error.name : "unbekannt");
        return { success: false, error: "Benutzerverwaltung ist derzeit nicht erreichbar. Bitte Verbindung pruefen." };
    }
}

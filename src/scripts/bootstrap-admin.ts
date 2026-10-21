/**
 * Bereitet das erste echte Admin-Konto vor, ohne vorhandene Testdaten zu loeschen.
 * Nur --apply erstellt ein Supabase-Auth-Konto und den passenden Prisma-Benutzer.
 */

import { createClient } from "@supabase/supabase-js";
import { prisma } from "../lib/prisma";
import { isSameSupabaseProject } from "../lib/auth/project-match";
import { createUserSchema } from "../lib/user-management-validation";

async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0 || args.includes("--help")) {
        console.log("Verwendung: npm run bootstrap-admin -- admin@example.ch [--apply]");
        console.log("Ohne --apply wird nur geprueft, kein Konto erstellt.");
        return;
    }

    const input = createUserSchema.safeParse({ email: args[0], rolle: "admin" });
    if (!input.success || args.some((arg, index) => index > 0 && arg !== "--apply")) {
        throw new Error("Bitte eine korrekte E-Mail-Adresse angeben; optional nur --apply verwenden.");
    }

    const authUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const databaseUrl = process.env.DATABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!authUrl || !databaseUrl || !serviceRoleKey) {
        throw new Error("Supabase-URL, DATABASE_URL oder SUPABASE_SERVICE_ROLE_KEY fehlt in .env.local.");
    }
    if (!isSameSupabaseProject(authUrl, databaseUrl)) {
        throw new Error("Auth und Datenbank zeigen nicht auf dasselbe Supabase-Projekt.");
    }

    // Ein Legacy-Key nennt im Token sein Projekt. So erkennen wir vertauschte Keys vor dem Schreiben.
    if (serviceRoleKey.split(".").length === 3) {
        let validKey = false;
        try {
            const payload = JSON.parse(Buffer.from(serviceRoleKey.split(".")[1], "base64url").toString());
            validKey = payload.role === "service_role"
                && payload.ref === new URL(authUrl).hostname.split(".")[0];
        } catch {
            validKey = false;
        }
        if (!validKey) throw new Error("Der Legacy-Admin-Schluessel passt nicht zum Supabase-Projekt.");
    }

    if (!args.includes("--apply")) {
        console.log(`Trockenlauf OK: Admin-Konto fuer ${input.data.email} kann vorbereitet werden.`);
        console.log("Es wurden keine Benutzer und keine Datenbankdaten erstellt.");
        return;
    }

    const existing = await prisma.user.findFirst({
        where: { name: input.data.email, rolle: "admin" },
        select: { id: true },
    });
    if (existing) throw new Error("Fuer diese E-Mail existiert bereits ein Admin-Konto in der Inventur.");

    const supabase = createClient(authUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await supabase.auth.admin.createUser({
        email: input.data.email,
        password: "inventurliste",
        email_confirm: true,
        app_metadata: { must_change_password: true },
    });
    if (error || !data.user) {
        throw new Error("Supabase konnte das Konto nicht erstellen. Moeglicherweise existiert die E-Mail bereits.");
    }

    try {
        await prisma.user.create({
            data: { id: data.user.id, name: input.data.email, rolle: "admin" },
        });
    } catch {
        throw new Error(
            "Auth-Konto wurde erstellt, aber die Inventur-Rolle fehlt. Nicht nochmals starten; zuerst die Verknuepfung pruefen.",
        );
    }

    console.log(`Admin-Konto fuer ${input.data.email} erstellt. Beim ersten Login ist ein neues Passwort erforderlich.`);
}

main()
    .catch((error: unknown) => {
        console.error(error instanceof Error ? error.message : "Admin-Konto konnte nicht vorbereitet werden.");
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

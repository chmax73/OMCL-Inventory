/**
 * Prueft Eingaben fuer Benutzerverwaltung und Login.
 * Dieselben Regeln koennen spaeter im Formular und auf dem Server gelten.
 */

import { z } from "zod";

const emailSchema = z.string().trim().toLowerCase().pipe(
    z.email("Bitte eine korrekte E-Mail-Adresse eingeben."),
);

export const createUserSchema = z.object({
    email: emailSchema,
    rolle: z.enum(["admin", "user"], "Bitte Admin oder User angeben."),
});

export const resetPasswordSchema = z.object({
    userId: z.uuid("Bitte einen bestehenden Benutzer auswaehlen."),
});

export const updateAccountStatusSchema = resetPasswordSchema.extend({
    active: z.boolean(),
});

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, "Bitte das Passwort eingeben."),
});

export const changePasswordSchema = z.object({
    newPassword: z.string().min(8, "Das neue Passwort muss mindestens 8 Zeichen haben."),
    confirmPassword: z.string().min(1, "Bitte das neue Passwort wiederholen."),
}).refine(
    ({ newPassword, confirmPassword }) => newPassword === confirmPassword,
    { path: ["confirmPassword"], message: "Die beiden Passworte sind unterschiedlich." },
).refine(
    ({ newPassword }) => newPassword !== "inventurliste",
    { path: ["newPassword"], message: "Bitte ein anderes Passwort als das Startpasswort verwenden." },
);

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

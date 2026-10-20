/**
 * Formular fuer Admins, um E-Mail und Benutzerrolle zu erfassen.
 * Das Startpasswort wird nur serverseitig gesetzt und muss danach geaendert werden.
 */

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { createUserSchema, type CreateUserInput } from "@/lib/user-management-validation";
import { createInventoryUser } from "./actions";

export default function CreateUserForm() {
    const router = useRouter();
    const [serverError, setServerError] = useState<string | null>(null);
    const [createdEmail, setCreatedEmail] = useState<string | null>(null);
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateUserInput>({
        resolver: zodResolver(createUserSchema),
        defaultValues: { email: "", rolle: "user" },
    });

    async function onSubmit(values: CreateUserInput) {
        setServerError(null);
        setCreatedEmail(null);
        try {
            const result = await createInventoryUser(values);
            if (!result.success) {
                setServerError(result.error ?? "Benutzer konnte nicht erstellt werden.");
                return;
            }
            setCreatedEmail(result.email ?? values.email);
            reset();
            router.refresh();
        } catch {
            setServerError("Verbindung fehlgeschlagen. Bitte spaeter nochmals versuchen.");
        }
    }

    return (
        <div className="mx-auto mt-10 max-w-lg">
            <div className="card bg-base-200 shadow-xl">
                <div className="card-body gap-5">
                    <div className="flex items-center gap-3">
                        <UserPlus className="h-7 w-7 text-primary" />
                        <h1 className="card-title text-2xl">Benutzer erstellen</h1>
                    </div>
                    <p className="text-sm text-base-content/70">
                        Die E-Mail-Adresse ist die User-ID. Neue Benutzer erhalten das Startpasswort
                        {" "}<code>inventurliste</code> und muessen es beim ersten Login ersetzen.
                    </p>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label htmlFor="new-user-email" className="label">E-Mail-Adresse</label>
                            <input id="new-user-email" type="email" autoComplete="off" className="input input-bordered w-full" {...register("email")} />
                            {errors.email && <p className="mt-1 text-sm text-error">{errors.email.message}</p>}
                        </div>
                        <div>
                            <label htmlFor="new-user-role" className="label">Benutzerrechte</label>
                            <select id="new-user-role" className="select select-bordered w-full" {...register("rolle")}>
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                            {errors.rolle && <p className="mt-1 text-sm text-error">{errors.rolle.message}</p>}
                        </div>
                        <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
                            <UserPlus className="h-4 w-4" />
                            {isSubmitting ? "Bitte warten..." : "Benutzer erstellen"}
                        </button>
                    </form>

                    {createdEmail && (
                        <div className="alert alert-success text-sm">
                            {createdEmail} wurde angelegt. Startpasswort bitte sicher weitergeben.
                        </div>
                    )}
                    {serverError && <div className="alert alert-error text-sm">{serverError}</div>}
                </div>
            </div>
        </div>
    );
}

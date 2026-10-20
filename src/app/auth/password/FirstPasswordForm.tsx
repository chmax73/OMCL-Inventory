/**
 * Laesst neue Benutzer ihr eigenes Passwort zweimal eingeben.
 * Die Zod-Regeln zeigen Fehler direkt beim jeweiligen Feld.
 */

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { changePasswordSchema, type ChangePasswordInput } from "@/lib/user-management-validation";
import { completeFirstPasswordChange } from "./actions";

export default function FirstPasswordForm({ email }: { email: string | null }) {
    const router = useRouter();
    const [serverError, setServerError] = useState<string | null>(null);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ChangePasswordInput>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: { newPassword: "", confirmPassword: "" },
    });

    async function onSubmit(values: ChangePasswordInput) {
        setServerError(null);
        const result = await completeFirstPasswordChange(values);
        if (!result.success) {
            setServerError(result.error ?? "Passwortwechsel fehlgeschlagen.");
            return;
        }
        router.replace("/auth/login");
        router.refresh();
    }

    return (
        <div className="mx-auto mt-10 max-w-md">
            <div className="card bg-base-200 shadow-xl">
                <div className="card-body gap-5">
                    <LockKeyhole className="h-9 w-9 text-primary" />
                    <h1 className="card-title text-2xl">Neues Passwort festlegen</h1>
                    <p className="text-sm text-base-content/70">
                        {email ? `Konto: ${email}. ` : ""}Ersetze jetzt das Startpasswort durch ein eigenes Passwort.
                    </p>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label htmlFor="new-password" className="label">Neues Passwort</label>
                            <input id="new-password" type="password" autoComplete="new-password" className="input input-bordered w-full" {...register("newPassword")} />
                            {errors.newPassword && <p className="mt-1 text-sm text-error">{errors.newPassword.message}</p>}
                        </div>
                        <div>
                            <label htmlFor="confirm-password" className="label">Passwort wiederholen</label>
                            <input id="confirm-password" type="password" autoComplete="new-password" className="input input-bordered w-full" {...register("confirmPassword")} />
                            {errors.confirmPassword && <p className="mt-1 text-sm text-error">{errors.confirmPassword.message}</p>}
                        </div>
                        <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Bitte warten..." : "Passwort speichern"}
                        </button>
                    </form>
                    {serverError && <div className="alert alert-error text-sm">{serverError}</div>}
                </div>
            </div>
        </div>
    );
}

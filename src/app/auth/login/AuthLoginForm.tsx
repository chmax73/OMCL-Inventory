/**
 * Formular zum Testen des Supabase-Logins.
 * Zeigt Eingabefehler direkt neben dem betroffenen Feld an.
 */

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { loginSchema, type LoginInput } from "@/lib/user-management-validation";
import { signInWithEmail, signOutFromAuth } from "./actions";

export default function AuthLoginForm({
    signedInEmail,
    appUser,
}: {
    signedInEmail: string | null;
    appUser: { name: string; rolle: string } | null;
}) {
    const router = useRouter();
    const [serverError, setServerError] = useState<string | null>(null);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    async function onSubmit(values: LoginInput) {
        setServerError(null);
        const result = await signInWithEmail(values);
        if (!result.success) {
            setServerError(result.error ?? "Anmeldung fehlgeschlagen.");
            return;
        }
        router.refresh();
    }

    async function handleSignOut() {
        setServerError(null);
        setIsSigningOut(true);
        try {
            const result = await signOutFromAuth();
            if (result.success) router.refresh();
            else setServerError(result.error ?? "Abmelden fehlgeschlagen.");
        } finally {
            setIsSigningOut(false);
        }
    }

    return (
        <div className="mx-auto mt-10 max-w-md">
            <div className="card bg-base-200 shadow-xl">
                <div className="card-body gap-5">
                    <h1 className="card-title text-2xl">Anmeldung mit E-Mail</h1>
                    <p className="text-sm text-base-content/70">
                        Diese Anmeldung wird mit Supabase Auth getestet. Die Inventur nutzt noch die bisherige Benutzer-Auswahl.
                    </p>

                    {signedInEmail ? (
                        <>
                            <div className="alert alert-success">Angemeldet als {signedInEmail}</div>
                            {appUser ? (
                                <p className="text-sm">Inventur-Konto: {appUser.name} ({appUser.rolle})</p>
                            ) : (
                                <div className="alert alert-warning text-sm">
                                    Dieses Konto hat noch keine Inventur-Rolle. Ein Admin muss es zuerst freischalten.
                                </div>
                            )}
                            {appUser?.rolle === "admin" && (
                                <Link href="/auth/users" className="btn btn-primary">Benutzer verwalten</Link>
                            )}
                            <button type="button" className="btn btn-outline" onClick={handleSignOut} disabled={isSigningOut}>
                                <LogOut className="h-4 w-4" />
                                {isSigningOut ? "Bitte warten..." : "Abmelden"}
                            </button>
                        </>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label htmlFor="auth-email" className="label">E-Mail-Adresse</label>
                                <input id="auth-email" type="email" autoComplete="username" className="input input-bordered w-full" {...register("email")} />
                                {errors.email && <p className="mt-1 text-sm text-error">{errors.email.message}</p>}
                            </div>
                            <div>
                                <label htmlFor="auth-password" className="label">Passwort</label>
                                <input id="auth-password" type="password" autoComplete="current-password" className="input input-bordered w-full" {...register("password")} />
                                {errors.password && <p className="mt-1 text-sm text-error">{errors.password.message}</p>}
                            </div>
                            <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
                                <LogIn className="h-4 w-4" />
                                {isSubmitting ? "Bitte warten..." : "Anmelden"}
                            </button>
                        </form>
                    )}

                    {serverError && <div className="alert alert-error text-sm">{serverError}</div>}
                </div>
            </div>
        </div>
    );
}

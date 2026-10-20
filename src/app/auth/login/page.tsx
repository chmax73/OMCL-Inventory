/**
 * Testseite fuer das echte E-Mail-/Passwort-Login mit Supabase Auth.
 * Die bisherige Inventur-App verwendet vorerst noch die Dummy-Benutzer.
 */

import { redirect } from "next/navigation";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import AuthLoginForm from "./AuthLoginForm";

export default async function AuthLoginPage() {
    const identity = await getVerifiedIdentity();
    if (identity?.mustChangePassword) redirect("/auth/password");

    return <AuthLoginForm signedInEmail={identity?.email ?? null} appUser={identity?.appUser ?? null} />;
}

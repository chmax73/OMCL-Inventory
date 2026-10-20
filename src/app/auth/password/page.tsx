/**
 * Zeigt das Formular nur Konten mit offenem Passwortwechsel an.
 * Die serverseitige Action prueft die Anmeldung vor jeder Aenderung erneut.
 */

import { redirect } from "next/navigation";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import FirstPasswordForm from "./FirstPasswordForm";

export default async function FirstPasswordPage() {
    const identity = await getVerifiedIdentity();
    if (!identity?.mustChangePassword) redirect("/auth/login");

    return <FirstPasswordForm email={identity.email} />;
}

/**
 * Zeigt Benutzeranlage und Kontoverwaltung nur verifizierten Inventur-Admins.
 * Die Server Action prueft die Berechtigung bei jeder Einsendung erneut.
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { isAdminRole } from "@/lib/auth/roles";
import { getManagedUsers } from "./actions";
import CreateUserForm from "./CreateUserForm";
import ManageUsersList from "./ManageUsersList";

export default async function AdminUsersPage() {
    const identity = await getVerifiedIdentity();
    if (!identity) redirect("/auth/login");
    if (identity.mustChangePassword) redirect("/auth/password");
    if (!isAdminRole(identity.appUser?.rolle)) {
        return (
            <div className="alert alert-error mx-auto mt-10 max-w-lg">
                Diese Seite ist nur fuer Admins zugaenglich. <Link href="/auth/login" className="link">Zur Anmeldung</Link>
            </div>
        );
    }

    try {
        const { users, hasMore } = await getManagedUsers();
        return (
            <>
                <CreateUserForm />
                <ManageUsersList users={users} hasMore={hasMore} currentAdminId={identity.appUser?.id ?? ""} />
            </>
        );
    } catch {
        return (
            <>
                <CreateUserForm />
                <div className="alert alert-warning mx-auto mt-8 max-w-3xl">
                    Die Login-Konten konnten nicht geladen werden. Bitte Supabase-Verbindung pruefen.
                </div>
            </>
        );
    }
}

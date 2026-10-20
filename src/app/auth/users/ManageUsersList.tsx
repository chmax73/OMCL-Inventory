/**
 * Zeigt Admins echte Login-Konten mit Reset und reversibler Deaktivierung.
 * Vor jeder Aenderung wird der betroffene Benutzer nochmals bestaetigt.
 */

"use client";

import { RotateCcw, UserCheck, UserX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { resetInventoryUserPassword, updateInventoryUserStatus, type ManagedUser } from "./actions";

export default function ManageUsersList({
    users,
    hasMore,
    currentAdminId,
}: {
    users: ManagedUser[];
    hasMore: boolean;
    currentAdminId: string;
}) {
    const router = useRouter();
    const [pendingId, setPendingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    async function resetPassword(user: ManagedUser) {
        if (!window.confirm(`Passwort fuer ${user.email} wirklich zuruecksetzen?`)) return;
        setPendingId(user.id);
        setError(null);
        setSuccess(null);
        try {
            const result = await resetInventoryUserPassword({ userId: user.id });
            if (!result.success) {
                setError(result.error ?? "Passwort konnte nicht zurueckgesetzt werden.");
                return;
            }
            setSuccess(`Das Passwort fuer ${user.email} wurde zurueckgesetzt. Startpasswort bitte sicher weitergeben.`);
            router.refresh();
        } catch {
            setError("Verbindung fehlgeschlagen. Bitte spaeter nochmals versuchen.");
        } finally {
            setPendingId(null);
        }
    }

    async function toggleStatus(user: ManagedUser) {
        const action = user.active ? "deaktivieren" : "reaktivieren";
        if (!window.confirm(`Konto ${user.email} wirklich ${action}?`)) return;
        setPendingId(user.id);
        setError(null);
        setSuccess(null);
        try {
            const result = await updateInventoryUserStatus({ userId: user.id, active: !user.active });
            if (!result.success) {
                setError(result.error ?? "Kontostatus konnte nicht geaendert werden.");
                return;
            }
            setSuccess(`Das Konto ${user.email} wurde ${user.active ? "deaktiviert" : "reaktiviert"}.`);
            router.refresh();
        } catch {
            setError("Verbindung fehlgeschlagen. Bitte spaeter nochmals versuchen.");
        } finally {
            setPendingId(null);
        }
    }

    return (
        <div className="card mx-auto mt-8 max-w-3xl bg-base-200 shadow-xl">
            <div className="card-body">
                <h2 className="card-title">Login-Konten</h2>
                <p className="text-sm text-base-content/70">
                    Beim Reset gilt wieder das Startpasswort <code>inventurliste</code>.
                    Beim naechsten Login ist ein neues Passwort erforderlich.
                </p>
                <p className="text-sm text-base-content/70">
                    Deaktivieren sperrt den Login, behaelt aber Scans und Protokolle. Das Konto kann wieder aktiviert werden.
                </p>
                {hasMore && <div className="alert alert-warning text-sm">Es werden nur die ersten 100 Login-Konten angezeigt.</div>}
                {users.length === 0 ? (
                    <p className="text-sm">Noch keine verknuepften Login-Konten vorhanden.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>E-Mail-Adresse</th>
                                    <th>Rolle</th>
                                    <th>Status</th>
                                    <th>Aktion</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td>{user.email}</td>
                                        <td>{user.rolle === "admin" ? "Admin" : "User"}</td>
                                        <td>{!user.active ? "Deaktiviert" : user.mustChangePassword ? "Passwortwechsel offen" : "Aktiv"}</td>
                                        <td className="flex flex-wrap gap-2">
                                            <button type="button" className="btn btn-outline btn-sm" onClick={() => resetPassword(user)} disabled={pendingId !== null}>
                                                <RotateCcw className="h-4 w-4" />
                                                Passwort zuruecksetzen
                                            </button>
                                            <button
                                                type="button"
                                                className={`btn btn-sm ${user.active ? "btn-error btn-outline" : "btn-success btn-outline"}`}
                                                onClick={() => toggleStatus(user)}
                                                disabled={pendingId !== null || (user.active && user.id === currentAdminId)}
                                            >
                                                {user.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                                {user.active ? "Deaktivieren" : "Reaktivieren"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {success && <div className="alert alert-success text-sm">{success}</div>}
                {error && <div className="alert alert-error text-sm">{error}</div>}
            </div>
        </div>
    );
}

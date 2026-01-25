/**
 * Login-Seite (Prototyp)
 * ----------------------
 * Ermöglicht die Auswahl eines Benutzers aus der Datenbank.
 * 
 * HINWEIS: Dies ist nur für den Prototyp! In der finalen Version wird
 * hier ein echtes Login-Formular mit UserID und Passwort angezeigt.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, UserCheck, Shield, Users } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { getUsers, type UserOption } from "./actions";

// Icon basierend auf der Rolle
function RoleIcon({ rolle }: { rolle: string }) {
    switch (rolle) {
        case "admin":
            return <Shield className="w-5 h-5 text-error" />;
        case "verantwortlich":
            return <UserCheck className="w-5 h-5 text-warning" />;
        default:
            return <User className="w-5 h-5 text-info" />;
    }
}

// Rollenname auf Deutsch
function getRoleName(rolle: string): string {
    switch (rolle) {
        case "admin":
            return "Administrator";
        case "verantwortlich":
            return "Verantwortlicher";
        default:
            return "Benutzer";
    }
}

export default function LoginPage() {
    const router = useRouter();
    const { setUser } = useUser();
    const [users, setUsers] = useState<UserOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    // Benutzer aus der Datenbank laden
    useEffect(() => {
        async function loadUsers() {
            try {
                const data = await getUsers();
                setUsers(data);
            } catch (error) {
                console.error("Fehler beim Laden der Benutzer:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadUsers();
    }, []);

    // Benutzer auswählen und zum Dashboard navigieren
    const handleSelectUser = (user: UserOption) => {
        setUser(user);
        router.push("/");
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto mt-12">
            <div className="card bg-base-200 shadow-xl">
                <div className="card-body">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="bg-primary text-primary-content w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold">Benutzer wählen</h1>
                        <p className="text-base-content/70 mt-2">
                            Wähle deinen Benutzer aus, um fortzufahren.
                        </p>
                    </div>

                    {/* Hinweis für Prototyp */}
                    <div className="alert alert-info mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span className="text-sm">
                            <strong>Prototyp:</strong> In der finalen Version wird hier ein Login mit UserID und Passwort angezeigt.
                        </span>
                    </div>

                    {/* Benutzerliste */}
                    <div className="space-y-2">
                        {users.map((user) => (
                            <button
                                key={user.id}
                                onClick={() => handleSelectUser(user)}
                                className={`btn btn-block justify-start gap-3 ${selectedUserId === user.id ? "btn-primary" : "btn-ghost"
                                    }`}
                            >
                                <RoleIcon rolle={user.rolle} />
                                <div className="text-left flex-1">
                                    <div className="font-medium">{user.name}</div>
                                    <div className="text-xs opacity-70">{getRoleName(user.rolle)}</div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Leerer Zustand */}
                    {users.length === 0 && (
                        <div className="text-center py-8 text-base-content/50">
                            <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>Keine Benutzer gefunden</p>
                            <p className="text-sm mt-2">
                                Führe <code className="bg-base-300 px-1 rounded">npx prisma db seed</code> aus.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

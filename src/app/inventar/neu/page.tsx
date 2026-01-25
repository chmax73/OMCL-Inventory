/**
 * Neues Inventar erstellen - Seite
 * ---------------------------------
 * Ermöglicht das Erstellen eines neuen Inventars.
 * Der Benutzer muss angemeldet sein und es darf kein offenes Inventar existieren.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardPlus, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { createInventar } from "./actions";

export default function NeuesInventarPage() {
    const router = useRouter();
    const { user } = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleCreateInventar = async () => {
        if (!user) {
            setError("Bitte melde dich zuerst an.");
            return;
        }

        setIsLoading(true);
        setError(null);

        const result = await createInventar(user.id);

        if (result.success) {
            setSuccess(true);
            // Nach kurzer Verzögerung zur Excel-Upload-Seite weiterleiten
            setTimeout(() => {
                router.push(`/inventar/${result.inventarId}/upload`);
            }, 1500);
        } else {
            setError(result.error || "Ein Fehler ist aufgetreten");
        }

        setIsLoading(false);
    };

    // Nicht angemeldet
    if (!user) {
        return (
            <div className="max-w-md mx-auto mt-12">
                <div className="card bg-base-200 shadow-xl">
                    <div className="card-body text-center">
                        <AlertCircle className="w-16 h-16 text-warning mx-auto mb-4" />
                        <h1 className="text-2xl font-bold">Nicht angemeldet</h1>
                        <p className="text-base-content/70 mt-2">
                            Bitte melde dich an, um ein neues Inventar zu erstellen.
                        </p>
                        <div className="card-actions justify-center mt-4">
                            <button
                                onClick={() => router.push("/login")}
                                className="btn btn-primary"
                            >
                                Zur Anmeldung
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Erfolg
    if (success) {
        return (
            <div className="max-w-md mx-auto mt-12">
                <div className="card bg-base-200 shadow-xl">
                    <div className="card-body text-center">
                        <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
                        <h1 className="text-2xl font-bold">Inventar erstellt!</h1>
                        <p className="text-base-content/70 mt-2">
                            Du wirst zur Excel-Upload-Seite weitergeleitet...
                        </p>
                        <div className="mt-4">
                            <span className="loading loading-spinner loading-md text-primary"></span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto mt-8">
            <div className="card bg-base-200 shadow-xl">
                <div className="card-body">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="bg-primary text-primary-content w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ClipboardPlus className="w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold">Neues Inventar erstellen</h1>
                        <p className="text-base-content/70 mt-2">
                            Starte eine neue Inventur für das aktuelle Jahr.
                        </p>
                    </div>

                    {/* Schritte-Übersicht */}
                    <div className="bg-base-100 rounded-lg p-4 mb-6">
                        <h2 className="font-semibold mb-3">So funktioniert&apos;s:</h2>
                        <ul className="steps steps-vertical">
                            <li className="step step-primary">Inventar erstellen</li>
                            <li className="step">SOLL-Daten aus Excel importieren</li>
                            <li className="step">Waren an Lagerplätzen scannen</li>
                            <li className="step">Abweichungen klären</li>
                            <li className="step">Inventar abschliessen & Report erstellen</li>
                        </ul>
                    </div>

                    {/* Info-Box */}
                    <div className="alert alert-info mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <div>
                            <p className="font-medium">Hinweis</p>
                            <p className="text-sm">
                                Es kann immer nur ein offenes Inventar gleichzeitig existieren.
                                Du brauchst eine Excel-Datei mit den SOLL-Daten aus dem LIMS.
                            </p>
                        </div>
                    </div>

                    {/* Fehler-Anzeige */}
                    {error && (
                        <div className="alert alert-error mb-6">
                            <AlertCircle className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Aktionen */}
                    <div className="card-actions justify-between">
                        <button
                            onClick={() => router.back()}
                            className="btn btn-ghost"
                        >
                            Abbrechen
                        </button>
                        <button
                            onClick={handleCreateInventar}
                            disabled={isLoading}
                            className="btn btn-primary gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Wird erstellt...
                                </>
                            ) : (
                                <>
                                    Inventar erstellen
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

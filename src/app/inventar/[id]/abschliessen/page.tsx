/**
 * Inventar Abschliessen Seite
 * ---------------------------
 * Zeigt den Status und ermöglicht das Abschliessen eines Inventars.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    CheckCircle,
    XCircle,
    AlertTriangle,
    Package,
    MapPin,
    ClipboardCheck,
    Lock,
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import { getAbschlussStatus, closeInventar, type AbschlussStatus } from "./actions";

export default function AbschliessenPage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useUser();
    const inventarId = params.id as string;

    const [status, setStatus] = useState<AbschlussStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isClosing, setIsClosing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Status laden
    useEffect(() => {
        async function loadStatus() {
            const s = await getAbschlussStatus(inventarId);
            setStatus(s);
            setIsLoading(false);
        }
        loadStatus();
    }, [inventarId]);

    // Inventar abschliessen
    const handleClose = async () => {
        if (!user) return;

        setIsClosing(true);
        setError(null);

        const result = await closeInventar(inventarId, user.id);

        if (result.success) {
            setSuccess(true);
            setTimeout(() => router.push("/"), 2000);
        } else {
            setError(result.error || "Unbekannter Fehler");
        }

        setIsClosing(false);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    if (!user) {
        router.push("/login");
        return null;
    }

    if (!status) {
        return (
            <div className="text-center py-12">
                <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-warning" />
                <h2 className="text-2xl font-bold mb-2">Inventar nicht gefunden</h2>
            </div>
        );
    }

    if (success) {
        return (
            <div className="text-center py-12">
                <div className="bg-success/20 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                    <Lock className="w-12 h-12 text-success" />
                </div>
                <h2 className="text-3xl font-bold mb-2 text-success">Inventar abgeschlossen!</h2>
                <p className="text-base-content/70">Du wirst zum Dashboard weitergeleitet...</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-bold mb-2">Inventar abschliessen</h1>
                <p className="text-base-content/70">
                    Prüfe den Status und schliesse das Inventar ab.
                </p>
            </div>

            {/* Status-Karten */}
            <div className="grid grid-cols-2 gap-4">
                {/* Lagerplätze */}
                <div className="card bg-base-200">
                    <div className="card-body">
                        <div className="flex items-center gap-2 text-base-content/70">
                            <MapPin className="w-5 h-5" />
                            <span>Lagerplätze</span>
                        </div>
                        <div className="text-3xl font-bold">
                            {status.stats.lagerplaetzeUeberprueft} / {status.stats.lagerplaetzeTotal}
                        </div>
                        <progress
                            className={`progress w-full ${status.stats.lagerplaetzeUeberprueft === status.stats.lagerplaetzeTotal
                                    ? "progress-success"
                                    : "progress-warning"
                                }`}
                            value={status.stats.lagerplaetzeUeberprueft}
                            max={status.stats.lagerplaetzeTotal}
                        ></progress>
                        <p className="text-sm text-base-content/50">überprüft</p>
                    </div>
                </div>

                {/* Abweichungen */}
                <div className="card bg-base-200">
                    <div className="card-body">
                        <div className="flex items-center gap-2 text-base-content/70">
                            <AlertTriangle className="w-5 h-5" />
                            <span>Abweichungen</span>
                        </div>
                        <div className="text-3xl font-bold">
                            {status.stats.abweichungenTotal - status.stats.abweichungenOffen} / {status.stats.abweichungenTotal}
                        </div>
                        <progress
                            className={`progress w-full ${status.stats.abweichungenOffen === 0
                                    ? "progress-success"
                                    : "progress-error"
                                }`}
                            value={status.stats.abweichungenTotal - status.stats.abweichungenOffen}
                            max={status.stats.abweichungenTotal || 1}
                        ></progress>
                        <p className="text-sm text-base-content/50">bestätigt</p>
                    </div>
                </div>

                {/* SOLL-Waren */}
                <div className="card bg-base-200">
                    <div className="card-body">
                        <div className="flex items-center gap-2 text-base-content/70">
                            <Package className="w-5 h-5" />
                            <span>SOLL-Waren</span>
                        </div>
                        <div className="text-3xl font-bold">{status.stats.sollWaren}</div>
                        <p className="text-sm text-base-content/50">erwartet</p>
                    </div>
                </div>

                {/* IST-Scans */}
                <div className="card bg-base-200">
                    <div className="card-body">
                        <div className="flex items-center gap-2 text-base-content/70">
                            <ClipboardCheck className="w-5 h-5" />
                            <span>IST-Scans</span>
                        </div>
                        <div className="text-3xl font-bold">{status.stats.istScans}</div>
                        <p className="text-sm text-base-content/50">gescannt</p>
                    </div>
                </div>
            </div>

            {/* Status-Anzeige */}
            {status.canClose ? (
                <div className="alert alert-success">
                    <CheckCircle className="w-6 h-6" />
                    <div>
                        <h3 className="font-bold">Bereit zum Abschliessen</h3>
                        <p>Alle Voraussetzungen sind erfüllt.</p>
                    </div>
                </div>
            ) : (
                <div className="alert alert-warning">
                    <AlertTriangle className="w-6 h-6" />
                    <div>
                        <h3 className="font-bold">Noch nicht bereit</h3>
                        <ul className="list-disc list-inside mt-2">
                            {status.reasons.map((reason, i) => (
                                <li key={i}>{reason}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Fehler-Anzeige */}
            {error && (
                <div className="alert alert-error">
                    <XCircle className="w-6 h-6" />
                    <span>{error}</span>
                </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 justify-center">
                <button onClick={() => router.back()} className="btn btn-ghost">
                    Zurück
                </button>
                <button
                    onClick={handleClose}
                    disabled={!status.canClose || isClosing}
                    className="btn btn-success btn-lg gap-2"
                >
                    {isClosing ? (
                        <>
                            <span className="loading loading-spinner loading-sm"></span>
                            Wird abgeschlossen...
                        </>
                    ) : (
                        <>
                            <Lock className="w-5 h-5" />
                            Inventar abschliessen
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

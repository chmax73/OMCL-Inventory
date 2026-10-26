/**
 * Abweichungen-Seite
 * ------------------
 * Zeigt alle Abweichungen zwischen SOLL und IST an.
 * Ermöglicht das Bestätigen und Kommentieren von Abweichungen.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    AlertTriangle,
    CheckCircle,
    XCircle,
    Package,
    Search,
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import {
    getAbweichungen,
    getAbweichungStats,
    confirmAbweichung,
    discardAbweichung,
    reopenAbweichung,
    type AbweichungItem,
} from "./actions";
import { getActiveInventar, type ActiveInventar } from "../scan/actions";
import { AbweichungStatus, AbweichungTyp } from "@prisma/client";

export default function AbweichungenPage() {
    const router = useRouter();
    const { user } = useUser();
    const userId = user?.id;

    const [inventar, setInventar] = useState<ActiveInventar | null>(null);
    const [abweichungen, setAbweichungen] = useState<AbweichungItem[]>([]);
    const [stats, setStats] = useState<{
        total: number;
        bestaetigt: number;
        verworfen: number;
        offen: number;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterTyp, setFilterTyp] = useState<AbweichungTyp | "alle">("alle");
    const [filterStatus, setFilterStatus] = useState<AbweichungStatus | "alle">("alle");

    // Modal State
    const [selectedAbweichung, setSelectedAbweichung] = useState<AbweichungItem | null>(null);
    const [selectedAction, setSelectedAction] = useState<"bestaetigt" | "verworfen">("bestaetigt");
    const [kommentar, setKommentar] = useState("");
    const [isConfirming, setIsConfirming] = useState(false);
    const [confirmError, setConfirmError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    // Daten laden
    useEffect(() => {
        if (!userId) return;
        async function loadData() {
            try {
                const activeInventar = await getActiveInventar();
                setInventar(activeInventar);

                if (activeInventar) {
                    const [abw, st] = await Promise.all([
                        getAbweichungen(activeInventar.id),
                        getAbweichungStats(activeInventar.id),
                    ]);
                    setAbweichungen(abw);
                    setStats(st);
                }
            } catch (error) {
                console.error("Abweichungen konnten nicht geladen werden:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [userId]);

    // Entscheidung speichern und die Liste erneut laden
    const handleDecision = async () => {
        if (!selectedAbweichung || user?.rolle !== "admin") return;

        setIsConfirming(true);
        setConfirmError(null);
        try {
            const result = selectedAction === "verworfen"
                ? await discardAbweichung(selectedAbweichung.id, kommentar)
                : await confirmAbweichung(selectedAbweichung.id, kommentar || null);
            if (!result.success) {
                setConfirmError(result.error ?? "Entscheidung konnte nicht gespeichert werden.");
                return;
            }
            if (inventar) {
                const [abw, st] = await Promise.all([
                    getAbweichungen(inventar.id),
                    getAbweichungStats(inventar.id),
                ]);
                setAbweichungen(abw);
                setStats(st);
            }
            setSelectedAbweichung(null);
            setKommentar("");
        } catch {
            setConfirmError("Verbindung fehlgeschlagen. Bitte spaeter nochmals versuchen.");
        } finally {
            setIsConfirming(false);
        }
    };

    const handleReopen = async (abweichung: AbweichungItem) => {
        if (!inventar || user?.rolle !== "admin" || isConfirming) return;
        if (!window.confirm(`Abweichung ${abweichung.primarschluessel} wieder eröffnen?`)) return;
        setIsConfirming(true);
        setActionError(null);
        try {
            const result = await reopenAbweichung(abweichung.id);
            if (!result.success) {
                setActionError(result.error ?? "Abweichung konnte nicht wieder eröffnet werden.");
                return;
            }
            const [abw, st] = await Promise.all([
                getAbweichungen(inventar.id),
                getAbweichungStats(inventar.id),
            ]);
            setAbweichungen(abw);
            setStats(st);
        } catch {
            setActionError("Verbindung fehlgeschlagen. Bitte später nochmals versuchen.");
        } finally {
            setIsConfirming(false);
        }
    };

    // Gefilterte Abweichungen
    const filteredAbweichungen = abweichungen.filter((a) => {
        // Suchfilter
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            if (
                !a.primarschluessel.toLowerCase().includes(search) &&
                !a.bezeichnung?.toLowerCase().includes(search) &&
                !a.lagerplatzCode?.toLowerCase().includes(search)
            ) {
                return false;
            }
        }

        // Typ-Filter
        if (filterTyp !== "alle" && a.typ !== filterTyp) {
            return false;
        }

        // Status-Filter
        if (filterStatus !== "alle" && a.status !== filterStatus) return false;

        return true;
    });

    // Typ-Label und Farbe
    const getTypInfo = (typ: AbweichungTyp) => {
        switch (typ) {
            case "fehlend":
                return { label: "Fehlend", color: "badge-error", icon: XCircle };
            case "falsch":
                return { label: "Falsch", color: "badge-warning", icon: AlertTriangle };
            case "neu":
                return { label: "Neu", color: "badge-info", icon: Package };
        }
    };

    if (!user) {
        return (
            <div className="alert alert-warning mx-auto mt-12 max-w-lg">
                Bitte melde dich an, um Abweichungen anzusehen.
                <button onClick={() => router.push("/login")} className="btn btn-primary">Zur Anmeldung</button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    if (!inventar) {
        return (
            <div className="text-center py-12">
                <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-warning" />
                <h2 className="text-2xl font-bold mb-2">Kein aktives Inventar</h2>
                <p className="text-base-content/70 mb-4">
                    Es muss zuerst ein Inventar erstellt werden.
                </p>
                {user.rolle === "admin" && (
                    <button onClick={() => router.push("/inventar/neu")} className="btn btn-primary">
                        Neues Inventar erstellen
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Abweichungen</h1>
                {stats && (
                    <div className="flex gap-2">
                        <span className="badge badge-lg badge-error gap-1">
                            {stats.offen} offen
                        </span>
                        <span className="badge badge-lg badge-success gap-1">
                            {stats.bestaetigt} bestätigt
                        </span>
                        <span className="badge badge-lg badge-ghost gap-1">
                            {stats.verworfen} verworfen
                        </span>
                    </div>
                )}
            </div>

            {/* Filter */}
            <div className="card bg-base-200">
                <div className="card-body p-4">
                    <div className="flex flex-wrap gap-4">
                        {/* Suche */}
                        <div className="form-control flex-1 min-w-[200px]">
                            <div className="input-group">
                                <span className="bg-base-300">
                                    <Search className="w-5 h-5" />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Suchen..."
                                    className="input input-bordered w-full"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Typ-Filter */}
                        <select
                            className="select select-bordered"
                            value={filterTyp}
                            onChange={(e) => setFilterTyp(e.target.value as AbweichungTyp | "alle")}
                        >
                            <option value="alle">Alle Typen</option>
                            <option value="fehlend">Fehlend</option>
                            <option value="falsch">Falscher Ort</option>
                            <option value="neu">Neu gefunden</option>
                        </select>

                        {/* Status-Filter */}
                        <select
                            className="select select-bordered"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as AbweichungStatus | "alle")}
                        >
                            <option value="alle">Alle Status</option>
                            <option value="offen">Offen</option>
                            <option value="bestaetigt">Bestätigt</option>
                            <option value="verworfen">Verworfen</option>
                        </select>
                    </div>
                </div>
            </div>

            {actionError && <div className="alert alert-error">{actionError}</div>}

            {/* Abweichungen-Liste */}
            <div className="card bg-base-200">
                <div className="card-body">
                    {filteredAbweichungen.length === 0 ? (
                        <div className="text-center py-8 text-base-content/50">
                            <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>Keine Abweichungen gefunden</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Status</th>
                                        <th>Typ</th>
                                        <th>Barcode</th>
                                        <th>Bezeichnung</th>
                                        <th>Lagerplatz</th>
                                        <th>Kommentar</th>
                                        <th>Aktion</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAbweichungen.map((a) => {
                                        const typInfo = getTypInfo(a.typ);
                                        const Icon = typInfo.icon;

                                        return (
                                            <tr
                                                key={a.id}
                                                className={a.status !== "offen" ? "opacity-75" : ""}
                                            >
                                                <td>
                                                    {a.status === "bestaetigt" ? (
                                                        <span className="badge badge-success gap-1">
                                                            <CheckCircle className="w-3 h-3" />
                                                            Bestätigt
                                                        </span>
                                                    ) : a.status === "verworfen" ? (
                                                        <span className="badge badge-ghost gap-1">
                                                            <XCircle className="w-3 h-3" />
                                                            Verworfen
                                                        </span>
                                                    ) : (
                                                        <span className="badge badge-warning gap-1">
                                                            <AlertTriangle className="w-3 h-3" />
                                                            Offen
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className={`badge ${typInfo.color} gap-1`}>
                                                        <Icon className="w-3 h-3" />
                                                        {typInfo.label}
                                                    </span>
                                                </td>
                                                <td className="font-mono">{a.primarschluessel}</td>
                                                <td>{a.bezeichnung || "-"}</td>
                                                <td>{a.lagerplatzCode || "-"}</td>
                                                <td>
                                                    {a.kommentar ? (
                                                        <span className="text-sm">{a.kommentar}</span>
                                                    ) : (
                                                        <span className="text-base-content/30">-</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {user?.rolle === "admin" && (
                                                        <div className="flex gap-2">
                                                            {a.status === "offen" ? (
                                                                <>
                                                                    <button onClick={() => {
                                                                        setSelectedAbweichung(a);
                                                                        setSelectedAction("bestaetigt");
                                                                        setKommentar("");
                                                                        setConfirmError(null);
                                                                    }} className="btn btn-sm btn-primary" disabled={isConfirming}>
                                                                        Bestätigen
                                                                    </button>
                                                                    <button onClick={() => {
                                                                        setSelectedAbweichung(a);
                                                                        setSelectedAction("verworfen");
                                                                        setKommentar("");
                                                                        setConfirmError(null);
                                                                    }} className="btn btn-sm btn-ghost" disabled={isConfirming}>
                                                                        Verwerfen
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <button onClick={() => handleReopen(a)} className="btn btn-sm btn-outline" disabled={isConfirming}>
                                                                    Wieder eröffnen
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Bestätigungs-Modal */}
            {selectedAbweichung && user?.rolle === "admin" && (
                <dialog className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Abweichung {selectedAction === "verworfen" ? "verwerfen" : "bestätigen"}</h3>

                        <div className="space-y-4">
                            <div className="bg-base-200 p-4 rounded-lg">
                                <p className="text-sm text-base-content/70">Barcode</p>
                                <p className="font-mono font-bold">
                                    {selectedAbweichung.primarschluessel}
                                </p>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">{selectedAction === "verworfen" ? "Grund (erforderlich)" : "Kommentar (optional)"}</span>
                                </label>
                                <textarea
                                    className="textarea textarea-bordered"
                                    placeholder="z.B. 'Ware wurde entsorgt' oder 'Bereits korrigiert'"
                                    value={kommentar}
                                    onChange={(e) => setKommentar(e.target.value)}
                                    maxLength={1000}
                                    rows={3}
                                />
                                {confirmError && <p className="text-sm text-error">{confirmError}</p>}
                            </div>
                        </div>

                        <div className="modal-action">
                            <button
                                onClick={() => setSelectedAbweichung(null)}
                                className="btn"
                                disabled={isConfirming}
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={handleDecision}
                                className={`btn gap-2 ${selectedAction === "verworfen" ? "btn-warning" : "btn-success"}`}
                                disabled={isConfirming}
                            >
                                {isConfirming ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span>
                                        Wird gespeichert...
                                    </>
                                ) : (
                                    <>
                                        {selectedAction === "verworfen" ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                                        {selectedAction === "verworfen" ? "Verwerfen" : "Bestätigen"}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                    <div
                        className="modal-backdrop"
                        onClick={() => setSelectedAbweichung(null)}
                    ></div>
                </dialog>
            )}
        </div>
    );
}

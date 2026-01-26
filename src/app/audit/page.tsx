/**
 * Audit Trail Seite
 * -----------------
 * Zeigt alle protokollierten Aktionen chronologisch an.
 * Ermöglicht Filterung nach Inventar.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    History,
    Filter,
    User,
    Package,
    MapPin,
    AlertTriangle,
    FileText,
    ScanBarcode,
    CheckCircle,
    RefreshCw,
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import {
    getAuditTrail,
    getInventareForFilter,
    getAktionLabel,
    getEntitaetLabel,
    type AuditEntry,
} from "./actions";

export default function AuditPage() {
    const router = useRouter();
    const { user } = useUser();

    const [entries, setEntries] = useState<AuditEntry[]>([]);
    const [inventare, setInventare] = useState<{ id: string; label: string }[]>([]);
    const [selectedInventar, setSelectedInventar] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);

    // Daten laden
    useEffect(() => {
        async function loadData() {
            const [auditEntries, invList] = await Promise.all([
                getAuditTrail(selectedInventar || undefined),
                getInventareForFilter(),
            ]);
            setEntries(auditEntries);
            setInventare(invList);
            setIsLoading(false);
        }
        loadData();
    }, [selectedInventar]);

    // Icon basierend auf Aktion
    const getAktionIcon = (aktion: string) => {
        switch (aktion) {
            case "inventar_erstellt":
            case "inventar_abgeschlossen":
                return FileText;
            case "excel_upload":
                return Package;
            case "barcode_gescannt":
                return ScanBarcode;
            case "abweichung_erstellt":
            case "abweichung_bestaetigt":
                return AlertTriangle;
            case "lagerplatz_ueberprueft":
            case "lagerplatz_wiedereroeffnet":
                return MapPin;
            default:
                return History;
        }
    };

    // Farbe basierend auf Aktion
    const getAktionColor = (aktion: string) => {
        switch (aktion) {
            case "inventar_erstellt":
                return "text-primary";
            case "inventar_abgeschlossen":
                return "text-success";
            case "abweichung_erstellt":
                return "text-error";
            case "abweichung_bestaetigt":
                return "text-warning";
            case "lagerplatz_ueberprueft":
                return "text-success";
            case "lagerplatz_wiedereroeffnet":
                return "text-warning";
            default:
                return "text-info";
        }
    };

    if (!user) {
        router.push("/login");
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <History className="w-8 h-8" />
                    Verlauf
                </h1>
            </div>

            {/* Filter */}
            <div className="card bg-base-200">
                <div className="card-body p-4">
                    <div className="flex items-center gap-4">
                        <Filter className="w-5 h-5 text-base-content/70" />
                        <select
                            className="select select-bordered flex-1 max-w-xs"
                            value={selectedInventar}
                            onChange={(e) => {
                                setIsLoading(true);
                                setSelectedInventar(e.target.value);
                            }}
                        >
                            <option value="">Alle Inventare</option>
                            {inventare.map((inv) => (
                                <option key={inv.id} value={inv.id}>
                                    {inv.label}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={() => {
                                setIsLoading(true);
                                setSelectedInventar("");
                            }}
                            className="btn btn-ghost btn-sm"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Zurücksetzen
                        </button>
                    </div>
                </div>
            </div>

            {/* Audit Trail Liste */}
            <div className="card bg-base-200">
                <div className="card-body">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <span className="loading loading-spinner loading-lg text-primary"></span>
                        </div>
                    ) : entries.length === 0 ? (
                        <div className="text-center py-8 text-base-content/50">
                            <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>Keine Einträge gefunden</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Zeitpunkt</th>
                                        <th>Benutzer</th>
                                        <th>Aktion</th>
                                        <th>Entität</th>
                                        <th>Referenz</th>
                                        <th>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.map((entry) => {
                                        const Icon = getAktionIcon(entry.aktion);
                                        const color = getAktionColor(entry.aktion);

                                        // Details parsen falls JSON
                                        let detailsDisplay = entry.details || "-";
                                        try {
                                            if (entry.details) {
                                                const parsed = JSON.parse(entry.details);
                                                // Nur relevante Infos anzeigen
                                                if (parsed.scanTyp) {
                                                    detailsDisplay = `Typ: ${parsed.scanTyp}`;
                                                } else if (parsed.lagerplatzCode) {
                                                    detailsDisplay = `Lagerplatz: ${parsed.lagerplatzCode}`;
                                                } else if (parsed.kommentar) {
                                                    detailsDisplay = parsed.kommentar;
                                                } else if (parsed.sollWaren) {
                                                    detailsDisplay = `${parsed.sollWaren} SOLL, ${parsed.istScans} IST`;
                                                }
                                            }
                                        } catch {
                                            // Kein JSON, Original anzeigen
                                        }

                                        return (
                                            <tr key={entry.id}>
                                                <td className="whitespace-nowrap">
                                                    {new Date(entry.zeitpunkt).toLocaleString("de-CH", {
                                                        day: "2-digit",
                                                        month: "2-digit",
                                                        year: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </td>
                                                <td>
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-4 h-4 text-base-content/50" />
                                                        {entry.benutzer}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`flex items-center gap-1 ${color}`}>
                                                        <Icon className="w-4 h-4" />
                                                        {getAktionLabel(entry.aktion)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="badge badge-ghost badge-sm">
                                                        {getEntitaetLabel(entry.entitaet)}
                                                    </span>
                                                </td>
                                                <td className="font-mono text-xs">
                                                    {entry.referenzId || "-"}
                                                </td>
                                                <td className="text-sm text-base-content/70 max-w-[200px] truncate">
                                                    {detailsDisplay}
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
        </div>
    );
}

/**
 * Scan-Seite
 * ----------
 * Ermöglicht das Scannen von Barcodes an Lagerplätzen.
 * Zeigt SOLL-Waren und erfasst IST-Scans.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    ScanBarcode,
    MapPin,
    Package,
    CheckCircle,
    XCircle,
    AlertTriangle,
    ArrowLeft,
    Search,
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import {
    getActiveInventar,
    getLagerplaetze,
    getSollWarenForLagerplatz,
    scanBarcode,
    confirmLagerplatz,
    isLagerplatzUeberprueft,
    reopenLagerplatz,
    type ActiveInventar,
    type LagerplatzInfo,
    type SollWare,
    type ScanResult,
} from "./actions";

export default function ScanPage() {
    const router = useRouter();
    const { user } = useUser();
    const barcodeInputRef = useRef<HTMLInputElement>(null);

    const [inventar, setInventar] = useState<ActiveInventar | null>(null);
    const [lagerplaetze, setLagerplaetze] = useState<LagerplatzInfo[]>([]);
    const [selectedLagerplatz, setSelectedLagerplatz] = useState<string | null>(null);
    const [sollWaren, setSollWaren] = useState<SollWare[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const [barcode, setBarcode] = useState("");
    const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isUeberprueft, setIsUeberprueft] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);

    // Daten laden
    useEffect(() => {
        async function loadData() {
            const activeInventar = await getActiveInventar();
            setInventar(activeInventar);

            if (activeInventar) {
                const plaetze = await getLagerplaetze(activeInventar.id);
                setLagerplaetze(plaetze);
            }

            setIsLoading(false);
        }
        loadData();
    }, []);

    // SOLL-Waren und Überprüft-Status laden wenn Lagerplatz gewählt
    useEffect(() => {
        async function loadSollWaren() {
            if (inventar && selectedLagerplatz) {
                const waren = await getSollWarenForLagerplatz(inventar.id, selectedLagerplatz);
                setSollWaren(waren);
                // Überprüft-Status laden
                const ueberprueft = await isLagerplatzUeberprueft(inventar.id, selectedLagerplatz);
                setIsUeberprueft(ueberprueft);
                // Fokus auf Barcode-Input
                setTimeout(() => barcodeInputRef.current?.focus(), 100);
            }
        }
        loadSollWaren();
    }, [inventar, selectedLagerplatz]);

    // Barcode scannen
    const handleScan = async () => {
        if (!barcode.trim() || !inventar || !selectedLagerplatz || !user) return;

        setIsScanning(true);
        const result = await scanBarcode(inventar.id, selectedLagerplatz, barcode.trim(), user.id);
        setLastScanResult(result);

        if (result.success) {
            // SOLL-Waren aktualisieren
            const waren = await getSollWarenForLagerplatz(inventar.id, selectedLagerplatz);
            setSollWaren(waren);
            // Lagerplätze aktualisieren
            const plaetze = await getLagerplaetze(inventar.id);
            setLagerplaetze(plaetze);
        }

        setBarcode("");
        setIsScanning(false);
        barcodeInputRef.current?.focus();
    };

    // Enter-Taste zum Scannen
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleScan();
        }
    };

    // State für Anzahl fehlender Waren
    const [fehlendeWarenCount, setFehlendeWarenCount] = useState<number | null>(null);

    // Lagerplatz als überprüft markieren
    const handleConfirmLagerplatz = async () => {
        if (!inventar || !selectedLagerplatz || !user) return;

        setIsConfirming(true);
        const result = await confirmLagerplatz(inventar.id, selectedLagerplatz, user.id);

        if (result.success) {
            setIsUeberprueft(true);
            setFehlendeWarenCount(result.fehlendeWaren || 0);
            // Zurück zur Lagerplatz-Auswahl nach längerem Timeout wenn Abweichungen
            setTimeout(() => {
                setSelectedLagerplatz(null);
                setIsUeberprueft(false);
                setFehlendeWarenCount(null);
            }, result.fehlendeWaren && result.fehlendeWaren > 0 ? 3000 : 1500);
        }

        setIsConfirming(false);
    };

    // Gefilterte Lagerplätze
    const filteredLagerplaetze = lagerplaetze.filter(
        (lp) =>
            lp.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (lp.raum && lp.raum.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    // Kein aktives Inventar
    if (!inventar) {
        return (
            <div className="max-w-md mx-auto mt-12">
                <div className="card bg-base-200 shadow-xl">
                    <div className="card-body text-center">
                        <AlertTriangle className="w-16 h-16 text-warning mx-auto mb-4" />
                        <h1 className="text-2xl font-bold">Kein offenes Inventar</h1>
                        <p className="text-base-content/70 mt-2">
                            Es gibt kein aktives Inventar zum Scannen.
                        </p>
                        <div className="card-actions justify-center mt-4">
                            <button onClick={() => router.push("/inventar/neu")} className="btn btn-primary">
                                Neues Inventar erstellen
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Nicht angemeldet
    if (!user) {
        return (
            <div className="max-w-md mx-auto mt-12">
                <div className="card bg-base-200 shadow-xl">
                    <div className="card-body text-center">
                        <AlertTriangle className="w-16 h-16 text-warning mx-auto mb-4" />
                        <h1 className="text-2xl font-bold">Nicht angemeldet</h1>
                        <p className="text-base-content/70 mt-2">
                            Bitte melde dich an, um zu scannen.
                        </p>
                        <div className="card-actions justify-center mt-4">
                            <button onClick={() => router.push("/login")} className="btn btn-primary">
                                Zur Anmeldung
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Kein Lagerplatz gewählt - Lagerplatz-Auswahl anzeigen
    if (!selectedLagerplatz) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Lagerplatz wählen</h1>
                    <div className="badge badge-lg badge-primary gap-2">
                        <Package className="w-4 h-4" />
                        {inventar.istWarenCount} / {inventar.sollWarenCount} gescannt
                    </div>
                </div>

                {/* Suche mit Auto-Select bei exaktem Match */}
                <div className="form-control">
                    <div className="input-group">
                        <span className="bg-base-200">
                            <Search className="w-5 h-5" />
                        </span>
                        <input
                            type="text"
                            placeholder="Lagerplatz scannen oder suchen..."
                            className="input input-bordered w-full"
                            value={searchTerm}
                            onChange={(e) => {
                                const value = e.target.value;
                                setSearchTerm(value);
                                // Auto-Select wenn exakter Match gefunden
                                const exactMatch = lagerplaetze.find(
                                    (lp) => lp.code.toLowerCase() === value.toLowerCase()
                                );
                                if (exactMatch) {
                                    setSelectedLagerplatz(exactMatch.code);
                                    setSearchTerm("");
                                }
                            }}
                            autoFocus
                        />
                    </div>
                </div>

                {/* Lagerplatz-Liste */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredLagerplaetze.map((lp) => (
                        <div
                            key={lp.code}
                            className={`card transition-colors ${lp.ueberprueft
                                ? "bg-success/20 border-2 border-success"
                                : "bg-base-200 hover:bg-base-300"
                                }`}
                        >
                            <div className="card-body p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <MapPin className={`w-5 h-5 ${lp.ueberprueft ? "text-success" : "text-primary"}`} />
                                        <span className="font-bold">{lp.code}</span>
                                    </div>
                                    {lp.ueberprueft && (
                                        <span className="badge badge-success gap-1">
                                            <CheckCircle className="w-3 h-3" />
                                            Überprüft
                                        </span>
                                    )}
                                </div>
                                {lp.raum && <p className="text-sm text-base-content/70">{lp.raum}</p>}
                                <div className="mt-2">
                                    <progress
                                        className={`progress w-full ${lp.ueberprueft ? "progress-success" : "progress-warning"}`}
                                        value={lp.istCount}
                                        max={lp.sollCount}
                                    ></progress>
                                    <p className="text-xs text-right mt-1">
                                        {lp.istCount} / {lp.sollCount}
                                    </p>
                                </div>
                                {/* Buttons */}
                                <div className="mt-3 flex gap-2">
                                    {lp.ueberprueft ? (
                                        <button
                                            onClick={async () => {
                                                if (!inventar || !user) return;
                                                await reopenLagerplatz(inventar.id, lp.code, user.id);
                                                const plaetze = await getLagerplaetze(inventar.id);
                                                setLagerplaetze(plaetze);
                                            }}
                                            className="btn btn-sm btn-outline btn-warning flex-1"
                                        >
                                            Wiedereröffnen
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setSelectedLagerplatz(lp.code)}
                                            className="btn btn-sm btn-primary flex-1"
                                        >
                                            Scannen
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredLagerplaetze.length === 0 && (
                    <div className="text-center py-8 text-base-content/50">
                        <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Keine Lagerplätze gefunden</p>
                    </div>
                )}
            </div>
        );
    }

    // Lagerplatz gewählt - Scan-Interface anzeigen
    const currentLagerplatz = lagerplaetze.find((lp) => lp.code === selectedLagerplatz);
    const unscannedCount = sollWaren.filter((w) => !w.gescannt).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => setSelectedLagerplatz(null)} className="btn btn-ghost btn-sm">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <MapPin className="w-6 h-6 text-primary" />
                            {selectedLagerplatz}
                        </h1>
                        {currentLagerplatz?.raum && (
                            <p className="text-base-content/70">{currentLagerplatz.raum}</p>
                        )}
                    </div>
                </div>
                <div className="badge badge-lg badge-primary gap-2">
                    {sollWaren.filter((w) => w.gescannt).length} / {sollWaren.length} gescannt
                </div>
            </div>

            {/* Barcode-Eingabe */}
            <div className="card bg-base-200">
                <div className="card-body">
                    <div className="flex gap-4">
                        <input
                            ref={barcodeInputRef}
                            type="text"
                            placeholder="Barcode scannen oder eingeben..."
                            className="input input-bordered input-lg flex-1"
                            value={barcode}
                            onChange={(e) => setBarcode(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isScanning}
                            autoFocus
                        />
                        <button
                            onClick={handleScan}
                            disabled={!barcode.trim() || isScanning}
                            className="btn btn-primary btn-lg"
                        >
                            {isScanning ? (
                                <span className="loading loading-spinner"></span>
                            ) : (
                                <ScanBarcode className="w-6 h-6" />
                            )}
                        </button>
                    </div>

                    {/* Letztes Scan-Ergebnis */}
                    {lastScanResult && (
                        <div
                            className={`alert mt-4 ${lastScanResult.success
                                ? lastScanResult.scanTyp === "ok"
                                    ? "alert-success"
                                    : "alert-warning"
                                : "alert-error"
                                }`}
                        >
                            {lastScanResult.success ? (
                                lastScanResult.scanTyp === "ok" ? (
                                    <CheckCircle className="w-5 h-5" />
                                ) : (
                                    <AlertTriangle className="w-5 h-5" />
                                )
                            ) : (
                                <XCircle className="w-5 h-5" />
                            )}
                            <span>{lastScanResult.message || lastScanResult.error}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Waren-Liste (SOLL + NEU gefunden) */}
            <div className="card bg-base-200">
                <div className="card-body">
                    <h2 className="card-title">
                        Waren an diesem Lagerplatz
                        {unscannedCount > 0 && (
                            <span className="badge badge-warning">{unscannedCount} offen</span>
                        )}
                        {sollWaren.filter(w => w.isNeu).length > 0 && (
                            <span className="badge badge-info">{sollWaren.filter(w => w.isNeu).length} neu gefunden</span>
                        )}
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Status</th>
                                    <th>Barcode</th>
                                    <th>Bezeichnung</th>
                                    <th>Temperatur</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Zuerst SOLL-Waren (nicht gescannt) */}
                                {sollWaren.filter(w => !w.isNeu && !w.gescannt).map((ware) => (
                                    <tr key={ware.id}>
                                        <td>
                                            <span className="badge badge-ghost gap-1">
                                                <Package className="w-3 h-3" />
                                                Offen
                                            </span>
                                        </td>
                                        <td className="font-mono">{ware.primarschluessel}</td>
                                        <td>{ware.bezeichnung || "-"}</td>
                                        <td>{ware.temperatur || "-"}</td>
                                    </tr>
                                ))}
                                {/* Dann gescannte SOLL-Waren */}
                                {sollWaren.filter(w => !w.isNeu && w.gescannt).map((ware) => (
                                    <tr key={ware.id} className="opacity-50">
                                        <td>
                                            {ware.scanTyp === "ok" ? (
                                                <span className="badge badge-success gap-1">
                                                    <CheckCircle className="w-3 h-3" />
                                                    OK
                                                </span>
                                            ) : (
                                                <span className="badge badge-warning gap-1">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    Falsch
                                                </span>
                                            )}
                                        </td>
                                        <td className="font-mono">{ware.primarschluessel}</td>
                                        <td>{ware.bezeichnung || "-"}</td>
                                        <td>{ware.temperatur || "-"}</td>
                                    </tr>
                                ))}
                                {/* Zuletzt NEU gefundene Waren */}
                                {sollWaren.filter(w => w.isNeu).map((ware) => (
                                    <tr key={ware.id} className="bg-info/10">
                                        <td>
                                            <span className="badge badge-info gap-1">
                                                <AlertTriangle className="w-3 h-3" />
                                                Neu gefunden
                                            </span>
                                        </td>
                                        <td className="font-mono">{ware.primarschluessel}</td>
                                        <td className="italic text-base-content/50">Nicht im SOLL</td>
                                        <td>-</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Bestätigungs-Button */}
                    <div className="mt-6 flex justify-end">
                        {isUeberprueft ? (
                            <div className={`alert ${fehlendeWarenCount && fehlendeWarenCount > 0 ? "alert-warning" : "alert-success"}`}>
                                <CheckCircle className="w-5 h-5" />
                                <div>
                                    <span className="font-bold">Lagerplatz wurde als überprüft markiert!</span>
                                    {fehlendeWarenCount !== null && fehlendeWarenCount > 0 && (
                                        <p className="text-sm mt-1">
                                            {fehlendeWarenCount} fehlende Ware(n) als Abweichung erfasst.
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={handleConfirmLagerplatz}
                                disabled={isConfirming}
                                className="btn btn-success btn-lg gap-2"
                            >
                                {isConfirming ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span>
                                        Wird bestätigt...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        Scan Lagerposition beendet
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

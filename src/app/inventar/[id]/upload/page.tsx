/**
 * Excel Upload Seite
 * ------------------
 * Ermöglicht den Upload einer Excel-Datei mit SOLL-Daten.
 * Die Datei wird geparst und die Daten in die Datenbank importiert.
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    Upload,
    FileSpreadsheet,
    CheckCircle,
    AlertCircle,
    ArrowRight,
    X,
    Download
} from "lucide-react";
import { uploadExcel, getInventarInfo, type UploadResult } from "./actions";

export default function UploadPage() {
    const router = useRouter();
    const params = useParams();
    const inventarId = params.id as string;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [inventarInfo, setInventarInfo] = useState<{
        id: string;
        erstelltAm: Date;
        erstelltVon: string;
        sollWarenCount: number;
        abgeschlossen: boolean;
    } | null>(null);

    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState<UploadResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Inventar-Infos laden
    useEffect(() => {
        async function loadInfo() {
            const info = await getInventarInfo(inventarId);
            setInventarInfo(info);
            setIsLoading(false);
        }
        loadInfo();
    }, [inventarId]);

    // Datei auswählen
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setResult(null);
        }
    };

    // Datei per Drag & Drop
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && (droppedFile.name.endsWith(".xlsx") || droppedFile.name.endsWith(".xls"))) {
            setFile(droppedFile);
            setResult(null);
        }
    };

    // Upload starten
    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setResult(null);

        const formData = new FormData();
        formData.append("file", file);

        const uploadResult = await uploadExcel(inventarId, formData);
        setResult(uploadResult);
        setIsUploading(false);

        // Bei Erfolg Inventar-Infos neu laden
        if (uploadResult.success) {
            const info = await getInventarInfo(inventarId);
            setInventarInfo(info);
        }
    };

    // Datei entfernen
    const handleRemoveFile = () => {
        setFile(null);
        setResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    if (!inventarInfo) {
        return (
            <div className="max-w-md mx-auto mt-12">
                <div className="card bg-base-200 shadow-xl">
                    <div className="card-body text-center">
                        <AlertCircle className="w-16 h-16 text-error mx-auto mb-4" />
                        <h1 className="text-2xl font-bold">Inventar nicht gefunden</h1>
                        <p className="text-base-content/70 mt-2">
                            Das angeforderte Inventar existiert nicht.
                        </p>
                        <div className="card-actions justify-center mt-4">
                            <button onClick={() => router.push("/")} className="btn btn-primary">
                                Zum Dashboard
                            </button>
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
                            <FileSpreadsheet className="w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold">SOLL-Daten importieren</h1>
                        <p className="text-base-content/70 mt-2">
                            Lade die Excel-Datei mit den SOLL-Daten aus dem LIMS hoch.
                        </p>
                    </div>

                    {/* Bereits importierte Daten */}
                    {inventarInfo.sollWarenCount > 0 && (
                        <div className="alert alert-success mb-4">
                            <CheckCircle className="w-5 h-5" />
                            <span>
                                Es wurden bereits <strong>{inventarInfo.sollWarenCount}</strong> SOLL-Waren importiert.
                                Ein erneuter Upload ersetzt die bestehenden Daten.
                            </span>
                        </div>
                    )}

                    {/* Erwartete Spalten */}
                    <div className="bg-base-100 rounded-lg p-4 mb-6">
                        <h2 className="font-semibold mb-2">Erwartete Spalten in der Excel-Datei:</h2>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="badge badge-primary badge-sm">Pflicht</span> Primärschlüssel / Barcode
                            </div>
                            <div>
                                <span className="badge badge-primary badge-sm">Pflicht</span> Lagerplatz / Standort
                            </div>
                            <div>
                                <span className="badge badge-ghost badge-sm">Optional</span> Raum
                            </div>
                            <div>
                                <span className="badge badge-ghost badge-sm">Optional</span> Bezeichnung
                            </div>
                            <div>
                                <span className="badge badge-ghost badge-sm">Optional</span> Temperatur
                            </div>
                            <div>
                                <span className="badge badge-ghost badge-sm">Optional</span> Ablaufdatum
                            </div>
                        </div>
                    </div>

                    {/* Drop-Zone */}
                    <div
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${file
                                ? "border-success bg-success/10"
                                : "border-base-300 hover:border-primary hover:bg-base-100"
                            }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        {file ? (
                            <div className="flex items-center justify-center gap-3">
                                <FileSpreadsheet className="w-8 h-8 text-success" />
                                <div className="text-left">
                                    <p className="font-medium">{file.name}</p>
                                    <p className="text-sm text-base-content/70">
                                        {(file.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveFile();
                                    }}
                                    className="btn btn-ghost btn-sm btn-circle"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <Upload className="w-12 h-12 text-base-content/30 mx-auto mb-3" />
                                <p className="font-medium">Excel-Datei hierher ziehen</p>
                                <p className="text-sm text-base-content/70 mt-1">
                                    oder klicken zum Auswählen (.xlsx, .xls)
                                </p>
                            </>
                        )}
                    </div>

                    {/* Ergebnis-Anzeige */}
                    {result && (
                        <div className={`alert mt-4 ${result.success ? "alert-success" : "alert-error"}`}>
                            {result.success ? (
                                <CheckCircle className="w-5 h-5" />
                            ) : (
                                <AlertCircle className="w-5 h-5" />
                            )}
                            <div>
                                {result.success ? (
                                    <>
                                        <p className="font-medium">Import erfolgreich!</p>
                                        <p className="text-sm">
                                            {result.imported} Waren importiert
                                            {result.skipped && result.skipped > 0 && `, ${result.skipped} übersprungen`}
                                        </p>
                                    </>
                                ) : (
                                    <p>{result.error}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Fehler-Details */}
                    {result?.errors && result.errors.length > 0 && (
                        <div className="mt-4 bg-base-100 rounded-lg p-4 max-h-40 overflow-y-auto">
                            <p className="font-medium text-warning mb-2">Übersprungene Zeilen:</p>
                            <ul className="text-sm space-y-1">
                                {result.errors.map((err, i) => (
                                    <li key={i} className="text-base-content/70">{err}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Aktionen */}
                    <div className="card-actions justify-between mt-6">
                        <button onClick={() => router.push("/")} className="btn btn-ghost">
                            Später
                        </button>
                        <div className="flex gap-2">
                            <button
                                onClick={handleUpload}
                                disabled={!file || isUploading}
                                className="btn btn-primary gap-2"
                            >
                                {isUploading ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span>
                                        Wird importiert...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-5 h-5" />
                                        Importieren
                                    </>
                                )}
                            </button>
                            {result?.success && (
                                <button
                                    onClick={() => router.push("/scan")}
                                    className="btn btn-success gap-2"
                                >
                                    Weiter zum Scannen
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

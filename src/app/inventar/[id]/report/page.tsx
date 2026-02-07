/**
 * Report-Seite
 * ------------
 * Zeigt eine Vorschau des Reports und ermöglicht den PDF-Download.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
    FileText,
    Download,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Package,
    ArrowLeft,
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import { getReportData, type ReportData } from "./actions";

// Dynamischer Import für @react-pdf/renderer (nur Client-Side)
const PDFDownloadLink = dynamic(
    () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
    { ssr: false, loading: () => <span className="loading loading-spinner loading-sm"></span> }
);
const InventarReportPDF = dynamic(
    () => import("./InventarReportPDF").then((mod) => mod.InventarReportPDF),
    { ssr: false }
);

export default function ReportPage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useUser();
    const inventarId = params.id as string;

    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Daten laden
    useEffect(() => {
        async function loadData() {
            const data = await getReportData(inventarId);
            setReportData(data);
            setIsLoading(false);
        }
        loadData();
    }, [inventarId]);

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

    if (!reportData) {
        return (
            <div className="text-center py-12">
                <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-warning" />
                <h2 className="text-2xl font-bold mb-2">Inventar nicht gefunden</h2>
            </div>
        );
    }

    const getTypLabel = (typ: string) => {
        switch (typ) {
            case "fehlend": return "Fehlend";
            case "falsch": return "Falscher Ort";
            case "neu": return "Neu gefunden";
            default: return typ;
        }
    };

    const getTypColor = (typ: string) => {
        switch (typ) {
            case "fehlend": return "badge-error";
            case "falsch": return "badge-warning";
            case "neu": return "badge-info";
            default: return "badge-ghost";
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="btn btn-ghost btn-circle">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-3xl font-bold">Inventar-Report</h1>
                </div>
                <PDFDownloadLink
                    document={<InventarReportPDF data={reportData} />}
                    fileName={`inventar-report-${new Date(reportData.inventar.erstelltAm).toISOString().split("T")[0]}.pdf`}
                >
                    {({ loading }) => (
                        <button className="btn btn-primary gap-2" disabled={loading}>
                            {loading ? (
                                <span className="loading loading-spinner loading-sm"></span>
                            ) : (
                                <Download className="w-5 h-5" />
                            )}
                            PDF herunterladen
                        </button>
                    )}
                </PDFDownloadLink>
            </div>

            {/* Inventar-Info */}
            <div className="card bg-base-200">
                <div className="card-body">
                    <h2 className="card-title">
                        <FileText className="w-5 h-5" />
                        Inventar-Details
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                            <p className="text-sm text-base-content/70">Erstellt am</p>
                            <p className="font-bold">
                                {new Date(reportData.inventar.erstelltAm).toLocaleDateString("de-CH")}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-base-content/70">Erstellt von</p>
                            <p className="font-bold">{reportData.inventar.erstelltVon}</p>
                        </div>
                        <div>
                            <p className="text-sm text-base-content/70">Status</p>
                            <p className="font-bold">
                                {reportData.inventar.abgeschlossenAm ? (
                                    <span className="text-success flex items-center gap-1">
                                        <CheckCircle className="w-4 h-4" />
                                        Abgeschlossen
                                    </span>
                                ) : (
                                    <span className="text-warning">Offen</span>
                                )}
                            </p>
                        </div>
                        {reportData.inventar.abgeschlossenAm && (
                            <div>
                                <p className="text-sm text-base-content/70">Abgeschlossen am</p>
                                <p className="font-bold">
                                    {new Date(reportData.inventar.abgeschlossenAm).toLocaleDateString("de-CH")}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Statistik */}
            <div className="card bg-base-200">
                <div className="card-body">
                    <h2 className="card-title">Statistik</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="stat bg-base-100 rounded-box p-4">
                            <div className="stat-title">SOLL-Waren</div>
                            <div className="stat-value text-2xl">{reportData.statistik.sollWaren}</div>
                        </div>
                        <div className="stat bg-base-100 rounded-box p-4">
                            <div className="stat-title">IST-Scans</div>
                            <div className="stat-value text-2xl">{reportData.statistik.istScans}</div>
                        </div>
                        <div className="stat bg-base-100 rounded-box p-4">
                            <div className="stat-title">Lagerplätze</div>
                            <div className="stat-value text-2xl">{reportData.statistik.lagerplaetze}</div>
                        </div>
                        <div className="stat bg-base-100 rounded-box p-4">
                            <div className="stat-title">Abweichungen</div>
                            <div className="stat-value text-2xl text-error">
                                {reportData.statistik.abweichungenTotal}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Abweichungen-Übersicht */}
            {reportData.statistik.abweichungenTotal > 0 && (
                <div className="card bg-base-200">
                    <div className="card-body">
                        <h2 className="card-title">
                            <AlertTriangle className="w-5 h-5 text-warning" />
                            Abweichungen ({reportData.statistik.abweichungenTotal})
                        </h2>

                        {/* Zusammenfassung */}
                        <div className="flex gap-4 mt-2">
                            {reportData.statistik.abweichungenFehlend > 0 && (
                                <span className="badge badge-error gap-1">
                                    <XCircle className="w-3 h-3" />
                                    {reportData.statistik.abweichungenFehlend} Fehlend
                                </span>
                            )}
                            {reportData.statistik.abweichungenFalsch > 0 && (
                                <span className="badge badge-warning gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    {reportData.statistik.abweichungenFalsch} Falscher Ort
                                </span>
                            )}
                            {reportData.statistik.abweichungenNeu > 0 && (
                                <span className="badge badge-info gap-1">
                                    <Package className="w-3 h-3" />
                                    {reportData.statistik.abweichungenNeu} Neu gefunden
                                </span>
                            )}
                        </div>

                        {/* Tabelle */}
                        <div className="overflow-x-auto mt-4">
                            <table className="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Typ</th>
                                        <th>Barcode</th>
                                        <th>Bezeichnung</th>
                                        <th>Lagerplatz</th>
                                        <th>Kommentar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.abweichungen.map((a, i) => (
                                        <tr key={i}>
                                            <td>
                                                <span className={`badge ${getTypColor(a.typ)} badge-sm`}>
                                                    {getTypLabel(a.typ)}
                                                </span>
                                            </td>
                                            <td className="font-mono text-sm">{a.primarschluessel}</td>
                                            <td>{a.bezeichnung || "-"}</td>
                                            <td>{a.lagerplatzCode || "-"}</td>
                                            <td className="text-sm">{a.kommentar || "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

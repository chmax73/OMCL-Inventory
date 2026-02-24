/**
 * Archiv-Seite
 * ------------
 * Zeigt alle archivierten Inventare an.
 * Ermöglicht den Zugriff auf Report und Abweichungen archivierter Inventare.
 */

// Force dynamic rendering
export const dynamic = "force-dynamic";

import Link from "next/link";
import { Archive, FileText, ListChecks, ArrowLeft, CheckCircle, Package, FlaskConical } from "lucide-react";
import { getArchivedInventarList } from "@/app/actions";

export default async function ArchivPage() {
    const inventare = await getArchivedInventarList();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/" className="btn btn-ghost btn-circle">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-2">
                    <Archive className="w-7 h-7" />
                    <h1 className="text-3xl font-bold">Archiv</h1>
                </div>
            </div>

            {/* Archivierte Inventare */}
            <div className="card bg-base-200 shadow-sm">
                <div className="card-body">
                    <h2 className="card-title">Archivierte Inventare</h2>

                    {inventare.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Typ</th>
                                        <th>Status</th>
                                        <th>Erstellt am</th>
                                        <th>Erstellt von</th>
                                        <th>SOLL / IST</th>
                                        <th>Aktionen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inventare.map((inv) => (
                                        <tr key={inv.id}>
                                            <td>
                                                {inv.typ === "MUSTER" ? (
                                                    <span className="badge badge-primary gap-1">
                                                        <Package className="w-3 h-3" />
                                                        Muster
                                                    </span>
                                                ) : (
                                                    <span className="badge badge-secondary gap-1">
                                                        <FlaskConical className="w-3 h-3" />
                                                        RM & Substanzen
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <span className="badge badge-success gap-1">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Abgeschlossen
                                                </span>
                                            </td>
                                            <td>{new Date(inv.erstelltAm).toLocaleDateString("de-CH")}</td>
                                            <td>{inv.erstelltVon}</td>
                                            <td>
                                                <span className="text-sm">{inv.istScans}/{inv.sollWaren}</span>
                                            </td>
                                            <td className="flex gap-2">
                                                <Link href={`/inventar/${inv.id}/report`} className="btn btn-sm btn-primary gap-1">
                                                    <FileText className="w-3 h-3" />
                                                    Report
                                                </Link>
                                                <Link href={`/inventar/${inv.id}/abweichungen`} className="btn btn-sm btn-warning gap-1">
                                                    <ListChecks className="w-3 h-3" />
                                                    Abweichungen
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-base-content/50">
                            <Archive className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>Noch keine archivierten Inventare</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

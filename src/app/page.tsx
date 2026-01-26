/**
 * Dashboard-Seite (Startseite)
 * ----------------------------
 * Zeigt eine Übersicht über laufende und abgeschlossene Inventare.
 * Dient als Einstiegspunkt für alle Benutzer.
 * 
 * Dies ist eine Server Component - Daten werden direkt aus der DB geladen.
 */

import Link from "next/link";
import { ClipboardPlus, ScanBarcode, AlertTriangle, CheckCircle, Lock, FileText } from "lucide-react";
import { getDashboardStats, getInventarList } from "./actions";

export default async function Dashboard() {
  // Daten parallel aus der Datenbank laden
  const [stats, inventare] = await Promise.all([
    getDashboardStats(),
    getInventarList(),
  ]);

  return (
    <div className="space-y-6">
      {/* Seitentitel */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link href="/inventar/neu" className="btn btn-primary">
          <ClipboardPlus className="w-5 h-5" />
          Neues Inventar
        </Link>
      </div>

      {/* Statistik-Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Offene Inventare */}
        <div className="stat bg-base-200 rounded-box">
          <div className="stat-figure text-warning">
            <ScanBarcode className="w-8 h-8" />
          </div>
          <div className="stat-title">Offene Inventare</div>
          <div className="stat-value text-warning">{stats.offeneInventare}</div>
          <div className="stat-desc">In Bearbeitung</div>
        </div>

        {/* Abgeschlossen */}
        <div className="stat bg-base-200 rounded-box">
          <div className="stat-figure text-success">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div className="stat-title">Abgeschlossen</div>
          <div className="stat-value text-success">{stats.abgeschlosseneInventare}</div>
          <div className="stat-desc">Dieses Jahr</div>
        </div>

        {/* Offene Abweichungen */}
        <div className="stat bg-base-200 rounded-box">
          <div className="stat-figure text-error">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="stat-title">Offene Abweichungen</div>
          <div className="stat-value text-error">{stats.offeneAbweichungen}</div>
          <div className="stat-desc">Zu klären</div>
        </div>

        {/* Heute gescannt */}
        <div className="stat bg-base-200 rounded-box">
          <div className="stat-figure text-info">
            <ScanBarcode className="w-8 h-8" />
          </div>
          <div className="stat-title">Heute gescannt</div>
          <div className="stat-value text-info">{stats.heuteGescannt}</div>
          <div className="stat-desc">Waren erfasst</div>
        </div>
      </div>

      {/* Aktuelle Inventare */}
      <div className="card bg-base-200 shadow-sm">
        <div className="card-body">
          <h2 className="card-title">Aktuelle Inventare</h2>

          {inventare.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Erstellt am</th>
                    <th>Erstellt von</th>
                    <th>Fortschritt</th>
                    <th>Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {inventare.map((inv) => {
                    const fortschritt = inv.sollWaren > 0
                      ? Math.round((inv.istScans / inv.sollWaren) * 100)
                      : 0;

                    return (
                      <tr key={inv.id}>
                        <td>
                          {inv.abgeschlossen ? (
                            <span className="badge badge-success gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Abgeschlossen
                            </span>
                          ) : (
                            <span className="badge badge-warning gap-1">
                              <ScanBarcode className="w-3 h-3" />
                              Offen
                            </span>
                          )}
                        </td>
                        <td>{new Date(inv.erstelltAm).toLocaleDateString("de-CH")}</td>
                        <td>{inv.erstelltVon}</td>
                        <td>
                          <progress
                            className={`progress w-24 ${inv.abgeschlossen ? "progress-success" : "progress-warning"}`}
                            value={fortschritt}
                            max="100"
                          ></progress>
                          <span className="ml-2 text-sm">{inv.istScans}/{inv.sollWaren}</span>
                        </td>
                        <td className="flex gap-2">
                          {inv.abgeschlossen ? (
                            <Link href={`/inventar/${inv.id}/report`} className="btn btn-sm btn-primary gap-1">
                              <FileText className="w-3 h-3" />
                              Report
                            </Link>
                          ) : (
                            <>
                              <Link href="/scan" className="btn btn-sm btn-primary">
                                Weiter scannen
                              </Link>
                              <Link href={`/inventar/${inv.id}/abschliessen`} className="btn btn-sm btn-success gap-1">
                                <Lock className="w-3 h-3" />
                                Abschliessen
                              </Link>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-base-content/50">
              <ClipboardPlus className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Noch keine Inventare vorhanden</p>
              <Link href="/inventar/neu" className="btn btn-primary btn-sm mt-4">
                Erstes Inventar erstellen
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

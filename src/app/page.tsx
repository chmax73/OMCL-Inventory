/**
 * Dashboard-Seite (Startseite)
 * ----------------------------
 * Zeigt eine Übersicht über laufende und abgeschlossene Inventare.
 * Getrennt nach Muster und Substanzen.
 * 
 * Dies ist eine Server Component - Daten werden direkt aus der DB geladen.
 */

// Force dynamic rendering - keine statische Generierung während Build
export const dynamic = "force-dynamic";

import Link from "next/link";
import { ClipboardPlus, ScanBarcode, AlertTriangle, CheckCircle, Lock, FileText, ListChecks, Archive, FlaskConical, Package } from "lucide-react";
import { getDashboardStats, getInventarList, type InventarListItem } from "./actions";
import ArchiveButton from "@/components/ArchiveButton";

// Wiederverwendbare Inventar-Tabelle für Muster und Substanzen
function InventarTabelle({ inventare, neuLink, label }: {
  inventare: InventarListItem[];
  neuLink: string;
  label: string;
}) {
  if (inventare.length === 0) {
    return (
      <div className="text-center py-8 text-base-content/50">
        <ClipboardPlus className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>Noch keine {label}-Inventare vorhanden</p>
        <Link href={neuLink} className="btn btn-primary btn-sm mt-4">
          Erstes {label}-Inventar erstellen
        </Link>
      </div>
    );
  }

  return (
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
                    <>
                      <Link href={`/inventar/${inv.id}/report`} className="btn btn-sm btn-primary gap-1">
                        <FileText className="w-3 h-3" />
                        Report
                      </Link>
                      <Link href={`/inventar/${inv.id}/abweichungen`} className="btn btn-sm btn-warning gap-1">
                        <ListChecks className="w-3 h-3" />
                        Abweichungen
                      </Link>
                      <ArchiveButton inventarId={inv.id} />
                    </>
                  ) : (
                    <>
                      <Link href={`/scan?inventarId=${inv.id}`} className="btn btn-sm btn-primary">
                        Weiter scannen
                      </Link>
                      <Link href={`/inventar/${inv.id}/abweichungen`} className="btn btn-sm btn-warning gap-1">
                        <ListChecks className="w-3 h-3" />
                        Abweichungen
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
  );
}

export default async function Dashboard() {
  // Daten parallel aus der Datenbank laden (Muster + Substanzen getrennt)
  const [stats, musterInventare, substanzenInventare] = await Promise.all([
    getDashboardStats(),
    getInventarList("MUSTER"),
    getInventarList("SUBSTANZEN"),
  ]);

  return (
    <div className="space-y-6">
      {/* Seitentitel */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link href="/archiv" className="btn btn-ghost gap-1">
          <Archive className="w-5 h-5" />
          Archiv
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

      {/* Muster-Inventare */}
      <div className="card bg-base-200 shadow-sm">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <h2 className="card-title gap-2">
              <Package className="w-5 h-5 text-primary" />
              Muster-Inventare
            </h2>
            <Link href="/inventar/neu?typ=MUSTER" className="btn btn-sm btn-primary gap-1">
              <ClipboardPlus className="w-4 h-4" />
              Neues Muster-Inventar
            </Link>
          </div>
          <InventarTabelle inventare={musterInventare} neuLink="/inventar/neu?typ=MUSTER" label="Muster" />
        </div>
      </div>

      {/* RM & Substanzen-Inventare */}
      <div className="card bg-base-200 shadow-sm">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <h2 className="card-title gap-2">
              <FlaskConical className="w-5 h-5 text-secondary" />
              RM & Substanzen-Inventare
            </h2>
            <Link href="/inventar/neu?typ=SUBSTANZEN" className="btn btn-sm btn-secondary gap-1">
              <ClipboardPlus className="w-4 h-4" />
              Neues RM & Substanzen-Inventar
            </Link>
          </div>
          <InventarTabelle inventare={substanzenInventare} neuLink="/inventar/neu?typ=SUBSTANZEN" label="RM & Substanzen" />
        </div>
      </div>
    </div>
  );
}

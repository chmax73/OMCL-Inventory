/**
 * Inventar Report PDF
 * -------------------
 * React-PDF Komponente für den Inventar-Report.
 */

"use client";

import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
} from "@react-pdf/renderer";
import { type ReportData } from "./actions";

// Styles für das PDF
const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: "Helvetica",
    },
    header: {
        marginBottom: 20,
        borderBottom: "1px solid #333",
        paddingBottom: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 12,
        color: "#666",
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "bold",
        marginBottom: 10,
        backgroundColor: "#f0f0f0",
        padding: 5,
    },
    row: {
        flexDirection: "row",
        marginBottom: 5,
    },
    label: {
        width: 120,
        color: "#666",
    },
    value: {
        flex: 1,
        fontWeight: "bold",
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginBottom: 10,
    },
    statBox: {
        width: "25%",
        padding: 10,
        backgroundColor: "#f5f5f5",
        marginRight: 5,
        marginBottom: 5,
    },
    statLabel: {
        fontSize: 8,
        color: "#666",
        marginBottom: 2,
    },
    statValue: {
        fontSize: 16,
        fontWeight: "bold",
    },
    table: {
        marginTop: 10,
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#e0e0e0",
        padding: 5,
        fontWeight: "bold",
        fontSize: 9,
    },
    tableRow: {
        flexDirection: "row",
        borderBottom: "0.5px solid #ddd",
        padding: 5,
        fontSize: 9,
    },
    tableRowAlt: {
        flexDirection: "row",
        borderBottom: "0.5px solid #ddd",
        padding: 5,
        fontSize: 9,
        backgroundColor: "#fafafa",
    },
    colTyp: { width: "15%" },
    colBarcode: { width: "20%" },
    colBezeichnung: { width: "25%" },
    colLagerplatz: { width: "15%" },
    colKommentar: { width: "25%" },
    footer: {
        position: "absolute",
        bottom: 30,
        left: 40,
        right: 40,
        fontSize: 8,
        color: "#999",
        textAlign: "center",
    },
    badge: {
        padding: "2px 5px",
        borderRadius: 3,
        fontSize: 8,
    },
    badgeError: {
        backgroundColor: "#fecaca",
        color: "#991b1b",
    },
    badgeWarning: {
        backgroundColor: "#fef3c7",
        color: "#92400e",
    },
    badgeInfo: {
        backgroundColor: "#dbeafe",
        color: "#1e40af",
    },
});

// Typ-Label Helper
function getTypLabel(typ: string): string {
    switch (typ) {
        case "fehlend": return "Fehlend";
        case "falsch": return "Falscher Ort";
        case "neu": return "Neu gefunden";
        default: return typ;
    }
}

// PDF-Komponente
export function InventarReportPDF({ data }: { data: ReportData }) {
    const erstelltAm = new Date(data.inventar.erstelltAm).toLocaleDateString("de-CH");
    const abgeschlossenAm = data.inventar.abgeschlossenAm
        ? new Date(data.inventar.abgeschlossenAm).toLocaleDateString("de-CH")
        : null;
    const generatedAt = new Date().toLocaleString("de-CH");

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>OMCL Inventar-Report</Text>
                    <Text style={styles.subtitle}>
                        Erstellt am {erstelltAm} von {data.inventar.erstelltVon}
                    </Text>
                </View>

                {/* Status */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Inventar-Details</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Status:</Text>
                        <Text style={styles.value}>
                            {data.inventar.abgeschlossenAm ? "Abgeschlossen" : "Offen"}
                        </Text>
                    </View>
                    {abgeschlossenAm && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Abgeschlossen am:</Text>
                            <Text style={styles.value}>{abgeschlossenAm}</Text>
                        </View>
                    )}
                </View>

                {/* Statistik */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Statistik</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>SOLL-Waren</Text>
                            <Text style={styles.statValue}>{data.statistik.sollWaren}</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>IST-Scans</Text>
                            <Text style={styles.statValue}>{data.statistik.istScans}</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Lagerplätze</Text>
                            <Text style={styles.statValue}>{data.statistik.lagerplaetze}</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Abweichungen</Text>
                            <Text style={[styles.statValue, { color: "#dc2626" }]}>
                                {data.statistik.abweichungenTotal}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Fehlend:</Text>
                        <Text style={styles.value}>{data.statistik.abweichungenFehlend}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Falscher Ort:</Text>
                        <Text style={styles.value}>{data.statistik.abweichungenFalsch}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Neu gefunden:</Text>
                        <Text style={styles.value}>{data.statistik.abweichungenNeu}</Text>
                    </View>
                </View>

                {/* Abweichungen-Tabelle */}
                {data.abweichungen.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            Abweichungen ({data.abweichungen.length})
                        </Text>
                        <View style={styles.table}>
                            {/* Header */}
                            <View style={styles.tableHeader}>
                                <Text style={styles.colTyp}>Typ</Text>
                                <Text style={styles.colBarcode}>Barcode</Text>
                                <Text style={styles.colBezeichnung}>Bezeichnung</Text>
                                <Text style={styles.colLagerplatz}>Lagerplatz</Text>
                                <Text style={styles.colKommentar}>Kommentar</Text>
                            </View>
                            {/* Rows */}
                            {data.abweichungen.map((a, i) => (
                                <View
                                    key={i}
                                    style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
                                >
                                    <Text style={styles.colTyp}>{getTypLabel(a.typ)}</Text>
                                    <Text style={styles.colBarcode}>{a.primarschluessel}</Text>
                                    <Text style={styles.colBezeichnung}>{a.bezeichnung || "-"}</Text>
                                    <Text style={styles.colLagerplatz}>{a.lagerplatzCode || "-"}</Text>
                                    <Text style={styles.colKommentar}>{a.kommentar || "-"}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Footer */}
                <Text style={styles.footer}>
                    Report generiert am {generatedAt} | OMCL Inventur Tool
                </Text>
            </Page>
        </Document>
    );
}

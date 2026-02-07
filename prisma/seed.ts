/**
 * Prisma Seed Script
 * ------------------
 * Dieses Skript erstellt Testdaten für die Entwicklungsumgebung.
 * Es wird mit `npx prisma db seed` ausgeführt.
 */

import { PrismaClient, UserRole, WareTyp, ScanTyp, AbweichungTyp } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import path from "path";

// Lade Umgebungsvariablen aus .env.local
config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });

// Prisma 7: Driver Adapter für PostgreSQL
const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL
});
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Starte Seeding...");

    // -------------------------------------------------------------------------
    // 1. Benutzer erstellen
    // -------------------------------------------------------------------------
    console.log("👤 Erstelle Benutzer...");

    const adminUser = await prisma.user.create({
        data: {
            name: "Anna Admin",
            rolle: UserRole.admin,
        },
    });

    const verantwortlicherUser = await prisma.user.create({
        data: {
            name: "Viktor Verantwortlich",
            rolle: UserRole.verantwortlich,
        },
    });

    const normalUser = await prisma.user.create({
        data: {
            name: "Urs User",
            rolle: UserRole.user,
        },
    });

    console.log(`   ✓ ${adminUser.name} (Admin)`);
    console.log(`   ✓ ${verantwortlicherUser.name} (Verantwortlich)`);
    console.log(`   ✓ ${normalUser.name} (User)`);

    // -------------------------------------------------------------------------
    // 2. Inventar erstellen
    // -------------------------------------------------------------------------
    console.log("📋 Erstelle Inventar...");

    const inventar = await prisma.inventar.create({
        data: {
            erstelltVonId: verantwortlicherUser.id,
            abgeschlossen: false,
        },
    });

    console.log(`   ✓ Inventar erstellt (ID: ${inventar.id.substring(0, 8)}...)`);

    // -------------------------------------------------------------------------
    // 3. SOLL-Waren (aus LIMS-Export)
    // -------------------------------------------------------------------------
    console.log("📦 Erstelle SOLL-Waren...");

    const sollWaren = [
        // Muster
        {
            inventarId: inventar.id,
            typ: WareTyp.muster,
            primarschluessel: "M-022272",
            lagerplatzCode: "0001",
            raum: "Raum 101",
            bezeichnung: "Aspirin Tabletten 500mg",
            temperatur: "15-25°C",
            expDatum: new Date("2025-06-30"),
        },
        {
            inventarId: inventar.id,
            typ: WareTyp.muster,
            primarschluessel: "M-022273",
            lagerplatzCode: "0001",
            raum: "Raum 101",
            bezeichnung: "Ibuprofen Kapseln 400mg",
            temperatur: "15-25°C",
            expDatum: new Date("2025-08-15"),
        },
        {
            inventarId: inventar.id,
            typ: WareTyp.muster,
            primarschluessel: "M-022274",
            lagerplatzCode: "0002",
            raum: "Raum 101",
            bezeichnung: "Paracetamol Sirup 200ml",
            temperatur: "15-25°C",
            expDatum: new Date("2024-12-31"),
        },
        {
            inventarId: inventar.id,
            typ: WareTyp.muster,
            primarschluessel: "M-022275",
            lagerplatzCode: "0003",
            raum: "Raum 102",
            bezeichnung: "Vitamin D3 Tropfen",
            temperatur: "2-8°C",
            expDatum: new Date("2025-03-20"),
        },
        // Substanzen
        {
            inventarId: inventar.id,
            typ: WareTyp.substanz,
            primarschluessel: "S-0009-001",
            lagerplatzCode: "0010",
            raum: "Raum 201",
            bezeichnung: "Referenzstandard Acetylsalicylsäure",
            temperatur: "-20°C",
            expDatum: new Date("2026-01-15"),
        },
        {
            inventarId: inventar.id,
            typ: WareTyp.substanz,
            primarschluessel: "S-0009-002",
            lagerplatzCode: "0010",
            raum: "Raum 201",
            bezeichnung: "Referenzstandard Ibuprofen",
            temperatur: "-20°C",
            expDatum: new Date("2026-02-28"),
        },
        {
            inventarId: inventar.id,
            typ: WareTyp.substanz,
            primarschluessel: "S-0009-003",
            lagerplatzCode: "0011",
            raum: "Raum 201",
            bezeichnung: "Referenzstandard Paracetamol",
            temperatur: "-20°C",
            expDatum: new Date("2025-11-30"),
        },
    ];

    for (const ware of sollWaren) {
        await prisma.wareSoll.create({ data: ware });
    }

    console.log(`   ✓ ${sollWaren.length} SOLL-Waren erstellt`);

    // -------------------------------------------------------------------------
    // 4. IST-Scans (simulierte Barcode-Scans)
    // -------------------------------------------------------------------------
    console.log("📱 Erstelle IST-Scans...");

    const istScans = [
        // Korrekte Scans
        {
            inventarId: inventar.id,
            primarschluessel: "M-022272",
            lagerplatzCode: "0001",
            userId: normalUser.id,
            scanTyp: ScanTyp.ok,
        },
        {
            inventarId: inventar.id,
            primarschluessel: "M-022273",
            lagerplatzCode: "0001",
            userId: normalUser.id,
            scanTyp: ScanTyp.ok,
        },
        // Falsche Position
        {
            inventarId: inventar.id,
            primarschluessel: "M-022275",
            lagerplatzCode: "0002", // Sollte in 0003 sein!
            userId: normalUser.id,
            scanTyp: ScanTyp.falsch,
        },
        // Unbekannte Ware (nicht im SOLL)
        {
            inventarId: inventar.id,
            primarschluessel: "M-099999",
            lagerplatzCode: "0001",
            userId: normalUser.id,
            scanTyp: ScanTyp.neu,
        },
    ];

    for (const scan of istScans) {
        await prisma.wareIst.create({ data: scan });
    }

    console.log(`   ✓ ${istScans.length} IST-Scans erstellt`);

    // -------------------------------------------------------------------------
    // 5. Abweichungen
    // -------------------------------------------------------------------------
    console.log("⚠️  Erstelle Abweichungen...");

    const abweichungen = [
        {
            inventarId: inventar.id,
            primarschluessel: "M-022274",
            typ: AbweichungTyp.fehlend,
            kommentar: null,
            bestaetigtDurchId: null,
        },
        {
            inventarId: inventar.id,
            primarschluessel: "M-022275",
            typ: AbweichungTyp.falsch,
            kommentar: "Wurde in Lagerplatz 0002 statt 0003 gefunden",
            bestaetigtDurchId: null,
        },
        {
            inventarId: inventar.id,
            primarschluessel: "M-099999",
            typ: AbweichungTyp.neu,
            kommentar: "Unbekanntes Muster, nicht im LIMS erfasst",
            bestaetigtDurchId: null,
        },
    ];

    for (const abw of abweichungen) {
        await prisma.abweichung.create({ data: abw });
    }

    console.log(`   ✓ ${abweichungen.length} Abweichungen erstellt`);

    // -------------------------------------------------------------------------
    // 6. Audit Trail
    // -------------------------------------------------------------------------
    console.log("📝 Erstelle Audit Trail...");

    const auditEntries = [
        {
            userId: verantwortlicherUser.id,
            aktion: "inventar_erstellt",
            entitaet: "inventar",
            referenzId: inventar.id,
            inventarId: inventar.id,
            details: JSON.stringify({ erstellt_von: verantwortlicherUser.name }),
        },
        {
            userId: normalUser.id,
            aktion: "scan_durchgefuehrt",
            entitaet: "ware_ist",
            referenzId: null,
            inventarId: inventar.id,
            details: JSON.stringify({ anzahl_scans: 4 }),
        },
    ];

    for (const entry of auditEntries) {
        await prisma.auditTrail.create({ data: entry });
    }

    console.log(`   ✓ ${auditEntries.length} Audit-Einträge erstellt`);

    // -------------------------------------------------------------------------
    // Zusammenfassung
    // -------------------------------------------------------------------------
    console.log("\n✅ Seeding abgeschlossen!");
    console.log("   Erstellt:");
    console.log("   - 3 Benutzer");
    console.log("   - 1 Inventar");
    console.log(`   - ${sollWaren.length} SOLL-Waren`);
    console.log(`   - ${istScans.length} IST-Scans`);
    console.log(`   - ${abweichungen.length} Abweichungen`);
    console.log(`   - ${auditEntries.length} Audit-Einträge`);
}

main()
    .catch((e) => {
        console.error("❌ Fehler beim Seeding:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

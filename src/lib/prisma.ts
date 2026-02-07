/**
 * Prisma Client Singleton (Prisma 7)
 * ----------------------------------
 * Diese Datei stellt sicher, dass in der Entwicklungsumgebung nur eine
 * Prisma-Client-Instanz erstellt wird (Hot Reloading würde sonst viele
 * Verbindungen öffnen).
 * 
 * In Prisma 7 wird ein Driver Adapter für die Datenbankverbindung benötigt.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// SSL-Zertifikatsprüfung für Supabase deaktivieren (selbstsignierte Zertifikate)
if (process.env.NODE_ENV !== "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

// Globale Variable für den Prisma Client (nur in Development)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Erstelle Driver Adapter für PostgreSQL
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
});

// Erstelle oder verwende existierende Prisma-Instanz
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

// In Development: Speichere Client global, um Hot Reload zu überleben
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;

/**
 * Prisma Client Singleton
 * -----------------------
 * Diese Datei stellt sicher, dass in der Entwicklungsumgebung nur eine
 * Prisma-Client-Instanz erstellt wird (Hot Reloading würde sonst viele
 * Verbindungen öffnen).
 */

import { PrismaClient } from "@/generated/prisma";

// Globale Variable für den Prisma Client (nur in Development)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Erstelle oder verwende existierende Prisma-Instanz
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// In Development: Speichere Client global, um Hot Reload zu überleben
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;

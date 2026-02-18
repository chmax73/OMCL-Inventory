// =============================================================================
// Prisma 7 Konfiguration für OMCL Inventur Tool
// =============================================================================
// Diese Datei konfiguriert die Datenbankverbindung für Prisma CLI.
// =============================================================================

import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});

/**
 * Baut die SSL-Einstellungen fuer die Supabase-Datenbankverbindung.
 * Ohne CA gilt die bisherige DB-Ausnahme nur fuer Postgres, nicht fuer andere HTTPS-Aufrufe.
 */

export function getPostgresPoolConfig(databaseUrl: string | undefined, caCertificate?: string) {
    if (!databaseUrl) throw new Error("DATABASE_URL fehlt.");

    const url = new URL(databaseUrl);
    if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
        throw new Error("DATABASE_URL muss eine PostgreSQL-Adresse sein.");
    }
    if (["sslcert", "sslkey", "sslrootcert"].some((key) => url.searchParams.has(key))) {
        throw new Error("SSL-Zertifikate bitte nicht in DATABASE_URL und Pool-Konfiguration mischen.");
    }

    // pg-connection-string ueberschreibt sonst die SSL-Optionen des Pools.
    url.searchParams.delete("sslmode");
    const ca = caCertificate?.replace(/\\n/g, "\n").trim();

    return {
        connectionString: url.toString(),
        ssl: ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: false },
        max: 1,
    };
}

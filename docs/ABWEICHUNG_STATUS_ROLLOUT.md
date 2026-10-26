<!--
  Datenerhaltender Ablauf fuer den neuen Status von Abweichungen.
  Die SQL-Anweisungen werden nicht automatisch ausgefuehrt.
-->

# Abweichungsstatus ohne Datenverlust

Die App braucht vor einem Deployment eine neue Spalte `abweichung.status`.
Der im bestehenden `SCHEMA_RESET_WORKFLOW.md` beschriebene Reset loescht
saemtliche Inventurdaten und ist **nicht** fuer die laufende Datenbank geeignet.

Vor dem Ausfuehren: Datenbank-Backup erstellen, ein Wartungsfenster vereinbaren
und bestaetigen, dass die Ziel-Datenbank die richtige Supabase-Datenbank ist.
Die folgende einmalige, additive SQL-Aenderung erhaelt bestehende Abweichungen
und setzt zuvor bestaetigte Eintraege auf `bestaetigt`.
Sie ist nur nach ausdruecklicher Freigabe auszufuehren:

```sql
BEGIN;
CREATE TYPE "AbweichungStatus" AS ENUM ('offen', 'bestaetigt', 'verworfen');
ALTER TABLE "abweichung"
  ADD COLUMN "status" "AbweichungStatus" NOT NULL DEFAULT 'offen';
UPDATE "abweichung"
  SET "status" = 'bestaetigt'
  WHERE "bestaetigt_am" IS NOT NULL;
COMMIT;
```

Danach lesend kontrollieren:

```sql
SELECT status, count(*) FROM "abweichung" GROUP BY status ORDER BY status;
SELECT count(*) AS inkonsistent
FROM "abweichung"
WHERE (status = 'bestaetigt') <> ("bestaetigt_am" IS NOT NULL);
```

`inkonsistent` muss 0 sein. Erst dann den neuen Code deployen. Die
Prisma-Client-Generierung (`npm run build`) ersetzt diese Datenbank-Aenderung
nicht. Ein Rollback erfordert einen separat geplanten Restore: Sobald
`verworfen` verwendet wird, duerfen Statusdaten nicht stillschweigend
geloescht werden.

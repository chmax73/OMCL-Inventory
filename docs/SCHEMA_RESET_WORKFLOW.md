# Schema Reset Workflow

Dieser Workflow beschreibt, wie du das Datenbankschema zurücksetzt und neu aufsetzt.

## Voraussetzungen

1. Supabase-Projekt ist eingerichtet
2. `.env.local` enthält die korrekten Verbindungsdaten (`DATABASE_URL` und `DIRECT_DATABASE_URL`)

## Workflow

### 1. Testdaten prüfen

Stelle sicher, dass `prisma/seed.ts` sinnvolle Testdaten erstellt.

### 2. Team informieren

⚠️ **Wichtig**: Falls du und deine Team-Kolleg:innen dieselbe Datenbank nutzen, sprecht euch vorher ab! Alle Daten werden gelöscht.

### 3. Migrations-Ordner löschen (falls vorhanden)

```bash
rm -rf prisma/migrations
```

### 4. Schema pushen

```bash
npx prisma db push --force-reset
```

Dieser Befehl:
- Setzt die Datenbank komplett zurück (alle Daten werden gelöscht!)
- Erstellt alle Tabellen gemäss `prisma/schema.prisma`

### 5. Testdaten einspielen

```bash
npx prisma db seed
```

### 6. Prisma Client generieren

```bash
npx prisma generate
```

## Prisma Studio

Um die Datenbank im Browser anzuschauen:

```bash
npx prisma studio
```

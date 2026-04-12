# ESG Calculator Prototype (React + Vite + Supabase)

Dieses Projekt ist ein produktnaher ESG-Prototyp mit:

- **Betroffenheits-Check**
- **Login/Registrierung (Supabase Auth)**
- **Meine Unternehmensdaten** (persistiert pro Nutzer in DB)
- **Mein ESG-Ergebnis** (KPI, Trend, Branchenvergleich, Statistik)
- **Verlaufsprotokoll** (Audit-Log aus DB)

## Freemium-Flow

- **Öffentlich ohne Login:** Start, Betroffenheits-Check, Betroffenheits-Ergebnis.
- **Geschützt nach Login:** Unternehmensdaten, ESG-Ergebnis, Konkurrenzvergleich, Verlaufsprotokoll.
- Wenn der Check „direkt/indirekt betroffen" ergibt, erscheint eine CTA zur Freischaltung der Vollanalyse.
- Session bleibt bei Reload erhalten (Supabase Session Handling).

## Setup

1. Abhängigkeiten installieren.
2. `.env.example` nach `.env` kopieren und Supabase-Werte eintragen.
3. SQL-Schema und Seed in Supabase ausführen.
4. App starten.

### `.env` konfigurieren

In `.env` müssen folgende Werte gesetzt sein:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` **oder** `VITE_SUPABASE_PUBLISHABLE_KEY`

Hinweis: Im Frontend **nur** den anon/public key verwenden.
Wichtig: Nach Änderungen an `.env` den Vite-Dev-Server neu starten.

## Datenbank (Supabase)

### 1) Schema ausführen

Datei: `supabase_schema.sql`

Erstellt Tabellen:

- `companies`
- `esg_records`
- `audit_log`
- `industry_benchmarks`

### Nutzergebundene Daten

- `companies.user_id` verweist auf `auth.users.id`.
- Jeder eingeloggte Nutzer sieht nur eigene Unternehmen, ESG-Records und Audit-Logs.
- Die RLS-Policies in `supabase_schema.sql` sind auf `auth.uid()` ausgerichtet.

### Konkurrenzvergleich: realistische Branchenabweichungen

- Da Unternehmensdaten nutzergebunden sind, kann ein Live-Branchenschnitt bei wenigen eigenen Datensätzen sonst identisch mit dem eigenen Wert ausfallen.
- Deshalb nutzt die App für den Konkurrenzvergleich eine öffentliche Referenztabelle `industry_score_benchmarks` (seedbar, anonymisiert).
- Wenn genügend robuste Live-Daten vorliegen (mind. 2 Unternehmen, mind. 3 Records, erkennbare Varianz), wird weiterhin der Live-Schnitt verwendet.

### 2) Seed ausführen

Datei: `supabase_seed.sql`

Seed enthält:

- Branchenbenchmarks
- Demo-Unternehmen
- ESG-Historie (mehrere Records)
- Audit-Logs

Damit sind Dashboard-Statistiken sofort sichtbar.

## Architektur (vereinfacht)

```text
src/
	components/   -> UI-Bausteine (Tabellen, Charts, KPI-Elemente)
	pages/        -> Hauptseiten (Dashboard, AuditLog, CompanyData, ...)
	services/     -> DB-Zugriff (Supabase)
	lib/          -> Berechnung + Analytics Utilities
	hooks/        -> useEsgData (State + Orchestrierung)
```

### Wichtige Dateien

- `src/hooks/useEsgData.js`: zentrale Orchestrierung (laden, speichern, berechnen, analytics)
- `src/services/esgService.js`: Persistenz, Benchmarks, Branchenstatistik
- `src/lib/esgEngine.js`: ESG-Scoring + Benchmark-Statuslogik
- `src/lib/analytics.js`: KPI-/Trend-Aggregationen
- `src/pages/Login.jsx` / `src/pages/Register.jsx`: Auth-UI

## Features im Ergebnis-Dashboard

- KPI-Karten:
	- aktueller ESG-Score
	- Differenz zur letzten Berechnung
	- Differenz zum Branchenmittel
	- Risikostatus
	- Anzahl gespeicherter Reports
- Benchmark-Vergleich je Kennzahl (über / unter / nahe)
- Verlauf des ESG-Scores über gespeicherte Datensätze
- E/S/G-Vergleich inkl. best/worst Teilbereich
- Maßnahmen-Priorisierung

## Fallback-Verhalten ohne Supabase

Wenn keine `VITE_SUPABASE_*`-Werte gesetzt sind, nutzt die App Demo-Daten im Service-Layer.
So bleibt der Prototyp lokal funktionsfähig, bis Supabase verbunden ist.

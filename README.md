# ESG Calculator Prototype (React + Vite + Supabase)

Dieses Projekt ist ein produktnaher ESG-Prototyp mit:

- **Betroffenheits-Check**
- **Login/Registrierung (Supabase Auth)**
- **Unternehmensdaten** (persistiert pro Nutzer in DB)
- **ESG-Auswertung** (persistiert, mit Trend, Benchmark-Vergleich und Handlungsempfehlungen)
- **Audit-Log** (verfolgt jede Neuberechnung)

## Freemium-Flow

- **Öffentlich ohne Login:** Startseite, Betroffenheits-Check.
- **Geschützt nach Login:** Unternehmensdaten, ESG-Analyse, Konkurrenzbenchmark, Audit-Log.
- Session bleibt bei Reload erhalten (Supabase Session Handling).

## Setup

1. Abhängigkeiten installieren:
   - `npm install`
2. `.env.example` nach `.env` kopieren und Supabase-Werte eintragen.
3. `supabase_schema.sql` in Supabase ausführen.
4. `supabase_seed.sql` in Supabase ausführen.
5. App starten mit `npm run dev`.

### `.env` konfigurieren

In `.env` müssen folgende Werte gesetzt sein:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Hinweis: Im Frontend **nur** den anon/public Key verwenden.
Nach Änderungen an `.env` den Vite-Dev-Server neu starten.

## Datenbank (Supabase)

### 1) Schema ausführen

Datei: `supabase_schema.sql`

Erstellt Tabellen:

- `public.users`
- `public.companies`
- `public.esg_results`
- `public.audit_logs`
- `public.benchmarks`

### Nutzergebundene Daten

- `companies.user_id` verweist auf `public.users.id`.
- Nur authentifizierte Nutzer sehen ihre eigene Firma.
- `esg_results` und `audit_logs` werden nur für die jeweiligen Firmen des Nutzers gelesen.
- RLS-Policies in `supabase_schema.sql` sind auf `auth.uid()` ausgerichtet.

### Dynamische Benchmarks

- Die App lädt Benchmark-Werte dynamisch aus `public.benchmarks`.
- Zusätzlich berücksichtigt sie die Unternehmensgröße über `company_size_category`.
- Die Benchmark-Tabelle kann im Supabase-Dashboard gepflegt werden.

### Branchenstatistik

- Live-Statistiken werden aus `esg_results` und der Branchenzuordnung der Firmen berechnet.

### 2) Seed ausführen

Datei: `supabase_seed.sql`

Seed enthält:

- Branchenbenchmarks für verschiedene Unternehmensgrößen
- Beispielwerte zur sofort sichtbaren Dashboard-Auswertung

## Architektur (vereinfacht)

```text
src/
  components/   -> UI-Komponenten (Tabellen, Charts, KPI-Karten)
  pages/        -> Seiten (Dashboard, CompanyData, AuditLog, CompetitionBenchmark)
  services/     -> Supabase-API-Abstraktion
  lib/          -> ESG-Logik + Analytics-Funktionen
  hooks/        -> useEsgData (State-Management, Datenfluss)
```

### Wichtige Dateien

- `src/hooks/useEsgData.js`: zentrale Orchestrierung von Lade-, Berechnungs- und Speicherprozessen
- `src/services/esgService.js`: alle Supabase-Abfragen, Benchmark- und Statistik-APIs
- `src/lib/esgEngine.js`: ESG-Scoring, Benchmark-Normalisierung, Empfehlungsgenerator
- `src/lib/calculations.js`: Trend- und Branchenanalyse-Aggregationen
- `src/pages/CompanyData.jsx`: Eingabemaske für ESG-Daten
- `src/pages/Dashboard.jsx`: Ergebnisdashboard mit Score, Trends und Benchmark-Vergleich

## ESG-Score-Logik

Der Score kombiniert drei Bereiche und basiert ausschließlich auf Unternehmensdaten
und dynamisch geladenen Benchmarks aus der Datenbank (`public.benchmarks`). Fehlen
Benchmark-Daten, wird die Berechnung abgebrochen und ein Fehler angezeigt — es
gibt keine versteckten Demo- oder Default-Werte in der Produktionslogik.

Teilbereiche und verwendete Metriken:
- Environmental (E): CO₂-Intensität (t / Mio. €), Energieintensität (MWh / Mio. €), Anteil erneuerbarer Energie (%), Recyclingquote (%)
- Social (S): Diversitätsquote (%), Mitarbeiterfluktuation (%), Mitarbeiterzufriedenheit (%), Weiterbildungs-/Sozialfaktor (falls vorhanden)
- Governance (G): Datenschutzscore (%), Compliance-/Rechtsvorfälle (Anzahl), Board Independence (%), Governance-Policies (% / Indikator)

Konkrete Gewichtungen (zentral im Code konfiguriert):

Environmental (Teilscores):
- CO₂: 35%
- Energie: 25%
- Erneuerbare Energie: 20%
- Recycling: 20%

Social (Teilscores):
- Diversität: 25%
- Fluktuation: 25%
- Zufriedenheit: 30%
- Weiterbildung/Sozialfaktor: 20%

Governance (Teilscores):
- Datenschutz: 35%
- Compliance Incidents: 30%
- Board Independence/Transparenz: 25%
- Governance Policies: 10%

Gesamtscore:
- Environmental: 40%
- Social: 30%
- Governance: 30%

Formel-Übersicht (vereinfacht):

1. Für jede Kennzahl wird ein 0–100 Wert berechnet, indem die Abweichung zur
  Branchenreferenz in eine Punkteskala überführt wird (besser als Benchmark → höherer
  Wert; schlechter → niedrigerer Wert). Negative Kennzahlen (CO₂, Energie): niedriger
  ist besser. Positive Kennzahlen (Recycling, Renewable): höher ist besser.
2. Teilscores (E/S/G) sind gewichtete Summen der normalisierten Kennzahlen.
3. Gesamtscore = 0.4 * E + 0.3 * S + 0.3 * G (auf ganze Zahl gerundet).

Beispielrechnung (vereinfacht):
- Angenommen: Branchen-CO₂-Intensität = 100 t/Mio €, Unternehmen = 80 t/Mio € → besser als Benchmark → hoher E-CO₂-Teilscore (z.B. 85/100). 
- E-Teilscore = 0.35 * 85 + 0.25 * (EnergyScore) + 0.2 * (RenewableScore) + 0.2 * (RecyclingScore).
- S- und G-Teilscores analog berechnen, Gesamtscore via Gewichtung.

Speicherung:
- Nach erfolgreicher Berechnung werden in `public.esg_results` gespeichert: Eingabewerte, E/S/G-Score, Gesamtscore, Zeitstempel sowie die verwendete Benchmark-Referenz (`benchmark_id`) und ein JSON-Snapshot (`benchmark_snapshot`) der Benchmarks.

Wo im Code:
- Scoring-Logik: [src/lib/esgEngine.js](src/lib/esgEngine.js)
- Benchmark-Normalisierung: [src/lib/benchmarkUtils.js](src/lib/benchmarkUtils.js)
- Supabase-Abfragen + Persistenz: [src/services/esgService.js](src/services/esgService.js)
- Orchestrierung (Laden, Berechnen, Speichern): [src/hooks/useEsgData.js](src/hooks/useEsgData.js)

## Features im Ergebnis-Dashboard

- KPI-Karten für Score, Branchenabweichung, Risikostatus und gespeicherte Berichte
- Verlauf des ESG-Scores über frühere Berechnungen
- Benchmark-Vergleich für Kernkennzahlen
- Priorisierte Handlungsempfehlungen
- Konkurrenzbenchmark mit Branchenmittelwert

## Offline / Fehlerfall

Die Produktionslogik erwartet stets Benchmarks aus `public.benchmarks`. Wenn
Supabase nicht konfiguriert oder erreichbar ist, bricht die App bestimmte
Produktionsfunktionen (z. B. Score-Berechnung) mit einem klaren Fehler ab und
fordert zur Konfiguration oder Wiederherstellung der Verbindung auf. Lokale
Demo-Daten sind nicht Teil des produktiven Pfads.


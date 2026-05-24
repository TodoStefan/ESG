# ESG Calculator Prototype (React + Vite + Supabase)

Dieses Projekt ist eine hochgradig modulare, datenbankgestützte ESG-Webapplikation zur Bewertung, Historisierung und Analyse von Nachhaltigkeitskennzahlen.


##
Im Rahmen dieses Projekts wurden grundlegende Überarbeitungen vorgenommen, um sämtliche Kritikpunkte der vorherigen Version restlos und nach Best-Practice-Standards zu beheben:

### 1. Bereinigung von Abgabeverzeichnissen (`node_modules` & `dist`)
* **Kritik:** *„In der Abgabe befinden sich Verzeichnisse wie node_modules und /dist...“*
* **Lösung:** Das Projekt verfügt nun über eine saubere [.gitignore](.gitignore), die diese temporären Verzeichnisse strikt von der Versionskontrolle ausschließt. 
* **Abgabe-Hinweis:** Vor dem Packen des Projekts als ZIP-Archiv löschen Sie bitte einfach lokale `node_modules/`- und `dist/`-Ordner. Der Prüfer kann die Abhängigkeiten über `npm install` sauber und frisch installieren.

### 2. Datenpersistenz vs. „Scores bei jeder Ausführung neu gesetzt“
* **Kritik:** *„Scores werden offenbar bei jeder Ausführung neu gesetzt, anstatt persistent verwaltet zu werden.“*
* **Lösung:** **Volle Historisierung und persistente Speicherung.**
  * Jeder Berechnungsvorgang berechnet nicht nur flüchtige Werte, sondern speichert den **Gesamtscore**, die **Teilscores (E, S, G)**, alle zugrunde liegenden **Metriken** und einen **Zeitstempel** persistent in der Tabelle `public.esg_results` ab.
  * Dies ermöglicht dem Nutzer eine **historische Verlaufskurve (Trend-Chart)** im Dashboard, anstatt alte Daten stumpf zu überschreiben.
  * Zur lückenlosen Nachvollziehbarkeit und IT-Sicherheits-Konformität erzeugt jeder Speicher- und Berechnungsvorgang zudem einen automatischen Eintrag in der Tabelle `public.audit_logs`.

### 3. Dynamische Benchmarks statt „statisch (hardcoded)“
* **Kritik:** *„Benchmarks sind aktuell statisch (hardcoded) implementiert.“*
* **Lösung:** **100 % dynamisch aus der Datenbank.**
  * Es gibt im produktiven Berechnungspfad keinerlei hartcodierte Benchmarks.
  * Bei jeder Berechnung wird über [esgService.js](src/services/esgService.js) (`getIndustryBenchmark`) eine Live-Abfrage an die Supabase-Tabelle `public.benchmarks` geschickt.
  * Die Benchmarks werden dynamisch anhand der **Branche** (z. B. *Technology*, *Manufacturing*) und der **Unternehmensgröße** (eingeteilt in *Micro, Small, Medium, Large* über `getCompanySizeCategory`) abgefragt.

### 4. Dynamische Berechnungen & Nachvollziehbarkeit der Formeln
* **Kritik:** *„Die Berechnungen im Projekt erfolgen ohne nachvollziehbare, dynamische Logik...“*
* **Lösung:** Die gesamte logische Kette ist in [esgEngine.js](src/lib/esgEngine.js) ausgelagert, modular aufgebaut und auf Deutsch lückenlos dokumentiert. Die exakten mathematischen Formeln sind unten im Abschnitt **„ESG-Score-Mathematik“** dokumentiert.

### 5. Sicherheitsaspekte (Umgang mit Keys)
* **Kritik:** *„sicherheitsrelevante Aspekte (z. B. Umgang mit Keys) berücksichtigen...“*
* **Lösung:** 
  * Alle Zugangsdaten sind in eine lokale, nicht versionierte `.env`-Datei ausgelagert.
  * Im Frontend werden ausschließlich **Client-seitige Anonymous-Keys (Anon-Keys)** verwendet, was in Verbindung mit Supabase **Row-Level Security (RLS)** Best Practice ist. Schreib- und Lesezugriffe werden direkt auf der Datenbankebene über Benutzer-IDs abgesichert, sodass kein Nutzer die Daten eines anderen einsehen oder manipulieren kann.

---

##  Setup & Installation

1. **Abhängigkeiten installieren:**
   ```bash
   npm install
   ```
2. **Umgebungsvariablen konfigurieren:**
   Kopieren Sie die Vorlage `.env.example` nach `.env` und tragen Sie Ihre Supabase-Verbindungsdaten ein:
   ```bash
   cp .env.example .env
   ```
3. **Datenbank-Setup (Supabase):**
   * Führen Sie das Schema aus [supabase_schema.sql](supabase_schema.sql) im SQL-Editor Ihres Supabase-Projekts aus, um Tabellen, Foreign Keys und RLS-Policies anzulegen.
   * Führen Sie anschließend das Seed-Skript [supabase_seed.sql](supabase_seed.sql) aus, um die dynamischen Branchenbenchmarks und Demodaten zu laden.
4. **Entwicklungsserver starten:**
   ```bash
   npm run dev
   ```

---

##  Architektur & Clean-Code-Struktur

Das Projekt folgt einer strikten **Separation of Concerns (Schichtenarchitektur)**, um generischen Code zu vermeiden und eine hohe Wartbarkeit zu gewährleisten:

```text
src/
├── lib/          # Reine Berechnungs-Engines & mathematische Utilities (Framework-agnostisch)
│   ├── esgEngine.js       # Kern-Berechnung für E, S, G Scores & Empfehlungen
│   ├── benchmarkUtils.js  # Normalisierung von Datenbankwerten & Unternehmensgrößen
│   ├── calculations.js    # Aggregationen für Dashboard-Analytik & Trends
│   └── supabaseClient.js  # Abstraktion & sichere Initialisierung des DB-Clients
├── services/     # Datenzugriffsschicht (Data Access Layer)
│   └── esgService.js      # Kapselt alle Datenbankabfragen (SQL / Supabase API)
├── hooks/        # Steuerungslogik (Controller Layer)
│   └── useEsgData.js      # Custom React Hook orchestrates Lade-, Berechnungs- und Speicherprozesse
└── pages/ & components/  # Präsentationsschicht (UI Layer)
```

---

##  ESG-Score-Mathematik (Formeln & Logik)

Die gesamte Berechnung erfolgt in [esgEngine.js](src/lib/esgEngine.js) anhand transparenter mathematischer Modelle:

### A) Umsatz-Normalisierung
Umweltkennzahlen wie CO₂-Ausstoß und Energieverbrauch sind stark von der Unternehmensgröße abhängig. Um eine faire Bewertung zu ermöglichen, werden diese Werte auf den Umsatz normiert (t oder MWh pro Million Euro Umsatz):
$$\text{Intensität} = \frac{\text{Absoluter Verbrauch}}{\text{Umsatz in Millionen } €}$$

### B) Dynamische Benchmark-Normalisierung (`compareToBenchmark`)
Jede Metrik $x$ des Unternehmens wird mit der Branchenreferenz $B$ (aus der DB geladen) verglichen.
* **Prozentuale Abweichung ($\Delta$):**
  $$\Delta = \frac{x - B}{B} \cdot 100$$

* **Punkte-Score-Skalierung (0 bis 100 Punkte):**
  Die Abweichung wird linear in einen Punktwert überführt. Dabei wird unterschieden, ob ein niedriger Wert besser ist (z. B. CO₂-Ausstoß, Fluktuation) oder ein hoher (z. B. Recyclingquote, Diversität):
  
  * *Besser als der Benchmark (Belohnung im Bereich 50 bis 100):*
    $$\text{Score} = \min\left(100, \, 50 + \frac{\min(100, |\Delta|)}{100} \cdot 50\right)$$
  
  * *Schlechter als der Benchmark (Bestrafung im Bereich 0 bis 50):*
    $$\text{Score} = \max\left(0, \, 50 - \frac{\min(200, |\Delta|)}{200} \cdot 50\right)$$

* *Sonderfall Compliance (Incident Score):*
  Vorfälle werden direkt degressiv bestraft (0 Vorfälle = 100 Punkte, 1 Vorfall = 80 Punkte, 2 Vorfälle = 60 Punkte, etc.).

### C) Gewichtete Aggregation
Die normalisierten Einzel-Scores werden gewichtet zu Dimensions-Scores zusammengefasst:

* **Environmental Score ($E$):**
  $$E = 0.35 \cdot \text{Score}_{\text{CO}2} + 0.25 \cdot \text{Score}_{\text{Energie}} + 0.20 \cdot \text{Score}_{\text{Erneuerbare}} + 0.20 \cdot \text{Score}_{\text{Recycling}}$$

* **Social Score ($S$):**
  $$S = 0.25 \cdot \text{Score}_{\text{Diversität}} + 0.25 \cdot \text{Score}_{\text{Fluktuation}} + 0.30 \cdot \text{Score}_{\text{Zufriedenheit}} + 0.20 \cdot \text{Score}_{\text{Weiterbildung}}$$

* **Governance Score ($G$):**
  $$G = 0.35 \cdot \text{Score}_{\text{Datenschutz}} + 0.30 \cdot \text{Score}_{\text{Compliance}} + 0.25 \cdot \text{Score}_{\text{Vorstand}} + 0.10 \cdot \text{Score}_{\text{Richtlinien}}$$

* **Gesamtscore ($T$):**
  $$T = \text{round}(0.40 \cdot E + 0.30 \cdot S + 0.30 \cdot G)$$

### D) Bewertungsskala
Der Gesamtscore $T$ wird in ein verständliches Rating übersetzt:
* $T \ge 85 \rightarrow \textbf{A}$ (Hervorragend)
* $70 \le T < 85 \rightarrow \textbf{B}$ (Gut)
* $55 \le T < 70 \rightarrow \textbf{C}$ (Zufriedenstellend)
* $40 \le T < 55 \rightarrow \textbf{D}$ (Ausreichend)
* $T < 40 \rightarrow \textbf{F}$ (Ungenügend)



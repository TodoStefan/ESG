import { normalizeBenchmark } from './benchmarkUtils';

// --- ESG Scoring Engine ---
// Diese Engine berechnet E, S und G separat und bildet daraus einen gewichteten
// Gesamtscore. Die Berechnung basiert ausschließlich auf Unternehmenseingaben
// und auf Benchmarks, die aus der Datenbank geladen werden.
//
// WICHTIG: Wenn kein Benchmark vorliegt (z.B. DB-Fehler), wird die Berechnung
// nicht fortgesetzt — statt dessen wird ein Fehler geworfen und die aufrufende
// Schicht muss den Fehler behandeln und dem Nutzer eine klare Meldung anzeigen.

// --- Zentrale Gewichtungen (konfigurierbar) ---
const WEIGHTS = {
  environmental: {
    co2: 0.35,
    energy: 0.25,
    renewable: 0.2,
    recycling: 0.2,
  },
  social: {
    diversity: 0.25,
    turnover: 0.25,
    satisfaction: 0.3,
    training: 0.2, // Weiterbildung / Sozialfaktor
  },
  governance: {
    privacy: 0.35,
    incidents: 0.3,
    board: 0.25,
    policies: 0.1,
  },
  totals: {
    environmental: 0.4,
    social: 0.3,
    governance: 0.3,
  },
};

const clampScore = (v) => Math.min(100, Math.max(0, v));

// Normalisiert einen Vergleich zwischen actual und target auf 0-100.
// Bei Kennzahlen, bei denen niedrigere Werte besser sind (z.B. CO2, Energie),
// wird `lowerIsBetter = true` gesetzt; für positive Kennzahlen (z.B. Recycling)
// ist `lowerIsBetter = false`.
// Die Funktion gibt 100 zurück, wenn actual deutlich besser ist, und <100
// bei schlechterer Performance. Bei fehlendem target wird eine neutrale 50 zurückgegeben.
const compareToBenchmark = (actual, target, lowerIsBetter) => {
  const a = Number(actual ?? 0);
  const t = Number(target ?? 0);
  if (!t) return 50; // Keine Vergleichsbasis – neutral

  // Prozentuale Abweichung
  const delta = ((a - t) / t) * 100;

  // Wenn besser als Benchmark, belohnen (score > 50), sonst bestrafen (score < 50)
  if (lowerIsBetter ? a <= t : a >= t) {
    // Bessere Performance skaliert in 50..100
    const improvement = Math.min(100, Math.abs(delta));
    return clampScore(50 + (improvement / 100) * 50);
  }

  // Schlechtere Performance – disqualifizierend proportional zur Abweichung
  const deterioration = Math.min(200, Math.abs(delta));
  return clampScore(50 - (deterioration / 200) * 50);
};

// Incident-basierte Bewertung (Compliance-Fälle)
const incidentScore = (incidents) => {
  const n = Number(incidents ?? 0);
  if (n <= 0) return 100;
  if (n === 1) return 80;
  if (n === 2) return 60;
  if (n === 3) return 40;
  return 20;
};

/**
 * calculateESGScores
 * - formData: Unternehmenseingaben (env/soc/gov + company revenue)
 * - benchmarkLike: Objekt aus DB (benchmarks row)
 *
 * Liefert: { eScore, sScore, gScore, total, actualCo2Int, actualEnergyInt }
 * Wirft einen Error, wenn `benchmarkLike` fehlt.
 */
export const calculateESGScores = (formData, benchmarkLike) => {
  if (!benchmarkLike) {
    throw new Error('Benchmark data unavailable - cannot calculate ESG scores.');
  }

  const benchmark = normalizeBenchmark(benchmarkLike, formData?.company?.industry);
  if (!benchmark) {
    throw new Error('Benchmark normalization failed - cannot calculate ESG scores.');
  }

  // Revenue-normalisierte Intensitäten (t / Mio. €)
  const revenueInMillions = Math.max(1, Number(formData?.company?.revenue || 0) / 1000000);
  const actualCo2Int = Number(formData?.env?.co2 || 0) / revenueInMillions;
  const actualEnergyInt = Number(formData?.env?.energy || 0) / revenueInMillions;

  // ---- Environmental ----
  // CO2 and Energy: lower is better => lowerIsBetter = true
  const e_co2 = compareToBenchmark(actualCo2Int, benchmark.co2Int, true);
  const e_energy = compareToBenchmark(actualEnergyInt, benchmark.energyInt, true);
  // Renewable and Recycling: higher is better => lowerIsBetter = false
  const e_renewable = compareToBenchmark(Number(formData?.env?.renewable || 0), benchmark.renewable, false);
  const e_recycling = compareToBenchmark(Number(formData?.env?.recycling || 0), benchmark.recycling, false);

  const eScoreRaw =
    e_co2 * WEIGHTS.environmental.co2 +
    e_energy * WEIGHTS.environmental.energy +
    e_renewable * WEIGHTS.environmental.renewable +
    e_recycling * WEIGHTS.environmental.recycling;

  // ---- Social ----
  const s_diversity = compareToBenchmark(Number(formData?.soc?.diversity || 0), benchmark.diversity, false);
  const s_turnover = compareToBenchmark(Number(formData?.soc?.turnover || 0), benchmark.turnover, true);
  const s_satisfaction = compareToBenchmark(Number(formData?.soc?.satisfaction || 0), benchmark.satisfaction, false);
  const s_training = compareToBenchmark(Number(formData?.soc?.training || 0), benchmark.training ?? 0, false);

  const sScoreRaw =
    s_diversity * WEIGHTS.social.diversity +
    s_turnover * WEIGHTS.social.turnover +
    s_satisfaction * WEIGHTS.social.satisfaction +
    s_training * WEIGHTS.social.training;

  // ---- Governance ----
  const g_privacy = compareToBenchmark(Number(formData?.gov?.dataProtection || 0), benchmark.privacy, false);
  const g_incidents = incidentScore(Number(formData?.gov?.incidents || 0));
  const g_board = compareToBenchmark(Number(formData?.gov?.boardIndependent || 0), benchmark.boardInd, false);
  const g_policies = compareToBenchmark(Number(formData?.gov?.governancePolicies || 0), benchmark.policies ?? 0, false);

  const gScoreRaw =
    g_privacy * WEIGHTS.governance.privacy +
    g_incidents * WEIGHTS.governance.incidents +
    g_board * WEIGHTS.governance.board +
    g_policies * WEIGHTS.governance.policies;

  // Final normalisation to 0..100
  const normalizedEScore = clampScore(eScoreRaw);
  const normalizedSScore = clampScore(sScoreRaw);
  const normalizedGScore = clampScore(gScoreRaw);

  const totalScore = Math.round(
    normalizedEScore * WEIGHTS.totals.environmental +
    normalizedSScore * WEIGHTS.totals.social +
    normalizedGScore * WEIGHTS.totals.governance
  );

  return {
    eScore: Math.round(normalizedEScore),
    sScore: Math.round(normalizedSScore),
    gScore: Math.round(normalizedGScore),
    total: totalScore,
    actualCo2Int,
    actualEnergyInt,
    benchmark: benchmarkLike,
  };
};

export const getGrade = (score) => {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
};

export const getRecommendations = (dashboardData, bm, scoreTotal) => {
  if (scoreTotal === 0 || !dashboardData || !bm) return [];

  const recs = [];
  const benchmark = normalizeBenchmark(bm, dashboardData?.company?.industry);
  if (!benchmark) return [];
  const calcVar = (act, bmValue) => Math.abs(((act - bmValue) / (bmValue || 1)) * 100).toFixed(1);

  if (dashboardData.actualCo2Int > benchmark.co2Int) {
    recs.push({
      priority: 'Hoch',
      class: 'badge-priority-hoch',
      category: 'Umwelt',
      text: `Die CO2-Intensität liegt ${calcVar(dashboardData.actualCo2Int, benchmark.co2Int)}% über dem Branchendurchschnitt.`,
      action: 'Implementiere ein Energiemanagementsystem (ISO 50001) zur Identifikation von Einsparpotenzialen.',
      impact: 'Hoher Nutzen',
      effort: 'Mittlerer Aufwand',
    });
  }

  if (dashboardData.env.renewable < benchmark.renewable) {
    recs.push({
      priority: 'Mittel',
      class: 'badge-priority-mittel',
      category: 'Umwelt',
      text: `Der Anteil erneuerbarer Energien liegt ${calcVar(dashboardData.env.renewable, benchmark.renewable)}% unter der Branchenreferenz.`,
      action: 'Umstellung auf Ökostrom-Tarife oder Installation von PV-Anlagen auf Betriebsdächern.',
      impact: 'Mittlerer Nutzen',
      effort: 'Niedriger Aufwand',
    });
  }

  if (dashboardData.env.recycling < benchmark.recycling) {
    recs.push({
      priority: 'Mittel',
      class: 'badge-priority-mittel',
      category: 'Umwelt',
      text: `Die Recyclingquote liegt ${calcVar(dashboardData.env.recycling, benchmark.recycling)}% unter dem Benchmark.`,
      action: 'Einführung strukturierter Abfalltrennung und Recycling-Verträge.',
      impact: 'Mittlerer Nutzen',
      effort: 'Niedriger Aufwand',
    });
  }

  if (dashboardData.soc.diversity < benchmark.diversity) {
    recs.push({
      priority: 'Mittel',
      class: 'badge-priority-mittel',
      category: 'Soziales',
      text: `Die Diversitätsquote liegt ${calcVar(dashboardData.soc.diversity, benchmark.diversity)}% unter dem Zielwert.`,
      action: 'Einführung von Richtlinien für inklusives Recruiting und Diversity-Schulungen.',
      impact: 'Langfristig hoher Nutzen',
      effort: 'Mittlerer Aufwand',
    });
  }

  if (dashboardData.soc.turnover > benchmark.turnover) {
    recs.push({
      priority: 'Hoch',
      class: 'badge-priority-hoch',
      category: 'Soziales',
      text: `Die Fluktuationsrate liegt ${calcVar(dashboardData.soc.turnover, benchmark.turnover)}% über der Branchenreferenz.`,
      action: 'Mitarbeiterbefragungen durchführen, um Austrittsgründe zu identifizieren.',
      impact: 'Hoher Nutzen',
      effort: 'Mittlerer Aufwand',
    });
  }

  if (dashboardData.gov.dataProtection < benchmark.privacy) {
    recs.push({
      priority: 'Mittel',
      class: 'badge-priority-mittel',
      category: 'Governance',
      text: `Der Datenschutzwert liegt ${calcVar(dashboardData.gov.dataProtection, benchmark.privacy)}% unter dem Branchenziel.`,
      action: 'Ergänzung der internen Datenrichtlinie und Trainings zur DSGVO-Konformität.',
      impact: 'Moderater Nutzen',
      effort: 'Mittlerer Aufwand',
    });
  }

  if (dashboardData.gov.incidents > 0) {
    recs.push({
      priority: 'Hoch',
      class: 'badge-priority-risiko',
      category: 'Governance',
      text: `${dashboardData.gov.incidents} aktive Regelkonformitätsvorfälle erhöhen das Reputationsrisiko.`,
      action: 'Externe Prüfung einleiten und ein Whistleblowing-System implementieren.',
      impact: 'Erhöhtes Rechtsrisiko',
      effort: 'Hoher Aufwand',
    });
  }

  if (!recs.length) {
    recs.push({
      priority: 'Niedrig',
      class: 'badge-priority-niedrig',
      category: 'Allgemein',
      text: 'Alle Metriken liegen im grünen Bereich im Branchenvergleich.',
      action: 'Weiterführung der aktuellen Strategie und Vorbereitung auf Scope-3-Berichterstattung.',
      impact: 'Stabile Ausgangslage',
      effort: 'Laufender Aufwand',
    });
  }

  return recs;
};


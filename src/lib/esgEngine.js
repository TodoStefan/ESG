// --- ESG Scoring Engine ---

// Industry specific fallback benchmarks for relative scoring.
// Intensities are per 1M EUR Revenue.
export const benchmarks = {
  Manufacturing: { co2Int: 150, energyInt: 500, renewable: 20, diversity: 30, turnover: 12, boardInd: 60 },
  Technology: { co2Int: 15, energyInt: 100, renewable: 60, diversity: 35, turnover: 18, boardInd: 75 },
  Finance: { co2Int: 5, energyInt: 50, renewable: 80, diversity: 45, turnover: 10, boardInd: 85 },
  Healthcare: { co2Int: 60, energyInt: 300, renewable: 30, diversity: 50, turnover: 15, boardInd: 70 },
  Energy: { co2Int: 600, energyInt: 900, renewable: 35, diversity: 25, turnover: 8, boardInd: 65 },
  Retail: { co2Int: 40, energyInt: 200, renewable: 40, diversity: 45, turnover: 25, boardInd: 60 },
};

export const normalizeBenchmark = (benchmarkLike, industry = 'Manufacturing') => {
  const fallback = benchmarks[industry] || benchmarks.Manufacturing;
  if (!benchmarkLike) return fallback;

  return {
    co2Int: benchmarkLike.co2Int ?? benchmarkLike.co2_intensity_target ?? fallback.co2Int,
    energyInt: benchmarkLike.energyInt ?? benchmarkLike.energy_intensity_target ?? fallback.energyInt,
    renewable: benchmarkLike.renewable ?? benchmarkLike.renewable_target ?? fallback.renewable,
    diversity: benchmarkLike.diversity ?? benchmarkLike.diversity_target ?? fallback.diversity,
    turnover: benchmarkLike.turnover ?? benchmarkLike.turnover_target ?? fallback.turnover,
    boardInd: benchmarkLike.boardInd ?? benchmarkLike.board_independence_target ?? fallback.boardInd,
  };
};

export const getBenchmarkStatus = (actual, target, lowerIsBetter) => {
  if (target === 0) {
    return { status: 'nahe an der Branchenreferenz', direction: 'near', deltaPercent: 0 };
  }

  const deltaPercent = ((actual - target) / target) * 100;
  const absDelta = Math.abs(deltaPercent);
  const nearThreshold = 5;

  if (absDelta <= nearThreshold) {
    return { status: 'nahe an der Branchenreferenz', direction: 'near', deltaPercent };
  }

  const better = lowerIsBetter ? actual < target : actual > target;
  return {
    status: better ? 'über Branchenreferenz' : 'unter Branchenreferenz',
    direction: better ? 'up' : 'down',
    deltaPercent,
  };
};

const clampScore = (value) => Math.min(100, Math.max(0, value));

const progressivePenalty = (deviationPercent) => {
  if (deviationPercent <= 10) return deviationPercent * 1.2;
  if (deviationPercent <= 30) return 12 + (deviationPercent - 10) * 1.6;
  if (deviationPercent <= 60) return 44 + (deviationPercent - 30) * 1.2;
  return 80 + (deviationPercent - 60) * 0.45;
};

// Progressives Scoring:
// - Benchmark-Nähe bleibt stabil
// - leichte Abweichungen: moderater Abzug
// - starke Ausreißer: deutlich stärkerer Abzug
// - gute Werte werden belohnt
export const calcScore = (actual, target, lowerIsBetter) => {
  if (target === 0) return 50; // Guard against / 0

  const normalizedActual = Number(actual || 0);
  const normalizedTarget = Number(target || 0);

  if (normalizedActual === normalizedTarget) {
    return 70;
  }

  // 1) Schlechter als Benchmark: progressive Strafe
  const worse = lowerIsBetter
    ? normalizedActual > normalizedTarget
    : normalizedActual < normalizedTarget;

  if (worse) {
    const deviationPercent = Math.abs(((normalizedActual - normalizedTarget) / normalizedTarget) * 100);
    const penalty = progressivePenalty(deviationPercent);
    return clampScore(70 - penalty);
  }

  // 2) Besser als Benchmark: kontrollierte Belohnung bis max 100
  const improvementPercent = Math.abs(((normalizedActual - normalizedTarget) / normalizedTarget) * 100);
  const reward = Math.min(30, improvementPercent * 0.8);
  return clampScore(70 + reward);
};

const getIncidentScore = (incidents) => {
  const count = Number(incidents || 0);
  if (count <= 0) return 100;
  if (count === 1) return 72;
  if (count === 2) return 42;
  if (count === 3) return 18;
  return 0;
};

export const calculateESGScores = (formData, benchmarkLike) => {
  const benchmark = normalizeBenchmark(benchmarkLike, formData?.company?.industry);
  const revM = (formData?.company?.revenue || 0) / 1000000 || 1;
  const actualCo2Int = (formData?.env?.co2 || 0) / revM;
  const actualEnergyInt = (formData?.env?.energy || 0) / revM;

  const eScore =
    (
      calcScore(actualCo2Int, benchmark.co2Int, true) +
      calcScore(actualEnergyInt, benchmark.energyInt, true) +
      calcScore(formData?.env?.renewable || 0, benchmark.renewable, false)
    ) /
    3;

  const sScore =
    (
      calcScore(formData?.soc?.diversity || 0, benchmark.diversity, false) +
      calcScore(formData?.soc?.turnover || 0, benchmark.turnover, true)
    ) /
    2;

  const incidentScore = getIncidentScore(formData?.gov?.incidents);
  const gScore =
    (
      calcScore(formData?.gov?.boardIndependent || 0, benchmark.boardInd, false) +
      incidentScore
    ) /
    2;

  return {
    eScore: Math.round(eScore),
    sScore: Math.round(sScore),
    gScore: Math.round(gScore),
    total: Math.round((eScore * 0.4) + (sScore * 0.3) + (gScore * 0.3)),
    actualCo2Int,
    actualEnergyInt,
    benchmark,
  };
};

export const getGrade = (score) => {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
};

// Dynamic ESG Strategy Recommendations (To-Do Generator)
export const getRecommendations = (dashboardData, bm, scoreTotal) => {
  // Guard check if no data
  if (scoreTotal === 0 || !dashboardData || !bm) return [];

  const recs = [];
  const benchmark = normalizeBenchmark(bm, dashboardData?.company?.industry);
  const calcVar = (act, bmValue) => Math.abs(((act - bmValue) / (bmValue || 1)) * 100).toFixed(1);

  // Environment Rules
  if (dashboardData.actualCo2Int > benchmark.co2Int) {
    recs.push({
      priority: 'Hoch',
      class: 'badge-priority-hoch',
      category: 'Umwelt',
      text: `Die CO2-Intensität liegt ${calcVar(dashboardData.actualCo2Int, benchmark.co2Int)}% über dem Branchendurchschnitt.`,
      action: 'Implementiere ein Energiemanagementsystem (ISO 50001) zur Identifikation von Einsparpotenzialen.',
      impact: 'Hoher Nutzen',
      effort: 'Mittlerer Aufwand'
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
      effort: 'Niedriger Aufwand'
    });
  }

  // Social Rules
  if (dashboardData.soc.diversity < benchmark.diversity) {
    recs.push({
      priority: 'Mittel',
      class: 'badge-priority-mittel',
      category: 'Soziales',
  text: `Die Diversitätsquote liegt ${calcVar(dashboardData.soc.diversity, benchmark.diversity)}% unter dem Zielwert.`,
      action: 'Einführung von Richtlinien für inklusives Recruiting und Diversity-Schulungen für Führungskräfte.',
      impact: 'Langfristig hoher Nutzen',
      effort: 'Mittlerer Aufwand'
    });
  }
  if (dashboardData.soc.turnover > benchmark.turnover) {
    recs.push({
      priority: 'Hoch',
      class: 'badge-priority-hoch',
      category: 'Soziales',
      text: `Die Fluktuationsrate liegt ${calcVar(dashboardData.soc.turnover, benchmark.turnover)}% über der Branchenreferenz.`,
      action: 'Mitarbeiterbefragungen durchführen, um Austrittsgründe zu identifizieren und Teambuilding fördern.',
      impact: 'Hoher Nutzen',
      effort: 'Mittlerer Aufwand'
    });
  }

  // Governance Rules
  if (dashboardData.gov.boardIndependent < benchmark.boardInd) {
    recs.push({
      priority: 'Mittel',
      class: 'badge-priority-mittel',
      category: 'Unternehmensführung',
  text: `Vorstandsunabhängigkeit ist ${calcVar(dashboardData.gov.boardIndependent, benchmark.boardInd)}% geringer als empfohlen.`,
      action: 'Sukzessive Neubesetzung von Aufsichtsratsmandaten mit unabhängigen Experten.',
      impact: 'Governance-Risiko reduziert',
      effort: 'Hoher Aufwand'
    });
  }
  if (dashboardData.gov.incidents > 0) {
    recs.push({
      priority: 'Hoch',
      class: 'badge-priority-risiko',
      category: 'Unternehmensführung',
      text: `${dashboardData.gov.incidents} aktive Regelkonformitätsvorfälle erhöhen das Reputationsrisiko.`,
      action: 'Sofortige externe Untersuchung einleiten und Whistleblowing-System implementieren.',
      impact: 'Erhöhtes Rechtsrisiko',
      effort: 'Hoher Aufwand'
    });
  }

  if (recs.length === 0) {
    recs.push({
      priority: 'Niedrig',
      class: 'badge-priority-niedrig',
      category: 'Allgemein',
      text: 'Alle Metriken liegen im grünen Bereich im Branchenvergleich.',
      action: 'Weiterführung der aktuellen Strategie und Vorbereitung auf Scope-3 Berichterstattung.',
      impact: 'Stabile Ausgangslage',
      effort: 'Laufender Aufwand'
    });
  }
  return recs;
};

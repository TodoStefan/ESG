
export const getCompanySizeCategory = (employeeCount = 0) => {
  const count = Number(employeeCount || 0);
  if (count < 10) return 'Micro';
  if (count < 50) return 'Small';
  if (count < 250) return 'Medium';
  return 'Large';
};
export const normalizeBenchmark = (benchmarkLike, industry = 'Manufacturing') => {
   if (!benchmarkLike) return null;

  return {
    co2Int: benchmarkLike.co2_intensity_target ?? benchmarkLike.co2Int ?? null,
    energyInt: benchmarkLike.energy_intensity_target ?? benchmarkLike.energyInt ?? null,
    renewable: benchmarkLike.renewable_target ?? benchmarkLike.renewable ?? null,
    recycling: benchmarkLike.recycling_target ?? benchmarkLike.recycling ?? null,
    diversity: benchmarkLike.diversity_target ?? benchmarkLike.diversity ?? null,
    turnover: benchmarkLike.turnover_target ?? benchmarkLike.turnover ?? null,
    satisfaction: benchmarkLike.satisfaction_target ?? benchmarkLike.satisfaction ?? null,
    boardInd: benchmarkLike.board_independence_target ?? benchmarkLike.boardInd ?? null,
    privacy: benchmarkLike.privacy_score_target ?? benchmarkLike.privacy ?? null,

    training: benchmarkLike.training_target ?? null,
    policies: benchmarkLike.policies_target ?? null,
    id: benchmarkLike.id ?? null,
  };
};

export const getBenchmarkStatus = (actual, target, lowerIsBetter) => {
  if (typeof actual !== 'number' || typeof target !== 'number' || target === 0) {
    return { status: 'nahe an der Branchenreferenz', direction: 'near', deltaPercent: 0 };
  }

  const deltaPercent = ((actual - target) / target) * 100;
  const absDelta = Math.abs(deltaPercent);
  if (absDelta <= 5) {
    return { status: 'nahe an der Branchenreferenz', direction: 'near', deltaPercent };
  }

  const better = lowerIsBetter ? actual < target : actual > target;
  return {
    status: better ? 'über Branchenreferenz' : 'unter Branchenreferenz',
    direction: better ? 'up' : 'down',
    deltaPercent,
  };
};

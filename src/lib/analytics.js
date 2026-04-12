export const average = (values = []) => {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

export const buildDashboardAnalytics = ({
  esgRecords = [],
  currentScores,
  industryStats,
}) => {
  const sortedAsc = [...esgRecords].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );

  const trend = sortedAsc.map((entry, idx) => ({
    label: `R${idx + 1}`,
    date: entry.created_at,
    total: entry.total_score,
  }));

  const reportCount = esgRecords.length;
  const latest = esgRecords[0] || null;
  const previous = esgRecords[1] || null;

  const deltaToPrevious = latest && previous
    ? latest.total_score - previous.total_score
    : 0;

  const e = currentScores?.eScore ?? latest?.e_score ?? 0;
  const s = currentScores?.sScore ?? latest?.s_score ?? 0;
  const g = currentScores?.gScore ?? latest?.g_score ?? 0;

  const esgMix = [
    { key: 'E', label: 'Umwelt', value: e, color: 'var(--success)' },
    { key: 'S', label: 'Soziales', value: s, color: 'var(--primary)' },
    { key: 'G', label: 'Unternehmensführung', value: g, color: 'var(--warning)' },
  ];

  const sortedMix = [...esgMix].sort((a, b) => b.value - a.value);

  return {
    trend,
    reportCount,
    deltaToPrevious,
    industryAverage: industryStats?.industryAverageScore ?? 0,
    industryAverages: {
      e: industryStats?.industryAverageE ?? 0,
      s: industryStats?.industryAverageS ?? 0,
      g: industryStats?.industryAverageG ?? 0,
    },
    industryCompanyCount: industryStats?.companyCount ?? 0,
    bestArea: sortedMix[0],
    worstArea: sortedMix[sortedMix.length - 1],
    esgMix,
  };
};

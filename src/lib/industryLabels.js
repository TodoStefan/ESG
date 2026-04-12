export const industryLabels = {
  Manufacturing: 'Industrie',
  Technology: 'Technologie',
  Finance: 'Finanzwesen',
  Healthcare: 'Gesundheitswesen',
  Energy: 'Energie',
  Retail: 'Handel',
};

export const getIndustryLabel = (industryKey) => {
  if (!industryKey) return 'Unbekannt';
  return industryLabels[industryKey] || industryKey;
};

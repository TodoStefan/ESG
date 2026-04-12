import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getAuditLog,
  getCompanyInfo,
  getESGRecords,
  getIndustryBenchmark,
  getIndustryStats,
  getLatestCompanyForUser,
  saveESGData,
} from '../services/esgService';
import {
  calculateESGScores,
  getBenchmarkStatus,
  getRecommendations,
  normalizeBenchmark,
} from '../lib/esgEngine';
import { buildDashboardAnalytics } from '../lib/calculations';

const defaultFormData = {
  company: { name: 'Demo GmbH', industry: 'Manufacturing', employees: 250, revenue: 25000000 },
  env: { co2: 12000, energy: 38000, renewable: 30 },
  soc: { diversity: 32, turnover: 10 },
  gov: { incidents: 0, boardIndependent: 70 },
};

const emptyScores = { eScore: 0, sScore: 0, gScore: 0, total: 0, prevTotal: 0 };

const buildComparisonRows = (data, bm) => {
  if (!data?.company || !bm) return [];

  return [
    {
      key: 'co2',
      label: 'CO2-Intensität (t / Mio. €)',
      actual: Number(data.actualCo2Int || 0).toFixed(1),
      target: Number(bm.co2Int || 0).toFixed(1),
      status: getBenchmarkStatus(Number(data.actualCo2Int || 0), Number(bm.co2Int || 0), true),
    },
    {
      key: 'energy',
      label: 'Energieintensität (MWh / Mio. €)',
      actual: Number(data.actualEnergyInt || 0).toFixed(1),
      target: Number(bm.energyInt || 0).toFixed(1),
      status: getBenchmarkStatus(
        Number(data.actualEnergyInt || 0),
        Number(bm.energyInt || 0),
        true
      ),
    },
    {
      key: 'renewable',
      label: 'Anteil Erneuerbare (%)',
      actual: `${Number(data.env?.renewable || 0).toFixed(1)}%`,
      target: `${Number(bm.renewable || 0).toFixed(1)}%`,
      status: getBenchmarkStatus(Number(data.env?.renewable || 0), Number(bm.renewable || 0), false),
    },
    {
      key: 'diversity',
      label: 'Diversität (%)',
      actual: `${Number(data.soc?.diversity || 0).toFixed(1)}%`,
      target: `${Number(bm.diversity || 0).toFixed(1)}%`,
      status: getBenchmarkStatus(Number(data.soc?.diversity || 0), Number(bm.diversity || 0), false),
    },
    {
      key: 'turnover',
      label: 'Fluktuation (%)',
      actual: `${Number(data.soc?.turnover || 0).toFixed(1)}%`,
      target: `${Number(bm.turnover || 0).toFixed(1)}%`,
      status: getBenchmarkStatus(Number(data.soc?.turnover || 0), Number(bm.turnover || 0), true),
    },
    {
      key: 'board',
      label: 'Unabhängige Räte (%)',
      actual: `${Number(data.gov?.boardIndependent || 0).toFixed(1)}%`,
      target: `${Number(bm.boardInd || 0).toFixed(1)}%`,
      status: getBenchmarkStatus(
        Number(data.gov?.boardIndependent || 0),
        Number(bm.boardInd || 0),
        false
      ),
    },
  ];
};

export const useEsgData = ({ userId = null, isAuthenticated = false, userLabel = 'Aktueller Benutzer' } = {}) => {
  const [formData, setFormData] = useState(defaultFormData);
  const [dashboardData, setDashboardData] = useState(defaultFormData);
  const [scores, setScores] = useState(emptyScores);
  const [esgRecords, setEsgRecords] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [benchmark, setBenchmark] = useState(normalizeBenchmark(null, defaultFormData.company.industry));
  const [benchmarkComparisons, setBenchmarkComparisons] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [companyId, setCompanyId] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const loadCompanyContext = useCallback(async (resolvedCompanyId, industry, currentScores = null) => {
    const [records, logs, bm, industryStats] = await Promise.all([
      getESGRecords(resolvedCompanyId, userId),
      getAuditLog(resolvedCompanyId, userId),
      getIndustryBenchmark(industry),
      getIndustryStats(industry),
    ]);

    setEsgRecords(records || []);
    setAuditLog(logs || []);
    setBenchmark(bm);

    const latest = records?.[0];
    const previous = records?.[1];

    if (latest) {
      const calculatedScores = {
        eScore: latest.e_score,
        sScore: latest.s_score,
        gScore: latest.g_score,
        total: latest.total_score,
        prevTotal: previous?.total_score ?? latest.total_score,
      };

  const companyData = await getCompanyInfo(resolvedCompanyId, userId);
      const mergedFormData = {
        company: {
          name: companyData?.company_name || defaultFormData.company.name,
          industry: companyData?.industry || industry || defaultFormData.company.industry,
          employees: companyData?.employee_count ?? defaultFormData.company.employees,
          revenue: Number(companyData?.annual_revenue ?? defaultFormData.company.revenue),
        },
        env: {
          co2: Number(latest.co2_emissions ?? defaultFormData.env.co2),
          energy: Number(latest.energy_consumption ?? defaultFormData.env.energy),
          renewable: Number(latest.renewable_share ?? defaultFormData.env.renewable),
        },
        soc: {
          diversity: Number(latest.diversity_share ?? defaultFormData.soc.diversity),
          turnover: Number(latest.employee_turnover ?? defaultFormData.soc.turnover),
        },
        gov: {
          incidents: Number(latest.legal_incidents ?? defaultFormData.gov.incidents),
          boardIndependent: Number(
            latest.independent_board_share ?? defaultFormData.gov.boardIndependent
          ),
        },
      };

      const revM = (mergedFormData.company.revenue || 1) / 1000000;
      const actualCo2Int = mergedFormData.env.co2 / revM;
      const actualEnergyInt = mergedFormData.env.energy / revM;

      setFormData(mergedFormData);
      setDashboardData({ ...mergedFormData, actualCo2Int, actualEnergyInt });
      setScores(currentScores || calculatedScores);
      setBenchmarkComparisons(buildComparisonRows({ ...mergedFormData, actualCo2Int, actualEnergyInt }, bm));
      setRecommendations(
        getRecommendations(
          { ...mergedFormData, actualCo2Int, actualEnergyInt },
          bm,
          (currentScores || calculatedScores).total
        )
      );
    }

    return buildDashboardAnalytics({
      esgRecords: records || [],
      currentScores: currentScores || null,
      industryStats,
    });
  }, [userId]);

  const [analytics, setAnalytics] = useState(
    buildDashboardAnalytics({ esgRecords: [], currentScores: null, industryStats: null })
  );

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setCompanyId(null);
      setFormData(defaultFormData);
      setDashboardData(defaultFormData);
      setScores(emptyScores);
      setEsgRecords([]);
      setAuditLog([]);
      setBenchmark(normalizeBenchmark(null, defaultFormData.company.industry));
      setBenchmarkComparisons([]);
      setRecommendations([]);
      setAnalytics(buildDashboardAnalytics({ esgRecords: [], currentScores: null, industryStats: null }));
      setError('');
      setIsBootstrapping(false);
      return;
    }

    const bootstrap = async () => {
      try {
        setError('');
        setIsBootstrapping(true);

        const latestCompany = await getLatestCompanyForUser(userId);
        const resolvedCompanyId = latestCompany?.id || null;
        setCompanyId(resolvedCompanyId);

        if (!resolvedCompanyId) {
          setAnalytics(buildDashboardAnalytics({ esgRecords: [], currentScores: null, industryStats: null }));
          setBenchmark(normalizeBenchmark(null, defaultFormData.company.industry));
          return;
        }

        const computedAnalytics = await loadCompanyContext(resolvedCompanyId, latestCompany?.industry || defaultFormData.company.industry);
        setAnalytics(computedAnalytics);
      } catch (err) {
        console.error('Bootstrap failed:', err);
        setError('Initiale Daten konnten nicht vollständig geladen werden.');
      } finally {
        setIsBootstrapping(false);
      }
    };

    bootstrap();
  }, [isAuthenticated, loadCompanyContext, userId]);

  const handleFormChange = useCallback((category, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  }, []);

  const calculateAndSave = useCallback(async () => {
    if (!isAuthenticated || !userId) {
      setError('Bitte einloggen, um die vollständige ESG-Analyse freizuschalten.');
      return { success: false };
    }

    setIsSaving(true);
    setError('');

    try {
      const bm = await getIndustryBenchmark(formData.company.industry);
      const calculated = calculateESGScores(formData, bm);

      const prevTotal = esgRecords[0]?.total_score ?? calculated.total;
      const delta = calculated.total - prevTotal;

      const nextScores = {
        eScore: calculated.eScore,
        sScore: calculated.sScore,
        gScore: calculated.gScore,
        total: calculated.total,
        prevTotal,
      };

      const auditLogEntry = {
        action: 'ESG Neuberechnung',
        user: userLabel,
        status: 'Geprüft',
        impactText: `${delta >= 0 ? '+' : ''}${delta} Pts`,
      };

      const saveResult = await saveESGData({
        company: formData.company,
        env: formData.env,
        soc: formData.soc,
        gov: formData.gov,
        scores: nextScores,
        auditLogEntry,
        userId,
      });

      if (!saveResult?.success) {
        throw new Error(saveResult?.error || 'Speichern fehlgeschlagen.');
      }

      setCompanyId(saveResult.companyId);

      const newDashboardData = {
        ...formData,
        actualCo2Int: calculated.actualCo2Int,
        actualEnergyInt: calculated.actualEnergyInt,
      };

      setScores(nextScores);
      setBenchmark(calculated.benchmark);
      setDashboardData(newDashboardData);
  setBenchmarkComparisons(buildComparisonRows(newDashboardData, calculated.benchmark));
      setRecommendations(getRecommendations(newDashboardData, calculated.benchmark, calculated.total));

      const computedAnalytics = await loadCompanyContext(
        saveResult.companyId,
        formData.company.industry,
        nextScores
      );
      setAnalytics(computedAnalytics);

      return {
        success: true,
      };
    } catch (err) {
      console.error('Error during calculate and save:', err);
      setError(err.message || 'Fehler bei Berechnung und Speicherung.');
      return { success: false };
    } finally {
      setIsSaving(false);
    }
  }, [esgRecords, formData, isAuthenticated, loadCompanyContext, userId, userLabel]);

  const riskStatus = useMemo(() => {
    if (scores.total >= 70 && (dashboardData?.gov?.incidents || 0) === 0) return 'Niedrig';
    if (scores.total >= 50) return 'Mittel';
    return 'Hoch';
  }, [dashboardData?.gov?.incidents, scores.total]);

  return {
    formData,
    handleFormChange,
    calculateAndSave,
    dashboardData,
    scores,
    benchmark,
    benchmarkComparisons,
    recommendations,
    esgRecords,
    auditLog,
    analytics,
    companyId,
    riskStatus,
    isSaving,
    isBootstrapping,
    error,
  };
};

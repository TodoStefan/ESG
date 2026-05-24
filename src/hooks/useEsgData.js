import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getAuditLog,
  getCompanyInfo,
  getESGRecords,
  getIndustryBenchmark,
  getIndustryStats,
  getKnownIndustries,
  getLatestCompanyForUser,
  saveESGData,
} from '../services/esgService';
import { calculateESGScores, getRecommendations } from '../lib/esgEngine';
import { getBenchmarkStatus, normalizeBenchmark } from '../lib/benchmarkUtils';
import { buildDashboardAnalytics } from '../lib/calculations';

const defaultFormData = {
  company: { name: '', industry: '', employees: 0, revenue: 0 },
  env: { co2: 0, energy: 0, renewable: 0, recycling: 0 },
  soc: { diversity: 0, turnover: 0, satisfaction: 0 },
  gov: { incidents: 0, boardIndependent: 0, dataProtection: 0 },
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
      status: getBenchmarkStatus(Number(data.actualEnergyInt || 0), Number(bm.energyInt || 0), true),
    },
    {
      key: 'renewable',
      label: 'Anteil Erneuerbare (%)',
      actual: `${Number(data.env?.renewable || 0).toFixed(1)}%`,
      target: `${Number(bm.renewable || 0).toFixed(1)}%`,
      status: getBenchmarkStatus(Number(data.env?.renewable || 0), Number(bm.renewable || 0), false),
    },
    {
      key: 'recycling',
      label: 'Recyclingquote (%)',
      actual: `${Number(data.env?.recycling || 0).toFixed(1)}%`,
      target: `${Number(bm.recycling || 0).toFixed(1)}%`,
      status: getBenchmarkStatus(Number(data.env?.recycling || 0), Number(bm.recycling || 0), false),
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
      key: 'satisfaction',
      label: 'Mitarbeiterzufriedenheit',
      actual: `${Number(data.soc?.satisfaction || 0).toFixed(1)}%`,
      target: `${Number(bm.satisfaction || 0).toFixed(1)}%`,
      status: getBenchmarkStatus(Number(data.soc?.satisfaction || 0), Number(bm.satisfaction || 0), false),
    },
    {
      key: 'dataProtection',
      label: 'Datenschutzbewertung',
      actual: `${Number(data.gov?.dataProtection || 0).toFixed(1)}%`,
      target: `${Number(bm.privacy || 0).toFixed(1)}%`,
      status: getBenchmarkStatus(Number(data.gov?.dataProtection || 0), Number(bm.privacy || 0), false),
    },
  ];
};

export const useEsgData = ({ userId = null, isAuthenticated = false, userLabel = 'Aktueller Benutzer' } = {}) => {
  const [formData, setFormData] = useState(defaultFormData);
  const [dashboardData, setDashboardData] = useState(defaultFormData);
  const [scores, setScores] = useState(emptyScores);
  const [esgRecords, setEsgRecords] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  // No hardcoded benchmark in initial state. Benchmark is loaded from Supabase
  // for real data; when unavailable `benchmark` will be `null` and UI should
  // render accordingly (no demo values).
  const [benchmark, setBenchmark] = useState(null);
  const [benchmarkComparisons, setBenchmarkComparisons] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [industryOptions, setIndustryOptions] = useState([]);
  const [companyId, setCompanyId] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const loadCompanyContext = useCallback(async (resolvedCompanyId, industry, employeeCount, currentScores = null) => {
    const [records, logs, bm, industryStats] = await Promise.all([
      getESGRecords(resolvedCompanyId, userId),
      getAuditLog(resolvedCompanyId, userId),
      getIndustryBenchmark(industry, employeeCount),
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
          recycling: Number(latest.recycling_rate ?? defaultFormData.env.recycling),
        },
        soc: {
          diversity: Number(latest.diversity_share ?? defaultFormData.soc.diversity),
          turnover: Number(latest.employee_turnover ?? defaultFormData.soc.turnover),
          satisfaction: Number(latest.employee_satisfaction ?? defaultFormData.soc.satisfaction),
        },
        gov: {
          incidents: Number(latest.legal_incidents ?? defaultFormData.gov.incidents),
          boardIndependent: Number(latest.independent_board_share ?? defaultFormData.gov.boardIndependent),
          dataProtection: Number(latest.data_protection_score ?? defaultFormData.gov.dataProtection),
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
      setBenchmark(null);
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

        const [latestCompany, industries] = await Promise.all([
          getLatestCompanyForUser(userId),
          getKnownIndustries(),
        ]);

        const availableIndustries = industries.length ? industries : [];
        setIndustryOptions(availableIndustries.length ? availableIndustries : [defaultFormData.company.industry]);

        const resolvedCompanyId = latestCompany?.id || null;
        setCompanyId(resolvedCompanyId);

        if (!resolvedCompanyId) {
          // New user: default the industry to the first available option
          const defaultIndustry = availableIndustries[0] || 'Manufacturing';
          setFormData((prev) => ({
            ...prev,
            company: { ...prev.company, industry: defaultIndustry },
          }));
          setAnalytics(buildDashboardAnalytics({ esgRecords: [], currentScores: null, industryStats: null }));
          setBenchmark(null);
          return;
        }

        const computedAnalytics = await loadCompanyContext(
          resolvedCompanyId,
          latestCompany?.industry || defaultFormData.company.industry,
          latestCompany?.employee_count ?? defaultFormData.company.employees,
        );
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
      const bm = await getIndustryBenchmark(formData.company.industry, formData.company.employees);
      if (!bm) {
        setError('Branchen-Benchmarks konnten nicht geladen werden. Bitte prüfen Sie die Serververbindung.');
        setIsSaving(false);
        return { success: false };
      }
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
        userEmail: userLabel,
        benchmark: bm,
      });

      if (!saveResult?.success) {
        throw new Error(saveResult?.error || 'Speichern fehlgeschlagen.');
      }

      const newDashboardData = {
        ...formData,
        actualCo2Int: calculated.actualCo2Int,
        actualEnergyInt: calculated.actualEnergyInt,
      };

      setCompanyId(saveResult.companyId);
      setScores(nextScores);
      setBenchmark(calculated.benchmark);
      setDashboardData(newDashboardData);
      setBenchmarkComparisons(buildComparisonRows(newDashboardData, calculated.benchmark));
      setRecommendations(getRecommendations(newDashboardData, calculated.benchmark, calculated.total));

      const computedAnalytics = await loadCompanyContext(
        saveResult.companyId,
        formData.company.industry,
        formData.company.employees,
        nextScores
      );
      setAnalytics(computedAnalytics);

      return { success: true };
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
    industryOptions,
    riskStatus,
    isSaving,
    isBootstrapping,
    error,
  };
};

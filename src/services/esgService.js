import { supabase, hasSupabaseConfig } from '../lib/supabaseClient';
import { benchmarks, normalizeBenchmark } from '../lib/esgEngine';
import { average } from '../lib/analytics';

const DEMO_COMPANY = {
  id: 'demo-company-1',
  company_name: 'Demo GmbH',
  industry: 'Manufacturing',
  employee_count: 250,
  annual_revenue: 25000000,
};

const DEMO_RECORDS = [
  {
    id: 'demo-r1',
    company_id: DEMO_COMPANY.id,
    co2_emissions: 13300,
    energy_consumption: 41000,
    renewable_share: 24,
    diversity_share: 26,
    employee_turnover: 14,
    independent_board_share: 58,
    legal_incidents: 1,
    e_score: 44,
    s_score: 49,
    g_score: 46,
    total_score: 46,
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-r2',
    company_id: DEMO_COMPANY.id,
    co2_emissions: 12600,
    energy_consumption: 39000,
    renewable_share: 29,
    diversity_share: 30,
    employee_turnover: 11,
    independent_board_share: 66,
    legal_incidents: 0,
    e_score: 55,
    s_score: 60,
    g_score: 70,
    total_score: 61,
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-r3',
    company_id: DEMO_COMPANY.id,
    co2_emissions: 11800,
    energy_consumption: 37200,
    renewable_share: 34,
    diversity_share: 33,
    employee_turnover: 9,
    independent_board_share: 71,
    legal_incidents: 0,
    e_score: 63,
    s_score: 64,
    g_score: 76,
    total_score: 67,
    created_at: new Date().toISOString(),
  },
];

const DEMO_AUDIT = [
  {
    id: 'demo-a1',
    company_id: DEMO_COMPANY.id,
    action: 'Erstberechnung erstellt',
    actor: 'System',
    impact: '+0 Pts',
    status: 'Geprüft',
    created_at: DEMO_RECORDS[0].created_at,
  },
  {
    id: 'demo-a2',
    company_id: DEMO_COMPANY.id,
    action: 'Neuberechnung nach Energie-Maßnahmen',
    actor: 'Demo User',
    impact: '+15 Pts',
    status: 'Geprüft',
    created_at: DEMO_RECORDS[1].created_at,
  },
  {
    id: 'demo-a3',
    company_id: DEMO_COMPANY.id,
    action: 'Neuberechnung Quartal 2',
    actor: 'Demo User',
    impact: '+6 Pts',
    status: 'In Prüfung',
    created_at: DEMO_RECORDS[2].created_at,
  },
];

const DEMO_INDUSTRY_STATS = {
  industryAverageScore: 59,
  industryAverageE: 56,
  industryAverageS: 58,
  industryAverageG: 63,
  companyCount: 5,
  sampleSize: 14,
};

const hasMeaningfulVariance = (values = []) => {
  if (!Array.isArray(values) || values.length < 2) return false;
  const unique = new Set(values.map((v) => Math.round(Number(v || 0))));
  return unique.size > 1;
};

const handleError = (message, err, fallback) => {
  console.error(message, err);
  return fallback;
};

export const getCompanyByName = async (companyName, userId = null) => {
  if (!companyName) return null;

  if (!hasSupabaseConfig) {
    if (companyName.toLowerCase() === DEMO_COMPANY.company_name.toLowerCase()) {
      return DEMO_COMPANY;
    }
    return null;
  }

  try {
    let query = supabase
      .from('companies')
      .select('*')
      .ilike('company_name', companyName)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) throw error;
    return data;
  } catch (err) {
    return handleError('Error fetching company by name:', err, null);
  }
};

export const getLatestCompanyForUser = async (userId) => {
  if (!userId) return null;

  if (!hasSupabaseConfig) {
    return DEMO_COMPANY;
  }

  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (err) {
    return handleError('Error fetching latest company for user:', err, null);
  }
};

export const getCompanyInfo = async (companyId, userId = null) => {
  if (!companyId) return null;

  if (!hasSupabaseConfig) {
    return companyId === DEMO_COMPANY.id ? DEMO_COMPANY : null;
  }

  try {
    let query = supabase
      .from('companies')
      .select('*')
      .eq('id', companyId);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.single();

    if (error) throw error;
    return data;
  } catch (err) {
    return handleError('Error fetching company info:', err, null);
  }
};

export const getESGRecords = async (companyId, userId = null) => {
  if (!companyId && hasSupabaseConfig) return [];

  if (!hasSupabaseConfig) {
    return DEMO_RECORDS;
  }

  try {
    let query = supabase
      .from('esg_records')
      .select(userId ? '*, companies!inner(user_id)' : '*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('companies.user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).map((record) => {
      if ('companies' in record) {
        delete record.companies;
      }
      return record;
    });
  } catch (err) {
    return handleError('Error fetching ESG records:', err, []);
  }
};

export const getAuditLog = async (companyId, userId = null) => {
  if (!companyId && hasSupabaseConfig) return [];

  if (!hasSupabaseConfig) {
    return DEMO_AUDIT;
  }

  try {
    let query = supabase
      .from('audit_log')
      .select(userId ? '*, companies!inner(user_id)' : '*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('companies.user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).map((entry) => {
      if ('companies' in entry) {
        delete entry.companies;
      }
      return entry;
    });
  } catch (err) {
    return handleError('Error fetching audit log:', err, []);
  }
};

export const getIndustryBenchmark = async (industry) => {
  const fallback = normalizeBenchmark(null, industry);

  if (!hasSupabaseConfig) {
    return fallback;
  }

  try {
    const { data, error } = await supabase
      .from('industry_benchmarks')
      .select('*')
      .eq('industry', industry)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return normalizeBenchmark(data, industry);
  } catch (err) {
    return handleError('Error fetching benchmark:', err, fallback);
  }
};

export const getIndustryStats = async (industry) => {
  if (!hasSupabaseConfig) {
    return DEMO_INDUSTRY_STATS;
  }

  try {
    const { data: referenceStats, error: referenceError } = await supabase
      .from('industry_score_benchmarks')
      .select('avg_total, avg_e, avg_s, avg_g, company_count, sample_size')
      .eq('industry', industry)
      .limit(1)
      .maybeSingle();

    if (referenceError) throw referenceError;

    const { data, error } = await supabase
      .from('esg_records')
      .select('total_score, e_score, s_score, g_score, company_id, companies!inner(industry)')
      .eq('companies.industry', industry);

    if (error) throw error;

    const totals = (data || []).map((entry) => Number(entry.total_score || 0));
    const eValues = (data || []).map((entry) => Number(entry.e_score || 0));
    const sValues = (data || []).map((entry) => Number(entry.s_score || 0));
    const gValues = (data || []).map((entry) => Number(entry.g_score || 0));
    const companyCount = new Set((data || []).map((entry) => entry.company_id)).size;

    const liveStats = {
      industryAverageScore: Math.round(average(totals)),
      industryAverageE: Math.round(average(eValues)),
      industryAverageS: Math.round(average(sValues)),
      industryAverageG: Math.round(average(gValues)),
      companyCount,
      sampleSize: totals.length,
    };

    const liveStatsAreRobust =
      liveStats.companyCount >= 2 &&
      liveStats.sampleSize >= 3 &&
      hasMeaningfulVariance(totals);

    if (liveStatsAreRobust) {
      return liveStats;
    }

    if (referenceStats) {
      return {
        industryAverageScore: Math.round(Number(referenceStats.avg_total || 0)),
        industryAverageE: Math.round(Number(referenceStats.avg_e || 0)),
        industryAverageS: Math.round(Number(referenceStats.avg_s || 0)),
        industryAverageG: Math.round(Number(referenceStats.avg_g || 0)),
        companyCount: Number(referenceStats.company_count || 0),
        sampleSize: Number(referenceStats.sample_size || 0),
      };
    }

    return liveStats;
  } catch (err) {
    return handleError('Error fetching industry stats:', err, {
      industryAverageScore: 0,
      industryAverageE: 0,
      industryAverageS: 0,
      industryAverageG: 0,
      companyCount: 0,
      sampleSize: 0,
    });
  }
};

export const saveESGData = async ({ company, env, soc, gov, scores, auditLogEntry, userId }) => {
  if (!hasSupabaseConfig) {
    return { companyId: DEMO_COMPANY.id, success: true };
  }

  if (!userId) {
    return { success: false, error: 'Bitte einloggen, um Daten zu speichern.' };
  }

  try {
    const existingCompany = await getCompanyByName(company.name, userId);
    let companyId = existingCompany?.id;

    if (companyId) {
      const { error } = await supabase
        .from('companies')
        .update({
          company_name: company.name,
          industry: company.industry,
          employee_count: company.employees,
          annual_revenue: company.revenue,
        })
        .eq('id', companyId)
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      const { data, error } = await supabase
        .from('companies')
        .insert({
          user_id: userId,
          company_name: company.name,
          industry: company.industry,
          employee_count: company.employees,
          annual_revenue: company.revenue,
        })
        .select('*')
        .single();

      if (error) throw error;
      companyId = data.id;
    }

    const { error: recordError } = await supabase.from('esg_records').insert({
      company_id: companyId,
      co2_emissions: env.co2,
      energy_consumption: env.energy,
      renewable_share: env.renewable,
      diversity_share: soc.diversity,
      employee_turnover: soc.turnover,
      independent_board_share: gov.boardIndependent,
      legal_incidents: gov.incidents,
      e_score: scores.eScore,
      s_score: scores.sScore,
      g_score: scores.gScore,
      total_score: scores.total,
    });

    if (recordError) throw recordError;

    const { error: auditError } = await supabase.from('audit_log').insert({
      company_id: companyId,
      action: auditLogEntry?.action || 'ESG Neuberechnung',
      actor: auditLogEntry?.user || 'Aktueller Benutzer',
      impact: auditLogEntry?.impactText || 'N/A',
      status: auditLogEntry?.status || 'Geprüft',
    });

    if (auditError) throw auditError;

    return { companyId, success: true };
  } catch (err) {
    return handleError('Error saving ESG data:', err, { success: false, error: err.message });
  }
};

export const getKnownIndustries = () => Object.keys(benchmarks);

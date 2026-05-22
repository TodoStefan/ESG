import { supabase, hasSupabaseConfig } from '../lib/supabaseClient';
import { normalizeBenchmark, getCompanySizeCategory } from '../lib/benchmarkUtils';
import { average } from '../lib/calculations';

// NOTE: All static demo data has been removed from the productive flow.
// Minimal offline fallbacks (empty lists / nulls) are returned when Supabase
// is not configured or unreachable so the UI can render gracefully.
// Do NOT rely on these values for any production calculation or decision logic.
const OFFLINE_FALLBACK_INDUSTRIES = ['Manufacturing', 'Technology', 'Finance', 'Healthcare', 'Energy', 'Retail'];

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
    console.warn('Supabase not configured: getCompanyByName returning null');
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
    console.warn('Supabase not configured: getLatestCompanyForUser returning null');
    return null;
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
    console.warn('Supabase not configured: getCompanyInfo returning null');
    return null;
  }

  try {
    let query = supabase.from('companies').select('*').eq('id', companyId);
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query.single();
    if (error) throw error;
    return data;
  } catch (err) {
    return handleError('Error fetching company info:', err, null);
  }
  }

export const getESGRecords = async (companyId, userId = null) => {
  if (!companyId && hasSupabaseConfig) return [];
  if (!hasSupabaseConfig) {
    console.warn('Supabase not configured: getESGRecords returning empty list');
    return [];
  }

  try {
    let query = supabase
      .from('esg_results')
      .select(userId ? 'id, company_id, co2_emissions, energy_consumption, renewable_share, recycling_rate, diversity_share, employee_turnover, employee_satisfaction, independent_board_share, data_protection_score, legal_incidents, e_score, s_score, g_score, total_score, created_at, companies!inner(user_id)' : 'id, company_id, co2_emissions, energy_consumption, renewable_share, recycling_rate, diversity_share, employee_turnover, employee_satisfaction, independent_board_share, data_protection_score, legal_incidents, e_score, s_score, g_score, total_score, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    if (userId) query = query.eq('companies.user_id', userId);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((record) => {
      if ('companies' in record) delete record.companies;
      return record;
    });
  } catch (err) {
    return handleError('Error fetching ESG records:', err, []);
  }
};

export const getAuditLog = async (companyId, userId = null) => {
  if (!companyId && hasSupabaseConfig) return [];
  if (!hasSupabaseConfig) {
    console.warn('Supabase not configured: getAuditLog returning empty list');
    return [];
  }

  try {
    let query = supabase
      .from('audit_logs')
      .select(userId ? 'id, company_id, action, actor, impact, status, created_at, companies!inner(user_id)' : 'id, company_id, action, actor, impact, status, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    if (userId) query = query.eq('companies.user_id', userId);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((entry) => {
      if ('companies' in entry) delete entry.companies;
      return entry;
    });
  } catch (err) {
    return handleError('Error fetching audit log:', err, []);
  }
};

export const getIndustryBenchmark = async (industry, employeeCount = 0) => {
  // Load benchmark from DB. If Supabase is not configured or no row exists,
  // return null. Callers must handle null/throw a user-facing error.
  if (!hasSupabaseConfig) {
    console.warn('Supabase not configured: getIndustryBenchmark returning null');
    return null;
  }
  try {
  const companySize = getCompanySizeCategory(employeeCount);

  const { data, error } = await supabase
    .from('benchmarks')
    .select('*')
    .eq('industry', industry)
    .eq('company_size_category', companySize)
    .maybeSingle();

  console.log('Benchmark Query:', {
    industry,
    companySize,
    data,
    error
  });

  if (error) {
    console.error('Benchmark query failed:', error);
    return null;
  }

  if (!data) {
    console.warn('No benchmark found for:', industry, companySize);
    return null;
  }

  return normalizeBenchmark(data, industry);

} catch (err) {
  console.error('Error loading benchmark:', err);
  return null;
}
};

export const getIndustryStats = async (industry) => {
  if (!hasSupabaseConfig) {
    console.warn('Supabase not configured: getIndustryStats returning null');
    return null;
  }

  try {
    const { data: benchmarkStats, error: benchmarkError } = await supabase
      .from('benchmarks')
      .select('avg_total, avg_e, avg_s, avg_g, company_count, sample_size')
      .eq('industry', industry)
      .eq('company_size_category', 'All')
      .limit(1)
      .maybeSingle();
    if (benchmarkError) throw benchmarkError;

    const { data, error } = await supabase
      .from('esg_results')
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

    const robust =
      liveStats.companyCount >= 2 &&
      liveStats.sampleSize >= 3 &&
      hasMeaningfulVariance(totals);
    if (robust) return liveStats;

    if (benchmarkStats) {
      return {
        industryAverageScore: Math.round(Number(benchmarkStats.avg_total || 0)),
        industryAverageE: Math.round(Number(benchmarkStats.avg_e || 0)),
        industryAverageS: Math.round(Number(benchmarkStats.avg_s || 0)),
        industryAverageG: Math.round(Number(benchmarkStats.avg_g || 0)),
        companyCount: Number(benchmarkStats.company_count || 0),
        sampleSize: Number(benchmarkStats.sample_size || 0),
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

export const saveESGData = async ({ company, env, soc, gov, scores, auditLogEntry, userId, userEmail, benchmark }) => {
  if (!hasSupabaseConfig) {
    return { success: false, error: 'Supabase not configured - cannot persist data.' };
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

    const insertPayload = {
      company_id: companyId,
      co2_emissions: env.co2,
      energy_consumption: env.energy,
      renewable_share: env.renewable,
      recycling_rate: env.recycling,
      diversity_share: soc.diversity,
      employee_turnover: soc.turnover,
      employee_satisfaction: soc.satisfaction,
      independent_board_share: gov.boardIndependent,
      data_protection_score: gov.dataProtection,
      legal_incidents: gov.incidents,
      e_score: scores.eScore,
      s_score: scores.sScore,
      g_score: scores.gScore,
      total_score: scores.total,
    };

    if (benchmark) {
      if (benchmark.id) insertPayload.benchmark_id = benchmark.id;
      insertPayload.benchmark_snapshot = benchmark;
    }

    const { error: recordError } = await supabase.from('esg_results').insert(insertPayload);
    if (recordError) throw recordError;

    const { error: auditError } = await supabase.from('audit_logs').insert({
      company_id: companyId,
      action: auditLogEntry?.action || 'ESG Neuberechnung',
      actor: auditLogEntry?.user || userEmail || 'Aktueller Benutzer',
      impact: auditLogEntry?.impactText || 'N/A',
      status: auditLogEntry?.status || 'Geprüft',
    });
    if (auditError) throw auditError;

    return { companyId, success: true };
  } catch (err) {
    return handleError('Error saving ESG data:', err, { success: false, error: err.message });
  }
};

export const getKnownIndustries = async () => {
  if (!hasSupabaseConfig) return [];

  const { data, error } = await supabase
    .from('benchmarks')
    .select('industry')
    .order('industry', { ascending: true });

  if (error) {
    console.error('Error fetching known industries:', error);
    return [];
  }

  return [...new Set((data || []).map(row => row.industry))];
};

export const getBenchmarkCategories = () => ['Micro', 'Small', 'Medium', 'Large', 'All'];

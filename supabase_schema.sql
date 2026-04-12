-- ESG Dashboard / Calculator - Supabase Schema
-- Hinweis: Dieser Prototyp nutzt bewusst einfache Policies.
-- Für Produktion bitte Auth-gebundene RLS-Policies ergänzen.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Core tables -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  industry text NOT NULL,
  employee_count integer CHECK (employee_count >= 0),
  annual_revenue numeric(14,2) CHECK (annual_revenue >= 0),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.esg_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  co2_emissions numeric(14,2) CHECK (co2_emissions >= 0),
  energy_consumption numeric(14,2) CHECK (energy_consumption >= 0),
  renewable_share numeric(5,2) CHECK (renewable_share >= 0 AND renewable_share <= 100),
  diversity_share numeric(5,2) CHECK (diversity_share >= 0 AND diversity_share <= 100),
  employee_turnover numeric(5,2) CHECK (employee_turnover >= 0 AND employee_turnover <= 100),
  independent_board_share numeric(5,2) CHECK (independent_board_share >= 0 AND independent_board_share <= 100),
  legal_incidents integer CHECK (legal_incidents >= 0),
  e_score integer CHECK (e_score >= 0 AND e_score <= 100),
  s_score integer CHECK (s_score >= 0 AND s_score <= 100),
  g_score integer CHECK (g_score >= 0 AND g_score <= 100),
  total_score integer CHECK (total_score >= 0 AND total_score <= 100),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  action text NOT NULL,
  actor text NOT NULL DEFAULT 'System',
  impact text,
  status text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.industry_benchmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry text NOT NULL UNIQUE,
  co2_intensity_target numeric(10,2) NOT NULL,
  energy_intensity_target numeric(10,2) NOT NULL,
  renewable_target numeric(5,2) NOT NULL,
  diversity_target numeric(5,2) NOT NULL,
  turnover_target numeric(5,2) NOT NULL,
  board_independence_target numeric(5,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.industry_score_benchmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry text NOT NULL UNIQUE,
  avg_total integer NOT NULL CHECK (avg_total >= 0 AND avg_total <= 100),
  avg_e integer NOT NULL CHECK (avg_e >= 0 AND avg_e <= 100),
  avg_s integer NOT NULL CHECK (avg_s >= 0 AND avg_s <= 100),
  avg_g integer NOT NULL CHECK (avg_g >= 0 AND avg_g <= 100),
  company_count integer NOT NULL DEFAULT 0 CHECK (company_count >= 0),
  sample_size integer NOT NULL DEFAULT 0 CHECK (sample_size >= 0),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- 2) Trigger for updated_at --------------------------------------------------

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Helpful indexes ---------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_companies_name ON public.companies (company_name);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON public.companies (industry);
CREATE INDEX IF NOT EXISTS idx_companies_user ON public.companies (user_id);
CREATE INDEX IF NOT EXISTS idx_records_company_created ON public.esg_records (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_company_created ON public.audit_log (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_industry_score_benchmarks_industry ON public.industry_score_benchmarks (industry);

-- 4) RLS --------------------------------------------------------------------

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esg_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industry_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industry_score_benchmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own companies" ON public.companies;
DROP POLICY IF EXISTS "Users access own esg_records" ON public.esg_records;
DROP POLICY IF EXISTS "Users access own audit log" ON public.audit_log;
DROP POLICY IF EXISTS "Read industry benchmarks" ON public.industry_benchmarks;
DROP POLICY IF EXISTS "Read industry score benchmarks" ON public.industry_score_benchmarks;

CREATE POLICY "Users manage own companies"
  ON public.companies
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users access own esg_records"
  ON public.esg_records
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.companies c
      WHERE c.id = esg_records.company_id
        AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.companies c
      WHERE c.id = esg_records.company_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users access own audit log"
  ON public.audit_log
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.companies c
      WHERE c.id = audit_log.company_id
        AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.companies c
      WHERE c.id = audit_log.company_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Read industry benchmarks"
  ON public.industry_benchmarks
  FOR SELECT
  USING (true);

CREATE POLICY "Read industry score benchmarks"
  ON public.industry_score_benchmarks
  FOR SELECT
  USING (true);

-- Seed data lives in: supabase_seed.sql

-- ESG Dashboard / Calculator - Supabase Schema
-- Dieses Schema implementiert persistent gespeicherte ESG-Ergebnisse, Benchmark-Referenzen und RLS-Policies.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Core tables -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE OR REPLACE FUNCTION public.sync_auth_user_to_public_users()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, timezone('utc', now()), timezone('utc', now()))
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auth_user_to_public_users ON auth.users;
CREATE TRIGGER auth_user_to_public_users
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_auth_user_to_public_users();

CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  industry text NOT NULL,
  employee_count integer CHECK (employee_count >= 0),
  annual_revenue numeric(14,2) CHECK (annual_revenue >= 0),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.benchmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry text NOT NULL,
  company_size_category text NOT NULL DEFAULT 'All',
  co2_intensity_target numeric(10,2) NOT NULL,
  energy_intensity_target numeric(10,2) NOT NULL,
  renewable_target numeric(5,2) NOT NULL,
  recycling_target numeric(5,2) NOT NULL,
  diversity_target numeric(5,2) NOT NULL,
  turnover_target numeric(5,2) NOT NULL,
  satisfaction_target numeric(5,2) NOT NULL,
  board_independence_target numeric(5,2) NOT NULL,
  privacy_score_target numeric(5,2) NOT NULL,
  training_target numeric(5,2) NOT NULL DEFAULT 0 CHECK (training_target >= 0 AND training_target <= 100),
  policies_target numeric(5,2) NOT NULL DEFAULT 0 CHECK (policies_target >= 0 AND policies_target <= 100),
  avg_total integer NOT NULL CHECK (avg_total >= 0 AND avg_total <= 100),
  avg_e integer NOT NULL CHECK (avg_e >= 0 AND avg_e <= 100),
  avg_s integer NOT NULL CHECK (avg_s >= 0 AND avg_s <= 100),
  avg_g integer NOT NULL CHECK (avg_g >= 0 AND avg_g <= 100),
  company_count integer NOT NULL DEFAULT 0 CHECK (company_count >= 0),
  sample_size integer NOT NULL DEFAULT 0 CHECK (sample_size >= 0),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.benchmarks
  ADD COLUMN IF NOT EXISTS training_target numeric(5,2) NOT NULL DEFAULT 0 CHECK (training_target >= 0 AND training_target <= 100);

ALTER TABLE public.benchmarks
  ADD COLUMN IF NOT EXISTS policies_target numeric(5,2) NOT NULL DEFAULT 0 CHECK (policies_target >= 0 AND policies_target <= 100);

CREATE TABLE IF NOT EXISTS public.esg_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  co2_emissions numeric(14,2) CHECK (co2_emissions >= 0),
  energy_consumption numeric(14,2) CHECK (energy_consumption >= 0),
  renewable_share numeric(5,2) CHECK (renewable_share >= 0 AND renewable_share <= 100),
  recycling_rate numeric(5,2) CHECK (recycling_rate >= 0 AND recycling_rate <= 100),
  diversity_share numeric(5,2) CHECK (diversity_share >= 0 AND diversity_share <= 100),
  employee_turnover numeric(5,2) CHECK (employee_turnover >= 0 AND employee_turnover <= 100),
  employee_satisfaction numeric(5,2) CHECK (employee_satisfaction >= 0 AND employee_satisfaction <= 100),
  independent_board_share numeric(5,2) CHECK (independent_board_share >= 0 AND independent_board_share <= 100),
  data_protection_score numeric(5,2) CHECK (data_protection_score >= 0 AND data_protection_score <= 100),
  legal_incidents integer CHECK (legal_incidents >= 0),
  e_score integer CHECK (e_score >= 0 AND e_score <= 100),
  s_score integer CHECK (s_score >= 0 AND s_score <= 100),
  g_score integer CHECK (g_score >= 0 AND g_score <= 100),
  total_score integer CHECK (total_score >= 0 AND total_score <= 100),
  benchmark_id uuid REFERENCES public.benchmarks(id),
  benchmark_snapshot jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  action text NOT NULL,
  actor text NOT NULL DEFAULT 'System',
  impact text,
  status text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
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

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_benchmarks_updated_at ON public.benchmarks;
CREATE TRIGGER update_benchmarks_updated_at
BEFORE UPDATE ON public.benchmarks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Helpful indexes ---------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_companies_name ON public.companies (company_name);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON public.companies (industry);
CREATE INDEX IF NOT EXISTS idx_companies_user ON public.companies (user_id);
CREATE INDEX IF NOT EXISTS idx_results_company_created ON public.esg_results (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_company_created ON public.audit_logs (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_benchmarks_industry_size ON public.benchmarks (industry, company_size_category);

-- 4) RLS --------------------------------------------------------------------

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esg_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benchmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own profiles" ON public.users;
DROP POLICY IF EXISTS "Users manage own companies" ON public.companies;
DROP POLICY IF EXISTS "Users access own esg_results" ON public.esg_results;
DROP POLICY IF EXISTS "Users access own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Read benchmarks" ON public.benchmarks;

CREATE POLICY "Users manage own profiles"
  ON public.users
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users manage own companies"
  ON public.companies
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users access own esg_results"
  ON public.esg_results
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.companies c
      WHERE c.id = esg_results.company_id
        AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.companies c
      WHERE c.id = esg_results.company_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users access own audit logs"
  ON public.audit_logs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.companies c
      WHERE c.id = audit_logs.company_id
        AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.companies c
      WHERE c.id = audit_logs.company_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Read benchmarks"
  ON public.benchmarks
  FOR SELECT
  USING (true);

-- 5) Datenmodell-Hinweis ----------------------------------------------------
-- In Supabase kann das Benchmark-Table im SQL-Editor bearbeitet werden.
-- Die App lädt die Werte dynamisch und erstellt Score-Vergleiche für Branchen
-- und Unternehmensgrößen.

NOTIFY pgrst, 'reload schema';

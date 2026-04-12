-- ESG Dashboard / Calculator - Seed Data
-- Nach dem Schema ausfuehren: supabase_schema.sql

-- 1) Branchenbenchmarks ------------------------------------------------------
INSERT INTO public.industry_benchmarks (
  industry,
  co2_intensity_target,
  energy_intensity_target,
  renewable_target,
  diversity_target,
  turnover_target,
  board_independence_target
)
VALUES
  ('Manufacturing', 150, 500, 20, 30, 12, 60),
  ('Technology', 15, 100, 60, 35, 18, 75),
  ('Finance', 5, 50, 80, 45, 10, 85),
  ('Healthcare', 60, 300, 30, 50, 15, 70),
  ('Energy', 600, 900, 35, 25, 8, 65),
  ('Retail', 40, 200, 40, 45, 25, 60)
ON CONFLICT (industry) DO UPDATE SET
  co2_intensity_target = EXCLUDED.co2_intensity_target,
  energy_intensity_target = EXCLUDED.energy_intensity_target,
  renewable_target = EXCLUDED.renewable_target,
  diversity_target = EXCLUDED.diversity_target,
  turnover_target = EXCLUDED.turnover_target,
  board_independence_target = EXCLUDED.board_independence_target;

-- 1b) Branchen-Score-Referenzwerte (oeffentlich lesbar fuer Vergleich) -----
INSERT INTO public.industry_score_benchmarks (
  industry,
  avg_total,
  avg_e,
  avg_s,
  avg_g,
  company_count,
  sample_size,
  updated_at
)
VALUES
  ('Manufacturing', 61, 57, 59, 66, 38, 214, now()),
  ('Technology', 73, 70, 71, 78, 52, 303, now()),
  ('Finance', 76, 74, 73, 81, 44, 265, now()),
  ('Healthcare', 68, 63, 71, 70, 41, 248, now()),
  ('Energy', 58, 52, 57, 65, 29, 176, now()),
  ('Retail', 64, 60, 66, 67, 47, 281, now())
ON CONFLICT (industry) DO UPDATE SET
  avg_total = EXCLUDED.avg_total,
  avg_e = EXCLUDED.avg_e,
  avg_s = EXCLUDED.avg_s,
  avg_g = EXCLUDED.avg_g,
  company_count = EXCLUDED.company_count,
  sample_size = EXCLUDED.sample_size,
  updated_at = EXCLUDED.updated_at;

-- 2) Demounternehmen ---------------------------------------------------------
WITH upserted_companies AS (
  INSERT INTO public.companies (company_name, industry, employee_count, annual_revenue)
  VALUES
    ('Demo GmbH', 'Manufacturing', 250, 25000000),
    ('TechForward AG', 'Technology', 180, 32000000),
    ('Green Retail KG', 'Retail', 420, 58000000)
  ON CONFLICT DO NOTHING
  RETURNING id, company_name
)
SELECT 1;

-- 3) ESG Historie fuer Demo GmbH --------------------------------------------
DO $$
DECLARE
  demo_company_id uuid;
BEGIN
  SELECT id INTO demo_company_id
  FROM public.companies
  WHERE company_name = 'Demo GmbH'
  ORDER BY updated_at DESC
  LIMIT 1;

  IF demo_company_id IS NULL THEN
    RAISE NOTICE 'Demo GmbH nicht gefunden - Seed fuer esg_records uebersprungen';
    RETURN;
  END IF;

  INSERT INTO public.esg_records (
    company_id,
    co2_emissions,
    energy_consumption,
    renewable_share,
    diversity_share,
    employee_turnover,
    independent_board_share,
    legal_incidents,
    e_score,
    s_score,
    g_score,
    total_score,
    created_at
  ) VALUES
    (demo_company_id, 13300, 41000, 24, 26, 14, 58, 1, 44, 49, 46, 46, now() - interval '90 days'),
    (demo_company_id, 12600, 39000, 29, 30, 11, 66, 0, 55, 60, 70, 61, now() - interval '45 days'),
    (demo_company_id, 11800, 37200, 34, 33, 9, 71, 0, 63, 64, 76, 67, now())
  ON CONFLICT DO NOTHING;

  INSERT INTO public.audit_log (
    company_id,
    action,
    actor,
    impact,
    status,
    created_at
  ) VALUES
    (demo_company_id, 'Erstberechnung erstellt', 'System', '+0 Pts', 'Geprueft', now() - interval '90 days'),
    (demo_company_id, 'Neuberechnung nach Energie-Massnahmen', 'Demo User', '+15 Pts', 'Geprueft', now() - interval '45 days'),
    (demo_company_id, 'Neuberechnung Quartal 2', 'Demo User', '+6 Pts', 'In Pruefung', now())
  ON CONFLICT DO NOTHING;
END $$;

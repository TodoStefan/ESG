-- ESG Dashboard / Calculator - Seed Data
-- Nach dem Schema ausfuehren: supabase_schema.sql

-- 1) Benchmark-Referenzen für Branchen und Unternehmensgrößen ----------------
INSERT INTO public.benchmarks (
  industry,
  company_size_category,
  co2_intensity_target,
  energy_intensity_target,
  renewable_target,
  recycling_target,
  diversity_target,
  turnover_target,
  satisfaction_target,
  board_independence_target,
  privacy_score_target,
  avg_total,
  avg_e,
  avg_s,
  avg_g,
  company_count
)
VALUES
  ('Manufacturing','Micro', 180, 560, 18, 34, 28, 14, 62, 62, 48, 58, 53, 54, 22, 85),
  ('Manufacturing','Small', 160, 520, 20, 36, 30, 13, 65, 64, 52, 61, 56, 57, 30, 108),
  ('Manufacturing','Medium', 150, 500, 22, 38, 32, 12, 68, 67, 55, 63, 58, 60, 40, 172),
  ('Manufacturing','Large', 140, 470, 24, 42, 34, 11, 72, 70, 58, 66, 61, 64, 52, 196),
  ('Manufacturing','All', 150, 500, 20, 40, 32, 12, 70, 68, 57, 64, 57, 59, 38, 214),
  ('Technology','Micro', 20, 110, 50, 70, 38, 22, 72, 78, 62, 71, 68, 76, 18, 76),
  ('Technology','Small', 18, 105, 55, 72, 40, 20, 74, 80, 66, 72, 69, 77, 25, 93),
  ('Technology','Medium', 15, 100, 60, 75, 42, 18, 76, 82, 70, 73, 70, 78, 38, 145),
  ('Technology','Large', 13, 95, 65, 78, 44, 16, 78, 84, 75, 75, 72, 80, 50, 198),
  ('Technology','All', 15, 100, 60, 75, 42, 18, 76, 82, 73, 74, 71, 78, 52, 303),
  ('Finance','Micro', 7, 58, 72, 82, 42, 12, 70, 86, 64, 75, 73, 82, 14, 70),
  ('Finance','Small', 6, 54, 75, 84, 44, 11, 72, 87, 68, 76, 74, 83, 22, 102),
  ('Finance','Medium', 5, 50, 80, 86, 46, 10, 74, 88, 72, 77, 74, 84, 34, 158),
  ('Finance','Large', 4, 46, 84, 88, 48, 9, 76, 89, 76, 79, 76, 86, 46, 221),
  ('Finance','All', 5, 50, 80, 86, 45, 10, 75, 88, 76, 76, 74, 81, 44, 265),
  ('Healthcare','Micro', 70, 320, 26, 44, 54, 16, 62, 72, 66, 68, 60, 68, 12, 92),
  ('Healthcare','Small', 65, 310, 28, 46, 52, 15, 64, 74, 68, 69, 61, 69, 18, 128),
  ('Healthcare','Medium', 60, 300, 30, 48, 50, 15, 66, 76, 70, 70, 63, 71, 28, 186),
  ('Healthcare','Large', 55, 280, 32, 50, 52, 14, 68, 78, 72, 71, 65, 73, 34, 232),
  ('Healthcare','All', 60, 300, 30, 48, 50, 15, 67, 77, 68, 70, 63, 70, 41, 248),
  ('Energy','Micro', 680, 940, 30, 28, 24, 10, 54, 66, 42, 57, 49, 64, 8, 70),
  ('Energy','Small', 640, 920, 32, 30, 26, 9, 56, 68, 46, 58, 50, 65, 12, 102),
  ('Energy','Medium', 600, 900, 35, 32, 25, 8, 58, 70, 50, 58, 52, 66, 20, 136),
  ('Energy','Large', 560, 860, 38, 35, 24, 7, 60, 72, 55, 59, 54, 67, 24, 154),
  ('Energy','All', 600, 900, 35, 32, 25, 8, 59, 70, 48, 58, 52, 65, 29, 176),
  ('Retail','Micro', 45, 220, 38, 48, 48, 28, 60, 64, 52, 65, 60, 66, 15, 94),
  ('Retail','Small', 42, 210, 40, 50, 46, 26, 62, 66, 56, 65, 61, 66, 21, 124),
  ('Retail','Medium', 40, 200, 42, 52, 44, 25, 64, 68, 60, 65, 62, 67, 32, 178),
  ('Retail','Large', 38, 190, 44, 54, 46, 23, 66, 70, 64, 66, 63, 68, 38, 212),
  ('Retail','All', 40, 200, 42, 52, 45, 25, 65, 69, 62, 64, 60, 67, 47, 281)
ON CONFLICT (industry, company_size_category) DO UPDATE SET
  co2_intensity_target = EXCLUDED.co2_intensity_target,
  energy_intensity_target = EXCLUDED.energy_intensity_target,
  renewable_target = EXCLUDED.renewable_target,
  recycling_target = EXCLUDED.recycling_target,
  diversity_target = EXCLUDED.diversity_target,
  turnover_target = EXCLUDED.turnover_target,
  satisfaction_target = EXCLUDED.satisfaction_target,
  board_independence_target = EXCLUDED.board_independence_target,
  privacy_score_target = EXCLUDED.privacy_score_target,
  avg_total = EXCLUDED.avg_total,
  avg_e = EXCLUDED.avg_e,
  avg_s = EXCLUDED.avg_s,
  avg_g = EXCLUDED.avg_g,
  company_count = EXCLUDED.company_count,
  updated_at = timezone('utc', now());

-- 2) Hinweise ---------------------------------------------------------------
-- Die Benchmark-Tabelle ist dynamisch und kann im Supabase-Dashboard angepasst werden.
-- Nutzerunternehmen und Ergebnisse werden beim ersten Speichern angelegt.

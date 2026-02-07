-- Migration: Add missing ZIP codes to areas_atendidas
-- Issue: ZIP codes for Fort Mill, Charlotte, and surrounding areas were not properly seeded

-- First, ensure the areas exist
INSERT INTO public.areas_atendidas (nome, cidade, estado, zip_codes, ativo, ordem)
VALUES 
  ('Charlotte', 'Charlotte', 'NC', ARRAY[]::TEXT[], TRUE, 1)
ON CONFLICT DO NOTHING;

INSERT INTO public.areas_atendidas (nome, cidade, estado, zip_codes, ativo, ordem)
VALUES 
  ('Fort Mill', 'Fort Mill', 'SC', ARRAY[]::TEXT[], TRUE, 2)
ON CONFLICT DO NOTHING;

INSERT INTO public.areas_atendidas (nome, cidade, estado, zip_codes, ativo, ordem)
VALUES 
  ('Indian Land', 'Indian Land', 'SC', ARRAY[]::TEXT[], TRUE, 3)
ON CONFLICT DO NOTHING;

INSERT INTO public.areas_atendidas (nome, cidade, estado, zip_codes, ativo, ordem)
VALUES 
  ('Pineville', 'Pineville', 'NC', ARRAY[]::TEXT[], TRUE, 4)
ON CONFLICT DO NOTHING;

INSERT INTO public.areas_atendidas (nome, cidade, estado, zip_codes, ativo, ordem)
VALUES 
  ('Matthews', 'Matthews', 'NC', ARRAY[]::TEXT[], TRUE, 5)
ON CONFLICT DO NOTHING;

-- Update Charlotte with comprehensive ZIP codes
UPDATE public.areas_atendidas 
SET zip_codes = ARRAY[
  '28201', '28202', '28203', '28204', '28205', '28206', '28207', '28208', '28209', '28210',
  '28211', '28212', '28213', '28214', '28215', '28216', '28217', '28218', '28219', '28220',
  '28221', '28222', '28223', '28224', '28226', '28227', '28228', '28229', '28230', '28231',
  '28232', '28233', '28234', '28235', '28236', '28237', '28241', '28242', '28243', '28244',
  '28246', '28247', '28250', '28253', '28254', '28255', '28256', '28258', '28260', '28262',
  '28265', '28266', '28269', '28270', '28271', '28273', '28274', '28275', '28277', '28278',
  '28280', '28281', '28282', '28284', '28285', '28287', '28288', '28289', '28290'
]
WHERE nome = 'Charlotte' AND cidade = 'Charlotte';

-- Update Fort Mill with all ZIP codes
UPDATE public.areas_atendidas 
SET zip_codes = ARRAY['29707', '29708', '29715', '29716']
WHERE nome = 'Fort Mill' AND cidade = 'Fort Mill';

-- Update Indian Land
UPDATE public.areas_atendidas 
SET zip_codes = ARRAY['29707', '29720']
WHERE nome = 'Indian Land' AND cidade = 'Indian Land';

-- Update Pineville
UPDATE public.areas_atendidas 
SET zip_codes = ARRAY['28134', '28210']
WHERE nome = 'Pineville' AND cidade = 'Pineville';

-- Update Matthews
UPDATE public.areas_atendidas 
SET zip_codes = ARRAY['28104', '28105', '28106']
WHERE nome = 'Matthews' AND cidade = 'Matthews';

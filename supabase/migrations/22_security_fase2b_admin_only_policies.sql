-- =============================================
-- MIGRATION: Security — FASE 2B Admin-only policies
-- Date: 2026-04-09
-- =============================================
-- 11 tables had "Authenticated users can do everything" with USING(true),
-- granting every authenticated user full access. Combined with the prior
-- user_profiles.role default of 'admin' (fixed in 2D), this meant any signup
-- had unrestricted DB access. Replaced with policies that call a new
-- public.is_admin() helper.
--
-- is_admin() is SECURITY DEFINER with an empty search_path so it:
--   - bypasses RLS recursion on user_profiles
--   - is immune to schema-spoof attacks
-- =============================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'addons','agendamentos','areas_atendidas','clientes','configuracoes',
    'contratos','feedback','financeiro','precos_base','recorrencias','servicos_tipos'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can do everything" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "Admins full access" ON public.%I FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())',
      t
    );
  END LOOP;
END $$;

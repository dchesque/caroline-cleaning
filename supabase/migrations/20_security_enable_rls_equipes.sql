-- =============================================
-- MIGRATION: Security — Enable RLS on equipes / equipe_membros (Phase 1)
-- Date: 2026-04-09
-- =============================================
-- Both tables had RLS completely disabled, so anyone with the public anon
-- key could read team structure (names, member links, notes) via the
-- PostgREST auto-exposed endpoints. Enable RLS and restrict all operations
-- to admin users (verified via public.user_profiles.role = 'admin').
-- =============================================

ALTER TABLE public.equipes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipe_membros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access equipes"
  ON public.equipes FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins full access equipe_membros"
  ON public.equipe_membros FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

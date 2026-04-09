-- =============================================
-- MIGRATION: Security — FASE 2C Tighten remaining authenticated policies
-- Date: 2026-04-09
-- =============================================
-- Remaining tables had separate "Admin can view/update <table>" policies that
-- were scoped to the `authenticated` role but used qual=true, so they granted
-- access to every signed-in user. Replace with public.is_admin() checks.
-- Also drops two redundant permissive sistema_heartbeat UPDATE policies.
-- =============================================

-- ---- callbacks ----
DROP POLICY IF EXISTS "Admin can view all callbacks" ON public.callbacks;
DROP POLICY IF EXISTS "Admin can update callbacks"   ON public.callbacks;
CREATE POLICY "Admins read callbacks"
  ON public.callbacks FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins update callbacks"
  ON public.callbacks FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---- notificacoes ----
DROP POLICY IF EXISTS "Admin can view all notificacoes" ON public.notificacoes;
DROP POLICY IF EXISTS "Admin can update notificacoes"   ON public.notificacoes;
CREATE POLICY "Admins read notificacoes"
  ON public.notificacoes FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins update notificacoes"
  ON public.notificacoes FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---- orcamentos ----
DROP POLICY IF EXISTS "Admin can view all orcamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Admin can update orcamentos"   ON public.orcamentos;
CREATE POLICY "Admins read orcamentos"
  ON public.orcamentos FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins update orcamentos"
  ON public.orcamentos FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---- action_logs ----
DROP POLICY IF EXISTS "Admin can view action_logs" ON public.action_logs;
CREATE POLICY "Admins read action_logs"
  ON public.action_logs FOR SELECT TO authenticated USING (public.is_admin());

-- ---- contact_leads ----
DROP POLICY IF EXISTS "contact_leads_authenticated_select" ON public.contact_leads;
DROP POLICY IF EXISTS "contact_leads_authenticated_update" ON public.contact_leads;
DROP POLICY IF EXISTS "contact_leads_authenticated_delete" ON public.contact_leads;
CREATE POLICY "Admins read contact_leads"
  ON public.contact_leads FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins update contact_leads"
  ON public.contact_leads FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins delete contact_leads"
  ON public.contact_leads FOR DELETE TO authenticated USING (public.is_admin());

-- ---- financeiro_categorias ----
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON public.financeiro_categorias;
CREATE POLICY "Admins manage financeiro_categorias"
  ON public.financeiro_categorias FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---- pricing_config ----
DROP POLICY IF EXISTS "pricing_config_authenticated_all" ON public.pricing_config;
CREATE POLICY "Admins manage pricing_config"
  ON public.pricing_config FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---- sistema_heartbeat ----
-- Keep only the scoped "Allow ANON heartbeat update" ({anon}, id=1).
DROP POLICY IF EXISTS "Allow ANON to update heartbeat" ON public.sistema_heartbeat;
DROP POLICY IF EXISTS "Allow ANON heartbeat ping"     ON public.sistema_heartbeat;

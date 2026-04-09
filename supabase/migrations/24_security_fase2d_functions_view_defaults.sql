-- =============================================
-- MIGRATION: Security — FASE 2D Functions / view / role defaults
-- Date: 2026-04-09
-- =============================================
-- 1. user_profiles.role default was 'admin' — new signups were auto-admin.
-- 2. handle_new_user trigger hardcoded 'admin' for every new signup, which
--    was the *actual* source of auto-admin (column default alone wouldn't
--    have mattered). Use COALESCE so bootstrap seeds can still pass a role.
-- 3. auto_calculate_horario_fim trigger had mutable search_path.
-- 4. v_conversas_recentes view ran SECURITY DEFINER by default, bypassing
--    chat_sessions / mensagens_chat / clientes RLS. Rewrite with
--    security_invoker = true so the caller's RLS applies.
-- =============================================

ALTER TABLE public.user_profiles ALTER COLUMN role SET DEFAULT 'staff';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff')
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_calculate_horario_fim()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.horario_fim_estimado IS NULL AND NEW.horario_inicio IS NOT NULL AND NEW.duracao_minutos IS NOT NULL THEN
    NEW.horario_fim_estimado := (NEW.horario_inicio + (NEW.duracao_minutos || ' minutes')::INTERVAL)::TIME;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE VIEW public.v_conversas_recentes
WITH (security_invoker = true) AS
SELECT cs.id AS session_id,
    cs.source,
    cs.status,
    cs.last_activity,
    cs.contexto,
    c.id AS cliente_id,
    c.nome AS cliente_nome,
    c.telefone AS cliente_telefone,
    (SELECT mensagens_chat.content
       FROM public.mensagens_chat
      WHERE mensagens_chat.session_id = cs.id::text
      ORDER BY mensagens_chat.created_at DESC
      LIMIT 1) AS ultima_mensagem,
    (SELECT mensagens_chat.role
       FROM public.mensagens_chat
      WHERE mensagens_chat.session_id = cs.id::text
      ORDER BY mensagens_chat.created_at DESC
      LIMIT 1) AS ultima_mensagem_role,
    (SELECT count(*)
       FROM public.mensagens_chat
      WHERE mensagens_chat.session_id = cs.id::text) AS total_mensagens
FROM public.chat_sessions cs
LEFT JOIN public.clientes c ON cs.cliente_id = c.id
ORDER BY cs.last_activity DESC;

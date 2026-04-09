-- =============================================
-- MIGRATION: Security — Fix chat RLS data leak (Phase 1)
-- Date: 2026-04-09
-- =============================================
-- Active data leak: chat_sessions and mensagens_chat had policies granting
-- SELECT (and UPDATE on chat_sessions) to the `anon` / `public` roles with
-- USING (true). Anyone with the publicly-visible anon key could read all
-- chat history — customer names, phones, addresses, quotes, conversations.
--
-- This migration drops every permissive policy on both tables and replaces
-- the admin policies with ones that actually verify role='admin' against
-- public.user_profiles. Backend writes continue to work via the service
-- role, which bypasses RLS entirely (see app/api/chat/route.ts using
-- createAdminClient()).
-- =============================================

-- ---- chat_sessions ----
DROP POLICY IF EXISTS "Admin can update chat_sessions"         ON public.chat_sessions;
DROP POLICY IF EXISTS "Admin can view all chat_sessions"       ON public.chat_sessions;
DROP POLICY IF EXISTS "Anon can read chat sessions for carol"  ON public.chat_sessions;
DROP POLICY IF EXISTS "Anyone can create chat_sessions"        ON public.chat_sessions;
DROP POLICY IF EXISTS "Anyone can update chat_sessions"        ON public.chat_sessions;

CREATE POLICY "Admins can read chat sessions"
  ON public.chat_sessions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update chat sessions"
  ON public.chat_sessions FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ---- mensagens_chat ----
DROP POLICY IF EXISTS "Admins can read all messages"             ON public.mensagens_chat;
DROP POLICY IF EXISTS "Anon can insert chat"                     ON public.mensagens_chat;
DROP POLICY IF EXISTS "Anon can read session messages for carol" ON public.mensagens_chat;
DROP POLICY IF EXISTS "Authenticated users can do everything"    ON public.mensagens_chat;
DROP POLICY IF EXISTS "Service role full access mensagens_chat"  ON public.mensagens_chat;

CREATE POLICY "Admins can read chat messages"
  ON public.mensagens_chat FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

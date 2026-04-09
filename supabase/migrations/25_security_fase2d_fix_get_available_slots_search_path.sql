-- =============================================
-- MIGRATION: Security — Pin search_path on get_available_slots overloads
-- Date: 2026-04-09
-- =============================================
-- Both overloads of public.get_available_slots had (or could have) a mutable
-- search_path, which lets a caller that controls the current search_path
-- resolve unqualified table references to a malicious schema. Pin to `public`.
-- =============================================

ALTER FUNCTION public.get_available_slots(date, integer)       SET search_path = public;
ALTER FUNCTION public.get_available_slots(date, integer, uuid) SET search_path = public;

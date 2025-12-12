/* ============================================
   RESET SCHEMA - LIMPEZA TOTAL
   CUIDADO: ISSO APAGARÁ TODOS OS DADOS DAS TABELAS!
   ============================================ */

/* 1. DROP VIEWS */
DROP VIEW IF EXISTS public.v_agenda_hoje CASCADE;
DROP VIEW IF EXISTS public.v_clientes_inativos CASCADE;
DROP VIEW IF EXISTS public.v_resumo_mensal CASCADE;
DROP VIEW IF EXISTS public.v_dashboard_stats CASCADE;
DROP VIEW IF EXISTS public.v_proximos_agendamentos CASCADE;

/* 2. DROP TABLES (CASCADE remove constraints e triggers) */
DROP TABLE IF EXISTS public.financeiro CASCADE;
DROP TABLE IF EXISTS public.feedback CASCADE;
DROP TABLE IF EXISTS public.mensagens_chat CASCADE;
DROP TABLE IF EXISTS public.contratos CASCADE;
DROP TABLE IF EXISTS public.agendamentos CASCADE;
DROP TABLE IF EXISTS public.recorrencias CASCADE;
DROP TABLE IF EXISTS public.clientes CASCADE;
DROP TABLE IF EXISTS public.configuracoes CASCADE;
DROP TABLE IF EXISTS public.areas_atendidas CASCADE;
DROP TABLE IF EXISTS public.servicos_tipos CASCADE;
DROP TABLE IF EXISTS public.addons CASCADE;
DROP TABLE IF EXISTS public.precos_base CASCADE;

/* 3. DROP FUNCTIONS */
DROP FUNCTION IF EXISTS public.handle_updated_at CASCADE;
DROP FUNCTION IF EXISTS public.get_available_slots CASCADE;
DROP FUNCTION IF EXISTS public.calculate_next_recurrence CASCADE;
DROP FUNCTION IF EXISTS public.update_cliente_status CASCADE;
DROP FUNCTION IF EXISTS public.generate_contract_number CASCADE;
DROP FUNCTION IF EXISTS public.check_zip_code_coverage CASCADE;
DROP FUNCTION IF EXISTS public.calculate_service_price CASCADE;

/* 4. EXTENSÕES (Geralmente seguro manter, mas se quiser limpar tudo descomente) */
/* DROP EXTENSION IF EXISTS "uuid-ossp"; */
/* DROP EXTENSION IF EXISTS "pgcrypto"; */

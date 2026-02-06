-- ============================================
-- CONFIGURAÇÃO DE CRON NATIVO (pg_cron)
-- ============================================

-- 1. Habilitar extensões necessárias (se tiver permissão)
-- Nota: No Supabase Cloud, estas extensões já estão disponíveis
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Limpar jobs antigos se existirem (para re-execução segura)
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'send-reminders-every-15m';

-- 3. Agendar o job de lembretes a cada 15 minutos
-- IMPORTANTE: Substitua 'seu-dominio.com' e 'seu_secret_aqui' pelos valores reais
SELECT cron.schedule(
    'send-reminders-every-15m',
    '*/15 * * * *',
    $$
    SELECT net.http_get(
        url := 'https://seu-dominio.com/api/cron/reminders',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer seu_secret_aqui'
        )
    );
    $$
);

COMMENT ON COLUMN cron.job.jobname IS 'Job para disparar lembretes de agendamento via API Next.js';

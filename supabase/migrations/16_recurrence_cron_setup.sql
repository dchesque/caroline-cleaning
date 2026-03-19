-- ============================================
-- ADICIONAR JOB DE RECORRÊNCIAS AO pg_cron
-- ============================================

-- 1. Limpar job antigo se existir
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'process-recurrences-daily';

-- 2. Agendar o job de recorrências (Executa às 01:00 AM diariamente)
-- IMPORTANTE: Substitua 'seu-dominio.com' e 'seu_secret_aqui' pelos valores reais
SELECT cron.schedule(
    'process-recurrences-daily',
    '0 1 * * *',
    $$
    SELECT net.http_get(
        url := 'https://seu-dominio.com/api/cron/recurrences',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer seu_secret_aqui'
        )
    );
    $$
);

COMMENT ON COLUMN cron.job.jobname IS 'Job para gerar agendamentos futuros a partir de recorrências registradas';

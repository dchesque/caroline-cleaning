-- Migration: Add execution_logs to mensagens_chat
-- Allows storing technical tracing for AI responses

ALTER TABLE public.mensagens_chat 
ADD COLUMN IF NOT EXISTS execution_logs TEXT;

COMMENT ON COLUMN public.mensagens_chat.execution_logs IS 'Technical tracing and logs for AI message execution';

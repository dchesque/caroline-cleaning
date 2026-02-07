-- Adicionar campo de preferência de canal de contato em clientes e agendamentos
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS canal_preferencia TEXT DEFAULT 'sms' CHECK (canal_preferencia IN ('sms', 'whatsapp'));

ALTER TABLE public.agendamentos 
ADD COLUMN IF NOT EXISTS canal_preferencia TEXT DEFAULT 'sms' CHECK (canal_preferencia IN ('sms', 'whatsapp'));

-- Comentários para documentação
COMMENT ON COLUMN public.clientes.canal_preferencia IS 'Canal preferido para contato: sms ou whatsapp';
COMMENT ON COLUMN public.agendamentos.canal_preferencia IS 'Canal utilizado para as notificações deste agendamento';

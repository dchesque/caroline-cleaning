-- Migration: Central de Leads
-- Adds columns for unified lead management

-- 1. mensagem field for contact form
ALTER TABLE public.contact_leads
ADD COLUMN mensagem TEXT;

-- 2. data_retorno for follow-up scheduling
ALTER TABLE public.contact_leads
ADD COLUMN data_retorno DATE;

ALTER TABLE public.clientes
ADD COLUMN data_retorno DATE;

-- 3. contacted_at tracking for chat leads
ALTER TABLE public.clientes
ADD COLUMN contacted_at TIMESTAMPTZ;

-- 4. Soft delete support
ALTER TABLE public.contact_leads
ADD COLUMN deleted_at TIMESTAMPTZ;

ALTER TABLE public.clientes
ADD COLUMN deleted_at TIMESTAMPTZ;

-- 5. Performance indexes
CREATE INDEX idx_contact_leads_deleted_at ON public.contact_leads(deleted_at);
CREATE INDEX idx_contact_leads_data_retorno ON public.contact_leads(data_retorno);
CREATE INDEX idx_clientes_deleted_at ON public.clientes(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_clientes_data_retorno ON public.clientes(data_retorno);
CREATE INDEX idx_clientes_contacted_at ON public.clientes(contacted_at);

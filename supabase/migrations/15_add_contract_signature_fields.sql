-- Adiciona os campos necessarios para a funcionalidade de Termos de Servico e Assinatura Digital
ALTER TABLE public.contratos 
ADD COLUMN IF NOT EXISTS documento_corpo TEXT,
ADD COLUMN IF NOT EXISTS assinatura_cliente TEXT,
ADD COLUMN IF NOT EXISTS data_assinatura TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ip_assinatura VARCHAR(45);

COMMENT ON COLUMN public.contratos.documento_corpo IS 'Texto completo do contrato/termo acordado';
COMMENT ON COLUMN public.contratos.assinatura_cliente IS 'Imagem base64 da assinatura do cliente';
COMMENT ON COLUMN public.contratos.data_assinatura IS 'Data e hora exata em que o cliente assinou digitalmente';
COMMENT ON COLUMN public.contratos.ip_assinatura IS 'Endereco IP do dispositivo que realizou a assinatura';

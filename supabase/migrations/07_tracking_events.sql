-- Migration: Create tracking_events table
-- Tabela para registrar todos os eventos de tracking para analytics

CREATE TABLE IF NOT EXISTS public.tracking_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação do evento
    event_name TEXT NOT NULL,
    event_id TEXT,                    -- Para deduplicação entre client e server
    
    -- Dados do usuário (hashados para privacidade)
    user_email_hash TEXT,
    user_phone_hash TEXT,
    ip_address TEXT,
    user_agent TEXT,
    
    -- Cookies do Facebook
    fbc TEXT,                         -- Facebook Click ID
    fbp TEXT,                         -- Facebook Browser ID
    
    -- Dados do evento
    custom_data JSONB DEFAULT '{}',
    page_url TEXT,
    referrer TEXT,
    
    -- Rastreamento de envio
    sent_to_meta BOOLEAN DEFAULT FALSE,
    sent_to_google BOOLEAN DEFAULT FALSE,
    sent_to_tiktok BOOLEAN DEFAULT FALSE,
    
    -- Associação com cliente (se existir)
    client_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
    session_id TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_tracking_events_name ON public.tracking_events(event_name);
CREATE INDEX IF NOT EXISTS idx_tracking_events_created ON public.tracking_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_events_event_id ON public.tracking_events(event_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_client ON public.tracking_events(client_id);

-- RLS (permitir insert público, select apenas autenticado)
ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;

-- Policy: qualquer um pode inserir eventos
CREATE POLICY "Anyone can insert tracking events"
    ON public.tracking_events FOR INSERT
    WITH CHECK (true);

-- Policy: apenas usuários autenticados podem ler
CREATE POLICY "Authenticated users can view tracking events"
    ON public.tracking_events FOR SELECT
    USING (auth.role() = 'authenticated');

-- Comentário
COMMENT ON TABLE public.tracking_events IS 'Log de eventos de tracking para analytics e debugging';

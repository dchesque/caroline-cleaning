-- =============================================
-- MIGRATION: Reestruturação de Configurações
-- Data: Janeiro 2026
-- Descrição: Adiciona novas colunas e configs para personalização completa
-- =============================================

-- 1. Adicionar coluna de grupo/categoria melhorada
ALTER TABLE public.configuracoes 
ADD COLUMN IF NOT EXISTS grupo TEXT DEFAULT 'empresa';

-- 2. Atualizar constraint de categoria
ALTER TABLE public.configuracoes DROP CONSTRAINT IF EXISTS configuracoes_categoria_check;
ALTER TABLE public.configuracoes ADD CONSTRAINT configuracoes_categoria_check 
  CHECK (categoria IN ('geral', 'empresa', 'pagina_inicial', 'sistema', 'integracao', 'horarios', 'precos', 'notificacoes', 'agendamento'));

-- 3. Criar índice para queries por grupo
CREATE INDEX IF NOT EXISTS idx_configuracoes_grupo ON public.configuracoes(grupo);
CREATE INDEX IF NOT EXISTS idx_configuracoes_categoria ON public.configuracoes(categoria);

-- 4. Atualizar configs existentes com grupo correto
UPDATE public.configuracoes SET grupo = 'empresa' WHERE chave LIKE 'business_%' OR chave LIKE 'social_%' OR chave LIKE 'empresa_%';
UPDATE public.configuracoes SET grupo = 'sistema' WHERE chave LIKE 'operating_%' OR chave LIKE 'booking_%' OR chave LIKE 'notification_%';
UPDATE public.configuracoes SET grupo = 'pagina_inicial' WHERE chave LIKE 'hero_%' OR chave LIKE 'chat_%' OR chave LIKE 'seo_%' OR chave LIKE 'announcement_%';

-- 5. Inserir novas configurações para Página Inicial
INSERT INTO public.configuracoes (chave, valor, categoria, grupo, descricao) VALUES
  -- Hero Section
  ('hero_title', '"Professional Cleaning, Instantly Scheduled"', 'pagina_inicial', 'pagina_inicial', 'Título principal da hero section'),
  ('hero_subtitle', '"Book your free estimate 24/7 through our chat assistant. No contracts, background-checked staff, satisfaction guaranteed."', 'pagina_inicial', 'pagina_inicial', 'Subtítulo da hero section'),
  ('hero_cta_text', '"Schedule Visit Now"', 'pagina_inicial', 'pagina_inicial', 'Texto do botão CTA principal'),
  ('hero_cta_secondary', '"Talk to Carol"', 'pagina_inicial', 'pagina_inicial', 'Texto do botão CTA secundário'),
  ('hero_image', '""', 'pagina_inicial', 'pagina_inicial', 'URL da imagem de fundo da hero'),
  
  -- Trust Badges
  ('badges_enabled', 'true', 'pagina_inicial', 'pagina_inicial', 'Exibir badges de confiança'),
  ('badges_rating', '"4.9"', 'pagina_inicial', 'pagina_inicial', 'Nota de avaliação'),
  ('badges_reviews_count', '"200+"', 'pagina_inicial', 'pagina_inicial', 'Quantidade de reviews'),
  ('badges_years_experience', '"5+"', 'pagina_inicial', 'pagina_inicial', 'Anos de experiência'),
  ('badges_google_reviews_url', '""', 'pagina_inicial', 'pagina_inicial', 'Link para Google Reviews'),
  
  -- Chat/Carol AI
  ('ai_name', '"Carol"', 'pagina_inicial', 'pagina_inicial', 'Nome da assistente virtual'),
  ('ai_avatar', '""', 'pagina_inicial', 'pagina_inicial', 'URL do avatar da IA'),
  ('ai_greeting', '"Hi! I''m Carol from Caroline Premium Cleaning. How can I help you today?"', 'pagina_inicial', 'pagina_inicial', 'Mensagem de boas-vindas do chat'),
  ('ai_tone', '"friendly"', 'pagina_inicial', 'pagina_inicial', 'Tom da IA: friendly, professional, casual'),
  ('chat_enabled', 'true', 'pagina_inicial', 'pagina_inicial', 'Habilitar chat widget'),
  ('chat_position', '"bottom-right"', 'pagina_inicial', 'pagina_inicial', 'Posição do chat widget'),
  
  -- SEO
  ('seo_title', '"Caroline Premium Cleaning | Professional House Cleaning"', 'pagina_inicial', 'pagina_inicial', 'Meta title para SEO'),
  ('seo_description', '"Professional house cleaning services. Book your free estimate 24/7."', 'pagina_inicial', 'pagina_inicial', 'Meta description para SEO'),
  ('seo_og_image', '""', 'pagina_inicial', 'pagina_inicial', 'Imagem para Open Graph'),
  ('seo_keywords', '"house cleaning, cleaning service, professional cleaning"', 'pagina_inicial', 'pagina_inicial', 'Keywords para SEO'),
  
  -- Announcement Bar
  ('announcement_enabled', 'true', 'pagina_inicial', 'pagina_inicial', 'Exibir barra de anúncio'),
  ('announcement_bg_color', '"#C48B7F"', 'pagina_inicial', 'pagina_inicial', 'Cor de fundo da barra de anúncio')
ON CONFLICT (chave) DO NOTHING;

-- 6. Inserir configurações de Sistema que podem estar faltando
INSERT INTO public.configuracoes (chave, valor, categoria, grupo, descricao) VALUES
  ('booking_min_notice_hours', '24', 'agendamento', 'sistema', 'Antecedência mínima em horas para agendamento'),
  ('booking_max_advance_days', '60', 'agendamento', 'sistema', 'Máximo de dias no futuro para agendamento'),
  ('booking_default_duration', '180', 'agendamento', 'sistema', 'Duração padrão de serviço em minutos'),
  ('booking_buffer_minutes', '30', 'agendamento', 'sistema', 'Intervalo entre agendamentos em minutos'),
  ('notification_reminder_24h', 'true', 'notificacoes', 'sistema', 'Enviar lembrete 24h antes'),
  ('notification_reminder_2h', 'true', 'notificacoes', 'sistema', 'Enviar lembrete 2h antes'),
  ('notification_new_booking', 'true', 'notificacoes', 'sistema', 'Notificar novos agendamentos'),
  ('notification_cancellation', 'true', 'notificacoes', 'sistema', 'Notificar cancelamentos'),
  ('notification_channel_sms', 'true', 'notificacoes', 'sistema', 'Habilitar notificações por SMS'),
  ('notification_channel_email', 'true', 'notificacoes', 'sistema', 'Habilitar notificações por Email')
ON CONFLICT (chave) DO NOTHING;

-- 7. View para facilitar queries por grupo
CREATE OR REPLACE VIEW v_configuracoes_por_grupo AS
SELECT 
  grupo,
  categoria,
  jsonb_object_agg(chave, valor) as configs
FROM public.configuracoes
GROUP BY grupo, categoria;

-- 8. Função para buscar configs por grupo
CREATE OR REPLACE FUNCTION get_configs_by_grupo(p_grupo TEXT)
RETURNS TABLE (chave TEXT, valor JSONB, categoria TEXT, descricao TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT c.chave, c.valor, c.categoria, c.descricao
  FROM public.configuracoes c
  WHERE c.grupo = p_grupo
  ORDER BY c.categoria, c.chave;
END;
$$;

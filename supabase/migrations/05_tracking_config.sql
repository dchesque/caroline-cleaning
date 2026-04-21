-- Migration: Add Tracking Configurations
-- Group: trackeamento

-- Update category constraint to include new categories
ALTER TABLE public.configuracoes DROP CONSTRAINT IF EXISTS configuracoes_categoria_check;
ALTER TABLE public.configuracoes ADD CONSTRAINT configuracoes_categoria_check 
  CHECK (categoria IN ('geral', 'empresa', 'pagina_inicial', 'sistema', 'integracao', 'horarios', 'precos', 'notificacoes', 'agendamento', 'marketing', 'trackeamento'));

INSERT INTO configuracoes (chave, valor, grupo, categoria) VALUES
('tracking_meta_enabled', 'false', 'trackeamento', 'marketing'),
('tracking_meta_pixel_id', '""', 'trackeamento', 'marketing'),
('tracking_meta_access_token', '""', 'trackeamento', 'marketing'),
('tracking_meta_capi_enabled', 'false', 'trackeamento', 'marketing'),
('tracking_meta_test_event_code', '""', 'trackeamento', 'marketing'),
('tracking_google_ads_enabled', 'false', 'trackeamento', 'marketing'),
('tracking_google_ads_id', '""', 'trackeamento', 'marketing'),
('tracking_google_ads_label', '""', 'trackeamento', 'marketing'),
('tracking_ga4_enabled', 'false', 'trackeamento', 'marketing'),
('tracking_ga4_measurement_id', '""', 'trackeamento', 'marketing'),
('tracking_gtm_enabled', 'false', 'trackeamento', 'marketing'),
('tracking_gtm_id', '""', 'trackeamento', 'marketing'),
('tracking_tiktok_enabled', 'false', 'trackeamento', 'marketing'),
('tracking_tiktok_pixel_id', '""', 'trackeamento', 'marketing'),
('tracking_utmify_enabled', 'false', 'trackeamento', 'marketing'),
('tracking_utmify_pixel_id', '""', 'trackeamento', 'marketing'),
('tracking_custom_head_scripts', '""', 'trackeamento', 'integracao'),
('tracking_custom_body_scripts', '""', 'trackeamento', 'integracao')
ON CONFLICT (chave) DO NOTHING;


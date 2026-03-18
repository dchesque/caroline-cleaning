-- Create storage bucket for company assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-assets',
  'company-assets',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for company-assets
-- Note: We use specific names to avoid conflicts with other bucket policies

-- Allow public access to view files
DROP POLICY IF EXISTS "Public read company-assets" ON storage.objects;
CREATE POLICY "Public read company-assets" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'company-assets');

-- Allow authenticated users to upload
DROP POLICY IF EXISTS "Auth upload company-assets" ON storage.objects;
CREATE POLICY "Auth upload company-assets" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'company-assets');

-- Allow authenticated users to update
DROP POLICY IF EXISTS "Auth update company-assets" ON storage.objects;
CREATE POLICY "Auth update company-assets" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'company-assets');

-- Allow authenticated users to delete
DROP POLICY IF EXISTS "Auth delete company-assets" ON storage.objects;
CREATE POLICY "Auth delete company-assets" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'company-assets');

-- Update the check constraint to allow 'agendamento'
ALTER TABLE public.configuracoes DROP CONSTRAINT IF EXISTS configuracoes_categoria_check;
ALTER TABLE public.configuracoes ADD CONSTRAINT configuracoes_categoria_check 
  CHECK (categoria IN ('geral', 'horarios', 'precos', 'notificacoes', 'integracao', 'agendamento'));

-- Seed missing configuration keys used by the frontend
-- Note: existing keys like empresa_nome are mapped in the frontend code
-- We use English keys for the new entries to match the frontend code style for now,
-- preventing mapping complexity for non-legacy keys.
INSERT INTO public.configuracoes (chave, valor, categoria, descricao) VALUES
  ('social_google', '""', 'geral', 'Link para reviews do Google'),
  ('social_facebook', '""', 'geral', 'Link do Facebook'),
  ('social_instagram', '""', 'geral', 'Link do Instagram'),
  ('social_twitter', '""', 'geral', 'Link do Twitter'),
  ('business_logo', '""', 'geral', 'URL do logo da empresa'),
  ('announcement_text', '"Serving Charlotte, NC & Fort Mill, SC — plus nearby cities. • Chat with Carol 24/7"', 'geral', 'Texto da barra de anúncio'),
  ('business_description', '"Serving Charlotte, NC, Fort Mill, SC, and nearby cities with premium cleaning services tailored to your lifestyle."', 'geral', 'Descrição no rodapé'),
  ('chat_bot_name', '"Carol"', 'geral', 'Nome do chatbot'),
  ('hero_title_1', '"Premium Cleaning for Homes &"', 'geral', 'Título linha 1'),
  ('hero_title_2', '"Offices in Charlotte & Fort Mill"', 'geral', 'Título linha 2'),
  ('hero_subtitle', '"Reliable residential and commercial cleaning services with carefully selected professionals, flexible scheduling, and consistent results."', 'geral', 'Subtítulo do Hero'),
  ('hero_cta_text', '"Schedule a Visit"', 'geral', 'Texto do botão CTA'),
  ('business_website', '"www.Chesquecleaning.com"', 'geral', 'Website oficial'),
  ('business_address', '"123 Ocean Drive, Miami, FL 33139"', 'geral', 'Endereço completo'),
  ('business_phone_display', '"(551) 389-7394"', 'geral', 'Telefone para exibição'),
  ('notify_new_booking', 'true', 'notificacoes', 'Notificar novo agendamento'),
  ('notify_cancellation', 'true', 'notificacoes', 'Notificar cancelamento'),
  ('notify_reminder', 'true', 'notificacoes', 'Enviar lembretes'),
  ('reminder_hours', '24', 'notificacoes', 'Horas de antecedência do lembrete'),
  ('min_booking_notice', '24', 'agendamento', 'Antecedência mínima para agendar'),
  ('max_booking_advance', '30', 'agendamento', 'Antecedência máxima para agendar'),
  ('default_duration', '180', 'agendamento', 'Duração padrão em minutos'),
  ('operating_active', 'true', 'horarios', 'Horário de funcionamento ativo'),
  ('operating_days', '["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]', 'horarios', 'Dias de funcionamento')
ON CONFLICT (chave) DO NOTHING;

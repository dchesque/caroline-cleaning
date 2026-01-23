-- =============================================
-- MIGRATION: Fix Config Access and Schema
-- Data: 23 Janeiro 2026
-- Descrição: Libera leitura pública (anon) e atualiza constraints
-- =============================================

-- 1. Liberar acesso de leitura pública (anon) para configurações
-- Isso é necessário para que a Landing Page consiga ler as configs do banco
DROP POLICY IF EXISTS "Public read settings" ON public.configuracoes;
CREATE POLICY "Public read settings" ON public.configuracoes
  FOR SELECT TO anon USING (true);

-- 2. Atualizar a constraint de categoria para aceitar todas as seções
-- Evita erros de "check constraint" ao salvar novas seções no admin
ALTER TABLE public.configuracoes DROP CONSTRAINT IF EXISTS configuracoes_categoria_check;
ALTER TABLE public.configuracoes ADD CONSTRAINT configuracoes_categoria_check 
  CHECK (categoria IN ('geral', 'empresa', 'pagina_inicial', 'sistema', 'integracao', 'horarios', 'precos', 'notificacoes', 'agendamento'));

-- 3. Garantir que a coluna grupo exista
ALTER TABLE public.configuracoes 
ADD COLUMN IF NOT EXISTS grupo TEXT DEFAULT 'geral';

-- 4. Inserir chaves de Pricing se não existirem
INSERT INTO public.configuracoes (chave, valor, categoria, grupo, descricao) VALUES
  ('pricing_title', '"Transparent Pricing"', 'pagina_inicial', 'pagina_inicial', 'Título da seção de preços'),
  ('pricing_subtitle', '"Honest pricing with no hidden fees. Final quote depends on home size and specific needs."', 'pagina_inicial', 'pagina_inicial', 'Subtítulo da seção de preços'),
  ('pricing_format', '"range"', 'pagina_inicial', 'pagina_inicial', 'Formato: range ou starting_at'),
  ('pricing_cta_text', '"Schedule Visit Now"', 'pagina_inicial', 'pagina_inicial', 'Texto do botão de preços'),
  ('pricing_cta_subtext', '"Want an exact quote? Chat with Carol — most quotes ready in under 5 minutes."', 'pagina_inicial', 'pagina_inicial', 'Subtexto do CTA de preços')
ON CONFLICT (chave) DO NOTHING;

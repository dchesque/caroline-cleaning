-- Inicializar chaves de desconto e buffer de deslocamento se não existirem
-- Grupo: sistema
-- Categoria: precificacao / agendamento

INSERT INTO public.configuracoes (chave, valor, grupo, categoria)
VALUES 
  ('desconto_weekly', '20', 'sistema', 'precificacao'),
  ('desconto_biweekly', '15', 'sistema', 'precificacao'),
  ('desconto_monthly', '10', 'sistema', 'precificacao'),
  ('buffer_deslocamento', '60', 'sistema', 'agendamento')
ON CONFLICT (chave) DO NOTHING;

-- Adicionar comentário de auditoria
COMMENT ON TABLE public.configuracoes IS 'Tabela de configurações globais do sistema Chesque Cleaning. Auditada em 2026-03-19.';

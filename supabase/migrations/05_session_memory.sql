-- Migration: Adicionar campo de contexto para memória de sessão
-- Permite que a Carol "lembre" informações importantes durante a conversa

-- Adicionar campo contexto (JSONB) para armazenar dados da conversa
ALTER TABLE chat_sessions 
ADD COLUMN IF NOT EXISTS contexto JSONB DEFAULT '{}';

-- Comentário para documentação
COMMENT ON COLUMN chat_sessions.contexto IS 'Armazena contexto da conversa: cliente_id, cliente_nome, servico_selecionado, data_selecionada, etc.';

-- Index para queries no contexto (se necessário buscar por cliente)
CREATE INDEX IF NOT EXISTS idx_chat_sessions_contexto_cliente 
ON chat_sessions ((contexto->>'cliente_id'));

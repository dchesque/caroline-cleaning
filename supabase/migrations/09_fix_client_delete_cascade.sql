-- ============================================
-- MIGRATION: Fix Client Delete Cascade
-- Descrição: Configura a deleção em cascata para evitar erros FK 23503
-- ============================================

-- 1. Tabela chat_sessions
ALTER TABLE public.chat_sessions 
DROP CONSTRAINT IF EXISTS chat_sessions_cliente_id_fkey,
ADD CONSTRAINT chat_sessions_cliente_id_fkey 
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE;

-- 2. Tabela mensagens_chat
-- Nota: Como o nome pode variar se gerado automaticamente, tentamos o padrão
ALTER TABLE public.mensagens_chat 
DROP CONSTRAINT IF EXISTS mensagens_chat_cliente_id_fkey,
ADD CONSTRAINT mensagens_chat_cliente_id_fkey 
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE;

-- 3. Tabela orcamentos
ALTER TABLE public.orcamentos 
DROP CONSTRAINT IF EXISTS orcamentos_cliente_id_fkey,
ADD CONSTRAINT orcamentos_cliente_id_fkey 
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE;

-- 4. Tabela callbacks
ALTER TABLE public.callbacks 
DROP CONSTRAINT IF EXISTS callbacks_cliente_id_fkey,
ADD CONSTRAINT callbacks_cliente_id_fkey 
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE;

-- 5. Tabela agendamentos
-- Buscando a constraint agendamentos_cliente_id_fkey
ALTER TABLE public.agendamentos 
DROP CONSTRAINT IF EXISTS agendamentos_cliente_id_fkey,
ADD CONSTRAINT agendamentos_cliente_id_fkey 
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE;

-- Opcional: Adicionar comentário para documentação
COMMENT ON CONSTRAINT chat_sessions_cliente_id_fkey ON public.chat_sessions IS 'Deleção em cascata vinculada ao cliente';

-- Script para adicionar policies de leitura nas tabelas de chat
-- Execute este script no SQL Editor do Supabase

-- Habilitar RLS nas tabelas se não estiver
ALTER TABLE IF EXISTS mensagens_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_sessions ENABLE ROW LEVEL SECURITY;

-- Policy para permitir SELECT em mensagens_chat para usuários autenticados (admin)
DROP POLICY IF EXISTS "Admins can read all messages" ON mensagens_chat;
CREATE POLICY "Admins can read all messages" ON mensagens_chat
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy para permitir INSERT em mensagens_chat (para o service role já funciona, mas vamos garantir)
DROP POLICY IF EXISTS "Service role can insert messages" ON mensagens_chat;
CREATE POLICY "Service role can insert messages" ON mensagens_chat
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Policy para chat_sessions
DROP POLICY IF EXISTS "Admins can read all sessions" ON chat_sessions;
CREATE POLICY "Admins can read all sessions" ON chat_sessions
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Service role can manage sessions" ON chat_sessions;
CREATE POLICY "Service role can manage sessions" ON chat_sessions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Verificar se as policies foram criadas
SELECT tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('mensagens_chat', 'chat_sessions');

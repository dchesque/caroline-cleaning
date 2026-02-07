-- Migration: Update v_conversas_recentes view
-- Date: 2026-02-07

-- Postgres não permite CREATE OR REPLACE VIEW se os nomes ou ordens das colunas mudarem significativamente.
-- Por isso, damos um DROP antes.
DROP VIEW IF EXISTS v_conversas_recentes;

CREATE OR REPLACE VIEW v_conversas_recentes AS
SELECT 
  cs.id as session_id,
  cs.source,
  cs.status,
  cs.last_activity,
  cs.contexto,
  c.id as cliente_id,
  c.status as cliente_status,
  c.nome as cliente_nome,
  c.telefone as cliente_telefone,
  (
    SELECT content 
    FROM mensagens_chat 
    WHERE session_id = cs.id 
    ORDER BY created_at DESC 
    LIMIT 1
  ) as ultima_mensagem,
  (
    SELECT role 
    FROM mensagens_chat 
    WHERE session_id = cs.id 
    ORDER BY created_at DESC 
    LIMIT 1
  ) as ultima_mensagem_role,
  (
    SELECT COUNT(*) 
    FROM mensagens_chat 
    WHERE session_id = cs.id
  ) as total_mensagens
FROM chat_sessions cs
LEFT JOIN clientes c ON cs.cliente_id = c.id
ORDER BY cs.last_activity DESC;

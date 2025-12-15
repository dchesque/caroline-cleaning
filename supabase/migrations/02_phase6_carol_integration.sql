-- Tabela de sessões de chat
CREATE TABLE IF NOT EXISTS chat_sessions (
  id VARCHAR(100) PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id),
  source VARCHAR(20) DEFAULT 'website',
  status VARCHAR(20) DEFAULT 'active',
  last_intent VARCHAR(100),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de logs de ações
CREATE TABLE IF NOT EXISTS action_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id VARCHAR(100),
  action_type VARCHAR(50) NOT NULL,
  params JSONB,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de orçamentos
CREATE TABLE IF NOT EXISTS orcamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES clientes(id),
  session_id VARCHAR(100),
  tipo_servico VARCHAR(50),
  valor_estimado DECIMAL(10,2),
  detalhes JSONB,
  status VARCHAR(20) DEFAULT 'enviado',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- Tabela de callbacks
CREATE TABLE IF NOT EXISTS callbacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES clientes(id),
  session_id VARCHAR(100),
  telefone VARCHAR(20),
  horario_preferido VARCHAR(50),
  notas TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  atendido_por UUID,
  atendido_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  canal VARCHAR(20) NOT NULL, -- whatsapp, email, sms
  destinatario VARCHAR(100) NOT NULL,
  template VARCHAR(50),
  dados JSONB,
  status VARCHAR(20) DEFAULT 'pending',
  enviado_em TIMESTAMPTZ,
  erro TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar coluna source na tabela mensagens_chat se não existir
ALTER TABLE mensagens_chat 
ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'website';

ALTER TABLE mensagens_chat 
ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id);

ALTER TABLE mensagens_chat 
ADD COLUMN IF NOT EXISTS intent_detected VARCHAR(100);

ALTER TABLE mensagens_chat 
ADD COLUMN IF NOT EXISTS intent_confidence DECIMAL(3,2);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_cliente ON chat_sessions(cliente_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_activity ON chat_sessions(last_activity);
CREATE INDEX IF NOT EXISTS idx_action_logs_session ON action_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_created ON action_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_callbacks_status ON callbacks(status);
CREATE INDEX IF NOT EXISTS idx_notificacoes_status ON notificacoes(status);

-- View para conversas recentes
CREATE OR REPLACE VIEW v_conversas_recentes AS
SELECT 
  cs.id as session_id,
  cs.source,
  cs.status,
  cs.last_activity,
  c.id as cliente_id,
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
    SELECT COUNT(*) 
    FROM mensagens_chat 
    WHERE session_id = cs.id
  ) as total_mensagens
FROM chat_sessions cs
LEFT JOIN clientes c ON cs.cliente_id = c.id
ORDER BY cs.last_activity DESC;

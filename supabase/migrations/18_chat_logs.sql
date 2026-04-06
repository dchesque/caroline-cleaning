-- supabase/migrations/18_chat_logs.sql
-- Chat Logs Audit System

CREATE TABLE chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,

  -- Message direction
  direction TEXT NOT NULL CHECK (direction IN ('user', 'assistant')),
  message_content TEXT NOT NULL,

  -- State machine state
  state_before TEXT,
  state_after TEXT,

  -- Structured data (JSONB)
  llm_calls JSONB DEFAULT '[]',
  handlers_executed JSONB DEFAULT '[]',
  extracted_data JSONB DEFAULT '{}',
  context_snapshot JSONB DEFAULT '{}',
  errors JSONB DEFAULT '[]',

  -- Metrics
  response_time_ms INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_chat_logs_session ON chat_logs(session_id);
CREATE INDEX idx_chat_logs_cliente ON chat_logs(cliente_id);
CREATE INDEX idx_chat_logs_created ON chat_logs(created_at DESC);
CREATE INDEX idx_chat_logs_session_created ON chat_logs(session_id, created_at);

-- RLS
ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage chat_logs" ON chat_logs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Grant access to service role (for logging)
GRANT ALL ON chat_logs TO service_role;
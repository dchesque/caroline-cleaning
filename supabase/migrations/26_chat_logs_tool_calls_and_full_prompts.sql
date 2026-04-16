-- Migration 26: add tool_calls column to chat_logs
-- Stores tool invocations (e.g. save_lead) with args, result, and timing

ALTER TABLE chat_logs
  ADD COLUMN IF NOT EXISTS tool_calls JSONB DEFAULT '[]';

COMMENT ON COLUMN chat_logs.tool_calls IS
  'Array of ToolCallRecord: { tool, args, result, success, duration_ms }';

-- Also update the llm_calls JSONB comment to reflect new schema
-- (prompt_content + response_content instead of prompt_preview)
COMMENT ON COLUMN chat_logs.llm_calls IS
  'Array of LLMCallRecord: { type, model, prompt_content, response_content, tokens_used, prompt_tokens, completion_tokens, duration_ms }';

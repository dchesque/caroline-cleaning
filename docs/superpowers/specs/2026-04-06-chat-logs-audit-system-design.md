# Chat Logs Audit System - Design Spec

**Date:** 2026-04-06
**Author:** Claude + Daniel
**Status:** Approved

## Overview

Sistema de logs de auditoria para todas as conversas da Carol AI, com visualização no painel administrativo.

## Goals

- Debug e auditoria de conversas
- Visualização no admin panel
- Retenção de 30 dias
- Captura detalhada: LLM calls, state transitions, handlers, dados extraídos

## Non-Goals

- Analytics avançados (métricas, dashboards)
- Export automático para serviços externos (S3, GCS, etc.)
- Real-time monitoring
- Integração com ferramentas de observabilidade (DataDog, Sentry, etc.)

> **Nota:** Export manual (CSV/JSON) de conversas individuais está no escopo.

## Architecture

### Database Schema

```sql
CREATE TABLE chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,

  -- Direção da mensagem
  direction TEXT NOT NULL CHECK (direction IN ('user', 'assistant')),
  message_content TEXT NOT NULL,

  -- Estado da máquina
  state_before TEXT,
  state_after TEXT,

  -- Dados estruturados (JSONB)
  llm_calls JSONB DEFAULT '[]',        -- Chamadas LLM feitas
  handlers_executed JSONB DEFAULT '[]', -- Handlers rodados
  extracted_data JSONB DEFAULT '{}',    -- Dados extraídos (phone, name, etc.)
  context_snapshot JSONB DEFAULT '{}',  -- Contexto da sessão no momento
  errors JSONB DEFAULT '[]',            -- Erros/warnings

  -- Métricas
  response_time_ms INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para queries comuns
CREATE INDEX idx_chat_logs_session ON chat_logs(session_id);
CREATE INDEX idx_chat_logs_cliente ON chat_logs(cliente_id);
CREATE INDEX idx_chat_logs_created ON chat_logs(created_at DESC);
CREATE INDEX idx_chat_logs_session_created ON chat_logs(session_id, created_at);

-- RLS habilitado (admin apenas)
ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Apenas admins podem acessar
CREATE POLICY "Admins can manage chat_logs" ON chat_logs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );
```

### JSONB Structures

**llm_calls:**
```json
[
  {
    "type": "extract" | "classify" | "generate" | "faq",
    "model": "google/gemini-3.1-pro-preview",
    "prompt_preview": "Extract phone from...",
    "tokens_used": 150,
    "duration_ms": 850
  }
]
```

**handlers_executed:**
```json
[
  {"handler": "greetingHandler", "duration_ms": 12},
  {"handler": "phoneHandler", "duration_ms": 850}
]
```

**extracted_data:**
```json
{"phone": "+15551234567", "name": "João", "intent": "booking"}
```

**errors:**
```json
[{"type": "warning" | "error", "message": "ZIP not covered", "state": "CHECK_ZIP"}]
```

### Backend Flow

```
User Message → API Route (start timer)
      ↓
State Machine Process
      ↓
├── Handler execution (log handler name + duration)
├── LLM calls dentro do handler (log model, tokens, duration)
├── Context updates (log extracted data)
└── State transitions (log before/after)
      ↓
Response → API Route (stop timer)
      ↓
ChatLogger.logInteraction() → Supabase
```

### Components

| Component | File | Description |
|-----------|------|-------------|
| Logger Service | `lib/services/chat-logger.ts` | Novo serviço de logging |
| Engine hooks | `lib/ai/state-machine/engine.ts` | Callbacks para captura |
| LLM metrics | `lib/ai/llm.ts` | Retornar métricas |
| API routes | `app/api/admin/chat-logs/` | Endpoints para admin |
| Admin UI | `app/(admin)/admin/chat-logs/` | Visualização |
| Cron cleanup | `app/api/cron/cleanup-logs/route.ts` | Delete logs > 30 dias |

### ChatLogger Service Interface

```typescript
// lib/services/chat-logger.ts

export interface LLMCallRecord {
  type: 'extract' | 'classify' | 'generate' | 'faq'
  model: string
  prompt_preview: string  // Primeiros 100 chars
  tokens_used?: number
  duration_ms: number
}

export interface HandlerRecord {
  handler: string
  duration_ms: number
}

export interface ErrorRecord {
  type: 'warning' | 'error'
  message: string
  state?: string
}

export interface LogInteractionParams {
  sessionId: string
  clienteId?: string
  direction: 'user' | 'assistant'
  messageContent: string
  stateBefore?: string
  stateAfter?: string
  llmCalls: LLMCallRecord[]
  handlersExecuted: HandlerRecord[]
  extractedData: Record<string, any>
  contextSnapshot: Record<string, any>
  errors: ErrorRecord[]
  responseTimeMs: number
}

export interface LogQueryBuilder {
  filterBySession(sessionId: string): this
  filterByCliente(clienteId: string): this
  filterByDate(from: Date, to: Date): this
  filterByState(state: string): this
  filterWithErrors(): this
  paginate(page: number, pageSize: number): this
  getSessions(): Promise<SessionSummary[]>
  getDetails(sessionId: string): Promise<LogEntry[]>
}

export interface SessionSummary {
  session_id: string
  cliente_id?: string
  cliente_nome?: string
  message_count: number
  first_message_at: string
  last_message_at: string
  final_state: string
  has_errors: boolean
}

export interface LogEntry {
  id: string
  session_id: string
  cliente_id?: string
  direction: 'user' | 'assistant'
  message_content: string
  state_before?: string
  state_after?: string
  llm_calls: LLMCallRecord[]
  handlers_executed: HandlerRecord[]
  extracted_data: Record<string, any>
  context_snapshot: Record<string, any>
  errors: ErrorRecord[]
  response_time_ms: number
  created_at: string
}

export class ChatLogger {
  constructor()

  /**
   * Log a chat interaction. Fire-and-forget - errors are logged but don't throw.
   * Uses Supabase admin client for reliable writes.
   */
  logInteraction(params: LogInteractionParams): Promise<void>

  /**
   * Query builder for fetching logs (admin UI)
   */
  query(): LogQueryBuilder
}
```

## Admin UI

**Route:** `/admin/chat-logs`

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  📋 Logs de Conversas                         [Exportar CSV] │
├─────────────────────────────────────────────────────────────┤
│  Filtros:                                                    │
│  [Data: últimos 7 dias ▼] [Session ID ▼] [Cliente ▼]        │
│  [Estado ▼] [Com erros □]                                   │
├─────────────────────────────────────────────────────────────┤
│  Sessions (20)                    │ Detalhes da sessão       │
│  ┌────────────────────────────────┐ ┌──────────────────────┐│
│  │ 🔵 abc123...  Hoje 14:32       │ │ Session: abc123...   ││
│  │    3 msgs • Booking concluído  │ │ Cliente: João Silva  ││
│  │                                │ │ Estado: DONE         ││
│  │ 🟡 def456...  Hoje 13:15       │ │ ─────────────────────││
│  │    7 msgs • Em andamento       │ │ [USER] Olá, quero... ││
│  │    ⚠️ 2 erros                  │ │ [BOT]  Olá! Como...  ││
│  │                                │ │ [USER] Meu telefone..││
│  │ 🔵 ghi789...  Ontem 16:45      │ │ [BOT]  Perfeito...   ││
│  │    5 msgs • Cancelamento       │ │                      ││
│  └────────────────────────────────┘ │ 📊 LLM Calls: 3      ││
│                                     │    - extract: 850ms  ││
│  [Carregar mais...]                 │    - generate: 1.2s  ││
│                                     │ ⚠️ Warnings: 1       ││
│                                     │ 📋 Contexto          ││
│                                     │ [Expandir JSON]      ││
│                                     └──────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Features

| Feature | Description |
|---------|-------------|
| Session list | Agrupadas por session_id, mostra preview |
| Filters | Por data, cliente, estado, erros |
| Expanded details | Mensagens, LLM calls, contexto |
| Visual indicators | 🟢 Sucesso / 🟡 Em andamento / 🔴 Com erros |
| Export | CSV/JSON da conversa selecionada |
| Response time | Destaque para lentidão (>3s) |

### Files

```
app/(admin)/admin/chat-logs/
├── page.tsx              # Lista + filtros
├── [sessionId]/page.tsx  # Detalhes da sessão
└── components/
    ├── SessionList.tsx
    ├── SessionDetail.tsx
    ├── LlmCallsPanel.tsx
    └── ContextViewer.tsx

app/api/admin/chat-logs/
├── route.ts              # GET lista de sessões
└── [sessionId]/route.ts  # GET detalhes
```

### API Endpoints

**GET /api/admin/chat-logs** - Lista sessões

Query params:
- `from` (ISO date) - Data inicial
- `to` (ISO date) - Data final
- `cliente_id` (UUID) - Filtrar por cliente
- `state` (string) - Filtrar por estado final
- `has_errors` (boolean) - Apenas com erros
- `page` (number, default: 1)
- `page_size` (number, default: 20, max: 100)

Response:
```json
{
  "sessions": [
    {
      "session_id": "abc123",
      "cliente_id": "uuid",
      "cliente_nome": "João Silva",
      "message_count": 5,
      "first_message_at": "2026-04-06T14:32:00Z",
      "last_message_at": "2026-04-06T14:35:00Z",
      "final_state": "DONE",
      "has_errors": false,
      "total_response_time_ms": 3500
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_count": 156,
    "total_pages": 8
  }
}
```

**GET /api/admin/chat-logs/[sessionId]** - Detalhes da sessão

Response:
```json
{
  "session": {
    "session_id": "abc123",
    "cliente_id": "uuid",
    "cliente_nome": "João Silva",
    "final_state": "DONE"
  },
  "messages": [
    {
      "id": "uuid",
      "direction": "user",
      "message_content": "Olá, quero agendar...",
      "state_before": null,
      "state_after": "GREETING",
      "llm_calls": [],
      "handlers_executed": [{"handler": "greetingHandler", "duration_ms": 12}],
      "extracted_data": {},
      "errors": [],
      "response_time_ms": 15,
      "created_at": "2026-04-06T14:32:00Z"
    }
  ]
}
```

**GET /api/admin/chat-logs/[sessionId]/export** - Exportar conversa

Query params:
- `format` (string): "csv" | "json" (default: "json")

Response: Download do arquivo

## Retention Policy

**30 dias** - Cleanup via cron job diário.

```typescript
// app/api/cron/cleanup-logs/route.ts
import { createAdminClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'

export async function GET(req: Request) {
  // Autenticação via header Authorization (Easypanel cron)
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('chat_logs')
    .delete()
    .lt('created_at', `now() - interval '30 days'`)
    .select('id')

  if (error) {
    console.error('Cleanup error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({
    deleted: data?.length || 0,
    timestamp: new Date().toISOString()
  })
}
```

**Cron schedule:** `0 3 * * *` (03:00 daily)

**Easypanel config:**
```
curl -H "Authorization: Bearer $CRON_SECRET" https://chesquecleaning.com/api/cron/cleanup-logs
```

**Env var required:** `CRON_SECRET` (random string, set in Easypanel)

## Dependencies

- Nenhuma dependência nova
- Usa Supabase existente
- Usa estrutura admin existente

## Migration Plan

1. Criar tabela `chat_logs` no Supabase
2. Implementar `ChatLogger` service
3. Modificar `engine.ts` para capturar logs
4. Modificar `llm.ts` para retornar métricas
5. Criar API routes
6. Criar Admin UI
7. Configurar cron job de cleanup
8. Testar e2e

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Performance overhead | Logs são assíncronos (fire-and-forget) |
| Tabela cresce muito | Índices + cleanup de 30 dias |
| Dados sensíveis | RLS habilitado, admin apenas |

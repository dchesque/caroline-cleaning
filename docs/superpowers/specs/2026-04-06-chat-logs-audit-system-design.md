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
- Export para serviços externos
- Real-time monitoring

## Architecture

### Database Schema

```sql
CREATE TABLE chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  cliente_id UUID REFERENCES clientes(id),

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

-- RLS habilitado (admin apenas)
ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;
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

## Retention Policy

**30 dias** - Cleanup via cron job diário.

```typescript
// app/api/cron/cleanup-logs/route.ts
export async function GET(req: Request) {
  const { count } = await supabase
    .from('chat_logs')
    .delete()
    .lt('created_at', `now() - interval '30 days'`)

  return Response.json({ deleted: count })
}
```

**Cron schedule:** `0 3 * * *` (03:00 daily)

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

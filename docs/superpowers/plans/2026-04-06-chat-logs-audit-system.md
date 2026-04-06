# Chat Logs Audit System - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a debug/audit logging system for Carol AI conversations with admin UI visualization.

**Architecture:** Single `chat_logs` table with JSONB columns captures LLM calls, handlers, state transitions, and extracted data. ChatLogger service writes logs async (fire-and-forget). Admin UI queries via API routes with pagination and filters. Cron job cleans up logs > 30 days.

**Tech Stack:** Next.js 15, Supabase (PostgreSQL + RLS), TypeScript, Tailwind, shadcn/ui

---

## File Structure

```
# New files
supabase/migrations/
└── XX_chat_logs.sql                    # Table + indexes + RLS

lib/services/
└── chat-logger.ts                      # ChatLogger service

app/api/admin/chat-logs/
├── route.ts                            # GET sessions list
├── [sessionId]/route.ts                # GET session details
└── [sessionId]/export/route.ts         # GET export (CSV/JSON)

app/api/cron/
└── cleanup-logs/route.ts               # DELETE logs > 30 days

app/(admin)/admin/chat-logs/
├── page.tsx                            # Sessions list + filters
├── [sessionId]/page.tsx                # Session details
└── components/
    ├── SessionList.tsx                 # Session list item
    ├── SessionDetail.tsx               # Message timeline
    ├── LlmCallsPanel.tsx               # LLM calls display
    └── ContextViewer.tsx               # JSON context viewer

# Modified files
lib/ai/state-machine/engine.ts          # Add logging callbacks
lib/ai/llm.ts                           # Return metrics (tokens, duration)
app/api/chat/route.ts                   # Integrate ChatLogger
```

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/18_chat_logs.sql`

- [ ] **Step 1: Create migration file**

```sql
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
```

- [ ] **Step 2: Run migration**

Apply migration in Supabase dashboard → SQL Editor, or via CLI:
```bash
supabase db push
```

- [ ] **Step 3: Verify table**

In Supabase dashboard → Table Editor, confirm `chat_logs` table exists with correct columns.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/15_chat_logs.sql
git commit -m "feat(db): add chat_logs table for audit system"
```

---

## Task 2: ChatLogger Service

**Files:**
- Create: `lib/services/chat-logger.ts`

- [ ] **Step 1: Write ChatLogger service**

```typescript
// lib/services/chat-logger.ts
import { createAdminClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// ═══ TYPES ═══

export interface LLMCallRecord {
  type: 'extract' | 'classify' | 'generate' | 'faq'
  model: string
  prompt_preview: string
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

export interface SessionSummary {
  session_id: string
  cliente_id?: string
  cliente_nome?: string
  message_count: number
  first_message_at: string
  last_message_at: string
  final_state: string
  has_errors: boolean
  total_response_time_ms: number
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

export interface LogQueryParams {
  from?: string
  to?: string
  cliente_id?: string
  state?: string
  has_errors?: boolean
  page?: number
  page_size?: number
}

// ═══ SERVICE ═══

class ChatLoggerService {
  private getClient() {
    return createAdminClient()
  }

  /**
   * Log a chat interaction. Fire-and-forget - errors are logged but don't throw.
   */
  async logInteraction(params: LogInteractionParams): Promise<void> {
    try {
      const supabase = this.getClient()

      const { error } = await supabase
        .from('chat_logs')
        .insert({
          session_id: params.sessionId,
          cliente_id: params.clienteId || null,
          direction: params.direction,
          message_content: params.messageContent,
          state_before: params.stateBefore || null,
          state_after: params.stateAfter || null,
          llm_calls: params.llmCalls,
          handlers_executed: params.handlersExecuted,
          extracted_data: params.extractedData,
          context_snapshot: params.contextSnapshot,
          errors: params.errors,
          response_time_ms: params.responseTimeMs,
        })

      if (error) {
        logger.error('ChatLogger.logInteraction error', { error, sessionId: params.sessionId })
      }
    } catch (err) {
      logger.error('ChatLogger.logInteraction exception', { err, sessionId: params.sessionId })
    }
  }

  /**
   * Get sessions list with aggregation
   */
  async getSessions(params: LogQueryParams): Promise<{
    sessions: SessionSummary[]
    pagination: { page: number; page_size: number; total_count: number; total_pages: number }
  }> {
    const supabase = this.getClient()
    const page = params.page || 1
    const pageSize = Math.min(params.page_size || 20, 100)
    const offset = (page - 1) * pageSize

    // Build query for session aggregation
    let query = supabase
      .from('chat_logs')
      .select('session_id, cliente_id, state_after, errors, response_time_ms, created_at', { count: 'exact' })

    if (params.from) {
      query = query.gte('created_at', params.from)
    }
    if (params.to) {
      query = query.lte('created_at', params.to)
    }
    if (params.cliente_id) {
      query = query.eq('cliente_id', params.cliente_id)
    }
    if (params.has_errors) {
      query = query.not('errors', 'eq', '[]')
    }

    // Get all matching logs (we'll aggregate in code for simplicity)
    const { data: logs, count, error } = await query
      .order('created_at', { ascending: false })
      .limit(1000) // Reasonable limit for aggregation

    if (error) {
      logger.error('ChatLogger.getSessions error', { error })
      return { sessions: [], pagination: { page, page_size: pageSize, total_count: 0, total_pages: 0 } }
    }

    // Aggregate by session
    const sessionMap = new Map<string, {
      cliente_id?: string
      message_count: number
      first_message_at: string
      last_message_at: string
      final_state: string
      has_errors: boolean
      total_response_time_ms: number
    }>()

    for (const log of logs || []) {
      const existing = sessionMap.get(log.session_id)
      if (existing) {
        existing.message_count++
        existing.last_message_at = log.created_at
        existing.final_state = log.state_after || existing.final_state
        existing.has_errors = existing.has_errors || (log.errors && log.errors.length > 0)
        existing.total_response_time_ms += log.response_time_ms || 0
      } else {
        sessionMap.set(log.session_id, {
          cliente_id: log.cliente_id,
          message_count: 1,
          first_message_at: log.created_at,
          last_message_at: log.created_at,
          final_state: log.state_after || '',
          has_errors: log.errors && log.errors.length > 0,
          total_response_time_ms: log.response_time_ms || 0,
        })
      }
    }

    // Filter by state if specified
    let sessions = Array.from(sessionMap.entries()).map(([session_id, data]) => ({
      session_id,
      ...data,
    }))

    if (params.state) {
      sessions = sessions.filter(s => s.final_state === params.state)
    }

    // Paginate
    const total_count = sessions.length
    const total_pages = Math.ceil(total_count / pageSize)
    const paginatedSessions = sessions.slice(offset, offset + pageSize)

    // Get cliente names
    const clienteIds = [...new Set(paginatedSessions.map(s => s.cliente_id).filter(Boolean))]
    const { data: clientes } = await supabase
      .from('clientes')
      .select('id, nome')
      .in('id', clienteIds)

    const clienteMap = new Map(clientes?.map(c => [c.id, c.nome]) || [])

    const sessionsWithNames = paginatedSessions.map(s => ({
      ...s,
      cliente_nome: s.cliente_id ? clienteMap.get(s.cliente_id) : undefined,
    }))

    return {
      sessions: sessionsWithNames,
      pagination: { page, page_size: pageSize, total_count, total_pages },
    }
  }

  /**
   * Get all log entries for a session
   */
  async getSessionDetails(sessionId: string): Promise<{
    session: { session_id: string; cliente_id?: string; cliente_nome?: string; final_state: string }
    messages: LogEntry[]
  }> {
    const supabase = this.getClient()

    const { data: logs, error } = await supabase
      .from('chat_logs')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error || !logs || logs.length === 0) {
      return {
        session: { session_id: sessionId, final_state: '' },
        messages: [],
      }
    }

    // Get cliente name
    const clienteId = logs[0]?.cliente_id
    let clienteNome: string | undefined
    if (clienteId) {
      const { data: cliente } = await supabase
        .from('clientes')
        .select('nome')
        .eq('id', clienteId)
        .single()
      clienteNome = cliente?.nome
    }

    const finalState = logs[logs.length - 1]?.state_after || ''

    return {
      session: {
        session_id: sessionId,
        cliente_id: clienteId,
        cliente_nome: clienteNome,
        final_state,
      },
      messages: logs as LogEntry[],
    }
  }

  /**
   * Export session as JSON or CSV
   */
  async exportSession(sessionId: string, format: 'json' | 'csv'): Promise<string> {
    const { session, messages } = await this.getSessionDetails(sessionId)

    if (format === 'json') {
      return JSON.stringify({ session, messages }, null, 2)
    }

    // CSV format
    const headers = ['timestamp', 'direction', 'message', 'state_before', 'state_after', 'response_time_ms']
    const rows = messages.map(m => [
      m.created_at,
      m.direction,
      `"${m.message_content.replace(/"/g, '""')}"`,
      m.state_before || '',
      m.state_after || '',
      m.response_time_ms || 0,
    ])

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  }
}

// Singleton export
export const chatLogger = new ChatLoggerService()
```

- [ ] **Step 2: Commit**

```bash
git add lib/services/chat-logger.ts
git commit -m "feat(services): add ChatLogger service for audit logging"
```

---

## Task 3: LLM Metrics Return

**Files:**
- Modify: `lib/ai/llm.ts`

- [ ] **Step 1: Add LLMCallRecord type export**

Add at the top of `lib/ai/llm.ts` after the imports (around line 6):

```typescript
// ═══ LLM METRICS TYPE (for logging) ═══

export interface LLMCallRecord {
  type: 'extract' | 'classify' | 'generate' | 'faq'
  model: string
  prompt_preview: string
  tokens_used?: number
  duration_ms: number
}
```

- [ ] **Step 2: Add new method `extractWithMetrics`**

Add after the existing `extract` method (around line 403):

```typescript
// ═══ EXTRACTION WITH METRICS (for logging) ═══

async extractWithMetrics(
  type: ExtractionType,
  message: string,
  extraContext?: any
): Promise<{ data: any; metrics: LLMCallRecord }> {
  const systemPrompt = getExtractionPrompt(type, extraContext)
  const startTime = Date.now()

  try {
    const response = await openrouter.chat.completions.create({
      model: this.model,
      temperature: 0.1,
      max_tokens: 200,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
    })

    const content = response.choices[0]?.message?.content || '{}'
    const duration = Date.now() - startTime

    let data: any
    try {
      data = JSON.parse(content)
    } catch {
      data = { _error: true }
    }

    return {
      data,
      metrics: {
        type: 'extract',
        model: this.model,
        prompt_preview: systemPrompt.substring(0, 100),
        tokens_used: response.usage?.total_tokens,
        duration_ms: duration,
      }
    }
  } catch (error) {
    return {
      data: {},
      metrics: {
        type: 'extract',
        model: this.model,
        prompt_preview: systemPrompt.substring(0, 100),
        duration_ms: Date.now() - startTime,
      }
    }
  }
}

async generateWithMetrics(
  template: string,
  data: Record<string, any>,
  language: 'pt' | 'en'
): Promise<{ response: string; metrics: LLMCallRecord }> {
  const templateFn = RESPONSE_TEMPLATES[template]
  const instruction = templateFn ? templateFn(data, language) : ''
  const persona = carolPersona(language)
  const startTime = Date.now()

  try {
    const response = await openrouter.chat.completions.create({
      model: this.model,
      temperature: 0.6,
      max_tokens: 300,
      messages: [
        { role: 'system', content: `${persona}\n\nInstruction: ${instruction}` },
        { role: 'user', content: 'Generate the message following the instruction above.' },
      ],
    })

    return {
      response: (response.choices[0]?.message?.content || '').trim(),
      metrics: {
        type: 'generate',
        model: this.model,
        prompt_preview: instruction.substring(0, 100),
        tokens_used: response.usage?.total_tokens,
        duration_ms: Date.now() - startTime,
      }
    }
  } catch {
    return {
      response: language === 'pt'
        ? 'Desculpe, tive um problema técnico. Pode tentar novamente?'
        : "I'm sorry, I had a technical issue. Could you try again?",
      metrics: {
        type: 'generate',
        model: this.model,
        prompt_preview: instruction.substring(0, 100),
        duration_ms: Date.now() - startTime,
      }
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/ai/llm.ts
git commit -m "feat(llm): add extractWithMetrics and generateWithMetrics methods"
```

---

## Task 4: CarolAgent Response Extension

**Files:**
- Modify: `lib/ai/carol-agent.ts`

- [ ] **Step 1: Extend ChatResponse interface**

Replace the `ChatResponse` interface (around line 13-18):

```typescript
export interface ChatResponse {
    message: string
    session_id: string
    state: string
    timestamp: string
    cliente_id?: string
    state_before?: string
    metrics?: {
        llmCalls: LLMCallRecord[]
        handlersExecuted: { handler: string; duration_ms: number }[]
        extractedData: Record<string, any>
        contextSnapshot: Record<string, any>
        errors: { type: 'warning' | 'error'; message: string; state?: string }[]
    }
}
```

Add import at top:

```typescript
import { LLMCallRecord } from './llm'
```

- [ ] **Step 2: Commit**

```bash
git add lib/ai/carol-agent.ts
git commit -m "feat(carol-agent): extend ChatResponse with metrics"
```

---

## Task 5: Engine Metrics Collection

**Files:**
- Modify: `lib/ai/state-machine/engine.ts`

- [ ] **Step 1: Add metrics tracking to process method**

Add import at top of engine.ts:

```typescript
import { LLMCallRecord } from '../llm'
```

Add interface after the imports:

```typescript
interface ProcessingMetrics {
  llmCalls: LLMCallRecord[]
  handlersExecuted: { handler: string; duration_ms: number }[]
  extractedData: Record<string, any>
  contextSnapshot: Record<string, any>
  errors: { type: 'warning' | 'error'; message: string; state?: string }[]
}
```

- [ ] **Step 2: Modify process method signature and implementation**

Replace the `process` method (around line 45-186). Key changes:

```typescript
async process(
  message: string,
  sessionId: string,
): Promise<{
  response: string
  state: CarolState
  metrics: ProcessingMetrics
  cliente_id?: string
}> {
  // Initialize metrics
  const metrics: ProcessingMetrics = {
    llmCalls: [],
    handlersExecuted: [],
    extractedData: {},
    contextSnapshot: {},
    errors: [],
  }

  // 1. Load context
  let context = await this.services.getSession(sessionId)
  const stateBefore = context.state as CarolState

  if (!context.state) {
    context = this.initializeContext()
  }

  let currentState = context.state as CarolState

  // 2. Execute handler with timing
  const handler = this.handlers.get(currentState)
  if (!handler) {
    logger.error('No handler registered for state', { state: currentState, sessionId })
    return {
      response: "I'm sorry, something went wrong on my end. Could you try again?",
      state: currentState,
      metrics,
    }
  }

  const handlerStartTime = Date.now()
  let result: HandlerResult
  try {
    result = await handler(message, context, this.services, this.llm)
    metrics.handlersExecuted.push({
      handler: `${currentState}Handler`,
      duration_ms: Date.now() - handlerStartTime,
    })
  } catch (err) {
    metrics.errors.push({
      type: 'error',
      message: err instanceof Error ? err.message : String(err),
      state: currentState,
    })
    return {
      response: "I'm sorry, I ran into an unexpected issue. Could you say that again?",
      state: currentState,
      metrics,
    }
  }

  // Track extracted data from context updates
  if (result.contextUpdates) {
    metrics.extractedData = { ...metrics.extractedData, ...result.contextUpdates }
  }

  // 3. Apply transition
  context = this.applyTransition(context, result)

  // Collect responses
  const responses: string[] = []
  if (result.response) {
    responses.push(result.response)
  }

  // 4. Silent transitions
  let autoTransitions = 0
  while (result.silent && autoTransitions < MAX_AUTO_TRANSITIONS) {
    autoTransitions++
    const nextState = result.nextState
    const nextHandler = this.handlers.get(nextState)

    if (!nextHandler) break

    const silentStart = Date.now()
    try {
      result = await nextHandler('', context, this.services, this.llm)
      metrics.handlersExecuted.push({
        handler: `${nextState}Handler`,
        duration_ms: Date.now() - silentStart,
      })
    } catch (err) {
      metrics.errors.push({
        type: 'error',
        message: err instanceof Error ? err.message : String(err),
        state: nextState,
      })
      break
    }

    context = this.applyTransition(context, result)
    if (result.response) {
      responses.push(result.response)
    }
  }

  const finalResponse = responses.join('\n\n')
  const finalState = context.state as CarolState

  // 5. Persist context
  try {
    await this.services.updateSession(sessionId, context)
  } catch (err) {
    metrics.errors.push({
      type: 'warning',
      message: 'Failed to persist session context',
    })
  }

  // 6. Save messages
  try {
    await Promise.all([
      this.services.saveMessage(sessionId, 'user', message, {
        state: currentState,
        previousState: context.previousState,
      }),
      this.services.saveMessage(sessionId, 'assistant', finalResponse, {
        state: finalState,
        previousState: currentState,
      }),
    ])
  } catch {
    metrics.errors.push({ type: 'warning', message: 'Failed to persist messages' })
  }

  // Final context snapshot (selective fields for logging)
  metrics.contextSnapshot = {
    cliente_id: context.cliente_id,
    cliente_nome: context.cliente_nome,
    cliente_telefone: context.cliente_telefone,
    service_type: context.service_type,
    selected_date: context.selected_date,
    selected_time: context.selected_time,
    state: context.state,
    language: context.language,
  }

  return {
    response: finalResponse,
    state: finalState,
    metrics,
    cliente_id: context.cliente_id || undefined,
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/ai/state-machine/engine.ts
git commit -m "feat(engine): add metrics collection to process method"
```

---

## Task 4: Engine Logging Hooks

**Files:**
- Modify: `lib/ai/state-machine/engine.ts`

- [ ] **Step 1: Add logging context to process method**

Add import at top:

```typescript
import { LLMCallMetrics } from '../llm'
```

Add after the class definition, before `process`:

```typescript
// Collected metrics during processing
interface ProcessingMetrics {
  llmCalls: LLMCallMetrics[]
  handlersExecuted: { handler: string; duration_ms: number }[]
  extractedData: Record<string, any>
  errors: { type: 'warning' | 'error'; message: string; state?: string }[]
}
```

- [ ] **Step 2: Modify process method to collect metrics**

Replace the `process` method to collect and return metrics. Key changes:
- Initialize `ProcessingMetrics` at start
- Track handler execution time
- Track state transitions
- Return metrics alongside response

The full modified method should collect:
- `llmCalls`: From LLM calls that return metrics
- `handlersExecuted`: Handler name + duration
- `extractedData`: Context updates
- `errors`: Any errors encountered

- [ ] **Step 3: Commit**

```bash
git add lib/ai/state-machine/engine.ts
git commit -m "feat(engine): add metrics collection for logging"
```

---

## Task 6: CarolAgent Integration

**Files:**
- Modify: `lib/ai/carol-agent.ts`

- [ ] **Step 1: Update chat method to pass through metrics**

Replace the `chat` method (around line 30-41):

```typescript
async chat(message: string, sessionId: string): Promise<ChatResponse> {
    logger.info('CarolAgent.chat', { sessionId, messageLength: message.length })

    const result = await this.machine.process(message, sessionId)

    return {
        message: result.response,
        session_id: sessionId,
        state: result.state,
        state_before: result.state_before,
        cliente_id: result.cliente_id,
        timestamp: new Date().toISOString(),
        metrics: result.metrics,
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/ai/carol-agent.ts
git commit -m "feat(carol-agent): pass through metrics from engine"
```

---

## Task 7: API Route Integration

**Files:**
- Modify: `app/api/chat/route.ts`

- [ ] **Step 1: Import ChatLogger**

Add import:

```typescript
import { chatLogger } from '@/lib/services/chat-logger'
```

- [ ] **Step 2: Log user message**

After receiving message, before processing:

```typescript
// Log user message
await chatLogger.logInteraction({
  sessionId: currentSessionId,
  direction: 'user',
  messageContent: message,
  responseTimeMs: 0,
  llmCalls: [],
  handlersExecuted: [],
  extractedData: {},
  contextSnapshot: {},
  errors: [],
})
```

- [ ] **Step 3: Log assistant response**

After getting response from Carol:

```typescript
// Log assistant response with metrics
await chatLogger.logInteraction({
  sessionId: currentSessionId,
  clienteId: response.cliente_id,
  direction: 'assistant',
  messageContent: response.message,
  stateBefore: response.state_before,
  stateAfter: response.state,
  llmCalls: response.metrics?.llmCalls || [],
  handlersExecuted: response.metrics?.handlersExecuted || [],
  extractedData: response.metrics?.extractedData || {},
  contextSnapshot: response.metrics?.contextSnapshot || {},
  errors: response.metrics?.errors || [],
  responseTimeMs: duration,
})
```

- [ ] **Step 4: Commit**

```bash
git add app/api/chat/route.ts
git commit -m "feat(chat-api): integrate ChatLogger for audit logging"
```

---

## Task 8: Admin API Routes

**Files:**
- Create: `app/api/admin/chat-logs/route.ts`
- Create: `app/api/admin/chat-logs/[sessionId]/route.ts`
- Create: `app/api/admin/chat-logs/[sessionId]/export/route.ts`

- [ ] **Step 1: Create sessions list endpoint**

```typescript
// app/api/admin/chat-logs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { chatLogger } from '@/lib/services/chat-logger'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const params = {
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
      cliente_id: searchParams.get('cliente_id') || undefined,
      state: searchParams.get('state') || undefined,
      has_errors: searchParams.get('has_errors') === 'true',
      page: parseInt(searchParams.get('page') || '1'),
      page_size: parseInt(searchParams.get('page_size') || '20'),
    }

    const result = await chatLogger.getSessions(params)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching chat logs:', error)
    return NextResponse.json({ error: 'Failed to fetch chat logs' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create session details endpoint**

```typescript
// app/api/admin/chat-logs/[sessionId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { chatLogger } from '@/lib/services/chat-logger'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const result = await chatLogger.getSessionDetails(sessionId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching session details:', error)
    return NextResponse.json({ error: 'Failed to fetch session details' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Create export endpoint**

```typescript
// app/api/admin/chat-logs/[sessionId]/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { chatLogger } from '@/lib/services/chat-logger'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const { searchParams } = new URL(req.url)
    const format = (searchParams.get('format') || 'json') as 'json' | 'csv'

    const content = await chatLogger.exportSession(sessionId, format)
    const filename = `chat-${sessionId}.${format}`

    return new NextResponse(content, {
      headers: {
        'Content-Type': format === 'json' ? 'application/json' : 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting session:', error)
    return NextResponse.json({ error: 'Failed to export session' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/chat-logs/
git commit -m "feat(api): add admin chat-logs endpoints"
```

---

## Task 9: Cron Cleanup Endpoint

**Files:**
- Create: `app/api/cron/cleanup-logs/route.ts`

- [ ] **Step 1: Create cleanup endpoint**

```typescript
// app/api/cron/cleanup-logs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  // Auth check
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Delete logs older than 30 days
  const { data, error } = await supabase
    .from('chat_logs')
    .delete()
    .lt('created_at', `now() - interval '30 days'`)
    .select('id')

  if (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    deleted: data?.length || 0,
    timestamp: new Date().toISOString(),
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/cron/cleanup-logs/route.ts
git commit -m "feat(cron): add chat logs cleanup endpoint (30 day retention)"
```

---

## Task 10: Admin UI - Sessions List Page

**Files:**
- Create: `app/(admin)/admin/chat-logs/page.tsx`
- Create: `app/(admin)/admin/chat-logs/components/SessionList.tsx`

- [ ] **Step 1: Create SessionList component**

```typescript
// app/(admin)/admin/chat-logs/components/SessionList.tsx
'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR, enUS } from 'date-fns/locale'
import { CheckCircle, Clock, AlertTriangle, MessageSquare } from 'lucide-react'
import { SessionSummary } from '@/lib/services/chat-logger'

interface Props {
  sessions: SessionSummary[]
  selectedId?: string
  onSelect: (id: string) => void
  locale: string
}

export function SessionList({ sessions, selectedId, onSelect, locale }: Props) {
  const dateLocale = locale === 'pt-BR' ? ptBR : enUS

  const getStatusIcon = (session: SessionSummary) => {
    if (session.has_errors) return <AlertTriangle className="w-4 h-4 text-red-500" />
    if (session.final_state === 'DONE') return <CheckCircle className="w-4 h-4 text-green-500" />
    return <Clock className="w-4 h-4 text-yellow-500" />
  }

  const getStatusColor = (session: SessionSummary) => {
    if (session.has_errors) return 'border-l-red-500'
    if (session.final_state === 'DONE') return 'border-l-green-500'
    return 'border-l-yellow-500'
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => (
        <button
          key={session.session_id}
          onClick={() => onSelect(session.session_id)}
          className={`w-full text-left p-3 rounded-lg border border-l-4 ${getStatusColor(session)} ${
            selectedId === session.session_id ? 'bg-muted' : 'hover:bg-muted/50'
          } transition-colors`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(session)}
              <span className="font-mono text-sm truncate max-w-[120px]">
                {session.session_id}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(session.last_message_at), { addSuffix: true, locale: dateLocale })}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {session.message_count}
            </span>
            <span>{session.final_state || 'started'}</span>
            {session.cliente_nome && (
              <span className="truncate">{session.cliente_nome}</span>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create main page**

```typescript
// app/(admin)/admin/chat-logs/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Download, RefreshCw } from 'lucide-react'
import { useAdminI18n } from '@/lib/admin-i18n/context'
import { SessionList } from './components/SessionList'
import { SessionSummary } from '@/lib/services/chat-logger'

export default function ChatLogsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { locale } = useAdminI18n()

  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pagination, setPagination] = useState({ page: 1, total_pages: 0, total_count: 0 })

  // Filters
  const [hasErrors, setHasErrors] = useState(false)
  const [dateRange, setDateRange] = useState('7')

  const fetchSessions = async (page = 1) => {
    setIsLoading(true)
    const from = new Date()
    from.setDate(from.getDate() - parseInt(dateRange))

    const params = new URLSearchParams({
      page: String(page),
      page_size: '20',
      from: from.toISOString(),
      has_errors: String(hasErrors),
    })

    const res = await fetch(`/api/admin/chat-logs?${params}`)
    const data = await res.json()

    setSessions(data.sessions || [])
    setPagination({
      page: data.pagination?.page || 1,
      total_pages: data.pagination?.total_pages || 0,
      total_count: data.pagination?.total_count || 0,
    })
    setIsLoading(false)
  }

  useEffect(() => {
    fetchSessions(1)
  }, [hasErrors, dateRange])

  const handleSelect = (id: string) => {
    setSelectedId(id)
    router.push(`/admin/chat-logs/${id}`)
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-h2 text-foreground">Logs de Conversas</h1>
          <p className="text-muted-foreground">
            Auditoria e debug das conversas da Carol AI
          </p>
        </div>
        <Button variant="outline" onClick={() => fetchSessions(pagination.page)}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="has-errors"
                checked={hasErrors}
                onCheckedChange={(checked) => setHasErrors(checked === true)}
              />
              <label htmlFor="has-errors" className="text-sm">
                Apenas com erros
              </label>
            </div>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Hoje</SelectItem>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground ml-auto">
              {pagination.total_count} sessões
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma conversa encontrada
            </div>
          ) : (
            <>
              <SessionList
                sessions={sessions}
                selectedId={selectedId || undefined}
                onSelect={handleSelect}
                locale={locale}
              />

              {pagination.total_pages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    disabled={pagination.page === 1}
                    onClick={() => fetchSessions(pagination.page - 1)}
                  >
                    Anterior
                  </Button>
                  <span className="py-2 px-4 text-sm">
                    {pagination.page} / {pagination.total_pages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={pagination.page >= pagination.total_pages}
                    onClick={() => fetchSessions(pagination.page + 1)}
                  >
                    Próximo
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(admin)/admin/chat-logs/page.tsx" "app/(admin)/admin/chat-logs/components/SessionList.tsx"
git commit -m "feat(admin): add chat-logs sessions list page"
```

---

## Task 11: Admin UI - Session Details Page

**Files:**
- Create: `app/(admin)/admin/chat-logs/[sessionId]/page.tsx`
- Create: `app/(admin)/admin/chat-logs/components/SessionDetail.tsx`
- Create: `app/(admin)/admin/chat-logs/components/LlmCallsPanel.tsx`
- Create: `app/(admin)/admin/chat-logs/components/ContextViewer.tsx`

- [ ] **Step 1: Create ContextViewer component**

```typescript
// app/(admin)/admin/chat-logs/components/ContextViewer.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface Props {
  data: Record<string, any>
  title?: string
}

export function ContextViewer({ data, title = 'Contexto' }: Props) {
  const [expanded, setExpanded] = useState(false)

  if (!data || Object.keys(data).length === 0) {
    return null
  }

  return (
    <div className="border rounded-lg">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 p-3 hover:bg-muted/50"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
        <span className="font-medium">{title}</span>
      </button>
      {expanded && (
        <pre className="p-3 pt-0 text-xs overflow-auto max-h-64 bg-muted/30">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create LlmCallsPanel component**

```typescript
// app/(admin)/admin/chat-logs/components/LlmCallsPanel.tsx
'use client'

import { Cpu, Clock, Zap } from 'lucide-react'
import { LLMCallRecord } from '@/lib/services/chat-logger'

interface Props {
  calls: LLMCallRecord[]
}

export function LlmCallsPanel({ calls }: Props) {
  if (!calls || calls.length === 0) {
    return null
  }

  const totalDuration = calls.reduce((sum, c) => sum + c.duration_ms, 0)
  const totalTokens = calls.reduce((sum, c) => sum + (c.tokens_used || 0), 0)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Cpu className="w-4 h-4" />
        LLM Calls ({calls.length})
        <span className="text-muted-foreground">
          {totalDuration}ms total
          {totalTokens > 0 && ` • ${totalTokens} tokens`}
        </span>
      </div>
      <div className="space-y-1">
        {calls.map((call, i) => (
          <div key={i} className="text-xs p-2 bg-muted/30 rounded flex items-center gap-3">
            <span className="font-mono bg-muted px-1 rounded">{call.type}</span>
            <span className="text-muted-foreground truncate flex-1">
              {call.prompt_preview}...
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {call.duration_ms}ms
            </span>
            {call.tokens_used && (
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {call.tokens_used}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create SessionDetail component**

```typescript
// app/(admin)/admin/chat-logs/components/SessionDetail.tsx
'use client'

import { User, Bot, AlertTriangle, Clock, ChevronLeft, Download } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LogEntry } from '@/lib/services/chat-logger'
import { LlmCallsPanel } from './LlmCallsPanel'
import { ContextViewer } from './ContextViewer'

interface Props {
  sessionId: string
  session: {
    cliente_id?: string
    cliente_nome?: string
    final_state: string
  }
  messages: LogEntry[]
}

export function SessionDetail({ sessionId, session, messages }: Props) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/chat-logs">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
          </Link>
          <div>
            <h2 className="font-mono text-lg">{sessionId}</h2>
            <div className="text-sm text-muted-foreground">
              {session.cliente_nome && <span>{session.cliente_nome} • </span>}
              Estado: <span className="font-mono">{session.final_state || 'started'}</span>
            </div>
          </div>
        </div>
        <Link href={`/api/admin/chat-logs/${sessionId}/export?format=json`}>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </Link>
      </div>

      {/* Messages */}
      <div className="space-y-4">
        {messages.map((msg) => (
          <Card key={msg.id} className={msg.direction === 'user' ? 'bg-blue-50/50' : ''}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${msg.direction === 'user' ? 'bg-blue-100' : 'bg-green-100'}`}>
                  {msg.direction === 'user' ? (
                    <User className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Bot className="w-4 h-4 text-green-600" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{msg.direction === 'user' ? 'Usuário' : 'Carol'}</span>
                    {msg.state_after && (
                      <span className="font-mono bg-muted px-1 rounded">
                        {msg.state_before || 'START'} → {msg.state_after}
                      </span>
                    )}
                    {msg.response_time_ms > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {msg.response_time_ms}ms
                      </span>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.message_content}</p>

                  {/* Errors */}
                  {msg.errors && msg.errors.length > 0 && (
                    <div className="space-y-1">
                      {msg.errors.map((err, i) => (
                        <div key={i} className={`text-xs p-2 rounded flex items-center gap-2 ${
                          err.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          <AlertTriangle className="w-3 h-3" />
                          {err.message}
                          {err.state && <span className="font-mono">({err.state})</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* LLM Calls */}
                  {msg.llm_calls && msg.llm_calls.length > 0 && (
                    <LlmCallsPanel calls={msg.llm_calls} />
                  )}

                  {/* Context */}
                  {msg.context_snapshot && Object.keys(msg.context_snapshot).length > 0 && (
                    <ContextViewer data={msg.context_snapshot} title="Contexto" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create details page**

```typescript
// app/(admin)/admin/chat-logs/[sessionId]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { SessionDetail } from '../components/SessionDetail'
import { LogEntry } from '@/lib/services/chat-logger'

export default function ChatLogDetailPage() {
  const params = useParams()
  const sessionId = params.sessionId as string

  const [isLoading, setIsLoading] = useState(true)
  const [session, setSession] = useState<{
    cliente_id?: string
    cliente_nome?: string
    final_state: string
  }>({ final_state: '' })
  const [messages, setMessages] = useState<LogEntry[]>([])

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true)
      const res = await fetch(`/api/admin/chat-logs/${sessionId}`)
      const data = await res.json()
      setSession(data.session)
      setMessages(data.messages)
      setIsLoading(false)
    }

    fetchDetails()
  }, [sessionId])

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center text-muted-foreground">
        Carregando...
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <SessionDetail
        sessionId={sessionId}
        session={session}
        messages={messages}
      />
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add "app/(admin)/admin/chat-logs/[sessionId]/" "app/(admin)/admin/chat-logs/components/"
git commit -m "feat(admin): add chat-logs session detail page with components"
```

---

## Task 12: Final Verification

- [ ] **Step 1: Run local type check**

```bash
npx tsc --noEmit
```

- [ ] **Step 2: Verify migration was applied**

Check Supabase dashboard → Table Editor → `chat_logs` exists

- [ ] **Step 3: Test the flow**

1. Send a message through the chat
2. Check Supabase `chat_logs` table for new entries
3. Navigate to `/admin/chat-logs` in browser
4. Click on a session to see details
5. Test export functionality

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(chat-logs): complete audit system implementation"
git push
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Database migration | 1 new |
| 2 | ChatLogger service | 1 new |
| 3 | LLM metrics methods | 1 modified |
| 4 | ChatResponse extension | 1 modified |
| 5 | Engine metrics collection | 1 modified |
| 6 | CarolAgent integration | 1 modified |
| 7 | API route integration | 1 modified |
| 8 | Admin API routes | 3 new |
| 9 | Cron cleanup | 1 new |
| 10 | Sessions list UI | 2 new |
| 11 | Session detail UI | 5 new |
| 12 | Verification | - |

**Total:** 16 new files, 5 modified files

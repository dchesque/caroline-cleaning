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

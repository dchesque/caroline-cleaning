// lib/ai/state-machine/engine.ts
// Core state machine engine for Carol - processes messages through registered state handlers

import { CarolState, SessionContext, HandlerResult, StateHandler } from './types'
import { CarolServices } from '@/lib/services/carol-services'
import { CarolLLM, LLMCallRecord } from '../llm'
import { logger } from '@/lib/logger'
import type { BrowserContext } from '@/lib/tracking/browser-context'

export interface ProcessingMetrics {
  llmCalls: LLMCallRecord[]
  handlersExecuted: { handler: string; duration_ms: number }[]
  extractedData: Record<string, any>
  contextSnapshot: Record<string, any>
  errors: { type: 'warning' | 'error'; message: string; state?: string }[]
}

/** Maximum number of silent (auto) transitions before forcing a stop. */
const MAX_AUTO_TRANSITIONS = 10

/** Maximum time (ms) a single handler is allowed to run before being aborted. */
const HANDLER_TIMEOUT_MS = 30_000

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Handler timeout: ${label} exceeded ${ms}ms`)), ms)
    ),
  ])
}

/** All valid CarolState values for runtime validation. */
const VALID_STATES: ReadonlySet<string> = new Set<CarolState>([
  'GREETING', 'COLLECT_PHONE', 'CONFIRM_PHONE', 'LOOKUP_CUSTOMER',
  'NEW_CUSTOMER_NAME', 'EXPLAIN_FIRST_VISIT', 'COLLECT_VISIT_PREFERENCES', 'NEW_CUSTOMER_ADDRESS',
  'CHECK_ZIP', 'ZIP_NOT_COVERED', 'CREATE_LEAD',
  'RETURNING_CUSTOMER', 'DETECT_INTENT',
  'CONFIRM_ADDRESS', 'ASK_SERVICE_TYPE', 'ASK_ADDONS', 'ASK_DATE', 'COLLECT_DATE',
  'CHECK_AVAILABILITY', 'NO_SLOTS', 'COLLECT_TIME', 'CREATE_BOOKING',
  'CONFIRM_SUMMARY', 'COLLECT_PREFERENCE', 'UPDATE_PREFERENCE',
  'SHOW_APPOINTMENTS', 'SELECT_APPOINTMENT', 'CONFIRM_CANCEL', 'CANCEL_APPOINTMENT',
  'CONFIRM_RESCHEDULE',
  'FAQ_RESPONSE', 'ASK_CALLBACK_TIME', 'SCHEDULE_CALLBACK',
  'UPDATE_CLIENT_INFO', 'SAVE_PET_INFO', 'SAVE_ALLERGY_INFO',
  'DEFLECT_PRICE', 'GUARDRAIL', 'DONE',
])

/** Validate that a state value is a valid CarolState. Falls back to GREETING with a warning. */
function validateState(state: string | undefined | null, sessionId: string): CarolState {
  if (state && VALID_STATES.has(state)) {
    return state as CarolState
  }
  logger.warn('Invalid state value detected, defaulting to GREETING', {
    sessionId,
    invalidState: state,
  })
  return 'GREETING'
}

export class CarolStateMachine {
  private handlers: Map<CarolState, StateHandler>
  private services: CarolServices
  private llm: CarolLLM

  constructor(services: CarolServices, llm: CarolLLM) {
    this.services = services
    this.llm = llm
    this.handlers = new Map()
  }

  // ─────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────

  /**
   * Register a handler for a given state.
   * Handlers are typically registered during application bootstrap.
   */
  registerHandler(state: CarolState, handler: StateHandler): void {
    this.handlers.set(state, handler)
  }

  /**
   * Process an incoming user message within a session.
   *
   * 1. Load (or initialise) session context.
   * 2. Run the handler for the current state.
   * 3. Apply context updates + state transitions.
   * 4. Chain silent transitions (up to MAX_AUTO_TRANSITIONS).
   * 5. Persist context and messages.
   * 6. Return the final response and state.
   */
  async process(
    message: string,
    sessionId: string,
    browserContext?: BrowserContext,
  ): Promise<{
    response: string
    state: CarolState
    state_before: CarolState
    metrics: ProcessingMetrics
    cliente_id?: string
    conversion?: {
      eventId: string
      eventName: string
      userData?: Record<string, unknown>
      customData?: Record<string, unknown>
    }
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

    // If there is no state yet, initialise with defaults
    if (!context.state) {
      context = this.initializeContext()
    }

    // Merge incoming browser context (from request) on top of whatever was
    // persisted from previous turns. Client won't always resend (e.g. fbc only
    // available on the first visit), so the stored values act as fallback.
    if (browserContext) {
      const prev = (context.browser_context as BrowserContext | undefined) || {}
      context.browser_context = {
        fbc: browserContext.fbc || prev.fbc,
        fbp: browserContext.fbp || prev.fbp,
        clientIp: browserContext.clientIp || prev.clientIp,
        userAgent: browserContext.userAgent || prev.userAgent,
        eventSourceUrl: browserContext.eventSourceUrl || prev.eventSourceUrl,
        referrer: browserContext.referrer || prev.referrer,
      }
    }

    let currentState = validateState(context.state, sessionId)
    context.state = currentState
    const stateBefore: CarolState = currentState

    // Global loop protection: track consecutive same-state interactions
    const sameStateCount = context._same_state_count || 0
    if (currentState === context._last_processed_state) {
      context._same_state_count = sameStateCount + 1
    } else {
      context._same_state_count = 0
    }
    context._last_processed_state = currentState

    if ((context._same_state_count ?? 0) >= 10) {
      logger.error('Global loop protection triggered', {
        sessionId,
        state: currentState,
        consecutiveCount: context._same_state_count,
      })
      metrics.errors.push({
        type: 'error',
        message: `Global loop protection: state ${currentState} repeated ${context._same_state_count} times`,
        state: currentState,
      })
      context._same_state_count = 0
      context.state = 'DONE'
      currentState = 'DONE'
    }

    // 2. Execute handler for the current state
    const handler = this.handlers.get(currentState)
    if (!handler) {
      logger.error('No handler registered for state', { state: currentState, sessionId })
      metrics.errors.push({
        type: 'error',
        message: 'No handler registered for state',
        state: currentState,
      })
      metrics.contextSnapshot = {
        cliente_id: context.cliente_id,
        cliente_nome: context.cliente_nome,
        cliente_telefone: context.cliente_telefone,
        service_type: context.service_type,
        selected_date: context.selected_date,
        selected_time: context.selected_time,
        state: context.state,
      }
      return {
        response: "I'm sorry, something went wrong on my end. Could you try again?",
        state: currentState,
        state_before: stateBefore,
        metrics,
        cliente_id: context.cliente_id || undefined,
      }
    }

    logger.info('State machine processing', {
      sessionId,
      state: currentState,
      messagePreview: message.substring(0, 80),
    })

    let result: HandlerResult
    const handlerStartTime = Date.now()
    try {
      result = await withTimeout(
        handler(message, context, this.services, this.llm),
        HANDLER_TIMEOUT_MS,
        currentState
      )
      metrics.handlersExecuted.push({
        handler: `${currentState}Handler`,
        duration_ms: Date.now() - handlerStartTime,
      })
    } catch (err) {
      const durationMs = Date.now() - handlerStartTime
      metrics.handlersExecuted.push({
        handler: `${currentState}Handler`,
        duration_ms: durationMs,
      })
      const errorMessage = err instanceof Error ? err.message : String(err)
      logger.error('Handler threw an error', {
        state: currentState,
        sessionId,
        error: errorMessage,
      })
      metrics.errors.push({
        type: 'error',
        message: errorMessage,
        state: currentState,
      })
      metrics.contextSnapshot = {
        cliente_id: context.cliente_id,
        cliente_nome: context.cliente_nome,
        cliente_telefone: context.cliente_telefone,
        service_type: context.service_type,
        selected_date: context.selected_date,
        selected_time: context.selected_time,
        state: context.state,
      }
      try {
        await this.services.updateSession(sessionId, { ...context, state: currentState });
      } catch (persistError) {
        logger.error('[engine] Failed to persist context after handler error', { error: persistError instanceof Error ? persistError.message : String(persistError) });
      }
      return {
        response: "I'm sorry, I ran into an unexpected issue. Could you say that again?",
        state: currentState,
        state_before: stateBefore,
        metrics,
        cliente_id: context.cliente_id || undefined,
      }
    }

    // Track extracted data from contextUpdates
    if (result.contextUpdates) {
      metrics.extractedData = { ...metrics.extractedData, ...result.contextUpdates }
    }

    // 3. Apply context updates & transition
    context = this.applyTransition(context, result)

    // Collect responses (may accumulate across silent transitions)
    const responses: string[] = []
    if (result.response) {
      responses.push(result.response)
    }

    // 4. Chain silent (auto) transitions
    let autoTransitions = 0
    while (result.silent && autoTransitions < MAX_AUTO_TRANSITIONS) {
      autoTransitions++
      const nextState = result.nextState

      const nextHandler = this.handlers.get(nextState)
      if (!nextHandler) {
        logger.error('No handler for silent-transition target state', {
          state: nextState,
          sessionId,
        })
        metrics.errors.push({
          type: 'error',
          message: 'No handler for silent-transition target state',
          state: nextState,
        })
        break
      }

      logger.info('Silent auto-transition', {
        sessionId,
        from: context.previousState,
        to: nextState,
        iteration: autoTransitions,
      })

      const silentHandlerStartTime = Date.now()
      try {
        result = await withTimeout(
          nextHandler('', context, this.services, this.llm),
          HANDLER_TIMEOUT_MS,
          nextState
        )
        metrics.handlersExecuted.push({
          handler: `${nextState}Handler`,
          duration_ms: Date.now() - silentHandlerStartTime,
        })
        // Track extracted data from silent transition contextUpdates
        if (result.contextUpdates) {
          metrics.extractedData = { ...metrics.extractedData, ...result.contextUpdates }
        }
      } catch (err) {
        const durationMs = Date.now() - silentHandlerStartTime
        metrics.handlersExecuted.push({
          handler: `${nextState}Handler`,
          duration_ms: durationMs,
        })
        const errorMessage = err instanceof Error ? err.message : String(err)
        logger.error('Silent handler threw an error', {
          state: nextState,
          sessionId,
          error: errorMessage,
        })
        metrics.errors.push({
          type: 'error',
          message: errorMessage,
          state: nextState,
        })
        break
      }

      context = this.applyTransition(context, result)

      if (result.response) {
        responses.push(result.response)
      }
    }

    if (autoTransitions >= MAX_AUTO_TRANSITIONS) {
      logger.error('Max auto-transitions reached, breaking chain', {
        sessionId,
        lastState: context.state,
      })
      metrics.errors.push({
        type: 'warning',
        message: 'Max auto-transitions reached, breaking chain',
        state: context.state,
      })
    }

    const finalResponse = responses.join('\n\n')
    const finalState = context.state

    // Capture final context snapshot
    metrics.contextSnapshot = {
      cliente_id: context.cliente_id,
      cliente_nome: context.cliente_nome,
      cliente_telefone: context.cliente_telefone,
      service_type: context.service_type,
      selected_date: context.selected_date,
      selected_time: context.selected_time,
      state: context.state,
    }

    // Extract pending_conversion so we can forward it to the client, then
    // clear it from the persisted context to prevent duplicate fires on the
    // next turn.
    const conversion = context.pending_conversion ?? undefined
    context.pending_conversion = null

    // 5. Persist context
    try {
      await this.services.updateSession(sessionId, context)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      logger.error('Failed to persist session context', {
        sessionId,
        error: errorMessage,
      })
      metrics.errors.push({
        type: 'warning',
        message: `Failed to persist session context: ${errorMessage}`,
      })
    }

    // 6. Save messages (user + assistant)
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      logger.error('Failed to persist messages', {
        sessionId,
        error: errorMessage,
      })
      metrics.errors.push({
        type: 'warning',
        message: `Failed to persist messages: ${errorMessage}`,
      })
    }

    logger.info('State machine completed', {
      sessionId,
      initialState: currentState,
      finalState,
      autoTransitions,
      responseLength: finalResponse.length,
    })

    return {
      response: finalResponse,
      state: finalState,
      state_before: stateBefore,
      metrics,
      cliente_id: context.cliente_id || undefined,
      conversion: conversion ?? undefined,
    }
  }

  // ─────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────

  /**
   * Apply a HandlerResult to the current context:
   * - Merge contextUpdates
   * - Track previousState
   * - Reset retry_count on state change
   * - Set the new state
   */
  private applyTransition(context: SessionContext, result: HandlerResult): SessionContext {
    const previousState = context.state
    const nextState = result.nextState

    // Merge any context updates from the handler (spread to avoid mutating the original)
    if (result.contextUpdates) {
      context = { ...context, ...result.contextUpdates }
    }

    // Track previous state
    context.previousState = previousState

    // Reset retry_count when moving to a genuinely new state,
    // UNLESS the handler explicitly set it in contextUpdates (e.g. GREETING counts itself as attempt 1).
    if (nextState !== previousState && !Object.prototype.hasOwnProperty.call(result.contextUpdates ?? {}, 'retry_count')) {
      context.retry_count = 0
    }

    // Set the new state
    context.state = nextState

    return context
  }

  /**
   * Returns a fresh default SessionContext.
   */
  private initializeContext(): SessionContext {
    return this.services.getDefaultContext()
  }
}

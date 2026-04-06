// lib/ai/state-machine/engine.ts
// Core state machine engine for Carol - processes messages through registered state handlers

import { CarolState, SessionContext, HandlerResult, StateHandler } from './types'
import { CarolServices } from '@/lib/services/carol-services'
import { CarolLLM } from '../llm'
import { logger } from '@/lib/logger'

/** Maximum number of silent (auto) transitions before forcing a stop. */
const MAX_AUTO_TRANSITIONS = 5

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
  ): Promise<{ response: string; state: CarolState }> {
    // 1. Load context
    let context = await this.services.getSession(sessionId)

    // If there is no state yet, initialise with defaults
    if (!context.state) {
      context = this.initializeContext()
    }

    let currentState = context.state as CarolState

    // 2. Execute handler for the current state
    const handler = this.handlers.get(currentState)
    if (!handler) {
      logger.error('No handler registered for state', { state: currentState, sessionId })
      return {
        response: "I'm sorry, something went wrong on my end. Could you try again?",
        state: currentState,
      }
    }

    logger.info('State machine processing', {
      sessionId,
      state: currentState,
      messagePreview: message.substring(0, 80),
    })

    let result: HandlerResult
    try {
      result = await handler(message, context, this.services, this.llm)
    } catch (err) {
      logger.error('Handler threw an error', {
        state: currentState,
        sessionId,
        error: err instanceof Error ? err.message : String(err),
      })
      return {
        response: "I'm sorry, I ran into an unexpected issue. Could you say that again?",
        state: currentState,
      }
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
        break
      }

      logger.info('Silent auto-transition', {
        sessionId,
        from: context.previousState,
        to: nextState,
        iteration: autoTransitions,
      })

      try {
        result = await nextHandler('', context, this.services, this.llm)
      } catch (err) {
        logger.error('Silent handler threw an error', {
          state: nextState,
          sessionId,
          error: err instanceof Error ? err.message : String(err),
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
    }

    const finalResponse = responses.join('\n\n')
    const finalState = context.state as CarolState

    // 5. Persist context
    try {
      await this.services.updateSession(sessionId, context)
    } catch (err) {
      logger.error('Failed to persist session context', {
        sessionId,
        error: err instanceof Error ? err.message : String(err),
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
      logger.error('Failed to persist messages', {
        sessionId,
        error: err instanceof Error ? err.message : String(err),
      })
    }

    logger.info('State machine completed', {
      sessionId,
      initialState: currentState,
      finalState,
      autoTransitions,
      responseLength: finalResponse.length,
    })

    return { response: finalResponse, state: finalState }
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

    // Merge any context updates from the handler
    if (result.contextUpdates) {
      Object.assign(context, result.contextUpdates)
    }

    // Track previous state
    context.previousState = previousState

    // Reset retry_count when moving to a genuinely new state
    if (nextState !== previousState) {
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

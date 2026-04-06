// lib/ai/state-machine/handlers/greeting.ts

import type { StateHandler } from '../types'

/**
 * GREETING state handler.
 * Detects language from the user's first message.
 * If context already has a customer name, treat as resuming session.
 * Otherwise, ask for their phone number to identify them.
 */
export const handleGreeting: StateHandler = async (message, context, services, llm) => {
  const language = await llm.detectLanguage(message)

  // Returning / resumed session: we already know who this is
  if (context.cliente_nome) {
    const response = await llm.generate('greet_returning', {
      name: context.cliente_nome,
    }, language)

    return {
      nextState: 'DETECT_INTENT',
      response,
      contextUpdates: { language, previousState: 'GREETING' },
    }
  }

  // New session: ask for phone to look them up
  const response = await llm.generate('ask_phone', {}, language)

  return {
    nextState: 'COLLECT_PHONE',
    response,
    contextUpdates: { language, previousState: 'GREETING', retry_count: 0 },
  }
}

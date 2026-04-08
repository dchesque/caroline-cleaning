// lib/ai/state-machine/handlers/greeting.ts

import type { StateHandler } from '../types'
import { extractPhoneFromText, normalizePhone, formatPhone } from '../validators'

/**
 * GREETING state handler.
 * If context already has a customer name, treat as resuming session.
 * Otherwise, ask for their phone number to identify them.
 */
export const handleGreeting: StateHandler = async (message, context, services, llm) => {
  // Returning / resumed session: we already know who this is
  if (context.cliente_nome) {
    const response = await llm.generate('greet_returning', {
      name: context.cliente_nome,
    }, message)

    return {
      nextState: 'DETECT_INTENT',
      response,
      contextUpdates: { previousState: 'GREETING' },
    }
  }

  // New session: check if user already provided their phone in the first message
  const regexPhone = extractPhoneFromText(message)
  if (regexPhone) {
    const normalized = normalizePhone(regexPhone)
    if (normalized) {
      const formatted = formatPhone(normalized)
      return {
        nextState: 'CONFIRM_PHONE',
        response: `Just to confirm: your number is ${formatted}, correct?`,
        contextUpdates: { previousState: 'GREETING', retry_count: 0, cliente_telefone: normalized },
      }
    }
  }

  // No phone found — respond naturally and ask for it
  const response = await llm.generate('ask_phone', {}, message)

  return {
    nextState: 'COLLECT_PHONE',
    response,
    // Count this first message as retry attempt 1 so escalation triggers after 5 total attempts,
    // not 6 (GREETING attempt + 5 COLLECT_PHONE attempts).
    contextUpdates: { previousState: 'GREETING', retry_count: 1 },
  }
}

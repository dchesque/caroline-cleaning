// lib/ai/state-machine/handlers/phone.ts

import type { StateHandler } from '../types'
import { normalizePhone, formatPhone, extractPhoneFromText } from '../validators'

const MAX_COLLECTION_RETRIES = 5

/**
 * COLLECT_PHONE: Extract and validate a US phone number from the message.
 * Max retries before offering a callback instead.
 */
export const handleCollectPhone: StateHandler = async (message, context, services, llm) => {
  // Silent/empty message means we were chained here — ask for phone directly
  if (!message || !message.trim()) {
    return {
      nextState: 'COLLECT_PHONE',
      response: 'Could you share your phone number so I can pull up your account? 😊',
      contextUpdates: { retry_count: 0 },
    }
  }

  // Try regex extraction first (fast, reliable, no LLM needed)
  const regexPhone = extractPhoneFromText(message)
  // Fall back to LLM only if regex found nothing
  const extracted = regexPhone ? null : await llm.extract('phone', message)
  const raw = regexPhone ?? extracted?.phone ?? extracted?.value ?? null

  if (!raw) {
    const retries = (context.retry_count || 0) + 1

    if (retries >= MAX_COLLECTION_RETRIES) {
      const response = await llm.generate('max_retries_phone', {}, message)
      return {
        nextState: 'ASK_CALLBACK_TIME',
        response,
        contextUpdates: { retry_count: retries },
      }
    }

    // LLM with user message context: can acknowledge what user said + ask for phone
    const response = await llm.generate('ask_phone_retry', {}, message)
    return {
      nextState: 'COLLECT_PHONE',
      response,
      contextUpdates: { retry_count: retries },
    }
  }

  const normalized = normalizePhone(String(raw))

  if (!normalized) {
    const retries = (context.retry_count ?? 0) + 1

    if (retries >= MAX_COLLECTION_RETRIES) {
      return {
        nextState: 'ASK_CALLBACK_TIME',
        response: "I wasn't able to capture your number. Would you like us to call you instead?",
        contextUpdates: { retry_count: retries },
      }
    }

    const response = await llm.generate('invalid_phone', {}, message)
    return {
      nextState: 'COLLECT_PHONE',
      response,
      contextUpdates: { retry_count: retries },
    }
  }

  const formatted = formatPhone(normalized)
  // Hardcoded: critical step — must reliably show the number to confirm
  return {
    nextState: 'CONFIRM_PHONE',
    response: `Just to confirm: your number is ${formatted}, correct?`,
    contextUpdates: {
      cliente_telefone: normalized,
      retry_count: 0,
    },
  }
}

/**
 * CONFIRM_PHONE: User confirms or corrects the phone number.
 */
export const handleConfirmPhone: StateHandler = async (message, context, services, llm) => {
  const intent = await llm.classifyIntent(message, ['yes', 'no', 'correction'])

  if (intent === 'yes') {
    // Proceed to lookup — silent transition, no user-facing message needed
    return {
      nextState: 'LOOKUP_CUSTOMER',
      response: '',
      silent: true,
    }
  }

  if (intent === 'correction') {
    const extracted = await llm.extract('phone', message)
    const raw = extracted?.phone ?? extracted?.value ?? ''
    const normalized = normalizePhone(String(raw))

    if (normalized) {
      const formatted = formatPhone(normalized)
      const response = await llm.generate('confirm_phone', { phone: formatted })
      return {
        nextState: 'CONFIRM_PHONE',
        response,
        contextUpdates: { cliente_telefone: normalized },
      }
    }

    // Could not extract a correction — ask again
    return {
      nextState: 'COLLECT_PHONE',
      response: "I couldn't catch the new number. Could you type it again? e.g. (704) 555-1234",
      contextUpdates: { cliente_telefone: null },
    }
  }

  // intent === 'no' — start over
  return {
    nextState: 'COLLECT_PHONE',
    response: 'No problem! What is the correct phone number? 😊',
    contextUpdates: { cliente_telefone: null, retry_count: 0 },
  }
}

/**
 * LOOKUP_CUSTOMER: Look up a customer by phone. Silent handler.
 * If found → RETURNING_CUSTOMER with customer data.
 * If not found → NEW_CUSTOMER_NAME to start onboarding.
 */
export const handleLookupCustomer: StateHandler = async (_message, context, services, llm) => {
  const phone = context.cliente_telefone
  if (!phone) {
    // Guard: shouldn't reach here without a phone — restart collection
    return {
      nextState: 'COLLECT_PHONE',
      response: "I need your phone number to continue. What's your number?",
    }
  }

  const result = await services.findCustomerByPhone(phone)

  if (result.found && result.customer) {
    return {
      nextState: 'RETURNING_CUSTOMER',
      response: '',
      silent: true,
      contextUpdates: {
        cliente_id: result.client_id ?? null,
        cliente_nome: result.customer.name,
        cliente_endereco: result.customer.address,
        cliente_zip: result.customer.zip_code,
        cliente_email: result.customer.email,
        is_returning: true,
        appointments: result.upcoming_appointments ?? null,
        canal_preferencia: (result.customer.preferred_channel as 'sms' | 'whatsapp') ?? null,
        pets_info: result.customer.pets_details ?? null,
      },
    }
  }

  // Not found — new customer flow
  const response = await llm.generate('ask_name', {})
  return {
    nextState: 'NEW_CUSTOMER_NAME',
    response,
  }
}

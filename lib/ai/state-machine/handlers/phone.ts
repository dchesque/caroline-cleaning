// lib/ai/state-machine/handlers/phone.ts

import type { StateHandler } from '../types'
import { normalizePhone, formatPhone } from '../validators'

const MAX_COLLECTION_RETRIES = 5

/**
 * COLLECT_PHONE: Extract and validate a US phone number from the message.
 * Max retries before offering a callback instead.
 */
export const handleCollectPhone: StateHandler = async (message, context, services, llm) => {
  const lang = context.language

  const extracted = await llm.extract('phone', message)
  const raw = extracted?.phone ?? extracted?.value ?? null

  if (!raw) {
    const retries = (context.retry_count || 0) + 1

    if (retries >= MAX_COLLECTION_RETRIES) {
      const response = await llm.generate('max_retries_phone', {}, lang)
      return {
        nextState: 'ASK_CALLBACK_TIME',
        response,
        contextUpdates: { retry_count: retries },
      }
    }

    return {
      nextState: 'COLLECT_PHONE',
      response: await llm.generate('ask_phone', {}, lang),
      contextUpdates: { retry_count: retries },
    }
  }

  const normalized = normalizePhone(String(raw))

  if (!normalized) {
    const retries = (context.retry_count ?? 0) + 1

    if (retries >= MAX_COLLECTION_RETRIES) {
      const response = await llm.generate('max_retries_phone', {}, lang)
      return {
        nextState: 'ASK_CALLBACK_TIME',
        response,
        contextUpdates: { retry_count: retries },
      }
    }

    const response = await llm.generate('invalid_phone', { attempts_left: MAX_COLLECTION_RETRIES - retries }, lang)
    return {
      nextState: 'COLLECT_PHONE',
      response,
      contextUpdates: { retry_count: retries },
    }
  }

  const formatted = formatPhone(normalized)
  const response = await llm.generate('confirm_phone', { phone: formatted }, lang)

  return {
    nextState: 'CONFIRM_PHONE',
    response,
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
  const lang = context.language
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
      const response = await llm.generate('confirm_phone', { phone: formatted }, lang)
      return {
        nextState: 'CONFIRM_PHONE',
        response,
        contextUpdates: { cliente_telefone: normalized },
      }
    }

    // Could not extract a correction — ask again
    const response = await llm.generate('ask_phone', {}, lang)
    return {
      nextState: 'COLLECT_PHONE',
      response,
      contextUpdates: { cliente_telefone: null },
    }
  }

  // intent === 'no' — start over
  const response = await llm.generate('ask_phone', {}, lang)
  return {
    nextState: 'COLLECT_PHONE',
    response,
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
    return {
      nextState: 'COLLECT_PHONE',
      response: '',
      silent: true,
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
  const response = await llm.generate('ask_name', {}, context.language)
  return {
    nextState: 'NEW_CUSTOMER_NAME',
    response,
  }
}

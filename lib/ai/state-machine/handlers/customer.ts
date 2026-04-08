// lib/ai/state-machine/handlers/customer.ts

import type { StateHandler } from '../types'
import { extractZipFromAddress, getDurationForService } from '../validators'
import { routeByIntent } from './guardrail'

const MAX_COLLECTION_RETRIES = 5

/**
 * NEW_CUSTOMER_NAME: Extract the customer's name from their message.
 */
export const handleNewCustomerName: StateHandler = async (message, context, _services, llm) => {
  const extracted = await llm.extract('name', message)
  const name = extracted?.name ?? extracted?.value ?? null

  if (!name || name.length < 2) {
    const retries = (context.retry_count || 0) + 1

    if (retries >= MAX_COLLECTION_RETRIES) {
      return {
        nextState: 'ASK_CALLBACK_TIME',
        response: "I'm having trouble capturing your name. Would you like someone to call you back?",
        contextUpdates: { retry_count: 0 },
      }
    }

    return {
      nextState: 'NEW_CUSTOMER_NAME',
      response: await llm.generate('ask_name', {}),
      contextUpdates: { retry_count: retries },
    }
  }

  return {
    nextState: 'EXPLAIN_FIRST_VISIT',
    response: '',
    silent: true,
    contextUpdates: {
      cliente_nome: name,
    },
  }
}

/**
 * EXPLAIN_FIRST_VISIT: Tell the customer about the free first visit / estimate.
 * - New customer (is_returning=false): ask for address next.
 * - Returning customer with no completed service (is_returning=true): ask for service preferences next.
 */
export const handleExplainFirstVisit: StateHandler = async (_message, context, _services, llm) => {
  if (context.is_returning) {
    const response = await llm.generate('explain_first_visit_returning', {
      name: context.cliente_nome,
    })
    return {
      nextState: 'COLLECT_VISIT_PREFERENCES',
      response,
    }
  }

  const response = await llm.generate('explain_first_visit', {
    name: context.cliente_nome,
  })
  return {
    nextState: 'NEW_CUSTOMER_ADDRESS',
    response,
  }
}

/**
 * COLLECT_VISIT_PREFERENCES: Collect service type and notes from returning customer
 * who needs a first visit. Then route to ASK_DATE silently.
 */
export const handleCollectVisitPreferences: StateHandler = async (message, context, _services, llm) => {
  const extracted = await llm.extract('visit_preferences', message)
  const serviceType = extracted?.service_type ?? null
  const notes = extracted?.extra_notes ?? null

  // If we couldn't extract anything meaningful, ask again once
  if (!serviceType && !notes) {
    const retries = (context.retry_count || 0) + 1
    if (retries < 3) {
      return {
        nextState: 'COLLECT_VISIT_PREFERENCES',
        response: await llm.generate('ask_visit_preferences', { name: context.cliente_nome }),
        contextUpdates: { retry_count: retries },
      }
    }
  }

  return {
    nextState: 'ASK_DATE',
    response: '',
    silent: true,
    contextUpdates: {
      service_type: serviceType ?? 'visit',
      duration_minutes: 60,
      ...(notes ? { notas_visita: notes } : {}),
      retry_count: 0,
    },
  }
}

/**
 * NEW_CUSTOMER_ADDRESS: Extract address + ZIP from the user's message.
 * If ZIP is missing, try to extract it from the address text.
 */
export const handleNewCustomerAddress: StateHandler = async (message, context, _services, llm) => {
  const extracted = await llm.extract('address', message)
  const address = extracted?.address ?? extracted?.value ?? null
  const retries = (context.retry_count || 0) + 1

  if (!address || address.length < 5) {
    if (retries >= MAX_COLLECTION_RETRIES) {
      return {
        nextState: 'ASK_CALLBACK_TIME',
        response: "I'm having trouble capturing your address. Would you like someone to call you back?",
        contextUpdates: { retry_count: 0 },
      }
    }
    return {
      nextState: 'NEW_CUSTOMER_ADDRESS',
      response: await llm.generate('ask_address_again', {}),
      contextUpdates: { retry_count: retries },
    }
  }

  let zip = extracted?.zip ?? extracted?.zip_code ?? null

  if (!zip) {
    zip = extractZipFromAddress(address)
  }

  if (!zip) {
    if (retries >= MAX_COLLECTION_RETRIES) {
      return {
        nextState: 'ASK_CALLBACK_TIME',
        response: "I'm having trouble capturing your ZIP code. Would you like someone to call you back?",
        contextUpdates: { cliente_endereco: address, retry_count: 0 },
      }
    }
    const response = await llm.generate('ask_zip', { address })
    return {
      nextState: 'NEW_CUSTOMER_ADDRESS',
      response,
      contextUpdates: { cliente_endereco: address, retry_count: retries },
    }
  }

  return {
    nextState: 'CHECK_ZIP',
    response: '',
    silent: true,
    contextUpdates: {
      cliente_endereco: address,
      cliente_zip: zip,
    },
  }
}

/**
 * CHECK_ZIP: Verify service area coverage. Silent handler.
 */
export const handleCheckZip: StateHandler = async (_message, context, services, _llm) => {
  const zip = context.cliente_zip
  if (!zip) {
    return {
      nextState: 'NEW_CUSTOMER_ADDRESS',
      response: 'I need your ZIP code to check if we serve your area. Could you share your address with ZIP?',
    }
  }

  let result
  try {
    result = await services.checkZipCoverage(zip)
  } catch {
    return {
      nextState: 'NEW_CUSTOMER_ADDRESS',
      response: "I had trouble checking your area. Could you confirm your address with ZIP code?",
    }
  }

  if (result.covered) {
    return {
      nextState: 'CREATE_LEAD',
      response: '',
      silent: true,
    }
  }

  return {
    nextState: 'ZIP_NOT_COVERED',
    response: '',
    silent: true,
  }
}

/**
 * ZIP_NOT_COVERED: Inform user we don't cover their area.
 * Still create a lead on the waitlist.
 */
export const handleZipNotCovered: StateHandler = async (_message, context, services, llm) => {
  // Create a waitlist lead even though not covered
  if (context.cliente_nome && context.cliente_telefone) {
    try {
      await services.createLead({
        name: context.cliente_nome,
        phone: context.cliente_telefone,
        address: context.cliente_endereco,
        zip_code: context.cliente_zip,
        notes: 'Waitlist - ZIP not covered',
      })
    } catch {
      // Non-critical — waitlist add failed, still inform user
    }
  }

  const response = await llm.generate('zip_not_covered', {
    zip: context.cliente_zip,
    name: context.cliente_nome,
  })

  return {
    nextState: 'DONE',
    response,
  }
}

/**
 * CREATE_LEAD: Persist the new customer as a lead. Silent handler.
 */
export const handleCreateLead: StateHandler = async (_message, context, services, llm) => {
  let result
  try {
    result = await services.createLead({
      name: context.cliente_nome ?? 'New Lead',
      phone: context.cliente_telefone ?? '',
      email: context.cliente_email,
      address: context.cliente_endereco,
      zip_code: context.cliente_zip,
    })
  } catch {
    return {
      nextState: 'DETECT_INTENT',
      response: await llm.generate('booking_error', {}),
    }
  }

  if (result.status === 'error') {
    return {
      nextState: 'DETECT_INTENT',
      response: await llm.generate('booking_error', {}),
    }
  }

  const clientId = result.client_id

  const response = await llm.generate('ask_date', {
    name: context.cliente_nome,
  })

  return {
    nextState: 'ASK_DATE',
    response,
    contextUpdates: {
      cliente_id: clientId,
    },
  }
}

/**
 * RETURNING_CUSTOMER: Greet a known customer by name and wait for their intent.
 */
export const handleReturningCustomer: StateHandler = async (_message, context, _services, llm) => {
  const upcomingCount = context.appointments?.length ?? 0

  const response = await llm.generate('greet_returning', {
    name: context.cliente_nome,
    upcoming_count: upcomingCount,
  })

  return {
    nextState: 'DETECT_INTENT',
    response,
  }
}

/**
 * DETECT_INTENT: Classify what the user wants and route to the right flow.
 */
export const handleDetectIntent: StateHandler = async (message, context, _services, llm) => {
  const intent = await llm.classifyIntent(message, [
    'schedule',
    'cancel',
    'reschedule',
    'faq',
    'callback',
    'update_info',
    'price_inquiry',
    'pet_info',
    'allergy_info',
    'off_topic',
    'greeting',
    'unknown',
  ])

  const intentRetries = (context.intent_retry_count as number) || 0

  // Use shared routing helper for known intents
  const routed = routeByIntent(intent, context, message)
  if (routed) {
    return routed
  }

  // greeting / unknown / unrecognized — ask again or escalate
  const retries = intentRetries + 1

  if (retries >= 3) {
    // Escalate to callback after 3 failed classifications
    const response = await llm.generate('ask_intent', { name: context.cliente_nome })
    return {
      nextState: 'ASK_CALLBACK_TIME',
      response: response + "\n\nI'm having trouble understanding. Would you like someone to call you back?",
      contextUpdates: { intent_retry_count: 0 },
    }
  }

  const response = await llm.generate('ask_intent', { name: context.cliente_nome })
  return {
    nextState: 'DETECT_INTENT',
    response,
    contextUpdates: { intent_retry_count: retries },
  }
}

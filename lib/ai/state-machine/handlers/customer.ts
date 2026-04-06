// lib/ai/state-machine/handlers/customer.ts

import type { StateHandler } from '../types'
import { extractZipFromAddress, getDurationForService } from '../validators'

/**
 * NEW_CUSTOMER_NAME: Extract the customer's name from their message.
 */
export const handleNewCustomerName: StateHandler = async (message, context, _services, llm) => {
  const extracted = await llm.extract('name', message)
  const name = extracted?.name ?? extracted?.value ?? null

  if (!name || name.length < 2) {
    return {
      nextState: 'NEW_CUSTOMER_NAME',
      response: await llm.generate('ask_name', {}, context.language || 'en'),
      contextUpdates: { retry_count: (context.retry_count || 0) + 1 },
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
 * EXPLAIN_FIRST_VISIT: Tell the new customer about the free first visit / estimate.
 * Then ask for their address.
 */
export const handleExplainFirstVisit: StateHandler = async (_message, context, _services, llm) => {
  const response = await llm.generate('explain_first_visit', {
    name: context.cliente_nome,
  }, context.language)

  return {
    nextState: 'NEW_CUSTOMER_ADDRESS',
    response,
  }
}

/**
 * NEW_CUSTOMER_ADDRESS: Extract address + ZIP from the user's message.
 * If ZIP is missing, try to extract it from the address text.
 */
export const handleNewCustomerAddress: StateHandler = async (message, context, _services, llm) => {
  const extracted = await llm.extract('address', message)
  const address = extracted?.address ?? extracted?.value ?? null

  if (!address || address.length < 5) {
    return {
      nextState: 'NEW_CUSTOMER_ADDRESS',
      response: await llm.generate('ask_address_again', {}, context.language || 'en'),
    }
  }

  let zip = extracted?.zip ?? extracted?.zip_code ?? null

  if (!zip) {
    zip = extractZipFromAddress(address)
  }

  if (!zip) {
    // Ask specifically for ZIP
    const response = await llm.generate('ask_zip', { address }, context.language)
    return {
      nextState: 'NEW_CUSTOMER_ADDRESS',
      response,
      contextUpdates: { cliente_endereco: address },
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

  const result = await services.checkZipCoverage(zip)

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
    await services.createLead({
      name: context.cliente_nome,
      phone: context.cliente_telefone,
      address: context.cliente_endereco,
      zip_code: context.cliente_zip,
      notes: 'Waitlist - ZIP not covered',
    })
  }

  const response = await llm.generate('zip_not_covered', {
    zip: context.cliente_zip,
    name: context.cliente_nome,
  }, context.language)

  return {
    nextState: 'DONE',
    response,
  }
}

/**
 * CREATE_LEAD: Persist the new customer as a lead. Silent handler.
 */
export const handleCreateLead: StateHandler = async (_message, context, services, llm) => {
  const result = await services.createLead({
    name: context.cliente_nome ?? 'New Lead',
    phone: context.cliente_telefone ?? '',
    email: context.cliente_email,
    address: context.cliente_endereco,
    zip_code: context.cliente_zip,
  })

  if (result.status === 'error') {
    return {
      nextState: 'DETECT_INTENT',
      response: await llm.generate('booking_error', {}, context.language || 'en'),
    }
  }

  const clientId = result.client_id

  const response = await llm.generate('ask_date', {
    name: context.cliente_nome,
  }, context.language)

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
  }, context.language)

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
    'off_topic',
    'greeting',
    'unknown',
  ])

  const lang = context.language

  switch (intent) {
    case 'schedule': {
      // Returning customers with an address on file go to CONFIRM_ADDRESS
      if (context.is_returning && context.cliente_endereco) {
        return {
          nextState: 'CONFIRM_ADDRESS',
          response: '',
          silent: true,
          contextUpdates: { previousState: 'DETECT_INTENT' },
        }
      }
      // New customers (or those without address) go straight to ASK_DATE
      return {
        nextState: 'ASK_DATE',
        response: '',
        silent: true,
        contextUpdates: { previousState: 'DETECT_INTENT' },
      }
    }

    case 'cancel':
      return {
        nextState: 'SHOW_APPOINTMENTS',
        response: '',
        silent: true,
        contextUpdates: { previousState: 'DETECT_INTENT', intent_flow: 'cancel' },
      }

    case 'reschedule':
      return {
        nextState: 'SHOW_APPOINTMENTS',
        response: '',
        silent: true,
        contextUpdates: { previousState: 'DETECT_INTENT', intent_flow: 'reschedule' },
      }

    case 'faq':
      return {
        nextState: 'FAQ_RESPONSE',
        response: '',
        silent: true,
        contextUpdates: { previousState: 'DETECT_INTENT', faq_question: message },
      }

    case 'callback':
      return {
        nextState: 'ASK_CALLBACK_TIME',
        response: '',
        silent: true,
        contextUpdates: { previousState: 'DETECT_INTENT' },
      }

    case 'update_info':
      return {
        nextState: 'UPDATE_CLIENT_INFO',
        response: '',
        silent: true,
        contextUpdates: { previousState: 'DETECT_INTENT', update_request: message },
      }

    case 'price_inquiry':
      return {
        nextState: 'DEFLECT_PRICE',
        response: '',
        silent: true,
        contextUpdates: { previousState: 'DETECT_INTENT' },
      }

    case 'off_topic':
      return {
        nextState: 'GUARDRAIL',
        response: '',
        silent: true,
        contextUpdates: { previousState: 'DETECT_INTENT' },
      }

    case 'greeting':
    case 'unknown':
    default: {
      const response = await llm.generate('ask_intent', {
        name: context.cliente_nome,
      }, lang)
      return {
        nextState: 'DETECT_INTENT',
        response,
      }
    }
  }
}

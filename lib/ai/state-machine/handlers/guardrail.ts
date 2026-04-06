// lib/ai/state-machine/handlers/guardrail.ts

import type { StateHandler, CarolState } from '../types'

/**
 * GUARDRAIL: The user said something off-topic. Politely redirect back to cleaning services.
 * Returns to previousState or DETECT_INTENT.
 */
export const handleGuardrail: StateHandler = async (_message, context, _services, llm) => {
  const response = await llm.generate('guardrail', {
    name: context.cliente_nome,
  }, context.language)

  const returnState = (context.previousState as CarolState) ?? 'DETECT_INTENT'

  return {
    nextState: returnState,
    response,
  }
}

/**
 * UPDATE_CLIENT_INFO: Extract what the user wants to update and persist it.
 */
export const handleUpdateClientInfo: StateHandler = async (message, context, services, llm) => {
  const lang = context.language
  const updateRequest = context.update_request ?? message ?? ''

  if (!context.cliente_id) {
    const response = await llm.generate('no_client_id', {}, lang)
    return {
      nextState: 'COLLECT_PHONE',
      response,
    }
  }

  // Use LLM to extract what field(s) to update
  const extracted = await llm.extract('correction', updateRequest, {
    current_name: context.cliente_nome,
    current_address: context.cliente_endereco,
    current_email: context.cliente_email,
    current_zip: context.cliente_zip,
  })

  const updates: Record<string, any> = {}

  if (extracted?.name) updates.nome = extracted.name
  if (extracted?.address) updates.endereco_completo = extracted.address
  if (extracted?.email) updates.email = extracted.email
  if (extracted?.zip_code || extracted?.zip) updates.zip_code = extracted.zip_code ?? extracted.zip
  if (extracted?.phone) updates.telefone = extracted.phone
  if (extracted?.city) updates.cidade = extracted.city
  if (extracted?.state) updates.estado = extracted.state

  if (Object.keys(updates).length === 0) {
    // Could not figure out what to update — ask for clarification
    const response = await llm.generate('ask_update_details', {
      name: context.cliente_nome,
    }, lang)
    return {
      nextState: 'UPDATE_CLIENT_INFO',
      response,
      contextUpdates: { update_request: null },
    }
  }

  const result = await services.updateLead(context.cliente_id, updates)

  // Reflect changes in context
  const contextUpdates: Record<string, any> = { update_request: null }
  if (updates.nome) contextUpdates.cliente_nome = updates.nome
  if (updates.endereco_completo) contextUpdates.cliente_endereco = updates.endereco_completo
  if (updates.email) contextUpdates.cliente_email = updates.email
  if (updates.zip_code) contextUpdates.cliente_zip = updates.zip_code

  const response = await llm.generate('info_updated', {
    name: contextUpdates.cliente_nome ?? context.cliente_nome,
    fields: result.updated_fields.join(', '),
  }, lang)

  return {
    nextState: 'DETECT_INTENT',
    response,
    contextUpdates,
  }
}

/**
 * DONE: The conversation has concluded. If the user sends another message,
 * classify the intent and route them back into the flow, or say goodbye.
 */
export const handleDone: StateHandler = async (message, context, _services, llm) => {
  const lang = context.language

  if (!message) {
    // Silent entry — just say goodbye
    const response = await llm.generate('goodbye', {
      name: context.cliente_nome,
    }, lang)
    return {
      nextState: 'DONE',
      response,
    }
  }

  // User is still talking — check if they need something else
  const intent = await llm.classifyIntent(message, [
    'schedule',
    'cancel',
    'reschedule',
    'faq',
    'callback',
    'update_info',
    'price_inquiry',
    'greeting',
    'off_topic',
    'unknown',
  ])

  // Route based on intent (mirroring DETECT_INTENT logic, because silent
  // transitions pass an empty message so DETECT_INTENT couldn't re-classify)
  switch (intent) {
    case 'schedule': {
      if (context.is_returning && context.cliente_endereco) {
        return { nextState: 'CONFIRM_ADDRESS', response: '', silent: true }
      }
      return { nextState: 'ASK_DATE', response: '', silent: true }
    }
    case 'cancel':
      return {
        nextState: 'SHOW_APPOINTMENTS', response: '', silent: true,
        contextUpdates: { intent_flow: 'cancel' },
      }
    case 'reschedule':
      return {
        nextState: 'SHOW_APPOINTMENTS', response: '', silent: true,
        contextUpdates: { intent_flow: 'reschedule' },
      }
    case 'faq':
      return {
        nextState: 'FAQ_RESPONSE', response: '', silent: true,
        contextUpdates: { faq_question: message },
      }
    case 'callback':
      return { nextState: 'ASK_CALLBACK_TIME', response: '', silent: true }
    case 'update_info':
      return {
        nextState: 'UPDATE_CLIENT_INFO', response: '', silent: true,
        contextUpdates: { update_request: message },
      }
    case 'price_inquiry':
      return { nextState: 'DEFLECT_PRICE', response: '', silent: true }
    default:
      break
  }

  // Just a farewell or off-topic
  const response = await llm.generate('goodbye', {
    name: context.cliente_nome,
  }, lang)

  return {
    nextState: 'DONE',
    response,
  }
}

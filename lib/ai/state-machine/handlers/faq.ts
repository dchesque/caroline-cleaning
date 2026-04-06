// lib/ai/state-machine/handlers/faq.ts

import type { StateHandler } from '../types'

/**
 * FAQ_RESPONSE: Answer a FAQ using llm.generateFaq() with business info.
 * After answering, return to DETECT_INTENT for the next user request.
 */
export const handleFaqResponse: StateHandler = async (_message, context, services, llm) => {
  const question = context.faq_question ?? _message ?? ''
  const businessInfo = await services.getBusinessInfo()

  const response = await llm.generateFaq(question, {
    business_name: businessInfo.name,
    phone: businessInfo.phone,
    email: businessInfo.email,
    hours: businessInfo.hours,
    customer_name: context.cliente_nome,
    language: context.language,
  })

  const followUp = context.language === 'pt'
    ? '\n\nPosso ajudar com mais alguma coisa?'
    : '\n\nIs there anything else I can help you with?'

  return {
    nextState: 'DETECT_INTENT',
    response: response + followUp,
    contextUpdates: {
      faq_question: null,
    },
  }
}

/**
 * DEFLECT_PRICE: Explain the free first visit model and deflect direct pricing questions.
 */
export const handleDeflectPrice: StateHandler = async (_message, context, services, llm) => {
  const businessInfo = await services.getBusinessInfo()

  const response = await llm.generate('deflect_price', {
    name: context.cliente_nome,
    business_name: businessInfo.name,
    phone: businessInfo.phone,
  }, context.language)

  return {
    nextState: 'DETECT_INTENT',
    response,
  }
}

/**
 * SAVE_PET_INFO: Extract pet details from the user's message and update customer record.
 * Returns to the previous state so the flow continues where it left off.
 */
export const handleSavePetInfo: StateHandler = async (message, context, services, llm) => {
  const lang = context.language

  if (!message) {
    const response = await llm.generate('ask_pet_info', {
      name: context.cliente_nome,
    }, lang)
    return {
      nextState: 'SAVE_PET_INFO',
      response,
    }
  }

  const extracted = await llm.extract('preference', message, { type: 'pet_info' })
  const petDetails = extracted?.value ?? extracted?.pets ?? message.trim()

  // Update customer record if we have a client_id
  if (context.cliente_id) {
    await services.updateLead(context.cliente_id, {
      tem_pets: 'true',
      pets_detalhes: petDetails,
    })
  }

  const response = await llm.generate('pet_info_saved', {
    name: context.cliente_nome,
    pets: petDetails,
  }, lang)

  // Return to the previous state
  const returnState = (context.previousState as any) ?? 'DETECT_INTENT'

  return {
    nextState: returnState,
    response,
    contextUpdates: {
      pets_info: petDetails,
    },
  }
}

/**
 * SAVE_ALLERGY_INFO: Extract allergy details from the user's message and update customer record.
 * Returns to the previous state so the flow continues where it left off.
 */
export const handleSaveAllergyInfo: StateHandler = async (message, context, services, llm) => {
  const lang = context.language

  if (!message) {
    const response = await llm.generate('ask_allergy_info', {
      name: context.cliente_nome,
    }, lang)
    return {
      nextState: 'SAVE_ALLERGY_INFO',
      response,
    }
  }

  const extracted = await llm.extract('preference', message, { type: 'allergy_info' })
  const allergyDetails = extracted?.value ?? extracted?.allergies ?? message.trim()

  // Update customer record if we have a client_id
  if (context.cliente_id) {
    await services.updateLead(context.cliente_id, {
      notas: `Allergies: ${allergyDetails}`,
    })
  }

  const response = await llm.generate('allergy_info_saved', {
    name: context.cliente_nome,
    allergies: allergyDetails,
  }, lang)

  // Return to the previous state
  const returnState = (context.previousState as any) ?? 'DETECT_INTENT'

  return {
    nextState: returnState,
    response,
    contextUpdates: {
      allergy_info: allergyDetails,
    },
  }
}

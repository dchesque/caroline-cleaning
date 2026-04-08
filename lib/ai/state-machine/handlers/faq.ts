// lib/ai/state-machine/handlers/faq.ts

import type { StateHandler } from '../types'
import { logger } from '@/lib/logger'

/**
 * FAQ_RESPONSE: Answer a FAQ using llm.generateFaq() with business info.
 * After answering, return to DETECT_INTENT for the next user request.
 */
export const handleFaqResponse: StateHandler = async (_message, context, services, llm) => {
  const question = context.faq_question ?? _message ?? ''
  const businessInfo = await services.getBusinessInfo()

  const response = await llm.generateFaq(question, {
    businessInfo,
    sessionContext: context,
  })

  return {
    nextState: 'DETECT_INTENT',
    response: response + '\n\nIs there anything else I can help you with?',
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
  })

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
  if (!message) {
    const response = await llm.generate('ask_pet_info', {
      name: context.cliente_nome,
    })
    return {
      nextState: 'SAVE_PET_INFO',
      response,
    }
  }

  const extracted = await llm.extract('pet_info', message)
  const petDetails = extracted?.pets ?? extracted?.details ?? message.trim()

  // Update customer record if we have a client_id
  if (context.cliente_id) {
    try {
      await services.updateLead(context.cliente_id, {
        tem_pets: 'true',
        pets_detalhes: petDetails,
      })
    } catch (err) {
      logger.error('[faq] Failed to save pet info', { error: err instanceof Error ? err.message : String(err) })
      return {
        nextState: 'DETECT_INTENT',
        response: 'There was an issue saving the information. Please try again later.',
      }
    }
  }

  const response = await llm.generate('pet_info_saved', {
    name: context.cliente_nome,
    pets: petDetails,
  })

  // Return to the previous state, with fallback and self-loop prevention
  let returnState = context.previousState ?? 'DETECT_INTENT'
  if (returnState === 'SAVE_PET_INFO') {
    returnState = 'DETECT_INTENT'
  }

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
  if (!message) {
    const response = await llm.generate('ask_allergy_info', {
      name: context.cliente_nome,
    })
    return {
      nextState: 'SAVE_ALLERGY_INFO',
      response,
    }
  }

  const extracted = await llm.extract('allergy_info', message)
  const allergyDetails = extracted?.allergies ?? extracted?.details ?? message.trim()

  // Update customer record if we have a client_id
  if (context.cliente_id) {
    try {
      await services.updateLead(context.cliente_id, {
        notas: `Allergies: ${allergyDetails}`,
      })
    } catch (err) {
      logger.error('[faq] Failed to save allergy info', { error: err instanceof Error ? err.message : String(err) })
      return {
        nextState: 'DETECT_INTENT',
        response: 'There was an issue saving the information. Please try again later.',
      }
    }
  }

  const response = await llm.generate('allergy_info_saved', {
    name: context.cliente_nome,
    allergies: allergyDetails,
  })

  // Return to the previous state, with fallback and self-loop prevention
  let returnState = context.previousState ?? 'DETECT_INTENT'
  if (returnState === 'SAVE_ALLERGY_INFO') {
    returnState = 'DETECT_INTENT'
  }

  return {
    nextState: returnState,
    response,
    contextUpdates: {
      allergy_info: allergyDetails,
    },
  }
}

// lib/ai/state-machine/handlers/callback.ts

import type { StateHandler } from '../types'

/**
 * ASK_CALLBACK_TIME: Ask the user when they'd like to receive a callback.
 */
export const handleAskCallbackTime: StateHandler = async (_message, context, _services, llm) => {
  const response = await llm.generate('ask_callback_time', {
    name: context.cliente_nome,
  }, context.language)

  return {
    nextState: 'SCHEDULE_CALLBACK',
    response,
  }
}

/**
 * SCHEDULE_CALLBACK: Extract the preferred callback time and schedule it.
 */
export const handleScheduleCallback: StateHandler = async (message, context, services, llm) => {
  const lang = context.language

  const extracted = await llm.extract('time', message)
  const rawTime = extracted?.time ?? extracted?.value;
  const timePattern = /^\d{1,2}[:\s]?\d{0,2}\s*(am|pm|h|hrs?)?$/i;
  const preferredTime = rawTime && timePattern.test(rawTime.trim())
    ? rawTime.trim()
    : null;

  if (!preferredTime) {
    const lang = context.language;
    return {
      nextState: 'ASK_CALLBACK_TIME',
      response: lang === 'pt'
        ? 'Não consegui entender o horário. Pode informar no formato HH:MM? (ex: 14:00)'
        : "I couldn't understand the time. Can you provide it in HH:MM format? (e.g., 2:00 PM)",
      contextUpdates: { _callback_retries: (context._callback_retries || 0) + 1 },
    };
  }

  if (!context.cliente_telefone) {
    const response = await llm.generate('callback_need_phone', {}, lang)
    return {
      nextState: 'COLLECT_PHONE',
      response,
    }
  }

  let result
  try {
    result = await services.scheduleCallback({
      client_id: context.cliente_id,
      phone: context.cliente_telefone,
      preferred_time: preferredTime,
      notes: `Callback requested via chat. Language: ${lang}`,
    })

    if (result.status === 'error') {
      return {
        nextState: 'DETECT_INTENT',
        response: await llm.generate('callback_error', { name: context.cliente_nome }, lang),
      }
    }
  } catch {
    return {
      nextState: 'DETECT_INTENT',
      response: await llm.generate('callback_error', { name: context.cliente_nome }, lang),
    }
  }

  if (result.status === 'scheduled') {
    const response = await llm.generate('callback_scheduled', {
      name: context.cliente_nome,
      time: preferredTime,
    }, lang)

    return {
      nextState: 'DONE',
      response,
    }
  }

  // Error scheduling
  const response = await llm.generate('callback_error', {
    name: context.cliente_nome,
  }, lang)

  return {
    nextState: 'DETECT_INTENT',
    response,
  }
}

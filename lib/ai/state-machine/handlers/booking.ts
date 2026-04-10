// lib/ai/state-machine/handlers/booking.ts

import type { StateHandler } from '../types'
import { isFutureDate, isSunday, getDurationForService } from '../validators'

const MAX_COLLECTION_RETRIES = 5

/**
 * CONFIRM_ADDRESS: Show the customer's current address and ask if it's still correct.
 */
export const handleConfirmAddress: StateHandler = async (message, context, _services, llm) => {
  // First visit (silent entry): show address and ask for confirmation
  if (!message) {
    const response = await llm.generate('confirm_address', {
      address: context.cliente_endereco,
      name: context.cliente_nome,
    })

    return {
      nextState: 'CONFIRM_ADDRESS',
      response,
    }
  }

  // User responded: classify yes/no
  const intent = await llm.classifyIntent(message, ['yes', 'no'])

  if (intent === 'yes') {
    return {
      nextState: 'ASK_SERVICE_TYPE',
      response: '',
      silent: true,
    }
  }

  // User said no — go back to collect a new address
  const response = await llm.generate('ask_address_again', {
    name: context.cliente_nome,
  })

  return {
    nextState: 'NEW_CUSTOMER_ADDRESS',
    response,
    contextUpdates: { cliente_endereco: null },
  }
}

/**
 * ASK_SERVICE_TYPE: Ask which service type (regular / deep / move_in_out).
 * If the user already stated one, extract and proceed.
 */
export const handleAskServiceType: StateHandler = async (message, context, _services, llm) => {
  if (!message) {
    // Silent entry — ask for service type
    const response = await llm.generate('ask_service_type', {
      name: context.cliente_nome,
    })
    return {
      nextState: 'ASK_SERVICE_TYPE',
      response,
    }
  }

  const extracted = await llm.extract('service_type', message)
  const serviceType = extracted?.service_type ?? extracted?.value ?? null

  if (!serviceType) {
    const retries = (context.retry_count || 0) + 1

    if (retries >= MAX_COLLECTION_RETRIES) {
      const response = await llm.generate('ask_service_type', { name: context.cliente_nome })
      return {
        nextState: 'ASK_CALLBACK_TIME',
        response: response + "\n\nI'm having trouble understanding. Would you like someone to call you back?",
        contextUpdates: { retry_count: 0 },
      }
    }

    const response = await llm.generate('ask_service_type', { name: context.cliente_nome })
    return {
      nextState: 'ASK_SERVICE_TYPE',
      response,
      contextUpdates: { retry_count: retries },
    }
  }

  const duration = getDurationForService(serviceType)

  // Visit appointments skip add-ons (it's an evaluation, not a full service)
  const nextAfterService = serviceType === 'visit' ? 'ASK_DATE' : 'ASK_ADDONS'

  return {
    nextState: nextAfterService,
    response: '',
    silent: true,
    contextUpdates: {
      service_type: serviceType,
      duration_minutes: duration,
      selected_addons: [],
    },
  }
}

/**
 * ASK_ADDONS: Ask if the customer wants any additional services.
 * Lists active add-ons from DB. Calculates total duration including add-on minutes.
 */
export const handleAskAddons: StateHandler = async (message, context, services, llm) => {
  const addons = await services.getAddons()

  // No add-ons configured — skip straight to ASK_DATE
  if (!addons.length) {
    return {
      nextState: 'ASK_DATE',
      response: '',
      silent: true,
      contextUpdates: { selected_addons: [] },
    }
  }

  const addonsList = addons.map(a => `• ${a.nome}${a.descricao ? ` — ${a.descricao}` : ''}`).join('\n')

  // Silent/empty entry — show add-ons menu
  if (!message || !message.trim()) {
    const response = await llm.generate('ask_addons', {
      addons_list: addonsList,
      service_type: context.service_type,
    })
    return { nextState: 'ASK_ADDONS', response }
  }

  // User responded — extract which add-ons they want
  const addonsListJson = JSON.stringify(addons.map(a => ({ codigo: a.codigo, nome: a.nome })))
  const extracted = await llm.extract('addons_selection', message, { addons_list: addonsListJson })
  const selectedCodigos: string[] = extracted?.selected_codigos ?? []

  const selectedAddons = addons.filter(a => selectedCodigos.includes(a.codigo))
  const extraMinutes = selectedAddons.reduce((sum, a) => sum + a.minutos_adicionais, 0)
  const baseMinutes = getDurationForService(context.service_type ?? 'regular')

  return {
    nextState: 'ASK_DATE',
    response: '',
    silent: true,
    contextUpdates: {
      selected_addons: selectedAddons,
      duration_minutes: baseMinutes + extraMinutes,
    },
  }
}

/**
 * ASK_DATE: Prompt the user for a preferred date.
 * If a message is already present (e.g. user answered inline after reschedule confirmation),
 * process it immediately so the user never has to send the date twice.
 */
export const handleAskDate: StateHandler = async (message, context, services, llm) => {
  // If we don't have a service type yet, try to extract it from the current
  // message first — otherwise we'd throw away whatever the user just said
  // (e.g. "regular cleaning") and force them to repeat it.
  if (!context.service_type) {
    if (message && message.trim()) {
      const extracted = await llm.extract('service_type', message)
      const serviceType = extracted?.service_type ?? extracted?.value ?? null
      if (serviceType) {
        // Delegate to the service-type handler by updating context and
        // continuing the booking chain. Use a silent transition so the next
        // handler (ASK_ADDONS or ASK_DATE for visits) runs immediately.
        const duration = getDurationForService(serviceType)
        const nextAfterService = serviceType === 'visit' ? 'ASK_DATE' : 'ASK_ADDONS'
        return {
          nextState: nextAfterService,
          response: '',
          silent: true,
          contextUpdates: {
            service_type: serviceType,
            duration_minutes: duration,
            selected_addons: [],
          },
        }
      }
    }

    // No service_type in the message — fall back to asking explicitly.
    const response = await llm.generate('ask_service_type', {
      name: context.cliente_nome,
    })
    return {
      nextState: 'ASK_SERVICE_TYPE',
      response,
    }
  }

  // If the user already supplied a date in this message, try to extract and validate it
  if (message && message.trim()) {
    const extracted = await llm.extract('date', message)
    const dateStr = extracted?.date ?? extracted?.value ?? null

    if (dateStr && isFutureDate(dateStr) && !isSunday(dateStr)) {
      // Valid date provided inline — skip the prompt and go straight to availability check
      return {
        nextState: 'CHECK_AVAILABILITY',
        response: '',
        silent: true,
        contextUpdates: { selected_date: dateStr, retry_count: 0 },
      }
    }
    // Date missing or invalid — fall through and ask for it
  }

  // No message (silent entry) or unparseable input — ask for date
  const response = await llm.generate('ask_date', {
    name: context.cliente_nome,
    service_type: context.service_type,
  })

  return {
    nextState: 'COLLECT_DATE',
    response,
  }
}

/**
 * COLLECT_DATE: Extract and validate the date from user input.
 * Must be in the future and not a Sunday.
 */
export const handleCollectDate: StateHandler = async (message, context, _services, llm) => {
  const extracted = await llm.extract('date', message)
  const dateStr = extracted?.date ?? extracted?.value ?? null

  const dateRetries = (context.retry_count || 0) + 1

  if (!dateStr) {
    if (dateRetries >= MAX_COLLECTION_RETRIES) {
      return {
        nextState: 'ASK_CALLBACK_TIME',
        response: "I'm having trouble understanding the date. Would you like someone to call you back?",
        contextUpdates: { retry_count: 0 },
      }
    }
    const response = await llm.generate('invalid_date', {})
    return { nextState: 'COLLECT_DATE', response, contextUpdates: { retry_count: dateRetries } }
  }

  if (!isFutureDate(dateStr)) {
    if (dateRetries >= MAX_COLLECTION_RETRIES) {
      return {
        nextState: 'ASK_CALLBACK_TIME',
        response: "I'm having trouble understanding the date. Would you like someone to call you back?",
        contextUpdates: { retry_count: 0 },
      }
    }
    const response = await llm.generate('date_in_past', {})
    return { nextState: 'COLLECT_DATE', response, contextUpdates: { retry_count: dateRetries } }
  }

  if (isSunday(dateStr)) {
    if (dateRetries >= MAX_COLLECTION_RETRIES) {
      return {
        nextState: 'ASK_CALLBACK_TIME',
        response: "I'm having trouble understanding the date. Would you like someone to call you back?",
        contextUpdates: { retry_count: 0 },
      }
    }
    const response = await llm.generate('date_is_sunday', {})
    return { nextState: 'COLLECT_DATE', response, contextUpdates: { retry_count: dateRetries } }
  }

  return {
    nextState: 'CHECK_AVAILABILITY',
    response: '',
    silent: true,
    contextUpdates: {
      selected_date: dateStr,
    },
  }
}

/**
 * CHECK_AVAILABILITY: Query available slots for the selected date. Silent handler.
 */
export const handleCheckAvailability: StateHandler = async (_message, context, services, _llm) => {
  const date = context.selected_date
  const duration = context.duration_minutes ?? getDurationForService(context.service_type ?? 'regular')

  if (!date) {
    return {
      nextState: 'COLLECT_DATE',
      response: 'I need a date first. What day works for you?',
    }
  }

  let result
  try {
    result = await services.getAvailableSlots(date, duration)
  } catch {
    return {
      nextState: 'COLLECT_DATE',
      response: "I had trouble checking availability. Let's try a different date — what day works for you?",
    }
  }

  if (result.slots.length > 0) {
    return {
      nextState: 'COLLECT_TIME',
      response: '',
      silent: true,
      contextUpdates: {
        available_slots: result.slots,
        duration_minutes: duration,
      },
    }
  }

  // No slots on this date
  return {
    nextState: 'NO_SLOTS',
    response: '',
    silent: true,
  }
}

/**
 * NO_SLOTS: No availability on the chosen date. Show alternatives from the next 7 days.
 */
export const handleNoSlots: StateHandler = async (_message, context, services, llm) => {
  const date = context.selected_date ?? new Date().toISOString().slice(0, 10)
  const duration = context.duration_minutes ?? getDurationForService(context.service_type ?? 'regular')

  let result
  try {
    result = await services.getAvailableSlotsMultiDay(date, 7, duration)
  } catch {
    const response = await llm.generate('no_slots_at_all', { name: context.cliente_nome })
    return { nextState: 'COLLECT_DATE', response }
  }

  if (result.total_available === 0) {
    const response = await llm.generate('no_slots_at_all', {
      name: context.cliente_nome,
    })
    return {
      nextState: 'COLLECT_DATE',
      response,
    }
  }

  const alternatives = result.days.map(day => {
    const dayLabel = day.day_name_en
    const slotCount = day.slots.length
    const firstSlots = day.slots.slice(0, 3).map((s: any) => s.time).join(', ')
    return `${dayLabel} (${day.date}): ${slotCount} slot(s) — e.g. ${firstSlots}`
  }).join('\n')

  const response = await llm.generate('no_slots_alternatives', {
    date: context.selected_date,
    alternatives,
    name: context.cliente_nome,
  })

  return {
    nextState: 'COLLECT_DATE',
    response,
  }
}

/**
 * COLLECT_TIME: Extract a time from the user's message and validate it's among available slots.
 */
export const handleCollectTime: StateHandler = async (message, context, _services, llm) => {
  const slots = context.available_slots ?? []

  if (!message) {
    // Show available times
    const timeList = slots.map((s: any) => s.time).join(', ')
    const response = await llm.generate('ask_time', {
      date: context.selected_date,
      available_times: timeList,
    })
    return {
      nextState: 'COLLECT_TIME',
      response,
    }
  }

  const extracted = await llm.extract('time', message)
  const timeStr = extracted?.time ?? extracted?.value ?? null

  if (!timeStr) {
    const timeRetries = (context.retry_count || 0) + 1
    const timeList = slots.map((s: any) => s.time).join(', ')

    if (timeRetries >= MAX_COLLECTION_RETRIES) {
      return {
        nextState: 'ASK_CALLBACK_TIME',
        response: "I'm having trouble understanding the time. Would you like someone to call you back?",
        contextUpdates: { retry_count: 0 },
      }
    }

    const response = await llm.generate('invalid_time', { available_times: timeList })
    return { nextState: 'COLLECT_TIME', response, contextUpdates: { retry_count: timeRetries } }
  }

  // Normalize to HH:MM for comparison
  const normalizedTime = timeStr.length === 4 && !timeStr.includes(':')
    ? `${timeStr.slice(0, 2)}:${timeStr.slice(2)}`
    : timeStr

  const isAvailable = slots.some((s: any) => s.time === normalizedTime)

  if (!isAvailable) {
    const unavailRetries = (context.retry_count || 0) + 1
    const timeList = slots.map((s: any) => s.time).join(', ')

    if (unavailRetries >= MAX_COLLECTION_RETRIES) {
      return {
        nextState: 'ASK_CALLBACK_TIME',
        response: "I'm having trouble finding the right time. Would you like someone to call you back?",
        contextUpdates: { retry_count: 0 },
      }
    }

    const response = await llm.generate('time_not_available', {
      time: normalizedTime,
      available_times: timeList,
    })
    return {
      nextState: 'COLLECT_TIME',
      response,
      contextUpdates: { retry_count: unavailRetries },
    }
  }

  return {
    nextState: 'CREATE_BOOKING',
    response: '',
    silent: true,
    contextUpdates: {
      selected_time: normalizedTime,
    },
  }
}

/**
 * CREATE_BOOKING: Call services.createAppointment(). Silent handler.
 * Handles conflict, missing_address, and success outcomes.
 */
export const handleCreateBooking: StateHandler = async (_message, context, services, llm) => {
  if (!context.selected_date || !context.selected_time || !context.cliente_id) {
    return {
      nextState: 'ASK_DATE',
      response: await llm.generate('booking_error', {}),
      contextUpdates: { last_error: 'Missing required booking fields' },
    }
  }

  const result = await services.createAppointment({
    client_id: context.cliente_id,
    service_type: context.service_type ?? 'regular',
    date: context.selected_date,
    time: context.selected_time,
    duration: context.duration_minutes ?? getDurationForService(context.service_type ?? 'regular'),
    addons: context.selected_addons ?? [],
  })

  if (result.status === 'conflict') {
    const suggestedTimes = result.suggested_times?.join(', ') ?? ''
    const response = await llm.generate('booking_conflict', {
      time: context.selected_time,
      suggested_times: suggestedTimes,
    })
    return {
      nextState: 'COLLECT_TIME',
      response,
      contextUpdates: { selected_time: null },
    }
  }

  if (result.status === 'missing_address') {
    const response = await llm.generate('need_address', {
      name: context.cliente_nome,
    })
    return {
      nextState: 'NEW_CUSTOMER_ADDRESS',
      response,
    }
  }

  if (result.status === 'error') {
    const response = await llm.generate('booking_error', {})
    return {
      nextState: 'ASK_DATE',
      response,
      contextUpdates: {
        selected_date: null,
        selected_time: null,
      },
    }
  }

  // Success
  const response = await llm.generate('confirm_summary', {
    name: result.details?.client_name ?? context.cliente_nome,
    service: result.details?.service ?? context.service_type,
    date: result.details?.date ?? context.selected_date,
    time: result.details?.time ?? context.selected_time,
    duration: result.details?.duration ?? context.duration_minutes,
    address: result.details?.address ?? context.cliente_endereco,
    appointment_id: result.appointment_id,
  })

  return {
    nextState: 'CONFIRM_SUMMARY',
    response,
    contextUpdates: {
      booking_id: result.appointment_id ?? null,
      booking_confirmed: true,
    },
  }
}

/**
 * CONFIRM_SUMMARY: Show final booking checklist, ask for confirmation and preference (SMS/WhatsApp).
 * Handle yes / no / correction.
 */
export const handleConfirmSummary: StateHandler = async (message, context, services, llm) => {
  if (!message) {
    // Silent entry — regenerate summary so user sees the confirmation prompt
    const response = await llm.generate('confirm_summary', {
      name: context.cliente_nome,
      phone: context.cliente_telefone,
      address: context.cliente_endereco,
      date: context.selected_date,
      time: context.selected_time,
      service: context.service_type,
    })
    return {
      nextState: 'CONFIRM_SUMMARY',
      response,
    }
  }

  const intent = await llm.classifyIntent(message, ['yes', 'no', 'correction'])

  if (intent === 'yes') {
    // Confirm the appointment
    try {
      if (context.booking_id) {
        await services.confirmAppointment(context.booking_id)
      }
    } catch {
      // Non-critical - booking already created, confirmation is secondary
    }

    // Check if the user already stated their channel preference in the same message
    // e.g. "Yes, WhatsApp please" — avoid forcing them to repeat it
    const prefExtracted = await llm.extract('preference', message)
    const prefValue = prefExtracted?.canal ?? prefExtracted?.preference ?? prefExtracted?.value ?? null
    const normalizedPref = normalizePreference(prefValue)

    if (normalizedPref) {
      return {
        nextState: 'UPDATE_PREFERENCE',
        response: '',
        silent: true,
        contextUpdates: { canal_preferencia: normalizedPref },
      }
    }

    // Ask for communication preference
    const response = await llm.generate('ask_preference', {
      name: context.cliente_nome,
    })

    return {
      nextState: 'COLLECT_PREFERENCE',
      response,
    }
  }

  if (intent === 'correction') {
    // Cancel the created appointment and let them re-book
    try {
      if (context.booking_id) {
        await services.cancelAppointment(context.booking_id, 'User requested correction before confirmation')
      }
    } catch {
      // Non-critical - proceed with correction flow regardless
    }

    const response = await llm.generate('booking_correction', {
      name: context.cliente_nome,
    })

    return {
      nextState: 'ASK_DATE',
      response,
      contextUpdates: {
        booking_id: null,
        booking_confirmed: false,
        selected_date: null,
        selected_time: null,
        available_slots: null,
      },
    }
  }

  // intent === 'no'
  try {
    if (context.booking_id) {
      await services.cancelAppointment(context.booking_id, 'User declined booking')
    }
  } catch {
    // Non-critical - proceed with cancellation flow regardless
  }

  const response = await llm.generate('booking_cancelled_by_user', {
    name: context.cliente_nome,
  })

  return {
    nextState: 'DETECT_INTENT',
    response,
    contextUpdates: {
      booking_id: null,
      booking_confirmed: false,
      selected_date: null,
      selected_time: null,
      available_slots: null,
    },
  }
}

/**
 * COLLECT_PREFERENCE: Extract SMS or WhatsApp preference from the user's response.
 */
export const handleCollectPreference: StateHandler = async (message, context, _services, llm) => {
  const extracted = await llm.extract('preference', message)
  const preference = extracted?.canal ?? extracted?.preference ?? extracted?.value ?? null

  const normalized = normalizePreference(preference)

  if (!normalized) {
    const retries = (context.retry_count || 0) + 1

    if (retries >= MAX_COLLECTION_RETRIES) {
      // Default to SMS and inform user
      return {
        nextState: 'UPDATE_PREFERENCE',
        response: "I'll send the confirmation via SMS, okay? 😊",
        contextUpdates: { canal_preferencia: 'sms', retry_count: 0 },
      }
    }

    const response = await llm.generate('ask_preference_again', {})
    return {
      nextState: 'COLLECT_PREFERENCE',
      response,
      contextUpdates: { retry_count: retries },
    }
  }

  return {
    nextState: 'UPDATE_PREFERENCE',
    response: '',
    silent: true,
    contextUpdates: {
      canal_preferencia: normalized,
    },
  }
}

/**
 * UPDATE_PREFERENCE: Persist the communication preference. Silent handler.
 */
export const handleUpdatePreference: StateHandler = async (_message, context, services, llm) => {
  if (context.cliente_id && context.canal_preferencia) {
    try {
      await services.updateLead(context.cliente_id, {
        canal_preferencia: context.canal_preferencia,
      })
    } catch {
      // Non-critical — preference not saved, but booking is confirmed
    }
  }

  // Also update the appointment record so notification routing is correct
  if (context.booking_id && context.canal_preferencia) {
    try {
      await services.updateAppointmentPreference(context.booking_id, context.canal_preferencia)
    } catch {
      // Non-critical — booking is confirmed regardless
    }
  }

  const response = await llm.generate('done_booking', {
    name: context.cliente_nome,
    preference: context.canal_preferencia,
  })

  return {
    nextState: 'DONE',
    response,
  }
}

// ─────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────

function normalizePreference(value: string | null): 'sms' | 'whatsapp' | null {
  if (!value) return null
  const lower = value.toLowerCase().trim()
  if (lower.includes('whatsapp') || lower.includes('wpp') || lower.includes('whats') || lower.includes('zap')) {
    return 'whatsapp'
  }
  if (lower.includes('sms') || lower.includes('text') || lower.includes('message') || lower.includes('texto')) {
    return 'sms'
  }
  return null
}

// lib/ai/state-machine/handlers/booking.ts

import type { StateHandler } from '../types'
import { isFutureDate, isSunday, getDurationForService } from '../validators'

/**
 * CONFIRM_ADDRESS: Show the customer's current address and ask if it's still correct.
 */
export const handleConfirmAddress: StateHandler = async (_message, context, _services, llm) => {
  const response = await llm.generate('confirm_address', {
    address: context.cliente_endereco,
    name: context.cliente_nome,
  }, context.language)

  return {
    nextState: 'ASK_SERVICE_TYPE',
    response,
  }
}

/**
 * ASK_SERVICE_TYPE: Ask which service type (regular / deep / move_in_out).
 * If the user already stated one, extract and proceed.
 */
export const handleAskServiceType: StateHandler = async (message, context, _services, llm) => {
  const lang = context.language

  if (!message) {
    // Silent entry — ask for service type
    const response = await llm.generate('ask_service_type', {
      name: context.cliente_nome,
    }, lang)
    return {
      nextState: 'ASK_SERVICE_TYPE',
      response,
    }
  }

  const extracted = await llm.extract('service_type', message)
  const serviceType = extracted?.service_type ?? extracted?.value ?? null

  if (!serviceType) {
    const response = await llm.generate('ask_service_type', {
      name: context.cliente_nome,
    }, lang)
    return {
      nextState: 'ASK_SERVICE_TYPE',
      response,
    }
  }

  const duration = getDurationForService(serviceType)

  return {
    nextState: 'ASK_DATE',
    response: '',
    silent: true,
    contextUpdates: {
      service_type: serviceType,
      duration_minutes: duration,
    },
  }
}

/**
 * ASK_DATE: Prompt the user for a preferred date.
 */
export const handleAskDate: StateHandler = async (_message, context, _services, llm) => {
  // If we don't have a service type yet, ask for it first
  if (!context.service_type) {
    const response = await llm.generate('ask_service_type', {
      name: context.cliente_nome,
    }, context.language)
    return {
      nextState: 'ASK_SERVICE_TYPE',
      response,
    }
  }

  const response = await llm.generate('ask_date', {
    name: context.cliente_nome,
    service_type: context.service_type,
  }, context.language)

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
  const lang = context.language

  const extracted = await llm.extract('date', message)
  const dateStr = extracted?.date ?? extracted?.value ?? null

  if (!dateStr) {
    const response = await llm.generate('invalid_date', {}, lang)
    return {
      nextState: 'COLLECT_DATE',
      response,
    }
  }

  if (!isFutureDate(dateStr)) {
    const response = await llm.generate('date_in_past', {}, lang)
    return {
      nextState: 'COLLECT_DATE',
      response,
    }
  }

  if (isSunday(dateStr)) {
    const response = await llm.generate('date_is_sunday', {}, lang)
    return {
      nextState: 'COLLECT_DATE',
      response,
    }
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

  const result = await services.getAvailableSlots(date, duration)

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
  const lang = context.language
  const date = context.selected_date ?? new Date().toISOString().slice(0, 10)
  const duration = context.duration_minutes ?? getDurationForService(context.service_type ?? 'regular')

  const result = await services.getAvailableSlotsMultiDay(date, 7, duration)

  if (result.total_available === 0) {
    const response = await llm.generate('no_slots_at_all', {
      name: context.cliente_nome,
    }, lang)
    return {
      nextState: 'COLLECT_DATE',
      response,
    }
  }

  const alternatives = result.days.map(day => {
    const dayLabel = lang === 'pt' ? day.day_name : day.day_name_en
    const slotCount = day.slots.length
    const firstSlots = day.slots.slice(0, 3).map(s => s.time).join(', ')
    return `${dayLabel} (${day.date}): ${slotCount} slot(s) — e.g. ${firstSlots}`
  }).join('\n')

  const response = await llm.generate('no_slots_alternatives', {
    date: context.selected_date,
    alternatives,
    name: context.cliente_nome,
  }, lang)

  return {
    nextState: 'COLLECT_DATE',
    response,
  }
}

/**
 * COLLECT_TIME: Extract a time from the user's message and validate it's among available slots.
 */
export const handleCollectTime: StateHandler = async (message, context, _services, llm) => {
  const lang = context.language
  const slots = context.available_slots ?? []

  if (!message) {
    // Show available times
    const timeList = slots.map(s => s.time).join(', ')
    const response = await llm.generate('ask_time', {
      date: context.selected_date,
      available_times: timeList,
    }, lang)
    return {
      nextState: 'COLLECT_TIME',
      response,
    }
  }

  const extracted = await llm.extract('time', message)
  const timeStr = extracted?.time ?? extracted?.value ?? null

  if (!timeStr) {
    const timeList = slots.map(s => s.time).join(', ')
    const response = await llm.generate('invalid_time', {
      available_times: timeList,
    }, lang)
    return {
      nextState: 'COLLECT_TIME',
      response,
    }
  }

  // Normalize to HH:MM for comparison
  const normalizedTime = timeStr.length === 4 && !timeStr.includes(':')
    ? `${timeStr.slice(0, 2)}:${timeStr.slice(2)}`
    : timeStr

  const isAvailable = slots.some(s => s.time === normalizedTime)

  if (!isAvailable) {
    const timeList = slots.map(s => s.time).join(', ')
    const response = await llm.generate('time_not_available', {
      time: normalizedTime,
      available_times: timeList,
    }, lang)
    return {
      nextState: 'COLLECT_TIME',
      response,
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
  const lang = context.language

  if (!context.cliente_id) {
    return {
      nextState: 'COLLECT_PHONE',
      response: 'I need to identify you first. Could you share your phone number?',
    }
  }

  const result = await services.createAppointment({
    client_id: context.cliente_id,
    service_type: context.service_type ?? 'regular',
    date: context.selected_date!,
    time: context.selected_time!,
    duration: context.duration_minutes ?? getDurationForService(context.service_type ?? 'regular'),
  })

  if (result.status === 'conflict') {
    const suggestedTimes = result.suggested_times?.join(', ') ?? ''
    const response = await llm.generate('booking_conflict', {
      time: context.selected_time,
      suggested_times: suggestedTimes,
    }, lang)
    return {
      nextState: 'COLLECT_TIME',
      response,
      contextUpdates: { selected_time: null },
    }
  }

  if (result.status === 'missing_address') {
    const response = await llm.generate('need_address', {
      name: context.cliente_nome,
    }, lang)
    return {
      nextState: 'NEW_CUSTOMER_ADDRESS',
      response,
    }
  }

  if (result.status === 'error') {
    const response = await llm.generate('booking_error', {}, lang)
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
  }, lang)

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
  const lang = context.language

  if (!message) {
    // Just shown the summary, waiting for response
    return {
      nextState: 'CONFIRM_SUMMARY',
      response: '',
    }
  }

  const intent = await llm.classifyIntent(message, ['yes', 'no', 'correction'])

  if (intent === 'yes') {
    // Confirm the appointment
    if (context.booking_id) {
      await services.confirmAppointment(context.booking_id)
    }

    // Ask for communication preference
    const response = await llm.generate('ask_preference', {
      name: context.cliente_nome,
    }, lang)

    return {
      nextState: 'COLLECT_PREFERENCE',
      response,
    }
  }

  if (intent === 'correction') {
    // Cancel the created appointment and let them re-book
    if (context.booking_id) {
      await services.cancelAppointment(context.booking_id, 'User requested correction before confirmation')
    }

    const response = await llm.generate('booking_correction', {
      name: context.cliente_nome,
    }, lang)

    return {
      nextState: 'ASK_DATE',
      response,
      contextUpdates: {
        booking_id: null,
        booking_confirmed: false,
        selected_date: null,
        selected_time: null,
      },
    }
  }

  // intent === 'no'
  if (context.booking_id) {
    await services.cancelAppointment(context.booking_id, 'User declined booking')
  }

  const response = await llm.generate('booking_cancelled_by_user', {
    name: context.cliente_nome,
  }, lang)

  return {
    nextState: 'DETECT_INTENT',
    response,
    contextUpdates: {
      booking_id: null,
      booking_confirmed: false,
      selected_date: null,
      selected_time: null,
    },
  }
}

/**
 * COLLECT_PREFERENCE: Extract SMS or WhatsApp preference from the user's response.
 */
export const handleCollectPreference: StateHandler = async (message, context, _services, llm) => {
  const extracted = await llm.extract('preference', message)
  const preference = extracted?.preference ?? extracted?.value ?? null

  const normalized = normalizePreference(preference)

  if (!normalized) {
    const response = await llm.generate('ask_preference_again', {}, context.language)
    return {
      nextState: 'COLLECT_PREFERENCE',
      response,
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
    await services.updateLead(context.cliente_id, {
      canal_preferencia: context.canal_preferencia,
    })
  }

  const response = await llm.generate('done_booking', {
    name: context.cliente_nome,
    preference: context.canal_preferencia,
  }, context.language)

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

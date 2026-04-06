// lib/ai/state-machine/handlers/cancel.ts

import type { StateHandler } from '../types'

/**
 * SHOW_APPOINTMENTS: Fetch future appointments and display a numbered list.
 * Silent entry — generates the list and waits for selection.
 */
export const handleShowAppointments: StateHandler = async (_message, context, services, llm) => {
  const lang = context.language

  if (!context.cliente_id) {
    const response = await llm.generate('no_client_id', {}, lang)
    return {
      nextState: 'COLLECT_PHONE',
      response,
    }
  }

  const history = await services.getClientHistory(context.cliente_id)

  // Filter to future appointments that are not cancelled/completed
  const now = new Date().toISOString().slice(0, 10)
  const futureAppointments = history.appointments.filter(
    a => a.date >= now && !['cancelado', 'concluido', 'reagendado'].includes(a.status)
  )

  if (futureAppointments.length === 0) {
    const response = await llm.generate('no_upcoming_appointments', {
      name: context.cliente_nome,
    }, lang)
    return {
      nextState: 'DETECT_INTENT',
      response,
    }
  }

  // Build numbered list
  const list = futureAppointments.map((a, i) => {
    return `${i + 1}. ${a.date} at ${a.time} — ${a.service_type} (${a.status})`
  }).join('\n')

  const flowLabel = context.intent_flow === 'reschedule' ? 'reschedule' : 'cancel'

  const response = await llm.generate('show_appointments', {
    name: context.cliente_nome,
    list,
    action: flowLabel,
    count: futureAppointments.length,
  }, lang)

  return {
    nextState: 'SELECT_APPOINTMENT',
    response,
    contextUpdates: {
      appointments: futureAppointments,
    },
  }
}

/**
 * SELECT_APPOINTMENT: Identify which appointment the user selected.
 * Routes to CONFIRM_CANCEL or CONFIRM_RESCHEDULE based on intent_flow.
 */
export const handleSelectAppointment: StateHandler = async (message, context, _services, llm) => {
  const lang = context.language
  const appointments = context.appointments ?? []

  if (appointments.length === 0) {
    return {
      nextState: 'DETECT_INTENT',
      response: await llm.generate('no_upcoming_appointments', { name: context.cliente_nome }, lang),
    }
  }

  const extracted = await llm.extract('appointment_selection', message, {
    appointments: appointments.map((a: any, i: number) => ({
      number: i + 1,
      id: a.id,
      date: a.date,
      time: a.time,
      service_type: a.service_type,
    })),
  })

  let selectedId: string | null = null

  // Try to match by extracted number or id
  if (extracted?.number) {
    const idx = parseInt(String(extracted.number), 10) - 1
    if (idx >= 0 && idx < appointments.length) {
      selectedId = appointments[idx].id
    }
  } else if (extracted?.id) {
    selectedId = extracted.id
  } else if (extracted?.appointment_id) {
    selectedId = extracted.appointment_id
  }

  // Fallback: try parsing a simple number from the message
  if (!selectedId) {
    const numMatch = message.trim().match(/^(\d+)$/)
    if (numMatch) {
      const idx = parseInt(numMatch[1], 10) - 1
      if (idx >= 0 && idx < appointments.length) {
        selectedId = appointments[idx].id
      }
    }
  }

  if (!selectedId) {
    const response = await llm.generate('invalid_selection', {
      count: appointments.length,
    }, lang)
    return {
      nextState: 'SELECT_APPOINTMENT',
      response,
    }
  }

  const flow = context.intent_flow ?? 'cancel'

  if (flow === 'reschedule') {
    return {
      nextState: 'CONFIRM_RESCHEDULE',
      response: '',
      silent: true,
      contextUpdates: {
        target_appointment_id: selectedId,
      },
    }
  }

  return {
    nextState: 'CONFIRM_CANCEL',
    response: '',
    silent: true,
    contextUpdates: {
      target_appointment_id: selectedId,
    },
  }
}

/**
 * CONFIRM_CANCEL: Ask the user to confirm cancellation, then process yes/no.
 * On silent entry (no message), shows the confirmation prompt.
 * On user response, processes yes/no.
 */
export const handleConfirmCancelResponse: StateHandler = async (message, context, services, llm) => {
  const lang = context.language

  if (!message) {
    // Silent entry — show the confirmation prompt
    const appointment = (context.appointments ?? []).find(
      (a: any) => a.id === context.target_appointment_id
    )

    const response = await llm.generate('confirm_cancel', {
      name: context.cliente_nome,
      date: appointment?.date ?? 'unknown',
      time: appointment?.time ?? 'unknown',
      service_type: appointment?.service_type ?? 'cleaning',
    }, lang)

    return {
      nextState: 'CONFIRM_CANCEL',
      response,
    }
  }

  const intent = await llm.classifyIntent(message, ['yes', 'no'])

  if (intent === 'yes') {
    return {
      nextState: 'CANCEL_APPOINTMENT',
      response: '',
      silent: true,
    }
  }

  // User said no — go back to intent detection
  const response = await llm.generate('cancel_aborted', {
    name: context.cliente_nome,
  }, lang)

  return {
    nextState: 'DETECT_INTENT',
    response,
    contextUpdates: {
      target_appointment_id: null,
    },
  }
}

/**
 * CANCEL_APPOINTMENT: Execute the cancellation. Silent handler.
 */
export const handleCancelAppointment: StateHandler = async (_message, context, services, llm) => {
  const lang = context.language
  const appointmentId = context.target_appointment_id

  if (!appointmentId) {
    return {
      nextState: 'DETECT_INTENT',
      response: await llm.generate('cancel_error', {}, lang),
    }
  }

  const result = await services.cancelAppointment(appointmentId)

  if (result.status === 'cancelled') {
    const response = await llm.generate('cancel_success', {
      name: context.cliente_nome,
      appointment_id: appointmentId,
    }, lang)

    return {
      nextState: 'DONE',
      response,
      contextUpdates: {
        target_appointment_id: null,
      },
    }
  }

  const response = await llm.generate('cancel_error', {}, lang)
  return {
    nextState: 'DETECT_INTENT',
    response,
    contextUpdates: {
      target_appointment_id: null,
    },
  }
}

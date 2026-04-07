// lib/ai/state-machine/handlers/reschedule.ts

import type { StateHandler } from '../types'

/**
 * CONFIRM_RESCHEDULE: Confirm that the user wants to reschedule the selected appointment.
 * If yes → cancel the old appointment and go to ASK_DATE for a new one.
 * If no → return to DETECT_INTENT.
 */
export const handleConfirmReschedule: StateHandler = async (message, context, services, llm) => {
  const lang = context.language

  if (!message) {
    // Silent entry — show the reschedule confirmation prompt
    const appointment = (context.appointments ?? []).find(
      (a: any) => a.id === context.target_appointment_id
    )

    const response = await llm.generate('confirm_reschedule', {
      name: context.cliente_nome,
      date: appointment?.date ?? 'unknown',
      time: appointment?.time ?? 'unknown',
      service_type: appointment?.service_type ?? 'cleaning',
    }, lang)

    return {
      nextState: 'CONFIRM_RESCHEDULE',
      response,
    }
  }

  const intent = await llm.classifyIntent(message, ['yes', 'no'])

  if (intent === 'yes') {
    // Cancel the old appointment first
    const appointmentId = context.target_appointment_id
    if (appointmentId) {
      try {
        await services.cancelAppointment(appointmentId, 'Rescheduled via chat')
      } catch (cancelError) {
        console.error('[reschedule] Failed to cancel old appointment:', cancelError);
        return {
          nextState: 'DONE',
          response: lang === 'pt'
            ? 'Houve um problema ao cancelar o agendamento anterior. Por favor, entre em contato conosco diretamente.'
            : 'There was an issue cancelling the previous appointment. Please contact us directly.',
        };
      }
    }

    // Preserve service type from the old appointment if possible
    const appointment = (context.appointments ?? []).find(
      (a: any) => a.id === context.target_appointment_id
    )
    const serviceType = appointment?.service_type ?? context.service_type

    const response = await llm.generate('reschedule_pick_date', {
      name: context.cliente_nome,
    }, lang)

    return {
      nextState: 'ASK_DATE',
      response,
      contextUpdates: {
        target_appointment_id: null,
        selected_date: null,
        selected_time: null,
        booking_id: null,
        booking_confirmed: false,
        service_type: serviceType,
      },
    }
  }

  // User said no — go back to intent detection
  const response = await llm.generate('reschedule_aborted', {
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

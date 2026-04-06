// lib/ai/state-machine/__tests__/flow-cancel.test.ts
// Integration test: returning customer → cancel appointment flow
//
// Flow (starting from a recognised returning customer):
//   RETURNING_CUSTOMER → DETECT_INTENT
//     → (silent) SHOW_APPOINTMENTS → SELECT_APPOINTMENT
//     → (silent) CONFIRM_CANCEL → CONFIRM_CANCEL (user answers yes)
//     → (silent) CANCEL_APPOINTMENT → DONE

import { CarolStateMachine } from '../engine'
import { registerAllHandlers } from '../handlers/index'
import type { CarolServices } from '@/lib/services/carol-services'
import type { CarolLLM } from '@/lib/ai/llm'
import type { SessionContext } from '../types'

// ─────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────

const RETURNING_CUSTOMER_CONTEXT: SessionContext = {
  state: 'RETURNING_CUSTOMER',
  previousState: 'LOOKUP_CUSTOMER',
  language: 'en',
  cliente_id: 'client-returning-01',
  cliente_nome: 'Jane Doe',
  cliente_telefone: '7045559876',
  cliente_endereco: '456 Oak Ave, Fort Mill, SC 29708',
  cliente_zip: '29708',
  cliente_email: 'jane@example.com',
  is_returning: true,
  service_type: null,
  selected_date: null,
  selected_time: null,
  duration_minutes: null,
  available_slots: null,
  target_appointment_id: null,
  appointments: [
    {
      id: 'appt-upcoming-01',
      service_type: 'regular',
      date: '2099-06-15',
      time: '09:00',
      status: 'agendado',
      value: 150,
    },
    {
      id: 'appt-upcoming-02',
      service_type: 'deep',
      date: '2099-07-01',
      time: '13:00',
      status: 'agendado',
      value: 250,
    },
  ],
  booking_confirmed: false,
  booking_id: null,
  canal_preferencia: 'sms',
  retry_count: 0,
  last_error: null,
  pets_info: null,
  allergy_info: null,
}

// ─────────────────────────────────────────────────────────────
// Mock factories
// ─────────────────────────────────────────────────────────────

function buildMockServices(initialContext: SessionContext): jest.Mocked<CarolServices> {
  let storedContext = { ...initialContext }

  return {
    getSession: jest.fn().mockImplementation(async () => ({ ...storedContext })),
    getDefaultContext: jest.fn().mockReturnValue({ ...RETURNING_CUSTOMER_CONTEXT, state: 'GREETING' }),
    updateSession: jest.fn().mockImplementation(async (_id: string, ctx: SessionContext) => {
      storedContext = { ...ctx }
    }),
    saveMessage: jest.fn().mockResolvedValue(undefined),
    findCustomerByPhone: jest.fn(),
    getClientHistory: jest.fn().mockResolvedValue({
      client_id: 'client-returning-01',
      appointments: initialContext.appointments ?? [],
      total_appointments: 2,
      total_spent: 400,
      is_returning: true,
    }),
    getAvailableSlots: jest.fn(),
    getAvailableSlotsMultiDay: jest.fn(),
    checkZipCoverage: jest.fn(),
    getServicePricing: jest.fn(),
    getBusinessInfo: jest.fn(),
    getSystemConfig: jest.fn(),
    createLead: jest.fn(),
    updateLead: jest.fn(),
    createAppointment: jest.fn(),
    cancelAppointment: jest.fn().mockResolvedValue({
      status: 'cancelled',
      appointment_id: 'appt-upcoming-01',
      message: 'Appointment cancelled successfully',
    }),
    confirmAppointment: jest.fn(),
    scheduleCallback: jest.fn(),
    getHistory: jest.fn(),
  } as unknown as jest.Mocked<CarolServices>
}

function buildMockLlm(): jest.Mocked<CarolLLM> {
  return {
    detectLanguage: jest.fn().mockResolvedValue('en'),
    extract: jest.fn(),
    classifyIntent: jest.fn(),
    generate: jest.fn().mockImplementation(async (template: string) => `[${template}]`),
    generateFaq: jest.fn(),
  } as unknown as jest.Mocked<CarolLLM>
}

// ─────────────────────────────────────────────────────────────
// Test suite
// ─────────────────────────────────────────────────────────────

describe('Returning customer → cancel appointment flow (integration)', () => {
  let services: jest.Mocked<CarolServices>
  let llm: jest.Mocked<CarolLLM>
  let engine: CarolStateMachine
  const SESSION = 'test-session-cancel'

  beforeEach(() => {
    services = buildMockServices(RETURNING_CUSTOMER_CONTEXT)
    llm = buildMockLlm()
    engine = new CarolStateMachine(services, llm)
    registerAllHandlers(engine)
  })

  // ── Step 1: greet returning customer ──────────────────────
  it('Step 1 — greets returning customer by name and enters DETECT_INTENT', async () => {
    const result = await engine.process('hello', SESSION)

    expect(result.state).toBe('DETECT_INTENT')
    expect(llm.generate).toHaveBeenCalledWith('greet_returning', expect.objectContaining({
      name: 'Jane Doe',
    }), 'en')
  })

  // ── Step 2: user expresses cancel intent ──────────────────
  it('Step 2 — "I want to cancel" routes to SHOW_APPOINTMENTS and shows appointment list', async () => {
    // Advance to DETECT_INTENT
    await engine.process('hello', SESSION)

    // User says they want to cancel
    ;(llm.classifyIntent as jest.Mock).mockResolvedValueOnce('cancel')

    const result = await engine.process('I want to cancel my appointment', SESSION)

    // DETECT_INTENT → silent SHOW_APPOINTMENTS → SELECT_APPOINTMENT
    expect(result.state).toBe('SELECT_APPOINTMENT')
    expect(services.getClientHistory).toHaveBeenCalledWith('client-returning-01')
    expect(llm.generate).toHaveBeenCalledWith('show_appointments', expect.objectContaining({
      name: 'Jane Doe',
      action: 'cancel',
    }), 'en')

    // Appointments should be stored in context
    const savedCtx = (services.updateSession as jest.Mock).mock.calls.at(-1)?.[1]
    expect(Array.isArray(savedCtx?.appointments)).toBe(true)
    expect(savedCtx?.appointments.length).toBeGreaterThan(0)
  })

  // ── Step 3: user selects the first appointment ────────────
  it('Step 3 — user selects appointment 1, Carol asks for confirmation', async () => {
    await engine.process('hello', SESSION)
    ;(llm.classifyIntent as jest.Mock).mockResolvedValueOnce('cancel')
    await engine.process('I want to cancel my appointment', SESSION)

    // User picks appointment #1 by number
    ;(llm.extract as jest.Mock).mockResolvedValueOnce({ number: 1, appointment_id: null })

    const result = await engine.process('1', SESSION)

    // SELECT_APPOINTMENT → silent CONFIRM_CANCEL (shows prompt) → stays CONFIRM_CANCEL
    expect(result.state).toBe('CONFIRM_CANCEL')
    expect(llm.generate).toHaveBeenCalledWith('confirm_cancel', expect.objectContaining({
      date: '2099-06-15',
      time: '09:00',
    }), 'en')

    const savedCtx = (services.updateSession as jest.Mock).mock.calls.at(-1)?.[1]
    expect(savedCtx?.target_appointment_id).toBe('appt-upcoming-01')
  })

  // ── Step 4: user confirms cancellation ────────────────────
  it('Step 4 — user confirms cancel, Carol executes cancellation and says goodbye', async () => {
    await engine.process('hello', SESSION)
    ;(llm.classifyIntent as jest.Mock).mockResolvedValueOnce('cancel')
    await engine.process('I want to cancel my appointment', SESSION)
    ;(llm.extract as jest.Mock).mockResolvedValueOnce({ number: 1, appointment_id: null })
    await engine.process('1', SESSION)

    // User confirms
    ;(llm.classifyIntent as jest.Mock).mockResolvedValueOnce('yes')

    const result = await engine.process('yes, cancel it', SESSION)

    // CONFIRM_CANCEL (yes) → silent CANCEL_APPOINTMENT → DONE
    expect(result.state).toBe('DONE')
    expect(services.cancelAppointment).toHaveBeenCalledWith('appt-upcoming-01')
    expect(llm.generate).toHaveBeenCalledWith('cancel_success', expect.objectContaining({
      name: 'Jane Doe',
    }), 'en')
  })

  // ── Unhappy path: user aborts cancellation ────────────────
  it('aborts cancellation when user says no and returns to DETECT_INTENT', async () => {
    await engine.process('hello', SESSION)
    ;(llm.classifyIntent as jest.Mock).mockResolvedValueOnce('cancel')
    await engine.process('I want to cancel my appointment', SESSION)
    ;(llm.extract as jest.Mock).mockResolvedValueOnce({ number: 1, appointment_id: null })
    await engine.process('1', SESSION)

    // User changes their mind
    ;(llm.classifyIntent as jest.Mock).mockResolvedValueOnce('no')

    const result = await engine.process('actually never mind', SESSION)

    expect(result.state).toBe('DETECT_INTENT')
    expect(services.cancelAppointment).not.toHaveBeenCalled()
    expect(llm.generate).toHaveBeenCalledWith('cancel_aborted', expect.objectContaining({
      name: 'Jane Doe',
    }), 'en')

    const savedCtx = (services.updateSession as jest.Mock).mock.calls.at(-1)?.[1]
    expect(savedCtx?.target_appointment_id).toBeNull()
  })

  // ── Unhappy path: no upcoming appointments ────────────────
  it('shows "no appointments" message and goes to DETECT_INTENT when customer has none', async () => {
    // Override getClientHistory to return empty
    ;(services.getClientHistory as jest.Mock).mockResolvedValue({
      client_id: 'client-returning-01',
      appointments: [],
      total_appointments: 0,
      total_spent: 0,
      is_returning: true,
    })

    await engine.process('hello', SESSION)
    ;(llm.classifyIntent as jest.Mock).mockResolvedValueOnce('cancel')

    const result = await engine.process('cancel my appointment', SESSION)

    expect(result.state).toBe('DETECT_INTENT')
    expect(services.cancelAppointment).not.toHaveBeenCalled()
    expect(llm.generate).toHaveBeenCalledWith('no_upcoming_appointments', expect.objectContaining({
      name: 'Jane Doe',
    }), 'en')
  })

  // ── Unhappy path: service error during cancellation ───────
  it('shows error message and returns to DETECT_INTENT when cancelAppointment service fails', async () => {
    ;(services.cancelAppointment as jest.Mock).mockResolvedValue({
      status: 'error',
      appointment_id: 'appt-upcoming-01',
      message: 'Database error',
    })

    await engine.process('hello', SESSION)
    ;(llm.classifyIntent as jest.Mock).mockResolvedValueOnce('cancel')
    await engine.process('cancel', SESSION)
    ;(llm.extract as jest.Mock).mockResolvedValueOnce({ number: 1, appointment_id: null })
    await engine.process('1', SESSION)
    ;(llm.classifyIntent as jest.Mock).mockResolvedValueOnce('yes')

    const result = await engine.process('yes', SESSION)

    expect(result.state).toBe('DETECT_INTENT')
    expect(llm.generate).toHaveBeenCalledWith('cancel_error', expect.anything(), 'en')
  })

  // ── Validate context is cleaned up after success ──────────
  it('clears target_appointment_id from context after successful cancellation', async () => {
    await engine.process('hello', SESSION)
    ;(llm.classifyIntent as jest.Mock).mockResolvedValueOnce('cancel')
    await engine.process('I want to cancel my appointment', SESSION)
    ;(llm.extract as jest.Mock).mockResolvedValueOnce({ number: 1, appointment_id: null })
    await engine.process('1', SESSION)
    ;(llm.classifyIntent as jest.Mock).mockResolvedValueOnce('yes')
    await engine.process('yes', SESSION)

    const savedCtx = (services.updateSession as jest.Mock).mock.calls.at(-1)?.[1]
    expect(savedCtx?.target_appointment_id).toBeNull()
  })
})

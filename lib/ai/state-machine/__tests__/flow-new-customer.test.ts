// lib/ai/state-machine/__tests__/flow-new-customer.test.ts
// Integration test: full "new customer → schedule visit" happy path
//
// Real state flow (traced from actual handlers):
//   GREETING → COLLECT_PHONE → CONFIRM_PHONE
//     → (silent) LOOKUP_CUSTOMER → NEW_CUSTOMER_NAME
//     → (silent) EXPLAIN_FIRST_VISIT → NEW_CUSTOMER_ADDRESS
//     → (silent) CHECK_ZIP → (silent) CREATE_LEAD → ASK_DATE [state stored]
//   [next turn] ASK_DATE runs: no service_type → ASK_SERVICE_TYPE [asks for it]
//   [next turn] ASK_SERVICE_TYPE: extracts service → (silent) ASK_DATE → COLLECT_DATE
//   [next turn] COLLECT_DATE: extracts date → (silent) CHECK_AVAILABILITY → (silent) COLLECT_TIME
//   [next turn] COLLECT_TIME: extracts time → (silent) CREATE_BOOKING → CONFIRM_SUMMARY
//   [next turn] CONFIRM_SUMMARY: user confirms → COLLECT_PREFERENCE [asks for SMS/WhatsApp]
//   [next turn] COLLECT_PREFERENCE: extracts preference → (silent) UPDATE_PREFERENCE → DONE

import { CarolStateMachine } from '../engine'
import { registerAllHandlers } from '../handlers/index'
import type { CarolServices } from '@/lib/services/carol-services'
import type { CarolLLM } from '@/lib/ai/llm'
import type { SessionContext } from '../types'

// ─────────────────────────────────────────────────────────────
// Mock factories
// ─────────────────────────────────────────────────────────────

function makeDefaultContext(): SessionContext {
  return {
    state: 'GREETING',
    previousState: null,
    language: 'en',
    cliente_id: null,
    cliente_nome: null,
    cliente_telefone: null,
    cliente_endereco: null,
    cliente_zip: null,
    cliente_email: null,
    is_returning: false,
    service_type: null,
    selected_date: null,
    selected_time: null,
    duration_minutes: null,
    available_slots: null,
    target_appointment_id: null,
    appointments: null,
    booking_confirmed: false,
    booking_id: null,
    canal_preferencia: null,
    retry_count: 0,
    last_error: null,
    pets_info: null,
    allergy_info: null,
  }
}

/**
 * Build a mock services object that keeps in-memory session state across calls,
 * simulating real Supabase session persistence.
 */
function buildMockServices(): jest.Mocked<CarolServices> {
  let storedContext: SessionContext = makeDefaultContext()

  const services = {
    getSession: jest.fn().mockImplementation(async () => ({ ...storedContext })),
    getDefaultContext: jest.fn().mockReturnValue(makeDefaultContext()),
    updateSession: jest.fn().mockImplementation(async (_id: string, ctx: SessionContext) => {
      storedContext = { ...ctx }
    }),
    saveMessage: jest.fn().mockResolvedValue(undefined),
    findCustomerByPhone: jest.fn().mockResolvedValue({ found: false }),
    getClientHistory: jest.fn(),
    getAvailableSlots: jest.fn().mockResolvedValue({
      date: '2026-04-10',
      slots: [
        { time: '10:00', end_time: '12:00' },
        { time: '14:00', end_time: '16:00' },
      ],
      total: 2,
    }),
    getAvailableSlotsMultiDay: jest.fn(),
    checkZipCoverage: jest.fn().mockResolvedValue({ covered: true, area_name: 'Fort Mill', additional_fee: 0 }),
    getServicePricing: jest.fn(),
    getBusinessInfo: jest.fn(),
    getSystemConfig: jest.fn(),
    createLead: jest.fn().mockResolvedValue({
      status: 'created',
      client_id: 'client-001',
      client_name: 'John Smith',
      message: 'Lead created successfully',
    }),
    updateLead: jest.fn().mockResolvedValue({
      status: 'updated',
      client_id: 'client-001',
      updated_fields: ['canal_preferencia'],
    }),
    createAppointment: jest.fn().mockResolvedValue({
      status: 'created',
      appointment_id: 'appt-001',
      details: {
        client_name: 'John Smith',
        service: 'regular',
        date: '2026-04-10',
        time: '10:00',
        duration: 120,
        address: '123 Main St Fort Mill SC 29708',
      },
      message: 'Appointment created successfully! ID: appt-001',
    }),
    cancelAppointment: jest.fn(),
    confirmAppointment: jest.fn().mockResolvedValue({ status: 'confirmed', appointment_id: 'appt-001' }),
    scheduleCallback: jest.fn(),
    getHistory: jest.fn(),
  } as unknown as jest.Mocked<CarolServices>

  return services
}

function buildMockLlm(): jest.Mocked<CarolLLM> {
  return {
    
    extract: jest.fn(),
    classifyIntent: jest.fn(),
    generate: jest.fn().mockImplementation(async (template: string) => `[${template}]`),
    generateFaq: jest.fn(),
  } as unknown as jest.Mocked<CarolLLM>
}

// ─────────────────────────────────────────────────────────────
// Shared helpers to drive the flow to a known checkpoint
// ─────────────────────────────────────────────────────────────

async function driveToCollectPhone(engine: CarolStateMachine, services: jest.Mocked<CarolServices>, llm: jest.Mocked<CarolLLM>, session: string) {
  // GREETING → COLLECT_PHONE
  await engine.process('hi', session)
}

async function driveToConfirmPhone(engine: CarolStateMachine, services: jest.Mocked<CarolServices>, llm: jest.Mocked<CarolLLM>, session: string) {
  await driveToCollectPhone(engine, services, llm, session)
  ;(llm.extract as jest.Mock).mockResolvedValueOnce({ phone: '7045551234' })
  await engine.process('704-555-1234', session)
}

async function driveToNewCustomerName(engine: CarolStateMachine, services: jest.Mocked<CarolServices>, llm: jest.Mocked<CarolLLM>, session: string) {
  await driveToConfirmPhone(engine, services, llm, session)
  ;(llm.classifyIntent as jest.Mock).mockResolvedValueOnce('yes')
  await engine.process('yes', session)
}

async function driveToNewCustomerAddress(engine: CarolStateMachine, services: jest.Mocked<CarolServices>, llm: jest.Mocked<CarolLLM>, session: string) {
  await driveToNewCustomerName(engine, services, llm, session)
  ;(llm.extract as jest.Mock).mockResolvedValueOnce({ name: 'John Smith' })
  await engine.process('John Smith', session)
}

async function driveToAskDate(engine: CarolStateMachine, services: jest.Mocked<CarolServices>, llm: jest.Mocked<CarolLLM>, session: string) {
  await driveToNewCustomerAddress(engine, services, llm, session)
  ;(llm.extract as jest.Mock).mockResolvedValueOnce({ address: '123 Main St Fort Mill SC 29708', zip_code: '29708' })
  await engine.process('123 Main St Fort Mill SC 29708', session)
  // State is now ASK_DATE (CREATE_LEAD → ASK_DATE)
}

async function driveToCollectDate(engine: CarolStateMachine, services: jest.Mocked<CarolServices>, llm: jest.Mocked<CarolLLM>, session: string) {
  await driveToAskDate(engine, services, llm, session)
  // State is ASK_DATE. ASK_DATE handler runs on next message and, since service_type
  // is null, immediately redirects to ASK_SERVICE_TYPE (no extract call).
  await engine.process('what are the options?', session)
  // State is now ASK_SERVICE_TYPE. User picks "regular":
  // ASK_SERVICE_TYPE extracts service → (silent) ASK_DATE → COLLECT_DATE
  ;(llm.extract as jest.Mock).mockResolvedValueOnce({ service_type: 'regular' })
  await engine.process('regular cleaning', session)
  // Now at COLLECT_DATE
}

async function driveToCollectTime(engine: CarolStateMachine, services: jest.Mocked<CarolServices>, llm: jest.Mocked<CarolLLM>, session: string) {
  await driveToCollectDate(engine, services, llm, session)
  // User gives date → COLLECT_DATE → (silent) CHECK_AVAILABILITY → (silent) COLLECT_TIME
  ;(llm.extract as jest.Mock).mockResolvedValueOnce({ date: '2026-04-10' })
  await engine.process('next friday', session)
}

async function driveToConfirmSummary(engine: CarolStateMachine, services: jest.Mocked<CarolServices>, llm: jest.Mocked<CarolLLM>, session: string) {
  await driveToCollectTime(engine, services, llm, session)
  ;(llm.extract as jest.Mock).mockResolvedValueOnce({ time: '10:00' })
  await engine.process('10am', session)
}

// ─────────────────────────────────────────────────────────────
// Integration test suite
// ─────────────────────────────────────────────────────────────

describe('New-customer → schedule visit flow (integration)', () => {
  let services: jest.Mocked<CarolServices>
  let llm: jest.Mocked<CarolLLM>
  let engine: CarolStateMachine
  const SESSION = 'test-session-new-customer'

  beforeEach(() => {
    services = buildMockServices()
    llm = buildMockLlm()
    engine = new CarolStateMachine(services, llm)
    registerAllHandlers(engine)
  })

  // ── Step 1 ─────────────────────────────────────────────────
  it('Step 1 — greeting transitions to COLLECT_PHONE and asks for phone', async () => {
    const result = await engine.process('hi', SESSION)

    expect(result.state).toBe('COLLECT_PHONE')
    expect(llm.generate).toHaveBeenCalledWith('ask_phone', expect.anything(), expect.anything())
    expect(result.response).toBeTruthy()
  })

  // ── Step 2 ─────────────────────────────────────────────────
  it('Step 2 — user provides phone, Carol confirms it', async () => {
    await driveToCollectPhone(engine, services, llm, SESSION)

    ;(llm.extract as jest.Mock).mockResolvedValueOnce({ phone: '7045551234' })

    const result = await engine.process('704-555-1234', SESSION)

    expect(result.state).toBe('CONFIRM_PHONE')
    expect(llm.generate).toHaveBeenCalledWith('confirm_phone', expect.objectContaining({ phone: '(704) 555-1234' }), expect.anything())

    const savedCtx = (services.updateSession as jest.Mock).mock.calls.at(-1)?.[1]
    expect(savedCtx?.cliente_telefone).toBe('7045551234')
  })

  // ── Step 3 ─────────────────────────────────────────────────
  it('Step 3 — user confirms phone, engine looks up customer (not found) and asks for name', async () => {
    await driveToConfirmPhone(engine, services, llm, SESSION)

    ;(llm.classifyIntent as jest.Mock).mockResolvedValueOnce('yes')

    const result = await engine.process('yes', SESSION)

    // CONFIRM_PHONE → (silent) LOOKUP_CUSTOMER → NEW_CUSTOMER_NAME
    expect(result.state).toBe('NEW_CUSTOMER_NAME')
    expect(services.findCustomerByPhone).toHaveBeenCalledWith('7045551234')
    expect(llm.generate).toHaveBeenCalledWith('ask_name', expect.anything(), expect.anything())
  })

  // ── Step 4 ─────────────────────────────────────────────────
  it('Step 4 — user provides name, Carol explains free visit and asks for address', async () => {
    await driveToNewCustomerName(engine, services, llm, SESSION)

    ;(llm.extract as jest.Mock).mockResolvedValueOnce({ name: 'John Smith' })

    const result = await engine.process('John Smith', SESSION)

    // NEW_CUSTOMER_NAME → (silent) EXPLAIN_FIRST_VISIT → NEW_CUSTOMER_ADDRESS
    expect(result.state).toBe('NEW_CUSTOMER_ADDRESS')
    expect(llm.generate).toHaveBeenCalledWith('explain_first_visit', expect.anything(), expect.anything())

    const savedCtx = (services.updateSession as jest.Mock).mock.calls.at(-1)?.[1]
    expect(savedCtx?.cliente_nome).toBe('John Smith')
  })

  // ── Step 5 ─────────────────────────────────────────────────
  it('Step 5 — user provides address with ZIP, engine checks ZIP (covered), creates lead', async () => {
    await driveToNewCustomerAddress(engine, services, llm, SESSION)

    ;(llm.extract as jest.Mock).mockResolvedValueOnce({
      address: '123 Main St Fort Mill SC 29708',
      zip_code: '29708',
    })

    const result = await engine.process('123 Main St Fort Mill SC 29708', SESSION)

    // NEW_CUSTOMER_ADDRESS → (silent) CHECK_ZIP → (silent) CREATE_LEAD → ASK_DATE
    expect(result.state).toBe('ASK_DATE')
    expect(services.checkZipCoverage).toHaveBeenCalledWith('29708')
    expect(services.createLead).toHaveBeenCalledWith(expect.objectContaining({
      name: 'John Smith',
      phone: '7045551234',
      zip_code: '29708',
    }))

    const savedCtx = (services.updateSession as jest.Mock).mock.calls.at(-1)?.[1]
    expect(savedCtx?.cliente_id).toBe('client-001')
    expect(savedCtx?.cliente_zip).toBe('29708')
  })

  // ── Step 5b ────────────────────────────────────────────────
  it('Step 5b — ASK_DATE redirects to service type selection when service_type is not set', async () => {
    await driveToAskDate(engine, services, llm, SESSION)

    // Service type not yet known, so LLM can't extract one from an empty message
    ;(llm.extract as jest.Mock).mockResolvedValueOnce({ service_type: null })

    const result = await engine.process('I am not sure yet', SESSION)

    // ASK_DATE: no service_type → ASK_SERVICE_TYPE
    expect(result.state).toBe('ASK_SERVICE_TYPE')
    expect(llm.generate).toHaveBeenCalledWith('ask_service_type', expect.anything(), expect.anything())
  })

  // ── Step 6 ─────────────────────────────────────────────────
  it('Step 6 — ASK_DATE asks for service type, user picks regular, then provides date, Carol shows slots', async () => {
    await driveToAskDate(engine, services, llm, SESSION)

    // State: ASK_DATE. ASK_DATE handler sees no service_type → goes to ASK_SERVICE_TYPE.
    const askServiceResult = await engine.process('when can I book?', SESSION)
    expect(askServiceResult.state).toBe('ASK_SERVICE_TYPE')
    expect(llm.generate).toHaveBeenCalledWith('ask_service_type', expect.anything(), expect.anything())

    // User picks "regular cleaning" → ASK_SERVICE_TYPE extracts it → (silent) ASK_DATE → COLLECT_DATE
    ;(llm.extract as jest.Mock).mockResolvedValueOnce({ service_type: 'regular' })
    const serviceResult = await engine.process('regular cleaning', SESSION)

    expect(serviceResult.state).toBe('COLLECT_DATE')
    const savedCtx1 = (services.updateSession as jest.Mock).mock.calls.at(-1)?.[1]
    expect(savedCtx1?.service_type).toBe('regular')
    expect(savedCtx1?.duration_minutes).toBe(120)

    // User provides "next friday" → COLLECT_DATE → (silent) CHECK_AVAILABILITY → (silent) COLLECT_TIME
    ;(llm.extract as jest.Mock).mockResolvedValueOnce({ date: '2026-04-10' })
    const dateResult = await engine.process('next friday', SESSION)

    expect(dateResult.state).toBe('COLLECT_TIME')
    expect(services.getAvailableSlots).toHaveBeenCalledWith('2026-04-10', 120)

    const savedCtx2 = (services.updateSession as jest.Mock).mock.calls.at(-1)?.[1]
    expect(savedCtx2?.selected_date).toBe('2026-04-10')
    expect(savedCtx2?.available_slots).toEqual([
      { time: '10:00', end_time: '12:00' },
      { time: '14:00', end_time: '16:00' },
    ])
  })

  // ── Step 7 ─────────────────────────────────────────────────
  it('Step 7 — user picks 10am, engine creates booking and shows summary', async () => {
    await driveToCollectTime(engine, services, llm, SESSION)

    ;(llm.extract as jest.Mock).mockResolvedValueOnce({ time: '10:00' })

    const result = await engine.process('10am', SESSION)

    // COLLECT_TIME → (silent) CREATE_BOOKING → CONFIRM_SUMMARY
    expect(result.state).toBe('CONFIRM_SUMMARY')
    expect(services.createAppointment).toHaveBeenCalledWith(expect.objectContaining({
      client_id: 'client-001',
      date: '2026-04-10',
      time: '10:00',
    }))
    expect(llm.generate).toHaveBeenCalledWith('confirm_summary', expect.objectContaining({
      date: '2026-04-10',
      time: '10:00',
    }), 'en')

    const savedCtx = (services.updateSession as jest.Mock).mock.calls.at(-1)?.[1]
    expect(savedCtx?.booking_id).toBe('appt-001')
    expect(savedCtx?.booking_confirmed).toBe(true)
  })

  // ── Step 8 ─────────────────────────────────────────────────
  it('Step 8 — user confirms booking, then chooses WhatsApp, Carol says goodbye', async () => {
    await driveToConfirmSummary(engine, services, llm, SESSION)

    // User confirms the booking summary
    ;(llm.classifyIntent as jest.Mock).mockResolvedValueOnce('yes')
    const confirmResult = await engine.process('yes that looks good', SESSION)

    // CONFIRM_SUMMARY(yes) → COLLECT_PREFERENCE (asks for SMS/WhatsApp)
    expect(confirmResult.state).toBe('COLLECT_PREFERENCE')
    expect(services.confirmAppointment).toHaveBeenCalledWith('appt-001')
    expect(llm.generate).toHaveBeenCalledWith('ask_preference', expect.anything(), expect.anything())

    // User says they prefer WhatsApp
    ;(llm.extract as jest.Mock).mockResolvedValueOnce({ preference: 'whatsapp' })
    const prefResult = await engine.process('whatsapp please', SESSION)

    // COLLECT_PREFERENCE → (silent) UPDATE_PREFERENCE → DONE
    expect(prefResult.state).toBe('DONE')
    expect(services.updateLead).toHaveBeenCalledWith('client-001', { canal_preferencia: 'whatsapp' })
    expect(llm.generate).toHaveBeenCalledWith('done_booking', expect.anything(), expect.anything())

    const savedCtx = (services.updateSession as jest.Mock).mock.calls.at(-1)?.[1]
    expect(savedCtx?.canal_preferencia).toBe('whatsapp')
  })

  // ── Unhappy path: invalid phone number ────────────────────
  it('stays at COLLECT_PHONE and increments retry_count when phone is invalid', async () => {
    await driveToCollectPhone(engine, services, llm, SESSION)

    // LLM can't extract a phone
    ;(llm.extract as jest.Mock).mockResolvedValueOnce({ phone: null })

    const result = await engine.process('not a phone number', SESSION)

    expect(result.state).toBe('COLLECT_PHONE')
    expect(llm.generate).toHaveBeenCalledWith('invalid_phone', expect.anything(), expect.anything())

    const savedCtx = (services.updateSession as jest.Mock).mock.calls.at(-1)?.[1]
    expect(savedCtx?.retry_count).toBe(1)
  })

  // ── Unhappy path: ZIP not covered ─────────────────────────
  it('redirects to DONE with "zip_not_covered" message when ZIP is outside service area', async () => {
    ;(services.checkZipCoverage as jest.Mock).mockResolvedValue({
      covered: false,
      area_name: null,
      additional_fee: 0,
    })

    await driveToNewCustomerAddress(engine, services, llm, SESSION)

    ;(llm.extract as jest.Mock).mockResolvedValueOnce({ address: '999 Far Away Ave, Miami FL 33101', zip_code: '33101' })

    const result = await engine.process('999 Far Away Ave, Miami FL 33101', SESSION)

    expect(result.state).toBe('DONE')
    expect(llm.generate).toHaveBeenCalledWith('zip_not_covered', expect.anything(), expect.anything())
  })

  // ── Unhappy path: user picks unavailable time ─────────────
  it('stays at COLLECT_TIME when user picks a time not in available slots', async () => {
    await driveToCollectTime(engine, services, llm, SESSION)

    // User asks for a time that is not in the mocked slots
    ;(llm.extract as jest.Mock).mockResolvedValueOnce({ time: '08:00' })

    const result = await engine.process('8am', SESSION)

    expect(result.state).toBe('COLLECT_TIME')
    expect(llm.generate).toHaveBeenCalledWith('time_not_available', expect.anything(), expect.anything())
  })
})

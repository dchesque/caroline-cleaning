// lib/ai/__tests__/lead-chat-flow.smoke.test.ts
//
// End-to-end smoke test for the lead-chat flow.
// Mocks OpenRouter + Supabase so we can exercise every branch of
// processLeadMessage deterministically — no API costs, no flaky LLM tone.
//
// The mocks are programmable per scenario via the helpers below.

import { defaultLeadContext, type LeadContext } from '@/types/lead-chat'

// ─── Programmable mocks ──────────────────────────────────────────────────────

type MockChoice = {
  finish_reason: 'stop' | 'tool_calls'
  message: {
    content: string | null
    tool_calls?: Array<{ function: { name: string; arguments: string } }>
  }
}

const mockState = {
  nextResponses: [] as MockChoice[],
  zipCovered: new Set<string>(),
  insertedRows: [] as Array<Record<string, unknown>>,
  existingRowsByPhone: new Map<string, { id: string; status: string | null }>(),
  updatedRows: [] as Array<{ id: string; patch: Record<string, unknown> }>,
}

function queueLLM(choice: MockChoice) {
  mockState.nextResponses.push(choice)
}

function resetMocks() {
  mockState.nextResponses = []
  mockState.zipCovered = new Set(['28202', '28203', '29708'])
  mockState.insertedRows = []
  mockState.existingRowsByPhone = new Map()
  mockState.updatedRows = []
}

// ─── jest.mock setup ─────────────────────────────────────────────────────────

jest.mock('@/lib/ai/openrouter', () => ({
  openrouter: {
    chat: {
      completions: {
        create: jest.fn(async () => {
          if (mockState.nextResponses.length === 0) {
            throw new Error('No queued LLM response — forgot queueLLM()?')
          }
          const choice = mockState.nextResponses.shift()!
          return {
            choices: [choice],
            usage: { total_tokens: 50, prompt_tokens: 30, completion_tokens: 20 },
          }
        }),
      },
    },
  },
}))

jest.mock('@/lib/env', () => ({
  env: { defaultModel: 'mock-model' },
}))

jest.mock('@/lib/services/evolutionService', () => ({
  notifyAdmins: jest.fn(),
}))

jest.mock('@/lib/tracking/server', () => ({
  fireServerConversion: jest.fn(() => ({ eventId: 'mock-event', eventName: 'Lead' })),
}))

jest.mock('@/lib/supabase/server', () => ({
  createAdminClient: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: (col: string, val: unknown) => ({
          contains: (_col: string, arr: string[]) => ({
            limit: async () =>
              table === 'areas_atendidas' && mockState.zipCovered.has(arr[0])
                ? { data: [{ id: 'mock-area' }], error: null }
                : { data: [], error: null },
          }),
          maybeSingle: async () => {
            if (table === 'clientes' && col === 'telefone') {
              const row = mockState.existingRowsByPhone.get(String(val))
              return { data: row ?? null, error: null }
            }
            return { data: null, error: null }
          },
        }),
      }),
      insert: (row: Record<string, unknown>) => ({
        select: () => ({
          single: async () => {
            mockState.insertedRows.push(row)
            return { data: { id: `mock-${mockState.insertedRows.length}` }, error: null }
          },
        }),
      }),
      update: (patch: Record<string, unknown>) => ({
        eq: async (_col: string, val: unknown) => {
          mockState.updatedRows.push({ id: String(val), patch })
          return { error: null }
        },
      }),
    }),
  }),
}))

// Import AFTER mocks are set up.
import { processLeadMessage } from '../lead-chat-agent'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ctx(overrides: Partial<LeadContext> = {}): LeadContext {
  return { ...defaultLeadContext(), ...overrides }
}

function textChoice(content: string): MockChoice {
  return { finish_reason: 'stop', message: { content } }
}

function toolChoice(args: { name: string; phone: string; zip: string; address: string }): MockChoice {
  return {
    finish_reason: 'tool_calls',
    message: {
      content: null,
      tool_calls: [{ function: { name: 'save_lead', arguments: JSON.stringify(args) } }],
    },
  }
}

beforeEach(() => {
  resetMocks()
})

// ─── Scenarios ───────────────────────────────────────────────────────────────

describe('lead-chat smoke test', () => {
  describe('happy path', () => {
    it('walks through name → phone → zip → address → save', async () => {
      // Turn 1: customer says name. LLM acknowledges and asks for phone.
      queueLLM(textChoice('Nice to meet you, John! What is the best phone to reach you?'))
      const t1 = await processLeadMessage({
        message: 'John Smith',
        sessionId: 's1',
        history: [],
        context: ctx(),
      })
      expect(t1.context.name).toBe('John Smith')
      expect(t1.context.attempts.name).toBe(0) // filled this turn
      expect(t1.context.leadSaved).toBe(false)

      // Turn 2: phone.
      queueLLM(textChoice('Got it! What is your ZIP code?'))
      const t2 = await processLeadMessage({
        message: '7045551234',
        sessionId: 's1',
        history: [
          { role: 'user', content: 'John Smith' },
          { role: 'assistant', content: t1.message },
        ],
        context: t1.context,
      })
      expect(t2.context.phone).toBe('7045551234')

      // Turn 3: ZIP (covered).
      queueLLM(textChoice('Great, we serve that area! What is the street address?'))
      const t3 = await processLeadMessage({
        message: '28202',
        sessionId: 's1',
        history: [
          { role: 'user', content: 'John Smith' },
          { role: 'assistant', content: t1.message },
          { role: 'user', content: '7045551234' },
          { role: 'assistant', content: t2.message },
        ],
        context: t2.context,
      })
      expect(t3.context.zip).toBe('28202')
      expect(t3.context.zipConfirmed).toBe(true)

      // Turn 4: customer types address. LLM picks it up from history and
      // calls save_lead directly — this is the typical strong-model behavior.
      // Note: address is NOT extracted by regex — it only enters context via
      // the tool call args (free text, no reliable extraction).
      queueLLM(
        toolChoice({
          name: 'John Smith',
          phone: '7045551234',
          zip: '28202',
          address: '123 Main St',
        }),
      )
      const t4 = await processLeadMessage({
        message: '123 Main St',
        sessionId: 's1',
        history: [],
        context: t3.context,
      })
      expect(t4.context.leadSaved).toBe(true)
      expect(t4.context.address).toBe('123 Main St')
      expect(t4.context.leadId).toMatch(/^mock-/)
      expect(mockState.insertedRows).toHaveLength(1)
      expect(mockState.insertedRows[0]).toMatchObject({
        nome: 'John Smith',
        telefone: '7045551234',
        zip_code: '28202',
        endereco_completo: '123 Main St',
        status: 'lead',
      })
      expect(t4.message).toMatch(/Perfect, John/)
    })
  })

  describe('ZIP rejection flow', () => {
    it('first uncovered ZIP returns "another ZIP" message without consuming an LLM call', async () => {
      const result = await processLeadMessage({
        message: '99999', // not in covered set
        sessionId: 's1',
        history: [],
        context: ctx({ name: 'John', phone: '7045551234' }),
      })
      expect(result.message).toMatch(/Hmm, that ZIP isn't in our service area/)
      expect(result.context.zipRejectedCount).toBe(1)
      expect(result.context.zipConfirmed).toBe(false)
      expect(mockState.nextResponses.length).toBe(0) // no LLM call queued or consumed
    })

    it('second uncovered ZIP ends the conversation gracefully', async () => {
      const result = await processLeadMessage({
        message: '10001',
        sessionId: 's2',
        history: [],
        context: ctx({ name: 'Jane', phone: '7045551234', zipRejectedCount: 1 }),
      })
      expect(result.message).toMatch(/can't help right now/)
      expect(result.context.zipRejectedCount).toBe(2)
      expect(mockState.insertedRows).toHaveLength(0) // not saved
    })
  })

  describe('attempt counter (the bug we just fixed)', () => {
    it('only increments the asked field, not all missing fields', async () => {
      // Customer is being asked for name (askedField=name). They reply off-topic.
      queueLLM(textChoice("I'm only able to help with cleaning questions 😊 What's your name?"))
      const result = await processLeadMessage({
        message: 'do you do windows?',
        sessionId: 's1',
        history: [],
        context: ctx(),
      })
      expect(result.context.attempts).toEqual({ name: 1, phone: 0, zip: 0, address: 0 })
    })

    it('does not increment when the asked field was filled this turn', async () => {
      queueLLM(textChoice('Got it! What is your ZIP?'))
      const result = await processLeadMessage({
        message: '7045551234',
        sessionId: 's1',
        history: [],
        context: ctx({ name: 'John' }), // askedField=phone
      })
      expect(result.context.attempts.phone).toBe(0)
    })
  })

  describe('off-topic counter', () => {
    it('increments on off-topic message', async () => {
      queueLLM(textChoice('I only help with cleaning. What is your name?'))
      const result = await processLeadMessage({
        message: 'whats the weather like?',
        sessionId: 's1',
        history: [],
        context: ctx(),
      })
      expect(result.context.offTopicCount).toBe(1)
    })

    it('does not increment on compound confirmation ("yes please")', async () => {
      queueLLM(textChoice('Great!'))
      const result = await processLeadMessage({
        message: 'yes please',
        sessionId: 's1',
        history: [],
        context: ctx({ name: 'John', phone: '7045551234', zip: '28202', zipConfirmed: true, address: '123 Main St', offTopicCount: 2 }),
      })
      expect(result.context.offTopicCount).toBe(0) // reset, not incremented
    })

    it('resets on on-topic reply', async () => {
      queueLLM(textChoice('Nice to meet you!'))
      const result = await processLeadMessage({
        message: 'John Smith',
        sessionId: 's1',
        history: [],
        context: ctx({ offTopicCount: 2 }),
      })
      expect(result.context.offTopicCount).toBe(0)
    })
  })

  describe('false-promise detector', () => {
    it('forces save_lead when LLM says goodbye without calling the tool', async () => {
      // First call: LLM says "we'll be in touch" without calling tool.
      queueLLM(textChoice("Thanks John! We'll be in touch soon."))
      // Second (forced) call: LLM correctly calls the tool.
      queueLLM(
        toolChoice({
          name: 'John',
          phone: '7045551234',
          zip: '28202',
          address: '123 Main St',
        }),
      )

      const result = await processLeadMessage({
        message: 'yes',
        sessionId: 's1',
        history: [],
        context: ctx({ name: 'John', phone: '7045551234', zip: '28202', zipConfirmed: true, address: '123 Main St' }),
      })
      expect(result.context.leadSaved).toBe(true)
      expect(mockState.insertedRows).toHaveLength(1)
      expect(result.message).toMatch(/Perfect, John/)
    })
  })

  describe('lead_incomplete upgrade (the bug we just fixed)', () => {
    it('upgrades existing lead_incomplete row to lead on completion', async () => {
      mockState.existingRowsByPhone.set('7045551234', { id: 'old-id-42', status: 'lead_incomplete' })

      queueLLM(
        toolChoice({
          name: 'John Smith',
          phone: '7045551234',
          zip: '28202',
          address: '123 Main St',
        }),
      )

      const result = await processLeadMessage({
        message: 'yes',
        sessionId: 's1',
        history: [],
        context: ctx({ name: 'John Smith', phone: '7045551234', zip: '28202', zipConfirmed: true, address: '123 Main St' }),
      })

      expect(result.context.leadSaved).toBe(true)
      expect(result.context.leadId).toBe('old-id-42')
      expect(mockState.insertedRows).toHaveLength(0) // didn't insert a new row
      expect(mockState.updatedRows).toHaveLength(1)
      expect(mockState.updatedRows[0]).toMatchObject({
        id: 'old-id-42',
        patch: { status: 'lead', endereco_completo: '123 Main St' },
      })
      expect(result.message).toMatch(/Welcome back, John/)
    })

    it('does not update when existing row is already a regular lead', async () => {
      mockState.existingRowsByPhone.set('7045551234', { id: 'old-id-7', status: 'lead' })

      queueLLM(
        toolChoice({
          name: 'John',
          phone: '7045551234',
          zip: '28202',
          address: '123 Main St',
        }),
      )

      const result = await processLeadMessage({
        message: 'yes',
        sessionId: 's1',
        history: [],
        context: ctx({ name: 'John', phone: '7045551234', zip: '28202', zipConfirmed: true, address: '123 Main St' }),
      })

      expect(result.context.leadId).toBe('old-id-7')
      expect(mockState.updatedRows).toHaveLength(0) // no update for already-complete leads
    })
  })

  describe('5+ attempts on a non-phone field triggers lead_incomplete save', () => {
    it('saves as lead_incomplete when stuck on address and we have name+phone', async () => {
      queueLLM(textChoice('Let me have someone from our team give you a call.'))

      const result = await processLeadMessage({
        message: 'huh?',
        sessionId: 's1',
        history: [],
        context: ctx({
          name: 'John',
          phone: '7045551234',
          zip: '28202',
          zipConfirmed: true,
          attempts: { name: 0, phone: 0, zip: 0, address: 4 }, // will become 5 after this turn
        }),
      })

      expect(result.context.attempts.address).toBe(5)
      expect(result.context.leadSaved).toBe(true)
      expect(mockState.insertedRows).toHaveLength(1)
      expect(mockState.insertedRows[0]).toMatchObject({
        nome: 'John',
        telefone: '7045551234',
        status: 'lead_incomplete',
      })
    })
  })

  describe('post-save flow', () => {
    it('does not ask for more info or call the tool', async () => {
      queueLLM(textChoice('You bet, John! 😊'))

      const result = await processLeadMessage({
        message: 'thanks!',
        sessionId: 's1',
        history: [],
        context: ctx({
          name: 'John',
          phone: '7045551234',
          zip: '28202',
          zipConfirmed: true,
          address: '123 Main St',
          leadSaved: true,
          leadId: 'mock-1',
        }),
      })

      expect(result.context.leadSaved).toBe(true)
      expect(mockState.insertedRows).toHaveLength(0) // no save side effects
      expect(result.message).toBe('You bet, John! 😊')
    })
  })
})

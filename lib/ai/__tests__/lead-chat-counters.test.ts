import { defaultLeadContext } from '@/types/lead-chat'

// Mock supabase server module — these helpers are pure but module imports
// pull in the agent which imports the supabase admin client at module load.
jest.mock('@/lib/supabase/server', () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          contains: () => ({ limit: async () => ({ data: [], error: null }) }),
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
    }),
  }),
}))

import {
  looksLikeFalsePromiseForTest,
  isLikelyOffTopicForTest,
  incrementAttemptsForTest,
  nextFieldKeyForTest,
} from '../lead-chat-agent'

describe('looksLikeFalsePromise', () => {
  const fullCtx = {
    ...defaultLeadContext(),
    name: 'John',
    phone: '7045551234',
    zip: '28202',
    zipConfirmed: true,
    address: '123 Main St',
  }

  it('flags goodbye text when all fields present and not saved', () => {
    expect(looksLikeFalsePromiseForTest("Thanks! We'll be in touch soon.", fullCtx)).toBe(true)
  })

  it('does not flag if leadSaved=true', () => {
    expect(looksLikeFalsePromiseForTest("Talk soon!", { ...fullCtx, leadSaved: true })).toBe(false)
  })

  it('does not flag if a field is missing', () => {
    expect(looksLikeFalsePromiseForTest("Talk soon!", { ...fullCtx, address: null })).toBe(false)
  })

  it('does not flag if zipConfirmed is false even if zip is set', () => {
    expect(looksLikeFalsePromiseForTest("Talk soon!", { ...fullCtx, zipConfirmed: false })).toBe(false)
  })

  it('does not flag normal asking messages', () => {
    expect(looksLikeFalsePromiseForTest("What's your phone number?", fullCtx)).toBe(false)
  })
})

describe('isLikelyOffTopic', () => {
  it('flags arbitrary question when nothing extracted and no tool call', () => {
    expect(isLikelyOffTopicForTest('What is the weather today?', {}, false)).toBe(true)
  })

  it('does not flag when tool was called', () => {
    expect(isLikelyOffTopicForTest('whatever', {}, true)).toBe(false)
  })

  it('does not flag when something was extracted', () => {
    expect(isLikelyOffTopicForTest('John', { name: 'John' }, false)).toBe(false)
  })

  it('does not flag short confirmations', () => {
    expect(isLikelyOffTopicForTest('yes', {}, false)).toBe(false)
    expect(isLikelyOffTopicForTest('ok', {}, false)).toBe(false)
  })

  it('does not flag compound confirmations', () => {
    expect(isLikelyOffTopicForTest('yes please', {}, false)).toBe(false)
    expect(isLikelyOffTopicForTest("that's right", {}, false)).toBe(false)
    expect(isLikelyOffTopicForTest('sounds good', {}, false)).toBe(false)
    expect(isLikelyOffTopicForTest('yeah sure', {}, false)).toBe(false)
  })

  it('does not flag mid-typing digits', () => {
    expect(isLikelyOffTopicForTest('704', {}, false)).toBe(false)
  })
})

describe('nextFieldKey', () => {
  it('returns name when nothing collected', () => {
    expect(nextFieldKeyForTest(defaultLeadContext())).toBe('name')
  })

  it('returns phone after name is set', () => {
    expect(nextFieldKeyForTest({ ...defaultLeadContext(), name: 'John' })).toBe('phone')
  })

  it('returns zip after name+phone are set', () => {
    expect(nextFieldKeyForTest({ ...defaultLeadContext(), name: 'John', phone: '7045551234' })).toBe('zip')
  })

  it('returns address after zip is confirmed', () => {
    expect(
      nextFieldKeyForTest({
        ...defaultLeadContext(),
        name: 'John',
        phone: '7045551234',
        zip: '28202',
        zipConfirmed: true,
      }),
    ).toBe('address')
  })

  it('returns null when all fields collected', () => {
    expect(
      nextFieldKeyForTest({
        ...defaultLeadContext(),
        name: 'John',
        phone: '7045551234',
        zip: '28202',
        zipConfirmed: true,
        address: '123 Main St',
      }),
    ).toBe(null)
  })
})

describe('incrementAttempts', () => {
  const baseCtx = defaultLeadContext()

  it('does nothing when askedField is null', () => {
    const result = incrementAttemptsForTest(baseCtx, baseCtx, null)
    expect(result).toEqual({ name: 0, phone: 0, zip: 0, address: 0 })
  })

  it('does not increment when the asked field was filled this turn', () => {
    const after = { ...baseCtx, name: 'John' }
    const result = incrementAttemptsForTest(baseCtx, after, 'name')
    expect(result).toEqual({ name: 0, phone: 0, zip: 0, address: 0 })
  })

  it('increments only the asked field when still missing', () => {
    const result = incrementAttemptsForTest(baseCtx, baseCtx, 'name')
    expect(result).toEqual({ name: 1, phone: 0, zip: 0, address: 0 })
  })

  it('does not bleed counters across fields (off-topic on name turn does not bump phone)', () => {
    const before = { ...baseCtx, attempts: { name: 2, phone: 0, zip: 0, address: 0 } }
    const result = incrementAttemptsForTest(before, before, 'name')
    expect(result).toEqual({ name: 3, phone: 0, zip: 0, address: 0 })
  })

  it('uses zipConfirmed (not zip) to decide if zip is still missing', () => {
    // Customer typed 99999, extraction set zip=null but zipRejected handled it elsewhere.
    // For this test: zip stays unconfirmed, counter should bump.
    const after = { ...baseCtx, zip: null, zipConfirmed: false }
    const result = incrementAttemptsForTest(baseCtx, after, 'zip')
    expect(result).toEqual({ name: 0, phone: 0, zip: 1, address: 0 })
  })
})

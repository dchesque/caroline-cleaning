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

  it('does not flag mid-typing digits', () => {
    expect(isLikelyOffTopicForTest('704', {}, false)).toBe(false)
  })
})

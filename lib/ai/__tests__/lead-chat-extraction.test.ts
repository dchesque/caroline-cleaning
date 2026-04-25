import { extractPartialContextForTest } from '../lead-chat-agent'
import { defaultLeadContext } from '@/types/lead-chat'

jest.mock('@/lib/supabase/server', () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          contains: () => ({
            limit: async () => ({ data: [{ id: 'fake' }], error: null }),
          }),
        }),
      }),
    }),
  }),
}))

describe('extractPartialContext — name', () => {
  const empty = defaultLeadContext()

  it('extracts a single first name', async () => {
    const { updates } = await extractPartialContextForTest([], 'John', empty)
    expect(updates.name).toBe('John')
  })

  it('extracts a two-word name', async () => {
    const { updates } = await extractPartialContextForTest([], 'John Smith', empty)
    expect(updates.name).toBe('John Smith')
  })

  it('extracts hyphenated names', async () => {
    const { updates } = await extractPartialContextForTest([], 'Maria-José Silva', empty)
    expect(updates.name).toBe('Maria-José Silva')
  })

  it('extracts apostrophe names', async () => {
    const { updates } = await extractPartialContextForTest([], "Sean O'Brien", empty)
    expect(updates.name).toBe("Sean O'Brien")
  })

  it('does not extract filler words', async () => {
    const { updates } = await extractPartialContextForTest([], 'yes', empty)
    expect(updates.name).toBeUndefined()
  })

  it('does not extract sentences', async () => {
    const { updates } = await extractPartialContextForTest([], 'my name is John', empty)
    expect(updates.name).toBeUndefined()
  })

  it('does not overwrite existing name', async () => {
    const ctx = { ...empty, name: 'John' }
    const { updates } = await extractPartialContextForTest([], 'Smith', ctx)
    expect(updates.name).toBeUndefined()
  })
})

describe('extractPartialContext — phone', () => {
  const empty = defaultLeadContext()

  it('extracts 10-digit phone', async () => {
    const { updates } = await extractPartialContextForTest([], '7045551234', empty)
    expect(updates.phone).toBe('7045551234')
  })

  it('extracts 10-digit phone with formatting', async () => {
    const { updates } = await extractPartialContextForTest([], '(704) 555-1234', empty)
    expect(updates.phone).toBe('7045551234')
  })

  it('extracts 11-digit phone (with country code)', async () => {
    const { updates } = await extractPartialContextForTest([], '17045551234', empty)
    expect(updates.phone).toBe('17045551234')
  })

  it('does not extract short numbers', async () => {
    const { updates } = await extractPartialContextForTest([], '12345', empty)
    expect(updates.phone).toBeUndefined()
  })
})

describe('extractPartialContext — zip', () => {
  const empty = defaultLeadContext()

  it('extracts a 5-digit zip', async () => {
    const { updates } = await extractPartialContextForTest([], '28202', empty)
    expect(updates.zip).toBe('28202')
  })

  it('does not extract 4 digits', async () => {
    const { updates } = await extractPartialContextForTest([], '2820', empty)
    expect(updates.zip).toBeUndefined()
  })
})

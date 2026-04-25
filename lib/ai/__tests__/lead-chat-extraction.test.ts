import { extractPartialContextForTest } from '../lead-chat-agent'
import { defaultLeadContext } from '@/types/lead-chat'

describe('extractPartialContext — name', () => {
  const empty = defaultLeadContext()

  it('extracts a single first name', () => {
    const out = extractPartialContextForTest([], 'John', empty)
    expect(out.name).toBe('John')
  })

  it('extracts a two-word name', () => {
    const out = extractPartialContextForTest([], 'John Smith', empty)
    expect(out.name).toBe('John Smith')
  })

  it('extracts hyphenated names', () => {
    const out = extractPartialContextForTest([], 'Maria-José Silva', empty)
    expect(out.name).toBe('Maria-José Silva')
  })

  it('extracts apostrophe names', () => {
    const out = extractPartialContextForTest([], "Sean O'Brien", empty)
    expect(out.name).toBe("Sean O'Brien")
  })

  it('does not extract filler words', () => {
    const out = extractPartialContextForTest([], 'yes', empty)
    expect(out.name).toBeUndefined()
  })

  it('does not extract sentences', () => {
    const out = extractPartialContextForTest([], 'my name is John', empty)
    expect(out.name).toBeUndefined()
  })

  it('does not overwrite existing name', () => {
    const ctx = { ...empty, name: 'John' }
    const out = extractPartialContextForTest([], 'Smith', ctx)
    expect(out.name).toBeUndefined()
  })
})

describe('extractPartialContext — phone', () => {
  const empty = defaultLeadContext()

  it('extracts 10-digit phone', () => {
    const out = extractPartialContextForTest([], '7045551234', empty)
    expect(out.phone).toBe('7045551234')
  })

  it('extracts 10-digit phone with formatting', () => {
    const out = extractPartialContextForTest([], '(704) 555-1234', empty)
    expect(out.phone).toBe('7045551234')
  })

  it('extracts 11-digit phone (with country code)', () => {
    const out = extractPartialContextForTest([], '17045551234', empty)
    expect(out.phone).toBe('17045551234')
  })

  it('does not extract short numbers', () => {
    const out = extractPartialContextForTest([], '12345', empty)
    expect(out.phone).toBeUndefined()
  })
})

describe('extractPartialContext — zip', () => {
  const empty = defaultLeadContext()

  it('extracts a 5-digit zip', () => {
    const out = extractPartialContextForTest([], '28202', empty)
    expect(out.zip).toBe('28202')
  })

  it('does not extract 4 digits', () => {
    const out = extractPartialContextForTest([], '2820', empty)
    expect(out.zip).toBeUndefined()
  })
})

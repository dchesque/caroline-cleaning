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

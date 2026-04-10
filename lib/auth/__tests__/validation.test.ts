// lib/auth/__tests__/validation.test.ts
// Unit tests for password validation rules.
// Rules mirror the Supabase email provider config:
// min 8 chars, lowercase, uppercase, digit, symbol.

import { validatePassword } from '../validation'

describe('validatePassword', () => {
  it('returns all rules false for empty string', () => {
    const { rules, valid } = validatePassword('')
    expect(rules.minLength).toBe(false)
    expect(rules.lowercase).toBe(false)
    expect(rules.uppercase).toBe(false)
    expect(rules.digit).toBe(false)
    expect(rules.symbol).toBe(false)
    expect(valid).toBe(false)
  })

  it('flags minLength false for 7 chars and true for 8', () => {
    expect(validatePassword('Ab1!abc').rules.minLength).toBe(false)
    expect(validatePassword('Ab1!abcd').rules.minLength).toBe(true)
  })

  it('detects lowercase letters', () => {
    expect(validatePassword('ABCDEFG1!').rules.lowercase).toBe(false)
    expect(validatePassword('ABCDEFGa1!').rules.lowercase).toBe(true)
  })

  it('detects uppercase letters', () => {
    expect(validatePassword('abcdefg1!').rules.uppercase).toBe(false)
    expect(validatePassword('abcdefgA1!').rules.uppercase).toBe(true)
  })

  it('detects digits', () => {
    expect(validatePassword('abcdefgA!').rules.digit).toBe(false)
    expect(validatePassword('abcdefgA1!').rules.digit).toBe(true)
  })

  it('detects symbols (non-alphanumeric)', () => {
    expect(validatePassword('abcdefgA1').rules.symbol).toBe(false)
    expect(validatePassword('abcdefgA1!').rules.symbol).toBe(true)
    expect(validatePassword('abcdefgA1@').rules.symbol).toBe(true)
    expect(validatePassword('abcdefgA1 ').rules.symbol).toBe(true) // space counts
  })

  it('returns valid=true only when all five rules pass', () => {
    expect(validatePassword('Abcdefg1!').valid).toBe(true)
    expect(validatePassword('Short1!').valid).toBe(false)   // too short
    expect(validatePassword('abcdefg1!').valid).toBe(false) // no upper
    expect(validatePassword('ABCDEFG1!').valid).toBe(false) // no lower
    expect(validatePassword('Abcdefgh!').valid).toBe(false) // no digit
    expect(validatePassword('Abcdefg1').valid).toBe(false)  // no symbol
  })
})

// lib/ai/state-machine/__tests__/validators.test.ts
// Unit tests for all validator/helper functions

import {
  normalizePhone,
  formatPhone,
  extractZipFromAddress,
  isFutureDate,
  isSunday,
  getDurationForService,
} from '../validators'

// ─────────────────────────────────────────────────────────────
// normalizePhone
// ─────────────────────────────────────────────────────────────

describe('normalizePhone', () => {
  it('returns 10 digits unchanged when already clean', () => {
    expect(normalizePhone('7045551234')).toBe('7045551234')
  })

  it('strips dashes', () => {
    expect(normalizePhone('704-555-1234')).toBe('7045551234')
  })

  it('strips parentheses and spaces', () => {
    expect(normalizePhone('(704) 555-1234')).toBe('7045551234')
  })

  it('strips dots', () => {
    expect(normalizePhone('704.555.1234')).toBe('7045551234')
  })

  it('removes leading country code 1 when 11 digits', () => {
    expect(normalizePhone('17045551234')).toBe('7045551234')
  })

  it('removes +1 prefix', () => {
    expect(normalizePhone('+17045551234')).toBe('7045551234')
  })

  it('removes +1 with formatting', () => {
    expect(normalizePhone('+1 (704) 555-1234')).toBe('7045551234')
  })

  it('returns null for too few digits', () => {
    expect(normalizePhone('12345')).toBeNull()
  })

  it('returns null for too many digits (not starting with 1)', () => {
    expect(normalizePhone('27045551234')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(normalizePhone('')).toBeNull()
  })

  it('returns null for non-numeric text', () => {
    expect(normalizePhone('call me maybe')).toBeNull()
  })

  it('handles 9-digit input returning null', () => {
    expect(normalizePhone('704555123')).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────
// formatPhone
// ─────────────────────────────────────────────────────────────

describe('formatPhone', () => {
  it('formats a 10-digit number as (XXX) XXX-XXXX', () => {
    expect(formatPhone('7045551234')).toBe('(704) 555-1234')
  })

  it('returns the input unchanged when it is not 10 digits', () => {
    expect(formatPhone('12345')).toBe('12345')
  })

  it('returns empty string unchanged', () => {
    expect(formatPhone('')).toBe('')
  })

  it('correctly positions all three segments', () => {
    // area code, prefix, line
    const result = formatPhone('2025551234')
    expect(result).toBe('(202) 555-1234')
  })
})

// ─────────────────────────────────────────────────────────────
// extractZipFromAddress
// ─────────────────────────────────────────────────────────────

describe('extractZipFromAddress', () => {
  it('extracts a 5-digit ZIP from a full address', () => {
    expect(extractZipFromAddress('123 Main St, Fort Mill, SC 29708')).toBe('29708')
  })

  it('extracts ZIP from ZIP+4 format', () => {
    expect(extractZipFromAddress('123 Main St, Charlotte, NC 28202-1234')).toBe('28202')
  })

  it('returns the first 5-digit sequence found', () => {
    expect(extractZipFromAddress('PO Box 12345')).toBe('12345')
  })

  it('returns null when no ZIP is present', () => {
    expect(extractZipFromAddress('123 Main St, Charlotte, NC')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(extractZipFromAddress('')).toBeNull()
  })

  it('returns null for null-like falsy values', () => {
    // The function guards against falsy input
    expect(extractZipFromAddress(null as unknown as string)).toBeNull()
  })

  it('does not match a 4-digit sequence', () => {
    expect(extractZipFromAddress('Suite 1234, No ZIP here')).toBeNull()
  })

  it('does not match a 6-digit sequence as a ZIP', () => {
    // 6-digit number should not be extracted as a 5-digit ZIP (word boundary)
    expect(extractZipFromAddress('Order 123456 processed')).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────
// isFutureDate
// ─────────────────────────────────────────────────────────────

describe('isFutureDate', () => {
  it('returns true for a clearly future date', () => {
    expect(isFutureDate('2099-12-31')).toBe(true)
  })

  it('returns false for a clearly past date', () => {
    expect(isFutureDate('2000-01-01')).toBe(false)
  })

  it('returns true for today (date >= today in NY timezone)', () => {
    // Build today's date string in America/New_York for the comparison
    const nowStr = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
    const now = new Date(nowStr)
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    expect(isFutureDate(todayStr)).toBe(true)
  })

  it('returns false for yesterday', () => {
    const nowStr = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
    const now = new Date(nowStr)
    now.setDate(now.getDate() - 1)
    const yesterdayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    expect(isFutureDate(yesterdayStr)).toBe(false)
  })

  it('returns true for tomorrow', () => {
    const nowStr = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
    const now = new Date(nowStr)
    now.setDate(now.getDate() + 1)
    const tomorrowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    expect(isFutureDate(tomorrowStr)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────
// isSunday
// ─────────────────────────────────────────────────────────────

describe('isSunday', () => {
  it('returns true for a known Sunday', () => {
    // 2026-04-05 is a Sunday
    expect(isSunday('2026-04-05')).toBe(true)
  })

  it('returns false for a known Monday', () => {
    // 2026-04-06 is a Monday
    expect(isSunday('2026-04-06')).toBe(false)
  })

  it('returns false for a Saturday', () => {
    // 2026-04-04 is a Saturday
    expect(isSunday('2026-04-04')).toBe(false)
  })

  it('returns false for a midweek day', () => {
    // 2026-04-08 is a Wednesday
    expect(isSunday('2026-04-08')).toBe(false)
  })

  it('returns true for another Sunday far in the future', () => {
    // 2030-01-06 is a Sunday
    expect(isSunday('2030-01-06')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────
// getDurationForService
// ─────────────────────────────────────────────────────────────

describe('getDurationForService', () => {
  it('returns 120 for "regular"', () => {
    expect(getDurationForService('regular')).toBe(120)
  })

  it('returns 180 for "deep"', () => {
    expect(getDurationForService('deep')).toBe(180)
  })

  it('returns 180 for "deep_cleaning"', () => {
    expect(getDurationForService('deep_cleaning')).toBe(180)
  })

  it('returns 240 for "move_in_out"', () => {
    expect(getDurationForService('move_in_out')).toBe(240)
  })

  it('returns 240 for "move_in"', () => {
    expect(getDurationForService('move_in')).toBe(240)
  })

  it('returns 240 for "move_out"', () => {
    expect(getDurationForService('move_out')).toBe(240)
  })

  it('returns 240 for "post_construction"', () => {
    expect(getDurationForService('post_construction')).toBe(240)
  })

  it('returns 120 for "office"', () => {
    expect(getDurationForService('office')).toBe(120)
  })

  it('normalizes input to lowercase', () => {
    expect(getDurationForService('REGULAR')).toBe(120)
    expect(getDurationForService('Deep')).toBe(180)
  })

  it('normalizes spaces to underscores', () => {
    expect(getDurationForService('move in out')).toBe(240)
    expect(getDurationForService('deep cleaning')).toBe(180)
  })

  it('normalizes hyphens to underscores', () => {
    expect(getDurationForService('move-in-out')).toBe(240)
    expect(getDurationForService('deep-cleaning')).toBe(180)
  })

  it('returns 120 as default for unknown service types', () => {
    expect(getDurationForService('unknown_service')).toBe(120)
    expect(getDurationForService('')).toBe(120)
  })
})

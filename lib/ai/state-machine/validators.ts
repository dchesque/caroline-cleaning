// lib/ai/state-machine/validators.ts
// Helper functions for validation and normalization

/**
 * Normalize a phone input to a 10-digit US phone number.
 * Strips all non-digits, removes leading +1 or 1 if 11 digits.
 * Returns the 10-digit string or null if invalid.
 */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, '')

  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.slice(1)
  }

  if (digits.length === 10) {
    return digits
  }

  return null
}

/**
 * Format a 10-digit phone number as (XXX) XXX-XXXX.
 */
export function formatPhone(phone: string): string {
  if (phone.length !== 10) return phone
  return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`
}

/**
 * Extract a 5-digit US ZIP code from an address string.
 * Returns the ZIP or null if not found.
 */
export function extractZipFromAddress(address: string): string | null {
  if (!address) return null
  const match = address.match(/\b(\d{5})(?:-\d{4})?\b/)
  return match ? match[1] : null
}

/**
 * Check if a date string (YYYY-MM-DD) is in the future compared to today in NY timezone.
 */
export function isFutureDate(dateStr: string): boolean {
  const nowStr = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
  const now = new Date(nowStr)
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return dateStr >= todayStr
}

/**
 * Check if a date string (YYYY-MM-DD) falls on a Sunday.
 */
export function isSunday(dateStr: string): boolean {
  // Parse as noon UTC to avoid timezone shifting the day
  const date = new Date(dateStr + 'T12:00:00Z')
  return date.getUTCDay() === 0
}

/**
 * Return the default duration in minutes for a given service type.
 */
export function getDurationForService(serviceType: string): number {
  const durations: Record<string, number> = {
    regular: 120,
    deep: 180,
    deep_cleaning: 180,
    move_in_out: 240,
    move_in: 240,
    move_out: 240,
    post_construction: 240,
    office: 120,
  }

  const key = serviceType.toLowerCase().replace(/[\s-]/g, '_')
  return durations[key] ?? 120
}

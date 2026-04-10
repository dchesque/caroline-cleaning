// lib/auth/validation.ts
// Pure password validation matching the Supabase email provider config:
// - Minimum 8 characters
// - At least one lowercase, uppercase, digit, and symbol
//
// This is the single source of truth used by both `new-password-form.tsx`
// (for submit gating) and `password-requirements.tsx` (for live UI feedback).

export interface PasswordRules {
  minLength: boolean
  lowercase: boolean
  uppercase: boolean
  digit: boolean
  symbol: boolean
}

export interface PasswordValidationResult {
  rules: PasswordRules
  valid: boolean
}

export function validatePassword(pw: string): PasswordValidationResult {
  const rules: PasswordRules = {
    minLength: pw.length >= 8,
    lowercase: /[a-z]/.test(pw),
    uppercase: /[A-Z]/.test(pw),
    digit: /[0-9]/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  }
  const valid =
    rules.minLength &&
    rules.lowercase &&
    rules.uppercase &&
    rules.digit &&
    rules.symbol
  return { rules, valid }
}

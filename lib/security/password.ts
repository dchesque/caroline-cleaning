// lib/security/password.ts
export type PasswordValidationResult =
  | { valid: true }
  | { valid: false; error: string };

export function validatePassword(password: string): PasswordValidationResult {
  if (typeof password !== 'string') {
    return { valid: false, error: 'Password must be a string' };
  }
  if (password.length < 12) {
    return { valid: false, error: 'Password must be at least 12 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain an uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain a lowercase letter' };
  }
  if (!/\d/.test(password)) {
    return { valid: false, error: 'Password must contain a number' };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain a special character' };
  }
  if (/(.)\1{3,}/.test(password)) {
    return { valid: false, error: 'Password cannot contain 4+ repeating characters' };
  }
  return { valid: true };
}

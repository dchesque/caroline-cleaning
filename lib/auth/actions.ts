// lib/auth/actions.ts
// Thin wrappers around supabase.auth.* calls used by auth forms.
//
// All functions return { error: string | null } where error is a
// user-facing message. Forms only need to check `error` — they never
// see the raw Supabase AuthError.
//
// Admin-only app: all entry flows use shouldCreateUser: false so we
// never auto-provision accounts from the login page.

import { createClient } from '@/lib/supabase/client'

export interface ActionResult {
  error: string | null
}

/**
 * Map common Supabase auth error messages to friendlier copy.
 * Unknown messages pass through unchanged.
 */
function normalizeError(message: string | undefined): string {
  if (!message) return 'Something went wrong. Please try again.'
  const lower = message.toLowerCase()
  if (lower.includes('invalid login credentials')) {
    return 'Invalid email or password.'
  }
  if (lower.includes('rate limit') || lower.includes('too many')) {
    return 'Too many attempts. Please wait a minute and try again.'
  }
  if (lower.includes('token has expired') || lower.includes('otp_expired')) {
    return 'That code has expired. Please request a new one.'
  }
  if (lower.includes('invalid token') || lower.includes('otp')) {
    return 'Invalid or expired code. Please try again.'
  }
  if (lower.includes('same as the old password') || lower.includes('new password should be different')) {
    return 'New password must be different from your current one.'
  }
  if (lower.includes('auth session missing')) {
    return 'Your session expired. Please request a new reset link.'
  }
  return message
}

export async function signInWithPassword(
  email: string,
  password: string
): Promise<ActionResult> {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return { error: error ? normalizeError(error.message) : null }
}

export async function requestOtp(email: string): Promise<ActionResult> {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  })
  return { error: error ? normalizeError(error.message) : null }
}

export async function verifyOtp(
  email: string,
  token: string
): Promise<ActionResult> {
  const supabase = createClient()
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })
  return { error: error ? normalizeError(error.message) : null }
}

export async function requestPasswordReset(email: string): Promise<ActionResult> {
  const supabase = createClient()
  // Supabase will append ?code=<hash>&type=recovery to this URL.
  // Don't encode here - Supabase handles it internally.
  const redirectTo = `${window.location.origin}/auth/callback?next=/login?mode=new-password`
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  })
  return { error: error ? normalizeError(error.message) : null }
}

export async function updatePassword(newPassword: string): Promise<ActionResult> {
  const supabase = createClient()
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  return { error: error ? normalizeError(error.message) : null }
}

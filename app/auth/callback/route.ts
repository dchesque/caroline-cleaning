// app/auth/callback/route.ts
// GET handler for the Supabase password-recovery email link.
//
// Flow:
//   1. User clicks the reset link in their email
//   2. Supabase redirects here with ?code=<PKCE>&next=<url>
//   3. We exchange the code for a recovery-scoped session (cookies set)
//   4. Redirect to `next` (usually /login?mode=new-password)
//
// On any failure, redirect to /login?error=recovery_expired so the
// login page can show a "your reset link expired" banner.

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/admin'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=recovery_expired`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=recovery_expired`)
  }

  // `next` comes from our own resetPasswordForEmail redirectTo; it's safe,
  // but resolve it against origin to guarantee we never redirect off-site.
  return NextResponse.redirect(new URL(next, origin))
}

# Supabase Auth Complete Login Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current password-only `/login` with a single-page component that supports email+password, 6-digit email OTP, and complete password recovery — all on one page via an internal state machine.

**Architecture:** One `LoginCard` client component owns a 5-state `mode` machine (`password | otp-request | otp-verify | forgot | new-password`). Each mode renders its own isolated form. All Supabase calls live in `lib/auth/actions.ts`. A new `app/auth/callback/route.ts` handles the recovery email link via `exchangeCodeForSession`. `middleware.ts` gets a single-line exception so the recovery flow can reach the new-password form despite having an active session.

**Tech Stack:** Next.js 15 App Router, `@supabase/ssr`, Shadcn UI primitives, Lucide icons, Jest (ts-jest, node env) for the one piece of pure logic we'll test (`validation.ts`).

**Spec:** [`docs/superpowers/specs/2026-04-09-supabase-auth-complete-design.md`](../specs/2026-04-09-supabase-auth-complete-design.md)

---

## File Structure

**New files (10):**

| File | Responsibility | Type |
|---|---|---|
| `lib/auth/validation.ts` | Pure password validation (5 rules matching Supabase config) | module |
| `lib/auth/__tests__/validation.test.ts` | Unit tests for validation | test |
| `lib/auth/actions.ts` | Thin wrappers around `supabase.auth.*`, normalized errors | module |
| `app/auth/callback/route.ts` | GET handler — exchange recovery code for session | route |
| `components/auth/password-requirements.tsx` | Live checklist of 5 rules | client component |
| `components/auth/forms/password-form.tsx` | Email + password form | client component |
| `components/auth/forms/otp-request-form.tsx` | Email → send code | client component |
| `components/auth/forms/otp-verify-form.tsx` | 6-digit code → verify + resend cooldown | client component |
| `components/auth/forms/forgot-password-form.tsx` | Email → send reset link | client component |
| `components/auth/forms/new-password-form.tsx` | New password + confirm + requirements | client component |
| `components/auth/login-card.tsx` | State machine, renders one form at a time | client component |

**Modified files (2):**

| File | Change |
|---|---|
| `app/(auth)/login/page.tsx` | Becomes thin wrapper, delegates to `LoginCard`; keeps existing two-column visual shell |
| `middleware.ts` | Add `mode !== 'new-password'` guard in the `isLoginPage && user` redirect branch |

**Design rationale:** Each form is self-contained and receives only `onSuccess`/`onSwitchMode`/etc callbacks via props. They do not know about other forms or about the `mode` variable. `LoginCard` is the only component that knows the state machine. `lib/auth/actions.ts` is the only module that imports `@/lib/supabase/client`. This layering makes each file small (~50–120 LOC), individually readable, and easy to modify later.

---

## Testing Strategy

This project uses Jest with `testEnvironment: 'node'` and no React testing library. We therefore write automated tests only for pure logic:

- **Automated (Jest):** `lib/auth/validation.ts` (Task 1)
- **Manual (browser via preview tools):** every component and flow (Task 13 checklist)

Tests run with `npx jest <path>` — there is no `test` npm script. The project's existing tests live in `lib/ai/state-machine/__tests__/`; follow the same pattern (see `lib/ai/state-machine/__tests__/validators.test.ts`).

---

## Commit Strategy

Commit after each task. Use conventional commits with `feat(auth):`, `test(auth):`, or `refactor(auth):` prefixes. All commits must end with the `Co-Authored-By` trailer per repo convention.

---

## Task 1: Password Validation (Pure Logic + Tests)

**Files:**
- Create: `lib/auth/validation.ts`
- Create: `lib/auth/__tests__/validation.test.ts`

**Context:** This is the single source of truth for password rules. Both `new-password-form.tsx` and `password-requirements.tsx` import from here. Rules mirror the Supabase config exactly: min 8, lower, upper, digit, symbol.

- [ ] **Step 1.1: Write the failing test**

Create `lib/auth/__tests__/validation.test.ts`:

```typescript
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
```

- [ ] **Step 1.2: Run test to verify it fails**

Run: `npx jest lib/auth/__tests__/validation.test.ts`
Expected: FAIL — `Cannot find module '../validation'`

- [ ] **Step 1.3: Implement `lib/auth/validation.ts`**

```typescript
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
```

- [ ] **Step 1.4: Run test to verify it passes**

Run: `npx jest lib/auth/__tests__/validation.test.ts`
Expected: PASS — all 7 tests green.

- [ ] **Step 1.5: Commit**

```bash
git add lib/auth/validation.ts lib/auth/__tests__/validation.test.ts
git commit -m "$(cat <<'EOF'
feat(auth): add pure password validation matching Supabase rules

Single source of truth for min 8 chars + lower/upper/digit/symbol.
Used by new-password form (submit gate) and password-requirements
(live UI). Node-env Jest tests cover all rule boundaries.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Auth Actions Module

**Files:**
- Create: `lib/auth/actions.ts`

**Context:** This is the only place that calls `supabase.auth.*`. Every form imports from here. Each function returns `{ error: string | null }` — error is a user-facing message (normalized), not the raw Supabase error object. This is the seam where future logging would hook in.

We use the **browser** client (`@/lib/supabase/client`) because every action runs in response to a user click in a client component. The server client is only used inside the `/auth/callback` route.

- [ ] **Step 2.1: Create `lib/auth/actions.ts`**

```typescript
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
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent('/login?mode=new-password')}`
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
```

- [ ] **Step 2.2: Type-check compile**

Run: `npx tsc --noEmit`
Expected: no errors referencing `lib/auth/actions.ts`.

- [ ] **Step 2.3: Commit**

```bash
git add lib/auth/actions.ts
git commit -m "$(cat <<'EOF'
feat(auth): add auth actions module wrapping supabase.auth calls

Single entry point for all client-side Supabase auth calls with
normalized user-facing error messages. Admin-only: shouldCreateUser
is false on OTP request.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Auth Callback Route

**Files:**
- Create: `app/auth/callback/route.ts`

**Context:** When the user clicks the password-reset link in their email, Supabase redirects them to `${origin}/auth/callback?code=<PKCE-code>&next=<url>`. This GET handler exchanges the code for a session (which creates the recovery-scoped Supabase session in cookies), then redirects to `next`. If `code` is missing or the exchange fails, redirect to `/login?error=recovery_expired` so the login page can show a banner.

Uses the **server** Supabase client from `@/lib/supabase/server` because we need to set auth cookies on the response.

- [ ] **Step 3.1: Create `app/auth/callback/route.ts`**

```typescript
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
```

- [ ] **Step 3.2: Type-check compile**

Run: `npx tsc --noEmit`
Expected: no errors referencing `app/auth/callback/route.ts`.

- [ ] **Step 3.3: Commit**

```bash
git add app/auth/callback/route.ts
git commit -m "$(cat <<'EOF'
feat(auth): add callback route for password recovery link

Exchanges PKCE code for session and redirects to next URL (usually
/login?mode=new-password). Missing code or failed exchange redirects
to /login?error=recovery_expired.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Middleware Exception

**Files:**
- Modify: `middleware.ts` (lines 82–97 approximately — the `if (isProtectedRoute || isLoginPage)` block)

**Context:** Currently, if a user has a session and visits `/login`, they're redirected to `/admin`. But after `exchangeCodeForSession` in the callback route, the user *has* a session and is then sent to `/login?mode=new-password` — they'd bounce to `/admin` without ever setting the new password. The fix is a single guard: skip the redirect when `?mode=new-password`.

- [ ] **Step 4.1: Read current middleware to confirm line numbers**

Run: Read `middleware.ts` to locate the exact `if (isLoginPage && user)` block.

- [ ] **Step 4.2: Apply edit**

Edit `middleware.ts` — replace:

```typescript
        if (isLoginPage && user) {
            const url = request.nextUrl.clone()
            url.pathname = '/admin'
            return applySecurityHeaders(NextResponse.redirect(url))
        }
```

with:

```typescript
        if (isLoginPage && user) {
            // Exception: the password-recovery flow lands on /login?mode=new-password
            // *with* an active recovery session. Without this guard the middleware
            // would bounce the user to /admin before they can set their new password.
            const mode = request.nextUrl.searchParams.get('mode')
            if (mode !== 'new-password') {
                const url = request.nextUrl.clone()
                url.pathname = '/admin'
                return applySecurityHeaders(NextResponse.redirect(url))
            }
        }
```

- [ ] **Step 4.3: Type-check compile**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 4.4: Commit**

```bash
git add middleware.ts
git commit -m "$(cat <<'EOF'
feat(auth): allow /login?mode=new-password past middleware redirect

The recovery callback creates a session before the user sets the new
password, so the existing /login -> /admin redirect would break the
flow. Exempt the new-password mode explicitly.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Password Requirements Component

**Files:**
- Create: `components/auth/password-requirements.tsx`

**Context:** Small presentational component that takes a `password: string` prop and shows a live checklist of the five rules from `validatePassword`. No own state. Used only inside `new-password-form`.

- [ ] **Step 5.1: Create `components/auth/password-requirements.tsx`**

```tsx
// components/auth/password-requirements.tsx
'use client'

import { Check, Circle } from 'lucide-react'
import { validatePassword, type PasswordRules } from '@/lib/auth/validation'
import { cn } from '@/lib/utils'

interface Props {
  password: string
}

const RULE_LABELS: Array<{ key: keyof PasswordRules; label: string }> = [
  { key: 'minLength', label: 'At least 8 characters' },
  { key: 'lowercase', label: 'One lowercase letter' },
  { key: 'uppercase', label: 'One uppercase letter' },
  { key: 'digit', label: 'One number' },
  { key: 'symbol', label: 'One symbol' },
]

export function PasswordRequirements({ password }: Props) {
  const { rules } = validatePassword(password)
  return (
    <ul className="grid gap-1.5 text-xs">
      {RULE_LABELS.map(({ key, label }) => {
        const passed = rules[key]
        return (
          <li
            key={key}
            className={cn(
              'flex items-center gap-2 transition-colors',
              passed ? 'text-emerald-700' : 'text-muted-foreground'
            )}
          >
            {passed ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Circle className="h-3.5 w-3.5" />
            )}
            <span>{label}</span>
          </li>
        )
      })}
    </ul>
  )
}
```

- [ ] **Step 5.2: Type-check compile**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5.3: Commit**

```bash
git add components/auth/password-requirements.tsx
git commit -m "$(cat <<'EOF'
feat(auth): add live password requirements checklist component

Reads validatePassword rules and renders a 5-item checklist that
ticks green as the user types. No own state; takes password prop.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Password Form

**Files:**
- Create: `components/auth/forms/password-form.tsx`

**Context:** This is the default form shown on `mode=password`. It's visually identical to the current `login/page.tsx` form (email + password + Sign In button + error alert). The difference: the "Forgot your password?" and "Sign in with a code" links now call `onSwitchMode` callbacks instead of navigating. On success it calls `onSuccess()`.

Follow the visual style from the current `app/(auth)/login/page.tsx` (Input classes, button classes, Alert component) exactly so the refactor is drop-in.

- [ ] **Step 6.1: Create `components/auth/forms/password-form.tsx`**

```tsx
// components/auth/forms/password-form.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'
import { signInWithPassword } from '@/lib/auth/actions'

interface Props {
  onSuccess: () => void
  onForgotPassword: () => void
  onUseOtp: () => void
}

export function PasswordForm({ onSuccess, onForgotPassword, onUseOtp }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    const { error } = await signInWithPassword(email, password)
    if (error) {
      setError(error)
      setIsLoading(false)
      return
    }
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {error && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-2">
        <Label htmlFor="password-email">Email</Label>
        <Input
          id="password-email"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
          autoComplete="email"
          className="bg-white border-pampas focus-visible:ring-brandy-rose-500"
        />
      </div>

      <div className="grid gap-2">
        <div className="flex items-center">
          <Label htmlFor="password-password">Password</Label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="ml-auto inline-block text-sm underline-offset-4 hover:underline text-muted-foreground"
          >
            Forgot your password?
          </button>
        </div>
        <Input
          id="password-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
          autoComplete="current-password"
          className="bg-white border-pampas focus-visible:ring-brandy-rose-500"
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-brandy-rose-500 hover:bg-brandy-rose-600 text-white"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign In'
        )}
      </Button>

      <button
        type="button"
        onClick={onUseOtp}
        disabled={isLoading}
        className="text-sm text-center text-muted-foreground hover:text-brandy-rose-600 transition-colors underline-offset-4 hover:underline"
      >
        Sign in with a code instead
      </button>
    </form>
  )
}
```

- [ ] **Step 6.2: Type-check compile**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6.3: Commit**

```bash
git add components/auth/forms/password-form.tsx
git commit -m "$(cat <<'EOF'
feat(auth): add email+password form component

Extracts the current login form into a reusable component with
onSuccess, onForgotPassword, and onUseOtp callbacks. Visual style
preserved from app/(auth)/login/page.tsx.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: OTP Request Form

**Files:**
- Create: `components/auth/forms/otp-request-form.tsx`

**Context:** User enters their email and gets a 6-digit code emailed. On success (or on any error — privacy/enumeration defense per spec), we transition to `otp-verify` with the email preserved. The parent (`LoginCard`) passes `onSent(email)` for this handoff.

- [ ] **Step 7.1: Create `components/auth/forms/otp-request-form.tsx`**

```tsx
// components/auth/forms/otp-request-form.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { requestOtp } from '@/lib/auth/actions'

interface Props {
  onSent: (email: string) => void
  onBackToPassword: () => void
  initialEmail?: string
}

export function OtpRequestForm({ onSent, onBackToPassword, initialEmail = '' }: Props) {
  const [email, setEmail] = useState(initialEmail)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Per spec: advance regardless of error to avoid leaking whether
    // the account exists. Any real issue will surface on verify or resend.
    await requestOtp(email)
    onSent(email)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="otp-request-email">Email</Label>
        <Input
          id="otp-request-email"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
          autoComplete="email"
          className="bg-white border-pampas focus-visible:ring-brandy-rose-500"
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-brandy-rose-500 hover:bg-brandy-rose-600 text-white"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending code...
          </>
        ) : (
          'Send code'
        )}
      </Button>

      <button
        type="button"
        onClick={onBackToPassword}
        disabled={isLoading}
        className="text-sm text-center text-muted-foreground hover:text-brandy-rose-600 transition-colors underline-offset-4 hover:underline"
      >
        Use password instead
      </button>
    </form>
  )
}
```

- [ ] **Step 7.2: Type-check compile**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7.3: Commit**

```bash
git add components/auth/forms/otp-request-form.tsx
git commit -m "$(cat <<'EOF'
feat(auth): add OTP request form component

Email-only form that advances unconditionally on submit (privacy/
enumeration defense — real errors surface on verify/resend).

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: OTP Verify Form

**Files:**
- Create: `components/auth/forms/otp-verify-form.tsx`

**Context:** User enters the 6-digit code. On success, call `onSuccess()`. On failure, show inline error and let them retry. Also implements a 30-second client-side cooldown for the resend button. "Use different email" button calls `onBackToRequest()`.

The cooldown is a UX convenience — server-side rate limiting at Supabase is the real security control.

- [ ] **Step 8.1: Create `components/auth/forms/otp-verify-form.tsx`**

```tsx
// components/auth/forms/otp-verify-form.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'
import { requestOtp, verifyOtp } from '@/lib/auth/actions'

interface Props {
  email: string
  onSuccess: () => void
  onBackToRequest: () => void
}

const RESEND_COOLDOWN_SECONDS = 30

export function OtpVerifyForm({ email, onSuccess, onBackToRequest }: Props) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS)

  // Countdown tick
  useEffect(() => {
    if (cooldown <= 0) return
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(id)
  }, [cooldown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    const { error } = await verifyOtp(email, code)
    if (error) {
      setError(error)
      setIsLoading(false)
      return
    }
    onSuccess()
  }

  const handleResend = async () => {
    if (cooldown > 0) return
    setError(null)
    const { error } = await requestOtp(email)
    if (error) {
      setError(error)
      return
    }
    setCooldown(RESEND_COOLDOWN_SECONDS)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {error && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-2">
        <Label htmlFor="otp-code">6-digit code</Label>
        <Input
          id="otp-code"
          type="text"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          required
          disabled={isLoading}
          autoComplete="one-time-code"
          className="bg-white border-pampas focus-visible:ring-brandy-rose-500 tracking-widest text-center font-mono"
        />
        <p className="text-xs text-muted-foreground">
          Code valid for 1 hour. Check your inbox at {email}.
        </p>
      </div>

      <Button
        type="submit"
        className="w-full bg-brandy-rose-500 hover:bg-brandy-rose-600 text-white"
        disabled={isLoading || code.length !== 6}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          'Verify'
        )}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || isLoading}
          className="text-muted-foreground hover:text-brandy-rose-600 transition-colors underline-offset-4 hover:underline disabled:no-underline disabled:hover:text-muted-foreground disabled:cursor-not-allowed"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>
        <button
          type="button"
          onClick={onBackToRequest}
          disabled={isLoading}
          className="text-muted-foreground hover:text-brandy-rose-600 transition-colors underline-offset-4 hover:underline"
        >
          Use different email
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 8.2: Type-check compile**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 8.3: Commit**

```bash
git add components/auth/forms/otp-verify-form.tsx
git commit -m "$(cat <<'EOF'
feat(auth): add OTP verify form with 30s resend cooldown

6-digit numeric input with autocomplete one-time-code, resend
cooldown tracked via setTimeout, and 'use different email' back link.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Forgot Password Form

**Files:**
- Create: `components/auth/forms/forgot-password-form.tsx`

**Context:** User enters email → we call `requestPasswordReset` → we show a confirmation state. Per spec, the confirmation message is shown **unconditionally** (regardless of whether the email exists) to avoid account enumeration. The confirmation is a local state inside this form — we stay in `mode=forgot`.

- [ ] **Step 9.1: Create `components/auth/forms/forgot-password-form.tsx`**

```tsx
// components/auth/forms/forgot-password-form.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { requestPasswordReset } from '@/lib/auth/actions'

interface Props {
  onBackToPassword: () => void
}

export function ForgotPasswordForm({ onBackToPassword }: Props) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Per spec: always show the confirmation regardless of error to
    // avoid revealing whether the account exists.
    await requestPasswordReset(email)
    setIsLoading(false)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="grid gap-4">
        <Alert className="bg-emerald-50 border-emerald-200 text-emerald-900">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            If an account exists for <strong>{email}</strong>, we've sent a reset link.
            Check your inbox and click the link to set a new password.
          </AlertDescription>
        </Alert>
        <button
          type="button"
          onClick={onBackToPassword}
          className="text-sm text-center text-muted-foreground hover:text-brandy-rose-600 transition-colors underline-offset-4 hover:underline"
        >
          Back to login
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="forgot-email">Email</Label>
        <Input
          id="forgot-email"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
          autoComplete="email"
          className="bg-white border-pampas focus-visible:ring-brandy-rose-500"
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-brandy-rose-500 hover:bg-brandy-rose-600 text-white"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          'Send reset link'
        )}
      </Button>

      <button
        type="button"
        onClick={onBackToPassword}
        disabled={isLoading}
        className="text-sm text-center text-muted-foreground hover:text-brandy-rose-600 transition-colors underline-offset-4 hover:underline"
      >
        Back to login
      </button>
    </form>
  )
}
```

- [ ] **Step 9.2: Type-check compile**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 9.3: Commit**

```bash
git add components/auth/forms/forgot-password-form.tsx
git commit -m "$(cat <<'EOF'
feat(auth): add forgot password form with enumeration-safe confirmation

Shows success message regardless of outcome to avoid leaking whether
the account exists. Confirmation is local state — parent stays in
forgot mode throughout.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: New Password Form

**Files:**
- Create: `components/auth/forms/new-password-form.tsx`

**Context:** Reached via `/login?mode=new-password` after the recovery callback. Shows two password fields (new + confirm), the `PasswordRequirements` checklist, and a save button that's disabled until validation passes AND confirmation matches. On success, call `onSuccess()`. On "auth session missing" error (expired recovery session), call `onSessionExpired()` so `LoginCard` can transition to `mode=forgot`.

- [ ] **Step 10.1: Create `components/auth/forms/new-password-form.tsx`**

```tsx
// components/auth/forms/new-password-form.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'
import { updatePassword } from '@/lib/auth/actions'
import { validatePassword } from '@/lib/auth/validation'
import { PasswordRequirements } from '@/components/auth/password-requirements'

interface Props {
  onSuccess: () => void
  onSessionExpired: () => void
}

export function NewPasswordForm({ onSuccess, onSessionExpired }: Props) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { valid: passwordValid } = validatePassword(password)
  const confirmValid = confirm.length > 0 && confirm === password
  const canSubmit = passwordValid && confirmValid && !isLoading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    setIsLoading(true)
    const { error } = await updatePassword(password)
    if (error) {
      setError(error)
      setIsLoading(false)
      if (error.toLowerCase().includes('session expired')) {
        onSessionExpired()
      }
      return
    }
    onSuccess()
  }

  const showMismatch = confirm.length > 0 && confirm !== password

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {error && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-2">
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
          autoComplete="new-password"
          className="bg-white border-pampas focus-visible:ring-brandy-rose-500"
        />
        <PasswordRequirements password={password} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="confirm-password">Confirm new password</Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          disabled={isLoading}
          autoComplete="new-password"
          aria-invalid={showMismatch}
          className="bg-white border-pampas focus-visible:ring-brandy-rose-500"
        />
        {showMismatch && (
          <p className="text-xs text-destructive">Passwords do not match.</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full bg-brandy-rose-500 hover:bg-brandy-rose-600 text-white"
        disabled={!canSubmit}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          'Save new password'
        )}
      </Button>
    </form>
  )
}
```

- [ ] **Step 10.2: Type-check compile**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 10.3: Commit**

```bash
git add components/auth/forms/new-password-form.tsx
git commit -m "$(cat <<'EOF'
feat(auth): add new password form with live validation and confirm

Gates submit on all 5 password rules passing AND confirm matching.
Shows PasswordRequirements checklist live. Delegates expired-session
error to parent via onSessionExpired callback.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: LoginCard State Machine

**Files:**
- Create: `components/auth/login-card.tsx`

**Context:** The orchestrator. Owns `mode`, `otpEmail`, and optional `urlError` state. Renders exactly one form at a time with the appropriate heading/subheading. Wires all the callbacks so transitions happen locally (no navigation) except for `onSuccess` which calls `router.push('/admin')`.

The `initialMode` prop lets the parent set `mode=new-password` when the URL says so. The `initialError` prop lets the parent pass `?error=recovery_expired` through as a banner on the password mode.

- [ ] **Step 11.1: Create `components/auth/login-card.tsx`**

```tsx
// components/auth/login-card.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { PasswordForm } from '@/components/auth/forms/password-form'
import { OtpRequestForm } from '@/components/auth/forms/otp-request-form'
import { OtpVerifyForm } from '@/components/auth/forms/otp-verify-form'
import { ForgotPasswordForm } from '@/components/auth/forms/forgot-password-form'
import { NewPasswordForm } from '@/components/auth/forms/new-password-form'

export type LoginMode =
  | 'password'
  | 'otp-request'
  | 'otp-verify'
  | 'forgot'
  | 'new-password'

interface Props {
  initialMode?: LoginMode
  initialError?: string | null
}

const HEADINGS: Record<LoginMode, { title: string; subtitle: string }> = {
  password: {
    title: 'Welcome back',
    subtitle: 'Enter your credentials to access the admin dashboard',
  },
  'otp-request': {
    title: 'Sign in with a code',
    subtitle: "We'll email you a 6-digit code",
  },
  'otp-verify': {
    title: 'Check your email',
    subtitle: 'Enter the 6-digit code we just sent you',
  },
  forgot: {
    title: 'Reset your password',
    subtitle: "Enter your email and we'll send you a reset link",
  },
  'new-password': {
    title: 'Set a new password',
    subtitle: 'Choose a strong password for your account',
  },
}

export function LoginCard({ initialMode = 'password', initialError = null }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<LoginMode>(initialMode)
  const [otpEmail, setOtpEmail] = useState('')
  const [urlError, setUrlError] = useState<string | null>(initialError)

  const goToAdmin = () => {
    router.push('/admin')
    router.refresh()
  }

  // Clear URL error once the user interacts (switches mode)
  const switchMode = (next: LoginMode) => {
    setUrlError(null)
    setMode(next)
  }

  const { title, subtitle } = HEADINGS[mode]

  return (
    <div className="mx-auto grid w-full max-w-[400px] gap-6">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl sm:text-3xl font-heading font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      {urlError && mode === 'password' && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{urlError}</AlertDescription>
        </Alert>
      )}

      {mode === 'password' && (
        <PasswordForm
          onSuccess={goToAdmin}
          onForgotPassword={() => switchMode('forgot')}
          onUseOtp={() => switchMode('otp-request')}
        />
      )}

      {mode === 'otp-request' && (
        <OtpRequestForm
          initialEmail={otpEmail}
          onSent={(email) => {
            setOtpEmail(email)
            switchMode('otp-verify')
          }}
          onBackToPassword={() => switchMode('password')}
        />
      )}

      {mode === 'otp-verify' && (
        <OtpVerifyForm
          email={otpEmail}
          onSuccess={goToAdmin}
          onBackToRequest={() => switchMode('otp-request')}
        />
      )}

      {mode === 'forgot' && (
        <ForgotPasswordForm onBackToPassword={() => switchMode('password')} />
      )}

      {mode === 'new-password' && (
        <NewPasswordForm
          onSuccess={goToAdmin}
          onSessionExpired={() => switchMode('forgot')}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 11.2: Type-check compile**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 11.3: Commit**

```bash
git add components/auth/login-card.tsx
git commit -m "$(cat <<'EOF'
feat(auth): add LoginCard state machine orchestrating all auth forms

5-state mode machine (password/otp-request/otp-verify/forgot/
new-password) with headings, initial mode from URL, and optional
error banner for ?error=recovery_expired.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: Wire LoginCard Into /login Page

**Files:**
- Modify: `app/(auth)/login/page.tsx` (full rewrite, visual shell preserved)

**Context:** The current page.tsx is a client component that holds form state inline. We're replacing it with a server component that reads `searchParams`, validates `mode`, and renders `<LoginCard initialMode initialError />` inside the existing two-column visual shell. The right-side brand panel stays untouched — it's copied verbatim from the current file.

Why server component: `searchParams` is easier to read server-side and avoids an extra client-side hook. `LoginCard` itself is `'use client'`, so interactivity is fine.

- [ ] **Step 12.1: Rewrite `app/(auth)/login/page.tsx`**

Replace the entire file with:

```tsx
// app/(auth)/login/page.tsx
import { LoginCard, type LoginMode } from '@/components/auth/login-card'

const VALID_MODES: LoginMode[] = [
  'password',
  'otp-request',
  'otp-verify',
  'forgot',
  'new-password',
]

const ERROR_MESSAGES: Record<string, string> = {
  recovery_expired:
    'Your reset link has expired or is invalid. Please request a new one.',
}

interface PageProps {
  searchParams: Promise<{ mode?: string; error?: string }>
}

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams
  const mode = (VALID_MODES as string[]).includes(params.mode ?? '')
    ? (params.mode as LoginMode)
    : 'password'
  const initialError = params.error ? ERROR_MESSAGES[params.error] ?? null : null

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      {/* Left Side: Login Card */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-desert-storm">
        <LoginCard initialMode={mode} initialError={initialError} />
      </div>

      {/* Right Side: Brand Panel (unchanged) */}
      <div className="hidden bg-muted lg:block relative overflow-hidden">
        <div className="absolute inset-0 bg-brandy-rose-900" />
        <div className="absolute inset-0 bg-gradient-to-t from-brandy-rose-950/90 to-brandy-rose-900/50" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative z-10 h-full flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <span className="font-heading font-bold text-white">C</span>
            </div>
            <span className="font-heading text-xl font-medium tracking-tight">
              Chesque Premium Cleaning
            </span>
          </div>
          <div className="space-y-6 max-w-lg">
            <blockquote className="space-y-2">
              <p className="font-heading text-3xl leading-snug">
                &ldquo;Efficiency is not just about speed, it&apos;s about
                minimizing the friction for our clients. Manage your operations
                with elegance.&rdquo;
              </p>
            </blockquote>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-10 w-10 rounded-full border-2 border-brandy-rose-900 bg-brandy-rose-800 flex items-center justify-center text-xs font-medium"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div className="text-sm text-white/80">
                <div className="font-medium text-white">Trusted by our team</div>
                <div>Admin Portal v1.0</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 12.2: Type-check compile**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 12.3: Run build to catch any Next.js-specific issues**

Run: `npx next build`
Expected: build succeeds; `/login` and `/auth/callback` both appear in the route list.

- [ ] **Step 12.4: Commit**

```bash
git add "app/(auth)/login/page.tsx"
git commit -m "$(cat <<'EOF'
feat(auth): convert /login to server wrapper around LoginCard

Reads ?mode and ?error from searchParams, validates mode against the
5-state union, and delegates to LoginCard. The two-column visual
shell and brand panel are preserved unchanged.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: Manual Verification Checklist

**Files:** none (verification only)

**Context:** Jest only covers the pure validation function. Everything else must be exercised in the browser against a real Supabase project. Use the `preview_*` tools per the session preview-tools policy.

- [ ] **Step 13.1: Start dev server**

Use `mcp__Claude_Preview__preview_start` on `npm run dev`. Wait for `localhost:3000` ready.

- [ ] **Step 13.2: Happy path — password login**

Navigate to `/login`. Snapshot. Fill email + correct password. Click Sign In. Expect redirect to `/admin`. Check console logs for errors.

- [ ] **Step 13.3: Wrong password**

Navigate to `/login`. Fill email + wrong password. Click Sign In. Expect inline error "Invalid email or password." Form remains usable.

- [ ] **Step 13.4: Switch to OTP flow**

From `password` mode, click "Sign in with a code instead". Expect heading to change to "Sign in with a code". Enter valid admin email. Click "Send code". Expect transition to `otp-verify`. Check email inbox for code. Enter code. Click Verify. Expect redirect to `/admin`.

- [ ] **Step 13.5: Wrong OTP code**

Repeat OTP flow but enter a wrong 6-digit code. Expect inline error. Form remains usable for retry.

- [ ] **Step 13.6: Resend cooldown**

On `otp-verify`, observe "Resend in 30s" countdown. Verify button is disabled. After countdown reaches 0, verify button is enabled and clickable.

- [ ] **Step 13.7: Full password recovery flow**

From `password` mode, click "Forgot your password?". Enter admin email. Click "Send reset link". Expect success Alert with "If an account exists..." message. Check email inbox. Click the reset link. Expect to land on `/login?mode=new-password` with the new-password form visible.

- [ ] **Step 13.8: New password live validation**

In the new-password form, type passwords of increasing completeness and verify the checklist ticks the correct rules green one by one. Verify Save button is disabled until all 5 rules pass AND confirm matches.

- [ ] **Step 13.9: Confirm mismatch**

Enter a valid password in the first field, then a different value in confirm. Expect "Passwords do not match." error under confirm field. Save button remains disabled.

- [ ] **Step 13.10: Successful password update**

Complete new-password form with all valid inputs. Click Save. Expect redirect to `/admin`. Log out. Log in with the new password to confirm it persisted.

- [ ] **Step 13.11: Same-as-old password**

Start a new recovery flow. Enter the SAME password you just saved in step 13.10. Expect inline error "New password must be different from your current one."

- [ ] **Step 13.12: Expired recovery link**

Manually navigate to `/auth/callback` (no `?code=`). Expect redirect to `/login?error=recovery_expired`. Expect red banner on the password form: "Your reset link has expired or is invalid..."

- [ ] **Step 13.13: Middleware exception works**

In an authenticated session (after logging in fresh), manually navigate to `/login?mode=new-password`. Expect the page to render the new-password form (NOT redirect to `/admin`). Navigate to plain `/login` — expect redirect to `/admin`.

- [ ] **Step 13.14: Logged-in user visits /login**

While authenticated, navigate to `/login`. Expect redirect to `/admin`.

- [ ] **Step 13.15: Unauthenticated user visits /admin**

Log out. Navigate to `/admin`. Expect redirect to `/login`.

- [ ] **Step 13.16: Screenshot each mode for visual QA**

Take preview_screenshot of each of the five modes: password, otp-request, otp-verify, forgot (both states), new-password. Confirm the two-column layout and brand panel look identical to the original.

- [ ] **Step 13.17: Check dev server logs**

Run `mcp__Claude_Preview__preview_logs`. Verify no 500 errors, no unexpected warnings from middleware or callback route.

- [ ] **Step 13.18: Final commit (if any fixes applied)**

If any bugs were found and fixed during verification, commit them with a `fix(auth):` prefix.

---

## Completion Criteria

- All 7 Jest tests pass: `npx jest lib/auth/__tests__/validation.test.ts`
- `npx tsc --noEmit` clean
- `npx next build` succeeds
- All 16 checklist items in Task 13 pass
- Every new file is committed
- Middleware change is committed
- `/login/page.tsx` change is committed

## Risks & Gotchas

1. **Supabase email template must include `{{ .ConfirmationURL }}`** for the recovery flow to deliver the `?code=` parameter. If the user's Supabase project has a custom template that strips it, the callback will fail with "recovery_expired". Verify template if step 13.7 fails.
2. **OTP email template** must use `{{ .Token }}` (6-digit code) not `{{ .ConfirmationURL }}` — otherwise Supabase sends a magic link instead of a code and `verifyOtp` will fail. Verify template if step 13.4 fails with invalid codes.
3. **`window.location.origin` in `requestPasswordReset`** — this runs in the browser (client component), so it's safe. SSR would break it.
4. **`exchangeCodeForSession` requires PKCE mode** in Supabase — enabled by default in `@supabase/ssr`, so this should work out of the box, but worth verifying if the callback misbehaves.
5. **Middleware `searchParams.get('mode')` is case-sensitive** — matches `new-password` exactly. The `page.tsx` wrapper also validates against the union, so this is internally consistent.

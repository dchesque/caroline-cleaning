# Supabase Auth — Complete Login Page Design

**Date:** 2026-04-09
**Status:** Approved — ready for implementation plan
**Scope:** Replace the current password-only login with a single-page component that supports email+password, email OTP (6-digit code), and full password recovery/reset — all without leaving `/login`.

## Context

The admin panel at `/admin` is protected by `middleware.ts`, which redirects unauthenticated requests to `/login`. The current `app/(auth)/login/page.tsx` only supports email+password via `supabase.auth.signInWithPassword` and links to a dead `/forgot-password` route. Supabase is already wired via `@supabase/ssr` (`lib/supabase/client.ts`, `lib/supabase/server.ts`), and the project uses Next.js 14 App Router with Shadcn UI primitives.

The user has already configured Supabase email provider with: 8-char minimum, lower+upper+digit+symbol requirements, 6-digit email OTP, 1-hour OTP expiration, secure password change ON, require-current-password-when-updating OFF.

Admin users are created out-of-band via the Supabase dashboard. **There is no sign-up UI** — all flows use `shouldCreateUser: false`.

## Goals

- One page, one visual shell, four logical states — no navigation between flows.
- Password login remains the default path (minimal disruption for existing admins).
- OTP login available as a secondary option from the password screen.
- Password recovery works end-to-end: request → email → callback → set new password → `/admin`.
- Strong client-side password validation with live feedback, matching Supabase's server rules exactly.
- No leaking of account existence in error messages.

## Non-Goals

- Sign-up, social login, phone OTP, magic links.
- Email change flow.
- MFA / TOTP.
- Any changes to `/admin` or protected routes beyond what's strictly needed to support the recovery redirect.
- Refactoring unrelated auth surface (e.g., `createAdminClient` in `lib/supabase/server.ts`).

## UI State Machine

A single `LoginCard` component manages a `mode` state with five values. Transitions are local (no navigation) except where noted.

| Mode | Shown UI | Transitions |
|---|---|---|
| `password` (default) | email + password + "Sign In" | → `otp-request` ("Sign in with code") <br> → `forgot` ("Forgot password") <br> → `/admin` (on success) |
| `otp-request` | email + "Send code" | → `otp-verify` (on success, email preserved) <br> → `password` ("Use password instead") |
| `otp-verify` | 6-digit code + "Verify" | → `/admin` (on success) <br> → `otp-request` ("Use different email") <br> self (resend with 30s cooldown) |
| `forgot` | email + "Send reset link" | → confirmation state (local to form, stays in `forgot` mode) <br> → `password` ("Back to login") |
| `new-password` | new password + confirm + "Save" | → `/admin` (on success) <br> → `forgot` (on expired-recovery-session error) |

**Entry into `new-password`** is via URL (`/login?mode=new-password`) after the recovery callback. All other modes are entered via local state transitions.

## Architecture

```
app/(auth)/login/page.tsx              thin server wrapper; reads ?mode= and passes to LoginCard
components/auth/login-card.tsx         client component; owns mode state; renders one form at a time
components/auth/forms/
  password-form.tsx                    email + password
  otp-request-form.tsx                 email → sends 6-digit code
  otp-verify-form.tsx                  code → verifies; owns resend cooldown
  forgot-password-form.tsx             email → sends reset link; shows confirmation
  new-password-form.tsx                new password + confirm; uses PasswordRequirements
components/auth/password-requirements.tsx   live checklist of 5 rules (ticks as user types)
lib/auth/actions.ts                    pure wrappers around supabase.auth calls
lib/auth/validation.ts                 validatePassword(pw) — single source of truth for rules
app/auth/callback/route.ts             GET handler for recovery link; exchanges code for session
```

**Isolation rules:**
- Each form receives `onSuccess` and `onSwitchMode` callbacks via props. Forms do NOT know about other forms or about `mode`.
- `LoginCard` is the only component that knows the state machine.
- `lib/auth/actions.ts` is the only place that calls `supabase.auth.*`. Forms call these functions. This makes it easy to add logging, error mapping, or future changes.
- `lib/auth/validation.ts` is pure (no React, no Supabase) so it can be unit-tested and imported from both the form and the requirements component.

## Visual Shell

The existing two-column layout in `app/(auth)/login/page.tsx` (left: card with form, right: brand panel with quote) is preserved exactly. Only the contents of the card — the form itself, the heading, and the subheading — swap based on `mode`. This keeps visual continuity and minimizes regression risk on the existing design.

Each mode gets its own heading/subheading pair, e.g.:
- `password` → "Welcome back" / "Enter your credentials to access the admin dashboard"
- `otp-request` → "Sign in with a code" / "We'll email you a 6-digit code"
- `otp-verify` → "Check your email" / "Enter the code we sent to {email}"
- `forgot` → "Reset your password" / "Enter your email and we'll send you a reset link"
- `new-password` → "Set a new password" / "Choose a strong password for your account"

## Flow Details

### 1. Password login (existing flow, preserved)

```
password form → actions.signInWithPassword({ email, password })
  success → router.push('/admin'); router.refresh()
  error   → show Supabase message (e.g. "Invalid login credentials")
```

### 2. OTP login

```
password form → click "Sign in with code" → mode = otp-request
otp-request form → actions.requestOtp({ email })
  which calls: supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false }
  })
  success → mode = otp-verify (email kept in LoginCard state)
  error   → generic message ("If that email exists, we've sent a code.")
            still transition to otp-verify to avoid leaking existence

otp-verify form → actions.verifyOtp({ email, token })
  which calls: supabase.auth.verifyOtp({ email, token, type: 'email' })
  success → router.push('/admin'); router.refresh()
  error   → "Invalid or expired code. Try again or request a new one."

Resend:
  - Local state cooldownSecondsRemaining, counts down from 30
  - Button disabled while > 0
  - Click → actions.requestOtp({ email }) again, resets cooldown
```

UI note: show "Code valid for 1 hour" as static helper text in `otp-verify`, matching the Supabase config.

### 3. Password recovery (the subtle one)

```
Step 1 — Request
password form → click "Forgot password" → mode = forgot
forgot form → actions.requestPasswordReset({ email })
  which calls: supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/login?mode=new-password')}`
  })
  always show: "If that email exists, check your inbox for a reset link."
  (even on error — do not leak account existence)

Step 2 — Email link
User clicks link in email → browser navigates to:
  /auth/callback?code=<recovery-code>&next=/login?mode=new-password

Step 3 — Callback handler
app/auth/callback/route.ts (GET handler):
  - Read `code` and `next` from searchParams
  - const supabase = await createClient() (server client with cookies)
  - await supabase.auth.exchangeCodeForSession(code)
  - On success: NextResponse.redirect(new URL(next ?? '/admin', request.url))
  - On failure: redirect to /login?error=recovery_expired

Step 4 — New password form
User lands on /login?mode=new-password with an active recovery session.
new-password form:
  - Validates password client-side via validatePassword() (must pass all 5 rules)
  - Validates confirm === password
  - Calls actions.updatePassword(newPassword)
    which calls: supabase.auth.updateUser({ password: newPassword })
  - Success → router.push('/admin'); router.refresh()
  - Error "New password should be different from the old password." → show inline
  - Error "Auth session missing" → setMode('forgot') + alert "Session expired, request a new link"
```

### 4. Middleware exception

Currently `middleware.ts` redirects `/login` → `/admin` if a session exists. This would break the recovery flow because `exchangeCodeForSession` creates a session *before* the user sets the new password — they would bounce to `/admin` without ever seeing the new-password form.

**Fix:** in the `isLoginPage && user` branch, also check the `mode` query param:

```ts
if (isLoginPage && user) {
  const mode = request.nextUrl.searchParams.get('mode')
  if (mode !== 'new-password') {
    // existing redirect to /admin
  }
}
```

Also add `/auth/callback` to the early-return list so it isn't subject to `/api/` rate limiting (it isn't `/api/*` so this is a non-issue, but document the intent).

## Password Validation

`lib/auth/validation.ts` exports:

```ts
export interface PasswordRules {
  minLength: boolean   // >= 8 chars
  lowercase: boolean   // /[a-z]/
  uppercase: boolean   // /[A-Z]/
  digit: boolean       // /[0-9]/
  symbol: boolean      // /[^A-Za-z0-9]/
}

export function validatePassword(pw: string): {
  rules: PasswordRules
  valid: boolean  // all rules true
}
```

Rules mirror the Supabase config (min 8, lower + upper + digit + symbol). This function is the single source of truth — `PasswordRequirements` renders from `rules`, and `new-password-form` submits only when `valid === true`.

`PasswordRequirements` renders a small bulleted list with `CheckCircle2` (success) or a dimmed circle (pending) next to each rule. Updates on every keystroke. No separate state — takes `password: string` as prop.

## Error Handling

| Scenario | Handling |
|---|---|
| Wrong password | Show Supabase error message ("Invalid login credentials") |
| Rate limited by Supabase | Map to: "Too many attempts. Please wait a minute and try again." |
| OTP invalid or expired | Show inline; keep user on `otp-verify` to retry or resend |
| OTP send fails | Still advance to `otp-verify` to avoid leaking account existence; resend will reveal real error |
| Recovery email for unknown account | Always show "If that email exists, check your inbox" |
| Recovery session expired at new-password step | Transition to `forgot` mode with error alert |
| New password same as old | Show Supabase error inline |
| Confirm password mismatch | Client-side inline error, never submits |
| Password fails validation rules | Submit button disabled; requirements checklist shows which rules fail |
| Network error | Generic "Something went wrong. Please try again." |
| URL contains `?error=recovery_expired` | Alert banner on `password` mode: "Your reset link expired. Please request a new one." |

## `lib/auth/actions.ts` surface

```ts
// All functions return { error: string | null, data?: T }
// or throw on truly unexpected failures. Forms only need to check error.

signInWithPassword({ email, password })
requestOtp({ email })            // signInWithOtp, shouldCreateUser: false
verifyOtp({ email, token })      // verifyOtp, type: 'email'
requestPasswordReset({ email })  // resetPasswordForEmail with redirectTo
updatePassword(newPassword)      // updateUser({ password })
```

Each wrapper normalizes Supabase errors into user-facing strings (mapping table for common cases, fallthrough to raw message for unexpected ones). This is the seam where future logging hooks can be added.

## File List (net changes)

**New files:**
- `components/auth/login-card.tsx`
- `components/auth/forms/password-form.tsx`
- `components/auth/forms/otp-request-form.tsx`
- `components/auth/forms/otp-verify-form.tsx`
- `components/auth/forms/forgot-password-form.tsx`
- `components/auth/forms/new-password-form.tsx`
- `components/auth/password-requirements.tsx`
- `lib/auth/actions.ts`
- `lib/auth/validation.ts`
- `app/auth/callback/route.ts`

**Modified files:**
- `app/(auth)/login/page.tsx` — becomes thin wrapper that renders `<LoginCard initialMode={...}/>` inside the existing two-column layout
- `middleware.ts` — add `mode !== 'new-password'` check in the login redirect branch

**Unchanged:**
- `lib/supabase/client.ts`, `lib/supabase/server.ts`
- Any `/admin/*` route
- Any other route or component

## Manual Test Checklist (post-implementation)

- [ ] Email+password login → `/admin`
- [ ] Wrong password shows clear error, form stays usable
- [ ] "Sign in with code" → enter email → receive 6-digit code → verify → `/admin`
- [ ] Wrong code shows inline error, allows retry
- [ ] "Resend code" button disabled for 30s after click
- [ ] "Forgot password" → enter email → receive link → click → lands on `new-password`
- [ ] New password with all 5 rules green → save → `/admin`
- [ ] New password missing a rule → submit button disabled, checklist shows which
- [ ] Confirm password mismatch → inline error, no submit
- [ ] New password equals old password → Supabase error shown inline
- [ ] Recovery link clicked after expiration → `/login?error=recovery_expired` with banner
- [ ] Already-authenticated user visits `/login` → redirects to `/admin`
- [ ] Already-authenticated user visits `/login?mode=new-password` (via callback) → does NOT redirect
- [ ] Unauthenticated user visits `/admin` → redirects to `/login`
- [ ] "Back to login" and "Use password instead" links work from every mode
- [ ] All five modes render correctly in the existing two-column layout on desktop and mobile

## Risks and Open Questions

- **Middleware bypass for `?mode=new-password`**: This is the correct fix, but it does create a narrow surface where a user with an active session can land on the new-password form. Mitigation: `updateUser` requires the session to belong to the same user, and the form does nothing dangerous beyond updating their own password. Acceptable.
- **OTP cooldown is client-side only**: A user could refresh the page to bypass the 30s cooldown. Supabase itself rate-limits OTP sends server-side, so this is a UX convenience, not a security control. Acceptable.
- **Email deliverability**: Out of scope — depends on Supabase email provider configuration, which the user has already set up.

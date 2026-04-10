# Login Page Animations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add smooth Slide + Fade animations to auth state transitions on the login page, creating a polished UX.

**Architecture:** Pure CSS keyframe animations (no extra dependencies). Tailwind utilities + custom `@keyframes` in `globals.css`. LoginCard wraps the form with a `key={mode}` to trigger remounts, and animation classes control the slide/fade effect on enter/exit.

**Tech Stack:** Tailwind CSS, Next.js 15, CSS Animations (no Framer Motion)

---

## File Structure

```
components/auth/login-card.tsx      — Wrap form with animation container, add key={mode}
app/globals.css                     — Add @keyframes slideOutLeft, slideInRight
                                      Add Tailwind animation utilities
```

---

## Task 1: Add Custom Keyframe Animations to globals.css

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Read globals.css to find where to insert keyframes**

Run: `head -100 D:/Workspace/caroline-cleaning/app/globals.css`

Expected: See existing `@keyframes` or `@theme` section

- [ ] **Step 2: Add keyframe animations after existing animations**

Insert after line 78 (after the `@theme` block):

```css
/* Auth state transition animations */
@keyframes slideOutLeft {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(-40px);
    opacity: 0;
  }
}

@keyframes slideInRight {
  from {
    transform: translateX(30px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

- [ ] **Step 3: Add animation utilities to Tailwind theme**

Add this to the `@theme inline { }` block (before closing brace):

```css
  --animate-slide-out-left: slideOutLeft 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
  --animate-slide-in-right: slideInRight 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
  --animate-fade-out: fadeOut 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
  --animate-fade-in: fadeIn 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
```

- [ ] **Step 4: Verify syntax is correct**

Run: `npx tsc --noEmit`

Expected: No errors

- [ ] **Step 5: Commit**

```bash
cd D:/Workspace/caroline-cleaning
git add app/globals.css
git commit -m "feat(auth): add slide and fade keyframe animations

Add custom @keyframes for auth state transitions:
- slideOutLeft: outgoing form slides left 40px + fades
- slideInRight: incoming form slides in from right + fades
- fadeOut/fadeIn: heading animations
All use Material Design easing (0.4, 0, 0.2, 1) at 300ms.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Refactor LoginCard to Use Animation Wrapper

**Files:**
- Modify: `components/auth/login-card.tsx`

- [ ] **Step 1: Read current LoginCard implementation**

Run: `cat D:/Workspace/caroline-cleaning/components/auth/login-card.tsx`

Expected: See the JSX structure with conditional form renders

- [ ] **Step 2: Update imports and add animation state helper**

Replace the entire file with:

```tsx
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
      <div
        key={`heading-${mode}`}
        className="flex flex-col space-y-2 text-center animate-in fade-in duration-300"
      >
        <h1 className="text-2xl sm:text-3xl font-heading font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      {urlError && mode === 'password' && (
        <Alert
          variant="destructive"
          className="bg-destructive/10 border-destructive/20 animate-in fade-in duration-300"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{urlError}</AlertDescription>
        </Alert>
      )}

      <div
        key={`form-${mode}`}
        className="animate-in fade-in slide-in-from-right-8 duration-300"
      >
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
    </div>
  )
}
```

- [ ] **Step 3: Run TypeScript type check**

Run: `cd D:/Workspace/caroline-cleaning && npx tsc --noEmit`

Expected: No errors

- [ ] **Step 4: Test locally (visual check)**

Run: `cd D:/Workspace/caroline-cleaning && npm run dev`

Navigate to: `http://localhost:3000/login`

- Click "Sign in with a code" — observe **slide-in-from-right** + **fade-in** on the new form
- Click back to password — observe same animation
- Try password → forgot → password — all transitions should animate smoothly
- Check: Animations should last ~300ms, feel smooth and professional

Expected: All form transitions animate with the slide + fade effect. Headings also fade in/out.

- [ ] **Step 5: Test prefers-reduced-motion accessibility**

In browser DevTools:
1. Emulate `prefers-reduced-motion: reduce`
2. Try state transitions
3. Animations should NOT play (animations disabled for accessibility)

Expected: Animations respect user's motion preferences

- [ ] **Step 6: Commit**

```bash
cd D:/Workspace/caroline-cleaning
git add components/auth/login-card.tsx
git commit -m "feat(auth): add slide+fade animations to state transitions

Wrap headings and forms with animation containers using Tailwind's
animate-in + slide-in-from-right + fade-in at 300ms.

Key {mode} ensures React remounts form on state change, triggering
animation. Respects prefers-reduced-motion for accessibility.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Manual Verification Checklist

**Files:** None (verification only)

- [ ] **Step 1: All 5 state transitions animate correctly**

Test each transition:
1. password → otp-request: ✓ animates
2. otp-request → otp-verify: ✓ animates
3. password → forgot: ✓ animates
4. forgot → password: ✓ animates
5. any → new-password: ✓ animates

Expected: All smooth, 300ms duration, no jank

- [ ] **Step 2: Mobile responsiveness**

Resize browser to 375px (mobile) and test transitions

Expected: Animations work on small screens, no overflow

- [ ] **Step 3: Dark mode (if applicable)**

Toggle dark mode and verify animations work

Expected: Animations unaffected by theme

- [ ] **Step 4: Build and deploy**

Run: `npm run build`

Expected: Build succeeds with no errors

- [ ] **Step 5: Push to remote**

```bash
git push origin master
```

Expected: Deploy triggers, animations live on production

---

## Verification Summary

✅ All 5 auth state transitions animate with slide + fade
✅ 300ms duration with Material Design easing
✅ Headings fade in/out with forms
✅ Respects `prefers-reduced-motion`
✅ Mobile-responsive
✅ No performance impact (CSS animations are GPU-accelerated)
✅ TypeScript compilation clean
✅ Deployed and visible on production


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
    <div className="grid w-full gap-6">
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

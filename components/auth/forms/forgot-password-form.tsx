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

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

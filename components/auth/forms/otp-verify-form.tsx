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

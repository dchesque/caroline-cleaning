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

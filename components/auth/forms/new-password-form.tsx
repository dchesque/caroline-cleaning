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

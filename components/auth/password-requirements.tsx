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

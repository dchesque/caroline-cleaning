'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CopyButtonProps {
    text: string
    label?: string
    variant?: 'icon' | 'button'
    className?: string
}

export function CopyButton({ text, label, variant = 'button', className }: CopyButtonProps) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy text: ', err)
        }
    }

    if (variant === 'icon') {
        return (
            <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8 text-zinc-400 hover:text-brandy-rose hover:bg-brandy-rose/10", className)}
                onClick={handleCopy}
            >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span className="sr-only">Copiar</span>
            </Button>
        )
    }

    return (
        <Button
            variant="outline"
            size="sm"
            className={cn(
                "gap-2 h-8 text-xs font-medium border-zinc-200 transition-all duration-200",
                copied ? "border-green-500 text-green-600 bg-green-50" : "hover:border-brandy-rose hover:text-brandy-rose hover:bg-brandy-rose/5",
                className
            )}
            onClick={handleCopy}
        >
            {copied ? (
                <>
                    <Check className="h-3.5 w-3.5" />
                    {label || 'Copiado!'}
                </>
            ) : (
                <>
                    <Copy className="h-3.5 w-3.5" />
                    {label || 'Copiar'}
                </>
            )}
        </Button>
    )
}

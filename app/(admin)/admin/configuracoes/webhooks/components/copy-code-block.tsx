'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CopyCodeBlockProps {
    code: string
    language?: string
    title?: string
    className?: string
}

export function CopyCodeBlock({ code, language, title, className }: CopyCodeBlockProps) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Falha ao copiar:', err)
        }
    }

    return (
        <div className={cn("group relative flex flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950", className)}>
            {title && (
                <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-4 py-2">
                    <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{title}</span>
                    {language && (
                        <span className="text-[10px] font-mono text-zinc-500 uppercase">{language}</span>
                    )}
                </div>
            )}

            <div className="relative">
                <pre className="overflow-x-auto p-4 text-sm font-mono text-zinc-300 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                    <code>{code}</code>
                </pre>

                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "absolute right-2 top-2 h-8 w-8 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all opacity-0 group-hover:opacity-100",
                        copied && "text-green-500 opacity-100"
                    )}
                    onClick={handleCopy}
                >
                    {copied ? (
                        <Check className="h-4 w-4" />
                    ) : (
                        <Copy className="h-4 w-4" />
                    )}
                </Button>
            </div>
        </div>
    )
}

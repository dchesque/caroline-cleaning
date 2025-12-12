import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { SendHorizontal } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea' // Assuming you have a Textarea component or use Input

interface ChatInputProps {
    onSend: (message: string) => void
    isLoading: boolean
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
    const [input, setInput] = useState('')
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!input.trim() || isLoading) return
        onSend(input)
        setInput('')
        // Reset height?
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    return (
        <div className="p-4 bg-white border-t border-pampas rounded-b-xl">
            <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-1 min-h-[44px] max-h-32 w-full rounded-md border border-input bg-transparent px-3 py-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brandy-rose-400 disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-y-auto"
                    rows={1}
                    disabled={isLoading}
                />
                <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim() || isLoading}
                    className="h-11 w-11 shrink-0 bg-brandy-rose-500 hover:bg-brandy-rose-600 text-white rounded-md transition-all"
                >
                    <SendHorizontal className="w-5 h-5" />
                </Button>
            </form>
            <div className="text-center mt-2">
                <p className="text-[10px] text-muted-foreground">
                    Powered by AI · Carol can make mistakes.
                </p>
            </div>
        </div>
    )
}

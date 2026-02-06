import { useRef, useEffect } from 'react'
import type { ChatMessage } from '@/types/carol'
import { MessageBubble } from './message-bubble'
import { TypingIndicator } from './typing-indicator'

interface ChatMessagesProps {
    messages: ChatMessage[]
    isLoading: boolean
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, isLoading])

    return (
        <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 bg-desert-storm"
        >
            <div className="flex flex-col min-h-full justify-end">
                {messages.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-8 text-center opacity-50">
                        Start a conversation with Carol...
                    </div>
                )}

                {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                ))}

                {isLoading && <TypingIndicator />}
            </div>
        </div>
    )
}

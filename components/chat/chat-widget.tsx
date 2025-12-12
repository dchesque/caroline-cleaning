'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'
import { ChatWindow } from './chat-window'
import { useChat } from '@/hooks/use-chat'
import { cn } from '@/lib/utils'

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const chat = useChat()

    useEffect(() => {
        const handleOpenChat = () => setIsOpen(true)
        window.addEventListener('open-chat', handleOpenChat)
        return () => window.removeEventListener('open-chat', handleOpenChat)
    }, [])

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
            {/* Chat Window (Desktop: floating, Mobile: dealt with separately or full screen) */}
            <ChatWindow
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                chat={chat}
                className="w-[90vw] h-[80vh] md:w-[400px] md:h-[600px] mb-4 rounded-xl shadow-2xl"
            />

            {/* Toggle Button (only visible when chat is closed or on mobile maybe?) */}
            <Button
                size="icon"
                onClick={() => setIsOpen(prev => !prev)}
                className={cn(
                    "h-14 w-14 rounded-full shadow-lg bg-brandy-rose-500 hover:bg-brandy-rose-600 text-white transition-transform duration-300",
                    isOpen ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
                )}
            >
                <MessageCircle className="h-6 w-6" />
            </Button>
        </div>
    )
}

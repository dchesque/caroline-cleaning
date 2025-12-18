'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'
import { ChatWindow } from './chat-window'
import { ChatBubbleNotification } from './chat-bubble-notification'
import { useChat } from '@/hooks/use-chat'
import { cn } from '@/lib/utils'

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [showBubble, setShowBubble] = useState(false)
    const chat = useChat()

    const BUBBLE_DELAY_MS = 30000 // 30 seconds
    const BUBBLE_DISMISSED_KEY = 'carol-bubble-dismissed'

    useEffect(() => {
        // Check if already dismissed in this session
        const wasDismissed = sessionStorage.getItem(BUBBLE_DISMISSED_KEY)
        if (wasDismissed) return

        // Do not show if chat is already open
        if (isOpen) return

        const timer = setTimeout(() => {
            // Check again if chat wasn't opened while waiting
            if (!isOpen) {
                setShowBubble(true)
            }
        }, BUBBLE_DELAY_MS)

        return () => clearTimeout(timer)
    }, [isOpen])

    // Play notification sound when bubble appears
    useEffect(() => {
        if (showBubble) {
            const audio = new Audio('/sounds/notification.mp3')
            audio.volume = 0.5 // Adjust volume for a friendly feel
            audio.play().catch(e => {
                // Autoplay might be blocked by browser if no user interaction yet
                console.warn('Notification sound could not be played:', e)
            })
        }
    }, [showBubble])

    // Hide bubble when chat opens
    useEffect(() => {
        if (isOpen) {
            setShowBubble(false)
        }
    }, [isOpen])

    // Handler to close bubble
    const handleCloseBubble = () => {
        setShowBubble(false)
        // Mark as dismissed for this session
        sessionStorage.setItem(BUBBLE_DISMISSED_KEY, 'true')
    }

    // Handler to click bubble (opens chat)
    const handleBubbleClick = () => {
        setShowBubble(false)
        setIsOpen(true)
    }

    useEffect(() => {
        const handleOpenChat = () => {
            setShowBubble(false)
            setIsOpen(true)
        }
        window.addEventListener('open-chat', handleOpenChat)
        return () => window.removeEventListener('open-chat', handleOpenChat)
    }, [])

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
            {/* Chat Window */}
            <ChatWindow
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                chat={chat}
                className="w-[90vw] h-[80vh] md:w-[400px] md:h-[600px] mb-4 rounded-xl shadow-2xl"
            />

            {/* Button + Bubble Container */}
            <div className="relative">
                {/* Mini Bubble Notification */}
                <ChatBubbleNotification
                    isVisible={showBubble && !isOpen}
                    onClose={handleCloseBubble}
                    onClick={handleBubbleClick}
                />

                {/* Toggle Button */}
                <Button
                    size="icon"
                    onClick={() => setIsOpen(prev => !prev)}
                    className={cn(
                        "h-14 w-14 rounded-full shadow-lg bg-brandy-rose-500 hover:bg-brandy-rose-600 text-white transition-transform duration-300",
                        isOpen ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
                    )}
                >
                    <MessageCircle className="h-6 w-6" />

                    {/* Notification dot when bubble is visible */}
                    {showBubble && !isOpen && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                    )}
                </Button>
            </div>
        </div>
    )
}

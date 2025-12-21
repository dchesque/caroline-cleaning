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
    const [bubbleContent, setBubbleContent] = useState({
        title: "Hi! I'm Carol.",
        message: "Need help scheduling a cleaning? 😊"
    })
    const chat = useChat()

    const INITIAL_DELAY_MS = 15000 // 15 seconds
    const SECOND_DELAY_MS = 45000 // 45 seconds total
    const BUBBLE_DISMISSED_KEY = 'carol-bubble-dismissed'

    useEffect(() => {
        const wasDismissed = sessionStorage.getItem(BUBBLE_DISMISSED_KEY)
        if (wasDismissed || isOpen) return

        // First Trigger: 15 seconds
        const firstTimer = setTimeout(() => {
            if (!isOpen) {
                setShowBubble(true)
            }
        }, INITIAL_DELAY_MS)

        // Second Trigger: 45 seconds
        const secondTimer = setTimeout(() => {
            if (!isOpen) {
                setBubbleContent({
                    title: "Still here! 👋",
                    message: "I'm still here if you have any questions. Feel free to ask!"
                })
                // Re-show bubble if it was closed but not "dismissed"
                if (!sessionStorage.getItem(BUBBLE_DISMISSED_KEY)) {
                    setShowBubble(true)
                }
            }
        }, SECOND_DELAY_MS)

        return () => {
            clearTimeout(firstTimer)
            clearTimeout(secondTimer)
        }
    }, [isOpen])

    // Play notification sound when bubble appears OR updates
    useEffect(() => {
        if (showBubble && !isOpen) {
            const audio = new Audio('/sounds/notification.mp3')
            audio.volume = 0.5
            audio.play().catch(e => {
                console.warn('Notification sound could not be played:', e)
            })
        }
    }, [showBubble, bubbleContent, isOpen])

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
                    title={bubbleContent.title}
                    message={bubbleContent.message}
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

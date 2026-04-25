'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'
import { ChatWindow } from './chat-window'
import { ChatBubbleNotification } from './chat-bubble-notification'
import { useCarolChat } from '@/hooks/use-carol-chat'
import { useLeadChat } from '@/hooks/use-lead-chat'
import { cn } from '@/lib/utils'
import { useTracking } from '@/components/tracking/tracking-provider'

export type ChatMode = 'full' | 'lead'

export function ChatWidget({ mode = 'full' }: { mode?: ChatMode } = {}) {
    const [isOpen, setIsOpen] = useState(false)
    const { trackEvent } = useTracking()

    // Track if user has interacted with the page (enables audio autoplay)
    const [hasUserInteracted, setHasUserInteracted] = useState(false)

    const [showBubble, setShowBubble] = useState(false)
    const [bubbleContent, setBubbleContent] = useState({
        title: "Hi! I'm Carol.",
        message: "Need help scheduling a cleaning? 😊"
    })

    // Both hooks are always called (React rules forbid conditional hooks).
    // Only one is wired to the UI based on the mode prop (resolved server-side
    // from env var, so changes take effect on restart without rebuilding the bundle).
    const fullChat = useCarolChat()
    const leadChat = useLeadChat()
    const chat = mode === 'lead' ? leadChat : fullChat

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

    // Track user interaction to enable audio playback
    useEffect(() => {
        const enableAudio = () => setHasUserInteracted(true)

        const events = ['click', 'keydown', 'scroll', 'touchstart']
        events.forEach(event => window.addEventListener(event, enableAudio, { once: true }))

        return () => {
            events.forEach(event => window.removeEventListener(event, enableAudio))
        }
    }, [])

    // Play notification sound when bubble appears (only after user interaction)
    useEffect(() => {
        if (showBubble && !isOpen && hasUserInteracted) {
            const audio = new Audio('/sounds/notification.mp3')
            audio.volume = 0.5
            audio.play().catch(e => {
                console.warn('Notification sound could not be played:', e)
            })
        }
    }, [showBubble, isOpen, hasUserInteracted])

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

    const handleToggleChat = useCallback((newState?: boolean) => {
        const nextState = newState !== undefined ? newState : !isOpen
        console.log('[ChatWidget] handleToggleChat called', { newState, nextState, isOpen })

        if (nextState && !isOpen) {
            trackEvent('InitiateChat', {
                content_name: 'Chat Widget',
            })
        }

        setIsOpen(nextState)
        if (nextState) {
            setShowBubble(false)
        }
    }, [isOpen, trackEvent])

    // Handler to click bubble (opens chat)
    const handleBubbleClick = () => {
        console.log('[ChatWidget] handleBubbleClick called')
        handleToggleChat(true)
    }

    useEffect(() => {
        const onOpenChat = () => {
            handleToggleChat(true)
        }
        const onCloseChat = () => {
            handleToggleChat(false)
        }
        window.addEventListener('open-chat', onOpenChat)
        window.addEventListener('close-chat', onCloseChat)
        return () => {
            window.removeEventListener('open-chat', onOpenChat)
            window.removeEventListener('close-chat', onCloseChat)
        }
    }, [handleToggleChat])

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
            {/* Chat Window */}
            <ChatWindow
                isOpen={isOpen}
                onClose={() => handleToggleChat(false)}
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
                    onClick={() => handleToggleChat()}
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

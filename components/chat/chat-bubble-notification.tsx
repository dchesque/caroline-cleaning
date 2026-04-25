'use client'

import { X } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface ChatBubbleNotificationProps {
    isVisible: boolean
    onClose: () => void
    onClick: () => void
    title?: string
    message?: string
}

export function ChatBubbleNotification({
    isVisible,
    onClose,
    onClick,
    title = "Hi! I'm Carol.",
    message = "Need help scheduling a cleaning? 😊"
}: ChatBubbleNotificationProps) {
    if (!isVisible) return null

    return (
        <div
            className={cn(
                "absolute bottom-full right-0 mb-3 w-[250px] sm:w-[280px]",
                "animate-in slide-in-from-right-5 fade-in duration-300",
                "z-10"  // Ensure bubble is above other elements
            )}
        >
            {/* Bubble Container */}
            <div
                onClick={(e) => {
                    console.log('[ChatBubble] Container clicked', e.target)
                    onClick?.()
                }}
                onMouseDown={(e) => console.log('[ChatBubble] Mouse down on container', e.target)}
                className={cn(
                    "relative bg-white rounded-2xl shadow-lg border border-pampas",
                    "p-3 pr-8 cursor-pointer",
                    "hover:shadow-xl transition-shadow duration-200",
                    "group z-10"  // Ensure clickable area is on top
                )}
            >
                {/* Close Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onClose()
                    }}
                    className={cn(
                        "absolute top-2 right-2 p-1 rounded-full",
                        "text-muted-foreground hover:text-foreground",
                        "hover:bg-muted transition-colors"
                    )}
                    aria-label="Close notification"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Content */}
                <div className="flex items-start gap-3">
                    {/* Carol Avatar */}
                    <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarFallback className="bg-pot-pourri text-brandy-rose-600 font-semibold">
                            C
                        </AvatarFallback>
                    </Avatar>

                    {/* Message */}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                            {title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {message}
                        </p>
                    </div>
                </div>

                {/* Hover indicator */}
                <div className={cn(
                    "absolute inset-0 rounded-2xl border-2 border-transparent",
                    "group-hover:border-brandy-rose-200 transition-colors pointer-events-none"
                )} />
            </div>

            {/* Arrow pointing to button */}
            <div className="absolute -bottom-2 right-6 w-4 h-4 rotate-45 bg-white border-r border-b border-pampas" />
        </div>
    )
}

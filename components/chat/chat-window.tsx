import { Message, useChat } from '@/hooks/use-chat'
import { ChatHeader } from './chat-header'
import { ChatMessages } from './chat-messages'
import { ChatInput } from './chat-input'
import { cn } from '@/lib/utils'

interface ChatWindowProps {
    isOpen: boolean
    onClose: () => void
    onMinimize?: () => void
    className?: string
    chat: ReturnType<typeof useChat>
}

export function ChatWindow({ isOpen, onClose, onMinimize, className, chat }: ChatWindowProps) {
    if (!isOpen) return null

    return (
        <div className={cn(
            "flex flex-col bg-white shadow-2xl overflow-hidden border border-pampas animate-in zoom-in-95 duration-200 origin-bottom-right",
            className
        )}>
            <ChatHeader onClose={onClose} onMinimize={onMinimize} />
            <ChatMessages messages={chat.messages} isLoading={chat.isLoading} />
            <ChatInput onSend={chat.sendMessage} isLoading={chat.isLoading} />
        </div>
    )
}

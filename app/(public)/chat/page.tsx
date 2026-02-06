'use client'

import { ChatWindow } from '@/components/chat/chat-window'
import { useCarolChat } from '@/hooks/use-carol-chat'
import { useRouter } from 'next/navigation'

export default function MobileChatPage() {
    const chat = useCarolChat()
    const router = useRouter()

    return (
        <div className="flex flex-col h-[100dvh] bg-desert-storm">
            <ChatWindow
                isOpen={true}
                onClose={() => router.push('/')}
                chat={chat}
                className="flex-1 w-full h-full rounded-none border-0 shadow-none animate-none"
            />
        </div>
    )
}

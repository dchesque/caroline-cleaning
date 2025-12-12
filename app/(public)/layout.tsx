import { ChatWidget } from '@/components/chat/chat-widget'

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-desert-storm">
            {children}
            <ChatWidget />
        </div>
    )
}

import { ChatWidget } from '@/components/chat/chat-widget'
import { AnnouncementBar } from '@/components/landing/announcement-bar'
import { Header } from '@/components/landing/header'

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-desert-storm">
            <AnnouncementBar />
            <Header />
            {children}
            <ChatWidget />
        </div>
    )
}

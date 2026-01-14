import { ChatWidget } from '@/components/chat/chat-widget'
import { AnnouncementBar } from '@/components/landing/announcement-bar'
import { Header } from '@/components/landing/header'

import { getBusinessSettingsServer } from '@/lib/business-config-server'
import { BusinessSettingsProvider } from '@/lib/context/business-settings-context'

export default async function PublicLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const settings = await getBusinessSettingsServer()

    return (
        <BusinessSettingsProvider initialSettings={settings}>
            <div className="min-h-screen bg-desert-storm">
                <AnnouncementBar />
                <Header />
                {children}
                <ChatWidget />
            </div>
        </BusinessSettingsProvider>
    )
}

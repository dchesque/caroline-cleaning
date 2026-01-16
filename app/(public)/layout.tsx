import { ChatWidget } from '@/components/chat/chat-widget'
import { AnnouncementBar } from '@/components/landing/announcement-bar'
import { Header } from '@/components/landing/header'
import { TrackingProvider } from '@/components/tracking/tracking-provider'
import { Suspense } from 'react'

import { getBusinessSettingsServer } from '@/lib/business-config-server'
import { BusinessSettingsProvider } from '@/lib/context/business-settings-context'

export default async function PublicLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const settings = await getBusinessSettingsServer()

    return (
        <Suspense fallback={null}>
            <TrackingProvider>
                <BusinessSettingsProvider initialSettings={settings}>
                    <div className="min-h-screen bg-desert-storm">
                        <AnnouncementBar />
                        <Header />
                        {children}
                        <ChatWidget />
                    </div>
                </BusinessSettingsProvider>
            </TrackingProvider>
        </Suspense>
    )
}


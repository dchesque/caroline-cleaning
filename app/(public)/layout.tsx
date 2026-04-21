import { ChatWidget } from '@/components/chat/chat-widget'
import { AnnouncementBar } from '@/components/landing/announcement-bar'
import { Header } from '@/components/landing/header'
import { TrackingProvider } from '@/components/tracking/tracking-provider'
import { Suspense } from 'react'

import { getBusinessSettingsServer } from '@/lib/business-config-server'
import { BusinessSettingsProvider } from '@/lib/context/business-settings-context'
import type { TrackingConfig } from '@/lib/tracking/types'

export default async function PublicLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const settings = await getBusinessSettingsServer()

    // Derive tracking config server-side so pixel scripts mount on first
    // render (avoids client fetch roundtrip delay for Pixel Helper detection).
    // NOTE: access_token is never shipped to the browser — it lives only in
    // the server-side CAPI route via service-role client.
    const initialTrackingConfig: TrackingConfig = {
        meta_enabled: !!settings.tracking_meta_enabled,
        meta_pixel_id: settings.tracking_meta_pixel_id || '',
        meta_access_token: '',
        meta_capi_enabled: !!settings.tracking_meta_capi_enabled,
        meta_test_event_code: settings.tracking_meta_test_event_code || '',
        google_ads_enabled: !!settings.tracking_google_ads_enabled,
        google_ads_id: settings.tracking_google_ads_id || '',
        google_ads_label: settings.tracking_google_ads_label || '',
        ga4_enabled: !!settings.tracking_ga4_enabled,
        ga4_measurement_id: settings.tracking_ga4_measurement_id || '',
        gtm_enabled: !!settings.tracking_gtm_enabled,
        gtm_id: settings.tracking_gtm_id || '',
        tiktok_enabled: !!settings.tracking_tiktok_enabled,
        tiktok_pixel_id: settings.tracking_tiktok_pixel_id || '',
        utmify_enabled: !!settings.tracking_utmify_enabled,
        utmify_pixel_id: settings.tracking_utmify_pixel_id || '',
        custom_head_scripts: settings.tracking_custom_head_scripts || '',
        custom_body_scripts: settings.tracking_custom_body_scripts || '',
    }

    return (
        <Suspense fallback={null}>
            <TrackingProvider initialConfig={initialTrackingConfig}>
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


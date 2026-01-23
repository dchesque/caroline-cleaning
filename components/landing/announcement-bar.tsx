'use client'

import { useBusinessSettings } from '@/lib/context/business-settings-context'

export function AnnouncementBar() {
    const { announcement_enabled, announcement_text, announcement_bg_color } = useBusinessSettings()

    if (!announcement_enabled || !announcement_text) return null

    return (
        <div
            className="text-white py-2 px-4 text-center overflow-hidden animate-in fade-in duration-700"
            style={{ backgroundColor: announcement_bg_color || '#C48B7F' }}
        >
            <p className="text-[10px] xs:text-xs sm:text-sm font-medium tracking-wide">
                {announcement_text}
            </p>
        </div>
    )
}

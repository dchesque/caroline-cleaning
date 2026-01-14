'use client'

import { useBusinessSettings } from '@/lib/context/business-settings-context'

export function AnnouncementBar() {
    const { announcement_text } = useBusinessSettings()

    if (!announcement_text) return null

    return (
        <div className="bg-brandy-rose-600 text-white py-2 px-4 text-center overflow-hidden animate-in fade-in duration-700">
            <p className="text-[10px] xs:text-xs sm:text-sm font-medium tracking-wide">
                {announcement_text}
            </p>
        </div>
    )
}

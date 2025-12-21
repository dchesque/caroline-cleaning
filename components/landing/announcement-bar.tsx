'use client'

import { cn } from '@/lib/utils'

export function AnnouncementBar() {
    return (
        <div className="bg-brandy-rose-600 text-white py-2 px-4 text-center overflow-hidden animate-in fade-in duration-700">
            <p className="text-[10px] xs:text-xs sm:text-sm font-medium tracking-wide">
                Serving Charlotte, NC & Fort Mill, SC — plus nearby cities.
                <span className="hidden sm:inline"> New customer? Text for a fast estimate today.</span>
            </p>
        </div>
    )
}

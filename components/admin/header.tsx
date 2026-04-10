'use client'

import { LanguageSelector } from './language-selector'

export function AdminHeader() {
    return (
        <header className="sticky top-0 z-40 bg-white border-b border-[#EAE0D5] px-4 sm:px-6 h-16 flex items-center justify-between lg:justify-end">
            {/* Spacer for mobile menu trigger */}
            <div className="lg:hidden w-8" />
            <LanguageSelector />
        </header>
    )
}

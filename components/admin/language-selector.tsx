'use client';

import { useAdminI18n } from '@/lib/admin-i18n/context';
import { cn } from '@/lib/utils';

export function LanguageSelector() {
    const { locale, setLocale } = useAdminI18n();

    return (
        <div className="flex items-center gap-2 bg-[#FDF8F6] p-1 rounded-full border border-[#EAE0D5]">
            <button
                onClick={() => setLocale('pt-BR')}
                className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-full transition-all text-xl",
                    locale === 'pt-BR'
                        ? "bg-white shadow-sm scale-110"
                        : "opacity-50 hover:opacity-100 grayscale hover:grayscale-0"
                )}
                title="Português (Brasil)"
            >
                🇧🇷
            </button>
            <button
                onClick={() => setLocale('en-US')}
                className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-full transition-all text-xl",
                    locale === 'en-US'
                        ? "bg-white shadow-sm scale-110"
                        : "opacity-50 hover:opacity-100 grayscale hover:grayscale-0"
                )}
                title="English (USA)"
            >
                🇺🇸
            </button>
        </div>
    );
}

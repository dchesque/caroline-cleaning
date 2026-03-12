'use client';

import { useAdminI18n } from '@/lib/admin-i18n/context';
import { cn } from '@/lib/utils';

const BrFlag = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 504" className={className}>
        <rect width="100%" height="100%" fill="#009c3b" rx="4"/>
        <polygon points="360,86 634,252 360,418 86,252" fill="#ffdf00"/>
        <circle cx="360" cy="252" r="118" fill="#002776"/>
        <path d="m256 261c31-30 83-42 124-32 30 7 60 21 82 48-31 30-84 41-124 31-29-7-59-22-82-47z" fill="#fff"/>
    </svg>
);

const UsFlag = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 7410 3900" className={className}>
        <rect width="7410" height="3900" fill="#b22234" rx="30"/>
        <path d="M0,450H7410m0,600H0m0,600H7410m0,600H0m0,600H7410m0,600H0" stroke="#fff" strokeWidth="300"/>
        <rect width="2964" height="2100" fill="#3c3b6e"/>
        <g fill="#fff">
            <g id="s18">
                <g id="s9">
                    <g id="s5">
                        <g id="s4">
                            <path id="s" d="M247,90 317.534230,307.082039 132.873218,172.917961H361.126782L176.465770,307.082039z"/>
                            <use href="#s" y="420"/>
                            <use href="#s" y="840"/>
                            <use href="#s" y="1260"/>
                        </g>
                        <use href="#s" y="1680"/>
                    </g>
                    <use href="#s4" x="247" y="210"/>
                </g>
                <use href="#s9" x="494"/>
            </g>
            <use href="#s18" x="988"/>
            <use href="#s9" x="1976"/>
            <use href="#s5" x="2470"/>
        </g>
    </svg>
);

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
                <BrFlag className="w-5 h-5 rounded-sm object-cover" />
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
                <UsFlag className="w-5 h-5 rounded-sm object-cover" />
            </button>
        </div>
    );
}

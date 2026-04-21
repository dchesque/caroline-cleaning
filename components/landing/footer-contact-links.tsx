'use client'

import { Phone, MessageCircle } from 'lucide-react'
import { useTracking } from '@/components/tracking/tracking-provider'
import { WhatsAppIcon } from '@/components/ui/whatsapp-icon'

interface FooterContactLinksProps {
    phone: string
    phoneDisplay: string
}

function toWaNumber(phone: string | undefined | null): string {
    const digits = String(phone ?? '').replace(/\D/g, '')
    if (!digits) return ''
    return digits.startsWith('1') ? digits : `1${digits}`
}

/**
 * Client-side slice of the footer so `sms:`/`tel:`/`wa.me` clicks can fire
 * the right tracking events. Kept minimal so the rest of the footer stays
 * a server component.
 */
export function FooterContactLinks({ phone, phoneDisplay }: FooterContactLinksProps) {
    const { trackEvent } = useTracking()

    return (
        <>
            <li className="flex gap-3">
                <Phone className="w-5 h-5 text-brandy-rose-500 shrink-0" />
                <a
                    href={`tel:${phone}`}
                    className="hover:text-white transition-colors"
                    onClick={() => trackEvent('ClickToCall', { content_name: 'Footer Call' })}
                >
                    {phoneDisplay}
                </a>
            </li>
            <li className="flex gap-3">
                <MessageCircle className="w-5 h-5 text-brandy-rose-500 shrink-0" />
                <a
                    href={`sms:${phone}`}
                    className="hover:text-white transition-colors"
                    onClick={() => trackEvent('ClickToCall', { content_name: 'Footer SMS' })}
                >
                    Text: {phoneDisplay}
                </a>
            </li>
            <li className="flex gap-3">
                <WhatsAppIcon className="w-5 h-5 shrink-0" style={{ color: '#25D366' }} />
                <a
                    href={`https://wa.me/${toWaNumber(phone)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                    onClick={() => trackEvent('ClickToWhatsApp', { content_name: 'Footer WhatsApp' })}
                >
                    WhatsApp: {phoneDisplay}
                </a>
            </li>
        </>
    )
}

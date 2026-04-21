'use client'

import { Phone, MessageCircle } from 'lucide-react'
import { useTracking } from '@/components/tracking/tracking-provider'

interface FooterContactLinksProps {
    phone: string
    phoneDisplay: string
}

/**
 * Client-side slice of the footer so `sms:`/`tel:` clicks can fire
 * `ClickToCall` tracking events. Kept minimal so the rest of the footer
 * stays a server component.
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
        </>
    )
}

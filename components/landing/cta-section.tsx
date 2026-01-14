'use client'

import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'

import { useBusinessSettings } from '@/lib/context/business-settings-context'

export function CTASection() {
    const settings = useBusinessSettings()

    const openChat = () => {
        window.dispatchEvent(new CustomEvent('open-chat'))
    }

    return (
        <section className="py-20 md:py-32 bg-brandy-rose-600 text-white overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent"></div>

            <div className="container relative text-center">
                <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl text-white mb-4">
                    Ready for a Spotless Home or Office?
                </h2>
                <p className="text-lg text-brandy-rose-100 mb-8 max-w-2xl mx-auto">
                    Serving Charlotte, NC, Fort Mill, SC, and nearby cities. Chat with Carol for a fast quote and easy scheduling.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        size="lg"
                        variant="secondary"
                        className="gap-2 text-base bg-white text-foreground hover:bg-brandy-rose-50 h-14 px-8"
                        onClick={openChat}
                    >
                        <MessageCircle className="w-5 h-5" />
                        Request a Visit
                    </Button>
                </div>

                <p className="text-sm text-brandy-rose-200 mt-4">
                    Prefer texting?{' '}
                    <a
                        href={`sms:${settings.business_phone}`}
                        className="text-white hover:underline font-medium"
                    >
                        Text us at {settings.business_phone_display}
                    </a>
                </p>
            </div>
        </section>
    )
}

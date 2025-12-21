'use client'

import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'

export function CTASection() {
    const openChat = () => {
        window.dispatchEvent(new CustomEvent('open-chat'))
    }

    return (
        <section className="py-20 md:py-32 bg-brandy-rose-600 text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent"></div>

            <div className="container relative text-center">
                <h2 className="font-heading text-3xl md:text-5xl font-bold mb-6 text-white text-balance">
                    Ready for a Spotless Home or Office?
                </h2>
                <p className="text-lg md:text-xl text-brandy-rose-100 mb-10 max-w-2xl mx-auto">
                    Serving Charlotte, NC, Fort Mill, SC, and nearby cities. Text for a fast quote and flexible scheduling.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        size="lg"
                        variant="secondary"
                        className="gap-2 text-brandy-rose-700 hover:text-brandy-rose-800 bg-white hover:bg-brandy-rose-50 h-14 px-8 text-lg"
                        onClick={openChat}
                    >
                        <MessageCircle className="w-5 h-5" />
                        Text for a Free Quote
                    </Button>
                </div>
            </div>
        </section>
    )
}

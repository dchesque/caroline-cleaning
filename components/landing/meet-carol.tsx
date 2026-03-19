'use client'

import { Button } from '@/components/ui/button'
import { MessageCircle, Bot } from 'lucide-react'

export function MeetCarol() {
    const openChat = () => {
        window.dispatchEvent(new CustomEvent('open-chat'))
    }

    return (
        <section className="py-20 bg-pot-pourri/30">
            <div className="container">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12">
                    <div className="w-full md:w-1/2 flex justify-center">
                        <div className="relative">
                            <div className="w-48 h-48 md:w-64 md:h-64 rounded-2xl bg-brandy-rose-100 flex items-center justify-center relative z-10 overflow-hidden shadow-xl">
                                <Bot className="w-24 h-24 md:w-32 md:h-32 text-brandy-rose-600" />
                                <div className="absolute inset-0 bg-gradient-to-tr from-brandy-rose-200/50 to-transparent" />
                            </div>
                            <div className="absolute -top-4 -right-4 w-24 h-24 bg-brandy-rose-500/10 rounded-full blur-2xl" />
                            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-brandy-rose-500/10 rounded-full blur-2xl" />
                        </div>
                    </div>

                    <div className="w-full md:w-1/2 text-center md:text-left">
                        <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-6">
                            Meet Carol, Our Virtual Scheduling Assistant
                        </h2>
                        <p className="text-lg text-muted-foreground mb-8 text-balance">
                            Carol helps you get a fast quote, pick the right service, and
                            schedule in minutes, all by text. No phone calls, no waiting.
                            Most clients get their quote in under 5 minutes.
                        </p>
                        <Button
                            size="lg"
                            className="gap-2 bg-brandy-rose-500 hover:bg-brandy-rose-600 text-white"
                            onClick={openChat}
                        >
                            <MessageCircle className="w-5 h-5" />
                            Chat with Carol
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    )
}

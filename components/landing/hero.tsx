'use client'

import { Button } from '@/components/ui/button'
import { MessageCircle, Star, Shield, Clock, Award } from 'lucide-react'
import Link from 'next/link'

export function Hero() {
    const openChat = () => {
        window.dispatchEvent(new CustomEvent('open-chat'))
    }

    return (
        <section className="relative pt-24 sm:pt-32 lg:pt-40 pb-12 sm:pb-16 lg:pb-24 overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-b from-pot-pourri/30 to-desert-storm -z-10" />

            {/* Decorative Elements */}
            <div className="absolute top-20 right-0 w-72 h-72 bg-brandy-rose-100/50 rounded-full blur-3xl opacity-50 -z-10" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-pot-pourri/50 rounded-full blur-3xl opacity-30 -z-10" />

            <div className="container relative">
                <div className="max-w-3xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <span className="flex items-center gap-1.5 text-sm font-medium text-brandy-rose-600">
                            <Star className="w-4 h-4 fill-brandy-rose-500 text-brandy-rose-500" />
                            4.9/5 from 200+ reviews
                        </span>
                    </div>

                    {/* Headline */}
                    <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight text-foreground mb-6 text-balance animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                        Premium House Cleaning,
                        <br />
                        <span className="text-brandy-rose-500">Scheduled in Minutes</span>
                    </h1>

                    {/* Subheadline */}
                    <p className="text-sm sm:text-base md:text-xl text-muted-foreground max-w-xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                        Professional cleaning service available 24/7. Chat with Carol, our
                        virtual assistant, to book your free estimate — no forms, no waiting.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                        <Button
                            size="lg"
                            className="gap-2 h-12 px-8 w-full sm:w-auto text-base bg-brandy-rose-500 hover:bg-brandy-rose-600 text-white shadow-lg shadow-brandy-rose-500/20"
                            onClick={openChat}
                        >
                            <MessageCircle className="w-5 h-5" />
                            Chat with Carol Now
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="gap-2 h-12 px-8 w-full sm:w-auto text-base border-brandy-rose-200 hover:bg-brandy-rose-50 text-brandy-rose-700"
                            asChild
                        >
                            <Link href="#services">
                                Explore Services
                            </Link>
                        </Button>
                    </div>

                    {/* Trust Indicators */}
                    <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 text-sm font-medium text-muted-foreground animate-in fade-in duration-1000 delay-500">
                        <div className="flex items-center gap-2">
                            <div className="p-1 rounded-full bg-success/10 text-success">
                                <Shield className="w-4 h-4" />
                            </div>
                            <span>Fully Insured</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="p-1 rounded-full bg-success/10 text-success">
                                <Clock className="w-4 h-4" />
                            </div>
                            <span>24/7 Booking</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="p-1 rounded-full bg-success/10 text-success">
                                <Award className="w-4 h-4" />
                            </div>
                            <span>Satisfaction Guaranteed</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

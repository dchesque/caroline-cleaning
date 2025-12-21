'use client'

import { Button } from '@/components/ui/button'
import { MessageCircle, Star, Shield } from 'lucide-react'

export function Hero() {
    const openChat = () => {
        window.dispatchEvent(new CustomEvent('open-chat'))
    }

    return (
        <section className="relative pt-8 sm:pt-12 lg:pt-16 pb-12 sm:pb-16 lg:pb-24 overflow-hidden">
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
                            Locally focused • Insured • Satisfaction guarantee
                        </span>
                    </div>

                    {/* Headline */}
                    <h1 className="font-heading text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight text-foreground mb-6 text-balance animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                        Premium House Cleaning for
                        <br />
                        <span className="text-brandy-rose-500">Charlotte & Fort Mill</span>
                    </h1>

                    {/* Subheadline */}
                    <p className="text-sm sm:text-base md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                        Reliable residential and office cleaning with vetted professionals,
                        flexible scheduling, and consistent results. Scheduled in minutes.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                        <Button
                            size="lg"
                            className="gap-2 h-12 px-8 w-full sm:w-auto text-base bg-brandy-rose-500 hover:bg-brandy-rose-600 text-white shadow-lg shadow-brandy-rose-500/20"
                            onClick={openChat}
                        >
                            <MessageCircle className="w-5 h-5" />
                            Chat with Carol
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="gap-2 h-12 px-8 w-full sm:w-auto text-base border-brandy-rose-200 hover:bg-brandy-rose-50 text-brandy-rose-700"
                            onClick={() => {
                                const element = document.getElementById('services')
                                if (element) element.scrollIntoView({ behavior: 'smooth' })
                            }}
                        >
                            Explore Services
                        </Button>
                    </div>

                    {/* Microcopy com alternativa SMS */}
                    <div className="flex flex-col items-center gap-4 mb-12 animate-in fade-in duration-1000 delay-400">
                        <p className="text-sm text-muted-foreground">
                            Get instant answers from Carol — most quotes within 5 minutes. Or{' '}
                            <a
                                href="sms:+15513897394"
                                className="text-brandy-rose-600 hover:underline font-medium"
                            >
                                text us
                            </a>
                            {' '}if you prefer.
                        </p>

                        {/* Reviews Badge */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                ))}
                            </div>
                            <span className="font-medium text-foreground">4.9</span>
                            <span>from 150+ reviews</span>
                        </div>
                    </div>

                    {/* Trust Indicators */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 text-sm font-medium text-muted-foreground animate-in fade-in duration-1000 delay-500">
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                            <div className="p-1 rounded-full bg-success/10 text-success">
                                <Shield className="w-4 h-4" />
                            </div>
                            <span>Charlotte & Fort Mill Region</span>
                        </div>
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                            <div className="p-1 rounded-full bg-success/10 text-success">
                                <Shield className="w-4 h-4" />
                            </div>
                            <span>Insured & Bonded</span>
                        </div>
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                            <div className="p-1 rounded-full bg-success/10 text-success">
                                <Shield className="w-4 h-4" />
                            </div>
                            <span>Background-Checked Team</span>
                        </div>
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                            <div className="p-1 rounded-full bg-success/10 text-success">
                                <Shield className="w-4 h-4" />
                            </div>
                            <span>Text to Schedule Anytime</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

'use client'

import { Button } from '@/components/ui/button'
import { MessageCircle, Star, Shield, ExternalLink } from 'lucide-react'
import { useBusinessSettings } from '@/lib/context/business-settings-context'
import { useTracking } from '@/components/tracking/tracking-provider'

export function Hero() {
    const settings = useBusinessSettings()
    const { trackEvent } = useTracking()

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
                    <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-white shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-full">
                        <span className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-brandy-rose-600 text-center">
                            Premium cleaning services in Fort Mill, SC & Charlotte, NC
                        </span>
                    </div>

                    {/* Headline */}
                    <h1 className="font-heading text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight text-foreground mb-6 text-balance animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                        {settings.hero_title_1 || 'Premium Cleaning for'}
                        <br />
                        <span className="text-brandy-rose-500">{settings.hero_title_2 || 'Homes & Office'}</span>
                    </h1>

                    {/* Subheadline */}
                    <p className="text-sm sm:text-base md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                        {settings.hero_subtitle}
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                        <Button
                            size="lg"
                            className="gap-2 h-12 px-8 w-full sm:w-auto text-base bg-brandy-rose-500 hover:bg-brandy-rose-600 text-white shadow-lg shadow-brandy-rose-500/20"
                            onClick={openChat}
                        >
                            <MessageCircle className="w-5 h-5" />
                            {settings.hero_cta_text}
                        </Button>
                    </div>

                    {/* Microcopy com alternativa SMS */}
                    <div className="flex flex-col items-center gap-4 mb-12 animate-in fade-in duration-1000 delay-400">
                        <p className="text-sm text-muted-foreground">
                            Talk to {settings.ai_name} and schedule a visit, usually within 5 minutes. Or, if you prefer,{' '}
                            <a
                                href={`sms:${settings.business_phone}`}
                                className="text-brandy-rose-600 hover:underline font-medium"
                                onClick={() => trackEvent('ClickToCall', { content_name: 'Hero SMS' })}
                            >
                                send us a message
                            </a>
                            .
                        </p>
                        <a
                            href={settings.badges_google_reviews_url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-brandy-rose-600 hover:text-brandy-rose-700 transition-colors"
                        >
                            <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                ))}
                            </div>
                            <span className="font-medium text-foreground">{settings.badges_rating || '4.9'}</span>
                            <span className="text-muted-foreground">based on {settings.badges_reviews_count || '150+'} reviews</span>
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </div>

                {/* Trust Indicators */}
                <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 text-sm font-medium text-muted-foreground animate-in fade-in duration-1000 delay-500">
                    <div className="flex items-center gap-2 justify-center xs:justify-start">
                        <div className="p-1 rounded-full bg-success/10 text-success">
                            <Shield className="w-4 h-4" />
                        </div>
                        <span>Local service in Fort Mill & Charlotte</span>
                    </div>
                    <div className="flex items-center gap-2 justify-center xs:justify-start">
                        <div className="p-1 rounded-full bg-success/10 text-success">
                            <Shield className="w-4 h-4" />
                        </div>
                        <span>Trusted professionals</span>
                    </div>
                    <div className="flex items-center gap-2 justify-center xs:justify-start">
                        <div className="p-1 rounded-full bg-success/10 text-success">
                            <Shield className="w-4 h-4" />
                        </div>
                        <span>Premium cleaning standards</span>
                    </div>
                    <div className="flex items-center gap-2 justify-center xs:justify-start">
                        <div className="p-1 rounded-full bg-success/10 text-success">
                            <Shield className="w-4 h-4" />
                        </div>
                        <span>Fast, personalized scheduling</span>
                    </div>
                </div>
            </div>
        </section>
    )
}

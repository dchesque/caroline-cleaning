'use client'

import { MessageCircle, CalendarCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBusinessSettings } from '@/lib/context/business-settings-context'
const steps = [
    {
        number: '01',
        icon: MessageCircle,
        title: 'Talk to Carol',
        description: 'Send details about your space and the service you need. Most visits are scheduled quickly.',
    },
    {
        number: '02',
        icon: CalendarCheck,
        title: 'Choose the Best Time',
        description: 'Select the day and time that work best for you. We confirm everything by message.',
    },
    {
        number: '03',
        icon: Sparkles,
        title: 'Enjoy the Cleaning',
        description: 'Enjoy a clean, organized space. If anything isn’t as expected, we’ll adjust it at no extra cost.',
    },
]

export function HowItWorks() {
    const settings = useBusinessSettings()

    const openChat = () => {
        window.dispatchEvent(new CustomEvent('open-chat'))
    }

    return (
        <section id="how-it-works" className="py-16 md:py-24 bg-white">
            <div className="container">
                {/* Section Header */}
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="font-heading text-3xl md:text-4xl text-foreground mb-4">
                        {settings.how_it_works_title || 'How Scheduling Works'}
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        {settings.how_it_works_subtitle || 'Keeping your space clean has never been easier.'}
                    </p>
                </div>

                {/* Steps */}
                <div className="grid md:grid-cols-3 gap-8 md:gap-12 mb-12">
                    {steps.map((step, index) => (
                        <div key={step.number} className="relative text-center group">
                            {/* Connector Line (desktop) */}
                            {index < steps.length - 1 && (
                                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-pampas" />
                            )}

                            {/* Step Number */}
                            <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-pot-pourri mb-6 transition-transform group-hover:scale-110 duration-300">
                                <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-brandy-rose-500 text-white text-xs font-bold flex items-center justify-center border-2 border-white">
                                    {step.number}
                                </span>
                                <step.icon className="w-10 h-10 text-brandy-rose-600" />
                            </div>

                            {/* Content */}
                            <h3 className="text-xl font-semibold text-foreground mb-2">
                                {step.title}
                            </h3>
                            <p className="text-base text-muted-foreground max-w-xs mx-auto">
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div className="text-center">
                    <Button size="lg" onClick={openChat} className="gap-2 bg-brandy-rose-500 hover:bg-brandy-rose-600 text-white" data-fbignore="true">
                        <MessageCircle className="w-4 h-4" />
                        {settings.how_it_works_cta || 'Request a Visit'}
                    </Button>
                </div>
            </div>
        </section>
    )
}

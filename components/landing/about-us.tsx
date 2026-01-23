// components/landing/about-us.tsx
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { CheckCircle2 } from 'lucide-react'
import { getBusinessSettingsClient, BusinessSettings } from '@/lib/business-config'

export function AboutUs() {
    const [settings, setSettings] = useState<BusinessSettings | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadSettings = async () => {
            const data = await getBusinessSettingsClient()
            setSettings(data)
            setIsLoading(false)
        }
        loadSettings()
    }, [])

    if (isLoading || !settings) return null

    return (
        <section id="about" className="py-16 md:py-24 bg-white">
            <div className="container px-4 md:px-6">
                {/* Section Header */}
                <div className="text-center mb-12 md:mb-16">
                    <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-4">
                        {settings.about_title}
                    </h2>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center max-w-6xl mx-auto">
                    {/* Image - Left Side */}
                    <div className="relative order-1 lg:order-1">
                        <div className="relative aspect-[4/5] max-w-md mx-auto lg:max-w-none">
                            {/* Decorative background */}
                            <div className="absolute -inset-4 bg-gradient-to-br from-brandy-rose-100 to-pot-pourri rounded-3xl -rotate-3" />

                            {/* Main image container */}
                            <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-[4/5]">
                                <Image
                                    src={settings.about_image || "/images/thayna.jpg"}
                                    alt="Founder & Owner"
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    priority
                                />
                            </div>

                            {/* Floating badge */}
                            <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-lg p-4 hidden md:block border border-pampas">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-brandy-rose-100 flex items-center justify-center">
                                        <span className="text-2xl" role="img" aria-label="Heart">🏠</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">{settings.about_founder_name || 'Thayna'}</p>
                                        <p className="text-sm text-muted-foreground">{settings.about_founder_role || 'Founder & Owner'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content - Right Side */}
                    <div className="order-2 lg:order-2 text-center lg:text-left">
                        {/* Company Intro */}
                        <div className="space-y-6 text-muted-foreground mb-10">
                            <p className="text-lg text-foreground font-medium">
                                {settings.about_intro_p1}
                            </p>
                            <p>
                                {settings.about_intro_p2}
                            </p>
                            {settings.about_note && (
                                <p className="p-4 bg-brandy-rose-50 rounded-2xl border border-brandy-rose-100 text-brandy-rose-700 text-sm">
                                    <strong>Note:</strong> {settings.about_note}
                                </p>
                            )}
                        </div>

                        {/* Quote */}
                        {settings.about_quote && (
                            <blockquote className="relative mb-10 pl-6 border-l-4 border-brandy-rose-300 italic text-xl text-foreground leading-relaxed">
                                &quot;{settings.about_quote}&quot;
                            </blockquote>
                        )}

                        {/* Highlights */}
                        <ul className="space-y-3">
                            {(settings.about_highlights || []).map((item, index) => (
                                <li key={index} className="flex items-center gap-3 justify-center lg:justify-start">
                                    <CheckCircle2 className="w-5 h-5 text-brandy-rose-500 flex-shrink-0" />
                                    <span className="text-foreground">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    )
}

'use client'

import { Shield, UserCheck, Sparkles, Clock, Star, Award } from 'lucide-react'
import { useBusinessSettings } from '@/lib/context/business-settings-context'

export function TrustBadges() {
    const settings = useBusinessSettings()

    if (!settings.badges_enabled) return null

    const badges = [
        {
            icon: Star,
            title: `${settings.badges_rating || '4.9'} Rating`,
            description: `Based on ${settings.badges_reviews_count || '200+'} reviews`,
        },
        {
            icon: Award,
            title: `${settings.badges_years_experience || '5+'} Years`,
            description: 'Of trusted service',
        },
        {
            icon: UserCheck,
            title: 'Verified professionals',
            description: 'Trusted and background-checked team',
        },
        {
            icon: Clock,
            title: 'Flexible scheduling',
            description: 'No contracts, pause anytime',
        },
    ]

    return (
        <section className="py-12 sm:py-20 bg-white border-y border-pampas">
            <div className="container">
                <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
                    {badges.map((badge) => (
                        <div
                            key={badge.title}
                            className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-500 hover:scale-105 transition-transform"
                        >
                            <div className="w-16 h-16 rounded-full bg-pot-pourri flex items-center justify-center mb-6 shadow-sm">
                                <badge.icon className="w-8 h-8 text-brandy-rose-600" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-3 font-heading">
                                {badge.title}
                            </h3>
                            <p className="text-base text-muted-foreground max-w-[200px] leading-relaxed">
                                {badge.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}


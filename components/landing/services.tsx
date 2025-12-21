'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Home, Building2, MessageCircle } from 'lucide-react'

const services = [
    {
        icon: Sparkles,
        title: 'Regular Cleaning',
        idealFor: 'Busy households who need consistent upkeep.',
        badge: 'Most Popular',
        badgeVariant: 'default' as const,
        color: 'text-[#6B8E6B]',
        bgColor: 'bg-[#E8F0E8]',
        features: ['Kitchen & bathrooms', 'Dusting & surfaces', 'Floors vacuumed & mopped'],
    },
    {
        icon: Sparkles,
        title: 'Deep Cleaning',
        idealFor: 'First-time or seasonal resets needing extra detail.',
        badge: 'Best Value',
        badgeVariant: 'secondary' as const,
        color: 'text-[#C4A35A]',
        bgColor: 'bg-[#FAF6EB]',
        features: ['Inside appliances', 'Baseboards & blinds', 'Detailed scrubbing'],
    },
    {
        icon: Home,
        title: 'Move-in/Move-out',
        idealFor: 'Empty homes ready for new beginnings.',
        badge: null,
        color: 'text-[#7B9EB8]',
        bgColor: 'bg-[#F0F5F8]',
        features: ['Inside all cabinets', 'Appliance cleaning', 'Window tracks'],
    },
    {
        icon: Building2,
        title: 'Office Cleaning',
        idealFor: 'Professional teams who value a fresh workplace.',
        badge: null,
        color: 'text-[#9B8BB8]',
        bgColor: 'bg-[#F5F3F8]',
        features: ['Workstation cleaning', 'Common areas', 'Trash removal'],
    },
]

export function Services() {
    const openChat = () => {
        window.dispatchEvent(new CustomEvent('open-chat'))
    }

    return (
        <section id="services" className="py-20 md:py-32 bg-desert-storm">
            <div className="container">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-6">
                        Cleaning Services
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        From recurring upkeep to detailed deep cleans, we tailor every visit
                        to your space — home or office.
                    </p>
                </div>

                {/* Services Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    {services.map((service) => (
                        <Card
                            key={service.title}
                            className="relative overflow-hidden flex flex-col h-full hover:shadow-xl transition-all duration-300 border-pampas bg-white rounded-3xl group"
                        >
                            <CardHeader className="pb-4">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`w-14 h-14 rounded-2xl ${service.bgColor} flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
                                        <service.icon className={`w-7 h-7 ${service.color}`} />
                                    </div>
                                    {service.badge && (
                                        <Badge variant={service.badgeVariant} className={service.badgeVariant === 'default' ? 'bg-[#6B8E6B] hover:bg-[#5a7a5a] py-1' : 'bg-[#C4A35A] hover:bg-[#b09250] text-white py-1'}>
                                            {service.badge}
                                        </Badge>
                                    )}
                                </div>
                                <CardTitle className="text-xl font-heading mb-3">{service.title}</CardTitle>
                                <div className="space-y-4">
                                    <div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 block mb-1">Ideal for:</span>
                                        <p className="text-sm text-muted-foreground leading-relaxed italic">
                                            "{service.idealFor}"
                                        </p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow pt-0">
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 block mb-3">Includes:</span>
                                <ul className="space-y-3 mb-8">
                                    {service.features.map((feature) => (
                                        <li
                                            key={feature}
                                            className="flex items-start gap-2 text-sm text-foreground/80"
                                        >
                                            <div className={`w-1.5 h-1.5 rounded-full ${service.color} bg-current mt-1.5 shrink-0`} />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    variant="ghost"
                                    onClick={openChat}
                                    className={`w-full justify-between items-center group-hover:bg-brandy-rose-50 text-brandy-rose-600 transition-colors p-0 hover:bg-transparent h-auto font-semibold`}
                                >
                                    Text for quote
                                    <MessageCircle className="w-4 h-4 ml-2" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* CTA */}
                <div className="text-center bg-white p-8 rounded-3xl border border-pampas shadow-sm max-w-2xl mx-auto">
                    <p className="text-base text-muted-foreground mb-6">
                        Not sure which service fits? Text Carol for a recommendation.
                    </p>
                    <Button onClick={openChat} size="lg" className="gap-2 bg-brandy-rose-500 hover:bg-brandy-rose-600 text-white px-8">
                        <MessageCircle className="w-5 h-5" />
                        Text Carol Now
                    </Button>
                </div>
            </div>
        </section>
    )
}

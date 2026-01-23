'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Home, Building2, MessageCircle, ArrowRight } from 'lucide-react'
import { useBusinessSettings } from '@/lib/context/business-settings-context'

const services = [
    {
        icon: Sparkles,
        title: 'Regular Cleaning',
        idealFor: 'Occupied homes that require ongoing maintenance.',
        badge: 'Most Popular',
        badgeVariant: 'default' as const,
        color: 'text-[#6B8E6B]',
        bgColor: 'bg-[#E8F0E8]',
        features: ['Kitchen cleaning (external faces)', 'Full bathroom cleaning', 'Accessible surfaces', 'Vacuuming & mopping', 'Trash removal'],
    },
    {
        icon: Sparkles,
        title: 'Deep Cleaning',
        idealFor: 'First-time cleanings or spaces that need extra attention.',
        badge: 'Best Value',
        badgeVariant: 'secondary' as const,
        color: 'text-[#C4A35A]',
        bgColor: 'bg-[#FAF6EB]',
        features: ['Everything in Regular', 'Detailed kitchen/bath', 'Baseboard cleaning', 'Doors & handles', 'Heavy buildup removal'],
    },
    {
        icon: Home,
        title: 'Move-in/Move-out',
        idealFor: 'Empty homes preparing for new occupants.',
        badge: null,
        color: 'text-[#7B9EB8]',
        bgColor: 'bg-[#F0F5F8]',
        features: ['Full room cleaning', 'Inside empty cabinets', 'Inside appliances', 'Detailed kitchen/bath', 'Window/door tracks'],
    },
    {
        icon: Building2,
        title: 'Office Cleaning',
        idealFor: 'Professional environments that value cleanliness.',
        badge: null,
        color: 'text-[#9B8BB8]',
        bgColor: 'bg-[#F5F3F8]',
        features: ['Workstations & desks', 'Common areas', 'Bathroom & kitchen', 'Vacuuming & floor cleaning', 'Trash removal'],
    },
]

export function Services() {
    const settings = useBusinessSettings()

    const openChat = () => {
        window.dispatchEvent(new CustomEvent('open-chat'))
    }

    return (
        <section id="services" className="py-20 md:py-32 bg-desert-storm">
            <div className="container">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-6">
                        {settings.services_title || 'Cleaning Services'}
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        {settings.services_subtitle || 'From routine care to detailed deep cleaning, each service is customized to meet the specific needs of your space.'}
                    </p>
                    <div className="mt-8 font-heading text-2xl font-bold text-foreground">
                        Most Requested Services
                    </div>
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
                                    size="sm"
                                    onClick={openChat}
                                    className="mt-4 gap-2 text-brandy-rose-600 hover:text-brandy-rose-700 hover:bg-brandy-rose-50 p-0 h-auto font-semibold"
                                >
                                    Schedule Visit Now
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Help Card CTA */}
                <div className="text-center bg-white p-10 rounded-3xl border border-pampas shadow-sm max-w-3xl mx-auto">
                    <h3 className="text-2xl font-heading font-bold mb-3">Need a Custom Quote?</h3>
                    <p className="text-lg text-muted-foreground mb-8">
                        Every space is unique. Tell us about your home or business, and we’ll help you find the perfect cleaning service at the best price.
                    </p>
                    <Button
                        onClick={openChat}
                        size="lg"
                        className="gap-2 bg-brandy-rose-500 hover:bg-brandy-rose-600 text-white min-w-[240px] h-14 text-lg"
                    >
                        <MessageCircle className="w-5 h-5" />
                        Schedule Visit Now
                    </Button>
                    <p className="mt-4 text-sm text-muted-foreground italic">Get a quote now.</p>
                </div>
            </div>
        </section>
    )
}

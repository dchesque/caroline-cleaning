'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Home, Building2, MessageCircle } from 'lucide-react'

const services = [
    {
        icon: Sparkles,
        title: 'Regular Cleaning',
        description: 'Weekly or bi-weekly maintenance cleaning to keep your home fresh and tidy. Perfect for busy families.',
        badge: 'Most Popular',
        badgeVariant: 'default' as const,
        color: 'text-[#6B8E6B]',
        bgColor: 'bg-[#E8F0E8]',
        features: ['Dusting & Vacuuming', 'Kitchen & Bathrooms', 'Mopping Floors', 'Making Beds'],
    },
    {
        icon: Sparkles,
        title: 'Deep Cleaning',
        description: 'Thorough top-to-bottom cleaning including hard-to-reach areas. Ideal for first-time or seasonal cleaning.',
        badge: 'Best Value',
        badgeVariant: 'secondary' as const,
        color: 'text-[#C4A35A]',
        bgColor: 'bg-[#FAF6EB]',
        features: ['Inside Appliances', 'Baseboards & Blinds', 'Cabinet Fronts', 'Detailed Scrubbing'],
    },
    {
        icon: Home,
        title: 'Move-in/Move-out',
        description: 'Complete cleaning for empty homes. Perfect for moving day or preparing for new tenants.',
        badge: null,
        color: 'text-[#7B9EB8]',
        bgColor: 'bg-[#F0F5F8]',
        features: ['Empty Home Cleaning', 'Inside All Cabinets', 'Appliance Cleaning', 'Window Tracks'],
    },
    {
        icon: Building2,
        title: 'Office Cleaning',
        description: 'Professional cleaning for commercial spaces. Keep your workplace clean and productive.',
        badge: null,
        color: 'text-[#9B8BB8]',
        bgColor: 'bg-[#F5F3F8]',
        features: ['Workstation Cleaning', 'Common Areas', 'Restroom Sanitation', 'Trash Removal'],
    },
]

export function Services() {
    const openChat = () => {
        window.dispatchEvent(new CustomEvent('open-chat'))
    }

    return (
        <section id="services" className="py-16 md:py-24 bg-desert-storm">
            <div className="container">
                {/* Section Header */}
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <h2 className="font-heading text-3xl md:text-4xl text-foreground mb-4">
                        Our Services
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        From regular maintenance to deep cleaning, we offer services tailored
                        to your needs. All backed by our satisfaction guarantee.
                    </p>
                </div>

                {/* Services Grid */}
                <div className="grid md:grid-cols-2 gap-6 mb-12">
                    {services.map((service) => (
                        <Card
                            key={service.title}
                            className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-pampas bg-white"
                        >
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className={`w-12 h-12 rounded-lg ${service.bgColor} flex items-center justify-center transition-transform hover:scale-110`}>
                                        <service.icon className={`w-6 h-6 ${service.color}`} />
                                    </div>
                                    {service.badge && (
                                        <Badge variant={service.badgeVariant} className={service.badgeVariant === 'default' ? 'bg-[#6B8E6B] hover:bg-[#5a7a5a]' : 'bg-[#C4A35A] hover:bg-[#b09250] text-white'}>
                                            {service.badge}
                                        </Badge>
                                    )}
                                </div>
                                <CardTitle className="text-xl mt-4 font-heading">{service.title}</CardTitle>
                                <CardDescription className="text-base">
                                    {service.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {service.features.map((feature) => (
                                        <li
                                            key={feature}
                                            className="flex items-center gap-2 text-sm text-muted-foreground"
                                        >
                                            <div className={`w-1.5 h-1.5 rounded-full ${service.color} bg-current`} />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* CTA */}
                <div className="text-center">
                    <p className="text-base text-muted-foreground mb-4">
                        Not sure which service you need? Chat with Carol for a personalized recommendation.
                    </p>
                    <Button onClick={openChat} className="gap-2 bg-brandy-rose-500 hover:bg-brandy-rose-600 text-white">
                        <MessageCircle className="w-4 h-4" />
                        Get a Free Quote
                    </Button>
                </div>
            </div>
        </section>
    )
}

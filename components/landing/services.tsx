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
        idealFor: 'Busy homeowners who need reliable, ongoing cleaning services.',
        badge: 'Most Popular',
        badgeVariant: 'default' as const,
        color: 'text-[#6B8E6B]',
        bgColor: 'bg-[#E8F0E8]',
        features: ['Kitchen cleaning (external surfaces, sink, and countertops)', 'Full bathroom cleaning (sinks, toilets, mirrors, and surfaces)', 'Cleaning of accessible surfaces throughout the home', 'Vacuuming of floors and carpets', 'Floor cleaning (when applicable)', 'Trash removal'],
    },
    {
        icon: Sparkles,
        title: 'Deep Cleaning',
        idealFor: 'First-time cleanings or spaces that need extra attention.',
        badge: 'Best Value',
        badgeVariant: 'secondary' as const,
        color: 'text-[#C4A35A]',
        bgColor: 'bg-[#FAF6EB]',
        features: ['Everything included in Regular Cleaning', 'Detailed kitchen and bathroom cleaning', 'Baseboard cleaning', 'Cleaning of doors, handles, and light switches', 'Interior cleaning of accessible windows', 'Cleaning of areas with heavy buildup', 'Extra attention to details, corners, and finishes'],
    },
    {
        icon: Home,
        title: 'Move-In / Move-Out Cleaning',
        idealFor: 'Empty homes preparing for new occupants.',
        badge: null,
        color: 'text-[#7B9EB8]',
        bgColor: 'bg-[#F0F5F8]',
        features: ['Full cleaning of all rooms', 'Interior and exterior cleaning of empty cabinets', 'Interior and exterior cleaning of appliances', 'Detailed kitchen and bathroom cleaning', 'Vacuuming and cleaning of all floors', 'Cleaning of window and door tracks', 'Removal of light debris left in the property'],
    },
    {
        icon: Building2,
        title: 'Office Cleaning',
        idealFor: 'Professional environments that value cleanliness and organization.',
        badge: null,
        color: 'text-[#9B8BB8]',
        bgColor: 'bg-[#F5F3F8]',
        features: ['Cleaning of workstations', 'Cleaning of desks, surfaces, and common areas', 'Bathroom cleaning', 'Kitchen or breakroom cleaning', 'Vacuuming and floor cleaning', 'Trash removal'],
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
                                    data-fbignore="true"
                                >
                                    Request a quote
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
                        data-fbignore="true"
                    >
                        <MessageCircle className="w-5 h-5" />
                        Request a Quote
                    </Button>
                    <p className="mt-4 text-sm text-muted-foreground italic">Get a quote today.</p>
                </div>
            </div>
        </section>
    )
}

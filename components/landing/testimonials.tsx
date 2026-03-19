'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Star, Quote, MessageCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBusinessSettings } from '@/lib/context/business-settings-context'

export function Testimonials() {
    const settings = useBusinessSettings()

    const defaultTestimonials = [
        {
            name: 'Client Feedback',
            role: 'Verified Review',
            content: "At first, I was hesitant to hire a cleaning service, but the experience was great. Three months in, and I'm still extremely satisfied.",
            rating: 5,
        },
        {
            name: 'Client Feedback',
            role: 'Verified Review',
            content: "Everything was handled by message, fast, simple, and very convenient.",
            rating: 5,
        },
        {
            name: 'Client Feedback',
            role: 'Verified Review',
            content: "I love the flexibility. I paused service during a trip and restarted without any issues. Excellent flexibility. No contracts and no hassle.",
            rating: 5,
        },
    ]

    const testimonials = settings.testimonials_items?.length > 0
        ? settings.testimonials_items
        : defaultTestimonials

    return (
        <section id="testimonials" className="py-16 md:py-24 bg-desert-storm overflow-hidden">
            <div className="container">
                {/* Section Header */}
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="font-heading text-3xl md:text-4xl text-foreground mb-4">
                        {settings.testimonials_title || 'What Our Clients Say'}
                    </h2>
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
                        <span className="font-medium">Average rating {settings.badges_rating || '4.9'} based on {settings.badges_reviews_count || '150+'} reviews</span>
                        <ExternalLink className="w-3 h-3" />
                    </a>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {testimonials.slice(0, 3).map((testimonial, index) => (
                        <Card key={index} className="bg-white border-none shadow-lg h-full">
                            <CardContent className="p-8 text-center flex flex-col h-full">
                                <div className="mb-6 flex justify-center text-brandy-rose-400">
                                    <Quote className="w-12 h-12 opacity-50" />
                                </div>

                                <div className="flex justify-center gap-1 mb-6">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} className="w-5 h-5 fill-brandy-rose-500 text-brandy-rose-500" />
                                    ))}
                                </div>

                                <blockquote className="text-lg font-heading leading-relaxed text-foreground mb-8 flex-1">
                                    &quot;{testimonial.content}&quot;
                                </blockquote>

                                <div>
                                    <div className="font-bold text-foreground">{testimonial.name}</div>
                                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Testimonials CTA */}
                <div className="mt-16 text-center">
                    <Button
                        size="lg"
                        onClick={() => window.dispatchEvent(new CustomEvent('open-chat'))}
                        className="gap-2 bg-brandy-rose-500 hover:bg-brandy-rose-600 text-white"
                    >
                        <MessageCircle className="w-4 h-4" />
                        Schedule a Visit
                    </Button>
                </div>
            </div>
        </section>
    )
}

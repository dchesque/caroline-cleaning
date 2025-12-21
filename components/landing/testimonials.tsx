'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Star, Quote, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const testimonials = [
    {
        name: 'Sarah M.',
        role: 'Charlotte, NC',
        image: null,
        content: "They're consistent, on time, and detail-focused. Booking by text is incredibly easy.",
        rating: 5,
    },
    {
        name: 'James R.',
        role: 'Fort Mill, SC',
        image: null,
        content: "Deep clean was worth it — everything felt brand new. Highly recommend their service.",
        rating: 5,
    },
    {
        name: 'Emily C.',
        role: 'Charlotte, NC',
        image: null,
        content: "Our office looks professional every week. Reliable service and great communication.",
        rating: 5,
    },
]

export function Testimonials() {
    return (
        <section id="testimonials" className="py-16 md:py-24 bg-desert-storm overflow-hidden">
            <div className="container">
                {/* Section Header */}
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="font-heading text-3xl md:text-4xl text-foreground mb-4">
                        What Customers Say
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Real feedback from clients in Charlotte, NC & Fort Mill, SC.
                    </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {testimonials.slice(0, 3).map((testimonial, index) => ( // Showing top 3 to match design
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
                                    "{testimonial.content}"
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
                        Chat with Carol
                    </Button>
                </div>
            </div>
        </section>
    )
}

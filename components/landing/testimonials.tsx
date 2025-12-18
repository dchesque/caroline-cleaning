'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Star, Quote } from 'lucide-react'

const testimonials = [
    {
        name: 'Sarah Mitchell',
        role: 'Homeowner',
        image: null,
        content: "Caroline Premium Cleaning has transformed my home! The team was professional, punctual, and left my house sparkling clean. I especially love how easy it is to schedule via chat.",
        rating: 5,
    },
    {
        name: 'James Rodriguez',
        role: 'Business Owner',
        image: null,
        content: "We use their office cleaning service weekly. They are reliable and extremely thorough. The best commercial cleaning service we've found in Miami.",
        rating: 5,
    },
    {
        name: 'Emily Chen',
        role: 'Busy Mom',
        image: null,
        content: "As a mom of three, I rarely have time for deep cleaning. Carol's team came in and worked miracles. The deep cleaning service is worth every penny!",
        rating: 5,
    },
    /* Added minimal logic to render 3 items if needed, or keeping original 3 from file (wait, original had 4 items, but prompt says 3 visible on desktop) 
       If I use grid-cols-3, the 4th item will wrap to new line or be hidden?
       Prompt: "Desktop: 3 cards visíveis". 
       I will just render the grid. If there are 4, 3 on top row, 1 on bottom. Or I can limit to 3. 
       I will limit to 3 for the "3 cards visible" requirement to keep it clean, or just let it flow. 
       Let's keep all 4 but in a grid.
    */
    {
        name: 'Michael Torres',
        role: 'Real Estate Agent',
        image: null,
        content: "I recommend Caroline Premium Cleaning to all my clients moving in or out. They make the process seamless and the results are always impressive.",
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
                        What Our Clients Say
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Don't just take our word for it. Read reviews from our satisfied clients
                        across Miami.
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
            </div>
        </section>
    )
}

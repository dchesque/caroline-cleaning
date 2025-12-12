'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react'

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
    {
        name: 'Michael Torres',
        role: 'Real Estate Agent',
        image: null,
        content: "I recommend Caroline Premium Cleaning to all my clients moving in or out. They make the process seamless and the results are always impressive.",
        rating: 5,
    },
]

export function Testimonials() {
    const [currentIndex, setCurrentIndex] = useState(0)

    const next = () => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }

    const prev = () => {
        setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
    }

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

                {/* Carousel */}
                <div className="relative max-w-4xl mx-auto">
                    <div className="overflow-hidden">
                        <div
                            className="flex transition-transform duration-500 ease-in-out"
                            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                        >
                            {testimonials.map((testimonial, index) => (
                                <div key={index} className="w-full flex-shrink-0 px-4">
                                    <Card className="bg-white border-none shadow-lg">
                                        <CardContent className="p-8 md:p-12 text-center">
                                            <div className="mb-6 flex justify-center text-brandy-rose-400">
                                                <Quote className="w-12 h-12 opacity-50" />
                                            </div>

                                            <div className="flex justify-center gap-1 mb-6">
                                                {[...Array(testimonial.rating)].map((_, i) => (
                                                    <Star key={i} className="w-5 h-5 fill-brandy-rose-500 text-brandy-rose-500" />
                                                ))}
                                            </div>

                                            <blockquote className="text-xl md:text-2xl font-heading leading-relaxed text-foreground mb-8">
                                                "{testimonial.content}"
                                            </blockquote>

                                            <div>
                                                <div className="font-bold text-foreground">{testimonial.name}</div>
                                                <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex justify-center gap-4 mt-8">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={prev}
                            className="rounded-full h-12 w-12 border-brandy-rose-200 hover:bg-brandy-rose-50 hover:text-brandy-rose-600"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={next}
                            className="rounded-full h-12 w-12 border-brandy-rose-200 hover:bg-brandy-rose-50 hover:text-brandy-rose-600"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </Button>
                    </div>

                    {/* Dots */}
                    <div className="flex justify-center gap-2 mt-6">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                className={`w-2.5 h-2.5 rounded-full transition-colors ${index === currentIndex ? 'bg-brandy-rose-500' : 'bg-brandy-rose-200'
                                    }`}
                                onClick={() => setCurrentIndex(index)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

// components/landing/about-us.tsx
'use client'

import Image from 'next/image'
import { CheckCircle2 } from 'lucide-react'

const highlights = [
    '5+ years of professional cleaning experience',
    '500+ happy homes across Miami',
    'Locally owned & operated with love',
]

export function AboutUs() {
    return (
        <section id="about" className="py-16 md:py-24 bg-white">
            <div className="container px-4 md:px-6">
                {/* Section Header */}
                <div className="text-center mb-12 md:mb-16">
                    <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl text-foreground mb-4">
                        About Us
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Meet the heart behind the clean
                    </p>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center max-w-6xl mx-auto">
                    {/* Image - Left Side */}
                    <div className="relative order-1 lg:order-1">
                        <div className="relative aspect-[4/5] max-w-md mx-auto lg:max-w-none">
                            {/* Decorative background */}
                            <div className="absolute -inset-4 bg-gradient-to-br from-brandy-rose-100 to-pot-pourri rounded-3xl -rotate-3" />

                            {/* Main image container - Placeholder Design */}
                            <div className="relative rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-brandy-rose-100 to-pot-pourri aspect-[4/5] flex items-center justify-center">
                                <div className="text-center p-8">
                                    <div className="w-24 h-24 rounded-full bg-white/50 flex items-center justify-center mx-auto mb-4">
                                        <span className="text-5xl" role="img" aria-label="Owner">👩‍🦰</span>
                                    </div>
                                    <p className="text-brandy-rose-600 font-medium font-heading text-xl">Thayna</p>
                                    <p className="text-brandy-rose-400 text-sm">Founder & Owner</p>
                                </div>
                            </div>

                            {/* Floating badge */}
                            <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-lg p-4 hidden md:block border border-pampas">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-brandy-rose-100 flex items-center justify-center">
                                        <span className="text-2xl" role="img" aria-label="Heart">💖</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">Locally Owned</p>
                                        <p className="text-sm text-muted-foreground">Miami, FL</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content - Right Side */}
                    <div className="order-2 lg:order-2 text-center lg:text-left">
                        {/* Greeting */}
                        <h3 className="font-heading text-2xl md:text-3xl text-foreground mb-4">
                            Hi, I'm Thayna!
                        </h3>

                        {/* Story */}
                        <div className="space-y-4 text-muted-foreground mb-8">
                            <p>
                                I started Caroline Premium Cleaning with a simple belief: everyone
                                deserves to come home to a clean, peaceful space without sacrificing
                                their precious time.
                            </p>
                            <p>
                                After years of working in the cleaning industry, I noticed something
                                was missing – the personal touch. That's why I created a service
                                that treats every home like my own, with attention to detail and
                                genuine care.
                            </p>
                            <p>
                                When you choose Caroline Premium Cleaning, you're not just hiring
                                a cleaning service – you're welcoming someone who truly cares about
                                making your life easier.
                            </p>
                        </div>

                        {/* Quote */}
                        <blockquote className="relative mb-8 pl-4 border-l-4 border-brandy-rose-300 italic text-lg text-foreground">
                            "My mission is to give you back your time while keeping your home
                            spotless and welcoming."
                        </blockquote>

                        {/* Highlights */}
                        <ul className="space-y-3">
                            {highlights.map((item, index) => (
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

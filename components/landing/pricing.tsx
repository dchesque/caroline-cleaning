'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageCircle, Sparkles, Home, Building2, Loader2 } from 'lucide-react'

interface PricingItem {
    id: string
    service_type: string
    service_name: string
    description: string
    price_min: number
    price_max: number
    price_unit: string
    badge: string | null
    display_order: number
}

const serviceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    regular: Sparkles,
    deep: Sparkles,
    moveinout: Home,
    office: Building2,
}

const serviceColors: Record<string, { text: string; bg: string }> = {
    regular: { text: 'text-[#6B8E6B]', bg: 'bg-[#E8F0E8]' },
    deep: { text: 'text-[#C4A35A]', bg: 'bg-[#FAF6EB]' },
    moveinout: { text: 'text-[#7B9EB8]', bg: 'bg-[#F0F5F8]' },
    office: { text: 'text-[#9B8BB8]', bg: 'bg-[#F5F3F8]' },
}

export function Pricing() {
    const [pricing, setPricing] = useState<PricingItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchPricing() {
            try {
                const response = await fetch('/api/pricing')
                const result = await response.json()

                if (result.success) {
                    setPricing(result.data)
                } else {
                    setError('Failed to load pricing')
                }
            } catch (err) {
                setError('Failed to load pricing')
            } finally {
                setIsLoading(false)
            }
        }

        fetchPricing()
    }, [])

    const openChat = () => {
        window.dispatchEvent(new CustomEvent('open-chat'))
    }

    if (isLoading) {
        return (
            <section id="pricing" className="py-20 md:py-32 bg-white">
                <div className="container flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-brandy-rose-500" />
                </div>
            </section>
        )
    }

    if (error || pricing.length === 0) {
        return null // Não mostrar seção se houver erro
    }

    return (
        <section id="pricing" className="py-20 md:py-32 bg-white">
            <div className="container">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-6">
                        Transparent Pricing
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Honest pricing with no hidden fees. Final quote depends on home size and specific needs.
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
                    {pricing.map((item) => {
                        const Icon = serviceIcons[item.service_type] || Sparkles
                        const colors = serviceColors[item.service_type] || { text: 'text-brandy-rose-600', bg: 'bg-brandy-rose-50' }

                        return (
                            <Card
                                key={item.id}
                                className="relative border-pampas hover:shadow-lg transition-shadow duration-300"
                            >
                                {item.badge && (
                                    <Badge
                                        className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brandy-rose-500 text-white"
                                    >
                                        {item.badge}
                                    </Badge>
                                )}

                                <CardHeader className="text-center pb-2">
                                    <div className={`w-14 h-14 rounded-2xl ${colors.bg} flex items-center justify-center mx-auto mb-4`}>
                                        <Icon className={`w-7 h-7 ${colors.text}`} />
                                    </div>
                                    <CardTitle className="text-lg font-semibold">
                                        {item.service_name}
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="text-center">
                                    <p className="text-sm text-muted-foreground mb-4">
                                        {item.description}
                                    </p>

                                    <div className="mb-2">
                                        <span className="text-3xl font-bold text-foreground">
                                            ${Number(item.price_min).toFixed(0)}
                                        </span>
                                        <span className="text-xl text-muted-foreground">
                                            {' '}-{' '}
                                        </span>
                                        <span className="text-3xl font-bold text-foreground">
                                            ${Number(item.price_max).toFixed(0)}
                                        </span>
                                    </div>

                                    <p className="text-xs text-muted-foreground">
                                        {item.price_unit}
                                    </p>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                {/* CTA */}
                <div className="text-center">
                    <p className="text-muted-foreground mb-4">
                        Want an exact quote? Chat with Carol — most quotes ready in under 5 minutes.
                    </p>
                    <Button
                        size="lg"
                        onClick={openChat}
                        className="gap-2 bg-brandy-rose-500 hover:bg-brandy-rose-600 text-white"
                    >
                        <MessageCircle className="w-5 h-5" />
                        Request a Quote
                    </Button>
                </div>
            </div>
        </section>
    )
}

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Users, DollarSign, Star, Loader2, AlertCircle } from 'lucide-react'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { useAdminI18n } from '@/lib/admin-i18n/context'

function formatCurrencyLocale(value: number, locale: string) {
    return new Intl.NumberFormat(locale === 'pt-BR' ? 'pt-BR' : 'en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(value)
}

interface DashboardStats {
    agendamentosHoje: number
    confirmadosHoje: number
    novosLeads: number
    receitaMes: number
    ratingMedio: string
}

export function StatsCards() {
    const { t, locale } = useAdminI18n()
    const dashboardT = t('dashboard')
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const supabase = createClient()

    useEffect(() => {
        async function fetchStats() {
            try {
                const today = new Date()
                const dayStart = startOfDay(today).toISOString()
                const dayEnd = endOfDay(today).toISOString()

                // Run all queries in parallel
                const [
                    agendamentosRes,
                    confirmadosRes,
                    leadsRes,
                    financeiroRes,
                    ratingsRes,
                ] = await Promise.all([
                    supabase
                        .from('agendamentos')
                        .select('*', { count: 'exact', head: true })
                        .gte('data', dayStart)
                        .lte('data', dayEnd),
                    supabase
                        .from('agendamentos')
                        .select('*', { count: 'exact', head: true })
                        .gte('data', dayStart)
                        .lte('data', dayEnd)
                        .eq('status', 'confirmado'),
                    supabase
                        .from('clientes')
                        .select('*', { count: 'exact', head: true })
                        .gte('created_at', startOfWeek(today).toISOString())
                        .lte('created_at', endOfWeek(today).toISOString())
                        .eq('status', 'lead'),
                    supabase
                        .from('financeiro')
                        .select('valor')
                        .gte('data_pagamento', startOfMonth(today).toISOString())
                        .lte('data_pagamento', endOfMonth(today).toISOString())
                        .eq('status', 'pago'),
                    supabase
                        .from('feedback')
                        .select('rating')
                        .gte('created_at', new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()),
                ])

                const receitaMes = financeiroRes.data?.reduce((acc, curr) => acc + Number(curr.valor), 0) || 0
                const ratings = ratingsRes.data
                const ratingMedio = ratings?.length
                    ? (ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length).toFixed(1)
                    : '5.0'

                setStats({
                    agendamentosHoje: agendamentosRes.count || 0,
                    confirmadosHoje: confirmadosRes.count || 0,
                    novosLeads: leadsRes.count || 0,
                    receitaMes,
                    ratingMedio,
                })
            } catch (err) {
                console.error('Failed to fetch dashboard stats:', err)
                setError('Failed to load stats')
            } finally {
                setIsLoading(false)
            }
        }
        fetchStats()
    }, [])

    if (isLoading) {
        return (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="border-none shadow-sm animate-pulse">
                        <CardContent className="p-6 h-32 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <Card className="border-none shadow-sm col-span-full">
                    <CardContent className="p-6 flex items-center gap-3 text-destructive">
                        <AlertCircle className="w-5 h-5" />
                        <p className="text-sm">{error}</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!stats) return null

    const cards = [
        {
            title: dashboardT.stats.appointmentsToday,
            value: stats.agendamentosHoje,
            subtitle: `${stats.confirmadosHoje} ${dashboardT.subtitles.confirmed}`,
            icon: Calendar,
            color: 'text-[#C48B7F]',
            bgColor: 'bg-[#F9F1F0]',
        },
        {
            title: dashboardT.stats.newLeads,
            value: stats.novosLeads,
            subtitle: dashboardT.subtitles.thisWeek,
            icon: Users,
            color: 'text-blue-500',
            bgColor: 'bg-blue-50',
        },
        {
            title: dashboardT.stats.revenueMonth,
            value: formatCurrencyLocale(stats.receitaMes, locale),
            subtitle: dashboardT.subtitles.vsLastMonth,
            icon: DollarSign,
            color: 'text-green-500',
            bgColor: 'bg-green-50',
        },
        {
            title: dashboardT.stats.averageRating,
            value: stats.ratingMedio,
            subtitle: dashboardT.subtitles.last90Days,
            icon: Star,
            color: 'text-yellow-500',
            bgColor: 'bg-yellow-50',
        },
    ]

    return (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {cards.map((card) => (
                <Card key={card.title} className="border-none shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                                <p className="text-2xl font-bold text-foreground mt-1">{card.value}</p>
                                <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
                            </div>
                            <div className={`p-3 rounded-lg ${card.bgColor}`}>
                                <card.icon className={`w-5 h-5 ${card.color}`} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Users, DollarSign, Star, Loader2 } from 'lucide-react'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { useAdminI18n } from '@/lib/admin-i18n/context'

function formatCurrency(value: number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(value)
}

export function StatsCards() {
    const { t } = useAdminI18n()
    const dashboardT = t('dashboard')
    const [isLoading, setIsLoading] = useState(true)
    const [stats, setStats] = useState<any>(null)
    const supabase = createClient()

    useEffect(() => {
        async function fetchStats() {
            const today = new Date()

            // Agendamentos Hoje
            const { count: agendamentosHoje } = await supabase
                .from('agendamentos')
                .select('*', { count: 'exact', head: true })
                .gte('data', startOfDay(today).toISOString())
                .lte('data', endOfDay(today).toISOString())

            const { count: confirmadosHoje } = await supabase
                .from('agendamentos')
                .select('*', { count: 'exact', head: true })
                .gte('data', startOfDay(today).toISOString())
                .lte('data', endOfDay(today).toISOString())
                .eq('status', 'confirmado')

            // Novos Leads Semana
            const { count: novosLeads } = await supabase
                .from('clientes')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', startOfWeek(today).toISOString())
                .lte('created_at', endOfWeek(today).toISOString())
                .eq('status', 'lead')

            // Receita Mês
            const { data: financeiroMes } = await supabase
                .from('financeiro')
                .select('valor')
                .gte('data_pagamento', startOfMonth(today).toISOString())
                .lte('data_pagamento', endOfMonth(today).toISOString())
                .eq('status', 'pago')

            const receitaMes = financeiroMes?.reduce((acc, curr) => acc + Number(curr.valor), 0) || 0

            // Avaliação Média (last 90 days)
            const ninetyDaysAgo = new Date()
            ninetyDaysAgo.setDate(today.getDate() - 90)

            const { data: ratings } = await supabase
                .from('feedback')
                .select('rating')
                .gte('created_at', ninetyDaysAgo.toISOString())

            const ratingMedio = ratings?.length
                ? (ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length).toFixed(1)
                : '5.0'

            setStats({
                agendamentosHoje: agendamentosHoje || 0,
                confirmadosHoje: confirmadosHoje || 0,
                novosLeads: novosLeads || 0,
                receitaMes,
                ratingMedio
            })
            setIsLoading(false)
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
            value: formatCurrency(stats.receitaMes),
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

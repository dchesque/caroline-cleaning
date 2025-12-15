// components/analytics/top-metrics.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import {
    TrendingUp,
    Clock,
    Star,
    Repeat,
    DollarSign,
    Users
} from 'lucide-react'

interface Metric {
    label: string
    value: string
    icon: any
    trend?: string
    trendUp?: boolean
}

export function TopMetrics() {
    const [metrics, setMetrics] = useState<Metric[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchMetrics = async () => {
            // Ticket médio
            const { data: revenue } = await supabase
                .from('financeiro')
                .select('valor')
                .eq('tipo', 'receita')
                .eq('status', 'pago')

            const avgTicket = revenue && revenue.length > 0
                ? revenue.reduce((acc, r) => acc + r.valor, 0) / revenue.length
                : 0

            // Taxa de retenção (clientes com mais de 1 agendamento)
            const { data: clients } = await supabase
                .from('clientes')
                .select('id')
                .eq('status', 'ativo')

            let retentionCount = 0
            if (clients) {
                for (const client of clients) {
                    const { count } = await supabase
                        .from('agendamentos')
                        .select('*', { count: 'exact', head: true })
                        .eq('cliente_id', client.id)
                        .eq('status', 'concluido')

                    if (count && count > 1) retentionCount++
                }
            }

            const retentionRate = clients && clients.length > 0
                ? (retentionCount / clients.length) * 100
                : 0

            // Avaliação média
            const { data: feedback } = await supabase
                .from('feedback')
                .select('rating')

            const avgRating = feedback && feedback.length > 0
                ? feedback.reduce((acc, f) => acc + f.rating, 0) / feedback.length
                : 0

            // Tempo médio de resposta (mock por enquanto)
            const avgResponseTime = '< 1 min'

            // LTV estimado (ticket médio * frequência média)
            const estimatedLTV = avgTicket * 12 // Assumindo 1 serviço por mês

            setMetrics([
                {
                    label: 'Ticket Médio',
                    value: formatCurrency(avgTicket),
                    icon: DollarSign,
                    trend: '+5.2%',
                    trendUp: true
                },
                {
                    label: 'Taxa de Retenção',
                    value: `${retentionRate.toFixed(1)}%`,
                    icon: Repeat,
                    trend: '+2.1%',
                    trendUp: true
                },
                {
                    label: 'Avaliação Média',
                    value: avgRating > 0 ? `${avgRating.toFixed(1)} ⭐` : 'N/A',
                    icon: Star,
                },
                {
                    label: 'Tempo de Resposta',
                    value: avgResponseTime,
                    icon: Clock,
                },
                {
                    label: 'LTV Estimado',
                    value: formatCurrency(estimatedLTV),
                    icon: TrendingUp,
                },
                {
                    label: 'Clientes Ativos',
                    value: clients?.length.toString() || '0',
                    icon: Users,
                },
            ])

            setIsLoading(false)
        }

        fetchMetrics()
    }, [])

    if (isLoading) {
        return <div className="h-[350px] flex items-center justify-center text-muted-foreground">Carregando...</div>
    }

    return (
        <div className="space-y-4">
            {metrics.map((metric) => {
                const Icon = metric.icon
                return (
                    <div key={metric.label} className="flex items-center justify-between p-3 bg-desert-storm rounded-lg">
                        <div className="flex items-center gap-3">
                            <Icon className="w-5 h-5 text-muted-foreground" />
                            <span className="text-body-sm">{metric.label}</span>
                        </div>
                        <div className="text-right">
                            <span className="font-semibold">{metric.value}</span>
                            {metric.trend && (
                                <p className={`text-caption ${metric.trendUp ? 'text-success' : 'text-destructive'}`}>
                                    {metric.trend}
                                </p>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

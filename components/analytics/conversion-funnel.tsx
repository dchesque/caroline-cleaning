// components/analytics/conversion-funnel.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface FunnelStep {
    name: string
    value: number
    percentage: number
    color: string
}

export function ConversionFunnel() {
    const [steps, setSteps] = useState<FunnelStep[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            const now = new Date()
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
                .toISOString().split('T')[0]

            // Total de sessões de chat
            const { count: sessions } = await supabase
                .from('chat_sessions')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', startOfMonth)

            // Leads capturados (clientes criados)
            const { count: leads } = await supabase
                .from('clientes')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', startOfMonth)

            // Orçamentos enviados
            const { count: quotes } = await supabase
                .from('orcamentos')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', startOfMonth)

            // Agendamentos criados
            const { count: appointments } = await supabase
                .from('agendamentos')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', startOfMonth)

            // Serviços concluídos
            const { count: completed } = await supabase
                .from('agendamentos')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'concluido')
                .gte('data', startOfMonth)

            const totalSessions = sessions || 1

            setSteps([
                {
                    name: 'Visitantes Chat',
                    value: sessions || 0,
                    percentage: 100,
                    color: 'bg-brandy-rose-200'
                },
                {
                    name: 'Leads Capturados',
                    value: leads || 0,
                    percentage: ((leads || 0) / totalSessions) * 100,
                    color: 'bg-brandy-rose-300'
                },
                {
                    name: 'Orçamentos Enviados',
                    value: quotes || 0,
                    percentage: ((quotes || 0) / totalSessions) * 100,
                    color: 'bg-brandy-rose-400'
                },
                {
                    name: 'Agendamentos',
                    value: appointments || 0,
                    percentage: ((appointments || 0) / totalSessions) * 100,
                    color: 'bg-brandy-rose-500'
                },
                {
                    name: 'Serviços Concluídos',
                    value: completed || 0,
                    percentage: ((completed || 0) / totalSessions) * 100,
                    color: 'bg-brandy-rose-600'
                },
            ])

            setIsLoading(false)
        }

        fetchData()
    }, [])

    if (isLoading) {
        return <div className="h-[400px] flex items-center justify-center text-muted-foreground">Carregando...</div>
    }

    return (
        <div className="space-y-4">
            {steps.map((step, index) => (
                <div key={step.name} className="relative">
                    <div className="flex justify-between mb-1">
                        <span className="text-body-sm font-medium">{step.name}</span>
                        <span className="text-body-sm text-muted-foreground">
                            {step.value} ({step.percentage.toFixed(1)}%)
                        </span>
                    </div>
                    <div className="h-10 bg-pampas rounded-lg overflow-hidden relative">
                        <div
                            className={`h-full ${step.color} transition-all duration-500`}
                            style={{ width: `${Math.max(step.percentage, 5)}%` }}
                        />
                        {index < steps.length - 1 && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-caption text-muted-foreground">
                                {index > 0 && steps[index - 1].value > 0 && (
                                    <span>
                                        {((step.value / steps[index - 1].value) * 100).toFixed(0)}% →
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ))}

            <div className="pt-4 border-t border-pampas">
                <div className="flex justify-between text-body-sm">
                    <span className="text-muted-foreground">Taxa de Conversão Total</span>
                    <span className="font-semibold text-success">
                        {steps.length > 0 && steps[0].value > 0
                            ? ((steps[steps.length - 1].value / steps[0].value) * 100).toFixed(1)
                            : 0}%
                    </span>
                </div>
            </div>
        </div>
    )
}

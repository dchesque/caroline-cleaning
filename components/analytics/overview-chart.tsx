// components/analytics/overview-chart.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts'
import { format, subDays } from 'date-fns'

interface ChartData {
    date: string
    receita: number
    agendamentos: number
}

export function OverviewChart() {
    const [data, setData] = useState<ChartData[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            const chartData: ChartData[] = []
            const endDate = new Date()

            // Últimos 30 dias
            for (let i = 29; i >= 0; i--) {
                const date = subDays(endDate, i) // Use endDate here
                const dateStr = format(date, 'yyyy-MM-dd')

                // Receita do dia
                const { data: revenue } = await supabase
                    .from('financeiro')
                    .select('valor')
                    .eq('tipo', 'receita')
                    .eq('status', 'pago')
                    .eq('data', dateStr)

                // Agendamentos do dia
                const { count: appointments } = await supabase
                    .from('agendamentos')
                    .select('*', { count: 'exact', head: true })
                    .eq('data', dateStr)
                    .not('status', 'eq', 'cancelado')

                chartData.push({
                    date: format(date, 'dd/MM'),
                    receita: revenue?.reduce((acc, r) => acc + r.valor, 0) || 0,
                    agendamentos: appointments || 0
                })
            }

            setData(chartData)
            setIsLoading(false)
        }

        fetchData()
    }, []) // Removed dependency on supabase

    if (isLoading) {
        return <div className="h-[350px] flex items-center justify-center text-muted-foreground">Carregando...</div>
    }

    return (
        <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorAgendamentos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#BE9982" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#BE9982" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E4E1" />
                <XAxis
                    dataKey="date"
                    stroke="#9A8478"
                    fontSize={12}
                    tickLine={false}
                    interval="preserveStartEnd"
                />
                <YAxis
                    yAxisId="left"
                    stroke="#9A8478"
                    fontSize={12}
                    tickFormatter={(value) => `$${value}`}
                    tickLine={false}
                />
                <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#9A8478"
                    fontSize={12}
                    tickLine={false}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #E8E4E1',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    formatter={(value: any, name: any) => [
                        name === 'receita' ? `$${Number(value).toFixed(2)}` : value,
                        name === 'receita' ? 'Receita' : 'Agendamentos'
                    ]}
                />
                <Legend />
                <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="receita"
                    stroke="#22c55e"
                    fillOpacity={1}
                    fill="url(#colorReceita)"
                    name="Receita"
                />
                <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="agendamentos"
                    stroke="#BE9982"
                    fillOpacity={1}
                    fill="url(#colorAgendamentos)"
                    name="Agendamentos"
                />
            </AreaChart>
        </ResponsiveContainer>
    )
}

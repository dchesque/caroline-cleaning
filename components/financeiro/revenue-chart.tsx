'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function RevenueChart() {
    const [data, setData] = useState<any[]>([])
    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            const months = []

            for (let i = 5; i >= 0; i--) {
                const date = subMonths(new Date(), i)
                const start = format(startOfMonth(date), 'yyyy-MM-dd')
                const end = format(endOfMonth(date), 'yyyy-MM-dd')

                const { data: revenue } = await supabase
                    .from('financeiro')
                    .select('valor')
                    .eq('tipo', 'receita')
                    .eq('status', 'pago')
                    .gte('data', start)
                    .lte('data', end)

                const { data: expenses } = await supabase
                    .from('financeiro')
                    .select('valor')
                    .eq('tipo', 'custo') // Changed from 'despesa' to 'custo' based on SQL schema
                    .gte('data', start)
                    .lte('data', end)

                months.push({
                    month: format(date, 'MMM', { locale: ptBR }), // Localized month
                    receita: revenue?.reduce((acc, r) => acc + r.valor, 0) || 0,
                    despesa: expenses?.reduce((acc, r) => acc + r.valor, 0) || 0,
                })
            }

            setData(months)
        }

        fetchData()
    }, [])

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E4E1" vertical={false} />
                <XAxis
                    dataKey="month"
                    stroke="#9A8478"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#9A8478"
                    fontSize={12}
                    tickFormatter={(value) => `$${value}`}
                    tickLine={false}
                    axisLine={false}
                />
                <Tooltip
                    cursor={{ fill: 'transparent' }}
                    formatter={(value: any) => [`$${Number(value).toFixed(2)}`, '']}
                    contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #E8E4E1',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                />
                <Bar
                    dataKey="receita"
                    fill="#C48B7F" // Brand primary
                    radius={[4, 4, 0, 0]}
                    name="Receita"
                    barSize={32}
                />
                <Bar
                    dataKey="despesa"
                    fill="#EAE0D5" // Brand border/muted
                    radius={[4, 4, 0, 0]}
                    name="Despesa"
                    barSize={32}
                />
            </BarChart>
        </ResponsiveContainer>
    )
}

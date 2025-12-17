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
    ResponsiveContainer
} from 'recharts'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'

export function RevenueChart() {
    const [data, setData] = useState<any[]>([])
    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            const months = []

            // Get last 6 months
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
                    .eq('tipo', 'despesa')
                    .eq('status', 'pago')
                    .gte('data', start)
                    .lte('data', end)

                months.push({
                    month: format(date, 'MMM'),
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
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E4E1" />
                <XAxis dataKey="month" stroke="#9A8478" fontSize={12} />
                <YAxis stroke="#9A8478" fontSize={12} tickFormatter={(value) => `$${value}`} />
                <Tooltip
                    formatter={(value: any) => [`$${Number(value).toFixed(2)}`, '']}
                    contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #E8E4E1',
                        borderRadius: '8px'
                    }}
                />
                <Area
                    type="monotone"
                    dataKey="receita"
                    stroke="#22c55e"
                    fillOpacity={1}
                    fill="url(#colorReceita)"
                    name="Receita"
                />
                <Area
                    type="monotone"
                    dataKey="despesa"
                    stroke="#ef4444"
                    fillOpacity={1}
                    fill="url(#colorDespesa)"
                    name="Despesa"
                />
            </AreaChart>
        </ResponsiveContainer>
    )
}

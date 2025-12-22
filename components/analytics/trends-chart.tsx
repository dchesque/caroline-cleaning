// components/analytics/trends-chart.tsx
'use client'

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

interface TrendData {
    date: string
    real: number
    projected: number
}

interface TrendsChartProps {
    data: TrendData[]
}

export function TrendsChart({ data }: TrendsChartProps) {
    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#C48B7F" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#C48B7F" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E4E1" />
                    <XAxis
                        dataKey="date"
                        stroke="#9A8478"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#9A8478"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #E8E4E1',
                            borderRadius: '8px'
                        }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Area
                        name="Receita Real"
                        type="monotone"
                        dataKey="real"
                        stroke="#C48B7F"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorReal)"
                    />
                    <Area
                        name="Projeção"
                        type="monotone"
                        dataKey="projected"
                        stroke="#22c55e"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        fillOpacity={1}
                        fill="url(#colorProjected)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}

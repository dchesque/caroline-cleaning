// components/analytics/satisfaction-chart.tsx
'use client'

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts'

interface SatisfactionData {
    rating: number
    count: number
    percentage: number
}

interface SatisfactionChartProps {
    data: SatisfactionData[]
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e']

export function SatisfactionChart({ data }: SatisfactionChartProps) {
    // Garantir que temos todas as notas de 1 a 5
    const fullData = [1, 2, 3, 4, 5].map(r => {
        const item = data.find(d => d.rating === r)
        return {
            label: '★'.repeat(r),
            rating: r,
            value: item?.count || 0,
            percentage: item?.percentage || 0
        }
    }).reverse()

    return (
        <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={fullData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E8E4E1" />
                    <XAxis type="number" hide />
                    <YAxis
                        dataKey="label"
                        type="category"
                        stroke="#9A8478"
                        fontSize={12}
                        width={60}
                    />
                    <Tooltip
                        cursor={{ fill: 'transparent' }}
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const item = payload[0].payload
                                return (
                                    <div className="bg-white p-2 border border-pampas rounded-lg shadow-sm">
                                        <p className="font-medium">{item.label}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {item.value} avaliações ({item.percentage.toFixed(1)}%)
                                        </p>
                                    </div>
                                )
                            }
                            return null
                        }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {fullData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[entry.rating - 1]} fillOpacity={0.8} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

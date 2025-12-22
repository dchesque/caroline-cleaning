// app/(admin)/admin/analytics/conversao/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, Users, Target, Clock, UserMinus } from 'lucide-react'
import { KPICard } from '@/components/analytics/kpi-card'
import { PeriodSelector } from '@/components/analytics/period-selector'
import { ConversionFunnel } from '@/components/analytics/conversion-funnel'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts'
import { format, subDays, startOfMonth, startOfYear, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const CHART_COLORS = ['#C48B7F', '#6B8E6B', '#C4A35A', '#7B9EB8', '#9B8BB8']

export default function ConversaoPage() {
    const [period, setPeriod] = useState('30d')
    const [isLoading, setIsLoading] = useState(true)
    const [data, setData] = useState<any>({
        kpis: {
            totalLeads: 0,
            conversionRate: 0,
            avgConversionTime: 0,
            lostLeads: 0,
        },
        funnel: [],
        dailyConversions: [],
        bySource: [],
    })

    const supabase = createClient()

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true)

            let startDate = subDays(new Date(), 30)
            if (period === '7d') startDate = subDays(new Date(), 7)
            if (period === '90d') startDate = subDays(new Date(), 90)
            if (period === 'month') startDate = startOfMonth(new Date())
            if (period === 'year') startDate = startOfYear(new Date())
            if (period === 'lastMonth') {
                const lastMonth = subDays(startOfMonth(new Date()), 1)
                startDate = startOfMonth(lastMonth)
            }

            const startDateStr = startDate.toISOString()

            // 1. Fetch Funnel Data
            // Visitantes (chat sessions)
            const { count: sessionsCount } = await supabase
                .from('chat_sessions')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', startDateStr)

            // Leads capturados (clientes ou contact_leads)
            const { count: leadsCount } = await supabase
                .from('contact_leads')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', startDateStr)

            // Agendamentos
            const { count: appointmentsCount } = await supabase
                .from('agendamentos')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', startDateStr)

            // Clientes convertidos (agendamento concluído ou status ativo)
            const { count: convertedCount } = await supabase
                .from('clientes')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'ativo')
                .gte('created_at', startDateStr)

            // 2. Fetch Daily Conversions
            const { data: dailyData } = await supabase
                .from('clientes')
                .select('created_at')
                .eq('status', 'ativo')
                .gte('created_at', startDateStr)

            const dailyMap = new Map()
            const days = period.includes('d') ? parseInt(period) : 30
            for (let i = 0; i < days; i++) {
                const date = format(subDays(new Date(), i), 'yyyy-MM-dd')
                dailyMap.set(date, 0)
            }

            dailyData?.forEach((d: any) => {
                const date = d.created_at.split('T')[0]
                if (dailyMap.has(date)) {
                    dailyMap.set(date, (dailyMap.get(date) || 0) + 1)
                }
            })

            const dailyChartData = Array.from(dailyMap.entries())
                .map(([date, value]) => ({ date: format(parseISO(date), 'dd/MM'), value }))
                .reverse()

            // 3. Fetch Source Distribution
            const { data: sourceData } = await supabase
                .from('clientes')
                .select('origem')
                .gte('created_at', startDateStr)

            const sourceMap = new Map()
            sourceData?.forEach((d: any) => {
                const source = d.origem || 'Website'
                sourceMap.set(source, (sourceMap.get(source) || 0) + 1)
            })

            const bySourceChartData = Array.from(sourceMap.entries()).map(([name, value]) => ({
                name,
                value,
            }))

            // 4. Lost Leads
            const { count: lostCount } = await supabase
                .from('contact_leads')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'arquivado')
                .gte('created_at', startDateStr)

            setData({
                kpis: {
                    totalLeads: leadsCount || 0,
                    conversionRate: leadsCount ? (convertedCount || 0) / leadsCount * 100 : 0,
                    avgConversionTime: 2.4, // Mocked for now
                    lostLeads: lostCount || 0,
                },
                funnel: [
                    { label: 'Visitantes', value: sessionsCount || 0, percentage: 100, color: '#C48B7F' },
                    { label: 'Leads Capturados', value: leadsCount || 0, percentage: sessionsCount ? (leadsCount || 0) / sessionsCount * 100 : 0, color: '#BE9982' },
                    { label: 'Agendou Visita', value: appointmentsCount || 0, percentage: sessionsCount ? (appointmentsCount || 0) / sessionsCount * 100 : 0, color: '#C4A35A' },
                    { label: 'Cliente Convertido', value: convertedCount || 0, percentage: sessionsCount ? (convertedCount || 0) / sessionsCount * 100 : 0, color: '#22c55e' },
                ],
                dailyConversions: dailyChartData,
                bySource: bySourceChartData,
            })
            setIsLoading(false)
        }

        fetchData()
    }, [period, supabase])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/analytics">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="font-heading text-h2 text-foreground">Análise de Conversão</h1>
                        <p className="text-body text-muted-foreground">Acompanhe seu funil de vendas e origens</p>
                    </div>
                </div>
                <PeriodSelector value={period} onChange={setPeriod} />
            </div>

            {/* KPI Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Total de Leads"
                    value={data.kpis.totalLeads}
                    icon={Users}
                    iconColor="text-info"
                    iconBgColor="bg-info/10"
                />
                <KPICard
                    title="Taxa de Conversão"
                    value={`${data.kpis.conversionRate.toFixed(1)}%`}
                    icon={Target}
                    iconColor="text-success"
                    iconBgColor="bg-success/10"
                />
                <KPICard
                    title="Tempo de Conversão"
                    value={`${data.kpis.avgConversionTime} dias`}
                    subtitle="Média lead para cliente"
                    icon={Clock}
                    iconColor="text-warning"
                    iconBgColor="bg-warning/10"
                />
                <KPICard
                    title="Leads Perdidos"
                    value={data.kpis.lostLeads}
                    icon={UserMinus}
                    iconColor="text-destructive"
                    iconBgColor="bg-destructive/10"
                />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Funnel */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-h4 font-heading">Funil de Conversão</CardTitle>
                        <CardDescription>Eficiência em cada etapa do processo</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ConversionFunnel steps={data.funnel} />
                    </CardContent>
                </Card>

                {/* Daily Conversions Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-h4 font-heading">Conversões por Dia</CardTitle>
                        <CardDescription>Evolução de novos clientes ativos</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            {isLoading ? (
                                <div className="h-full w-full bg-pampas animate-pulse rounded-lg" />
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data.dailyConversions}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E8E4E1" />
                                        <XAxis dataKey="date" stroke="#9A8478" fontSize={12} />
                                        <YAxis stroke="#9A8478" fontSize={12} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'white',
                                                border: '1px solid #E8E4E1',
                                                borderRadius: '8px'
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#C48B7F"
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: '#C48B7F', strokeWidth: 2, stroke: '#fff' }}
                                            activeDot={{ r: 6 }}
                                            name="Conversões"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Table - Leads por Origem */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-h4 font-heading">Leads por Origem</CardTitle>
                        <CardDescription>Desempenho por canal de aquisição</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-pampas">
                                        <th className="py-3 font-medium text-muted-foreground">Origem</th>
                                        <th className="py-3 font-medium text-muted-foreground text-right">Quantidade</th>
                                        <th className="py-3 font-medium text-muted-foreground text-right">Participação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.bySource.map((item: any, idx: number) => {
                                        const total = data.bySource.reduce((acc: number, curr: any) => acc + curr.value, 0)
                                        const percentage = total > 0 ? (item.value / total * 100) : 0
                                        return (
                                            <tr key={idx} className="border-b border-pampas last:border-0">
                                                <td className="py-3 font-medium">{item.name}</td>
                                                <td className="py-3 text-right">{item.value}</td>
                                                <td className="py-3 text-right">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
                                                        {percentage.toFixed(1)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {data.bySource.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="py-8 text-center text-muted-foreground">
                                                Nenhum dado encontrado para o período.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Pie Chart - Origem */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-h4 font-heading">Distribuição por Canal</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            {isLoading ? (
                                <div className="h-full w-full bg-pampas animate-pulse rounded-lg" />
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.bySource}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {data.bySource.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

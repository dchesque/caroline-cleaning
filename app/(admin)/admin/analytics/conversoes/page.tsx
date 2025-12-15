// app/(admin)/admin/analytics/conversoes/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, TrendingUp, Users, MessageSquare, Target } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts'
import { format, subDays } from 'date-fns'

export default function ConversoesPage() {
    const [period, setPeriod] = useState('30')
    const [data, setData] = useState<any>({
        funnel: [],
        dailyConversions: [],
        bySource: [],
        stats: {}
    })
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            const days = parseInt(period)
            const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd')

            // Sessões de chat
            const { count: sessions } = await supabase
                .from('chat_sessions')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', startDate)

            // Leads capturados
            const { count: leads } = await supabase
                .from('clientes')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', startDate)

            // Orçamentos
            const { count: quotes } = await supabase
                .from('orcamentos')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', startDate)

            // Agendamentos
            const { count: appointments } = await supabase
                .from('agendamentos')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', startDate)

            // Concluídos
            const { count: completed } = await supabase
                .from('agendamentos')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'concluido')
                .gte('data', startDate)

            // Receita de convertidos
            const { data: revenue } = await supabase
                .from('financeiro')
                .select('valor')
                .eq('tipo', 'receita')
                .eq('status', 'pago')
                .gte('data', startDate)

            const totalRevenue = revenue?.reduce((acc, r) => acc + r.valor, 0) || 0

            // Conversões diárias
            const dailyData = []
            for (let i = days - 1; i >= 0; i--) {
                const date = subDays(new Date(), i)
                const dateStr = format(date, 'yyyy-MM-dd')

                const { count: dailyLeads } = await supabase
                    .from('clientes')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', `${dateStr}T00:00:00`)
                    .lt('created_at', `${dateStr}T23:59:59`)

                const { count: dailyAppointments } = await supabase
                    .from('agendamentos')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', `${dateStr}T00:00:00`)
                    .lt('created_at', `${dateStr}T23:59:59`)

                dailyData.push({
                    date: format(date, 'dd/MM'),
                    leads: dailyLeads || 0,
                    agendamentos: dailyAppointments || 0
                })
            }

            // Por origem
            const { data: clientsBySource } = await supabase
                .from('clientes')
                .select('origem')
                .gte('created_at', startDate)

            const sourceMap = new Map()
            clientsBySource?.forEach(c => {
                const source = c.origem || 'Direto'
                sourceMap.set(source, (sourceMap.get(source) || 0) + 1)
            })

            const bySource = Array.from(sourceMap.entries()).map(([source, count]) => ({
                source,
                count
            }))

            setData({
                funnel: [
                    { name: 'Visitantes', value: sessions || 0 },
                    { name: 'Leads', value: leads || 0 },
                    { name: 'Orçamentos', value: quotes || 0 },
                    { name: 'Agendamentos', value: appointments || 0 },
                    { name: 'Concluídos', value: completed || 0 },
                ],
                dailyConversions: dailyData,
                bySource,
                stats: {
                    sessions: sessions || 0,
                    leads: leads || 0,
                    appointments: appointments || 0,
                    completed: completed || 0,
                    revenue: totalRevenue,
                    conversionRate: sessions ? ((completed || 0) / sessions * 100) : 0,
                    avgValue: completed ? (totalRevenue / completed) : 0
                }
            })

            setIsLoading(false)
        }

        fetchData()
    }, [period])

    if (isLoading) {
        return <div className="h-[400px] flex items-center justify-center text-muted-foreground">Carregando...</div>
    }

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
                        <h1 className="font-heading text-h2 text-foreground">Análise de Conversões</h1>
                        <p className="text-body text-muted-foreground">
                            Acompanhe o funil de vendas e taxas de conversão
                        </p>
                    </div>
                </div>
                <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7">Últimos 7 dias</SelectItem>
                        <SelectItem value="30">Últimos 30 dias</SelectItem>
                        <SelectItem value="90">Últimos 90 dias</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* KPI Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-info/10 rounded-lg">
                                <MessageSquare className="w-6 h-6 text-info" />
                            </div>
                            <div>
                                <p className="text-caption text-muted-foreground">Sessões Chat</p>
                                <p className="text-h3 font-semibold">{data.stats.sessions}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-warning/10 rounded-lg">
                                <Users className="w-6 h-6 text-warning" />
                            </div>
                            <div>
                                <p className="text-caption text-muted-foreground">Leads Capturados</p>
                                <p className="text-h3 font-semibold">{data.stats.leads}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-success/10 rounded-lg">
                                <Target className="w-6 h-6 text-success" />
                            </div>
                            <div>
                                <p className="text-caption text-muted-foreground">Taxa Conversão</p>
                                <p className="text-h3 font-semibold">{data.stats.conversionRate?.toFixed(1)}%</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-caption text-muted-foreground">Receita Gerada</p>
                                <p className="text-h3 font-semibold">{formatCurrency(data.stats.revenue || 0)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Funnel Visualization */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-h4">Funil de Conversão</CardTitle>
                    <CardDescription>Do primeiro contato até o serviço concluído</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {data.funnel.map((step: any, index: number) => {
                            const prevValue = index > 0 ? data.funnel[index - 1].value : step.value
                            const dropRate = prevValue > 0 ? ((prevValue - step.value) / prevValue * 100) : 0
                            const convRate = data.funnel[0].value > 0
                                ? (step.value / data.funnel[0].value * 100)
                                : 0

                            return (
                                <div key={step.name} className="relative">
                                    <div className="flex justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-caption flex items-center justify-center font-semibold">
                                                {index + 1}
                                            </span>
                                            <span className="font-medium">{step.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-semibold">{step.value}</span>
                                            <span className="text-caption text-muted-foreground ml-2">
                                                ({convRate.toFixed(1)}%)
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-8 bg-pampas rounded-lg overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-brandy-rose-400 to-brandy-rose-500 transition-all duration-500"
                                            style={{ width: `${Math.max(convRate, 2)}%` }}
                                        />
                                    </div>
                                    {index > 0 && dropRate > 0 && (
                                        <p className="text-caption text-destructive mt-1">
                                            ↓ {dropRate.toFixed(1)}% de perda do estágio anterior
                                        </p>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Daily Conversions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-h4">Conversões Diárias</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
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
                                    dataKey="leads"
                                    stroke="#BE9982"
                                    strokeWidth={2}
                                    dot={{ fill: '#BE9982' }}
                                    name="Leads"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="agendamentos"
                                    stroke="#22c55e"
                                    strokeWidth={2}
                                    dot={{ fill: '#22c55e' }}
                                    name="Agendamentos"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* By Source */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-h4">Leads por Origem</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.bySource} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#E8E4E1" />
                                <XAxis type="number" stroke="#9A8478" fontSize={12} />
                                <YAxis dataKey="source" type="category" stroke="#9A8478" fontSize={12} width={100} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #E8E4E1',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Bar dataKey="count" fill="#BE9982" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

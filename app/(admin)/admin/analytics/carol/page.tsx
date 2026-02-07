// app/(admin)/admin/analytics/carol/page.tsx
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
import {
    ArrowLeft,
    MessageSquare,
    Zap,
    Clock,
    ThumbsUp,
    Bot,
    Users,
    Target,
    TrendingUp
} from 'lucide-react'
import {
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts'
import { format, subDays } from 'date-fns'
import { useAdminI18n } from '@/lib/admin-i18n/context'

const COLORS = ['#BE9982', '#22c55e', '#f59e0b', '#3b82f6', '#ef4444']

export default function CarolPerformancePage() {
    const { t } = useAdminI18n()
    const analytics = t('analytics_carol')
    const common = t('common')

    const [period, setPeriod] = useState('30')
    const [data, setData] = useState<any>({
        stats: {},
        intentDistribution: [],
        dailyActivity: [],
        responseQuality: [],
        topQuestions: []
    })
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            const days = parseInt(period)
            const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd')

            // Total de mensagens
            const { count: totalMessages } = await supabase
                .from('mensagens_chat')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', startDate)

            // Mensagens da Carol
            const { count: carolMessages } = await supabase
                .from('mensagens_chat')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'assistant')
                .gte('created_at', startDate)

            // Sessões únicas
            const { data: sessions } = await supabase
                .from('mensagens_chat')
                .select('session_id')
                .gte('created_at', startDate)

            const uniqueSessions = new Set(sessions?.map(s => s.session_id)).size

            // Leads gerados via chat
            const { count: leadsGenerated } = await supabase
                .from('clientes')
                .select('*', { count: 'exact', head: true })
                .eq('origem', 'chat_carol')
                .gte('created_at', startDate)

            // Agendamentos via chat
            const { count: appointmentsBooked } = await supabase
                .from('agendamentos')
                .select('*', { count: 'exact', head: true })
                .eq('origem', 'chat_carol')
                .gte('created_at', startDate)

            // Intenções detectadas
            const { data: intents } = await supabase
                .from('mensagens_chat')
                .select('intent_detected')
                .not('intent_detected', 'is', null)
                .gte('created_at', startDate)

            const intentMap = new Map()
            intents?.forEach(i => {
                const intent = i.intent_detected || 'outros'
                intentMap.set(intent, (intentMap.get(intent) || 0) + 1)
            })

            const intentDistribution = Array.from(intentMap.entries())
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 5)

            // Atividade diária
            const dailyActivity = []
            for (let i = days - 1; i >= 0; i--) {
                const date = subDays(new Date(), i)
                const dateStr = format(date, 'yyyy-MM-dd')

                const { count: dailyMessages } = await supabase
                    .from('mensagens_chat')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', `${dateStr}T00:00:00`)
                    .lt('created_at', `${dateStr}T23:59:59`)

                const { count: dailySessions } = await supabase
                    .from('chat_sessions')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', `${dateStr}T00:00:00`)
                    .lt('created_at', `${dateStr}T23:59:59`)

                dailyActivity.push({
                    date: format(date, 'dd/MM'),
                    mensagens: dailyMessages || 0,
                    sessoes: dailySessions || 0
                })
            }

            // Calcular métricas
            const avgMessagesPerSession = uniqueSessions > 0
                ? (totalMessages || 0) / uniqueSessions
                : 0

            const conversionRate = uniqueSessions > 0
                ? ((leadsGenerated || 0) / uniqueSessions * 100)
                : 0

            setData({
                stats: {
                    totalMessages: totalMessages || 0,
                    carolMessages: carolMessages || 0,
                    uniqueSessions,
                    leadsGenerated: leadsGenerated || 0,
                    appointmentsBooked: appointmentsBooked || 0,
                    avgMessagesPerSession,
                    conversionRate
                },
                intentDistribution,
                dailyActivity,
                responseQuality: [
                    { name: analytics.qualityItems.resolved, value: 75 },
                    { name: analytics.qualityItems.transferred, value: 15 },
                    { name: analytics.qualityItems.abandoned, value: 10 },
                ],
                topQuestions: [
                    'Quanto custa a limpeza?',
                    'Quais áreas vocês atendem?',
                    'Como agendar?',
                    'Vocês aceitam pets?',
                    'Qual o horário de funcionamento?'
                ]
            })

            setIsLoading(false)
        }

        fetchData()
    }, [period, analytics.qualityItems.resolved, analytics.qualityItems.transferred, analytics.qualityItems.abandoned])

    if (isLoading) {
        return <div className="h-[400px] flex items-center justify-center text-muted-foreground">{common.loading}</div>
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
                        <h1 className="font-heading text-h2 text-foreground">{analytics.title}</h1>
                        <p className="text-body text-muted-foreground">
                            {analytics.subtitle}
                        </p>
                    </div>
                </div>
                <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={analytics.period.label} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7">{analytics.period.last7Days}</SelectItem>
                        <SelectItem value="30">{analytics.period.last30Days}</SelectItem>
                        <SelectItem value="90">{analytics.period.last90Days}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg">
                                <MessageSquare className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-caption text-muted-foreground">{analytics.stats.messages}</p>
                                <p className="text-h3 font-semibold">{data.stats.totalMessages}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-info/10 rounded-lg">
                                <Users className="w-6 h-6 text-info" />
                            </div>
                            <div>
                                <p className="text-caption text-muted-foreground">{analytics.stats.sessions}</p>
                                <p className="text-h3 font-semibold">{data.stats.uniqueSessions}</p>
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
                                <p className="text-caption text-muted-foreground">{analytics.stats.leads}</p>
                                <p className="text-h3 font-semibold">{data.stats.leadsGenerated}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-warning/10 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-warning" />
                            </div>
                            <div>
                                <p className="text-caption text-muted-foreground">{analytics.stats.conversion}</p>
                                <p className="text-h3 font-semibold">{data.stats.conversionRate?.toFixed(1)}%</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Daily Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-h4">{analytics.charts.dailyActivity}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={data.dailyActivity}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E8E4E1" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#9A8478"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    minTickGap={10}
                                />
                                <YAxis
                                    stroke="#9A8478"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #E8E4E1',
                                        borderRadius: '8px',
                                        fontSize: '12px'
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="mensagens"
                                    stroke="#BE9982"
                                    strokeWidth={2}
                                    name={analytics.stats.messages}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="sessoes"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    name={analytics.stats.sessions}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Intent Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-h4">{analytics.charts.intentDistribution}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={data.intentDistribution}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} (${((percent || 0) * 100).toFixed(0)}%)`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {data.intentDistribution.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Additional Info */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Response Quality */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-h4">{analytics.charts.responseQuality}</CardTitle>
                        <CardDescription>{analytics.charts.qualityDesc}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.responseQuality.map((item: any, index: number) => (
                                <div key={item.name} className="space-y-2">
                                    <div className="flex justify-between text-body-sm">
                                        <span>{item.name}</span>
                                        <span className="font-medium">{item.value}%</span>
                                    </div>
                                    <div className="h-3 bg-pampas rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full"
                                            style={{
                                                width: `${item.value}%`,
                                                backgroundColor: COLORS[index]
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Questions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-h4">{analytics.topQuestions.title}</CardTitle>
                        <CardDescription>{analytics.topQuestions.subtitle}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {data.topQuestions.map((question: string, index: number) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 p-3 bg-desert-storm rounded-lg"
                                >
                                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-caption flex items-center justify-center font-semibold">
                                        {index + 1}
                                    </span>
                                    <span className="text-body-sm">{question}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Performance Metrics */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-h4">{analytics.performance}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="text-center p-4 bg-desert-storm rounded-lg">
                            <Bot className="w-8 h-8 text-primary mx-auto mb-2" />
                            <p className="text-h4 font-semibold">{data.stats.carolMessages}</p>
                            <p className="text-caption text-muted-foreground">{analytics.stats.carolResponses}</p>
                        </div>
                        <div className="text-center p-4 bg-desert-storm rounded-lg">
                            <Zap className="w-8 h-8 text-warning mx-auto mb-2" />
                            <p className="text-h4 font-semibold">{data.stats.avgMessagesPerSession?.toFixed(1)}</p>
                            <p className="text-caption text-muted-foreground">{analytics.stats.msgsPerSession}</p>
                        </div>
                        <div className="text-center p-4 bg-desert-storm rounded-lg">
                            <Clock className="w-8 h-8 text-info mx-auto mb-2" />
                            <p className="text-h4 font-semibold">&lt; 1s</p>
                            <p className="text-caption text-muted-foreground">{analytics.stats.responseTime}</p>
                        </div>
                        <div className="text-center p-4 bg-desert-storm rounded-lg">
                            <ThumbsUp className="w-8 h-8 text-success mx-auto mb-2" />
                            <p className="text-h4 font-semibold">{data.stats.appointmentsBooked}</p>
                            <p className="text-caption text-muted-foreground">{analytics.stats.appointments}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

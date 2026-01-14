'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
    TrendingUp,
    Users,
    Calendar,
    DollarSign,
    MessageSquare,
    MessageSquareText,
    ArrowUpRight,
    ArrowDownRight,
    Download,
    RefreshCw,
    Zap,
    Loader2
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { OverviewChart } from '@/components/analytics/overview-chart'
import { ConversionFunnel } from '@/components/analytics/conversion-funnel'
import { RecentActivity } from '@/components/analytics/recent-activity'
import { TopMetrics } from '@/components/analytics/top-metrics'
import { useAdminI18n } from '@/lib/admin-i18n/context'

interface AnalyticsData {
    revenue: { current: number; change: number }
    clients: { new: number; change: number }
    appointments: { total: number; change: number }
    chat: { sessions: number; conversions: number; conversionRate: number }
    funnel: any[]
}

export default function AnalyticsPage() {
    const { t } = useAdminI18n()
    const analyticsT = t('analytics')
    const financeT = t('finance')
    const clientsT = t('clients')
    const [isLoading, setIsLoading] = useState(true)
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
    const supabase = createClient()

    const fetchData = async () => {
        setIsLoading(true)
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

        const startOfMonthStr = startOfMonth.toISOString().split('T')[0]
        const startOfLastMonthStr = startOfLastMonth.toISOString().split('T')[0]
        const endOfLastMonthStr = endOfLastMonth.toISOString().split('T')[0]

        // Receita do mês atual
        const { data: currentRevenue } = await supabase
            .from('financeiro')
            .select('valor')
            .eq('tipo', 'receita')
            .eq('status', 'pago')
            .gte('data', startOfMonthStr)

        // Receita do mês anterior
        const { data: lastRevenue } = await supabase
            .from('financeiro')
            .select('valor')
            .eq('tipo', 'receita')
            .eq('status', 'pago')
            .gte('data', startOfLastMonthStr)
            .lte('data', endOfLastMonthStr)

        // Novos clientes este mês
        const { count: newClients } = await supabase
            .from('clientes')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfMonthStr)

        // Novos clientes mês passado
        const { count: lastNewClients } = await supabase
            .from('clientes')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfLastMonthStr)
            .lte('created_at', endOfLastMonthStr)

        // Agendamentos este mês
        const { count: appointments } = await supabase
            .from('agendamentos')
            .select('*', { count: 'exact', head: true })
            .gte('data', startOfMonthStr)
            .not('status', 'eq', 'cancelado')

        // Agendamentos mês passado
        const { count: lastAppointments } = await supabase
            .from('agendamentos')
            .select('*', { count: 'exact', head: true })
            .gte('data', startOfLastMonthStr)
            .lte('data', endOfLastMonthStr)
            .not('status', 'eq', 'cancelado')

        // Conversas do chat este mês
        const { count: chatSessions } = await supabase
            .from('chat_sessions')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfMonthStr)

        // Leads capturados
        const { count: leads } = await supabase
            .from('contact_leads')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfMonthStr)

        // Total de leads convertidos
        const { count: convertedLeads } = await supabase
            .from('clientes')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'ativo')
            .gte('created_at', startOfMonthStr)

        // Calcular totais e variações
        const totalCurrentRevenue = currentRevenue?.reduce((acc: number, r: any) => acc + r.valor, 0) || 0
        const totalLastRevenue = lastRevenue?.reduce((acc: number, r: any) => acc + r.valor, 0) || 0

        const revenueChange = totalLastRevenue > 0
            ? ((totalCurrentRevenue - totalLastRevenue) / totalLastRevenue * 100)
            : 0

        const clientsChange = (lastNewClients || 0) > 0
            ? (((newClients || 0) - (lastNewClients || 0)) / (lastNewClients || 1) * 100)
            : 0

        const appointmentsChange = (lastAppointments || 0) > 0
            ? (((appointments || 0) - (lastAppointments || 0)) / (lastAppointments || 1) * 100)
            : 0

        setAnalytics({
            revenue: {
                current: totalCurrentRevenue,
                change: revenueChange
            },
            clients: {
                new: newClients || 0,
                change: clientsChange
            },
            appointments: {
                total: appointments || 0,
                change: appointmentsChange
            },
            chat: {
                sessions: chatSessions || 0,
                conversions: convertedLeads || 0,
                conversionRate: chatSessions ? ((convertedLeads || 0) / chatSessions * 100) : 0
            },
            funnel: [
                { label: analyticsT.funnelSteps.visitors, value: chatSessions || 0, percentage: 100, color: '#C48B7F' },
                { label: analyticsT.funnelSteps.leads, value: leads || 0, percentage: chatSessions ? (leads || 0) / chatSessions * 100 : 0, color: '#BE9982' },
                { label: analyticsT.funnelSteps.appointments, value: appointments || 0, percentage: chatSessions ? (appointments || 0) / chatSessions * 100 : 0, color: '#C4A35A' },
                { label: analyticsT.funnelSteps.converted, value: convertedLeads || 0, percentage: chatSessions ? (convertedLeads || 0) / chatSessions * 100 : 0, color: '#22c55e' },
            ]
        })
        setIsLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [])

    if (isLoading || !analytics) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-brandy-rose-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-heading text-h2 text-foreground">{analyticsT.title}</h1>
                    <p className="text-body text-muted-foreground">
                        {analyticsT.subtitle}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={fetchData}>
                        <RefreshCw className="w-4 h-4" />
                        {analyticsT.update}
                    </Button>
                    <Button size="sm" className="gap-2">
                        <Download className="w-4 h-4" />
                        {analyticsT.export}
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Revenue */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-caption text-muted-foreground">{analyticsT.revenueMth}</p>
                                <p className="text-h3 font-semibold">{formatCurrency(analytics.revenue.current)}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    {analytics.revenue.change >= 0 ? (
                                        <ArrowUpRight className="w-4 h-4 text-success" />
                                    ) : (
                                        <ArrowDownRight className="w-4 h-4 text-destructive" />
                                    )}
                                    <span className={`text-caption ${analytics.revenue.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                                        {Math.abs(analytics.revenue.change).toFixed(1)}% {analyticsT.vsLastMth}
                                    </span>
                                </div>
                            </div>
                            <div className="p-3 bg-success/10 rounded-lg">
                                <DollarSign className="w-6 h-6 text-success" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* New Clients */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-caption text-muted-foreground">{analyticsT.newClients}</p>
                                <p className="text-h3 font-semibold">{analytics.clients.new}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    {analytics.clients.change >= 0 ? (
                                        <ArrowUpRight className="w-4 h-4 text-success" />
                                    ) : (
                                        <ArrowDownRight className="w-4 h-4 text-destructive" />
                                    )}
                                    <span className={`text-caption ${analytics.clients.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                                        {Math.abs(analytics.clients.change).toFixed(1)}% {analyticsT.vsLastMth}
                                    </span>
                                </div>
                            </div>
                            <div className="p-3 bg-info/10 rounded-lg">
                                <Users className="w-6 h-6 text-info" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Appointments */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-caption text-muted-foreground">{analyticsT.appointments}</p>
                                <p className="text-h3 font-semibold">{analytics.appointments.total}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    {analytics.appointments.change >= 0 ? (
                                        <ArrowUpRight className="w-4 h-4 text-success" />
                                    ) : (
                                        <ArrowDownRight className="w-4 h-4 text-destructive" />
                                    )}
                                    <span className={`text-caption ${analytics.appointments.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                                        {Math.abs(analytics.appointments.change).toFixed(1)}% {analyticsT.vsLastMth}
                                    </span>
                                </div>
                            </div>
                            <div className="p-3 bg-warning/10 rounded-lg">
                                <Calendar className="w-6 h-6 text-warning" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Chat Conversion */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-caption text-muted-foreground">{analyticsT.convRate}</p>
                                <p className="text-h3 font-semibold">{analytics.chat.conversionRate.toFixed(1)}%</p>
                                <p className="text-caption text-muted-foreground mt-1">
                                    {analytics.chat.conversions} de {analytics.chat.sessions} leads
                                </p>
                            </div>
                            <div className="p-3 bg-primary/10 rounded-lg">
                                <MessageSquare className="w-6 h-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="overview">{analyticsT.overview}</TabsTrigger>
                    <TabsTrigger value="conversion">{analyticsT.conversions}</TabsTrigger>
                    <TabsTrigger value="activity">{analyticsT.activity}</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <div className="grid lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-h4">{analyticsT.revenueVsAppt}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Suspense fallback={<Skeleton className="h-[350px]" />}>
                                    <OverviewChart />
                                </Suspense>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-h4">{analyticsT.mainMetrics}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Suspense fallback={<Skeleton className="h-[350px]" />}>
                                    <TopMetrics />
                                </Suspense>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="conversion">
                    <div className="grid lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-h4">{analyticsT.convFunnel}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Suspense fallback={<Skeleton className="h-[400px]" />}>
                                    <ConversionFunnel steps={analytics.funnel} />
                                </Suspense>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-h4">{analyticsT.leadSource}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Suspense fallback={<Skeleton className="h-[400px]" />}>
                                    <LeadSourceChart />
                                </Suspense>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="activity">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-h4">{analyticsT.recentActivity}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Suspense fallback={<Skeleton className="h-[400px]" />}>
                                <RecentActivity />
                            </Suspense>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Quick Links */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <Link href="/admin/analytics/receita">
                    <Card className="hover:shadow-md transition-all cursor-pointer border-pampas-dark/10 hover:border-success/30">
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center gap-3 text-center">
                                <div className="p-2 bg-success/10 rounded-full">
                                    <DollarSign className="w-5 h-5 text-success" />
                                </div>
                                <span className="font-medium text-body-sm">{financeT.title}</span>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/analytics/conversao">
                    <Card className="hover:shadow-md transition-all cursor-pointer border-pampas-dark/10 hover:border-info/30">
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center gap-3 text-center">
                                <div className="p-2 bg-info/10 rounded-full">
                                    <TrendingUp className="w-5 h-5 text-info" />
                                </div>
                                <span className="font-medium text-body-sm">{analyticsT.conversions}</span>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/analytics/satisfacao">
                    <Card className="hover:shadow-md transition-all cursor-pointer border-pampas-dark/10 hover:border-warning/30">
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center gap-3 text-center">
                                <div className="p-2 bg-warning/10 rounded-full">
                                    <MessageSquare className="w-5 h-5 text-warning" />
                                </div>
                                <span className="font-medium text-body-sm">{analyticsT.satisfaction}</span>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/analytics/tendencias">
                    <Card className="hover:shadow-md transition-all cursor-pointer border-pampas-dark/10 hover:border-primary/30">
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center gap-3 text-center">
                                <div className="p-2 bg-primary/10 rounded-full">
                                    <Zap className="w-5 h-5 text-primary" />
                                </div>
                                <span className="font-medium text-body-sm">{analyticsT.trends}</span>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/analytics/clientes">
                    <Card className="hover:shadow-md transition-all cursor-pointer border-pampas-dark/10 hover:border-secondary/30">
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center gap-3 text-center">
                                <div className="p-2 bg-secondary/10 rounded-full">
                                    <Users className="w-5 h-5 text-secondary" />
                                </div>
                                <span className="font-medium text-body-sm">{clientsT.title}</span>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/analytics/carol">
                    <Card className="hover:shadow-md transition-all cursor-pointer border-pampas-dark/10 hover:border-brandy-rose/30">
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center gap-3 text-center">
                                <div className="p-2 bg-brandy-rose/10 rounded-full">
                                    <MessageSquareText className="w-5 h-5 text-brandy-rose" />
                                </div>
                                <span className="font-medium text-body-sm">{analyticsT.performance}</span>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    )
}

function LeadSourceChart() {
    return (
        <div className="space-y-4">
            {[
                { source: 'Website Chat', count: 45, percentage: 45, color: 'bg-primary' },
                { source: 'WhatsApp', count: 30, percentage: 30, color: 'bg-success' },
                { source: 'Indicação', count: 15, percentage: 15, color: 'bg-warning' },
                { source: 'Instagram', count: 10, percentage: 10, color: 'bg-info' },
            ].map((item) => (
                <div key={item.source} className="space-y-2">
                    <div className="flex justify-between text-body-sm">
                        <span>{item.source}</span>
                        <span className="font-medium">{item.count} ({item.percentage}%)</span>
                    </div>
                    <div className="h-2 bg-pampas rounded-full overflow-hidden">
                        <div
                            className={`h-full ${item.color} rounded-full`}
                            style={{ width: `${item.percentage}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    )
}

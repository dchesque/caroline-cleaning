// app/(admin)/admin/analytics/satisfacao/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, Star, MessageSquareText, ThumbsUp, CheckCircle2 } from 'lucide-react'
import { KPICard } from '@/components/analytics/kpi-card'
import { PeriodSelector } from '@/components/analytics/period-selector'
import { SatisfactionChart } from '@/components/analytics/satisfaction-chart'
import { Badge } from '@/components/ui/badge'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'
import { format, subDays, startOfMonth, startOfYear, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function SatisfacaoPage() {
    const [period, setPeriod] = useState('30d')
    const [isLoading, setIsLoading] = useState(true)
    const [data, setData] = useState<any>({
        kpis: {
            avgRating: 0,
            totalAssessments: 0,
            fiveStarsPercent: 0,
            responseRate: 0,
        },
        distribution: [],
        evolution: [],
        recentFeedback: [],
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

            // 1. Fetch Feedback Data
            const { data: feedbackData, error } = await supabase
                .from('feedback')
                .select('*, clientes(nome)')
                .gte('created_at', startDateStr)
                .order('created_at', { ascending: false })

            if (feedbackData) {
                const total = feedbackData.length
                const sum = feedbackData.reduce((acc, curr) => acc + curr.rating, 0)
                const avg = total > 0 ? sum / total : 0
                const fiveStars = feedbackData.filter(f => f.rating === 5).length
                const fiveStarsPercent = total > 0 ? (fiveStars / total) * 100 : 0

                // Distribuição
                const dist = [5, 4, 3, 2, 1].map(r => ({
                    rating: r,
                    count: feedbackData.filter(f => f.rating === r).length,
                    percentage: total > 0 ? (feedbackData.filter(f => f.rating === r).length / total) * 100 : 0
                }))

                // Evolução (agrupado por dia/semana/mês dependendo do período)
                // Por simplificação: últimos 7 pontos no tempo
                const evolutionMap = new Map()
                feedbackData.forEach(f => {
                    const date = f.created_at.split('T')[0]
                    if (!evolutionMap.has(date)) evolutionMap.set(date, [])
                    evolutionMap.get(date).push(f.rating)
                })

                const evolutionData = Array.from(evolutionMap.entries())
                    .map(([date, ratings]) => ({
                        date: format(parseISO(date), 'dd/MM'),
                        avg: ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
                    }))
                    .reverse()
                    .slice(-10)

                setData({
                    kpis: {
                        avgRating: avg.toFixed(1),
                        totalAssessments: total,
                        fiveStarsPercent: fiveStarsPercent.toFixed(1),
                        responseRate: 98, // Mocked
                    },
                    distribution: dist,
                    evolution: evolutionData,
                    recentFeedback: feedbackData.slice(0, 5),
                })
            }

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
                        <h1 className="font-heading text-h2 text-foreground">Satisfação do Cliente</h1>
                        <p className="text-body text-muted-foreground">Monitore o feedback e qualidade do serviço</p>
                    </div>
                </div>
                <PeriodSelector value={period} onChange={setPeriod} />
            </div>

            {/* KPI Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Média Rating"
                    value={data.kpis.avgRating}
                    subtitle="Escala de 1 a 5"
                    icon={Star}
                    iconColor="text-warning"
                    iconBgColor="bg-warning/10"
                />
                <KPICard
                    title="Avaliações"
                    value={data.kpis.totalAssessments}
                    subtitle="No período selecionado"
                    icon={MessageSquareText}
                    iconColor="text-info"
                    iconBgColor="bg-info/10"
                />
                <KPICard
                    title="Alta Avaliação"
                    value={`${data.kpis.fiveStarsPercent}%`}
                    subtitle="Avaliações 5 estrelas"
                    icon={ThumbsUp}
                    iconColor="text-success"
                    iconBgColor="bg-success/10"
                />
                <KPICard
                    title="Taxa de Resposta"
                    value={`${data.kpis.responseRate}%`}
                    subtitle="Feedback respondido"
                    icon={CheckCircle2}
                    iconColor="text-primary"
                    iconBgColor="bg-primary/10"
                />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Distribution Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-h4 font-heading">Distribuição de Notas</CardTitle>
                        <CardDescription>Volume de avaliações por pontuação</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SatisfactionChart data={data.distribution} />
                    </CardContent>
                </Card>

                {/* Evolution Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-h4 font-heading">Evolução da Média</CardTitle>
                        <CardDescription>Qualidade do serviço ao longo do tempo</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px]">
                            {isLoading ? (
                                <div className="h-full w-full bg-pampas animate-pulse rounded-lg" />
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data.evolution}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E8E4E1" vertical={false} />
                                        <XAxis dataKey="date" stroke="#9A8478" fontSize={12} />
                                        <YAxis domain={[0, 5]} stroke="#9A8478" fontSize={12} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'white',
                                                border: '1px solid #E8E4E1',
                                                borderRadius: '8px'
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="avg"
                                            stroke="#C4A35A"
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: '#C4A35A', strokeWidth: 2, stroke: '#fff' }}
                                            name="Média"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Feedbacks List */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-h4 font-heading">Feedbacks Recentes</CardTitle>
                    <CardDescription>As últimas avaliações recebidas</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {data.recentFeedback.map((fb: any) => (
                            <div key={fb.id} className="flex gap-4 pb-6 border-b border-pampas last:border-0 last:pb-0">
                                <div className="w-12 h-12 rounded-full bg-brandy-rose-100 flex items-center justify-center text-brandy-rose-600 font-bold shrink-0">
                                    {fb.clientes?.nome?.substring(0, 2).toUpperCase() || 'AN'}
                                </div>
                                <div className="space-y-1 flex-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium">{fb.clientes?.nome || 'Cliente Anônimo'}</h4>
                                        <span className="text-caption text-muted-foreground">
                                            {format(parseISO(fb.created_at), "dd 'de' MMM", { locale: ptBR })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 mb-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                className={`w-4 h-4 ${star <= fb.rating ? 'fill-warning text-warning' : 'text-pampas-dark'}`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-body-sm text-foreground italic">"{fb.comentario || 'Sem comentários'}"</p>
                                    <div className="pt-2">
                                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                                            {fb.tipo_servico || 'Serviço Geral'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {data.recentFeedback.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                <MessageSquareText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>Nenhuma avaliação encontrada para o período.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

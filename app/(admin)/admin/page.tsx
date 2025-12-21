import { Suspense, useState, useEffect } from 'react'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { TodaySchedule } from '@/components/dashboard/today-schedule'
import { AlertsPanel } from '@/components/dashboard/alerts-panel'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UserPlus, Phone } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-heading text-3xl text-foreground">Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                    Bem-vinda de volta! Aqui está o resumo do seu dia.
                </p>
            </div>

            <Suspense fallback={<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
            </div>}>
                <StatsCards />
            </Suspense>

            <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
                <div className="lg:col-span-2">
                    <Suspense fallback={<Skeleton className="h-[400px]" />}>
                        <TodaySchedule />
                    </Suspense>
                </div>
                <div className="space-y-6">
                    <QuickActions />
                    <Suspense fallback={<Skeleton className="h-[200px]" />}>
                        <RecentLeadsWidget />
                    </Suspense>
                    <Suspense fallback={<Skeleton className="h-[200px]" />}>
                        <AlertsPanel />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}

function RecentLeadsWidget() {
    const [leads, setLeads] = useState<any[]>([])
    const [stats, setStats] = useState<any>(null)
    const supabase = createClient()

    useEffect(() => {
        async function fetch() {
            // Stats
            const { data: statsData } = await supabase
                .from('contact_leads_stats')
                .select('*')
                .single()
            setStats(statsData)

            // Recent leads
            const { data: leadsData } = await supabase
                .from('contact_leads')
                .select('*')
                .eq('status', 'novo')
                .order('created_at', { ascending: false })
                .limit(5)
            setLeads(leadsData || [])
        }
        fetch()
    }, [])

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-brandy-rose-500" />
                    Leads Recentes
                </CardTitle>
                {stats?.novos > 0 && (
                    <Badge className="bg-blue-100 text-blue-800">
                        {stats.novos} novos
                    </Badge>
                )}
            </CardHeader>
            <CardContent>
                {leads.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum lead novo
                    </p>
                ) : (
                    <div className="space-y-3">
                        {leads.map(lead => (
                            <div key={lead.id} className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-sm">{lead.nome}</p>
                                    <p className="text-xs text-muted-foreground">{lead.telefone}</p>
                                </div>
                                <a
                                    href={`tel:${lead.telefone}`}
                                    className="p-2 rounded-full bg-green-50 text-green-600 hover:bg-green-100"
                                >
                                    <Phone className="w-4 h-4" />
                                </a>
                            </div>
                        ))}
                    </div>
                )}
                <Link href="/admin/leads" className="block mt-4">
                    <Button variant="outline" size="sm" className="w-full">
                        Ver todos os leads
                    </Button>
                </Link>
            </CardContent>
        </Card>
    )
}

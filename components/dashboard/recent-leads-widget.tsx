'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UserPlus, Phone } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAdminI18n } from '@/lib/admin-i18n/context'

export function RecentLeadsWidget() {
    const { t } = useAdminI18n()
    const dashboardT = t('dashboard')
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
                    {dashboardT.recentLeads.title}
                </CardTitle>
                {stats?.novos > 0 && (
                    <Badge className="bg-blue-100 text-blue-800">
                        {stats.novos} {dashboardT.recentLeads.newBadge}
                    </Badge>
                )}
            </CardHeader>
            <CardContent>
                {leads.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        {dashboardT.recentLeads.empty}
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
                        {dashboardT.recentLeads.viewAll}
                    </Button>
                </Link>
            </CardContent>
        </Card>
    )
}

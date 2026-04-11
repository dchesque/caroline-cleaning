'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, AlertTriangle, CheckCircle, Phone, AlertCircle, Loader2, XCircle } from 'lucide-react'
import { useAdminI18n } from '@/lib/admin-i18n/context'
import { createClient } from '@/lib/supabase/client'

interface Alert {
    title: string
    message: string
    type: 'warning' | 'success' | 'error'
}

export function AlertsPanel() {
    const { t, locale } = useAdminI18n()
    const dashboardT = t('dashboard')
    const [alerts, setAlerts] = useState<Alert[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function fetchAlerts() {
            try {
                const collected: Alert[] = []

                const [overdueRes, callbacksRes, failedNotifRes, lowRatingRes] = await Promise.all([
                    // Overdue payments
                    supabase
                        .from('financeiro')
                        .select('valor')
                        .eq('status', 'pendente')
                        .eq('tipo', 'receita'),
                    // Pending callbacks
                    supabase
                        .from('callbacks')
                        .select('id', { count: 'exact', head: true })
                        .eq('status', 'pending'),
                    // Failed notifications (last 7 days)
                    supabase
                        .from('notificacoes')
                        .select('id', { count: 'exact', head: true })
                        .eq('status', 'failed')
                        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
                    // Low ratings (last 7 days)
                    supabase
                        .from('feedback')
                        .select('rating, clientes(nome)')
                        .lt('rating', 4)
                        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
                        .order('created_at', { ascending: false })
                        .limit(1),
                ])

                // Overdue payments
                if (overdueRes.data && overdueRes.data.length > 0) {
                    const total = overdueRes.data.reduce((acc, curr) => acc + Number(curr.valor), 0)
                    const formatted = new Intl.NumberFormat(locale === 'pt-BR' ? 'pt-BR' : 'en-US', {
                        style: 'currency',
                        currency: 'USD',
                    }).format(total)
                    collected.push({
                        title: dashboardT.alerts.overduePayments,
                        message: dashboardT.alerts.overduePaymentsDesc(overdueRes.data.length, formatted),
                        type: 'warning',
                    })
                }

                // Pending callbacks
                if (callbacksRes.count && callbacksRes.count > 0) {
                    collected.push({
                        title: dashboardT.alerts.pendingCallbacks,
                        message: dashboardT.alerts.pendingCallbacksDesc(callbacksRes.count),
                        type: 'warning',
                    })
                }

                // Failed notifications
                if (failedNotifRes.count && failedNotifRes.count > 0) {
                    collected.push({
                        title: dashboardT.alerts.failedNotifications,
                        message: dashboardT.alerts.failedNotificationsDesc(failedNotifRes.count),
                        type: 'error',
                    })
                }

                // Low ratings
                if (lowRatingRes.data && lowRatingRes.data.length > 0) {
                    const item = lowRatingRes.data[0] as any
                    const clientName = item.clientes?.nome || 'Client'
                    collected.push({
                        title: dashboardT.alerts.lowRating,
                        message: dashboardT.alerts.lowRatingDesc(clientName, item.rating),
                        type: 'warning',
                    })
                }

                setAlerts(collected)
            } catch (err) {
                console.error('Failed to fetch alerts:', err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchAlerts()
    }, [])

    const iconMap = {
        warning: <AlertTriangle className="w-4 h-4" />,
        success: <CheckCircle className="w-4 h-4" />,
        error: <XCircle className="w-4 h-4" />,
    }

    const colorMap = {
        warning: 'text-yellow-500',
        success: 'text-green-500',
        error: 'text-red-500',
    }

    return (
        <Card className="border-none shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    {dashboardT.alerts.title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {alerts.map((alert, i) => (
                            <div key={i} className="flex gap-3 items-start">
                                <div className={`mt-0.5 ${colorMap[alert.type]}`}>
                                    {iconMap[alert.type]}
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{alert.title}</p>
                                    <p className="text-xs text-muted-foreground">{alert.message}</p>
                                </div>
                            </div>
                        ))}
                        {alerts.length === 0 && (
                            <div className="flex items-center gap-2 text-green-600 py-2">
                                <CheckCircle className="w-4 h-4" />
                                <p className="text-sm">{dashboardT.alerts.empty}</p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, AlertTriangle, CheckCircle } from 'lucide-react'
import { useAdminI18n } from '@/lib/admin-i18n/context'

export function AlertsPanel() {
    const { t } = useAdminI18n()
    const dashboardT = t('dashboard')
    // Placeholder mock alerts
    const alerts = [
        { title: 'Payment Overdue', message: 'Client #1024 has pending invoices', type: 'warning' },
        { title: 'New Review', message: 'Received 5 stars from Sarah', type: 'success' },
    ]

    return (
        <Card className="border-none shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    {dashboardT.alerts.title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {alerts.map((alert, i) => (
                        <div key={i} className="flex gap-3 items-start">
                            <div className={`mt-0.5 ${alert.type === 'warning' ? 'text-yellow-500' : 'text-green-500'}`}>
                                {alert.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </div>
                            <div>
                                <p className="text-sm font-medium">{alert.title}</p>
                                <p className="text-xs text-muted-foreground">{alert.message}</p>
                            </div>
                        </div>
                    ))}
                    {alerts.length === 0 && <p className="text-sm text-muted-foreground">{dashboardT.alerts.empty}</p>}
                </div>
            </CardContent>
        </Card>
    )
}

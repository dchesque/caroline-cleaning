'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, UserPlus, Calendar } from 'lucide-react'
import Link from 'next/link'
import { useAdminI18n } from '@/lib/admin-i18n/context'

export function QuickActions() {
    const { t } = useAdminI18n()
    const dashboardT = t('dashboard')

    return (
        <Card className="border-none shadow-sm">
            <CardHeader>
                <CardTitle>{dashboardT.quickActions.title}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
                <Button asChild className="w-full justify-start bg-[#C48B7F] hover:bg-[#A66D60]">
                    <Link href="/admin/agenda?new=true">
                        <Plus className="mr-2 h-4 w-4" />
                        {dashboardT.quickActions.newAppointment}
                    </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start border-[#C48B7F] text-[#C48B7F] hover:bg-[#F9F1F0]">
                    <Link href="/admin/clientes?new=true">
                        <UserPlus className="mr-2 h-4 w-4" />
                        {dashboardT.quickActions.newClient}
                    </Link>
                </Button>
                <Button asChild variant="ghost" className="w-full justify-start">
                    <Link href="/admin/agenda">
                        <Calendar className="mr-2 h-4 w-4" />
                        {dashboardT.quickActions.viewFullSchedule}
                    </Link>
                </Button>
            </CardContent>
        </Card>
    )
}

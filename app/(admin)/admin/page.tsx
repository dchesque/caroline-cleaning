'use client'

import { Suspense } from 'react'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { TodaySchedule } from '@/components/dashboard/today-schedule'
import { AlertsPanel } from '@/components/dashboard/alerts-panel'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { Skeleton } from '@/components/ui/skeleton'
import { RecentLeadsWidget } from '@/components/dashboard/recent-leads-widget'
import { useAdminI18n } from '@/lib/admin-i18n/context'

export default function DashboardPage() {
    const { t } = useAdminI18n();
    const common = t('common');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-heading text-3xl text-foreground">{common.dashboard}</h1>
                <p className="text-sm text-muted-foreground">
                    {common.welcome}
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

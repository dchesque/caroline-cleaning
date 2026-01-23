'use client'

import Link from 'next/link'
import { useAdminI18n } from '@/lib/admin-i18n/context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    CreditCard,
    Plus,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    Tags
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { RevenueChart } from '@/components/financeiro/revenue-chart'
import { RecentTransactions } from '@/components/financeiro/recent-transactions'
import { Suspense } from 'react'

interface FinanceiroContentProps {
    stats: {
        totalCurrentRevenue: number
        totalLastRevenue: number
        totalExpenses: number
        totalPending: number
        profit: number
        revenueChange: string | number
    }
}

export function FinanceiroContent({ stats }: FinanceiroContentProps) {
    const { t } = useAdminI18n()
    const financeT = t('finance')

    const {
        totalCurrentRevenue,
        totalExpenses,
        totalPending,
        profit,
        revenueChange
    } = stats

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-heading text-h2 text-foreground">{financeT.title}</h1>
                    <p className="text-body text-muted-foreground">
                        {financeT.subtitle}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/admin/financeiro/categorias">
                            <Tags className="w-4 h-4 mr-2" />
                            {financeT.categories}
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/admin/financeiro/despesas">
                            <TrendingDown className="w-4 h-4 mr-2" />
                            {financeT.newExpense}
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/admin/financeiro/receitas">
                            <Plus className="w-4 h-4 mr-2" />
                            {financeT.newRevenue}
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-caption text-muted-foreground">{financeT.stats.revenue}</p>
                                <p className="text-h3 font-semibold">{formatCurrency(totalCurrentRevenue)}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    {Number(revenueChange) >= 0 ? (
                                        <ArrowUpRight className="w-4 h-4 text-success" />
                                    ) : (
                                        <ArrowDownRight className="w-4 h-4 text-destructive" />
                                    )}
                                    <span className={`text-caption ${Number(revenueChange) >= 0 ? 'text-success' : 'text-destructive'}`}>
                                        {revenueChange}% {financeT.stats.vsLastMonth}
                                    </span>
                                </div>
                            </div>
                            <div className="p-3 bg-success/10 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-success" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-caption text-muted-foreground">{financeT.stats.expenses}</p>
                                <p className="text-h3 font-semibold">{formatCurrency(totalExpenses)}</p>
                                <p className="text-caption text-muted-foreground mt-1">
                                    {financeT.stats.operationalCosts}
                                </p>
                            </div>
                            <div className="p-3 bg-destructive/10 rounded-lg">
                                <TrendingDown className="w-6 h-6 text-destructive" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-caption text-muted-foreground">{financeT.stats.profit}</p>
                                <p className={`text-h3 font-semibold ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                                    {formatCurrency(profit)}
                                </p>
                                <p className="text-caption text-muted-foreground mt-1">
                                    {financeT.stats.thisMonth}
                                </p>
                            </div>
                            <div className="p-3 bg-primary/10 rounded-lg">
                                <DollarSign className="w-6 h-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-caption text-muted-foreground">{financeT.stats.pending}</p>
                                <p className="text-h3 font-semibold text-warning">{formatCurrency(totalPending)}</p>
                                <p className="text-caption text-muted-foreground mt-1">
                                    {financeT.stats.pendingPayments}
                                </p>
                            </div>
                            <div className="p-3 bg-warning/10 rounded-lg">
                                <CreditCard className="w-6 h-6 text-warning" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts and Transactions */}
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-h4">{financeT.charts.monthlyRevenue}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Suspense fallback={<Skeleton className="h-[300px]" />}>
                                <RevenueChart />
                            </Suspense>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-h4">{financeT.charts.recentTransactions}</CardTitle>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/admin/financeiro/receitas">{financeT.charts.viewAll}</Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Suspense fallback={<Skeleton className="h-[300px]" />}>
                                <RecentTransactions />
                            </Suspense>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Quick Links */}
            <div className="grid sm:grid-cols-3 gap-4">
                <Card className="hover:shadow-md transition-shadow">
                    <Link href="/admin/financeiro/receitas">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-success/10 rounded-lg">
                                    <TrendingUp className="w-5 h-5 text-success" />
                                </div>
                                <div>
                                    <p className="font-semibold">{financeT.quickLinks.revenues}</p>
                                    <p className="text-caption text-muted-foreground">{financeT.quickLinks.revenuesDesc}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Link>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <Link href="/admin/financeiro/despesas">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-destructive/10 rounded-lg">
                                    <TrendingDown className="w-5 h-5 text-destructive" />
                                </div>
                                <div>
                                    <p className="font-semibold">{financeT.quickLinks.expenses}</p>
                                    <p className="text-caption text-muted-foreground">{financeT.quickLinks.expensesDesc}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Link>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <Link href="/admin/financeiro/relatorios">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-info/10 rounded-lg">
                                    <Calendar className="w-5 h-5 text-info" />
                                </div>
                                <div>
                                    <p className="font-semibold">{financeT.quickLinks.reports}</p>
                                    <p className="text-caption text-muted-foreground">{financeT.quickLinks.reportsDesc}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Link>
                </Card>
            </div>
        </div>
    )
}

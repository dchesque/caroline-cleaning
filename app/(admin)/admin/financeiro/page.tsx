import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
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
    Calendar
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { RevenueChart } from '@/components/financeiro/revenue-chart'
import { RecentTransactions } from '@/components/financeiro/recent-transactions'

export default async function FinanceiroPage() {
    const supabase = await createClient()

    // Get financial summary
    const currentMonth = new Date().toISOString().slice(0, 7)
    const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7)

    // Current month revenue
    const { data: currentRevenue } = await supabase
        .from('financeiro')
        .select('valor')
        .eq('tipo', 'receita')
        .eq('status', 'pago')
        .gte('data', `${currentMonth}-01`)
        .lte('data', `${currentMonth}-31`)

    // Last month revenue
    const { data: lastRevenue } = await supabase
        .from('financeiro')
        .select('valor')
        .eq('tipo', 'receita')
        .eq('status', 'pago')
        .gte('data', `${lastMonth}-01`)
        .lte('data', `${lastMonth}-31`)

    // Current month expenses
    const { data: currentExpenses } = await supabase
        .from('financeiro')
        .select('valor')
        .eq('tipo', 'custo')
        .eq('status', 'pago')
        .gte('data', `${currentMonth}-01`)
        .lte('data', `${currentMonth}-31`)

    // Pending payments
    const { data: pending } = await supabase
        .from('financeiro')
        .select('valor')
        .eq('tipo', 'receita')
        .eq('status', 'pendente')

    const totalCurrentRevenue = currentRevenue?.reduce((acc, r) => acc + r.valor, 0) || 0
    const totalLastRevenue = lastRevenue?.reduce((acc, r) => acc + r.valor, 0) || 0
    const totalExpenses = currentExpenses?.reduce((acc, r) => acc + r.valor, 0) || 0
    const totalPending = pending?.reduce((acc, r) => acc + r.valor, 0) || 0
    const profit = totalCurrentRevenue - totalExpenses

    const revenueChange = totalLastRevenue > 0
        ? ((totalCurrentRevenue - totalLastRevenue) / totalLastRevenue * 100).toFixed(1)
        : 0

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-heading text-h2 text-foreground">Financeiro</h1>
                    <p className="text-body text-muted-foreground">
                        Visão geral das finanças do seu negócio
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/admin/financeiro/despesas">
                            <TrendingDown className="w-4 h-4 mr-2" />
                            Nova Despesa
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/admin/financeiro/receitas">
                            <Plus className="w-4 h-4 mr-2" />
                            Nova Receita
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
                                <p className="text-caption text-muted-foreground">Receita do Mês</p>
                                <p className="text-h3 font-semibold">{formatCurrency(totalCurrentRevenue)}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    {Number(revenueChange) >= 0 ? (
                                        <ArrowUpRight className="w-4 h-4 text-success" />
                                    ) : (
                                        <ArrowDownRight className="w-4 h-4 text-destructive" />
                                    )}
                                    <span className={`text-caption ${Number(revenueChange) >= 0 ? 'text-success' : 'text-destructive'}`}>
                                        {revenueChange}% vs mês anterior
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
                                <p className="text-caption text-muted-foreground">Despesas do Mês</p>
                                <p className="text-h3 font-semibold">{formatCurrency(totalExpenses)}</p>
                                <p className="text-caption text-muted-foreground mt-1">
                                    Custos operacionais
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
                                <p className="text-caption text-muted-foreground">Lucro Líquido</p>
                                <p className={`text-h3 font-semibold ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                                    {formatCurrency(profit)}
                                </p>
                                <p className="text-caption text-muted-foreground mt-1">
                                    Este mês
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
                                <p className="text-caption text-muted-foreground">A Receber</p>
                                <p className="text-h3 font-semibold text-warning">{formatCurrency(totalPending)}</p>
                                <p className="text-caption text-muted-foreground mt-1">
                                    Pagamentos pendentes
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
                            <CardTitle className="text-h4">Receita Mensal</CardTitle>
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
                            <CardTitle className="text-h4">Transações Recentes</CardTitle>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/admin/financeiro/receitas">Ver todas</Link>
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
                                    <p className="font-semibold">Receitas</p>
                                    <p className="text-caption text-muted-foreground">Gerenciar entradas</p>
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
                                    <p className="font-semibold">Despesas</p>
                                    <p className="text-caption text-muted-foreground">Gerenciar saídas</p>
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
                                    <p className="font-semibold">Relatórios</p>
                                    <p className="text-caption text-muted-foreground">Análises detalhadas</p>
                                </div>
                            </div>
                        </CardContent>
                    </Link>
                </Card>
            </div>
        </div>
    )
}

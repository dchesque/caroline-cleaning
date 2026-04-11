'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
    Download,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Calendar as CalendarIcon,
    Loader2
} from 'lucide-react'
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns'
import { ptBR, enUS } from 'date-fns/locale'
import { useAdminI18n } from '@/lib/admin-i18n/context'

const COLORS = ['#C17B7B', '#C48B7F', '#C4A35A', '#A18B72', '#8E8E8E', '#D9C5B2'];

export default function RelatoriosPage() {
    const { t, locale } = useAdminI18n()
    const reportsT = t('finance_reports')
    const common = t('common')
    const currentLocale = locale === 'pt-BR' ? ptBR : enUS

    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState('this_year')
    const [transactions, setTransactions] = useState<any[]>([])
    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            const { data } = await supabase
                .from('financeiro')
                .select('*')
                .order('data', { ascending: true })

            if (data) setTransactions(data)
            setLoading(false)
        }
        fetchData()
    }, [])

    // Filter transactions by selected period
    const filteredTransactions = useMemo(() => {
        const now = new Date()
        let start: Date

        switch (period) {
            case 'this_month':
                start = startOfMonth(now)
                break
            case 'last_month':
                start = startOfMonth(subMonths(now, 1))
                break
            case 'last_3_months':
                start = startOfMonth(subMonths(now, 3))
                break
            case 'last_6_months':
                start = startOfMonth(subMonths(now, 6))
                break
            case 'this_year':
                start = new Date(now.getFullYear(), 0, 1)
                break
            default:
                start = new Date(now.getFullYear(), 0, 1)
        }

        return transactions.filter(t => {
            const d = new Date(t.data)
            return d >= start && d <= now
        })
    }, [transactions, period])

    // Process data for charts - using filtered transactions for stats but full range for chart
    const chartData = useMemo(() => {
        if (!transactions.length) return []

        const now = new Date()
        let monthsBack: number

        switch (period) {
            case 'this_month': monthsBack = 0; break
            case 'last_month': monthsBack = 1; break
            case 'last_3_months': monthsBack = 3; break
            case 'last_6_months': monthsBack = 6; break
            case 'this_year': monthsBack = now.getMonth(); break
            default: monthsBack = 11
        }

        const interval = eachMonthOfInterval({
            start: subMonths(now, Math.max(monthsBack, 1)),
            end: now
        })

        return interval.map(month => {
            const mStart = startOfMonth(month)
            const mEnd = endOfMonth(month)

            const monthTrans = transactions.filter(t => {
                const d = new Date(t.data)
                return d >= mStart && d <= mEnd
            })

            const revenue = monthTrans
                .filter(t => t.tipo === 'receita' && t.status === 'pago')
                .reduce((acc, curr) => acc + curr.valor, 0)

            const expenses = monthTrans
                .filter(t => t.tipo === 'custo')
                .reduce((acc, curr) => acc + curr.valor, 0)

            return {
                name: format(month, 'MMM/yy', { locale: currentLocale }),
                revenue,
                expenses,
                profit: revenue - expenses
            }
        })
    }, [transactions, currentLocale, period])

    const categoryData = useMemo(() => {
        const expenses = filteredTransactions.filter(t => t.tipo === 'custo')
        const groups = new Map()

        expenses.forEach(t => {
            const val = groups.get(t.categoria) || 0
            groups.set(t.categoria, val + t.valor)
        })

        return Array.from(groups.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
    }, [filteredTransactions])

    const stats = useMemo(() => {
        const revenue = filteredTransactions
            .filter(t => t.tipo === 'receita' && t.status === 'pago')
            .reduce((acc, curr) => acc + curr.valor, 0)

        const expenses = filteredTransactions
            .filter(t => t.tipo === 'custo')
            .reduce((acc, curr) => acc + curr.valor, 0)

        return {
            totalRevenue: revenue,
            totalExpenses: expenses,
            netProfit: revenue - expenses,
            margin: revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0
        }
    }, [filteredTransactions])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-10 px-0 sm:px-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-heading text-h2 text-foreground">{reportsT.title}</h1>
                    <p className="text-body text-muted-foreground">{reportsT.subtitle}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-[180px]">
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            <SelectValue placeholder={common.period} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="this_month">{common.periods.thisMonth}</SelectItem>
                            <SelectItem value="last_month">{common.periods.lastMonth}</SelectItem>
                            <SelectItem value="last_3_months">{common.periods.last3Months}</SelectItem>
                            <SelectItem value="last_6_months">{common.periods.last6Months}</SelectItem>
                            <SelectItem value="this_year">{common.periods.thisYear}</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => {
                        if (!filteredTransactions.length) return
                        const headers = ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor', 'Status']
                        const rows = filteredTransactions.map(t => [
                            t.data, t.tipo, t.categoria, t.descricao || '', t.valor.toString(), t.status || ''
                        ])
                        const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
                        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `relatorio_financeiro_${period}.csv`
                        a.click()
                        URL.revokeObjectURL(url)
                    }}>
                        <Download className="w-4 h-4 mr-2" />
                        {common.exportCSV || 'Exportar CSV'}
                    </Button>
                </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>{reportsT.cashFlow.inflow}</CardDescription>
                        <CardTitle className="text-2xl text-success flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            {formatCurrency(stats.totalRevenue)}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>{reportsT.cashFlow.outflow}</CardDescription>
                        <CardTitle className="text-2xl text-destructive flex items-center gap-2">
                            <TrendingDown className="w-5 h-5" />
                            {formatCurrency(stats.totalExpenses)}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>{reportsT.cashFlow.balance}</CardDescription>
                        <CardTitle className="text-2xl text-primary flex items-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            {formatCurrency(stats.netProfit)}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>{reportsT.dre.netProfit}</CardDescription>
                        <CardTitle className="text-2xl text-brandy-rose-600">
                            {stats.margin.toFixed(1)}%
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Cash Flow Evolution */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>{reportsT.cashFlow.title}</CardTitle>
                        <CardDescription>{reportsT.subtitle}</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E4E1" />
                                <XAxis
                                    dataKey="name"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    stroke="#9A8478"
                                    minTickGap={10}
                                />
                                <YAxis
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    stroke="#9A8478"
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <Tooltip
                                    formatter={(value: any) => formatCurrency(value)}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Legend verticalAlign="top" height={36} />
                                <Line
                                    type="monotone"
                                    dataKey="revenue"
                                    name={reportsT.cashFlow.inflow}
                                    stroke="#C17B7B"
                                    strokeWidth={3}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="expenses"
                                    name={reportsT.cashFlow.outflow}
                                    stroke="#8E8E8E"
                                    strokeDasharray="5 5"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Categories Bar Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>{reportsT.dre.title}</CardTitle>
                        <CardDescription>{reportsT.dre.operatingExpenses}</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryData.slice(0, 5)} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    fontSize={12}
                                    width={100}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    formatter={(value: any) => formatCurrency(value)}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="value" fill="#C17B7B" radius={[0, 4, 4, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Category Mix Pie Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>{reportsT.dre.operatingExpenses}</CardTitle>
                        <CardDescription>{reportsT.dre.title}</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

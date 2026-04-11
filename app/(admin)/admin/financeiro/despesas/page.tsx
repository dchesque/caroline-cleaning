'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { TransactionForm } from '@/components/financeiro/transaction-form'
import { useAdminI18n } from '@/lib/admin-i18n/context'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, DollarSign, Clock, Plus, Download, Filter, Loader2, MoreHorizontal, Pencil, Trash2, Calendar as CalendarIcon } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip
} from 'recharts'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import Link from 'next/link'

interface Transaction {
    id: string
    descricao: string
    valor: number
    data: string
    categoria: string
    status: 'pago' | 'pendente'
    forma_pagamento?: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

function getDateRange(period: string) {
    const now = new Date()
    switch (period) {
        case 'last_month': {
            const d = subMonths(now, 1)
            return { start: format(startOfMonth(d), 'yyyy-MM-dd'), end: format(endOfMonth(d), 'yyyy-MM-dd') }
        }
        case 'last_3_months': {
            const d = subMonths(now, 3)
            return { start: format(startOfMonth(d), 'yyyy-MM-dd'), end: format(endOfMonth(now), 'yyyy-MM-dd') }
        }
        case 'last_6_months': {
            const d = subMonths(now, 6)
            return { start: format(startOfMonth(d), 'yyyy-MM-dd'), end: format(endOfMonth(now), 'yyyy-MM-dd') }
        }
        case 'this_year': {
            return { start: `${now.getFullYear()}-01-01`, end: format(endOfMonth(now), 'yyyy-MM-dd') }
        }
        case 'this_month':
        default: {
            return { start: format(startOfMonth(now), 'yyyy-MM-dd'), end: format(endOfMonth(now), 'yyyy-MM-dd') }
        }
    }
}

export default function DespesasPage() {
    const { t, locale } = useAdminI18n()
    const common = t('common')
    const expT = t('finance_expenses')
    const supabase = createClient()

    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState('this_month')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
    const [stats, setStats] = useState({
        totalPeriod: 0,
        count: 0,
        totalPaid: 0,
        totalPending: 0,
        topCategory: '-',
        dailyAverage: 0
    })
    const [chartData, setChartData] = useState<{ name: string; value: number }[]>([])

    const fetchTransactions = useCallback(async () => {
        setLoading(true)
        try {
            const { start, end } = getDateRange(period)

            let query = supabase
                .from('financeiro')
                .select('*')
                .eq('tipo', 'custo')
                .gte('data', start)
                .lte('data', end)
                .order('data', { ascending: false })

            if (categoryFilter !== 'all') {
                query = query.eq('categoria', categoryFilter)
            }

            const { data, error } = await query

            if (error) throw error

            if (data) {
                setTransactions(data)
                processStats(data)
            }
        } catch (error) {
            console.error(error)
            toast.error(expT.toast.loadError)
        } finally {
            setLoading(false)
        }
    }, [period, categoryFilter])

    useEffect(() => {
        fetchTransactions()
    }, [fetchTransactions])

    const processStats = (data: Transaction[]) => {
        const totalPeriod = data.reduce((acc, curr) => acc + curr.valor, 0)
        const count = data.length
        const totalPaid = data.filter(t => t.status === 'pago').reduce((acc, curr) => acc + curr.valor, 0)
        const totalPending = data.filter(t => t.status !== 'pago').reduce((acc, curr) => acc + curr.valor, 0)

        const categories = new Map<string, number>()
        data.forEach(t => {
            const current = categories.get(t.categoria) || 0
            categories.set(t.categoria, current + t.valor)
        })

        const sortedCategories = Array.from(categories.entries())
            .sort((a, b) => b[1] - a[1])

        const chart = sortedCategories.map(([name, value]) => ({ name, value }))
        setChartData(chart)

        setStats({
            totalPeriod,
            count,
            totalPaid,
            totalPending,
            topCategory: sortedCategories[0]?.[0] || '-',
            dailyAverage: totalPeriod / 30
        })
    }

    const handleDelete = async (id: string, descricao: string) => {
        if (!confirm(expT.table.confirmDelete(descricao))) return

        try {
            const { error } = await supabase
                .from('financeiro')
                .delete()
                .eq('id', id)

            if (error) throw error
            toast.success(expT.toast.operationSuccess)
            fetchTransactions()
        } catch (error) {
            console.error(error)
            toast.error(expT.toast.operationError)
        }
    }

    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction)
        setIsFormOpen(true)
    }

    const handleExportCSV = () => {
        if (transactions.length === 0) return
        const headers = ['Data', 'Descrição', 'Categoria', 'Valor', 'Status', 'Forma Pagamento']
        const rows = transactions.map(t => [
            t.data,
            t.descricao || '',
            t.categoria,
            t.valor.toString(),
            t.status,
            t.forma_pagamento || ''
        ])
        const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${expT.export.filename}_${period}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    const categories = useMemo(() => {
        return Array.from(new Set(transactions.map(t => t.categoria)))
    }, [transactions])

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-background">
            <main className="flex-1 p-4 md:p-8 pt-6">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="font-heading text-2xl font-bold text-foreground">{expT.title}</h1>
                            <p className="text-sm text-muted-foreground">{expT.subtitle}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/admin/financeiro/categorias">
                                    <Filter className="w-4 h-4 mr-2" />
                                    {expT.settings}
                                </Link>
                            </Button>
                            <Button size="sm" onClick={() => {
                                setEditingTransaction(null)
                                setIsFormOpen(true)
                            }}>
                                <Plus className="w-4 h-4 mr-2" />
                                {expT.newExpense}
                            </Button>
                        </div>
                    </div>

                    {/* Content Grid */}
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Stats & Chart */}
                        <div className="lg:col-span-1 space-y-4">
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-muted-foreground">{expT.stats.totalPeriod}</p>
                                        <TrendingUp className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="mt-2">
                                        <h3 className="text-2xl font-bold">{formatCurrency(stats.totalPeriod)}</h3>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {stats.count} {expT.stats.records}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-muted-foreground">{expT.stats.paid}</p>
                                        <DollarSign className="w-4 h-4 text-green-500" />
                                    </div>
                                    <div className="mt-2">
                                        <h3 className="text-2xl font-bold">{formatCurrency(stats.totalPaid)}</h3>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {expT.stats.totalSettled}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-muted-foreground">{expT.stats.pending}</p>
                                        <Clock className="w-4 h-4 text-yellow-500" />
                                    </div>
                                    <div className="mt-2">
                                        <h3 className="text-2xl font-bold">{formatCurrency(stats.totalPending)}</h3>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {expT.stats.toPay}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="h-[300px]">
                                <CardContent className="pt-6 h-full">
                                    <p className="text-sm font-medium mb-4">{expT.stats.distributionByCategory}</p>
                                    <ResponsiveContainer width="100%" height="80%">
                                        <PieChart>
                                            <Pie
                                                data={chartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Table Section */}
                        <div className="lg:col-span-2 space-y-4">
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex flex-wrap gap-4">
                                        <div className="flex-1 min-w-[150px]">
                                            <Select value={period} onValueChange={setPeriod}>
                                                <SelectTrigger>
                                                    <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                                                    <SelectValue placeholder={expT.filters.period} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="this_month">{common.periods.thisMonth}</SelectItem>
                                                    <SelectItem value="last_month">{common.periods.lastMonth}</SelectItem>
                                                    <SelectItem value="last_3_months">{common.periods.last3Months}</SelectItem>
                                                    <SelectItem value="last_6_months">{common.periods.last6Months}</SelectItem>
                                                    <SelectItem value="this_year">{common.periods.thisYear}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex-1 min-w-[150px]">
                                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                                <SelectTrigger>
                                                    <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                                                    <SelectValue placeholder={expT.filters.category} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">{expT.filters.allCategories}</SelectItem>
                                                    {categories.map(category => (
                                                        <SelectItem key={category} value={category}>{category}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button variant="outline" size="icon" onClick={handleExportCSV} title={expT.export.tooltip}>
                                            <Download className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="rounded-md border bg-white shadow-sm overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead>{expT.table.date}</TableHead>
                                            <TableHead>{expT.table.description}</TableHead>
                                            <TableHead>{expT.table.category}</TableHead>
                                            <TableHead>{expT.table.paymentMethod}</TableHead>
                                            <TableHead className="text-right">{expT.table.value}</TableHead>
                                            <TableHead className="text-center">{expT.table.status}</TableHead>
                                            <TableHead className="text-right">{expT.table.actions}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Loader2 className="w-8 h-8 animate-spin" />
                                                        <span>{expT.table.loading}</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : transactions.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                                    {expT.table.empty}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            transactions.map((transaction) => (
                                                <TableRow key={transaction.id} className="hover:bg-muted/50 transition-colors">
                                                    <TableCell className="text-sm font-medium">
                                                        {new Date(transaction.data + 'T00:00:00').toLocaleDateString(locale)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-foreground">{transaction.descricao || '-'}</span>
                                                            <span className="text-xs text-muted-foreground">ID: {transaction.id.slice(0, 8)}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
                                                            {transaction.categoria}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">{transaction.forma_pagamento || '-'}</TableCell>
                                                    <TableCell className="text-right font-semibold text-destructive">
                                                        {formatCurrency(transaction.valor)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex justify-center">
                                                            <Badge variant={transaction.status === 'pago' ? 'default' : 'secondary'}>
                                                                {transaction.status === 'pago' ? expT.table.paid : expT.table.unpaid}
                                                            </Badge>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreHorizontal className="w-4 h-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => handleEdit(transaction)}>
                                                                    <Pencil className="w-4 h-4 mr-2" />
                                                                    {expT.table.edit}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(transaction.id, transaction.descricao || '')}>
                                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                                    {expT.table.delete}
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>

                    <TransactionForm
                        open={isFormOpen}
                        onOpenChange={setIsFormOpen}
                        type="custo"
                        transaction={editingTransaction}
                        onSuccess={() => {
                            fetchTransactions()
                            setIsFormOpen(false)
                        }}
                    />
                </div>
            </main>
        </div>
    )
}

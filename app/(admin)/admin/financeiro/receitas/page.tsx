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
import { TrendingUp, DollarSign, Clock, Edit2, Plus, Search, Download, Filter, Loader2, MoreHorizontal, CheckCircle2, Trash2, Calendar as CalendarIcon } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
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

export default function ReceitasPage() {
    const { t, locale } = useAdminI18n()
    const common = t('common')
    const revT = t('finance_revenues')
    const supabase = createClient()

    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState('this_month')
    const [filtroStatus, setFiltroStatus] = useState('all')
    const [filtroCategoria, setFiltroCategoria] = useState('all')
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
    const [stats, setStats] = useState({
        totalPeriod: 0,
        totalPaid: 0,
        totalPending: 0,
        average: 0
    })

    const fetchTransactions = useCallback(async () => {
        setLoading(true)
        try {
            const { start, end } = getDateRange(period)

            let query = supabase
                .from('financeiro')
                .select('*')
                .eq('tipo', 'receita')
                .gte('data', start)
                .lte('data', end)
                .order('data', { ascending: false })

            if (filtroStatus !== 'all') {
                query = query.eq('status', filtroStatus)
            }
            if (filtroCategoria !== 'all') {
                query = query.eq('categoria', filtroCategoria)
            }

            const { data, error } = await query

            if (error) throw error

            if (data) {
                setTransactions(data)
                calculateStats(data)
            }
        } catch (error) {
            console.error(error)
            toast.error(revT.toast.loadError)
        } finally {
            setLoading(false)
        }
    }, [period, filtroStatus, filtroCategoria])

    useEffect(() => {
        fetchTransactions()
    }, [fetchTransactions])

    const calculateStats = (data: Transaction[]) => {
        const totalPeriod = data.reduce((acc, curr) => acc + curr.valor, 0)
        const totalPaid = data.filter(t => t.status === 'pago').reduce((acc, curr) => acc + curr.valor, 0)
        const totalPending = data.filter(t => t.status === 'pendente').reduce((acc, curr) => acc + curr.valor, 0)
        const average = data.length > 0 ? totalPeriod / data.length : 0

        setStats({ totalPeriod, totalPaid, totalPending, average })
    }

    const handleMarkAsPaid = async (id: string) => {
        try {
            const { error } = await supabase
                .from('financeiro')
                .update({ status: 'pago' })
                .eq('id', id)

            if (error) throw error
            toast.success(revT.toast.operationSuccess)
            fetchTransactions()
        } catch (error) {
            console.error(error)
            toast.error(revT.toast.operationError)
        }
    }

    const handleDelete = async (id: string, descricao: string) => {
        if (!confirm(revT.table.confirmDelete(descricao))) return
        try {
            const { error } = await supabase
                .from('financeiro')
                .delete()
                .eq('id', id)

            if (error) throw error
            toast.success(revT.toast.operationSuccess)
            fetchTransactions()
        } catch (error) {
            console.error(error)
            toast.error(revT.toast.operationError)
        }
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
        a.download = `${revT.export.filename}_${period}.csv`
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
                            <h1 className="font-heading text-2xl font-bold text-foreground">{revT.title}</h1>
                            <p className="text-sm text-muted-foreground">{revT.subtitle}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/admin/financeiro/categorias">
                                    <Filter className="w-4 h-4 mr-2" />
                                    {revT.settings}
                                </Link>
                            </Button>
                            <Button size="sm" onClick={() => {
                                setEditingTransaction(null)
                                setIsFormOpen(true)
                            }}>
                                <Plus className="w-4 h-4 mr-2" />
                                {revT.newRevenue}
                            </Button>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-muted-foreground">{revT.stats.totalPeriod}</p>
                                    <TrendingUp className="w-4 h-4 text-primary" />
                                </div>
                                <div className="mt-2">
                                    <h3 className="text-2xl font-bold">{formatCurrency(stats.totalPeriod)}</h3>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-muted-foreground">{revT.stats.totalReceived}</p>
                                    <DollarSign className="w-4 h-4 text-green-500" />
                                </div>
                                <div className="mt-2">
                                    <h3 className="text-2xl font-bold font-heading">{formatCurrency(stats.totalPaid)}</h3>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-muted-foreground">{revT.stats.totalPending}</p>
                                    <Clock className="w-4 h-4 text-yellow-500" />
                                </div>
                                <div className="mt-2">
                                    <h3 className="text-2xl font-bold">{formatCurrency(stats.totalPending)}</h3>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-muted-foreground">{revT.stats.averagePerRevenue}</p>
                                    <TrendingUp className="w-4 h-4 text-primary" />
                                </div>
                                <div className="mt-2">
                                    <h3 className="text-2xl font-bold">{formatCurrency(stats.average)}</h3>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-wrap gap-4">
                                <div className="flex-1 min-w-[150px]">
                                    <Select value={period} onValueChange={setPeriod}>
                                        <SelectTrigger>
                                            <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                                            <SelectValue placeholder={revT.filters.period} />
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
                                    <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                                        <SelectTrigger>
                                            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                                            <SelectValue placeholder={revT.filters.status} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{revT.filters.allStatuses}</SelectItem>
                                            <SelectItem value="pago">{revT.filters.received}</SelectItem>
                                            <SelectItem value="pendente">{revT.filters.pending}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex-1 min-w-[150px]">
                                    <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                                        <SelectTrigger>
                                            <Search className="w-4 h-4 mr-2 text-muted-foreground" />
                                            <SelectValue placeholder={revT.filters.category} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{revT.filters.allCategories}</SelectItem>
                                            {categories.map(cat => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button variant="outline" size="icon" onClick={handleExportCSV} title={revT.export.tooltip}>
                                    <Download className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Table */}
                    <div className="rounded-md border bg-white shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead>{revT.table.date}</TableHead>
                                    <TableHead>{revT.table.description}</TableHead>
                                    <TableHead>{revT.table.category}</TableHead>
                                    <TableHead>{revT.table.paymentMethod}</TableHead>
                                    <TableHead className="text-right">{revT.table.value}</TableHead>
                                    <TableHead className="text-center">{revT.table.status}</TableHead>
                                    <TableHead className="text-right">{revT.table.actions}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-48 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                                <span className="text-muted-foreground">{revT.table.loading}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : transactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                            {revT.table.empty}
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
                                                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                                    {transaction.categoria}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{transaction.forma_pagamento || '-'}</TableCell>
                                            <TableCell className="text-right font-semibold text-green-600">
                                                {formatCurrency(transaction.valor)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-center">
                                                    <Badge variant={transaction.status === 'pago' ? 'default' : 'secondary'}>
                                                        {transaction.status === 'pago' ? revT.table.paid : revT.table.unpaid}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-[160px]">
                                                        {transaction.status !== 'pago' && (
                                                            <DropdownMenuItem onClick={() => handleMarkAsPaid(transaction.id)}>
                                                                <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                                                                {revT.table.markAsPaid}
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem onClick={() => {
                                                            setEditingTransaction(transaction)
                                                            setIsFormOpen(true)
                                                        }}>
                                                            <Edit2 className="w-4 h-4 mr-2" />
                                                            {revT.table.edit}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(transaction.id, transaction.descricao)}>
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            {revT.table.delete}
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

                    <TransactionForm
                        open={isFormOpen}
                        onOpenChange={setIsFormOpen}
                        type="receita"
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

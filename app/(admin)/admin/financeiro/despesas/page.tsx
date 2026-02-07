'use client'

import { useState, useEffect } from 'react'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Plus,
    Tags,
    Search,
    Download,
    Filter,
    Loader2,
    Calendar as CalendarIcon,
    MoreHorizontal,
    Trash2,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent } from '@/components/ui/card'
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend
} from 'recharts'
import { TransitionForm } from '@/components/financeiro/transaction-form'
import { useAdminI18n } from '@/lib/admin-i18n/context'

interface Transaction {
    id: string
    tipo: 'receita' | 'custo'
    categoria: string
    descricao?: string
    valor: number
    data: string
    status: string
    forma_pagamento?: string
}

const COLORS = ['#C17B7B', '#C48B7F', '#C4A35A', '#A18B72', '#8E8E8E'];

export default function DespesasPage() {
    const { t } = useAdminI18n()
    const financeT = t('finance_transactions')
    const common = t('common')

    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState('this_month')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [stats, setStats] = useState({
        total: 0,
        topCategory: '',
        dailyAverage: 0
    })
    const [chartData, setChartData] = useState<any[]>([])

    const supabase = createClient()

    useEffect(() => {
        fetchTransactions()
    }, [period, categoryFilter])

    const fetchTransactions = async () => {
        setLoading(true)
        try {
            let query = supabase
                .from('financeiro')
                .select('*')
                .eq('tipo', 'custo')
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
            toast.error(common.error)
        } finally {
            setLoading(false)
        }
    }

    const processStats = (data: Transaction[]) => {
        const total = data.reduce((acc, curr) => acc + curr.valor, 0)

        // Group by category
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
            total,
            topCategory: sortedCategories[0]?.[0] || '-',
            dailyAverage: total / 30 // Rough estimate
        })
    }

    const handleDelete = async (id: string) => {
        if (!confirm(common.confirmDeleteDesc)) return

        try {
            const { error } = await supabase
                .from('financeiro')
                .delete()
                .eq('id', id)

            if (error) throw error
            toast.success(common.success)
            fetchTransactions()
        } catch (error) {
            console.error(error)
            toast.error(common.error)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-heading text-h2 text-foreground">{financeT.expenses.title}</h1>
                    <p className="text-body text-muted-foreground">
                        {financeT.expenses.subtitle}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" asChild className="hidden sm:flex">
                        <Link href="/admin/financeiro/categorias">
                            <Tags className="w-4 h-4 mr-2" />
                            {common.manageCategories || 'Categorias'}
                        </Link>
                    </Button>
                    <Button onClick={() => setIsFormOpen(true)} className="bg-destructive hover:bg-destructive/90">
                        <Plus className="w-4 h-4 mr-2" />
                        {financeT.expenses.newExpense}
                    </Button>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Stats & Chart */}
                <div className="lg:col-span-1 space-y-4">
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-caption text-muted-foreground">{financeT.stats.periodTotal}</p>
                            <p className="text-h3 font-semibold text-destructive">{formatCurrency(stats.total)}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-caption text-muted-foreground">{financeT.stats.topCategory}</p>
                            <p className="text-h4 font-medium text-foreground">{stats.topCategory}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-caption text-muted-foreground">{financeT.stats.dailyAverage}</p>
                            <p className="text-h4 font-medium text-foreground">{formatCurrency(stats.dailyAverage)}</p>
                        </CardContent>
                    </Card>

                    <Card className="h-[300px]">
                        <CardContent className="pt-6 h-full">
                            <p className="text-sm font-medium mb-4">{financeT.charts.byCategory}</p>
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
                                </div>
                                <div className="flex-1 min-w-[150px]">
                                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                        <SelectTrigger>
                                            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                                            <SelectValue placeholder={financeT.filters.allCategories} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{financeT.filters.allCategories}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button variant="outline" size="icon">
                                    <Download className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="rounded-md border bg-white shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[120px]">{common.date}</TableHead>
                                    <TableHead>{financeT.table.description}</TableHead>
                                    <TableHead>{financeT.table.category}</TableHead>
                                    <TableHead>{financeT.table.paymentMethod}</TableHead>
                                    <TableHead className="text-right">{common.value}</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="w-8 h-8 animate-spin" />
                                                <span>{common.loading}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : transactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                                            {common.noData}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    transactions.map((t) => (
                                        <TableRow key={t.id} className="hover:bg-muted/50 transition-colors">
                                            <TableCell className="text-sm font-medium">
                                                {new Date(t.data).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-foreground">{t.descricao || '-'}</span>
                                                    <span className="text-xs text-muted-foreground">ID: {t.id.slice(0, 8)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
                                                    {t.categoria}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{t.forma_pagamento || '-'}</TableCell>
                                            <TableCell className="text-right font-semibold text-destructive">
                                                {formatCurrency(t.valor)}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-[160px]">
                                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(t.id)}>
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            {common.delete}
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

            <TransitionForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                tipo="custo"
                onSuccess={() => {
                    fetchTransactions()
                    setIsFormOpen(false)
                }}
            />
        </div>
    )
}

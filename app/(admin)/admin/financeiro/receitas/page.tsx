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
    LayoutDashboard,
    Plus,
    Tags,
    Search,
    Download,
    Filter,
    Loader2,
    Calendar as CalendarIcon,
    MoreHorizontal,
    CheckCircle2,
    Trash2
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
    cliente_id?: string
}

export default function ReceitasPage() {
    const { t } = useAdminI18n()
    const financeT = t('finance_transactions')
    const common = t('common')

    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState('this_month')
    const [statusFilter, setStatusFilter] = useState('all')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        average: 0
    })

    const supabase = createClient()

    useEffect(() => {
        fetchTransactions()
    }, [period, statusFilter, categoryFilter])

    const fetchTransactions = async () => {
        setLoading(true)
        try {
            let query = supabase
                .from('financeiro')
                .select('*')
                .eq('tipo', 'receita')
                .order('data', { ascending: false })

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter)
            }
            if (categoryFilter !== 'all') {
                query = query.eq('categoria', categoryFilter)
            }

            const { data, error } = await query

            if (error) throw error

            if (data) {
                setTransactions(data)
                calculateStats(data)
            }
        } catch (error) {
            console.error(error)
            toast.error(common.error)
        } finally {
            setLoading(false)
        }
    }

    const calculateStats = (data: Transaction[]) => {
        const total = data
            .filter(t => t.status === 'pago')
            .reduce((acc, curr) => acc + curr.valor, 0)

        const pending = data
            .filter(t => t.status === 'pendente')
            .reduce((acc, curr) => acc + curr.valor, 0)

        const average = data.length > 0 ? total / data.length : 0

        setStats({ total, pending, average })
    }

    const handleMarkAsPaid = async (id: string) => {
        try {
            const { error } = await supabase
                .from('financeiro')
                .update({ status: 'pago' })
                .eq('id', id)

            if (error) throw error
            toast.success(common.success)
            fetchTransactions()
        } catch (error) {
            console.error(error)
            toast.error(common.error)
        }
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
                    <h1 className="font-heading text-h2 text-foreground">{financeT.revenues.title}</h1>
                    <p className="text-body text-muted-foreground">
                        {financeT.revenues.subtitle}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" asChild className="hidden sm:flex">
                        <Link href="/admin/financeiro/categorias">
                            <Tags className="w-4 h-4 mr-2" />
                            {common.manageCategories || 'Categorias'}
                        </Link>
                    </Button>
                    <Button onClick={() => setIsFormOpen(true)} className="bg-primary hover:bg-primary/90">
                        <Plus className="w-4 h-4 mr-2" />
                        {financeT.revenues.newRevenue}
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid sm:grid-cols-3 gap-4">
                <Card className="bg-success/5 border-success/20">
                    <CardContent className="pt-6">
                        <p className="text-caption text-muted-foreground">{financeT.stats.totalReceived}</p>
                        <p className="text-h3 font-semibold text-success">{formatCurrency(stats.total)}</p>
                    </CardContent>
                </Card>
                <Card className="bg-warning/5 border-warning/20">
                    <CardContent className="pt-6">
                        <p className="text-caption text-muted-foreground">{financeT.stats.toBeReceived}</p>
                        <p className="text-h3 font-semibold text-warning">{formatCurrency(stats.pending)}</p>
                    </CardContent>
                </Card>
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-6">
                        <p className="text-caption text-muted-foreground">{financeT.stats.averageTicket}</p>
                        <p className="text-h3 font-semibold text-primary">{formatCurrency(stats.average)}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
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
                        <div className="flex-1 min-w-[200px]">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                                    <SelectValue placeholder={financeT.filters.allStatus} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{financeT.filters.allStatus}</SelectItem>
                                    <SelectItem value="pago">{financeT.status.paid}</SelectItem>
                                    <SelectItem value="pendente">{financeT.status.pending}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger>
                                    <Search className="w-4 h-4 mr-2 text-muted-foreground" />
                                    <SelectValue placeholder={financeT.filters.allCategories} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{financeT.filters.allCategories}</SelectItem>
                                    {/* Categorias fixas ou dinâmicas aqui */}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button variant="outline" size="icon">
                            <Download className="w-4 h-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Transactions Table */}
            <div className="rounded-md border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[120px]">{common.date}</TableHead>
                            <TableHead>{financeT.table.description}</TableHead>
                            <TableHead>{financeT.table.category}</TableHead>
                            <TableHead>{common.clients || 'Cliente'}</TableHead>
                            <TableHead>{financeT.table.paymentMethod}</TableHead>
                            <TableHead className="text-right">{common.value}</TableHead>
                            <TableHead className="w-[100px] text-center">{common.status}</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-48 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="w-8 h-8 animate-spin" />
                                        <span>{common.loading}</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : transactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-48 text-center text-muted-foreground">
                                    {common.noResults}
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
                                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                            {t.categoria}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">-</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{t.forma_pagamento || '-'}</TableCell>
                                    <TableCell className="text-right font-semibold text-success">
                                        {formatCurrency(t.valor)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-center">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${t.status === 'pago'
                                                    ? 'bg-success/10 text-success border border-success/20'
                                                    : 'bg-warning/10 text-warning border border-warning/20'
                                                }`}>
                                                {t.status === 'pago' ? financeT.status.paid : financeT.status.pending}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-[160px]">
                                                {t.status !== 'pago' && (
                                                    <DropdownMenuItem onClick={() => handleMarkAsPaid(t.id)}>
                                                        <CheckCircle2 className="w-4 h-4 mr-2 text-success" />
                                                        {financeT.actions.markAsPaid}
                                                    </DropdownMenuItem>
                                                )}
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

            <TransitionForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                tipo="receita"
                onSuccess={() => {
                    fetchTransactions()
                    setIsFormOpen(false)
                }}
            />
        </div>
    )
}

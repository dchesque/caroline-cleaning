'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog'
import {
    ArrowLeft,
    Plus,
    Search,
    Loader2,
    DollarSign,
    TrendingDown,
    Filter,
    MoreHorizontal,
    Pencil,
    Trash2,
    PieChart as PieChartIcon,
    Tags
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { TransactionForm } from '@/components/financeiro/transaction-form'
import { ExpenseCategory } from '@/components/financeiro/expense-categories'
import { CATEGORIAS_DESPESA, FORMAS_PAGAMENTO } from '@/components/financeiro/constants'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    Legend
} from 'recharts'

const PERIOD_OPTIONS = [
    { value: 'this_month', label: 'Este Mês' },
    { value: 'last_month', label: 'Mês Anterior' },
    { value: 'last_3_months', label: 'Últimos 3 Meses' },
    { value: 'this_year', label: 'Este Ano' },
    { value: 'all', label: 'Todo o Período' },
]

const COLORS = ['#C48B7F', '#6B8E6B', '#C4A35A', '#C17B7B', '#7B9EB8', '#8E8E8E'];

export default function DespesasPage() {
    const [loading, setLoading] = useState(true)
    const [despesas, setDespesas] = useState<any[]>([])
    const [summary, setSummary] = useState({
        total: 0,
        topCategory: '-',
        dailyAverage: 0
    })
    const [categoryData, setCategoryData] = useState<any[]>([])
    const [dbCategories, setDbCategories] = useState<any[]>([])

    // Filters
    const [searchTerm, setSearchTerm] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [periodFilter, setPeriodFilter] = useState('this_month')

    // Modals
    const [isNewOpen, setIsNewOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<any | null>(null)
    const [deletingItem, setDeletingItem] = useState<any | null>(null)

    const supabase = createClient()

    const fetchDespesas = async () => {
        setLoading(true)
        try {
            let query = supabase
                .from('financeiro')
                .select('*')
                .eq('tipo', 'custo')
                .order('data', { ascending: false })

            // Apply Period Filter
            const now = new Date()
            let startDate
            let daysInPeriod = 30 // Approximate default

            if (periodFilter === 'this_month') {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1)
                daysInPeriod = now.getDate()
            } else if (periodFilter === 'last_month') {
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
                const endDate = new Date(now.getFullYear(), now.getMonth(), 0)
                query = query.lte('data', endDate.toISOString().split('T')[0])
                daysInPeriod = endDate.getDate()
            } else if (periodFilter === 'last_3_months') {
                startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
                daysInPeriod = 90
            } else if (periodFilter === 'this_year') {
                startDate = new Date(now.getFullYear(), 0, 1)
                const diff = now.getTime() - startDate.getTime()
                daysInPeriod = Math.ceil(diff / (1000 * 3600 * 24))
            }

            if (startDate && periodFilter !== 'all') {
                query = query.gte('data', startDate.toISOString().split('T')[0])
            }

            const { data, error } = await query

            if (error) throw error

            // Client-side filtering
            let filtered = data || []

            if (searchTerm) {
                const lowerSearch = searchTerm.toLowerCase()
                filtered = filtered.filter(item =>
                    item.descricao?.toLowerCase().includes(lowerSearch)
                )
            }

            if (categoryFilter !== 'all') {
                filtered = filtered.filter(item => item.categoria === categoryFilter)
            }

            setDespesas(filtered)

            // Calculate Summary
            const total = filtered.reduce((acc, r) => acc + r.valor, 0)

            // Category Breakdown
            const catMap = new Map<string, number>()
            filtered.forEach(d => {
                const current = catMap.get(d.categoria) || 0
                catMap.set(d.categoria, current + d.valor)
            })

            const chartData = Array.from(catMap.entries()).map(([name, value]) => ({
                name: CATEGORIAS_DESPESA.find(c => c.value === name)?.label || name,
                value
            })).sort((a, b) => b.value - a.value)

            setCategoryData(chartData)

            const topCat = chartData.length > 0 ? chartData[0].name : '-'
            const dailyAvg = periodFilter !== 'all' && daysInPeriod > 0 ? total / daysInPeriod : 0

            setSummary({
                total,
                topCategory: topCat,
                dailyAverage: dailyAvg
            })

        } catch (error) {
            console.error('Erro ao buscar despesas:', error)
            toast.error('Erro ao carregar despesas')
        } finally {
            setLoading(false)
        }
    }

    const fetchCategories = async () => {
        const { data } = await supabase
            .from('financeiro_categorias')
            .select('*')
            .eq('tipo', 'custo')
            .eq('ativo', true)
            .order('nome')
        if (data) setDbCategories(data)
    }

    useEffect(() => {
        fetchCategories()
    }, [])

    useEffect(() => {
        fetchDespesas()
    }, [periodFilter, searchTerm, categoryFilter])

    const handleDelete = async () => {
        if (!deletingItem) return

        try {
            const { error } = await supabase
                .from('financeiro')
                .delete()
                .eq('id', deletingItem.id)

            if (error) throw error

            toast.success('Despesa excluída com sucesso')
            setDeletingItem(null)
            fetchDespesas()
        } catch (error) {
            console.error(error)
            toast.error('Erro ao excluir despesa')
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/financeiro">
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="font-heading text-h2 text-foreground">Despesas</h1>
                        <p className="text-body text-muted-foreground">
                            Controle de custos e pagamentos
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/admin/financeiro/categorias">
                            <Tags className="w-4 h-4 mr-2" />
                            Gerenciar Categorias
                        </Link>
                    </Button>
                    <Button onClick={() => setIsNewOpen(true)} className="bg-destructive hover:bg-destructive/90 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Despesa
                    </Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Summary Cards */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="grid sm:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-caption text-muted-foreground">Total do Período</p>
                                        <p className="text-h3 font-semibold text-destructive">{formatCurrency(summary.total)}</p>
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
                                        <p className="text-caption text-muted-foreground">Maior Categoria</p>
                                        <p className="text-body font-semibold truncate max-w-[120px]" title={summary.topCategory}>{summary.topCategory}</p>
                                    </div>
                                    <div className="p-3 bg-warning/10 rounded-lg">
                                        <PieChartIcon className="w-6 h-6 text-warning" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-caption text-muted-foreground">Média Diária</p>
                                        <p className="text-h3 font-semibold">{formatCurrency(summary.dailyAverage)}</p>
                                    </div>
                                    <div className="p-3 bg-info/10 rounded-lg">
                                        <DollarSign className="w-6 h-6 text-info" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Table */}
                    <div className="rounded-md border bg-white">
                        <div className="p-4 border-b flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por descrição..."
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Período" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PERIOD_OPTIONS.map(opt => (
                                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Categoria" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas</SelectItem>
                                        {dbCategories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.nome}>{cat.nome}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Categoria</TableHead>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead>Valor</TableHead>
                                    <TableHead>Forma Pgto</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <div className="flex justify-center">
                                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : despesas.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                <DollarSign className="w-12 h-12 mb-4 opacity-20" />
                                                <p className="font-medium">Nenhuma despesa encontrada</p>
                                                <p className="text-sm">Tente ajustar os filtros ou adicione uma nova despesa.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    despesas.map((despesa) => (
                                        <TableRow key={despesa.id}>
                                            <TableCell>{formatDate(despesa.data)}</TableCell>
                                            <TableCell>
                                                <ExpenseCategory category={despesa.categoria} />
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate" title={despesa.descricao}>
                                                {despesa.descricao}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {formatCurrency(despesa.valor)}
                                            </TableCell>
                                            <TableCell>
                                                {FORMAS_PAGAMENTO.find(f => f.value === despesa.forma_pagamento)?.label || despesa.forma_pagamento || '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => setEditingItem(despesa)}>
                                                            <Pencil className="mr-2 h-4 w-4" /> Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => setDeletingItem(despesa)}
                                                            className="text-destructive focus:text-destructive"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
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

                {/* Pie Chart */}
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-h4">Por Categoria</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                {categoryData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={categoryData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {categoryData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip
                                                formatter={(value: any) => formatCurrency(value)}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                        Sem dados para exibir
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <TransactionForm
                type="custo"
                open={isNewOpen}
                onOpenChange={setIsNewOpen}
                onSuccess={fetchDespesas}
            />

            <TransactionForm
                type="custo"
                transaction={editingItem}
                open={!!editingItem}
                onOpenChange={(open) => !open && setEditingItem(null)}
                onSuccess={fetchDespesas}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar Exclusão</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeletingItem(null)}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Excluir
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

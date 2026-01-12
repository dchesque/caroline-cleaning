'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
    TrendingUp,
    CreditCard,
    Target,
    Pencil,
    Trash2,
    CheckCircle,
    Filter,
    MoreHorizontal,
    Tags
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { TransactionForm } from '@/components/financeiro/transaction-form'
import { CATEGORIAS_RECEITA, STATUS_CONFIG, FORMAS_PAGAMENTO } from '@/components/financeiro/constants'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Period Filter Options
const PERIOD_OPTIONS = [
    { value: 'this_month', label: 'Este Mês' },
    { value: 'last_month', label: 'Mês Anterior' },
    { value: 'last_3_months', label: 'Últimos 3 Meses' },
    { value: 'this_year', label: 'Este Ano' },
    { value: 'all', label: 'Todo o Período' },
]

export default function ReceitasPage() {
    const [loading, setLoading] = useState(true)
    const [receitas, setReceitas] = useState<any[]>([])
    const [summary, setSummary] = useState({
        totalReceived: 0,
        toBeReceived: 0,
        averageTicket: 0
    })
    const [dbCategories, setDbCategories] = useState<any[]>([])

    // Filters
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [periodFilter, setPeriodFilter] = useState('this_month')

    // Modals
    const [isNewOpen, setIsNewOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<any | null>(null)
    const [deletingItem, setDeletingItem] = useState<any | null>(null)

    const supabase = createClient()

    const fetchReceitas = async () => {
        setLoading(true)
        try {
            let query = supabase
                .from('financeiro')
                .select(`
          *,
          clientes (id, nome)
        `)
                .eq('tipo', 'receita')
                .order('data', { ascending: false })

            // Apply Period Filter
            const now = new Date()
            let startDate

            if (periodFilter === 'this_month') {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            } else if (periodFilter === 'last_month') {
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
                const endDate = new Date(now.getFullYear(), now.getMonth(), 0)
                query = query.lte('data', endDate.toISOString().split('T')[0])
            } else if (periodFilter === 'last_3_months') {
                startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
            } else if (periodFilter === 'this_year') {
                startDate = new Date(now.getFullYear(), 0, 1)
            }

            if (startDate && periodFilter !== 'all') {
                query = query.gte('data', startDate.toISOString().split('T')[0])
            }

            const { data, error } = await query

            if (error) throw error

            // Client-side filtering for Search, Status, Category (could be server-side but keeping it simple for now)
            let filtered = data || []

            if (searchTerm) {
                const lowerSearch = searchTerm.toLowerCase()
                filtered = filtered.filter(item =>
                    item.descricao?.toLowerCase().includes(lowerSearch) ||
                    item.clientes?.nome?.toLowerCase().includes(lowerSearch)
                )
            }

            if (statusFilter !== 'all') {
                filtered = filtered.filter(item => item.status === statusFilter)
            }

            if (categoryFilter !== 'all') {
                filtered = filtered.filter(item => item.categoria === categoryFilter)
            }

            setReceitas(filtered)

            // Calculate Summary Stats from FILTERED data? 
            // Usually summary is for the period, regardless of other filters, but let's stick to visible data for responsiveness
            // OR maybe summary should be "This Month" always?
            // Prompt says: "Total Recebido (este mês)", "A Receber (pendentes)", "Ticket Médio"
            // I'll calculate based on the "Period" selection at least.

            const received = filtered
                .filter(r => r.status === 'pago')
                .reduce((acc, r) => acc + r.valor, 0)

            const pending = filtered
                .filter(r => r.status === 'pendente')
                .reduce((acc, r) => acc + r.valor, 0)

            const count = filtered.length
            const avg = count > 0 ? (received + pending) / count : 0

            setSummary({
                totalReceived: received,
                toBeReceived: pending,
                averageTicket: avg
            })

        } catch (error) {
            console.error('Erro ao buscar receitas:', error)
            toast.error('Erro ao carregar receitas')
        } finally {
            setLoading(false)
        }
    }

    const fetchCategories = async () => {
        const { data } = await supabase
            .from('financeiro_categorias')
            .select('*')
            .eq('tipo', 'receita')
            .eq('ativo', true)
            .order('nome')
        if (data) setDbCategories(data)
    }

    useEffect(() => {
        fetchCategories()
    }, [])

    useEffect(() => {
        fetchReceitas()
    }, [periodFilter, searchTerm, statusFilter, categoryFilter])

    const handleDelete = async () => {
        if (!deletingItem) return

        try {
            const { error } = await supabase
                .from('financeiro')
                .delete()
                .eq('id', deletingItem.id)

            if (error) throw error

            toast.success('Receita excluída com sucesso')
            setDeletingItem(null)
            fetchReceitas()
        } catch (error) {
            console.error(error)
            toast.error('Erro ao excluir receita')
        }
    }

    const handleMarkAsPaid = async (item: any) => {
        try {
            const { error } = await supabase
                .from('financeiro')
                .update({
                    status: 'pago',
                    data_pagamento: new Date().toISOString().split('T')[0]
                })
                .eq('id', item.id)

            if (error) throw error

            toast.success('Marcado como pago')
            fetchReceitas()
        } catch (error) {
            console.error(error)
            toast.error('Erro ao atualizar status')
        }
    }

    const getStatusBadge = (status: string) => {
        const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pendente
        return (
            <Badge variant="outline" className={`${config.className} border-0`}>
                {config.label}
            </Badge>
        )
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
                        <h1 className="font-heading text-h2 text-foreground">Receitas</h1>
                        <p className="text-body text-muted-foreground">
                            Gerenciamento de todas as entradas
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
                    <Button onClick={() => setIsNewOpen(true)} className="bg-primary hover:bg-primary/90">
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Receita
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-caption text-muted-foreground">Total Recebido</p>
                                <p className="text-h3 font-semibold text-success">{formatCurrency(summary.totalReceived)}</p>
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
                                <p className="text-caption text-muted-foreground">A Receber</p>
                                <p className="text-h3 font-semibold text-warning">{formatCurrency(summary.toBeReceived)}</p>
                            </div>
                            <div className="p-3 bg-warning/10 rounded-lg">
                                <CreditCard className="w-6 h-6 text-warning" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-caption text-muted-foreground">Ticket Médio</p>
                                <p className="text-h3 font-semibold">{formatCurrency(summary.averageTicket)}</p>
                            </div>
                            <div className="p-3 bg-primary/10 rounded-lg">
                                <Target className="w-6 h-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por descrição ou cliente..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
                    <Select value={periodFilter} onValueChange={setPeriodFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Período" />
                        </SelectTrigger>
                        <SelectContent>
                            {PERIOD_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos Status</SelectItem>
                            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                <SelectItem key={key} value={key}>{config.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Categoria" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas Cat.</SelectItem>
                            {dbCategories.map(cat => (
                                <SelectItem key={cat.id} value={cat.nome}>{cat.nome}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Forma Pgto</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    <div className="flex justify-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : receitas.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        <DollarSign className="w-12 h-12 mb-4 opacity-20" />
                                        <p className="font-medium">Nenhuma receita encontrada</p>
                                        <p className="text-sm">Tente ajustar os filtros ou adicione uma nova receita.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            receitas.map((receita) => (
                                <TableRow key={receita.id}>
                                    <TableCell>{formatDate(receita.data)}</TableCell>
                                    <TableCell>{receita.clientes?.nome || '-'}</TableCell>
                                    <TableCell>
                                        {CATEGORIAS_RECEITA.find(c => c.value === receita.categoria)?.label || receita.categoria}
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate" title={receita.descricao}>
                                        {receita.descricao}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {formatCurrency(receita.valor)}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(receita.status)}</TableCell>
                                    <TableCell>
                                        {FORMAS_PAGAMENTO.find(f => f.value === receita.forma_pagamento)?.label || receita.forma_pagamento || '-'}
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
                                                <DropdownMenuItem onClick={() => setEditingItem(receita)}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Editar
                                                </DropdownMenuItem>
                                                {receita.status !== 'pago' && (
                                                    <DropdownMenuItem onClick={() => handleMarkAsPaid(receita)}>
                                                        <CheckCircle className="mr-2 h-4 w-4" /> Marcar como Pago
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => setDeletingItem(receita)}
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

            <TransactionForm
                type="receita"
                open={isNewOpen}
                onOpenChange={setIsNewOpen}
                onSuccess={fetchReceitas}
            />

            <TransactionForm
                type="receita"
                transaction={editingItem}
                open={!!editingItem}
                onOpenChange={(open) => !open && setEditingItem(null)}
                onSuccess={fetchReceitas}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar Exclusão</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja excluir esta receita? Esta ação não pode ser desfeita.
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

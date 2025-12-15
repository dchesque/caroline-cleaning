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
    DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
    ArrowLeft,
    Plus,
    Search,
    CalendarIcon,
    Loader2,
    CheckCircle,
    Clock
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'

const STATUS_PAGAMENTO = {
    pendente: { label: 'Pendente', variant: 'warning' },
    pago: { label: 'Pago', variant: 'success' },
    cancelado: { label: 'Cancelado', variant: 'destructive' },
}

const CATEGORIAS_RECEITA = [
    { value: 'servico', label: 'Serviço de Limpeza' },
    { value: 'extra', label: 'Serviço Extra' },
    { value: 'gorjeta', label: 'Gorjeta' },
    { value: 'outro', label: 'Outro' },
]

export default function ReceitasPage() {
    const [transactions, setTransactions] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    // Form state
    const [formData, setFormData] = useState({
        cliente_id: '',
        agendamento_id: '',
        categoria: 'servico',
        descricao: '',
        valor: '',
        data: new Date(),
        status: 'pago',
        forma_pagamento: 'pix',
    })

    // Client search
    const [clientSearch, setClientSearch] = useState('')
    const [clients, setClients] = useState<any[]>([])
    const [selectedClient, setSelectedClient] = useState<any>(null)

    const supabase = createClient()

    // Fetch transactions
    useEffect(() => {
        const fetchTransactions = async () => {
            setIsLoading(true)

            let query = supabase
                .from('financeiro')
                .select(`
          *,
          clientes (id, nome, telefone)
        `)
                .eq('tipo', 'receita')
                .order('data', { ascending: false })

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter)
            }

            const { data } = await query
            setTransactions(data || [])
            setIsLoading(false)
        }

        fetchTransactions()
    }, [statusFilter])

    // Search clients
    useEffect(() => {
        const searchClients = async () => {
            if (clientSearch.length < 2) {
                setClients([])
                return
            }

            const { data } = await supabase
                .from('clientes')
                .select('id, nome, telefone')
                .or(`nome.ilike.%${clientSearch}%,telefone.ilike.%${clientSearch}%`)
                .limit(5)

            setClients(data || [])
        }

        const debounce = setTimeout(searchClients, 300)
        return () => clearTimeout(debounce)
    }, [clientSearch])

    const handleSave = async () => {
        if (!formData.valor) {
            toast.error('Informe o valor')
            return
        }

        setIsSaving(true)

        try {
            const transactionData = {
                tipo: 'receita',
                cliente_id: selectedClient?.id || null,
                agendamento_id: formData.agendamento_id || null,
                categoria: formData.categoria,
                descricao: formData.descricao || null,
                valor: parseFloat(formData.valor),
                data: format(formData.data, 'yyyy-MM-dd'),
                status: formData.status,
                forma_pagamento: formData.forma_pagamento,
            }

            const { error } = await supabase.from('financeiro').insert(transactionData)

            if (error) throw error

            toast.success('Receita registrada!')
            setIsModalOpen(false)

            // Reset form
            setFormData({
                cliente_id: '',
                agendamento_id: '',
                categoria: 'servico',
                descricao: '',
                valor: '',
                data: new Date(),
                status: 'pago',
                forma_pagamento: 'pix',
            })
            setSelectedClient(null)

            // Refresh list
            const { data } = await supabase
                .from('financeiro')
                .select(`*, clientes (id, nome, telefone)`)
                .eq('tipo', 'receita')
                .order('data', { ascending: false })
            setTransactions(data || [])

        } catch (error) {
            console.error('Error saving:', error)
            toast.error('Erro ao salvar receita')
        } finally {
            setIsSaving(false)
        }
    }

    // Filter by search
    const filteredTransactions = transactions.filter(t => {
        if (!search) return true
        const searchLower = search.toLowerCase()
        return (
            t.clientes?.nome?.toLowerCase().includes(searchLower) ||
            t.descricao?.toLowerCase().includes(searchLower) ||
            t.categoria?.toLowerCase().includes(searchLower)
        )
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/financeiro">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="font-heading text-h2 text-foreground">Receitas</h1>
                        <p className="text-body text-muted-foreground">
                            Gerencie as entradas financeiras
                        </p>
                    </div>
                </div>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" />
                            Nova Receita
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Nova Receita</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            {/* Client Selection */}
                            <div className="space-y-2">
                                <Label>Cliente (opcional)</Label>
                                {selectedClient ? (
                                    <div className="flex items-center justify-between p-3 bg-desert-storm rounded-lg">
                                        <div>
                                            <p className="font-medium">{selectedClient.nome}</p>
                                            <p className="text-caption text-muted-foreground">{selectedClient.telefone}</p>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => setSelectedClient(null)}>
                                            Alterar
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar cliente..."
                                            value={clientSearch}
                                            onChange={(e) => setClientSearch(e.target.value)}
                                            className="pl-9"
                                        />
                                        {clients.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-pampas rounded-lg shadow-lg z-10">
                                                {clients.map((client) => (
                                                    <button
                                                        key={client.id}
                                                        className="w-full px-3 py-2 text-left hover:bg-desert-storm"
                                                        onClick={() => {
                                                            setSelectedClient(client)
                                                            setClientSearch('')
                                                            setClients([])
                                                        }}
                                                    >
                                                        <p className="font-medium">{client.nome}</p>
                                                        <p className="text-caption text-muted-foreground">{client.telefone}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Category */}
                            <div className="space-y-2">
                                <Label>Categoria</Label>
                                <Select
                                    value={formData.categoria}
                                    onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIAS_RECEITA.map((cat) => (
                                            <SelectItem key={cat.value} value={cat.value}>
                                                {cat.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Value and Date */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Valor ($)</Label>
                                    <Input
                                        type="number"
                                        placeholder="150.00"
                                        value={formData.valor}
                                        onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Data</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start">
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {format(formData.data, 'dd/MM/yyyy')}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={formData.data}
                                                onSelect={(date) => date && setFormData({ ...formData, data: date })}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            {/* Status and Payment Method */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pago">Pago</SelectItem>
                                            <SelectItem value="pendente">Pendente</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Forma de Pagamento</Label>
                                    <Select
                                        value={formData.forma_pagamento}
                                        onValueChange={(value) => setFormData({ ...formData, forma_pagamento: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pix">PIX</SelectItem>
                                            <SelectItem value="cash">Dinheiro</SelectItem>
                                            <SelectItem value="card">Cartão</SelectItem>
                                            <SelectItem value="zelle">Zelle</SelectItem>
                                            <SelectItem value="venmo">Venmo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label>Descrição (opcional)</Label>
                                <Input
                                    placeholder="Descrição do pagamento"
                                    value={formData.descricao}
                                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button onClick={handleSave} disabled={isSaving}>
                                    {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Salvar
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Categoria</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTransactions.map((transaction) => (
                                <TableRow key={transaction.id}>
                                    <TableCell>{formatDate(transaction.data)}</TableCell>
                                    <TableCell>
                                        {transaction.clientes?.nome || '-'}
                                    </TableCell>
                                    <TableCell>
                                        {CATEGORIAS_RECEITA.find(c => c.value === transaction.categoria)?.label || transaction.categoria}
                                    </TableCell>
                                    <TableCell className="font-semibold text-success">
                                        +{formatCurrency(transaction.valor)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={STATUS_PAGAMENTO[transaction.status as keyof typeof STATUS_PAGAMENTO]?.variant as any}>
                                            {STATUS_PAGAMENTO[transaction.status as keyof typeof STATUS_PAGAMENTO]?.label}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

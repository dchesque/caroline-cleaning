'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import {
    DollarSign,
    TrendingUp,
    Clock,
    CheckCircle,
    MoreHorizontal,
    Receipt,
    AlertCircle,
    XCircle,
    Undo,
    Trash2,
    Edit
} from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { toast } from 'sonner'
import { TransactionForm } from '@/components/financeiro/transaction-form'

const STATUS_COLORS: Record<string, string> = {
    pendente: 'bg-yellow-100 text-yellow-700',
    pago: 'bg-green-100 text-green-700',
    cancelado: 'bg-red-100 text-red-700',
    reembolsado: 'bg-purple-100 text-purple-700',
}

interface TabFinanceiroProps {
    clientId: string
}

export function TabFinanceiro({ clientId }: TabFinanceiroProps) {
    const [transactions, setTransactions] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [editingTransaction, setEditingTransaction] = useState<any>(null)
    const [showEditModal, setShowEditModal] = useState(false)
    const supabase = createClient()

    const now = new Date()
    const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
    const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd')

    // Métricas
    const paidTransactions = transactions.filter(t => t.status === 'pago')
    const pendingTransactions = transactions.filter(t => t.status === 'pendente')

    const totalPaid = paidTransactions.reduce((acc, t) => acc + Number(t.valor), 0)
    const totalPending = pendingTransactions.reduce((acc, t) => acc + Number(t.valor), 0)

    const monthTransactions = transactions.filter(t => t.data >= monthStart && t.data <= monthEnd)
    const monthPaid = monthTransactions.filter(t => t.status === 'pago').reduce((acc, t) => acc + Number(t.valor), 0)
    const monthPending = monthTransactions.filter(t => t.status === 'pendente').reduce((acc, t) => acc + Number(t.valor), 0)

    const lastPayment = paidTransactions[0]

    const fetchTransactions = async () => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('financeiro')
            .select('*')
            .eq('cliente_id', clientId)
            .order('data', { ascending: false })

        if (!error && data) {
            setTransactions(data)
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchTransactions()
    }, [clientId])

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        const updates: any = { status: newStatus }

        // Se for pago, define a data de pagamento
        if (newStatus === 'pago') {
            updates.data_pagamento = format(new Date(), 'yyyy-MM-dd')
        }
        // Se for revertido de pago para outra coisa, limpa a data
        else {
            updates.data_pagamento = null
        }

        const { error } = await supabase
            .from('financeiro')
            .update(updates)
            .eq('id', id)

        if (!error) {
            toast.success(`Fatura atualizada para ${newStatus}!`)
            fetchTransactions()
        } else {
            toast.error('Erro ao atualizar status')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta fatura permanentemente?')) return

        const { error } = await supabase
            .from('financeiro')
            .delete()
            .eq('id', id)

        if (!error) {
            toast.success('Fatura excluída!')
            fetchTransactions()
        } else {
            toast.error('Erro ao excluir fatura')
        }
    }

    const handleEdit = (transaction: any) => {
        setEditingTransaction(transaction)
        setShowEditModal(true)
    }

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-24" />
                    ))}
                </div>
                <Skeleton className="h-64" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Cards de Métricas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-green-50 border-green-100">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <span className="text-xs text-green-700">Total Recebido</span>
                        </div>
                        <p className="text-2xl font-bold text-green-700">${totalPaid.toFixed(2)}</p>
                        <p className="text-xs text-green-600">
                            ${monthPaid.toFixed(2)} este mês
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-yellow-50 border-yellow-100">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-yellow-600" />
                            <span className="text-xs text-yellow-700">Pendente</span>
                        </div>
                        <p className="text-2xl font-bold text-yellow-700">${totalPending.toFixed(2)}</p>
                        <p className="text-xs text-yellow-600">
                            {pendingTransactions.length} fatura(s)
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Receipt className="w-4 h-4 text-blue-500" />
                            <span className="text-xs text-muted-foreground">Total Faturas</span>
                        </div>
                        <p className="text-2xl font-bold">{transactions.length}</p>
                        <p className="text-xs text-muted-foreground">
                            {monthTransactions.length} este mês
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-[#C48B7F]" />
                            <span className="text-xs text-muted-foreground">Último Pagamento</span>
                        </div>
                        <p className="text-2xl font-bold text-[#C48B7F]">
                            {lastPayment ? `$${Number(lastPayment.valor).toFixed(0)}` : '-'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {lastPayment ? format(new Date(lastPayment.data), 'dd/MM/yyyy') : '-'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Faturas Pendentes */}
            {pendingTransactions.length > 0 && (
                <Card className="border-yellow-200">
                    <CardHeader className="bg-yellow-50">
                        <CardTitle className="text-base flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-yellow-600" />
                            Faturas Pendentes
                        </CardTitle>
                        <CardDescription>
                            {pendingTransactions.length} fatura(s) aguardando pagamento
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead>Valor</TableHead>
                                    <TableHead className="w-[100px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingTransactions.map((t) => (
                                    <TableRow key={t.id}>
                                        <TableCell>{format(new Date(t.data), 'dd/MM/yyyy')}</TableCell>
                                        <TableCell>{t.descricao || t.categoria || 'Serviço'}</TableCell>
                                        <TableCell className="font-bold">${Number(t.valor).toFixed(2)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleUpdateStatus(t.id, 'pago')}
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                    Marcar como Pago
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEdit(t)}>
                                                            <Edit className="w-4 h-4 mr-2" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => handleUpdateStatus(t.id, 'cancelado')}
                                                            className="text-red-600"
                                                        >
                                                            <XCircle className="w-4 h-4 mr-2" />
                                                            Cancelar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Histórico Completo */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Histórico de Transações</CardTitle>
                    <CardDescription>Todas as transações deste cliente</CardDescription>
                </CardHeader>
                <CardContent>
                    {transactions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>Nenhuma transação encontrada</p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Descrição</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.map((t) => (
                                        <TableRow key={t.id}>
                                            <TableCell>{format(new Date(t.data), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell>{t.descricao || t.categoria || '-'}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {t.tipo}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                ${Number(t.valor).toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={STATUS_COLORS[t.status]}>
                                                    {t.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => handleEdit(t)}>
                                                            <Edit className="w-4 h-4 mr-2" />
                                                            Editar
                                                        </DropdownMenuItem>

                                                        {t.status === 'pendente' && (
                                                            <>
                                                                <DropdownMenuItem onClick={() => handleUpdateStatus(t.id, 'pago')}>
                                                                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                                                    Marcar como Pago
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => handleUpdateStatus(t.id, 'cancelado')}
                                                                    className="text-red-600"
                                                                >
                                                                    <XCircle className="w-4 h-4 mr-2" />
                                                                    Cancelar
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}

                                                        {(t.status === 'pago' || t.status === 'cancelado') && (
                                                            <DropdownMenuItem onClick={() => handleUpdateStatus(t.id, 'pendente')}>
                                                                <Undo className="w-4 h-4 mr-2" />
                                                                Reverter para Pendente
                                                            </DropdownMenuItem>
                                                        )}

                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(t.id)}
                                                            className="text-red-900"
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Excluir
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Transaction Modal */}
            {editingTransaction && (
                <TransactionForm
                    open={showEditModal}
                    onOpenChange={setShowEditModal}
                    type={editingTransaction.tipo || 'receita'}
                    transaction={editingTransaction}
                    onSuccess={fetchTransactions}
                />
            )}
        </div>
    )
}

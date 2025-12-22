import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DollarSign, TrendingUp, Clock, Plus } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_COLORS: Record<string, string> = {
    pendente: 'bg-yellow-100 text-yellow-700',
    pago: 'bg-green-100 text-green-700',
    cancelado: 'bg-red-100 text-red-700',
    reembolsado: 'bg-purple-100 text-purple-700',
}

export async function TabFinanceiro({ clientId }: { clientId: string }) {
    const supabase = await createClient()

    // Buscar transações do cliente
    const { data: transactions, error } = await supabase
        .from('financeiro')
        .select('*')
        .eq('cliente_id', clientId)
        .eq('tipo', 'receita')
        .order('data', { ascending: false })

    if (error) {
        console.error('Error fetching transactions:', error)
    }

    // Calcular estatísticas
    const paidTransactions = transactions?.filter(t => t.status === 'pago') || []
    const pendingTransactions = transactions?.filter(t => t.status === 'pendente') || []

    const totalPaid = paidTransactions.reduce((acc, t) => acc + Number(t.valor), 0)
    const totalPending = pendingTransactions.reduce((acc, t) => acc + Number(t.valor), 0)
    const lastPayment = paidTransactions[0]

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="bg-[#FDF8F6] border-[#C48B7F]/20">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-[#C48B7F]" />
                            <p className="text-xs text-muted-foreground">Total Recebido</p>
                        </div>
                        <p className="text-xl font-bold text-[#C48B7F]">${totalPaid.toFixed(2)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-yellow-600" />
                            <p className="text-xs text-muted-foreground">Pendente</p>
                        </div>
                        <p className="text-xl font-bold text-yellow-600">${totalPending.toFixed(2)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <p className="text-xs text-muted-foreground">Último Pagamento</p>
                        </div>
                        <p className="text-xl font-bold text-green-600">
                            {lastPayment ? `$${Number(lastPayment.valor).toFixed(2)}` : '-'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Transações */}
            <Card className="border-[#EAE0D5]">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Histórico de Transações</CardTitle>
                    <Link href={`/admin/financeiro/receitas?cliente=${clientId}`}>
                        <Button size="sm" variant="outline">
                            <Plus className="h-4 w-4 mr-1" />
                            Nova Receita
                        </Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    {!transactions?.length ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Nenhuma transação encontrada
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead>Valor</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((t) => (
                                    <TableRow key={t.id}>
                                        <TableCell className="text-sm">
                                            {format(new Date(t.data), 'dd/MM/yyyy')}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {t.descricao || t.categoria || 'Serviço'}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            ${Number(t.valor).toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={STATUS_COLORS[t.status] || 'bg-gray-100'}>
                                                {t.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

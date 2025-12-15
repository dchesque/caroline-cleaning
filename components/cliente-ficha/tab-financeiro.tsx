import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export async function TabFinanceiro({ clientId }: { clientId: string }) {
    const supabase = await createClient()
    const { data: transactions } = await supabase
        .from('financeiro') // Ensure this table exists or use a mock
        .select('*')
        .eq('cliente_id', clientId)
        .order('data_pagamento', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
                <Card className="bg-[#FDF8F6] border-[#C48B7F]/20">
                    <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">Total Gasto</p>
                        <p className="text-xl font-bold text-[#C48B7F]">$0.00</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">Pendentes</p>
                        <p className="text-xl font-bold text-yellow-600">$0.00</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">Último Pagamento</p>
                        <p className="text-xl font-bold">-</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-[#EAE0D5]">
                <CardHeader>
                    <CardTitle className="text-base">Histórico de Transações</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Serviço</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {!transactions?.length ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                                        Nenhuma transação encontrada.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((t) => (
                                    <TableRow key={t.id}>
                                        <TableCell>{new Date(t.data_pagamento).toLocaleDateString()}</TableCell>
                                        <TableCell>{t.descricao}</TableCell>
                                        <TableCell>${t.valor}</TableCell>
                                        <TableCell><Badge variant="outline">{t.status}</Badge></TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

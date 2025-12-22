import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Download, Plus, Calendar, DollarSign, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_COLORS: Record<string, string> = {
    pendente: 'bg-yellow-100 text-yellow-700',
    enviado: 'bg-blue-100 text-blue-700',
    assinado: 'bg-green-100 text-green-700',
    cancelado: 'bg-red-100 text-red-700',
    expirado: 'bg-gray-100 text-gray-700',
}

const FREQUENCIA_LABELS: Record<string, string> = {
    weekly: 'Semanal',
    biweekly: 'Quinzenal',
    monthly: 'Mensal',
    one_time: 'Avulso',
}

export async function TabContrato({ client }: { client: any }) {
    const supabase = await createClient()

    // Buscar contratos do cliente
    const { data: contracts, error } = await supabase
        .from('contratos')
        .select('*')
        .eq('cliente_id', client.id)
        .order('created_at', { ascending: false })

    // Buscar recorrência ativa
    const { data: recurrence } = await supabase
        .from('recorrencias')
        .select('*')
        .eq('cliente_id', client.id)
        .eq('ativo', true)
        .single()

    const activeContract = contracts?.find(c => c.status === 'assinado')

    return (
        <div className="space-y-6">
            {/* Contrato Ativo */}
            {activeContract ? (
                <Card className="border-green-200 bg-green-50/50">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <FileText className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">Contrato Ativo</CardTitle>
                                    <CardDescription>#{activeContract.numero}</CardDescription>
                                </div>
                            </div>
                            <Badge className="bg-green-100 text-green-700">Assinado</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div>
                                <p className="text-xs text-muted-foreground">Tipo de Serviço</p>
                                <p className="font-medium capitalize">{activeContract.tipo_servico?.replace('_', ' ')}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Frequência</p>
                                <p className="font-medium">{FREQUENCIA_LABELS[activeContract.frequencia] || activeContract.frequencia}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Valor</p>
                                <p className="font-medium">${Number(activeContract.valor_acordado).toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Data Início</p>
                                <p className="font-medium">{format(new Date(activeContract.data_inicio), 'dd/MM/yyyy')}</p>
                            </div>
                        </div>

                        {activeContract.documento_url && (
                            <Button variant="outline" size="sm" asChild>
                                <a href={activeContract.documento_url} target="_blank" rel="noopener">
                                    <Download className="h-4 w-4 mr-2" />
                                    Download PDF
                                </a>
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-dashed">
                    <CardContent className="py-8 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">Nenhum contrato ativo</p>
                        <Link href={`/admin/contratos/novo?cliente=${client.id}`}>
                            <Button className="bg-[#C48B7F] hover:bg-[#A66D60]">
                                <Plus className="h-4 w-4 mr-2" />
                                Criar Contrato
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}

            {/* Recorrência */}
            {recurrence && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <RefreshCw className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Recorrência Ativa</CardTitle>
                                <CardDescription>Configuração de serviço recorrente</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div>
                                <p className="text-xs text-muted-foreground">Frequência</p>
                                <p className="font-medium">{FREQUENCIA_LABELS[recurrence.frequencia]}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Dia Preferido</p>
                                <p className="font-medium capitalize">{recurrence.dia_preferido}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Horário</p>
                                <p className="font-medium">{recurrence.horario?.slice(0, 5)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Valor</p>
                                <p className="font-medium">${Number(recurrence.valor).toFixed(2)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Histórico de Contratos */}
            {contracts && contracts.length > 0 && (
                <Card className="border-[#EAE0D5]">
                    <CardHeader>
                        <CardTitle className="text-base">Histórico de Contratos</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-[#EAE0D5]">
                            {contracts.map((contract) => (
                                <div key={contract.id} className="p-4 flex items-center justify-between hover:bg-[#FDF8F6]">
                                    <div>
                                        <p className="font-medium text-sm">
                                            {contract.numero || 'Sem número'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {format(new Date(contract.created_at), 'dd/MM/yyyy')} • ${Number(contract.valor_acordado).toFixed(2)}
                                        </p>
                                    </div>
                                    <Badge className={STATUS_COLORS[contract.status] || 'bg-gray-100'}>
                                        {contract.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

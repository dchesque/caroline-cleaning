import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    ArrowLeft,
    Download,
    Edit,
    CheckCircle,
    Clock,
    User,
    Calendar,
    DollarSign,
    FileText,
    Send
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { SERVICE_TYPES, FREQUENCIES, WEEKDAYS } from '@/lib/constants'
import { SendContractButton } from './SendContractButton'

const STATUS_CONTRACT = {
    rascunho: { label: 'Rascunho', variant: 'secondary' },
    enviado: { label: 'Aguardando Assinatura', variant: 'warning' },
    assinado: { label: 'Assinado', variant: 'success' },
    cancelado: { label: 'Cancelado', variant: 'destructive' },
}

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function ContratoDetalhePage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()

    const { data: contract, error } = await supabase
        .from('contratos')
        .select(`
      *,
      clientes (
        id,
        nome,
        telefone,
        email,
        endereco_completo,
        cidade,
        estado,
        zip_code
      ),
      recorrencias (*)
    `)
        .eq('id', id)
        .single()

    if (error || !contract) notFound()

    const statusConfig = STATUS_CONTRACT[contract.status as keyof typeof STATUS_CONTRACT]
    const getLabel = (array: any[], value: string) => array.find(i => i.value === value)?.label || value

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/contratos">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="font-heading text-h2 text-foreground">
                                Contrato #{contract.numero}
                            </h1>
                            <Badge variant={statusConfig?.variant as any || 'secondary'}>
                                {statusConfig?.label || contract.status}
                            </Badge>
                        </div>
                        <p className="text-body text-muted-foreground">
                            Criado em {formatDate(contract.created_at)}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {contract.status === 'rascunho' && (
                        <>
                            <Button variant="outline" className="gap-2">
                                <Edit className="w-4 h-4" />
                                Editar
                            </Button>
                            <SendContractButton contractId={contract.id} />
                        </>
                    )}
                    
                    {/* Button for iPad or local signature check */}
                    {(contract.status === 'enviado' || contract.status === 'rascunho' || contract.status === 'pendente') && (
                        <Button className="gap-2 bg-brandy-rose-600 hover:bg-brandy-rose-700 text-white" asChild>
                            <Link href={`/contrato/${contract.id}/assinar`}>
                                <Edit className="w-4 h-4" />
                                Assinar neste dispositivo
                            </Link>
                        </Button>
                    )}

                    {contract.status === 'enviado' && (
                        <Button variant="outline" className="gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Marcar como Assinado
                        </Button>
                    )}
                    {contract.documento_url && (
                        <Button variant="outline" className="gap-2">
                            <Download className="w-4 h-4" />
                            Baixar PDF
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Client Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-h4">
                                <User className="w-5 h-5 text-muted-foreground" />
                                Cliente
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Link
                                        href={`/admin/clientes/${contract.cliente_id}`}
                                        className="text-body font-semibold hover:text-brandy-rose-600"
                                    >
                                        {contract.clientes?.nome}
                                    </Link>
                                    <p className="text-body-sm text-muted-foreground">{contract.clientes?.telefone}</p>
                                    <p className="text-body-sm text-muted-foreground">{contract.clientes?.email}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-body-sm">{contract.clientes?.endereco_completo}</p>
                                    <p className="text-caption text-muted-foreground">
                                        {contract.clientes?.cidade}, {contract.clientes?.estado} {contract.clientes?.zip_code}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Service Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-h4">
                                <FileText className="w-5 h-5 text-muted-foreground" />
                                Detalhes do Serviço
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid sm:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-caption text-muted-foreground">Tipo de Serviço</p>
                                    <p className="text-body font-medium">{getLabel(SERVICE_TYPES, contract.tipo_servico)}</p>
                                </div>
                                <div>
                                    <p className="text-caption text-muted-foreground">Frequência</p>
                                    <p className="text-body font-medium">{getLabel(FREQUENCIES, contract.frequencia)}</p>
                                </div>
                                <div>
                                    <p className="text-caption text-muted-foreground">Dia Preferido</p>
                                    <p className="text-body font-medium">{getLabel(WEEKDAYS, contract.dia_preferido)}</p>
                                </div>
                                <div>
                                    <p className="text-caption text-muted-foreground">Horário</p>
                                    <p className="text-body font-medium">{contract.horario_preferido}</p>
                                </div>
                                <div>
                                    <p className="text-caption text-muted-foreground">Duração Estimada</p>
                                    <p className="text-body font-medium">{contract.duracao_estimada_minutos} minutos</p>
                                </div>
                            </div>
                            {contract.observacoes && (
                                <div className="mt-6 pt-6 border-t border-pampas">
                                    <p className="text-caption text-muted-foreground mb-2">Observações</p>
                                    <p className="text-body">{contract.observacoes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Contract Document */}
                    {contract.documento_corpo && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-h4">
                                    <FileText className="w-5 h-5 text-muted-foreground" />
                                    Termos do Contrato
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-pampas/50 p-4 rounded-md text-sm font-mono whitespace-pre-wrap">
                                    {contract.documento_corpo}
                                </div>
                                {contract.assinatura_cliente && (
                                    <div className="mt-6 border-t pt-6">
                                        <p className="text-body font-semibold mb-4">Assinatura Digital do Cliente</p>
                                        <div className="bg-white border rounded p-4 inline-block shadow-sm">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img 
                                                src={contract.assinatura_cliente} 
                                                alt="Assinatura do Cliente" 
                                                className="max-h-32 object-contain"
                                            />
                                        </div>
                                        <div className="mt-4 space-y-1">
                                            {contract.data_assinatura && (
                                                <p className="text-xs text-muted-foreground">
                                                    Assinado em: {formatDate(contract.data_assinatura)} às {new Date(contract.data_assinatura).toLocaleTimeString()}
                                                </p>
                                            )}
                                            {contract.ip_assinatura && (
                                                <p className="text-xs text-muted-foreground">
                                                    IP de registro: {contract.ip_assinatura}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Timeline */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-h4">Histórico</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                                        <FileText className="w-4 h-4 text-success" />
                                    </div>
                                    <div>
                                        <p className="text-body-sm font-medium">Contrato criado</p>
                                        <p className="text-caption text-muted-foreground">
                                            {formatDate(contract.created_at)} às {new Date(contract.created_at).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                                {contract.enviado_em && (
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
                                            <Send className="w-4 h-4 text-warning" />
                                        </div>
                                        <div>
                                            <p className="text-body-sm font-medium">Enviado para o cliente</p>
                                            <p className="text-caption text-muted-foreground">
                                                {formatDate(contract.enviado_em)}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {contract.assinado_em && (
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                                            <CheckCircle className="w-4 h-4 text-success" />
                                        </div>
                                        <div>
                                            <p className="text-body-sm font-medium">Assinado pelo cliente</p>
                                            <p className="text-caption text-muted-foreground">
                                                {formatDate(contract.assinado_em)}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Financial Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-h4">
                                <DollarSign className="w-5 h-5 text-muted-foreground" />
                                Valores
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-caption text-muted-foreground">Valor por Serviço</p>
                                <p className="text-h3 font-semibold text-brandy-rose-600">
                                    {formatCurrency(contract.valor_acordado)}
                                </p>
                            </div>
                            <div className="pt-4 border-t border-pampas">
                                <p className="text-caption text-muted-foreground">Estimativa Mensal</p>
                                <p className="text-h4 font-semibold">
                                    {formatCurrency(
                                        contract.valor_acordado *
                                        (contract.frequencia === 'weekly' ? 4 :
                                            contract.frequencia === 'biweekly' ? 2 : 1)
                                    )}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contract Period */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-h4">
                                <Calendar className="w-5 h-5 text-muted-foreground" />
                                Vigência
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-caption text-muted-foreground">Início</p>
                                <p className="text-body font-medium">{formatDate(contract.data_inicio)}</p>
                            </div>
                            <div>
                                <p className="text-caption text-muted-foreground">Término</p>
                                <p className="text-body font-medium">
                                    {contract.data_fim ? formatDate(contract.data_fim) : 'Indeterminado'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recurrence Status */}
                    {contract.recorrencias?.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-h4">
                                    <Clock className="w-5 h-5 text-muted-foreground" />
                                    Recorrência
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {contract.recorrencias.map((rec: any) => (
                                    <div key={rec.id} className="flex items-center justify-between">
                                        <span className="text-body-sm">
                                            {getLabel(FREQUENCIES, rec.frequencia)} - {getLabel(WEEKDAYS, rec.dia_preferido)}
                                        </span>
                                        <Badge variant={rec.ativo ? 'success' : 'secondary'}>
                                            {rec.ativo ? 'Ativa' : 'Inativa'}
                                        </Badge>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}

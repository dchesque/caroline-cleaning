'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Calendar,
    Clock,
    DollarSign,
    Plus,
    MoreHorizontal,
    CheckCircle,
    XCircle,
    CalendarX,
    Receipt,
    TrendingUp,
    AlertCircle,
    Ban
} from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { AppointmentModal } from '@/components/agenda/appointment-modal'

const STATUS_COLORS: Record<string, string> = {
    agendado: 'bg-blue-100 text-blue-700',
    confirmado: 'bg-green-100 text-green-700',
    em_andamento: 'bg-yellow-100 text-yellow-700',
    concluido: 'bg-gray-100 text-gray-700',
    cancelado: 'bg-red-100 text-red-700',
    no_show: 'bg-orange-100 text-orange-700',
    reagendado: 'bg-purple-100 text-purple-700',
}

const STATUS_LABELS: Record<string, string> = {
    agendado: 'Agendado',
    confirmado: 'Confirmado',
    em_andamento: 'Em Andamento',
    concluido: 'Concluído',
    cancelado: 'Cancelado',
    no_show: 'No Show',
    reagendado: 'Reagendado',
}

const TIPO_LABELS: Record<string, string> = {
    visit: 'Visita',
    regular: 'Regular',
    deep: 'Deep Clean',
    move_in_out: 'Move In/Out',
    office: 'Office',
    airbnb: 'Airbnb',
}

interface TabAgendamentosProps {
    clientId: string
    clientName?: string
}

export function TabAgendamentos({ clientId, clientName }: TabAgendamentosProps) {
    const [appointments, setAppointments] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showNewModal, setShowNewModal] = useState(false)
    const [cancelingId, setCancelingId] = useState<string | null>(null)
    const supabase = createClient()

    // Calcular métricas
    const now = new Date()
    const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
    const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd')
    const today = format(now, 'yyyy-MM-dd')

    // Separar próximos e histórico
    const upcoming = appointments.filter(a => a.data >= today && !['cancelado', 'concluido'].includes(a.status))
    const history = appointments.filter(a => a.data < today || ['cancelado', 'concluido'].includes(a.status))

    // Métricas gerais
    const totalAppointments = appointments.length
    const completedAppointments = appointments.filter(a => a.status === 'concluido')
    const canceledAppointments = appointments.filter(a => a.status === 'cancelado')
    const pendingAppointments = appointments.filter(a => ['agendado', 'confirmado'].includes(a.status))

    // Métricas do mês
    const monthAppointments = appointments.filter(a => a.data >= monthStart && a.data <= monthEnd)
    const monthCompleted = monthAppointments.filter(a => a.status === 'concluido')
    const monthScheduled = monthAppointments.filter(a => ['agendado', 'confirmado'].includes(a.status))

    // Financeiro
    const totalRevenue = completedAppointments.reduce((acc, a) => acc + (Number(a.valor) || 0), 0)
    const monthRevenue = monthCompleted.reduce((acc, a) => acc + (Number(a.valor) || 0), 0)
    const pendingRevenue = pendingAppointments.reduce((acc, a) => acc + (Number(a.valor) || 0), 0)
    const monthPendingRevenue = monthScheduled.reduce((acc, a) => acc + (Number(a.valor) || 0), 0)

    // Taxa de cancelamento
    const cancelRate = totalAppointments > 0
        ? ((canceledAppointments.length / totalAppointments) * 100).toFixed(1)
        : '0'

    const fetchAppointments = async () => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('agendamentos')
            .select('*')
            .eq('cliente_id', clientId)
            .order('data', { ascending: false })

        if (!error && data) {
            setAppointments(data)
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchAppointments()
    }, [clientId])

    // Calcular horário de fim
    const calcEndTime = (startTime: string, duration: number) => {
        if (!startTime) return '-'
        const [hours, minutes] = startTime.split(':').map(Number)
        const totalMinutes = hours * 60 + minutes + duration
        const endHours = Math.floor(totalMinutes / 60) % 24
        const endMinutes = totalMinutes % 60
        return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`
    }

    // Ações
    const handleConfirm = async (id: string) => {
        const { error } = await supabase
            .from('agendamentos')
            .update({ status: 'confirmado' })
            .eq('id', id)

        if (!error) {
            toast.success('Agendamento confirmado!')
            fetchAppointments()
        } else {
            toast.error('Erro ao confirmar')
        }
    }

    const handleCancel = async () => {
        if (!cancelingId) return

        const { error } = await supabase
            .from('agendamentos')
            .update({ status: 'cancelado' })
            .eq('id', cancelingId)

        if (!error) {
            toast.success('Agendamento cancelado')
            setCancelingId(null)
            fetchAppointments()
        } else {
            toast.error('Erro ao cancelar')
        }
    }

    const handleComplete = async (id: string) => {
        const { error } = await supabase
            .from('agendamentos')
            .update({ status: 'concluido' })
            .eq('id', id)

        if (!error) {
            toast.success('Agendamento concluído!')
            fetchAppointments()
        } else {
            toast.error('Erro ao concluir')
        }
    }

    const handleCreateInvoice = async (appointment: any) => {
        // Verificar se já existe fatura
        const { data: existing } = await supabase
            .from('financeiro')
            .select('id')
            .eq('agendamento_id', appointment.id)
            .single()

        if (existing) {
            toast.error('Já existe uma fatura para este agendamento')
            return
        }

        const { error } = await supabase.from('financeiro').insert([{
            cliente_id: clientId,
            agendamento_id: appointment.id,
            tipo: 'receita',
            categoria: 'servico',
            descricao: `${TIPO_LABELS[appointment.tipo] || appointment.tipo} - ${format(new Date(appointment.data), 'dd/MM/yyyy')}`,
            valor: appointment.valor || 0,
            data: appointment.data,
            status: 'pendente'
        }])

        if (!error) {
            toast.success('Fatura criada com sucesso!')
        } else {
            toast.error('Erro ao criar fatura')
        }
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
                {/* Total de Agendamentos */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <span className="text-xs text-muted-foreground">Total</span>
                        </div>
                        <p className="text-2xl font-bold">{totalAppointments}</p>
                        <p className="text-xs text-muted-foreground">
                            {monthAppointments.length} este mês
                        </p>
                    </CardContent>
                </Card>

                {/* Concluídos */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-xs text-muted-foreground">Concluídos</span>
                        </div>
                        <p className="text-2xl font-bold text-green-600">{completedAppointments.length}</p>
                        <p className="text-xs text-muted-foreground">
                            {monthCompleted.length} este mês
                        </p>
                    </CardContent>
                </Card>

                {/* Faturamento Recebido */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-[#C48B7F]" />
                            <span className="text-xs text-muted-foreground">Faturado</span>
                        </div>
                        <p className="text-2xl font-bold text-[#C48B7F]">${totalRevenue.toFixed(0)}</p>
                        <p className="text-xs text-muted-foreground">
                            ${monthRevenue.toFixed(0)} este mês
                        </p>
                    </CardContent>
                </Card>

                {/* Pendente */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-yellow-500" />
                            <span className="text-xs text-muted-foreground">Pendente</span>
                        </div>
                        <p className="text-2xl font-bold text-yellow-600">${pendingRevenue.toFixed(0)}</p>
                        <p className="text-xs text-muted-foreground">
                            {pendingAppointments.length} agendamentos
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Segunda linha de métricas */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="bg-red-50 border-red-100">
                    <CardContent className="p-4 text-center">
                        <Ban className="w-5 h-5 text-red-500 mx-auto mb-1" />
                        <p className="text-lg font-bold text-red-600">{canceledAppointments.length}</p>
                        <p className="text-xs text-red-600">Cancelamentos</p>
                        <p className="text-xs text-muted-foreground">Taxa: {cancelRate}%</p>
                    </CardContent>
                </Card>
                <Card className="bg-blue-50 border-blue-100">
                    <CardContent className="p-4 text-center">
                        <Calendar className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                        <p className="text-lg font-bold text-blue-600">{upcoming.length}</p>
                        <p className="text-xs text-blue-600">Próximos</p>
                        <p className="text-xs text-muted-foreground">Agendados</p>
                    </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-100">
                    <CardContent className="p-4 text-center">
                        <DollarSign className="w-5 h-5 text-green-500 mx-auto mb-1" />
                        <p className="text-lg font-bold text-green-600">${monthPendingRevenue.toFixed(0)}</p>
                        <p className="text-xs text-green-600">A Receber</p>
                        <p className="text-xs text-muted-foreground">Este mês</p>
                    </CardContent>
                </Card>
            </div>

            {/* Próximos Agendamentos */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-base">Próximos Agendamentos</CardTitle>
                        <CardDescription>{upcoming.length} agendamento(s)</CardDescription>
                    </div>
                    <Button
                        onClick={() => setShowNewModal(true)}
                        className="bg-[#C48B7F] hover:bg-[#A66D60]"
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Novo
                    </Button>
                </CardHeader>
                <CardContent>
                    {upcoming.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>Nenhum agendamento futuro</p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Horário</TableHead>
                                        <TableHead>Serviço</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {upcoming.map((app) => (
                                        <TableRow key={app.id}>
                                            <TableCell className="font-medium">
                                                {format(new Date(app.data), "dd/MM/yyyy")}
                                            </TableCell>
                                            <TableCell>
                                                {app.horario_inicio?.slice(0, 5)} - {calcEndTime(app.horario_inicio, app.duracao_minutos || 180)}
                                            </TableCell>
                                            <TableCell>
                                                {TIPO_LABELS[app.tipo] || app.tipo}
                                            </TableCell>
                                            <TableCell>
                                                {app.valor ? `$${Number(app.valor).toFixed(2)}` : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={STATUS_COLORS[app.status]}>
                                                    {STATUS_LABELS[app.status]}
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
                                                        {app.status === 'agendado' && (
                                                            <DropdownMenuItem onClick={() => handleConfirm(app.id)}>
                                                                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                                                Confirmar
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem onClick={() => handleComplete(app.id)}>
                                                            <CheckCircle className="w-4 h-4 mr-2" />
                                                            Marcar Concluído
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleCreateInvoice(app)}>
                                                            <Receipt className="w-4 h-4 mr-2" />
                                                            Lançar Fatura
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => setCancelingId(app.id)}
                                                            className="text-red-600"
                                                        >
                                                            <XCircle className="w-4 h-4 mr-2" />
                                                            Cancelar
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

            {/* Histórico */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Histórico</CardTitle>
                    <CardDescription>{history.length} agendamento(s) anteriores</CardDescription>
                </CardHeader>
                <CardContent>
                    {history.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>Nenhum histórico</p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
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
                                    {history.slice(0, 10).map((app) => (
                                        <TableRow key={app.id}>
                                            <TableCell>{format(new Date(app.data), "dd/MM/yyyy")}</TableCell>
                                            <TableCell>{TIPO_LABELS[app.tipo] || app.tipo}</TableCell>
                                            <TableCell>
                                                {app.valor ? `$${Number(app.valor).toFixed(2)}` : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {STATUS_LABELS[app.status]}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal Novo Agendamento */}
            <AppointmentModal
                open={showNewModal}
                onOpenChange={setShowNewModal}
                preSelectedClientId={clientId}
                onSuccess={fetchAppointments}
            />

            {/* Dialog Cancelar */}
            <Dialog open={!!cancelingId} onOpenChange={() => setCancelingId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancelar Agendamento</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja cancelar este agendamento?
                            Esta ação não pode ser desfeita.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelingId(null)}>
                            Voltar
                        </Button>
                        <Button variant="destructive" onClick={handleCancel}>
                            Cancelar Agendamento
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

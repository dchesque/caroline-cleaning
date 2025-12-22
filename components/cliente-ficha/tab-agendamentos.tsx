import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, DollarSign, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const STATUS_COLORS: Record<string, string> = {
    agendado: 'bg-blue-100 text-blue-700',
    confirmado: 'bg-green-100 text-green-700',
    em_andamento: 'bg-yellow-100 text-yellow-700',
    concluido: 'bg-gray-100 text-gray-700',
    cancelado: 'bg-red-100 text-red-700',
    no_show: 'bg-orange-100 text-orange-700',
    reagendado: 'bg-purple-100 text-purple-700',
}

const TIPO_LABELS: Record<string, string> = {
    visit: 'Visita',
    regular: 'Regular',
    deep: 'Deep Clean',
    move_in_out: 'Move In/Out',
    office: 'Office',
    airbnb: 'Airbnb',
}

export async function TabAgendamentos({ clientId }: { clientId: string }) {
    const supabase = await createClient()

    // Buscar agendamentos do cliente
    const { data: appointments, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('cliente_id', clientId)
        .order('data', { ascending: false })

    if (error) {
        console.error('Error fetching appointments:', error)
    }

    // Separar próximos e histórico
    const today = new Date().toISOString().split('T')[0]
    const upcoming = appointments?.filter(a => a.data >= today && !['cancelado', 'concluido'].includes(a.status)) || []
    const history = appointments?.filter(a => a.data < today || ['cancelado', 'concluido'].includes(a.status)) || []

    // Calcular estatísticas
    const totalAppointments = appointments?.length || 0
    const completedAppointments = appointments?.filter(a => a.status === 'concluido').length || 0
    const totalRevenue = appointments?.filter(a => a.status === 'concluido').reduce((acc, a) => acc + (Number(a.valor) || 0), 0) || 0

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="bg-[#FDF8F6] border-[#C48B7F]/20">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-[#C48B7F]" />
                            <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                        <p className="text-xl font-bold text-[#C48B7F]">{totalAppointments}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-green-600" />
                            <p className="text-xs text-muted-foreground">Concluídos</p>
                        </div>
                        <p className="text-xl font-bold text-green-600">{completedAppointments}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-blue-600" />
                            <p className="text-xs text-muted-foreground">Faturado</p>
                        </div>
                        <p className="text-xl font-bold text-blue-600">${totalRevenue.toFixed(2)}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Próximos Agendamentos */}
            <Card className="border-[#EAE0D5]">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Próximos Agendamentos</CardTitle>
                    <Link href={`/admin/agenda?cliente=${clientId}`}>
                        <Button size="sm" className="bg-[#C48B7F] hover:bg-[#A66D60]">
                            <Plus className="h-4 w-4 mr-1" />
                            Novo
                        </Button>
                    </Link>
                </CardHeader>
                <CardContent className="p-0">
                    {upcoming.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            Nenhum agendamento futuro
                        </div>
                    ) : (
                        <div className="divide-y divide-[#EAE0D5]">
                            {upcoming.map((app) => (
                                <Link
                                    key={app.id}
                                    href={`/admin/agenda?date=${app.data}`}
                                    className="block p-4 hover:bg-[#FDF8F6] transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-sm">
                                                {format(new Date(app.data), "dd 'de' MMMM", { locale: ptBR })}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {app.horario_inicio?.slice(0, 5)} • {TIPO_LABELS[app.tipo] || app.tipo}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {app.valor && (
                                                <span className="text-sm font-medium">${Number(app.valor).toFixed(2)}</span>
                                            )}
                                            <Badge className={STATUS_COLORS[app.status] || 'bg-gray-100'}>
                                                {app.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Histórico */}
            <Card className="border-[#EAE0D5]">
                <CardHeader>
                    <CardTitle className="text-base">Histórico</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {history.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            Nenhum agendamento anterior
                        </div>
                    ) : (
                        <div className="divide-y divide-[#EAE0D5]">
                            {history.slice(0, 10).map((app) => (
                                <div key={app.id} className="p-4 flex items-center justify-between hover:bg-[#FDF8F6]">
                                    <div>
                                        <p className="font-medium text-sm">
                                            {format(new Date(app.data), "dd/MM/yyyy")}
                                        </p>
                                        <p className="text-xs text-muted-foreground capitalize">
                                            {TIPO_LABELS[app.tipo] || app.tipo}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {app.valor && (
                                            <span className="text-sm">${Number(app.valor).toFixed(2)}</span>
                                        )}
                                        <Badge variant="outline" className="capitalize">
                                            {app.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

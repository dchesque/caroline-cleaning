import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { startOfDay, endOfDay } from 'date-fns'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock } from 'lucide-react'

export async function TodaySchedule() {
    const supabase = await createClient()
    const today = new Date()

    const { data: appointments } = await supabase
        .from('agendamentos')
        .select(`
        *,
        cliente:clientes(nome, endereco_rua)
    `)
        .gte('data', startOfDay(today).toISOString())
        .lte('data', endOfDay(today).toISOString())
        .order('data', { ascending: true })

    return (
        <Card className="h-full border-none shadow-sm">
            <CardHeader>
                <CardTitle>Agenda de Hoje</CardTitle>
            </CardHeader>
            <CardContent>
                {!appointments?.length ? (
                    <p className="text-muted-foreground text-sm">Nenhum agendamento para hoje.</p>
                ) : (
                    <div className="space-y-4">
                        {appointments.map((appointment: any) => (
                            <div key={appointment.id} className="flex items-start justify-between p-4 rounded-lg border border-[#EAE0D5] hover:bg-[#FDF8F6] transition-colors">
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-[#EAE0D5]/50 text-[#5D5D5D]">
                                        <span className="text-xs font-medium">
                                            {new Date(appointment.data).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-foreground">{appointment.cliente?.nome || 'Cliente Desconhecido'}</h4>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                            <Clock className="w-3 h-3" />
                                            <span>{appointment.duracao_estimada || 2}h</span>
                                            <span className="text-xs">•</span>
                                            <MapPin className="w-3 h-3" />
                                            <span className="truncate max-w-[150px]">{appointment.cliente?.endereco_rua || 'Endereço não informado'}</span>
                                        </div>
                                    </div>
                                </div>
                                <Badge variant={appointment.status === 'confirmado' ? 'default' : 'secondary'}>
                                    {appointment.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { startOfDay, endOfDay } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, Loader2 } from 'lucide-react'
import { useAdminI18n } from '@/lib/admin-i18n/context'

export function TodaySchedule() {
    const { t } = useAdminI18n()
    const dashboardT = t('dashboard')
    const [isLoading, setIsLoading] = useState(true)
    const [appointments, setAppointments] = useState<any[]>([])
    const supabase = createClient()

    useEffect(() => {
        async function fetchAppointments() {
            const today = new Date()
            const { data } = await supabase
                .from('agendamentos')
                .select(`
                    *,
                    cliente:clientes(nome, endereco_completo)
                `)
                .gte('data', startOfDay(today).toISOString())
                .lte('data', endOfDay(today).toISOString())
                .order('data', { ascending: true })

            setAppointments(data || [])
            setIsLoading(false)
        }
        fetchAppointments()
    }, [])

    return (
        <Card className="h-full border-none shadow-sm">
            <CardHeader>
                <CardTitle>{dashboardT.todaySchedule.title}</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-brandy-rose-600" />
                    </div>
                ) : !appointments?.length ? (
                    <p className="text-muted-foreground text-sm">{dashboardT.todaySchedule.empty}</p>
                ) : (
                    <div className="space-y-4">
                        {appointments.map((appointment: any) => (
                            <div key={appointment.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-[#EAE0D5] hover:bg-[#FDF8F6] transition-colors gap-3 sm:gap-4">
                                <div className="flex gap-4 items-center">
                                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-[#EAE0D5]/50 text-[#5D5D5D] shrink-0">
                                        <span className="text-xs font-medium">
                                            {new Date(appointment.data).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-medium text-foreground truncate">{appointment.cliente?.nome || dashboardT.todaySchedule.unknownClient}</h4>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                            <Clock className="w-3 h-3 shrink-0" />
                                            <span>{appointment.duracao_estimada || 2}h</span>
                                            <span className="text-xs">•</span>
                                            <MapPin className="w-3 h-3 shrink-0" />
                                            <span className="truncate max-w-[150px]">{appointment.cliente?.endereco_completo || dashboardT.todaySchedule.addressNotProvided}</span>
                                        </div>
                                    </div>
                                </div>
                                <Badge className="w-fit ml-16 sm:ml-0" variant={appointment.status === 'confirmado' ? 'default' : 'secondary'}>
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

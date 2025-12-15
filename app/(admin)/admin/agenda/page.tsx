'use client'

import { useState, useEffect } from 'react'
import { CalendarView } from '@/components/agenda/calendar-view'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function AgendaPage() {
    const [appointments, setAppointments] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    const fetchAppointments = async () => {
        setIsLoading(true)
        const { data } = await supabase
            .from('agendamentos')
            .select(`
            *,
            cliente:clientes(id, nome, endereco_rua)
        `)

        if (data) setAppointments(data)
        setIsLoading(false)
    }

    useEffect(() => {
        fetchAppointments()
    }, [])

    if (isLoading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-heading text-3xl text-foreground">Agenda</h1>
                <p className="text-sm text-muted-foreground">Gerencie seus agendamentos</p>
            </div>
            <CalendarView appointments={appointments} onRefresh={fetchAppointments} />
        </div>
    )
}

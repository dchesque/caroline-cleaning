'use client'

import { useState, useEffect } from 'react'
import { CalendarView } from '@/components/agenda/calendar-view'
import { createClient } from '@/lib/supabase/client'
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { useAdminI18n } from '@/lib/admin-i18n/context'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export default function AgendaPage() {
    const { t } = useAdminI18n()
    const agendaT = t('agenda')

    const [appointments, setAppointments] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    const fetchAppointments = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const { data, error: queryError } = await supabase
                .from('agendamentos')
                .select(`
                *,
                cliente:clientes(id, nome, endereco_completo, cidade, estado, zip_code, telefone)
            `)

            if (queryError) throw queryError
            setAppointments(data || [])
        } catch (err) {
            console.error('Failed to fetch appointments:', err)
            setError(agendaT.error?.load || 'Failed to load appointments')
            toast.error(agendaT.error?.load)
        } finally {
            setIsLoading(false)
        }
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

    if (error) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <AlertCircle className="w-10 h-10 text-destructive" />
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button variant="outline" onClick={fetchAppointments}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {t('common').update}
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-heading text-3xl text-foreground">{agendaT.title}</h1>
                <p className="text-sm text-muted-foreground">{agendaT.subtitle}</p>
            </div>
            <CalendarView appointments={appointments} onRefresh={fetchAppointments} />
        </div>
    )
}

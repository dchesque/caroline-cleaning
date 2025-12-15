// components/analytics/recent-activity.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
    UserPlus,
    Calendar,
    DollarSign,
    CheckCircle,
    XCircle
} from 'lucide-react'

interface Activity {
    id: string
    type: 'client' | 'appointment' | 'payment' | 'chat' | 'completed' | 'cancelled'
    description: string
    time: string
    icon: any
    color: string
}

export function RecentActivity() {
    const [activities, setActivities] = useState<Activity[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchActivities = async () => {
            const allActivities: Activity[] = []

            // Novos clientes
            const { data: clients } = await supabase
                .from('clientes')
                .select('id, nome, created_at')
                .order('created_at', { ascending: false })
                .limit(5)

            clients?.forEach(c => {
                allActivities.push({
                    id: `client-${c.id}`,
                    type: 'client',
                    description: `Novo lead: ${c.nome}`,
                    time: c.created_at,
                    icon: UserPlus,
                    color: 'text-info'
                })
            })

            // Agendamentos recentes
            const { data: appointments } = await supabase
                .from('agendamentos')
                .select('id, tipo, data, status, created_at, clientes(nome)')
                .order('created_at', { ascending: false })
                .limit(5)

            appointments?.forEach(a => {
                const clientName = (a.clientes as any)?.nome || 'Cliente'
                if (a.status === 'concluido') {
                    allActivities.push({
                        id: `completed-${a.id}`,
                        type: 'completed',
                        description: `Serviço concluído para ${clientName}`,
                        time: a.created_at,
                        icon: CheckCircle,
                        color: 'text-success'
                    })
                } else if (a.status === 'cancelado') {
                    allActivities.push({
                        id: `cancelled-${a.id}`,
                        type: 'cancelled',
                        description: `Agendamento cancelado: ${clientName}`,
                        time: a.created_at,
                        icon: XCircle,
                        color: 'text-destructive'
                    })
                } else {
                    allActivities.push({
                        id: `apt-${a.id}`,
                        type: 'appointment',
                        description: `Novo agendamento: ${clientName} (${a.data})`,
                        time: a.created_at,
                        icon: Calendar,
                        color: 'text-warning'
                    })
                }
            })

            // Pagamentos recentes
            const { data: payments } = await supabase
                .from('financeiro')
                .select('id, valor, created_at, clientes(nome)')
                .eq('tipo', 'receita')
                .eq('status', 'pago')
                .order('created_at', { ascending: false })
                .limit(5)

            payments?.forEach(p => {
                const clientName = (p.clientes as any)?.nome || 'Cliente'
                allActivities.push({
                    id: `payment-${p.id}`,
                    type: 'payment',
                    description: `Pagamento recebido: $${p.valor} de ${clientName}`,
                    time: p.created_at,
                    icon: DollarSign,
                    color: 'text-success'
                })
            })

            // Ordenar por tempo
            allActivities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

            setActivities(allActivities.slice(0, 10))
            setIsLoading(false)
        }

        fetchActivities()
    }, [])

    if (isLoading) {
        return <div className="h-[400px] flex items-center justify-center text-muted-foreground">Carregando...</div>
    }

    return (
        <div className="space-y-4">
            {activities.map((activity) => {
                const Icon = activity.icon
                return (
                    <div key={activity.id} className="flex items-start gap-4 p-3 hover:bg-desert-storm rounded-lg transition-colors">
                        <div className={`p-2 rounded-lg bg-pampas ${activity.color}`}>
                            <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-body-sm">{activity.description}</p>
                            <p className="text-caption text-muted-foreground">
                                {formatDistanceToNow(new Date(activity.time), { addSuffix: true, locale: ptBR })}
                            </p>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

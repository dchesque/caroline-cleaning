import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, MapPin, User } from 'lucide-react'
import { format } from 'date-fns'

interface AppointmentCardProps {
    appointment: any
    onClick?: () => void
}

export function AppointmentCard({ appointment, onClick }: AppointmentCardProps) {
    const statusColors = {
        agendado: 'bg-secondary text-secondary-foreground',
        confirmado: 'bg-green-100 text-green-700',
        em_andamento: 'bg-yellow-100 text-yellow-700',
        concluido: 'bg-slate-100 text-slate-700',
        cancelado: 'bg-red-100 text-red-700',
    }

    return (
        <Card
            className="cursor-pointer hover:shadow-md transition-shadow border-[#EAE0D5] bg-white h-full"
            onClick={onClick}
        >
            <CardContent className="p-2 sm:p-3 space-y-2">
                <div className="flex justify-between items-start">
                    <span className="font-semibold text-sm text-[#5D5D5D]">
                        {format(new Date(appointment.data), 'HH:mm')}
                    </span>
                    <Badge variant="secondary" className={`${statusColors[appointment.status as keyof typeof statusColors]} hover:bg-opacity-80`}>
                        {appointment.status}
                    </Badge>
                </div>

                <div>
                    <h4 className="font-medium text-sm truncate">{appointment.cliente?.nome || 'Cliente'}</h4>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{appointment.duracao_estimada}h</span>
                    </div>
                    {appointment.cliente?.endereco_completo && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5 truncate">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{appointment.cliente.endereco_completo}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

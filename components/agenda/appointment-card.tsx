import { Clock, Plus, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AppointmentCardProps {
    appointment: any
    onClick?: () => void
}

export function AppointmentCard({ appointment, onClick }: AppointmentCardProps) {
    // Formatação de horários
    const formatTime = (time: string) => time?.substring(0, 5)

    // Cálculo do horário final
    const getEndTime = () => {
        if (appointment.horario_fim_estimado) return formatTime(appointment.horario_fim_estimado)

        const [h, m] = (appointment.horario_inicio || '00:00').split(':').map(Number)
        const date = new Date()
        date.setHours(h, m + (appointment.duracao_minutos || 0), 0, 0)
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }

    const durationH = Math.floor((appointment.duracao_minutos || 0) / 60)
    const durationM = (appointment.duracao_minutos || 0) % 60
    const durationText = `${durationH}h${durationM > 0 ? ` ${durationM}min` : ''}`

    const hasAddons = appointment.addons && Array.isArray(appointment.addons) && appointment.addons.length > 0

    return (
        <div
            className={cn(
                "group relative h-full flex flex-col rounded-md transition-all font-sans",
                "cursor-pointer hover:bg-[#F5E6E1] active:scale-[0.98]",
                "bg-[#FDF8F6] text-[#5D5D5D] border border-[#C48B7F]/20 shadow-sm overflow-hidden"
            )}
            onClick={onClick}
        >
            {/* Indicador de Status na lateral */}
            <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1.5",
                appointment.status === 'confirmado' ? 'bg-[#C48B7F]' :
                    appointment.status === 'cancelado' ? 'bg-red-400' : 'bg-[#BE9982]'
            )} />

            <div className="p-3 flex flex-col h-full gap-1.5 pl-4">
                {/* 1. Hora Inicio - Hora Final */}
                <div className="flex items-center justify-between">
                    <span className="font-bold text-[13px] text-[#C48B7F] tracking-tight">
                        {formatTime(appointment.horario_inicio)} — {getEndTime()}
                    </span>

                    <span className={cn(
                        "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-sm border shrink-0",
                        appointment.status === 'confirmado' ? "bg-[#C48B7F] text-white border-[#C48B7F]" : "bg-[#BE9982]/10 text-[#BE9982] border-[#BE9982]/20"
                    )}>
                        {appointment.status}
                    </span>
                </div>

                {/* 2. Duração */}
                <div className="flex items-center gap-1.5 text-[11px] text-[#BE9982] font-semibold">
                    <Clock className="size-3" />
                    <span>{durationText}</span>
                </div>

                {/* 3. Cliente */}
                <h4 className="font-sans font-bold text-[16px] leading-tight mt-1 truncate text-[#2C211A] tracking-tight">
                    {appointment.cliente?.nome || 'Cliente'}
                </h4>

                {/* 4. Serviços */}
                <div className="flex items-center gap-2 mt-0.5">
                    <Sparkles className="size-3.5 text-[#C48B7F] shrink-0" />
                    <p className="text-[12px] text-[#5D5D5D] font-medium truncate">
                        {appointment.tipo}
                    </p>
                </div>

                {/* 5. Serviços adicionais */}
                {hasAddons && (
                    <div className="mt-2 flex flex-wrap gap-1.5 border-t border-[#C48B7F]/10 pt-2">
                        {appointment.addons.map((addon: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-1 bg-[#C48B7F]/10 px-2 py-0.5 rounded-sm text-[10px] text-[#C48B7F] whitespace-nowrap font-medium">
                                <Plus className="size-2" />
                                <span>{addon.nome}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

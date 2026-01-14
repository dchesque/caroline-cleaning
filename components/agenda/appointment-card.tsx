import { Clock, MapPin, User, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { formatCurrencyUSD } from '@/lib/formatters'
import { cn } from '@/lib/utils'

interface AppointmentCardProps {
    appointment: any
    onClick?: () => void
    showTooltip?: boolean
    variant?: 'normal' | 'compact'
}

export function AppointmentCard({ appointment, onClick, showTooltip = true, variant = 'normal' }: AppointmentCardProps) {
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

    // Layout compacto para visualização mensal
    if (variant === 'compact') {
        return (
            <div
                className={cn(
                    "h-full flex items-center gap-2 rounded-md transition-all font-sans px-2 py-1.5",
                    "cursor-pointer hover:brightness-110 active:scale-[0.98]",
                    "bg-[#FDF8F6] text-[#5D5D5D] border-l-2 shadow-sm",
                    appointment.status === 'confirmado' ? 'border-l-[#C48B7F]' :
                        appointment.status === 'cancelado' ? 'border-l-red-400' : 'border-l-[#BE9982]'
                )}
                onClick={onClick}
            >
                <span className="font-bold text-[11px] text-[#C48B7F] shrink-0">
                    {formatTime(appointment.horario_inicio)}-{getEndTime()}
                </span>
                <span className="text-[11px] font-semibold text-[#2C211A] truncate">
                    {appointment.cliente?.nome || 'Cliente'}
                </span>
            </div>
        )
    }

    // Layout normal para visualizações diária e semanal

    return (
        <div className="group/card relative h-full">
            <div
                className={cn(
                    "h-full flex flex-col rounded-md transition-all font-sans",
                    "cursor-pointer hover:brightness-110 active:scale-[0.98]",
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

                <div className="p-2.5 flex flex-col h-full gap-1 pl-3.5">
                    {/* 1. Hora Inicio - Hora Final */}
                    <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-[12px] text-[#C48B7F] tracking-tight shrink-0">
                            {formatTime(appointment.horario_inicio)} — {getEndTime()}
                        </span>
                    </div>

                    {/* 2. Duração */}
                    <div className="flex items-center gap-1 text-[10px] text-[#BE9982] font-semibold">
                        <Clock className="size-2.5 shrink-0" />
                        <span className="truncate">{durationText}</span>
                    </div>

                    {/* 3. Cliente */}
                    <h4 className="font-sans font-bold text-[14px] leading-tight mt-0.5 truncate text-[#2C211A] tracking-tight">
                        {appointment.cliente?.nome || 'Cliente'}
                    </h4>

                    {/* 4. Serviços */}
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-[#C48B7F] shrink-0">✨</span>
                        <p className="text-[11px] text-[#5D5D5D] font-medium truncate">
                            {appointment.tipo}
                        </p>
                    </div>

                    {/* Badge de status - apenas em telas maiores */}
                    <div className="hidden sm:flex mt-auto pt-1">
                        <span className={cn(
                            "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm border",
                            appointment.status === 'confirmado' ? "bg-[#C48B7F] text-white border-[#C48B7F]" : "bg-[#BE9982]/10 text-[#BE9982] border-[#BE9982]/20"
                        )}>
                            {appointment.status}
                        </span>
                    </div>
                </div>
            </div>

            {/* Tooltip on Hover - Posicionamento Inteligente */}
            {showTooltip && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full mt-2 z-[100] pointer-events-none opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 delay-300">
                    <div className="bg-[#2C211A] text-white rounded-lg shadow-2xl p-4 w-[320px] border border-[#C48B7F]/20">
                        {/* Seta apontando para cima */}
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#2C211A] border-l border-t border-[#C48B7F]/20 rotate-45" />

                        <div className="relative">
                            {/* Cliente */}
                            <div className="flex items-center gap-2 mb-3">
                                <User className="size-4 text-[#C48B7F]" />
                                <div>
                                    <p className="font-bold text-sm">{appointment.cliente?.nome || 'Cliente'}</p>
                                    <p className="text-xs text-gray-400">{appointment.cliente?.telefone || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Horário */}
                            <div className="flex items-center gap-2 mb-2 text-xs">
                                <Clock className="size-3.5 text-[#C48B7F]" />
                                <span>{format(new Date(appointment.data), 'dd/MM/yyyy')} • {formatTime(appointment.horario_inicio)} - {getEndTime()}</span>
                            </div>

                            {/* Endereço */}
                            {appointment.cliente?.endereco_completo && (
                                <div className="flex items-start gap-2 mb-2 text-xs">
                                    <MapPin className="size-3.5 text-[#C48B7F] mt-0.5 shrink-0" />
                                    <span className="line-clamp-2">{appointment.cliente.endereco_completo}</span>
                                </div>
                            )}

                            {/* Valor */}
                            <div className="flex items-center gap-2 mb-3 text-xs">
                                <DollarSign className="size-3.5 text-[#C48B7F]" />
                                <span className="font-bold">{formatCurrencyUSD(appointment.valor_final || appointment.valor || 0)}</span>
                            </div>

                            {/* Serviço */}
                            <div className="border-t border-[#C48B7F]/20 pt-2">
                                <p className="text-xs text-gray-400 mb-1">Serviço</p>
                                <p className="text-sm font-semibold text-[#C48B7F]">{appointment.tipo}</p>
                                {hasAddons && (
                                    <div className="mt-2">
                                        <p className="text-xs text-gray-400 mb-1">Adicionais</p>
                                        <div className="flex flex-wrap gap-1">
                                            {appointment.addons.map((addon: any, idx: number) => (
                                                <span key={idx} className="text-[10px] bg-[#C48B7F]/20 text-[#C48B7F] px-1.5 py-0.5 rounded">
                                                    {addon.nome}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Notas */}
                            {appointment.notas && (
                                <div className="border-t border-[#C48B7F]/20 pt-2 mt-2">
                                    <p className="text-xs text-gray-400 mb-1">Observações</p>
                                    <p className="text-xs italic line-clamp-3">{appointment.notas}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

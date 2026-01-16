import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, addDays } from 'date-fns'
import { ptBR, enUS } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { AppointmentCard } from './appointment-card'
import { useEffect, useState } from 'react'
import { useAdminI18n } from '@/lib/admin-i18n/context'

interface WeekViewProps {
    currentDate: Date
    appointments: any[]
    onSlotClick: (date: Date) => void
    onAppointmentClick: (appointment: any) => void
}

interface PositionedAppointment {
    appointment: any
    top: number
    height: number
    column: number
    totalColumns: number
}

export function WeekView({ currentDate, appointments, onSlotClick, onAppointmentClick }: WeekViewProps) {
    const { locale } = useAdminI18n()
    const dateLocale = locale === 'pt-BR' ? ptBR : enUS

    const start = startOfWeek(currentDate)
    const end = endOfWeek(currentDate)
    const days = eachDayOfInterval({ start, end })
    const hours = Array.from({ length: 14 }, (_, i) => i + 7) // 7 AM to 8 PM
    const HOUR_HEIGHT = 80
    const [currentTime, setCurrentTime] = useState(new Date())

    // Atualiza a hora atual a cada minuto
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date())
        }, 60000)

        return () => clearInterval(interval)
    }, [])

    // Calcula a posição da linha de "agora"
    const getCurrentTimePosition = () => {
        const now = new Date()
        const hours = now.getHours()
        const minutes = now.getMinutes()

        if (hours < 7 || hours >= 21) return null

        const totalMinutesFromStart = (hours - 7) * 60 + minutes
        const top = (totalMinutesFromStart / 60) * HOUR_HEIGHT

        return top
    }

    const currentTimeTop = getCurrentTimePosition()

    const calculatePosition = (horario: string, duracaoMinutos: number) => {
        const [hoursStr, minutesStr] = horario.split(':')
        const h = parseInt(hoursStr)
        const m = parseInt(minutesStr)

        const totalMinutesFromStart = (h - 7) * 60 + m
        const top = (totalMinutesFromStart / 60) * HOUR_HEIGHT
        const height = (duracaoMinutos / 60) * HOUR_HEIGHT

        return { top, height }
    }

    // Detecta sobreposição de horários e calcula colunas para um dia específico
    const getPositionedAppointments = (dayAppointments: any[]): PositionedAppointment[] => {
        const positioned: PositionedAppointment[] = []

        dayAppointments.forEach(app => {
            const { top, height } = calculatePosition(app.horario_inicio, app.duracao_minutos)
            const appEnd = top + height

            // Encontra agendamentos que se sobrepõem
            const overlapping = positioned.filter(p => {
                const pEnd = p.top + p.height
                return !(appEnd <= p.top || top >= pEnd)
            })

            // Determina a coluna disponível
            let column = 0
            const usedColumns = overlapping.map(p => p.column)
            while (usedColumns.includes(column)) {
                column++
            }

            // Calcula o total de colunas necessárias para este grupo
            const maxColumn = Math.max(column, ...overlapping.map(p => p.column))
            const totalColumns = maxColumn + 1

            // Atualiza o totalColumns de todos os agendamentos sobrepostos
            overlapping.forEach(p => {
                if (p.totalColumns < totalColumns) {
                    p.totalColumns = totalColumns
                }
            })

            positioned.push({
                appointment: app,
                top,
                height,
                column,
                totalColumns
            })
        })

        return positioned
    }

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] overflow-hidden bg-white border border-[#EAE0D5] rounded-lg">
            <div className="overflow-x-auto flex-1">
                <div className="min-w-[1000px] h-full flex flex-col">
                    {/* Header */}
                    <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-[#EAE0D5] shrink-0 bg-gray-50/50">
                        <div className="p-2 border-r border-[#EAE0D5]"></div>
                        {days.map(day => (
                            <div key={day.toISOString()} className="p-2 text-center border-r border-[#EAE0D5] last:border-r-0">
                                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                    {format(day, 'EEE', { locale: dateLocale })}
                                </div>
                                <div className={cn(
                                    "text-sm font-bold mt-0.5 inline-flex items-center justify-center size-7 rounded-full",
                                    isSameDay(day, new Date()) ? 'bg-[#C48B7F] text-white' : 'text-[#5D5D5D]'
                                )}>
                                    {format(day, 'd')}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* GridBody */}
                    <div className="flex-1 overflow-y-auto relative">
                        <div className="grid grid-cols-[80px_repeat(7,1fr)] min-h-full">
                            {/* Time Labels Column */}
                            <div className="bg-gray-50/30 border-r border-[#EAE0D5]">
                                {hours.map(hour => (
                                    <div key={hour} className="h-20 p-2 text-[10px] font-bold text-muted-foreground text-right border-b border-[#EAE0D5] select-none">
                                        {hour}:00
                                    </div>
                                ))}
                            </div>

                            {/* Days Columns */}
                            {days.map(day => {
                                const dayStr = format(day, 'yyyy-MM-dd')
                                const dayAppointments = appointments.filter(a => a.data === dayStr)
                                const positionedAppointments = getPositionedAppointments(dayAppointments)

                                return (
                                    <div key={day.toISOString()} className="relative border-r border-[#EAE0D5] last:border-r-0 group">
                                        {/* Background Slot Markers */}
                                        <div className="absolute inset-0 divide-y divide-[#EAE0D5]/50 pointer-events-none">
                                            {hours.map(hour => (
                                                <div key={hour} className="h-20" />
                                            ))}
                                        </div>

                                        {/* Clickable Area for Slots */}
                                        <div className="absolute inset-0 flex flex-col">
                                            {hours.map(hour => {
                                                const cellDate = new Date(day)
                                                cellDate.setHours(hour, 0, 0, 0)
                                                return (
                                                    <div
                                                        key={hour}
                                                        className="h-20 cursor-pointer hover:bg-black/[0.02] transition-colors"
                                                        onClick={() => onSlotClick(cellDate)}
                                                    />
                                                )
                                            })}
                                        </div>

                                        {/* Appointments Layer */}
                                        <div className="absolute inset-0 pointer-events-none">
                                            {positionedAppointments.map(({ appointment: app, top, height, column, totalColumns }) => {
                                                const widthPercent = 100 / totalColumns
                                                const leftPercent = column * widthPercent

                                                return (
                                                    <div
                                                        key={app.id}
                                                        className="absolute pointer-events-auto transition-all hover:z-20"
                                                        style={{
                                                            top: `${top + 4}px`,
                                                            height: `${height - 8}px`,
                                                            minHeight: '35px',
                                                            left: `calc(${leftPercent}% + 4px)`,
                                                            width: `calc(${widthPercent}% - ${column === totalColumns - 1 ? 8 : 6}px)`
                                                        }}
                                                        onClick={(e) => { e.stopPropagation(); onAppointmentClick(app) }}
                                                    >
                                                        <AppointmentCard appointment={app} />
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        {/* Current Time Indicator (only for today) */}
                                        {isSameDay(day, new Date()) && currentTimeTop !== null && (
                                            <div
                                                className="absolute left-0 right-0 pointer-events-none z-30"
                                                style={{ top: `${currentTimeTop}px` }}
                                            >
                                                <div className="flex items-center">
                                                    <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shadow-sm" />
                                                    <div className="flex-1 h-0.5 bg-red-500 shadow-sm" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

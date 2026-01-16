import { format, isSameDay, parse } from 'date-fns'
import { ptBR, enUS } from 'date-fns/locale'
import { AppointmentCard } from './appointment-card'
import { useEffect, useState } from 'react'
import { useAdminI18n } from '@/lib/admin-i18n/context'

interface DayViewProps {
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

export function DayView({ currentDate, appointments, onSlotClick, onAppointmentClick }: DayViewProps) {
    const { locale } = useAdminI18n()
    const dateLocale = locale === 'pt-BR' ? ptBR : enUS

    const hours = Array.from({ length: 14 }, (_, i) => i + 7) // 7 AM to 8 PM
    const HOUR_HEIGHT = 80 // pixels por hora (h-20)
    const [currentTime, setCurrentTime] = useState(new Date())

    const dayAppointments = appointments.filter(a => a.data === format(currentDate, 'yyyy-MM-dd'))

    // Atualiza a hora atual a cada minuto
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date())
        }, 60000) // 1 minuto

        return () => clearInterval(interval)
    }, [])

    // Calcula a posição da linha de "agora"
    const getCurrentTimePosition = () => {
        const now = new Date()
        const hours = now.getHours()
        const minutes = now.getMinutes()

        if (hours < 7 || hours >= 21) return null // Fora do horário visível

        const totalMinutesFromStart = (hours - 7) * 60 + minutes
        const top = (totalMinutesFromStart / 60) * HOUR_HEIGHT

        return top
    }

    const isToday = isSameDay(currentDate, new Date())
    const currentTimeTop = isToday ? getCurrentTimePosition() : null

    const calculatePosition = (horario: string, duracaoMinutos: number) => {
        const [hoursStr, minutesStr] = horario.split(':')
        const h = parseInt(hoursStr)
        const m = parseInt(minutesStr)

        // Offset relativo ao início da grade (7 AM)
        const totalMinutesFromStart = (h - 7) * 60 + m
        const top = (totalMinutesFromStart / 60) * HOUR_HEIGHT
        const height = (duracaoMinutos / 60) * HOUR_HEIGHT

        return { top, height }
    }

    // Detecta sobreposição de horários e calcula colunas
    const getPositionedAppointments = (): PositionedAppointment[] => {
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

    const positionedAppointments = getPositionedAppointments()

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] overflow-hidden bg-white border border-[#EAE0D5] rounded-lg">
            <div className="border-b border-[#EAE0D5] p-3 text-center font-semibold text-[#5D5D5D] capitalize">
                {format(currentDate, "EEEE, d MMMM", { locale: dateLocale })}
            </div>
            <div className="flex-1 overflow-y-auto relative">
                {/* Grid Lines */}
                <div className="absolute inset-0 divide-y divide-[#EAE0D5]">
                    {hours.map(hour => {
                        const cellDate = new Date(currentDate);
                        cellDate.setHours(hour, 0, 0, 0);

                        return (
                            <div
                                key={hour}
                                className="flex h-20 group"
                                onClick={() => onSlotClick(cellDate)}
                            >
                                <div className="w-20 p-2 text-xs text-muted-foreground text-right border-r border-[#EAE0D5] select-none">
                                    {hour}:00
                                </div>
                                <div className="flex-1 group-hover:bg-gray-50/50 transition-colors" />
                            </div>
                        )
                    })}
                </div>

                {/* Appointments Layer */}
                <div className="absolute top-0 left-20 right-0 pointer-events-none">
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
                                    minHeight: '40px',
                                    left: `calc(${leftPercent}% + 8px)`,
                                    width: `calc(${widthPercent}% - ${column === totalColumns - 1 ? 16 : 12}px)`
                                }}
                                onClick={(e) => { e.stopPropagation(); onAppointmentClick(app) }}
                            >
                                <div className="h-full">
                                    <AppointmentCard appointment={app} />
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Current Time Indicator */}
                {currentTimeTop !== null && (
                    <div
                        className="absolute left-20 right-0 pointer-events-none z-30"
                        style={{ top: `${currentTimeTop}px` }}
                    >
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5 shadow-sm" />
                            <div className="flex-1 h-0.5 bg-red-500 shadow-sm" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

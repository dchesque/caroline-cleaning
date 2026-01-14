import { format, isSameDay, parse } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AppointmentCard } from './appointment-card'

interface DayViewProps {
    currentDate: Date
    appointments: any[]
    onSlotClick: (date: Date) => void
    onAppointmentClick: (appointment: any) => void
}

export function DayView({ currentDate, appointments, onSlotClick, onAppointmentClick }: DayViewProps) {
    const hours = Array.from({ length: 14 }, (_, i) => i + 7) // 7 AM to 8 PM
    const HOUR_HEIGHT = 80 // pixels por hora (h-20)

    const dayAppointments = appointments.filter(a => a.data === format(currentDate, 'yyyy-MM-dd'))

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

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] overflow-hidden bg-white border border-[#EAE0D5] rounded-lg">
            <div className="border-b border-[#EAE0D5] p-3 text-center font-semibold text-[#5D5D5D] capitalize">
                {format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
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
                    {dayAppointments.map(app => {
                        const { top, height } = calculatePosition(app.horario_inicio, app.duracao_minutos)

                        return (
                            <div
                                key={app.id}
                                className="absolute left-2 right-4 pointer-events-auto transition-all hover:z-20"
                                style={{
                                    top: `${top + 4}px`,
                                    height: `${height - 8}px`,
                                    minHeight: '40px'
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
            </div>
        </div>
    )
}

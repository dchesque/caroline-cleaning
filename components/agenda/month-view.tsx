import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AppointmentCard } from './appointment-card'

interface MonthViewProps {
    currentDate: Date
    appointments: any[]
    onDayClick: (date: Date) => void
    onAppointmentClick: (appointment: any) => void
}

export function MonthView({ currentDate, appointments, onDayClick, onAppointmentClick }: MonthViewProps) {
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)

    // Create grid (including pads)
    const days = eachDayOfInterval({ start, end })
    const startPad = start.getDay() // 0 (Sunday) to 6 (Saturday)

    const blanks = Array(startPad).fill(null)

    return (
        <div className="grid grid-cols-7 gap-px bg-[#EAE0D5] border border-[#EAE0D5] rounded-lg overflow-hidden">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="bg-[#FDF8F6] p-2 text-center text-sm font-semibold text-[#5D5D5D]">
                    {day}
                </div>
            ))}

            {blanks.map((_, i) => (
                <div key={`blank-${i}`} className="bg-white h-32 md:h-40" />
            ))}

            {days.map(day => {
                const daysAppointments = appointments.filter(a => a.data === format(day, 'yyyy-MM-dd'))
                const isToday = isSameDay(day, new Date())

                return (
                    <div
                        key={day.toISOString()}
                        className={`bg-white h-32 md:h-40 p-1 flex flex-col hover:bg-gray-50 transition-colors cursor-pointer ${!isSameMonth(day, currentDate) ? 'opacity-50' : ''}`}
                        onClick={() => onDayClick(day)}
                    >
                        <div className={`text-right p-1 text-sm ${isToday ? 'bg-[#C48B7F] text-white rounded-full w-6 h-6 flex items-center justify-center ml-auto' : 'text-[#5D5D5D]'}`}>
                            {format(day, 'd')}
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-1.5 mt-1 scrollbar-hide">
                            {daysAppointments.map(app => (
                                <div
                                    key={app.id}
                                    className="h-16 shrink-0"
                                    onClick={(e) => { e.stopPropagation(); onAppointmentClick(app) }}
                                >
                                    <AppointmentCard appointment={app} />
                                </div>
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isSameDay, startOfWeek, addDays } from 'date-fns'
import { ptBR, enUS } from 'date-fns/locale'
import { AppointmentCard } from './appointment-card'
import { useAdminI18n } from '@/lib/admin-i18n/context'

interface MonthViewProps {
    currentDate: Date
    appointments: any[]
    onDayClick: (date: Date) => void
    onAppointmentClick: (appointment: any) => void
}

export function MonthView({ currentDate, appointments, onDayClick, onAppointmentClick }: MonthViewProps) {
    const { locale } = useAdminI18n()
    const dateLocale = locale === 'pt-BR' ? ptBR : enUS

    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)

    // Create grid (including pads)
    const days = eachDayOfInterval({ start, end })
    const startPad = start.getDay() // 0 (Sunday) to 6 (Saturday)

    const blanks = Array(startPad).fill(null)

    // Dias da semana traduzidos
    const weekDays = Array.from({ length: 7 }).map((_, i) => {
        const day = addDays(startOfWeek(new Date(), { weekStartsOn: 0 }), i)
        return format(day, 'eee', { locale: dateLocale })
    })

    return (
        <div className="grid grid-cols-7 gap-px bg-[#EAE0D5] border border-[#EAE0D5] rounded-lg">
            {weekDays.map(day => (
                <div key={day} className="bg-[#FDF8F6] p-2 text-center text-sm font-semibold text-[#5D5D5D] capitalize">
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
                        className={`relative bg-white h-32 md:h-40 p-1 flex flex-col hover:bg-gray-50 transition-colors cursor-pointer overflow-visible ${!isSameMonth(day, currentDate) ? 'opacity-50' : ''}`}
                        onClick={() => onDayClick(day)}
                    >
                        <div className={`text-right p-1 text-sm ${isToday ? 'bg-[#C48B7F] text-white rounded-full w-6 h-6 flex items-center justify-center ml-auto' : 'text-[#5D5D5D]'}`}>
                            {format(day, 'd')}
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-1.5 mt-1 scrollbar-hide">
                            {daysAppointments.map(app => (
                                <div
                                    key={app.id}
                                    className="h-16 shrink-0 relative z-10"
                                    onClick={(e) => { e.stopPropagation(); onAppointmentClick(app) }}
                                >
                                    <AppointmentCard appointment={app} showTooltip={false} variant="compact" />
                                </div>
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

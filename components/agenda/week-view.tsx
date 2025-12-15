import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, addDays } from 'date-fns'
import { AppointmentCard } from './appointment-card'

interface WeekViewProps {
    currentDate: Date
    appointments: any[]
    onSlotClick: (date: Date) => void
    onAppointmentClick: (appointment: any) => void
}

export function WeekView({ currentDate, appointments, onSlotClick, onAppointmentClick }: WeekViewProps) {
    const start = startOfWeek(currentDate)
    const end = endOfWeek(currentDate)
    const days = eachDayOfInterval({ start, end })
    const hours = Array.from({ length: 13 }, (_, i) => i + 8) // 8 AM to 8 PM

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] overflow-hidden bg-white border border-[#EAE0D5] rounded-lg">
            {/* Header */}
            <div className="grid grid-cols-8 border-b border-[#EAE0D5]">
                <div className="p-2 border-r border-[#EAE0D5]"></div>
                {days.map(day => (
                    <div key={day.toISOString()} className="p-2 text-center border-r border-[#EAE0D5] last:border-r-0">
                        <div className="text-xs text-muted-foreground">{format(day, 'EEE')}</div>
                        <div className={`text-sm font-semibold ${isSameDay(day, new Date()) ? 'text-[#C48B7F]' : ''}`}>
                            {format(day, 'd')}
                        </div>
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-8">
                    {hours.map(hour => (
                        <>
                            <div className="p-2 text-xs text-muted-foreground text-right border-r border-b border-[#EAE0D5] h-20">
                                {hour}:00
                            </div>
                            {days.map(day => {
                                const cellDate = new Date(day);
                                cellDate.setHours(hour, 0, 0, 0);

                                // Find appointments starting in this hour
                                const cellAppointments = appointments.filter(a => {
                                    const appDate = new Date(a.data);
                                    return isSameDay(appDate, day) && appDate.getHours() === hour;
                                })

                                return (
                                    <div
                                        key={`${day.toISOString()}-${hour}`}
                                        className="border-r border-b border-[#EAE0D5] last:border-r-0 h-20 relative hover:bg-gray-50 cursor-pointer"
                                        onClick={() => onSlotClick(cellDate)}
                                    >
                                        {cellAppointments.map(app => (
                                            <div
                                                key={app.id}
                                                className="absolute inset-x-1 top-1 z-10"
                                                onClick={(e) => { e.stopPropagation(); onAppointmentClick(app) }}
                                            >
                                                <div className="bg-[#FDF8F6] border border-[#EAE0D5] rounded p-1 text-xs truncate shadow-sm">
                                                    {app.cliente?.nome}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            })}
                        </>
                    ))}
                </div>
            </div>
        </div>
    )
}

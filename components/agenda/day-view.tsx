import { format, isSameDay } from 'date-fns'
import { AppointmentCard } from './appointment-card'

interface DayViewProps {
    currentDate: Date
    appointments: any[]
    onSlotClick: (date: Date) => void
    onAppointmentClick: (appointment: any) => void
}

export function DayView({ currentDate, appointments, onSlotClick, onAppointmentClick }: DayViewProps) {
    const hours = Array.from({ length: 13 }, (_, i) => i + 8) // 8 AM to 8 PM

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] overflow-hidden bg-white border border-[#EAE0D5] rounded-lg">
            <div className="border-b border-[#EAE0D5] p-3 text-center font-semibold text-[#5D5D5D]">
                {format(currentDate, 'EEEE, MMMM do')}
            </div>
            <div className="flex-1 overflow-y-auto">
                {hours.map(hour => {
                    const cellDate = new Date(currentDate);
                    cellDate.setHours(hour, 0, 0, 0);

                    const cellAppointments = appointments.filter(a => {
                        const appDate = new Date(a.data);
                        return isSameDay(appDate, currentDate) && appDate.getHours() === hour;
                    })

                    return (
                        <div key={hour} className="flex border-b border-[#EAE0D5] min-h-[5rem]">
                            <div className="w-20 p-2 text-xs text-muted-foreground text-right border-r border-[#EAE0D5]">
                                {hour}:00
                            </div>
                            <div
                                className="flex-1 relative hover:bg-gray-50 cursor-pointer"
                                onClick={() => onSlotClick(cellDate)}
                            >
                                {cellAppointments.map(app => (
                                    <div
                                        key={app.id}
                                        className="absolute top-1 left-2 right-2 bottom-1"
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
        </div>
    )
}

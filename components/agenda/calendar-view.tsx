'use client'

import { useState } from 'react'
import { addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { MonthView } from './month-view'
import { WeekView } from './week-view'
import { DayView } from './day-view'
import { AppointmentModal } from './appointment-modal'

type ViewType = 'month' | 'week' | 'day'

interface CalendarViewProps {
    appointments: any[]
    onRefresh: () => void
}

export function CalendarView({ appointments, onRefresh }: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [view, setView] = useState<ViewType>('month')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())

    const navigate = (direction: 'prev' | 'next') => {
        if (view === 'month') {
            setCurrentDate(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1))
        } else if (view === 'week') {
            setCurrentDate(prev => direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1))
        } else {
            setCurrentDate(prev => direction === 'next' ? addDays(prev, 1) : subDays(prev, 1))
        }
    }

    const handleDayClick = (date: Date) => {
        setSelectedDate(date)
        setIsModalOpen(true)
    }

    const handleSlotClick = (date: Date) => {
        setSelectedDate(date)
        setIsModalOpen(true)
    }

    const handleAppointmentClick = (appointment: any) => {
        // For now just log, eventually open edit modal or client details
        console.log('Clicked appointment:', appointment)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => navigate('prev')}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="w-40 text-center font-medium">
                        {format(currentDate, view === 'day' ? 'MMM d, yyyy' : 'MMMM yyyy')}
                    </div>
                    <Button variant="outline" size="icon" onClick={() => navigate('next')}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" onClick={() => setCurrentDate(new Date())}>
                        Hoje
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Select value={view} onValueChange={(v) => setView(v as ViewType)}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="month">Mês</SelectItem>
                            <SelectItem value="week">Semana</SelectItem>
                            <SelectItem value="day">Dia</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={() => setIsModalOpen(true)} className="bg-[#C48B7F] hover:bg-[#A66D60]">
                        <Plus className="w-4 h-4 mr-2" />
                        Novo
                    </Button>
                </div>
            </div>

            <div className="min-h-[600px]">
                {view === 'month' && (
                    <MonthView
                        currentDate={currentDate}
                        appointments={appointments}
                        onDayClick={handleDayClick}
                        onAppointmentClick={handleAppointmentClick}
                    />
                )}
                {view === 'week' && (
                    <WeekView
                        currentDate={currentDate}
                        appointments={appointments}
                        onSlotClick={handleSlotClick}
                        onAppointmentClick={handleAppointmentClick}
                    />
                )}
                {view === 'day' && (
                    <DayView
                        currentDate={currentDate}
                        appointments={appointments}
                        onSlotClick={handleSlotClick}
                        onAppointmentClick={handleAppointmentClick}
                    />
                )}
            </div>

            <AppointmentModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                selectedDate={selectedDate}
                onSuccess={onRefresh}
            />
        </div>
    )
}

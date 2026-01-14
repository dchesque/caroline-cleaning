'use client'

import { useState, useMemo } from 'react'
import { addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { MonthView } from './month-view'
import { WeekView } from './week-view'
import { DayView } from './day-view'
import { AppointmentModal } from './appointment-modal'
import { AppointmentDetailModal } from './appointment-detail-modal'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type ViewType = 'month' | 'week' | 'day'

interface CalendarViewProps {
    appointments: any[]
    onRefresh: () => void
}

export function CalendarView({ appointments, onRefresh }: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [view, setView] = useState<ViewType>('month')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null)
    const [appointmentIdToEdit, setAppointmentIdToEdit] = useState<string | undefined>()

    const supabase = useMemo(() => createClient(), [])

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
        setSelectedAppointment(appointment)
        setIsDetailModalOpen(true)
    }

    const handleEditAppointment = (appointment: any) => {
        setAppointmentIdToEdit(appointment.id)
        setIsDetailModalOpen(false)
        setIsModalOpen(true)
    }

    const handleDeleteAppointment = async (appointment: any) => {
        if (!confirm('Tem certeza que deseja excluir este agendamento?')) return

        try {
            const { error } = await supabase
                .from('agendamentos')
                .delete()
                .eq('id', appointment.id)

            if (error) throw error
            toast.success('Agendamento excluído com sucesso!')
            setIsDetailModalOpen(false)
            onRefresh()
        } catch (error) {
            console.error('Error deleting appointment:', error)
            toast.error('Erro ao excluir agendamento')
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-2">
                    <Button variant="outline" size="icon" onClick={() => navigate('prev')}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 sm:flex-none sm:w-40 text-center font-medium">
                        {format(currentDate, view === 'day' ? 'MMM d, yyyy' : 'MMMM yyyy')}
                    </div>
                    <Button variant="outline" size="icon" onClick={() => navigate('next')}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" onClick={() => setCurrentDate(new Date())} className="hidden sm:inline-flex">
                        Hoje
                    </Button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Select value={view} onValueChange={(v) => setView(v as ViewType)}>
                        <SelectTrigger className="w-full sm:w-[120px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="month">Mês</SelectItem>
                            <SelectItem value="week">Semana</SelectItem>
                            <SelectItem value="day">Dia</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={() => setIsModalOpen(true)} className="bg-[#C48B7F] hover:bg-[#A66D60] flex-1 sm:flex-none">
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
                onOpenChange={(open) => {
                    setIsModalOpen(open)
                    if (!open) setAppointmentIdToEdit(undefined)
                }}
                selectedDate={selectedDate}
                appointmentId={appointmentIdToEdit}
                onSuccess={onRefresh}
            />

            <AppointmentDetailModal
                appointment={selectedAppointment}
                open={isDetailModalOpen}
                onOpenChange={setIsDetailModalOpen}
                onEdit={handleEditAppointment}
                onDelete={handleDeleteAppointment}
            />
        </div>
    )
}

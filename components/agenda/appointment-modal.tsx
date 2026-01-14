'use client'

import { useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Calendar, Loader2 } from 'lucide-react'
import { useAppointmentForm } from './appointment-form/use-appointment-form'
import { ClientSelector } from './appointment-form/client-selector'
import { DateTimeSection } from './appointment-form/date-time-section'
import { ServiceSection } from './appointment-form/service-section'
import { AddonSection } from './appointment-form/addon-section'
import { ValuesSection } from './appointment-form/values-section'
import { SummaryCard } from './appointment-form/summary-card'
import { NotesSection } from './appointment-form/notes-section'

interface AppointmentModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedDate?: Date
    appointmentId?: string
    preSelectedClientId?: string
    onSuccess?: () => void
}

export function AppointmentModal({
    open,
    onOpenChange,
    selectedDate,
    appointmentId,
    preSelectedClientId,
    onSuccess
}: AppointmentModalProps) {
    // Note: appointmentId support is not fully implemented in the hook yet as per original code, 
    // but the props are there for future editing support.

    const {
        formData,
        setFormData,
        clients,
        clientSearch,
        setClientSearch,
        selectedClient,
        setSelectedClient,
        serviceTypes,
        addonsDisponiveis,
        addonsSelecionados,
        toggleAddon,
        updateAddonQuantidade,
        handleServiceChange,
        handleSubmit,
        calculatedValues,
        duracaoTotal,
        calculateEndTime,
        isLoading,
        isSaving
    } = useAppointmentForm({
        open,
        onOpenChange,
        selectedDate,
        appointmentId,
        preSelectedClientId,
        onSuccess
    })

    const handleFormUpdate = useCallback((updates: Partial<typeof formData>) => {
        setFormData(prev => ({ ...prev, ...updates }))
    }, [setFormData])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-[#C48B7F]" />
                        {appointmentId ? 'Editar Agendamento' : 'Novo Agendamento'}
                    </DialogTitle>
                    <DialogDescription>
                        {appointmentId ? 'Altere os dados do agendamento' : 'Preencha os dados para criar um novo agendamento'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <ClientSelector
                        selectedClient={selectedClient}
                        onSelect={setSelectedClient}
                        clients={clients}
                        searchTerm={clientSearch}
                        onSearchChange={setClientSearch}
                        isLoading={isLoading}
                    />

                    <DateTimeSection
                        formData={formData}
                        onChange={handleFormUpdate}
                    />

                    <ServiceSection
                        formData={formData}
                        onChange={handleFormUpdate}
                        onServiceChange={handleServiceChange}
                        serviceTypes={serviceTypes}
                    />

                    <AddonSection
                        addonsDisponiveis={addonsDisponiveis}
                        addonsSelecionados={addonsSelecionados}
                        toggleAddon={toggleAddon}
                        updateAddonQuantidade={updateAddonQuantidade}
                    />

                    <ValuesSection
                        formData={formData}
                        onChange={handleFormUpdate}
                    />

                    <SummaryCard
                        calculations={calculatedValues}
                        duracaoTotal={duracaoTotal}
                        horarioInicio={formData.horario_inicio}
                        horarioFim={calculateEndTime(formData.horario_inicio, duracaoTotal)}
                        addonsCount={addonsSelecionados.length}
                    />

                    <NotesSection
                        notes={formData.notas}
                        onChange={(notes) => handleFormUpdate({ notas: notes })}
                    />

                    {/* Botões */}
                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="bg-[#C48B7F] hover:bg-[#A66D60]"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                appointmentId ? 'Salvar Alterações' : 'Criar Agendamento'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
export const APP_NAME = "Caroline Premium Cleaning";
export const APP_DESCRIPTION = "Professional cleaning, instantly scheduled.";

export const STATUS_CONFIG = {
    cliente: {
        lead: { label: 'Lead', variant: 'secondary' as const },
        ativo: { label: 'Ativo', variant: 'success' as const },
        pausado: { label: 'Pausado', variant: 'warning' as const },
        cancelado: { label: 'Cancelado', variant: 'destructive' as const },
        inativo: { label: 'Inativo', variant: 'outline' as const },
    },
    agendamento: {
        agendado: { label: 'Agendado', variant: 'secondary' as const },
        confirmado: { label: 'Confirmado', variant: 'success' as const },
        em_andamento: { label: 'Em Andamento', variant: 'warning' as const },
        concluido: { label: 'Concluído', variant: 'default' as const },
        cancelado: { label: 'Cancelado', variant: 'destructive' as const },
    },
}

export const SERVICE_TYPES = [
    { value: 'visit', label: 'Visita de Orçamento' },
    { value: 'regular', label: 'Limpeza Regular' },
    { value: 'deep', label: 'Limpeza Profunda' },
    { value: 'move_in_out', label: 'Move-in/Move-out' },
]

export const FREQUENCIES = [
    { value: 'weekly', label: 'Semanal' },
    { value: 'biweekly', label: 'Quinzenal' },
    { value: 'monthly', label: 'Mensal' },
]

export const WEEKDAYS = [
    { value: 'monday', label: 'Segunda' },
    { value: 'tuesday', label: 'Terça' },
    { value: 'wednesday', label: 'Quarta' },
    { value: 'thursday', label: 'Quinta' },
    { value: 'friday', label: 'Sexta' },
    { value: 'saturday', label: 'Sábado' },
]

'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Users2, Calendar as CalendarIcon, ChevronDown, Loader2 } from 'lucide-react'

interface AppointmentModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedDate?: Date
    appointmentId?: string
    onSuccess?: () => void
}

const WEEKDAYS = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' },
]

export function AppointmentModal({ open, onOpenChange, selectedDate, appointmentId, onSuccess }: AppointmentModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [clients, setClients] = useState<any[]>([])
    const [teamMembers, setTeamMembers] = useState<any[]>([])
    const [selectedTeam, setSelectedTeam] = useState<string[]>([])

    // Recurrence State
    const [isRecurring, setIsRecurring] = useState(false)
    const [recurrenceDays, setRecurrenceDays] = useState<string[]>(['monday'])
    const [dailyServices, setDailyServices] = useState<Record<string, string>>({})

    const [formData, setFormData] = useState({
        cliente_id: '',
        data: '',
        horario: '09:00',
        duracao_estimada: '2',
        tipo_servico: 'regular',
        status: 'agendado',
        valor: '',
        notas: '',
        frequencia: 'weekly'
    })

    const supabase = createClient()

    useEffect(() => {
        if (open) {
            if (selectedDate) {
                setFormData(prev => ({
                    ...prev,
                    data: selectedDate.toISOString().split('T')[0]
                }))
                // Default recurrence day to selected day
                const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
                setRecurrenceDays([dayName])
            }
            fetchData()
        }
    }, [open, selectedDate])

    const fetchData = async () => {
        // Fetch Clients
        const { data: clientsData } = await supabase.from('clientes').select('id, nome').order('nome')
        if (clientsData) setClients(clientsData)

        // Fetch Team
        const { data: teamData } = await supabase.from('equipe').select('id, nome, cor').eq('ativo', true).order('nome')
        if (teamData) setTeamMembers(teamData)
    }

    const toggleTeamMember = (memberId: string) => {
        setSelectedTeam(prev =>
            prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        )
    }

    const toggleRecurrenceDay = (day: string) => {
        setRecurrenceDays(prev => {
            const newDays = prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day]

            // Initialize service for new day if needed
            if (!prev.includes(day) && !dailyServices[day]) {
                setDailyServices(ds => ({ ...ds, [day]: formData.tipo_servico }))
            }

            return newDays
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            if (isRecurring) {
                // Create Recurrence logic
                const servicesList = recurrenceDays.map(day => ({
                    dia: day,
                    tipo: dailyServices[day] || formData.tipo_servico,
                    horario: formData.horario, // Simplified: same time for all
                    valor: parseFloat(formData.valor) || 0
                }))

                const { error } = await supabase
                    .from('recorrencias')
                    .insert({
                        cliente_id: formData.cliente_id,
                        frequencia: formData.frequencia,
                        dia_preferido: recurrenceDays[0], // Primary day
                        dias_semana: recurrenceDays,
                        servicos_por_dia: servicesList,
                        tipo_servico: formData.tipo_servico,
                        horario_preferido: formData.horario,
                        duracao_estimada_minutos: parseInt(formData.duracao_estimada) * 60,
                        valor_acordado: parseFloat(formData.valor) || 0,
                        ativo: true
                    })

                if (error) throw error
                toast.success('Recorrência criada com sucesso!')

            } else {
                // Create Single Appointment
                const dateTime = new Date(`${formData.data}T${formData.horario}`)

                const payload = {
                    cliente_id: formData.cliente_id,
                    data: formData.data,
                    horario_inicio: formData.horario,
                    horario_fim_estimado: calculateEndTime(formData.horario, formData.duracao_estimada),
                    duracao_minutos: parseInt(formData.duracao_estimada) * 60,
                    tipo: formData.tipo_servico,
                    status: formData.status,
                    valor: parseFloat(formData.valor) || null,
                    notas: formData.notas || null
                }

                // 1. Insert Appointment
                const { data: appointment, error } = await supabase
                    .from('agendamentos')
                    .insert([payload])
                    .select()
                    .single()

                if (error) throw error

                // 2. Insert Team Members
                if (selectedTeam.length > 0) {
                    const inserts = selectedTeam.map(memberId => ({
                        agendamento_id: appointment.id,
                        membro_id: memberId,
                        funcao: 'cleaner'
                    }))

                    const { error: teamError } = await supabase
                        .from('agendamento_equipe')
                        .insert(inserts)

                    if (teamError) console.error('Error adding team:', teamError)
                }

                toast.success('Agendamento criado com sucesso!')
            }

            onOpenChange(false)
            onSuccess?.()
        } catch (error) {
            console.error(error)
            toast.error('Erro ao salvar')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isRecurring ? 'Nova Recorrência' : 'Novo Agendamento'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="flex items-center gap-2 mb-4 p-2 bg-secondary/20 rounded-lg">
                        <Switch
                            checked={isRecurring}
                            onCheckedChange={setIsRecurring}
                            id="recurrence-mode"
                        />
                        <Label htmlFor="recurrence-mode" className="cursor-pointer">
                            Configurar como Recorrência/Contrato?
                        </Label>
                    </div>

                    <div className="space-y-2">
                        <Label>Cliente</Label>
                        <Select
                            value={formData.cliente_id}
                            onValueChange={(v) => setFormData({ ...formData, cliente_id: v })}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um cliente" />
                            </SelectTrigger>
                            <SelectContent>
                                {clients.map(client => (
                                    <SelectItem key={client.id} value={client.id}>{client.nome}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {!isRecurring ? (
                        /* Single Appointment Fields */
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Data</Label>
                                <Input
                                    type="date"
                                    value={formData.data}
                                    onChange={e => setFormData({ ...formData, data: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Horário</Label>
                                <Input
                                    type="time"
                                    value={formData.horario}
                                    onChange={e => setFormData({ ...formData, horario: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                    ) : (
                        /* Recurrence Fields */
                        <div className="space-y-4 border p-3 rounded-md">
                            <div className="space-y-2">
                                <Label>Frequência</Label>
                                <Select
                                    value={formData.frequencia}
                                    onValueChange={(v) => setFormData({ ...formData, frequencia: v })}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="weekly">Semanal</SelectItem>
                                        <SelectItem value="biweekly">Quinzenal</SelectItem>
                                        <SelectItem value="monthly">Mensal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Dias da Semana</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {WEEKDAYS.map(day => (
                                        <div key={day.value} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`day-${day.value}`}
                                                checked={recurrenceDays.includes(day.value)}
                                                onCheckedChange={() => toggleRecurrenceDay(day.value)}
                                            />
                                            <label
                                                htmlFor={`day-${day.value}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                {day.label.slice(0, 3)}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Common Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Duração (h)</Label>
                            <Input
                                type="number"
                                min="1"
                                value={formData.duracao_estimada}
                                onChange={e => setFormData({ ...formData, duracao_estimada: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Valor ($)</Label>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.valor}
                                onChange={e => setFormData({ ...formData, valor: e.target.value })}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Tipo de Serviço (Padrão)</Label>
                        <Select
                            value={formData.tipo_servico}
                            onValueChange={(v) => setFormData({ ...formData, tipo_servico: v })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="regular">Limpeza Regular</SelectItem>
                                <SelectItem value="deep">Limpeza Profunda</SelectItem>
                                <SelectItem value="move_in_out">Move-in/Move-out</SelectItem>
                                <SelectItem value="visit">Visita de Orçamento</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Team Selection */}
                    {!isRecurring && (
                        <div className="space-y-2">
                            <Label>Equipe</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between">
                                        <span className="flex items-center gap-2">
                                            <Users2 className="w-4 h-4" />
                                            {selectedTeam.length > 0
                                                ? `${selectedTeam.length} selecionados`
                                                : "Selecionar equipe"}
                                        </span>
                                        <ChevronDown className="w-4 h-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0" align="start">
                                    <ScrollArea className="h-[200px] p-4">
                                        <div className="space-y-2">
                                            {teamMembers.length === 0 && <p className="text-sm text-muted-foreground">Nenhum membro encontrado.</p>}
                                            {teamMembers.map((member) => (
                                                <div key={member.id} className="flex items-center space-x-2 p-1 hover:bg-secondary/10 rounded">
                                                    <Checkbox
                                                        id={`team-${member.id}`}
                                                        checked={selectedTeam.includes(member.id)}
                                                        onCheckedChange={() => toggleTeamMember(member.id)}
                                                    />
                                                    <label
                                                        htmlFor={`team-${member.id}`}
                                                        className="text-sm font-medium leading-none flex-1 cursor-pointer flex items-center gap-2"
                                                    >
                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: member.cor }} />
                                                        {member.nome}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </PopoverContent>
                            </Popover>
                            {selectedTeam.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {selectedTeam.map(id => {
                                        const member = teamMembers.find(m => m.id === id)
                                        return member ? (
                                            <Badge key={id} variant="secondary" className="gap-1 bg-secondary/20">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: member.cor }} />
                                                {member.nome}
                                            </Badge>
                                        ) : null
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Notas</Label>
                        <Input
                            value={formData.notas}
                            onChange={e => setFormData({ ...formData, notas: e.target.value })}
                            placeholder="Instruções de entrada, código, etc."
                        />
                    </div>

                    <Button type="submit" className="w-full bg-[#C48B7F] hover:bg-[#A66D60] mt-4" disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isRecurring ? 'Criar Recorrência' : 'Agendar')}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function calculateEndTime(startTime: string, durationHours: string): string {
    const [hours, minutes] = startTime.split(':').map(Number)
    const durationMins = parseFloat(durationHours) * 60
    const endDate = new Date()
    endDate.setHours(hours, minutes + durationMins)
    return endDate.toTimeString().slice(0, 5)
}

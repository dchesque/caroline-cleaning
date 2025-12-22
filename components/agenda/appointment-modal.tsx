'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Search } from 'lucide-react'
import { format } from 'date-fns'

interface AppointmentModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedDate?: Date
    appointmentId?: string
    preSelectedClientId?: string
    onSuccess?: () => void
}

// TIPOS_SERVICO removido em favor de busca dinâmica do banco

const STATUS_OPTIONS = [
    { value: 'agendado', label: 'Agendado' },
    { value: 'confirmado', label: 'Confirmado' },
    { value: 'em_andamento', label: 'Em Andamento' },
    { value: 'concluido', label: 'Concluído' },
    { value: 'cancelado', label: 'Cancelado' },
]

const HORARIOS = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
]

export function AppointmentModal({
    open,
    onOpenChange,
    selectedDate,
    appointmentId,
    preSelectedClientId,
    onSuccess
}: AppointmentModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [clients, setClients] = useState<any[]>([])
    const [serviceTypes, setServiceTypes] = useState<any[]>([])
    const [clientSearch, setClientSearch] = useState('')
    const [selectedClient, setSelectedClient] = useState<any>(null)

    const [formData, setFormData] = useState({
        cliente_id: '',
        data: '',
        horario_inicio: '09:00',
        duracao_minutos: '180',
        tipo: '',
        status: 'agendado',
        valor: '',
        notas: ''
    })

    const supabase = createClient()

    // Reset form and handle pre-selection when modal opens
    useEffect(() => {
        const fetchPreSelectedClient = async () => {
            if (preSelectedClientId) {
                const { data } = await supabase
                    .from('clientes')
                    .select('id, nome, telefone, endereco_completo')
                    .eq('id', preSelectedClientId)
                    .single()

                if (data) {
                    setSelectedClient(data)
                }
            }
        }

        if (open) {
            if (selectedDate) {
                setFormData(prev => ({
                    ...prev,
                    data: format(selectedDate, 'yyyy-MM-dd')
                }))
            }

            // Only reset if NOT pre-selected
            if (!preSelectedClientId) {
                setSelectedClient(null)
            } else {
                fetchPreSelectedClient()
            }

            setClientSearch('')
        }
    }, [open, selectedDate, preSelectedClientId])

    // Fetch service types
    useEffect(() => {
        const fetchServiceTypes = async () => {
            const { data, error } = await supabase
                .from('servicos_tipos')
                .select('codigo, nome, duracao_base_minutos')
                .eq('ativo', true)
                .order('ordem')

            if (data) {
                setServiceTypes(data)
                // Set first service as default if none selected
                if (data.length > 0 && !formData.tipo) {
                    setFormData(prev => ({ ...prev, tipo: data[0].codigo }))
                }
            } else if (error) {
                console.error('Error fetching services:', JSON.stringify(error, null, 2))
            }
        }

        fetchServiceTypes()
    }, [])

    // Search clients
    useEffect(() => {
        const searchClients = async () => {
            if (clientSearch.length < 2) {
                setClients([])
                return
            }

            setIsLoading(true)
            const { data } = await supabase
                .from('clientes')
                .select('id, nome, telefone, endereco_completo')
                .or(`nome.ilike.%${clientSearch}%,telefone.ilike.%${clientSearch}%`)
                .limit(5)

            setClients(data || [])
            setIsLoading(false)
        }

        const debounce = setTimeout(searchClients, 300)
        return () => clearTimeout(debounce)
    }, [clientSearch])

    // Calculate end time
    const calculateEndTime = (startTime: string, durationMinutes: number): string => {
        const [hours, minutes] = startTime.split(':').map(Number)
        const totalMinutes = hours * 60 + minutes + durationMinutes
        const endHours = Math.floor(totalMinutes / 60)
        const endMinutes = totalMinutes % 60
        return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!selectedClient) {
            toast.error('Selecione um cliente')
            return
        }

        if (!formData.data) {
            toast.error('Selecione uma data')
            return
        }

        setIsSaving(true)

        try {
            const durationMinutes = parseInt(formData.duracao_minutos) || 180
            const horarioFim = calculateEndTime(formData.horario_inicio, durationMinutes)

            // Payload com nomes CORRETOS das colunas do banco
            const payload = {
                cliente_id: selectedClient.id,
                data: formData.data,                          // DATE 'YYYY-MM-DD'
                horario_inicio: formData.horario_inicio,      // TIME 'HH:MM'
                horario_fim_estimado: horarioFim,             // TIME 'HH:MM'
                duracao_minutos: durationMinutes,             // INTEGER
                tipo: formData.tipo,                          // TEXT (não tipo_servico!)
                status: formData.status,
                valor: parseFloat(formData.valor) || null,
                notas: formData.notas.trim() || null
            }

            const { error } = await supabase
                .from('agendamentos')
                .insert([payload])

            if (error) throw error

            toast.success('Agendamento criado com sucesso!')
            onOpenChange(false)
            onSuccess?.()

        } catch (error) {
            console.error('Error creating appointment:', error)
            toast.error('Erro ao criar agendamento')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Novo Agendamento</DialogTitle>
                    <DialogDescription>
                        Preencha os dados para criar um novo agendamento
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Client Search */}
                    <div className="space-y-2">
                        <Label>Cliente *</Label>
                        {selectedClient ? (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium text-green-800">{selectedClient.nome}</p>
                                        <p className="text-sm text-green-600">{selectedClient.telefone}</p>
                                        <p className="text-xs text-green-600">{selectedClient.endereco_completo}</p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedClient(null)}
                                    >
                                        Alterar
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        value={clientSearch}
                                        onChange={e => setClientSearch(e.target.value)}
                                        placeholder="Buscar por nome ou telefone..."
                                        className="pl-10"
                                    />
                                </div>
                                {isLoading && (
                                    <div className="flex justify-center py-2">
                                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                    </div>
                                )}
                                {clients.length > 0 && (
                                    <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                                        {clients.map(client => (
                                            <div
                                                key={client.id}
                                                className="p-2 hover:bg-gray-50 cursor-pointer"
                                                onClick={() => {
                                                    setSelectedClient(client)
                                                    setClientSearch('')
                                                    setClients([])
                                                }}
                                            >
                                                <p className="font-medium text-sm">{client.nome}</p>
                                                <p className="text-xs text-gray-500">{client.telefone}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Data *</Label>
                            <Input
                                type="date"
                                value={formData.data}
                                onChange={e => setFormData(prev => ({ ...prev, data: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Horário *</Label>
                            <Select
                                value={formData.horario_inicio}
                                onValueChange={v => setFormData(prev => ({ ...prev, horario_inicio: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {HORARIOS.map(h => (
                                        <SelectItem key={h} value={h}>{h}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Service Type and Duration */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tipo de Serviço</Label>
                            <Select
                                value={formData.tipo}
                                onValueChange={v => setFormData(prev => ({ ...prev, tipo: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um serviço" />
                                </SelectTrigger>
                                <SelectContent>
                                    {serviceTypes.map(t => (
                                        <SelectItem key={t.codigo} value={t.codigo}>
                                            {t.nome}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Duração (minutos)</Label>
                            <Select
                                value={formData.duracao_minutos}
                                onValueChange={v => setFormData(prev => ({ ...prev, duracao_minutos: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="60">1 hora</SelectItem>
                                    <SelectItem value="90">1h 30min</SelectItem>
                                    <SelectItem value="120">2 horas</SelectItem>
                                    <SelectItem value="150">2h 30min</SelectItem>
                                    <SelectItem value="180">3 horas</SelectItem>
                                    <SelectItem value="210">3h 30min</SelectItem>
                                    <SelectItem value="240">4 horas</SelectItem>
                                    <SelectItem value="300">5 horas</SelectItem>
                                    <SelectItem value="360">6 horas</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Value and Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Valor ($)</Label>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.valor}
                                onChange={e => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                                placeholder="150.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={v => setFormData(prev => ({ ...prev, status: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map(s => (
                                        <SelectItem key={s.value} value={s.value}>
                                            {s.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label>Notas</Label>
                        <Textarea
                            value={formData.notas}
                            onChange={e => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                            placeholder="Observações sobre o agendamento..."
                            rows={3}
                        />
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSaving || !selectedClient}
                            className="bg-[#C48B7F] hover:bg-[#A66D60]"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                'Criar Agendamento'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

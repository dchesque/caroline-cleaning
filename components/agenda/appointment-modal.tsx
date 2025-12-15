'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface AppointmentModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedDate?: Date
    appointmentId?: string
    onSuccess?: () => void
}

export function AppointmentModal({ open, onOpenChange, selectedDate, appointmentId, onSuccess }: AppointmentModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [clients, setClients] = useState<any[]>([])
    const [formData, setFormData] = useState({
        cliente_id: '',
        data: '',
        horario: '09:00',
        duracao_estimada: '2',
        tipo_servico: 'regular',
        status: 'agendado',
        valor: '',
        notas: ''
    })
    const supabase = createClient()

    useEffect(() => {
        if (open) {
            if (selectedDate) {
                setFormData(prev => ({
                    ...prev,
                    data: selectedDate.toISOString().split('T')[0]
                }))
            }
            fetchClients()
        }
    }, [open, selectedDate])

    const fetchClients = async () => {
        const { data } = await supabase.from('clientes').select('id, nome').order('nome')
        if (data) setClients(data)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const dateTime = new Date(`${formData.data}T${formData.horario}`)

            const payload = {
                cliente_id: formData.cliente_id,
                data: dateTime.toISOString(),
                duracao_estimada: parseInt(formData.duracao_estimada),
                tipo_servico: formData.tipo_servico,
                status: formData.status,
                valor: parseFloat(formData.valor) || 0,
                notas: formData.notas
            }

            const { error } = await supabase
                .from('agendamentos')
                .insert([payload])

            if (error) throw error

            toast.success('Agendamento criado com sucesso!')
            onOpenChange(false)
            onSuccess?.()
        } catch (error) {
            console.error(error)
            toast.error('Erro ao criar agendamento')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Novo Agendamento</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="cliente">Cliente</Label>
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
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Tipo de Serviço</Label>
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

                    <Button type="submit" className="w-full bg-[#C48B7F] hover:bg-[#A66D60]" disabled={isLoading}>
                        {isLoading ? 'Salvando...' : 'Criar Agendamento'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}

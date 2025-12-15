'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import {
    ArrowLeft,
    CalendarIcon,
    Search,
    User,
    MapPin,
    Save,
    Send,
    Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { SERVICE_TYPES, FREQUENCIES, WEEKDAYS } from '@/lib/constants'

export default function NovoContratoPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const clienteIdParam = searchParams.get('cliente_id')
    const [isLoading, setIsLoading] = useState(false)

    // Client Search State
    const [clientSearch, setClientSearch] = useState('')
    const [clients, setClients] = useState<any[]>([])
    const [selectedClient, setSelectedClient] = useState<any>(null)

    // Form State
    const [formData, setFormData] = useState({
        numero: '',
        tipo_servico: 'regular_cleaning',
        frequencia: 'weekly',
        dia_preferido: 'monday',
        horario_preferido: '09:00',
        valor_acordado: '',
        data_inicio: new Date(),
        duracao_estimada_minutos: '180',
        observacoes: '',
        termos_aceitos: false,
        documento_url: null,
    })

    const [isSaving, setIsSaving] = useState(false)
    const supabase = createClient()

    // Initialize
    useEffect(() => {
        // Generate temporary contract number
        const year = new Date().getFullYear()
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
        setFormData(prev => ({ ...prev, numero: `CC-${year}-${random}` }))

        // Load client if param exists
        // Load client if param exists
        if (clienteIdParam) {
            const loadClient = async () => {
                const { data } = await supabase
                    .from('clientes')
                    .select('*')
                    .eq('id', clienteIdParam)
                    .single()

                if (data) {
                    setSelectedClient(data)
                    // Prefill logic
                    setFormData(prev => ({
                        ...prev,
                        tipo_servico: data.tipo_servico_padrao || 'regular_cleaning',
                        frequencia: data.frequencia || 'weekly',
                        dia_preferido: data.dia_preferido || 'monday',
                        horario_preferido: data.horario_preferido || '09:00',
                    }))
                }
            }
            loadClient()
        }
    }, [clienteIdParam])

    // Search clients
    useEffect(() => {
        const searchClients = async () => {
            if (clientSearch.length < 2) {
                setClients([])
                return
            }

            const { data } = await supabase
                .from('clientes')
                .select('id, nome, telefone, email, endereco_completo')
                .or(`nome.ilike.%${clientSearch}%,email.ilike.%${clientSearch}%`)
                .limit(5)

            setClients(data || [])
        }

        const debounce = setTimeout(searchClients, 300)
        return () => clearTimeout(debounce)
    }, [clientSearch])

    const handleSave = async (sendToClient: boolean = false) => {
        if (!selectedClient) {
            toast.error('Selecione um cliente')
            return
        }

        if (!formData.valor_acordado) {
            toast.error('Defina o valor do contrato')
            return
        }

        setIsSaving(true)

        try {
            // 1. Create Contract
            const { data: contract, error: contractError } = await supabase
                .from('contratos')
                .insert({
                    numero: formData.numero,
                    cliente_id: selectedClient.id,
                    tipo_servico: formData.tipo_servico,
                    frequencia: formData.frequencia,
                    dia_preferido: formData.dia_preferido,
                    horario_preferido: formData.horario_preferido,
                    valor_acordado: parseFloat(formData.valor_acordado),
                    data_inicio: format(formData.data_inicio, 'yyyy-MM-dd'),
                    duracao_estimada_minutos: parseInt(formData.duracao_estimada_minutos),
                    status: sendToClient ? 'enviado' : 'rascunho',
                    observacoes: formData.observacoes,
                    enviado_em: sendToClient ? new Date().toISOString() : null,
                })
                .select()
                .single()

            if (contractError) throw contractError

            // 2. Create Recurrence (if sent)
            if (sendToClient) {
                const { error: recurrenceError } = await supabase
                    .from('recorrencias')
                    .insert({
                        cliente_id: selectedClient.id,
                        frequencia: formData.frequencia,
                        dia_preferido: formData.dia_preferido,
                        horario_preferido: formData.horario_preferido,
                        tipo_servico: formData.tipo_servico,
                        valor_base: parseFloat(formData.valor_acordado),
                        ativo: true,
                        inicio_em: format(formData.data_inicio, 'yyyy-MM-dd'),
                    })

                if (recurrenceError) throw recurrenceError
            }

            toast.success(sendToClient ? 'Contrato enviado com sucesso!' : 'Rascunho salvo!')
            router.push('/admin/contratos')

        } catch (error) {
            console.error('Error saving contract:', error)
            toast.error('Erro ao salvar contrato')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="font-heading text-h2 text-foreground">Novo Contrato</h1>
                    <p className="text-body text-muted-foreground">
                        {formData.numero}
                    </p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Client Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-h4">
                                <User className="w-5 h-5 text-muted-foreground" />
                                Cliente
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {selectedClient ? (
                                <div className="flex items-start justify-between p-4 bg-desert-storm rounded-lg">
                                    <div>
                                        <p className="font-semibold text-h4">{selectedClient.nome}</p>
                                        <p className="text-body text-muted-foreground">{selectedClient.email}</p>
                                        <p className="text-body text-muted-foreground">{selectedClient.telefone}</p>
                                        <div className="flex items-center gap-2 mt-2 text-body-sm text-muted-foreground">
                                            <MapPin className="w-4 h-4" />
                                            {selectedClient.endereco_completo}
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedClient(null)}>
                                        Alterar
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar cliente por nome ou email..."
                                            value={clientSearch}
                                            onChange={(e) => setClientSearch(e.target.value)}
                                            className="pl-9"
                                        />
                                        {clients.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-pampas rounded-lg shadow-lg z-10 max-h-[200px] overflow-y-auto">
                                                {clients.map((client) => (
                                                    <button
                                                        key={client.id}
                                                        className="w-full px-4 py-3 text-left hover:bg-desert-storm border-b border-pampas last:border-0"
                                                        onClick={() => {
                                                            setSelectedClient(client)
                                                            setClientSearch('')
                                                            setClients([])
                                                        }}
                                                    >
                                                        <p className="font-medium">{client.nome}</p>
                                                        <p className="text-caption text-muted-foreground">{client.email}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-center text-body-sm text-muted-foreground">
                                        ou <Link href="/admin/clientes/novo" className="text-brandy-rose-600 hover:underline">cadastre um novo cliente</Link>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Service Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-h4">Detalhes do Serviço</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Tipo de Serviço</Label>
                                    <Select
                                        value={formData.tipo_servico}
                                        onValueChange={(value) => setFormData({ ...formData, tipo_servico: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SERVICE_TYPES.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Frequência</Label>
                                    <Select
                                        value={formData.frequencia}
                                        onValueChange={(value) => setFormData({ ...formData, frequencia: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {FREQUENCIES.map((freq) => (
                                                <SelectItem key={freq.value} value={freq.value}>
                                                    {freq.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Dia Preferido</Label>
                                    <Select
                                        value={formData.dia_preferido}
                                        onValueChange={(value) => setFormData({ ...formData, dia_preferido: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {WEEKDAYS.map((day) => (
                                                <SelectItem key={day.value} value={day.value}>
                                                    {day.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Horário Preferido</Label>
                                    <Input
                                        type="time"
                                        value={formData.horario_preferido}
                                        onChange={(e) => setFormData({ ...formData, horario_preferido: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Data de Início</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {format(formData.data_inicio, 'dd/MM/yyyy')}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={formData.data_inicio}
                                                onSelect={(date) => date && setFormData({ ...formData, data_inicio: date })}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="space-y-2">
                                    <Label>Duração Estimada (min)</Label>
                                    <Input
                                        type="number"
                                        step="30"
                                        value={formData.duracao_estimada_minutos}
                                        onChange={(e) => setFormData({ ...formData, duracao_estimada_minutos: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Valor Acordado ($)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        className="pl-7"
                                        placeholder="0.00"
                                        value={formData.valor_acordado}
                                        onChange={(e) => setFormData({ ...formData, valor_acordado: e.target.value })}
                                    />
                                </div>
                                <p className="text-caption text-muted-foreground">Valor por visita/serviço</p>
                            </div>

                            <div className="space-y-2">
                                <Label>Observações Internas</Label>
                                <Textarea
                                    placeholder="Instruções especiais, condições, etc."
                                    value={formData.observacoes}
                                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Summary Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-h4">Resumo</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-body-sm">
                                    <span className="text-muted-foreground">Valor por serviço</span>
                                    <span className="font-medium">
                                        {formData.valor_acordado ? `$${formData.valor_acordado}` : '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-body-sm">
                                    <span className="text-muted-foreground">Frequência</span>
                                    <span className="font-medium">
                                        {FREQUENCIES.find(f => f.value === formData.frequencia)?.label}
                                    </span>
                                </div>
                                <div className="flex justify-between text-body-sm">
                                    <span className="text-muted-foreground">Est. mensal</span>
                                    <span className="font-semibold text-brandy-rose-600">
                                        {formData.valor_acordado ?
                                            `$${(parseFloat(formData.valor_acordado) *
                                                (formData.frequencia === 'weekly' ? 4 :
                                                    formData.frequencia === 'biweekly' ? 2 : 1)).toFixed(2)}`
                                            : '-'}
                                    </span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-pampas">
                                <div className="flex items-start space-x-2">
                                    <Checkbox
                                        id="termos"
                                        checked={formData.termos_aceitos}
                                        onCheckedChange={(checked) =>
                                            setFormData({ ...formData, termos_aceitos: checked as boolean })
                                        }
                                    />
                                    <Label htmlFor="termos" className="text-caption leading-tight">
                                        Confirmo que os termos e valores estão corretos e o cliente foi informado.
                                    </Label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="space-y-3">
                        <Button
                            className="w-full gap-2"
                            onClick={() => handleSave(true)}
                            disabled={isSaving || !selectedClient || !formData.valor_acordado}
                        >
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            Criar e Enviar
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full gap-2"
                            onClick={() => handleSave(false)}
                            disabled={isSaving || !selectedClient}
                        >
                            <Save className="w-4 h-4" />
                            Salvar Rascunho
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

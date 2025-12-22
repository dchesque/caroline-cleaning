'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Search, X, Clock, DollarSign, Package, Sparkles, Calendar, User } from 'lucide-react'
import { format } from 'date-fns'

interface AppointmentModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedDate?: Date
    appointmentId?: string
    preSelectedClientId?: string
    onSuccess?: () => void
}

interface ServicoTipo {
    id: string
    codigo: string
    nome: string
    multiplicador_preco: number
    duracao_base_minutos: number
    cor: string | null
    ativo: boolean
}

interface Addon {
    id: string
    codigo: string
    nome: string
    preco: number
    tipo_cobranca: string
    minutos_adicionais: number
    ativo: boolean
}

interface AddonSelecionado {
    codigo: string
    nome: string
    preco: number
    quantidade: number
}

const STATUS_OPTIONS = [
    { value: 'agendado', label: 'Agendado' },
    { value: 'confirmado', label: 'Confirmado' },
    { value: 'em_andamento', label: 'Em Andamento' },
    { value: 'concluido', label: 'Concluído' },
    { value: 'cancelado', label: 'Cancelado' },
]

const HORARIOS = [
    '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
]

const DURACOES = [
    { value: '60', label: '1 hora' },
    { value: '90', label: '1h 30min' },
    { value: '120', label: '2 horas' },
    { value: '150', label: '2h 30min' },
    { value: '180', label: '3 horas' },
    { value: '210', label: '3h 30min' },
    { value: '240', label: '4 horas' },
    { value: '300', label: '5 horas' },
    { value: '360', label: '6 horas' },
]

// Funções de formatação inline (caso lib/formatters não exista)
const formatCurrencyUSD = (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num)) return '$0.00'
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(num)
}

const formatCurrencyInput = (value: string): string => {
    let cleaned = value.replace(/[^0-9.]/g, '')
    const parts = cleaned.split('.')
    if (parts.length > 2) {
        cleaned = parts[0] + '.' + parts.slice(1).join('')
    }
    if (parts.length === 2 && parts[1].length > 2) {
        cleaned = parts[0] + '.' + parts[1].slice(0, 2)
    }
    return cleaned
}

const parseCurrency = (value: string): number => {
    const cleaned = value.replace(/[^0-9.]/g, '')
    return parseFloat(cleaned) || 0
}

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
    const [serviceTypes, setServiceTypes] = useState<ServicoTipo[]>([])
    const [addonsDisponiveis, setAddonsDisponiveis] = useState<Addon[]>([])
    const [clientSearch, setClientSearch] = useState('')
    const [selectedClient, setSelectedClient] = useState<any>(null)
    const [addonsSelecionados, setAddonsSelecionados] = useState<AddonSelecionado[]>([])
    const [dataLoaded, setDataLoaded] = useState(false)

    const [formData, setFormData] = useState({
        data: '',
        horario_inicio: '09:00',
        duracao_minutos: '180',
        tipo: '',
        status: 'agendado',
        valor: '',
        desconto_percentual: '0',
        notas: ''
    })

    const supabase = createClient()

    // Carregar dados estáticos apenas uma vez
    useEffect(() => {
        let mounted = true
        const fetchData = async () => {
            const [servicosRes, addonsRes] = await Promise.all([
                supabase.from('servicos_tipos').select('*').eq('ativo', true).order('ordem'),
                supabase.from('addons').select('*').eq('ativo', true).order('ordem')
            ])

            if (!mounted) return

            if (servicosRes.data) setServiceTypes(servicosRes.data)
            if (addonsRes.data) setAddonsDisponiveis(addonsRes.data)
            setDataLoaded(true)
        }
        fetchData()
        return () => { mounted = false }
    }, [])

    // Controlar reset e inicialização quando o modal abre
    useEffect(() => {
        if (!open) return

        const init = async () => {
            // Se já temos tipo selecionado e o modal está aberto, evitamos resetar tudo
            // A menos que seja desejado resetar sempre que abrir

            setFormData({
                data: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
                horario_inicio: '09:00',
                duracao_minutos: '180',
                tipo: serviceTypes.length > 0 ? serviceTypes[0].codigo : '',
                status: 'agendado',
                valor: '',
                desconto_percentual: '0',
                notas: ''
            })

            setAddonsSelecionados([])
            setClientSearch('')
            setClients([])

            if (preSelectedClientId) {
                const { data } = await supabase
                    .from('clientes')
                    .select('id, nome, telefone, endereco_completo')
                    .eq('id', preSelectedClientId)
                    .single()

                if (data) setSelectedClient(data)
            } else {
                setSelectedClient(null)
            }
        }

        init()
        // Importante: Dependências reduzidas para evitar loops. 
        // serviceTypes não está aqui propositalmente para não resetar form se eles carregarem depois.
        // O efeito abaixo cuida de setar o tipo se ele carregar tardiamente.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, selectedDate, preSelectedClientId])

    // Efeito colateral seguro para preencher tipo default quando serviços carregarem
    useEffect(() => {
        if (open && dataLoaded && serviceTypes.length > 0) {
            setFormData(prev => {
                // Só atualiza se ainda não tiver tipo
                if (!prev.tipo) {
                    return { ...prev, tipo: serviceTypes[0].codigo }
                }
                return prev
            })
        }
    }, [dataLoaded, serviceTypes, open])

    // Buscar clientes com debounce
    useEffect(() => {
        if (clientSearch.length < 2) {
            setClients([])
            return
        }

        const searchClients = async () => {
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

    // Calcular valores (useMemo para evitar recálculos desnecessários)
    const calculatedValues = useMemo(() => {
        const valorBase = parseCurrency(formData.valor) || 0
        const valorAddons = addonsSelecionados.reduce((acc, a) => acc + (a.preco * a.quantidade), 0)
        const subtotal = valorBase + valorAddons
        const desconto = parseCurrency(formData.desconto_percentual) || 0
        const valorDesconto = subtotal * (desconto / 100)
        const valorFinal = subtotal - valorDesconto

        return { valorBase, valorAddons, subtotal, desconto, valorDesconto, valorFinal }
    }, [formData.valor, formData.desconto_percentual, addonsSelecionados])

    // Calcular duração total
    const duracaoTotal = useMemo(() => {
        const duracaoBase = parseInt(formData.duracao_minutos) || 180
        const duracaoAddons = addonsSelecionados.reduce((acc, a) => {
            const addon = addonsDisponiveis.find(ad => ad.codigo === a.codigo)
            return acc + ((addon?.minutos_adicionais || 0) * a.quantidade)
        }, 0)
        return duracaoBase + duracaoAddons
    }, [formData.duracao_minutos, addonsSelecionados, addonsDisponiveis])

    // Calcular horário de término
    const calculateEndTime = (startTime: string, durationMinutes: number): string => {
        const [hours, minutes] = startTime.split(':').map(Number)
        const totalMinutes = hours * 60 + minutes + durationMinutes
        const endHours = Math.floor(totalMinutes / 60) % 24
        const endMinutes = totalMinutes % 60
        return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
    }

    // Toggle addon
    const toggleAddon = (addon: Addon) => {
        const exists = addonsSelecionados.find(a => a.codigo === addon.codigo)
        if (exists) {
            setAddonsSelecionados(prev => prev.filter(a => a.codigo !== addon.codigo))
        } else {
            setAddonsSelecionados(prev => [...prev, {
                codigo: addon.codigo,
                nome: addon.nome,
                preco: addon.preco,
                quantidade: 1
            }])
        }
    }

    // Atualizar quantidade do addon
    const updateAddonQuantidade = (codigo: string, quantidade: number) => {
        if (quantidade < 1) return
        setAddonsSelecionados(prev => prev.map(a =>
            a.codigo === codigo ? { ...a, quantidade } : a
        ))
    }

    // Atualizar duração quando muda o serviço
    const handleServiceChange = (codigo: string) => {
        const servico = serviceTypes.find(s => s.codigo === codigo)
        if (servico) {
            setFormData(prev => ({
                ...prev,
                tipo: codigo,
                duracao_minutos: servico.duracao_base_minutos.toString()
            }))
        }
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

        if (!formData.tipo) {
            toast.error('Selecione um tipo de serviço')
            return
        }

        setIsSaving(true)

        try {
            const horarioFim = calculateEndTime(formData.horario_inicio, duracaoTotal)

            const payload = {
                cliente_id: selectedClient.id,
                data: formData.data,
                horario_inicio: formData.horario_inicio,
                horario_fim_estimado: horarioFim,
                duracao_minutos: duracaoTotal,
                tipo: formData.tipo,
                status: formData.status,
                valor: calculatedValues.valorBase || null,
                valor_addons: calculatedValues.valorAddons || null,
                desconto_percentual: calculatedValues.desconto || null,
                valor_final: calculatedValues.valorFinal || null,
                addons: addonsSelecionados.length > 0 ? addonsSelecionados : null,
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
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-[#C48B7F]" />
                        Novo Agendamento
                    </DialogTitle>
                    <DialogDescription>
                        Preencha os dados para criar um novo agendamento
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Cliente */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Cliente *
                        </Label>
                        {selectedClient ? (
                            <div className="flex items-center justify-between p-3 bg-[#FDF8F6] rounded-lg border border-[#C48B7F]/20">
                                <div>
                                    <p className="font-medium">{selectedClient.nome}</p>
                                    <p className="text-sm text-muted-foreground">{selectedClient.telefone}</p>
                                    {selectedClient.endereco_completo && (
                                        <p className="text-xs text-muted-foreground mt-1">{selectedClient.endereco_completo}</p>
                                    )}
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedClient(null)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        value={clientSearch}
                                        onChange={e => setClientSearch(e.target.value)}
                                        placeholder="Buscar por nome ou telefone..."
                                        className="pl-10"
                                    />
                                </div>
                                {isLoading && (
                                    <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Buscando...
                                    </div>
                                )}
                                {clients.length > 0 && (
                                    <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                                        {clients.map(client => (
                                            <div
                                                key={client.id}
                                                className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                                onClick={() => {
                                                    setSelectedClient(client)
                                                    setClientSearch('')
                                                    setClients([])
                                                }}
                                            >
                                                <p className="font-medium">{client.nome}</p>
                                                <p className="text-sm text-muted-foreground">{client.telefone}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Data e Horário */}
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
                            <Label>Horário Início *</Label>
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

                    {/* Tipo de Serviço e Duração */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Tipo de Serviço *
                            </Label>
                            <Select
                                value={formData.tipo}
                                onValueChange={handleServiceChange}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um serviço" />
                                </SelectTrigger>
                                <SelectContent>
                                    {serviceTypes.map(t => (
                                        <SelectItem key={t.codigo} value={t.codigo}>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: t.cor || '#BE9982' }}
                                                />
                                                {t.nome}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Duração Base
                            </Label>
                            <Select
                                value={formData.duracao_minutos}
                                onValueChange={v => setFormData(prev => ({ ...prev, duracao_minutos: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {DURACOES.map(d => (
                                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Serviços Adicionais */}
                    {addonsDisponiveis.length > 0 && (
                        <div className="space-y-3">
                            <Label className="flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                Serviços Adicionais
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                                {addonsDisponiveis.map(addon => {
                                    const selecionado = addonsSelecionados.find(a => a.codigo === addon.codigo)
                                    return (
                                        <div
                                            key={addon.codigo}
                                            className={`p-3 border rounded-lg cursor-pointer transition-all ${selecionado
                                                ? 'border-[#C48B7F] bg-[#FDF8F6]'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div
                                                className="flex items-start gap-2"
                                                onClick={() => toggleAddon(addon)}
                                            >
                                                <Checkbox
                                                    checked={!!selecionado}
                                                    onCheckedChange={() => toggleAddon(addon)}
                                                    className="mt-0.5"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium">{addon.nome}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-[#C48B7F] font-medium">
                                                            +{formatCurrencyUSD(addon.preco)}
                                                        </span>
                                                        {addon.minutos_adicionais > 0 && (
                                                            <span className="text-xs text-muted-foreground">
                                                                +{addon.minutos_adicionais}min
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {selecionado && (
                                                <div className="mt-2 flex items-center gap-2">
                                                    <Label className="text-xs">Qtd:</Label>
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                updateAddonQuantidade(addon.codigo, selecionado.quantidade - 1)
                                                            }}
                                                            disabled={selecionado.quantidade <= 1}
                                                        >
                                                            -
                                                        </Button>
                                                        <span className="w-6 text-center text-sm">{selecionado.quantidade}</span>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                updateAddonQuantidade(addon.codigo, selecionado.quantidade + 1)
                                                            }}
                                                        >
                                                            +
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Valores */}
                    <div className="space-y-3">
                        <Label className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Valores
                        </Label>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Valor Base</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                    <Input
                                        value={formData.valor}
                                        onChange={e => setFormData(prev => ({
                                            ...prev,
                                            valor: formatCurrencyInput(e.target.value)
                                        }))}
                                        placeholder="0.00"
                                        className="pl-7"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Desconto (%)</Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.desconto_percentual}
                                        onChange={e => setFormData(prev => ({
                                            ...prev,
                                            desconto_percentual: e.target.value
                                        }))}
                                        placeholder="0"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={v => setFormData(prev => ({ ...prev, status: v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STATUS_OPTIONS.map(s => (
                                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Resumo */}
                    <Card className="bg-[#FDF8F6] border-[#C48B7F]/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-medium">Resumo</span>
                                <Badge variant="outline" className="gap-1">
                                    <Clock className="w-3 h-3" />
                                    {Math.floor(duracaoTotal / 60)}h {duracaoTotal % 60 > 0 ? `${duracaoTotal % 60}min` : ''}
                                </Badge>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Serviço base:</span>
                                    <span>{formatCurrencyUSD(calculatedValues.valorBase)}</span>
                                </div>
                                {calculatedValues.valorAddons > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Adicionais ({addonsSelecionados.length}):
                                        </span>
                                        <span>+{formatCurrencyUSD(calculatedValues.valorAddons)}</span>
                                    </div>
                                )}
                                {calculatedValues.desconto > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Desconto ({calculatedValues.desconto}%):</span>
                                        <span>-{formatCurrencyUSD(calculatedValues.valorDesconto)}</span>
                                    </div>
                                )}
                                <Separator />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total:</span>
                                    <span className="text-[#C48B7F]">{formatCurrencyUSD(calculatedValues.valorFinal)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Horário:</span>
                                    <span>
                                        {formData.horario_inicio} - {calculateEndTime(formData.horario_inicio, duracaoTotal)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notas */}
                    <div className="space-y-2">
                        <Label>Observações</Label>
                        <Textarea
                            value={formData.notas}
                            onChange={e => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                            placeholder="Observações sobre o agendamento..."
                            rows={2}
                        />
                    </div>

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
                                'Criar Agendamento'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
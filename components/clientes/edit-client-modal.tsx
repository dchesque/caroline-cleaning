'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, X, Loader2 } from 'lucide-react'
import {
    formatPhoneUS,
    isValidPhoneUS,
    isValidEmail,
    formatZipCode,
    US_STATES
} from '@/lib/formatters'

interface EditClientModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    clientId: string
    onSuccess?: () => void
}

interface ServicoTipo {
    id: string
    codigo: string
    nome: string
    ativo: boolean
}

interface Addon {
    id: string
    codigo: string
    nome: string
    preco: number
    ativo: boolean
}

interface DiaServico {
    dia: string
    servico: string
}

const TIPOS_RESIDENCIA = [
    { value: 'house', label: 'Casa' },
    { value: 'apartment', label: 'Apartamento' },
    { value: 'condo', label: 'Condomínio' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'other', label: 'Outro' },
]

const FREQUENCIAS = [
    { value: 'weekly', label: 'Semanal' },
    { value: 'biweekly', label: 'Quinzenal' },
    { value: 'monthly', label: 'Mensal' },
    { value: 'one_time', label: 'Avulso' },
]

const DIAS_SEMANA = [
    { value: 'monday', label: 'Segunda' },
    { value: 'tuesday', label: 'Terça' },
    { value: 'wednesday', label: 'Quarta' },
    { value: 'thursday', label: 'Quinta' },
    { value: 'friday', label: 'Sexta' },
    { value: 'saturday', label: 'Sábado' },
]

const TIPOS_ACESSO = [
    { value: 'client_home', label: 'Cliente em casa' },
    { value: 'garage_code', label: 'Código da garagem' },
    { value: 'lockbox', label: 'Lockbox' },
    { value: 'key_hidden', label: 'Chave escondida' },
    { value: 'doorman', label: 'Porteiro' },
    { value: 'other', label: 'Outro' },
]

export function EditClientModal({ open, onOpenChange, clientId, onSuccess }: EditClientModalProps) {
    const supabase = createClient()
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [servicosDisponiveis, setServicosDisponiveis] = useState<ServicoTipo[]>([])
    const [addonsDisponiveis, setAddonsDisponiveis] = useState<Addon[]>([])
    const [activeTab, setActiveTab] = useState('info')

    const [formData, setFormData] = useState({
        // Info
        nome: '',
        telefone: '',
        email: '',
        // Endereço
        endereco_completo: '',
        cidade: '',
        estado: 'FL',
        zip_code: '',
        // Casa
        tipo_residencia: 'house',
        bedrooms: '3',
        bathrooms: '2',
        square_feet: '',
        // Serviços
        frequencia: 'biweekly',
        diasServicos: [] as DiaServico[],
        addonsSelecionados: [] as string[],
        // Acesso
        acesso_tipo: 'client_home',
        acesso_codigo: '',
        acesso_instrucoes: '',
        tem_pets: false,
        pets_detalhes: '',
        notas_internas: ''
    })

    // Fetch Data
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!open || !clientId) return

            setIsLoading(true)
            try {
                // 1. Load Metadata
                const [servicosRes, addonsRes] = await Promise.all([
                    supabase.from('servicos_tipos').select('id, codigo, nome, ativo').eq('ativo', true).order('ordem'),
                    supabase.from('addons').select('id, codigo, nome, preco, ativo').eq('ativo', true).order('ordem')
                ])

                if (servicosRes.data) setServicosDisponiveis(servicosRes.data)
                if (addonsRes.data) setAddonsDisponiveis(addonsRes.data)

                // 2. Load Client
                const { data: client, error: clientError } = await supabase
                    .from('clientes')
                    .select('*')
                    .eq('id', clientId)
                    .single()

                if (clientError) throw clientError

                // 3. Load Recurrence
                const { data: recurrence } = await supabase
                    .from('recorrencias')
                    .select('*')
                    .eq('cliente_id', clientId)
                    .eq('ativo', true)
                    .single()

                if (client) {
                    setFormData({
                        nome: client.nome || '',
                        telefone: client.telefone || '',
                        email: client.email || '',
                        endereco_completo: client.endereco_completo || '',
                        cidade: client.cidade || '',
                        estado: client.estado || 'FL',
                        zip_code: client.zip_code || '',
                        tipo_residencia: client.tipo_residencia || 'house',
                        bedrooms: client.bedrooms?.toString() || '3',
                        bathrooms: client.bathrooms?.toString() || '2',
                        square_feet: client.square_feet?.toString() || '',
                        frequencia: client.frequencia || 'biweekly',
                        diasServicos: recurrence?.servicos_por_dia || (client.tipo_servico_padrao ? [{ dia: client.dia_preferido || 'monday', servico: client.tipo_servico_padrao }] : []),
                        addonsSelecionados: recurrence?.addons_selecionados || [],
                        acesso_tipo: client.acesso_tipo || 'client_home',
                        acesso_codigo: client.acesso_codigo || '',
                        acesso_instrucoes: client.acesso_instrucoes || '',
                        tem_pets: client.tem_pets || false,
                        pets_detalhes: client.pets_detalhes || '',
                        notas_internas: client.notas_internas || ''
                    })
                }
            } catch (error) {
                console.error('Error fetching client data:', error)
                toast.error('Erro ao carregar dados do cliente')
            } finally {
                setIsLoading(false)
            }
        }

        fetchInitialData()
    }, [open, clientId])

    // Utility Functions (Shared with ClientModal, could be extracted)
    const fetchAddressByZip = async (zipCode: string) => {
        if (zipCode.length < 5) return
        try {
            const response = await fetch(`https://api.zippopotam.us/us/${zipCode}`)
            if (response.ok) {
                const data = await response.json()
                if (data.places && data.places.length > 0) {
                    const place = data.places[0]
                    setFormData(prev => ({
                        ...prev,
                        cidade: place['place name'],
                        estado: place['state abbreviation']
                    }))
                }
            }
        } catch (error) {
            console.error('Error fetching ZIP:', error)
        }
    }

    const handleChange = (key: string, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }))
    }

    const addDiaServico = () => {
        const diasUsados = formData.diasServicos.map(ds => ds.dia)
        const proximoDia = DIAS_SEMANA.find(d => !diasUsados.includes(d.value))?.value || 'monday'
        const primeiroServico = servicosDisponiveis[0]?.codigo || 'regular'
        setFormData(prev => ({
            ...prev,
            diasServicos: [...prev.diasServicos, { dia: proximoDia, servico: primeiroServico }]
        }))
    }

    const removeDiaServico = (index: number) => {
        setFormData(prev => ({
            ...prev,
            diasServicos: prev.diasServicos.filter((_, i) => i !== index)
        }))
    }

    const updateDiaServico = (index: number, field: 'dia' | 'servico', value: string) => {
        setFormData(prev => ({
            ...prev,
            diasServicos: prev.diasServicos.map((ds, i) =>
                i === index ? { ...ds, [field]: value } : ds
            )
        }))
    }

    const toggleAddon = (codigo: string) => {
        setFormData(prev => ({
            ...prev,
            addonsSelecionados: prev.addonsSelecionados.includes(codigo)
                ? prev.addonsSelecionados.filter(c => c !== codigo)
                : [...prev.addonsSelecionados, codigo]
        }))
    }

    const isDiaUsado = (dia: string, currentIndex: number) => {
        return formData.diasServicos.some((ds, i) => ds.dia === dia && i !== currentIndex)
    }

    const handleSubmit = async () => {
        setIsSaving(true)
        try {
            const diasSelecionados = formData.diasServicos.map(ds => ds.dia)
            const servicoPrincipal = formData.diasServicos[0]?.servico || 'regular'
            const diaPrincipal = formData.diasServicos[0]?.dia || 'monday'

            const clientData = {
                nome: formData.nome.trim(),
                telefone: formData.telefone.trim(),
                email: formData.email.trim() || null,
                endereco_completo: formData.endereco_completo.trim(),
                cidade: formData.cidade.trim() || null,
                estado: formData.estado,
                zip_code: formData.zip_code.trim() || null,
                tipo_residencia: formData.tipo_residencia,
                bedrooms: parseInt(formData.bedrooms) || null,
                bathrooms: parseFloat(formData.bathrooms) || null,
                square_feet: parseInt(formData.square_feet) || null,
                tipo_servico_padrao: servicoPrincipal,
                frequencia: formData.frequencia,
                dia_preferido: diaPrincipal,
                acesso_tipo: formData.acesso_tipo,
                acesso_codigo: formData.acesso_codigo.trim() || null,
                acesso_instrucoes: formData.acesso_instrucoes.trim() || null,
                tem_pets: formData.tem_pets,
                pets_detalhes: formData.pets_detalhes.trim() || null,
                notas_internas: formData.notas_internas.trim() || null,
            }

            // 1. Update Client
            const { error: updateError } = await supabase
                .from('clientes')
                .update(clientData)
                .eq('id', clientId)

            if (updateError) throw updateError

            // 2. Update/Create Recurrence
            if (formData.frequencia !== 'one_time') {
                const { data: existingRecurrence } = await supabase
                    .from('recorrencias')
                    .select('id')
                    .eq('cliente_id', clientId)
                    .eq('ativo', true)
                    .single()

                const recurrenceData = {
                    cliente_id: clientId,
                    frequencia: formData.frequencia,
                    dia_preferido: diaPrincipal,
                    tipo_servico: servicoPrincipal,
                    dias_semana: diasSelecionados,
                    servicos_por_dia: formData.diasServicos,
                    addons_selecionados: formData.addonsSelecionados,
                    ativo: true,
                    horario: '08:00:00', // Default value to satisfy not-null constraint
                    valor: 0 // Default value to satisfy not-null constraint
                }

                if (existingRecurrence) {
                    const { error: recurrenceError } = await supabase
                        .from('recorrencias')
                        .update(recurrenceData)
                        .eq('id', existingRecurrence.id)
                    if (recurrenceError) throw recurrenceError
                } else {
                    const { error: recurrenceError } = await supabase
                        .from('recorrencias')
                        .insert([recurrenceData])
                    if (recurrenceError) throw recurrenceError
                }
            }

            toast.success('Cliente atualizado com sucesso!')
            onSuccess?.()
            onOpenChange(false)
        } catch (error: any) {
            console.error('Error updating client:', error)
            toast.error(`Erro ao atualizar cliente: ${error.message}`)
        } finally {
            setIsSaving(false)
        }
    }

    if (!open) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Cliente</DialogTitle>
                    <DialogDescription>
                        Atualize as informações do cliente abaixo.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="w-8 h-8 animate-spin text-[#C48B7F]" />
                    </div>
                ) : (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="info">Info</TabsTrigger>
                            <TabsTrigger value="address">Endereço</TabsTrigger>
                            <TabsTrigger value="service">Serviços</TabsTrigger>
                            <TabsTrigger value="access">Acesso</TabsTrigger>
                        </TabsList>

                        {/* Tab: Info */}
                        <TabsContent value="info" className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nome Completo *</Label>
                                    <Input
                                        value={formData.nome}
                                        onChange={e => handleChange('nome', e.target.value)}
                                        placeholder="Nome do cliente"
                                        className="bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Telefone *</Label>
                                    <Input
                                        value={formData.telefone}
                                        onChange={e => handleChange('telefone', formatPhoneUS(e.target.value))}
                                        placeholder="(555) 555-5555"
                                        className="bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                        value={formData.email}
                                        onChange={e => handleChange('email', e.target.value)}
                                        placeholder="email@example.com"
                                        className="bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* Tab: Endereço */}
                        <TabsContent value="address" className="space-y-4 mt-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>ZIP Code</Label>
                                    <Input
                                        value={formData.zip_code}
                                        onChange={e => {
                                            const val = formatZipCode(e.target.value)
                                            handleChange('zip_code', val)
                                            if (val.length === 5) fetchAddressByZip(val)
                                        }}
                                        maxLength={5}
                                        className="bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label>Endereço *</Label>
                                    <Input
                                        value={formData.endereco_completo}
                                        onChange={e => handleChange('endereco_completo', e.target.value)}
                                        className="bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Cidade</Label>
                                    <Input
                                        value={formData.cidade}
                                        onChange={e => handleChange('cidade', e.target.value)}
                                        className="bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Estado</Label>
                                    <Select
                                        value={formData.estado}
                                        onValueChange={v => handleChange('estado', v)}
                                    >
                                        <SelectTrigger className="bg-white border-gray-200 shadow-sm"><SelectValue /></SelectTrigger>
                                        <SelectContent className='max-h-[200px]'>
                                            {US_STATES.map(s => (
                                                <SelectItem key={s.value} value={s.value}>{s.value}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Tipo Residência</Label>
                                    <Select
                                        value={formData.tipo_residencia}
                                        onValueChange={v => handleChange('tipo_residencia', v)}
                                    >
                                        <SelectTrigger className="bg-white border-gray-200 shadow-sm"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {TIPOS_RESIDENCIA.map(t => (
                                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Quartos</Label>
                                    <Input
                                        type="number"
                                        value={formData.bedrooms}
                                        onChange={e => handleChange('bedrooms', e.target.value)}
                                        className="bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Banheiros</Label>
                                    <Input
                                        type="number"
                                        step="0.5"
                                        value={formData.bathrooms}
                                        onChange={e => handleChange('bathrooms', e.target.value)}
                                        className="bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Sq. Feet</Label>
                                    <Input
                                        type="number"
                                        value={formData.square_feet}
                                        onChange={e => handleChange('square_feet', e.target.value)}
                                        className="bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* Tab: Serviços */}
                        <TabsContent value="service" className="space-y-4 mt-4">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Frequência</Label>
                                    <Select
                                        value={formData.frequencia}
                                        onValueChange={v => {
                                            handleChange('frequencia', v)
                                            if (v !== 'weekly' && formData.diasServicos.length > 1) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    frequencia: v,
                                                    diasServicos: prev.diasServicos.slice(0, 1)
                                                }))
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="bg-white border-gray-200 shadow-sm"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {FREQUENCIAS.map(f => (
                                                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Dias e Serviços</Label>
                                        {formData.frequencia === 'weekly' && (
                                            <Button type="button" variant="outline" size="sm" onClick={addDiaServico}>
                                                <Plus className="w-4 h-4 mr-1" /> Adicionar
                                            </Button>
                                        )}
                                    </div>
                                    {formData.diasServicos.length === 0 ? (
                                        <div className="border border-dashed p-4 rounded text-center text-sm text-gray-500">
                                            Nenhum dia configurado. Clique em Adicionar.
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {formData.diasServicos.map((ds, index) => (
                                                <div key={index} className="flex gap-2 items-center bg-gray-50 p-2 rounded">
                                                    <Select
                                                        value={ds.dia}
                                                        onValueChange={v => updateDiaServico(index, 'dia', v)}
                                                    >
                                                        <SelectTrigger className="w-[140px] bg-white border-gray-200 shadow-sm"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            {DIAS_SEMANA.map(d => (
                                                                <SelectItem key={d.value} value={d.value} disabled={isDiaUsado(d.value, index)}>{d.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <Select
                                                        value={ds.servico}
                                                        onValueChange={v => updateDiaServico(index, 'servico', v)}
                                                    >
                                                        <SelectTrigger className="flex-1 bg-white border-gray-200 shadow-sm"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            {servicosDisponiveis.map(s => (
                                                                <SelectItem key={s.codigo} value={s.codigo}>{s.nome}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {formData.diasServicos.length > 1 && (
                                                        <Button variant="ghost" size="icon" onClick={() => removeDiaServico(index)}>
                                                            <X className="w-4 h-4 text-red-500" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label>Add-ons</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {addonsDisponiveis.map(addon => (
                                            <div
                                                key={addon.codigo}
                                                onClick={() => toggleAddon(addon.codigo)}
                                                className={`p-2 border rounded cursor-pointer flex items-center gap-2 ${formData.addonsSelecionados.includes(addon.codigo) ? 'bg-[#FDF8F6] border-[#C48B7F]' : 'hover:bg-gray-50'}`}
                                            >
                                                <Checkbox checked={formData.addonsSelecionados.includes(addon.codigo)} />
                                                <span className="text-sm">{addon.nome} (+${addon.preco})</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Tab: Acesso */}
                        <TabsContent value="access" className="space-y-4 mt-4">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Tipo de Acesso</Label>
                                    <Select
                                        value={formData.acesso_tipo}
                                        onValueChange={v => handleChange('acesso_tipo', v)}
                                    >
                                        <SelectTrigger className="bg-white border-gray-200 shadow-sm"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {TIPOS_ACESSO.map(t => (
                                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {formData.acesso_tipo !== 'client_home' && (
                                    <>
                                        <div className="space-y-2">
                                            <Label>Código</Label>
                                            <Input
                                                value={formData.acesso_codigo}
                                                onChange={e => handleChange('acesso_codigo', e.target.value)}
                                                className="bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Instruções</Label>
                                            <Textarea
                                                value={formData.acesso_instrucoes}
                                                onChange={e => handleChange('acesso_instrucoes', e.target.value)}
                                                className="bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400 resize-none"
                                            />
                                        </div>
                                    </>
                                )}
                                <div className="space-y-2 pt-2 border-t">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="tem_pets"
                                            checked={formData.tem_pets}
                                            onCheckedChange={c => handleChange('tem_pets', !!c)}
                                        />
                                        <Label htmlFor="tem_pets">Possui Pets?</Label>
                                    </div>
                                </div>
                                {formData.tem_pets && (
                                    <div className="space-y-2">
                                        <Label>Detalhes dos Pets</Label>
                                        <Textarea
                                            value={formData.pets_detalhes}
                                            onChange={e => handleChange('pets_detalhes', e.target.value)}
                                            className="bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400 resize-none"
                                        />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label>Notas Internas</Label>
                                    <Textarea
                                        value={formData.notas_internas}
                                        onChange={e => handleChange('notas_internas', e.target.value)}
                                        className="bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400 resize-none"
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        <div className="flex justify-end gap-2 mt-6">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button className="bg-[#C48B7F] hover:bg-[#A66D60]" onClick={handleSubmit} disabled={isSaving}>
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Salvar Alterações
                            </Button>
                        </div>
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    )
}

'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import {
    formatPhoneUS,
    isValidPhoneUS,
    isValidEmail,
    formatZipCode,
    US_STATES
} from '@/lib/formatters'

interface ClientModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
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

const STEPS = [
    { id: 1, title: 'Informações Básicas' },
    { id: 2, title: 'Endereço' },
    { id: 3, title: 'Detalhes da Casa' },
    { id: 4, title: 'Preferências de Serviço' },
    { id: 5, title: 'Acesso & Pets' },
]

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

export function ClientModal({ open, onOpenChange, onSuccess }: ClientModalProps) {
    const [step, setStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [servicosDisponiveis, setServicosDisponiveis] = useState<ServicoTipo[]>([])
    const [addonsDisponiveis, setAddonsDisponiveis] = useState<Addon[]>([])
    const supabase = createClient()

    const [formData, setFormData] = useState({
        // Step 1 - Informações Básicas
        nome: '',
        telefone: '',
        email: '',
        // Step 2 - Endereço
        endereco_completo: '',
        cidade: '',
        estado: 'FL',
        zip_code: '',
        // Step 3 - Detalhes da Casa
        tipo_residencia: 'house',
        bedrooms: '3',
        bathrooms: '2',
        square_feet: '',
        // Step 4 - Preferências
        frequencia: 'biweekly',
        diasServicos: [] as DiaServico[],
        addonsSelecionados: [] as string[], // códigos dos addons
        // Step 5 - Acesso & Pets
        acesso_tipo: 'client_home',
        acesso_codigo: '',
        acesso_instrucoes: '',
        tem_pets: false,
        pets_detalhes: '',
        notas_internas: ''
    })

    // Carregar serviços e addons do banco
    useEffect(() => {
        const fetchData = async () => {
            const [servicosRes, addonsRes] = await Promise.all([
                supabase.from('servicos_tipos').select('id, codigo, nome, ativo').eq('ativo', true).order('ordem'),
                supabase.from('addons').select('id, codigo, nome, preco, ativo').eq('ativo', true).order('ordem')
            ])

            if (servicosRes.data) setServicosDisponiveis(servicosRes.data)
            if (addonsRes.data) setAddonsDisponiveis(addonsRes.data)
        }

        if (open) {
            fetchData()
        }
    }, [open])

    // Função para buscar endereço pelo ZIP Code
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

    // Adicionar novo dia/serviço
    const addDiaServico = () => {
        const diasUsados = formData.diasServicos.map(ds => ds.dia)
        const proximoDia = DIAS_SEMANA.find(d => !diasUsados.includes(d.value))?.value || 'monday'
        const primeiroServico = servicosDisponiveis[0]?.codigo || 'regular'

        setFormData(prev => ({
            ...prev,
            diasServicos: [...prev.diasServicos, { dia: proximoDia, servico: primeiroServico }]
        }))
    }

    // Remover dia/serviço
    const removeDiaServico = (index: number) => {
        setFormData(prev => ({
            ...prev,
            diasServicos: prev.diasServicos.filter((_, i) => i !== index)
        }))
    }

    // Atualizar dia/serviço específico
    const updateDiaServico = (index: number, field: 'dia' | 'servico', value: string) => {
        setFormData(prev => ({
            ...prev,
            diasServicos: prev.diasServicos.map((ds, i) =>
                i === index ? { ...ds, [field]: value } : ds
            )
        }))
    }

    // Toggle addon
    const toggleAddon = (codigo: string) => {
        setFormData(prev => ({
            ...prev,
            addonsSelecionados: prev.addonsSelecionados.includes(codigo)
                ? prev.addonsSelecionados.filter(c => c !== codigo)
                : [...prev.addonsSelecionados, codigo]
        }))
    }

    // Verificar se um dia já está sendo usado
    const isDiaUsado = (dia: string, currentIndex: number) => {
        return formData.diasServicos.some((ds, i) => ds.dia === dia && i !== currentIndex)
    }

    const handleNext = () => {
        // Validações por step
        if (step === 1) {
            if (!formData.nome.trim()) {
                toast.error('Nome é obrigatório')
                return
            }
            if (!formData.telefone.trim()) {
                toast.error('Telefone é obrigatório')
                return
            }
            if (!isValidPhoneUS(formData.telefone)) {
                toast.error('Telefone inválido. Use formato americano (10 dígitos)')
                return
            }
            if (formData.email && !isValidEmail(formData.email)) {
                toast.error('Email inválido')
                return
            }
        }
        if (step === 2) {
            if (!formData.endereco_completo.trim()) {
                toast.error('Endereço é obrigatório')
                return
            }
        }
        if (step === 4) {
            if (formData.diasServicos.length === 0) {
                toast.error('Adicione pelo menos um dia de serviço')
                return
            }
        }
        if (step < STEPS.length) setStep(step + 1)
    }

    const handlePrev = () => {
        if (step > 1) setStep(step - 1)
    }

    const resetForm = () => {
        setStep(1)
        setFormData({
            nome: '',
            telefone: '',
            email: '',
            endereco_completo: '',
            cidade: '',
            estado: 'FL',
            zip_code: '',
            tipo_residencia: 'house',
            bedrooms: '3',
            bathrooms: '2',
            square_feet: '',
            frequencia: 'biweekly',
            diasServicos: [],
            addonsSelecionados: [],
            acesso_tipo: 'client_home',
            acesso_codigo: '',
            acesso_instrucoes: '',
            tem_pets: false,
            pets_detalhes: '',
            notas_internas: ''
        })
    }

    const handleSubmit = async () => {
        setIsLoading(true)
        try {
            const diasSelecionados = formData.diasServicos.map(ds => ds.dia)
            const servicoPrincipal = formData.diasServicos[0]?.servico || 'regular'
            const diaPrincipal = formData.diasServicos[0]?.dia || 'monday'

            // 1. Criar o cliente
            const { data: cliente, error: clienteError } = await supabase.from('clientes').insert([{
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
                status: 'lead'
            }]).select().single()

            if (clienteError) throw clienteError

            // 2. Criar recorrência com múltiplos dias/serviços e addons
            if (formData.frequencia !== 'one_time' && cliente) {
                const { error: recorrenciaError } = await supabase.from('recorrencias').insert([{
                    cliente_id: cliente.id,
                    frequencia: formData.frequencia,
                    dia_preferido: diaPrincipal,
                    tipo_servico: servicoPrincipal,
                    dias_semana: diasSelecionados,
                    servicos_por_dia: formData.diasServicos,
                    addons_selecionados: formData.addonsSelecionados,
                    ativo: true,
                    horario_preferido: '09:00:00', // Valor padrão obrigatório
                    valor_base: 0 // Valor padrão obrigatório
                }])

                if (recorrenciaError) {
                    console.error('Error creating recurrence:', JSON.stringify(recorrenciaError, null, 2))
                    toast.error(`Erro na recorrência: ${recorrenciaError.message}`)
                }
            }

            toast.success('Cliente cadastrado com sucesso!')
            onOpenChange(false)
            resetForm()
            onSuccess?.()
        } catch (error) {
            console.error('Error creating client:', error)
            toast.error('Erro ao cadastrar cliente')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen) resetForm()
            onOpenChange(isOpen)
        }}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Novo Cliente</DialogTitle>
                    <DialogDescription>
                        Passo {step} de {STEPS.length}: {STEPS[step - 1].title}
                    </DialogDescription>
                </DialogHeader>

                {/* Progress */}
                <div className="flex gap-1 mb-4">
                    {STEPS.map((s) => (
                        <div
                            key={s.id}
                            className={`h-1 flex-1 rounded-full transition-colors ${s.id <= step ? 'bg-[#C48B7F]' : 'bg-gray-200'
                                }`}
                        />
                    ))}
                </div>

                {/* Step 1: Informações Básicas */}
                {step === 1 && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nome Completo *</Label>
                            <Input
                                value={formData.nome}
                                onChange={e => handleChange('nome', e.target.value)}
                                placeholder="John Smith"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Telefone * (US)</Label>
                            <Input
                                value={formData.telefone}
                                onChange={e => handleChange('telefone', formatPhoneUS(e.target.value))}
                                placeholder="(305) 555-0123"
                            />
                            <p className="text-xs text-muted-foreground">
                                Formato: (XXX) XXX-XXXX
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={formData.email}
                                onChange={e => handleChange('email', e.target.value.toLowerCase())}
                                placeholder="john@example.com"
                            />
                        </div>
                    </div>
                )}

                {/* Step 2: Endereço */}
                {step === 2 && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>ZIP Code</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={formData.zip_code}
                                    onChange={e => {
                                        const value = formatZipCode(e.target.value)
                                        handleChange('zip_code', value)
                                        if (value.length === 5) {
                                            fetchAddressByZip(value)
                                        }
                                    }}
                                    placeholder="33139"
                                    maxLength={5}
                                    className="w-32"
                                />
                                <p className="text-xs text-muted-foreground self-center">
                                    Digite o ZIP para preencher automaticamente
                                </p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Endereço Completo *</Label>
                            <Input
                                value={formData.endereco_completo}
                                onChange={e => handleChange('endereco_completo', e.target.value)}
                                placeholder="123 Main St, Apt 4"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Cidade</Label>
                                <Input
                                    value={formData.cidade}
                                    onChange={e => handleChange('cidade', e.target.value)}
                                    placeholder="Miami"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Estado</Label>
                                <Select
                                    value={formData.estado}
                                    onValueChange={v => handleChange('estado', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px]">
                                        {US_STATES.map(state => (
                                            <SelectItem key={state.value} value={state.value}>
                                                {state.value} - {state.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Detalhes da Casa */}
                {step === 3 && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Tipo de Residência</Label>
                            <Select
                                value={formData.tipo_residencia}
                                onValueChange={v => handleChange('tipo_residencia', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {TIPOS_RESIDENCIA.map(t => (
                                        <SelectItem key={t.value} value={t.value}>
                                            {t.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Bedrooms</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={formData.bedrooms}
                                    onChange={e => handleChange('bedrooms', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Bathrooms</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={formData.bathrooms}
                                    onChange={e => handleChange('bathrooms', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Sq. Feet</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={formData.square_feet}
                                    onChange={e => handleChange('square_feet', e.target.value)}
                                    placeholder="1500"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Preferências de Serviço */}
                {step === 4 && (
                    <div className="space-y-4">
                        {/* Frequência */}
                        <div className="space-y-2">
                            <Label>Frequência</Label>
                            <Select
                                value={formData.frequencia}
                                onValueChange={v => {
                                    handleChange('frequencia', v)
                                    // Se não for semanal, limitar a um dia/serviço
                                    if (v !== 'weekly' && formData.diasServicos.length > 1) {
                                        setFormData(prev => ({
                                            ...prev,
                                            frequencia: v,
                                            diasServicos: prev.diasServicos.slice(0, 1)
                                        }))
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {FREQUENCIAS.map(f => (
                                        <SelectItem key={f.value} value={f.value}>
                                            {f.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {formData.frequencia !== 'weekly' && (
                                <p className="text-xs text-muted-foreground">
                                    Para frequência {formData.frequencia === 'biweekly' ? 'quinzenal' : formData.frequencia === 'monthly' ? 'mensal' : 'avulsa'},
                                    configure apenas um dia de serviço.
                                </p>
                            )}
                        </div>

                        {/* Dias e Serviços */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Dias e Serviços</Label>
                                {formData.frequencia === 'weekly' && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addDiaServico}
                                        disabled={formData.diasServicos.length >= 6}
                                    >
                                        <Plus className="w-4 h-4 mr-1" />
                                        Adicionar Dia
                                    </Button>
                                )}
                            </div>

                            {formData.diasServicos.length === 0 ? (
                                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Nenhum dia configurado
                                    </p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addDiaServico}
                                    >
                                        <Plus className="w-4 h-4 mr-1" />
                                        Adicionar Dia
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {formData.diasServicos.map((ds, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
                                        >
                                            <Select
                                                value={ds.dia}
                                                onValueChange={v => updateDiaServico(index, 'dia', v)}
                                            >
                                                <SelectTrigger className="w-[130px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {DIAS_SEMANA.map(d => (
                                                        <SelectItem
                                                            key={d.value}
                                                            value={d.value}
                                                            disabled={isDiaUsado(d.value, index)}
                                                        >
                                                            {d.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            <Select
                                                value={ds.servico}
                                                onValueChange={v => updateDiaServico(index, 'servico', v)}
                                            >
                                                <SelectTrigger className="flex-1">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {servicosDisponiveis.map(s => (
                                                        <SelectItem key={s.codigo} value={s.codigo}>
                                                            {s.nome}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            {formData.frequencia === 'weekly' && formData.diasServicos.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeDiaServico(index)}
                                                    className="shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Addons */}
                        {addonsDisponiveis.length > 0 && (
                            <div className="space-y-2">
                                <Label>Serviços Adicionais</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {addonsDisponiveis.map(addon => (
                                        <div
                                            key={addon.codigo}
                                            onClick={() => toggleAddon(addon.codigo)}
                                            className={`p-3 border rounded-lg cursor-pointer transition-all ${formData.addonsSelecionados.includes(addon.codigo)
                                                ? 'border-[#C48B7F] bg-[#FDF8F6]'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    checked={formData.addonsSelecionados.includes(addon.codigo)}
                                                    onChange={() => { }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{addon.nome}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        +${addon.preco.toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Resumo */}
                        {(formData.diasServicos.length > 0 || formData.addonsSelecionados.length > 0) && (
                            <div className="bg-[#FDF8F6] p-3 rounded-lg">
                                <p className="text-xs text-muted-foreground mb-2">Resumo:</p>
                                <div className="flex flex-wrap gap-1">
                                    {formData.diasServicos.map((ds, index) => {
                                        const diaLabel = DIAS_SEMANA.find(d => d.value === ds.dia)?.label
                                        const servicoLabel = servicosDisponiveis.find(s => s.codigo === ds.servico)?.nome
                                        return (
                                            <Badge key={index} variant="secondary" className="text-xs">
                                                {diaLabel}: {servicoLabel}
                                            </Badge>
                                        )
                                    })}
                                    {formData.addonsSelecionados.map(codigo => {
                                        const addon = addonsDisponiveis.find(a => a.codigo === codigo)
                                        return (
                                            <Badge key={codigo} className="text-xs bg-[#C48B7F]">
                                                +{addon?.nome}
                                            </Badge>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 5: Acesso & Pets */}
                {step === 5 && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Tipo de Acesso</Label>
                            <Select
                                value={formData.acesso_tipo}
                                onValueChange={v => handleChange('acesso_tipo', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {TIPOS_ACESSO.map(t => (
                                        <SelectItem key={t.value} value={t.value}>
                                            {t.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {formData.acesso_tipo !== 'client_home' && (
                            <>
                                <div className="space-y-2">
                                    <Label>Código de Acesso</Label>
                                    <Input
                                        value={formData.acesso_codigo}
                                        onChange={e => handleChange('acesso_codigo', e.target.value)}
                                        placeholder="1234"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Instruções de Acesso</Label>
                                    <Textarea
                                        value={formData.acesso_instrucoes}
                                        onChange={e => handleChange('acesso_instrucoes', e.target.value)}
                                        placeholder="Lockbox next to the door..."
                                        rows={2}
                                    />
                                </div>
                            </>
                        )}

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="tem_pets"
                                    checked={formData.tem_pets}
                                    onCheckedChange={(checked) => handleChange('tem_pets', !!checked)}
                                />
                                <Label htmlFor="tem_pets" className="cursor-pointer">Has pets?</Label>
                            </div>
                        </div>

                        {formData.tem_pets && (
                            <div className="space-y-2">
                                <Label>Pet Details</Label>
                                <Textarea
                                    value={formData.pets_detalhes}
                                    onChange={e => handleChange('pets_detalhes', e.target.value)}
                                    placeholder="2 dogs, friendly..."
                                    rows={2}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Internal Notes</Label>
                            <Textarea
                                value={formData.notas_internas}
                                onChange={e => handleChange('notas_internas', e.target.value)}
                                placeholder="Notes about the client..."
                                rows={3}
                            />
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handlePrev}
                        disabled={step === 1}
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Back
                    </Button>

                    {step < STEPS.length ? (
                        <Button
                            type="button"
                            onClick={handleNext}
                            className="bg-[#C48B7F] hover:bg-[#A66D60]"
                        >
                            Next
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="bg-[#C48B7F] hover:bg-[#A66D60]"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Create Client'
                            )}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

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
    const supabase = createClient()
    const [step, setStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [servicosDisponiveis, setServicosDisponiveis] = useState<ServicoTipo[]>([])
    const [addonsDisponiveis, setAddonsDisponiveis] = useState<Addon[]>([])

    const [formData, setFormData] = useState({
        // Step 1
        nome: '',
        telefone: '',
        email: '',
        // Step 2
        endereco_completo: '',
        cidade: '',
        estado: 'FL',
        zip_code: '',
        // Step 3
        tipo_residencia: 'house',
        bedrooms: '3',
        bathrooms: '2',
        square_feet: '',
        // Step 4
        frequencia: 'biweekly',
        diasServicos: [] as DiaServico[],
        addonsSelecionados: [] as string[],
        // Step 5
        acesso_tipo: 'client_home',
        acesso_codigo: '',
        acesso_instrucoes: '',
        tem_pets: false,
        pets_detalhes: '',
        notas_internas: ''
    })

    // Fetch Initial Data
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!open) return

            try {
                const [servicosRes, addonsRes] = await Promise.all([
                    supabase.from('servicos_tipos').select('id, codigo, nome, ativo').eq('ativo', true).order('ordem'),
                    supabase.from('addons').select('id, codigo, nome, preco, ativo').eq('ativo', true).order('ordem')
                ])

                if (servicosRes.data) setServicosDisponiveis(servicosRes.data)
                if (addonsRes.data) setAddonsDisponiveis(addonsRes.data)
            } catch (error) {
                console.error('Error fetching data:', error)
                toast.error('Erro ao carregar dados iniciais')
            }
        }

        fetchInitialData()
    }, [open])

    // Utility Functions
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

    const nextStep = () => {
        if (validateStep(step)) {
            setStep(prev => prev + 1)
        }
    }

    const prevStep = () => setStep(prev => prev - 1)

    const validateStep = (currentStep: number) => {
        switch (currentStep) {
            case 1:
                if (!formData.nome.trim()) {
                    toast.error('Nome é obrigatório')
                    return false
                }
                if (!isValidPhoneUS(formData.telefone)) {
                    toast.error('Telefone inválido')
                    return false
                }
                if (formData.email && !isValidEmail(formData.email)) {
                    toast.error('Email inválido')
                    return false
                }
                return true
            case 2:
                if (!formData.endereco_completo.trim()) {
                    toast.error('Endereço é obrigatório')
                    return false
                }
                return true
            case 4:
                // Se frequência não for One Time, precisa selecionar dias/serviços
                if (formData.frequencia !== 'one_time' && formData.diasServicos.length === 0) {
                    // Se não tiver nenhum dia configurado, força adicionar um default (ex: Segunda / Regular)
                    // Ou avisa o erro
                    // Vamos tentar adicionar um default se estiver vazio?
                    // Melhor avisar
                    // toast.error('Configure pelo menos um dia de atendimento')
                    // return false
                    // Actually, let's auto-add if empty inside form logic or here
                }
                return true
            default:
                return true
        }
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
        setIsLoading(true)
        try {
            // Preparar dados
            const diasSelecionados = formData.diasServicos.map(ds => ds.dia)
            const servicoPrincipal = formData.diasServicos[0]?.servico || 'regular'
            const diaPrincipal = formData.diasServicos[0]?.dia || 'monday'

            // 1. Criar Cliente
            const { data: newClient, error: createError } = await supabase
                .from('clientes')
                .insert([{
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
                    // Dados padrão para filtros
                    tipo_servico_padrao: servicoPrincipal,
                    frequencia: formData.frequencia,
                    dia_preferido: diaPrincipal,
                    status: 'lead',
                    // Acesso
                    acesso_tipo: formData.acesso_tipo,
                    acesso_codigo: formData.acesso_codigo.trim() || null,
                    acesso_instrucoes: formData.acesso_instrucoes.trim() || null,
                    tem_pets: formData.tem_pets,
                    pets_detalhes: formData.pets_detalhes.trim() || null,
                    notas_internas: formData.notas_internas.trim() || null,
                }])
                .select()
                .single()

            if (createError) throw createError

            // 2. Criar Recorrência (se não for avulso, ou se quiser criar sempre)
            // Vamos criar sempre, mas ativo apenas se não for One Time?
            // Ou criar como "ativo" se for recorrente.
            // Se for One Time, talvez não precise de reccorencia, mas o sistema pode depender dela.
            // Vamos seguir a lógica: se One Time, não cria recorrência ativa.

            if (formData.frequencia !== 'one_time') {
                const recurrenceData = {
                    cliente_id: newClient.id,
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

                const { error: recurrenceError } = await supabase
                    .from('recorrencias')
                    .insert([recurrenceData])

                if (recurrenceError) throw recurrenceError
            }

            toast.success('Cliente cadastrado com sucesso!')
            onOpenChange(false)
            onSuccess?.()
            resetForm()
        } catch (error: any) {
            console.error('Error saving client:', error)
            toast.error('Erro ao salvar cliente')
        } finally {
            setIsLoading(false)
        }
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

    if (!open) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Novo Cliente</DialogTitle>
                    <DialogDescription>
                        Passo {step} de {STEPS.length}: {STEPS[step - 1].title}
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4">
                    {/* Step 1: Info */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nome Completo *</Label>
                                <Input
                                    value={formData.nome}
                                    onChange={e => handleChange('nome', e.target.value)}
                                    placeholder="Ex: John Doe"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Telefone *</Label>
                                    <Input
                                        value={formData.telefone}
                                        onChange={e => handleChange('telefone', formatPhoneUS(e.target.value))}
                                        placeholder="(555) 555-5555"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                        value={formData.email}
                                        onChange={e => handleChange('email', e.target.value)}
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Endereço */}
                    {step === 2 && (
                        <div className="space-y-4">
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
                                        placeholder="00000"
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label>Endereço *</Label>
                                    <Input
                                        value={formData.endereco_completo}
                                        onChange={e => handleChange('endereco_completo', e.target.value)}
                                        placeholder="123 Main St"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Cidade</Label>
                                    <Input
                                        value={formData.cidade}
                                        onChange={e => handleChange('cidade', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Estado</Label>
                                    <Select
                                        value={formData.estado}
                                        onValueChange={v => handleChange('estado', v)}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent className='max-h-[200px]'>
                                            {US_STATES.map(s => (
                                                <SelectItem key={s.value} value={s.value}>{s.value}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Casa */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Tipo de Residência</Label>
                                <Select
                                    value={formData.tipo_residencia}
                                    onValueChange={v => handleChange('tipo_residencia', v)}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {TIPOS_RESIDENCIA.map(t => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Quartos</Label>
                                    <Input
                                        type="number"
                                        value={formData.bedrooms}
                                        onChange={e => handleChange('bedrooms', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Banheiros</Label>
                                    <Input
                                        type="number"
                                        step="0.5"
                                        value={formData.bathrooms}
                                        onChange={e => handleChange('bathrooms', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Sq. Feet</Label>
                                    <Input
                                        type="number"
                                        value={formData.square_feet}
                                        onChange={e => handleChange('square_feet', e.target.value)}
                                        placeholder="ex: 2000"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Serviços */}
                    {step === 4 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Frequência</Label>
                                <Select
                                    value={formData.frequencia}
                                    onValueChange={v => {
                                        handleChange('frequencia', v)
                                        // Se mudar pra weekly ou biweekly, resetar dias?
                                        // Não necessariamente.
                                        // Mas se for weekly, pode ter múltiplos dias. Outros tipos geralmente 1?
                                        // Vamos deixar flexível.
                                        if (v !== 'weekly' && formData.diasServicos.length > 1) {
                                            // Se não for weekly, segura apenas o primeiro dia
                                            setFormData(prev => ({
                                                ...prev,
                                                frequencia: v,
                                                diasServicos: prev.diasServicos.slice(0, 1)
                                            }))
                                        }
                                    }}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                                        <p>Nenhum dia configurado.</p>
                                        <Button type="button" variant="link" onClick={addDiaServico}>Adicionar Dia</Button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {formData.diasServicos.map((ds, index) => (
                                            <div key={index} className="flex gap-2 items-center bg-gray-50 p-2 rounded">
                                                <Select
                                                    value={ds.dia}
                                                    onValueChange={v => updateDiaServico(index, 'dia', v)}
                                                >
                                                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
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
                                                    <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {servicosDisponiveis.map(s => (
                                                            <SelectItem key={s.codigo} value={s.codigo}>{s.nome}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {/* Botão remover apenas se tiver mais de 1 ou se permitir remover o único */}
                                                <Button variant="ghost" size="icon" onClick={() => removeDiaServico(index)}>
                                                    <X className="w-4 h-4 text-red-500" />
                                                </Button>
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
                    )}

                    {/* Step 5: Acesso */}
                    {step === 5 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Tipo de Acesso</Label>
                                <Select
                                    value={formData.acesso_tipo}
                                    onValueChange={v => handleChange('acesso_tipo', v)}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                                            placeholder="Ex: 1234"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Instruções</Label>
                                        <Textarea
                                            value={formData.acesso_instrucoes}
                                            onChange={e => handleChange('acesso_instrucoes', e.target.value)}
                                            placeholder="Onde encontrar a chave, etc."
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
                                        placeholder="Ex: 1 cachorro grande, dócil."
                                    />
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label>Notas Internas</Label>
                                <Textarea
                                    value={formData.notas_internas}
                                    onChange={e => handleChange('notas_internas', e.target.value)}
                                    placeholder="Observações gerais sobre o cliente..."
                                />
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex justify-between mt-8 pt-4 border-t">
                        {step > 1 ? (
                            <Button variant="outline" onClick={prevStep}>
                                <ChevronLeft className="w-4 h-4 mr-2" />
                                Anterior
                            </Button>
                        ) : (
                            <div />
                        )}

                        {step < STEPS.length ? (
                            <Button onClick={nextStep} className="bg-[#C48B7F] hover:bg-[#A66D60]">
                                Próximo
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        ) : (
                            <Button onClick={handleSubmit} disabled={isLoading} className="bg-[#C48B7F] hover:bg-[#A66D60]">
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Finalizar Cadastro
                            </Button>
                        )}
                    </div>

                    {/* Stepper Indicator */}
                    <div className="flex justify-center gap-2 mt-4">
                        {STEPS.map(s => (
                            <div
                                key={s.id}
                                className={`h-2 w-2 rounded-full ${s.id === step ? 'bg-[#C48B7F]' : (s.id < step ? 'bg-[#C48B7F]/50' : 'bg-gray-200')}`}
                            />
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

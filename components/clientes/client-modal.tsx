'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

interface ClientModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

const STEPS = [
    { id: 1, title: 'Informações Básicas' },
    { id: 2, title: 'Endereço' },
    { id: 3, title: 'Detalhes da Casa' },
    { id: 4, title: 'Preferências' },
    { id: 5, title: 'Acesso & Pets' },
]

const TIPOS_RESIDENCIA = [
    { value: 'house', label: 'Casa' },
    { value: 'apartment', label: 'Apartamento' },
    { value: 'condo', label: 'Condomínio' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'other', label: 'Outro' },
]

const TIPOS_SERVICO = [
    { value: 'regular', label: 'Regular Cleaning' },
    { value: 'deep', label: 'Deep Cleaning' },
    { value: 'move_in_out', label: 'Move In/Out' },
    { value: 'office', label: 'Office' },
    { value: 'airbnb', label: 'Airbnb' },
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
        tipo_servico_padrao: 'regular',
        frequencia: 'biweekly',
        dia_preferido: 'monday',
        // Step 5 - Acesso & Pets
        acesso_tipo: 'client_home',
        acesso_codigo: '',
        acesso_instrucoes: '',
        tem_pets: false,
        pets_detalhes: '',
        notas_internas: ''
    })

    // Função para buscar endereço pelo ZIP Code (API gratuita)
    const fetchAddressByZip = async (zipCode: string) => {
        if (zipCode.length < 5) return

        try {
            // Usar API Zippopotam.us (gratuita, sem API key)
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

    const handleChange = (key: string, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [key]: value }))
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
        }
        if (step === 2) {
            if (!formData.endereco_completo.trim()) {
                toast.error('Endereço é obrigatório')
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
            tipo_servico_padrao: 'regular',
            frequencia: 'biweekly',
            dia_preferido: 'monday',
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
            // Mapeamento correto para o banco de dados
            const { error } = await supabase.from('clientes').insert([{
                // Dados pessoais
                nome: formData.nome.trim(),
                telefone: formData.telefone.trim(),
                email: formData.email.trim() || null,

                // Endereço
                endereco_completo: formData.endereco_completo.trim(),
                cidade: formData.cidade.trim() || null,
                estado: formData.estado,
                zip_code: formData.zip_code.trim() || null,

                // Detalhes da casa - NOMES CORRETOS DO BANCO
                tipo_residencia: formData.tipo_residencia,
                bedrooms: parseInt(formData.bedrooms) || null,
                bathrooms: parseFloat(formData.bathrooms) || null,
                square_feet: parseInt(formData.square_feet) || null,

                // Preferências - NOMES CORRETOS DO BANCO
                tipo_servico_padrao: formData.tipo_servico_padrao,
                frequencia: formData.frequencia,
                dia_preferido: formData.dia_preferido,

                // Acesso - NOMES CORRETOS DO BANCO
                acesso_tipo: formData.acesso_tipo,
                acesso_codigo: formData.acesso_codigo.trim() || null,
                acesso_instrucoes: formData.acesso_instrucoes.trim() || null,

                // Pets - NOMES CORRETOS DO BANCO
                tem_pets: formData.tem_pets,
                pets_detalhes: formData.pets_detalhes.trim() || null,

                // Notas
                notas_internas: formData.notas_internas.trim() || null,

                // Status inicial
                status: 'lead'
            }])

            if (error) throw error

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
                            <Label>Nome *</Label>
                            <Input
                                value={formData.nome}
                                onChange={e => handleChange('nome', e.target.value)}
                                placeholder="Nome completo"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Telefone *</Label>
                            <Input
                                value={formData.telefone}
                                onChange={e => handleChange('telefone', e.target.value)}
                                placeholder="(000) 000-0000"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={formData.email}
                                onChange={e => handleChange('email', e.target.value)}
                                placeholder="email@exemplo.com"
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
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 5)
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
                                <Input
                                    value={formData.estado}
                                    onChange={e => handleChange('estado', e.target.value)}
                                    placeholder="FL"
                                    maxLength={2}
                                />
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
                                <Label>Quartos</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={formData.bedrooms}
                                    onChange={e => handleChange('bedrooms', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Banheiros</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={formData.bathrooms}
                                    onChange={e => handleChange('bathrooms', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Área (sqft)</Label>
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

                {/* Step 4: Preferências */}
                {step === 4 && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Serviço Preferido</Label>
                            <Select
                                value={formData.tipo_servico_padrao}
                                onValueChange={v => handleChange('tipo_servico_padrao', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {TIPOS_SERVICO.map(t => (
                                        <SelectItem key={t.value} value={t.value}>
                                            {t.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Frequência</Label>
                            <Select
                                value={formData.frequencia}
                                onValueChange={v => handleChange('frequencia', v)}
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
                        </div>
                        <div className="space-y-2">
                            <Label>Dia Preferido</Label>
                            <Select
                                value={formData.dia_preferido}
                                onValueChange={v => handleChange('dia_preferido', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {DIAS_SEMANA.map(d => (
                                        <SelectItem key={d.value} value={d.value}>
                                            {d.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
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
                                        placeholder="Lockbox ao lado da porta..."
                                        rows={2}
                                    />
                                </div>
                            </>
                        )}

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="tem_pets"
                                    checked={formData.tem_pets}
                                    onChange={e => handleChange('tem_pets', e.target.checked)}
                                    className="rounded border-gray-300"
                                />
                                <Label htmlFor="tem_pets">Tem pets?</Label>
                            </div>
                        </div>

                        {formData.tem_pets && (
                            <div className="space-y-2">
                                <Label>Detalhes sobre os Pets</Label>
                                <Textarea
                                    value={formData.pets_detalhes}
                                    onChange={e => handleChange('pets_detalhes', e.target.value)}
                                    placeholder="2 cachorros, amigáveis..."
                                    rows={2}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Notas Internas</Label>
                            <Textarea
                                value={formData.notas_internas}
                                onChange={e => handleChange('notas_internas', e.target.value)}
                                placeholder="Observações sobre o cliente..."
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
                        Voltar
                    </Button>

                    {step < STEPS.length ? (
                        <Button
                            type="button"
                            onClick={handleNext}
                            className="bg-[#C48B7F] hover:bg-[#A66D60]"
                        >
                            Próximo
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
                                    Salvando...
                                </>
                            ) : (
                                'Cadastrar Cliente'
                            )}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

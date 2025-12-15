'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react'

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

export function ClientModal({ open, onOpenChange, onSuccess }: ClientModalProps) {
    const [step, setStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()

    const [formData, setFormData] = useState({
        // Step 1
        nome: '',
        telefone: '',
        email: '',
        // Step 2
        endereco_rua: '',
        endereco_cidade: '',
        endereco_estado: '',
        endereco_zip: '',
        // Step 3
        tipo_residencia: 'casa',
        quartos: '3',
        banheiros: '2',
        area_sqft: '',
        // Step 4
        tipo_servico_pref: 'regular',
        frequencia: 'weekly',
        dia_preferido: 'monday',
        // Step 5
        tipo_acesso: 'code',
        codigo_acesso: '',
        pets_info: '',
        notas_internas: ''
    })

    const handleChange = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }))
    }

    const handleNext = () => {
        if (step < STEPS.length) setStep(step + 1)
    }

    const handlePrev = () => {
        if (step > 1) setStep(step - 1)
    }

    const handleSubmit = async () => {
        setIsLoading(true)
        try {
            const { error } = await supabase.from('clientes').insert([{
                nome: formData.nome,
                telefone: formData.telefone,
                email: formData.email,
                endereco_rua: formData.endereco_rua,
                endereco_cidade: formData.endereco_cidade,
                endereco_estado: formData.endereco_estado,
                endereco_zip: formData.endereco_zip,
                tipo_residencia: formData.tipo_residencia,
                quartos: parseInt(formData.quartos) || 0,
                banheiros: parseFloat(formData.banheiros) || 0,
                area_sqft: parseFloat(formData.area_sqft) || 0,
                tipo_servico_pref: formData.tipo_servico_pref,
                frequencia: formData.frequencia,
                dia_preferido: formData.dia_preferido,
                tipo_acesso: formData.tipo_acesso,
                codigo_acesso: formData.codigo_acesso,
                pets_info: formData.pets_info,
                notas_internas: formData.notas_internas,
                status: 'lead'
            }])

            if (error) throw error

            toast.success('Cliente cadastrado com sucesso!')
            onOpenChange(false)
            setStep(1)
            onSuccess?.()
        } catch (error) {
            console.error(error)
            toast.error('Erro ao cadastrar cliente')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Novo Cliente - Passo {step} de 5</DialogTitle>
                    <p className="text-sm text-muted-foreground">{STEPS[step - 1].title}</p>
                </DialogHeader>

                <div className="py-4">
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nome Completo*</Label>
                                <Input value={formData.nome} onChange={e => handleChange('nome', e.target.value)} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Telefone*</Label>
                                    <Input value={formData.telefone} onChange={e => handleChange('telefone', e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input value={formData.email} onChange={e => handleChange('email', e.target.value)} type="email" />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Endereço (Rua)*</Label>
                                <Input value={formData.endereco_rua} onChange={e => handleChange('endereco_rua', e.target.value)} required />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2 col-span-1">
                                    <Label>Cidade</Label>
                                    <Input value={formData.endereco_cidade} onChange={e => handleChange('endereco_cidade', e.target.value)} />
                                </div>
                                <div className="space-y-2 col-span-1">
                                    <Label>Estado</Label>
                                    <Input value={formData.endereco_estado} onChange={e => handleChange('endereco_estado', e.target.value)} />
                                </div>
                                <div className="space-y-2 col-span-1">
                                    <Label>ZIP Code</Label>
                                    <Input value={formData.endereco_zip} onChange={e => handleChange('endereco_zip', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Tipo de Residência</Label>
                                <Select value={formData.tipo_residencia} onValueChange={v => handleChange('tipo_residencia', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="casa">Casa</SelectItem>
                                        <SelectItem value="apartamento">Apartamento</SelectItem>
                                        <SelectItem value="escritorio">Escritório</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Quartos</Label>
                                    <Input type="number" value={formData.quartos} onChange={e => handleChange('quartos', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Banheiros</Label>
                                    <Input type="number" step="0.5" value={formData.banheiros} onChange={e => handleChange('banheiros', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Área (sqft)</Label>
                                    <Input type="number" value={formData.area_sqft} onChange={e => handleChange('area_sqft', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Serviço Preferido</Label>
                                <Select value={formData.tipo_servico_pref} onValueChange={v => handleChange('tipo_servico_pref', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="regular">Regular</SelectItem>
                                        <SelectItem value="deep">Deep Clean</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Frequência</Label>
                                <Select value={formData.frequencia} onValueChange={v => handleChange('frequencia', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="weekly">Semanal</SelectItem>
                                        <SelectItem value="biweekly">Quinzenal</SelectItem>
                                        <SelectItem value="monthly">Mensal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Dia Preferido</Label>
                                <Select value={formData.dia_preferido} onValueChange={v => handleChange('dia_preferido', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="monday">Segunda</SelectItem>
                                        <SelectItem value="tuesday">Terça</SelectItem>
                                        <SelectItem value="wednesday">Quarta</SelectItem>
                                        <SelectItem value="thursday">Quinta</SelectItem>
                                        <SelectItem value="friday">Sexta</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Tipo de Acesso</Label>
                                    <Select value={formData.tipo_acesso} onValueChange={v => handleChange('tipo_acesso', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="code">Código/Keypad</SelectItem>
                                            <SelectItem value="key">Chave Escondida</SelectItem>
                                            <SelectItem value="person">Alguém em casa</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Código (se houver)</Label>
                                    <Input value={formData.codigo_acesso} onChange={e => handleChange('codigo_acesso', e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Pets</Label>
                                <Input placeholder="Ex: 2 gatos, 1 cachorro..." value={formData.pets_info} onChange={e => handleChange('pets_info', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Notas Internas</Label>
                                <Textarea value={formData.notas_internas} onChange={e => handleChange('notas_internas', e.target.value)} />
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex justify-between items-center sm:justify-between">
                    <Button variant="ghost" onClick={handlePrev} disabled={step === 1}>
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Voltar
                    </Button>
                    {step < 5 ? (
                        <Button onClick={handleNext} className="bg-[#C48B7F] hover:bg-[#A66D60]">
                            Próximo
                            <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={isLoading} className="bg-[#C48B7F] hover:bg-[#A66D60]">
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-2" /> Salvar Cliente</>}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

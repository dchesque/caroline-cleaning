// app/(admin)/admin/contratos/novo/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Loader2, Save, Send, Search } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

const TIPOS_SERVICO = [
    { value: 'regular', label: 'Regular Cleaning' },
    { value: 'deep', label: 'Deep Cleaning' },
    { value: 'move_in_out', label: 'Move In/Out' },
    { value: 'office', label: 'Office Cleaning' },
    { value: 'airbnb', label: 'Airbnb Turnover' },
]

const FREQUENCIAS = [
    { value: 'weekly', label: 'Semanal' },
    { value: 'biweekly', label: 'Quinzenal' },
    { value: 'monthly', label: 'Mensal' },
    { value: 'one_time', label: 'Avulso' },
]

export default function NovoContratoPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [clientes, setClientes] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCliente, setSelectedCliente] = useState<any>(null)
    const [formData, setFormData] = useState({
        tipo_servico: 'regular',
        frequencia: 'biweekly',
        valor_acordado: '',
        desconto_percentual: '0',
        data_inicio: new Date().toISOString().split('T')[0],
        data_fim: '',
        renovacao_automatica: true,
        dia_preferido: 'monday',
        horario_preferido: '09:00',
    })
    
    // State do texto do contrato editável
    const [contractBody, setContractBody] = useState('')
    const [isCustomText, setIsCustomText] = useState(false)

    const supabase = createClient()

    // Função que constrói o texto padrão do contrato se o admin não editou manualmente
    useEffect(() => {
        if (isCustomText) return; // Se ele editou na mão, não sobreescrevemos

        const tipoNome = TIPOS_SERVICO.find(t => t.value === formData.tipo_servico)?.label || 'Outros'
        const freqNome = FREQUENCIAS.find(f => f.value === formData.frequencia)?.label || 'Outros'
        const valorFinal = formData.valor_acordado 
            ? (parseFloat(formData.valor_acordado) * (1 - (parseFloat(formData.desconto_percentual || '0') / 100))).toFixed(2)
            : '__________';

        const getFullAddress = (client: any) => {
            if (!client) return '___________________________';
            const parts = [];
            if (client.endereco_completo) parts.push(client.endereco_completo);
            if (client.cidade) parts.push(client.cidade);
            if (client.estado || client.zip_code) {
                parts.push(`${client.estado || ''} ${client.zip_code || ''}`.trim());
            }
            return parts.join(', ') || '___________________________';
        };

        const defaultBody = `🧼 CLEANING SERVICES - TERMS OF SERVICE & SERVICE AGREEMENT

CLIENT INFORMATION
Name: ${selectedCliente?.nome || '___________________________'}
Address: ${getFullAddress(selectedCliente)}
Phone: ${selectedCliente?.telefone || '___________________________'}
Email: ${selectedCliente?.email || '___________________________'}

1. Agreement Overview
This document outlines the terms and conditions for residential cleaning services provided by Chesque Premium Cleaning ("Company").
By scheduling, booking, or authorizing cleaning services, the client ("Client") agrees to these Terms of Service.

2. Services Provided
The Company offers residential cleaning services, which may include, but are not limited to:
Regular Cleaning / Deep Cleaning / Move-In / Move-Out Cleaning
The scope of each service is based on the service selected by the Client and the details agreed upon at the time of booking.

3. Additional Services & Extra Charges
Some services are not included in standard cleaning packages and may result in additional charges. Additional services may increase the total price and cleaning time and must be approved by the Client before being performed.

4. Access to the Property & Authorization to Enter
The Client expressly authorizes the Company and its cleaning professionals to enter the property for the purpose of providing cleaning services, whether or not the Client is present at the time of service.
The Company is not responsible for delays or inability to perform services due to access issues.

5. Client Responsibilities
The Client agrees to:
Ensure the property is safe and accessible at the scheduled time. The Company is not responsible for pre-existing damage or normal wear and tear.

6. Cleaning Products & Equipment
Standard cleaning products are provided by the Client, unless otherwise agreed.

7. Company Responsibilities & Limitations
The Company agrees to perform services with reasonable care and professionalism. The Company does not guarantee the removal of permanent stains.

8. Damages, Breakage & Claims
In the unlikely event of damage caused directly by the Company, the Client must notify the Company within 24 hours of service completion. Liability is limited to repair or replacement at the Company's discretion.

9. Cancellations, Pauses & Changes
The Client may cancel, reschedule, or pause services at any time. There are no long-term commitments or cancellation penalties unless otherwise agreed in writing.

10. Payments & Pricing
Prices are based on the selected service type, property condition, size, frequency, and any additional services requested. Changes in condition, size, or scope may result in price adjustments.

11. Service Details & Client Commitment
This section confirms the specific service requested by the Client and establishes the agreed service terms.

Type of Service: ${tipoNome}
Service Frequency: ${freqNome}
Service Dates: Starts on ${formData.data_inicio}${formData.data_fim ? ' until ' + formData.data_fim : ''}
Scheduled Time: ${formData.horario_preferido || 'TBD'}
Service Price: $ ${valorFinal}

The Client acknowledges that these service details were reviewed, understood, and accepted, and agrees to maintain this commitment unless changes are requested in advance.

12. Acceptance of Terms
Client Name: ${selectedCliente ? selectedCliente.nome : '_______________________________'}
Property Address: ${selectedCliente ? (selectedCliente.endereco_completo || '___________________________') : '___________________________'}`;

        setContractBody(defaultBody)
    }, [formData, selectedCliente, isCustomText])

    // Buscar clientes
    useEffect(() => {
        const fetchClientes = async () => {
            setIsLoading(true)
            const { data } = await supabase
                .from('clientes')
                .select('id, nome, telefone, email, endereco_completo, cidade, estado, zip_code')
                .ilike('nome', `%${searchTerm}%`)
                .limit(10)
                .order('nome')

            setClientes(data || [])
            setIsLoading(false)
        }

        if (searchTerm.length >= 2) {
            fetchClientes()
        } else {
            setClientes([])
        }
    }, [searchTerm])

    const handleSave = async (enviar: boolean = false) => {
        if (!selectedCliente) {
            toast.error('Selecione um cliente')
            return
        }

        if (!formData.valor_acordado) {
            toast.error('Informe o valor acordado')
            return
        }

        setIsSaving(true)

        try {
            const { data: contrato, error } = await supabase
                .from('contratos')
                .insert({
                    cliente_id: selectedCliente.id,
                    tipo_servico: formData.tipo_servico,
                    frequencia: formData.frequencia,
                    valor_acordado: parseFloat(formData.valor_acordado),
                    desconto_percentual: parseFloat(formData.desconto_percentual),
                    data_inicio: formData.data_inicio,
                    data_fim: formData.data_fim || null,
                    renovacao_automatica: formData.renovacao_automatica,
                    status: enviar ? 'enviado' : 'pendente',
                    documento_corpo: contractBody, // Salva o texto do contrato
                })
                .select()
                .single()

            if (error) throw error

            // Atualizar cliente com referência ao contrato
            await supabase
                .from('clientes')
                .update({ contrato_id: contrato.id, status: 'ativo' })
                .eq('id', selectedCliente.id)

            // Create recurrence if needed
            if (contrato && formData.frequencia !== 'one_time') {
                await supabase.from('recorrencias').insert({
                    cliente_id: selectedCliente.id,
                    frequencia: formData.frequencia,
                    dia_preferido: formData.dia_preferido,
                    horario: formData.horario_preferido,
                    tipo_servico: formData.tipo_servico,
                    valor_acordado: parseFloat(formData.valor_acordado),
                    data_inicio: formData.data_inicio,
                    ativo: true,
                })
            }

            toast.success(enviar ? 'Contrato criado e enviado!' : 'Contrato salvo como rascunho!')
            router.push(`/admin/contratos/${contrato.id}`)

        } catch (error: any) {
            console.error('Error saving contract:', error)
            toast.error(`Erro: ${error.message || error.details || 'Falha ao salvar contrato'}`)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/contratos">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="font-heading text-h2 text-foreground">Novo Contrato</h1>
                    <p className="text-body text-muted-foreground">
                        Crie um novo contrato de serviço
                    </p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Buscar Cliente */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Cliente</CardTitle>
                            <CardDescription>Busque e selecione o cliente</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por nome..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"
                                />
                            </div>

                            {isLoading && (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                </div>
                            )}

                            {clientes.length > 0 && !selectedCliente && (
                                <div className="border rounded-lg divide-y">
                                    {clientes.map((cliente) => (
                                        <div
                                            key={cliente.id}
                                            className="p-3 hover:bg-pampas cursor-pointer transition-colors"
                                            onClick={() => {
                                                setSelectedCliente(cliente)
                                                setSearchTerm('')
                                            }}
                                        >
                                            <p className="font-medium">{cliente.nome}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {cliente.telefone} • {cliente.email}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {selectedCliente && (
                                <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium text-success">{selectedCliente.nome}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {selectedCliente.telefone}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {selectedCliente.endereco_completo}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedCliente(null)}
                                        >
                                            Alterar
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Detalhes do Serviço */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalhes do Serviço</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Tipo de Serviço</Label>
                                    <Select
                                        value={formData.tipo_servico}
                                        onValueChange={(v) => setFormData({ ...formData, tipo_servico: v })}
                                    >
                                        <SelectTrigger className="bg-white border-gray-200 shadow-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TIPOS_SERVICO.map((t) => (
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
                                        onValueChange={(v) => setFormData({ ...formData, frequencia: v })}
                                    >
                                        <SelectTrigger className="bg-white border-gray-200 shadow-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {FREQUENCIAS.map((f) => (
                                                <SelectItem key={f.value} value={f.value}>
                                                    {f.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Recurrence Details */}
                            {formData.frequencia !== 'one_time' && (
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Dia Preferido</Label>
                                        <Select
                                            value={formData.dia_preferido}
                                            onValueChange={(v) => setFormData({ ...formData, dia_preferido: v })}
                                        >
                                            <SelectTrigger className="bg-white border-gray-200 shadow-sm"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="monday">Segunda-feira</SelectItem>
                                                <SelectItem value="tuesday">Terça-feira</SelectItem>
                                                <SelectItem value="wednesday">Quarta-feira</SelectItem>
                                                <SelectItem value="thursday">Quinta-feira</SelectItem>
                                                <SelectItem value="friday">Sexta-feira</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Horário Preferido</Label>
                                        <Input
                                            type="time"
                                            value={formData.horario_preferido}
                                            onChange={(e) => setFormData({ ...formData, horario_preferido: e.target.value })}
                                            className="bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Valor Acordado ($)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.valor_acordado}
                                        onChange={(e) => setFormData({ ...formData, valor_acordado: e.target.value })}
                                        placeholder="150.00"
                                        className="bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Desconto (%)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.desconto_percentual}
                                        onChange={(e) => setFormData({ ...formData, desconto_percentual: e.target.value })}
                                        className="bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"
                                    />
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Data de Início</Label>
                                    <Input
                                        type="date"
                                        value={formData.data_inicio}
                                        onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                                        className="bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Data de Término (opcional)</Label>
                                    <Input
                                        type="date"
                                        value={formData.data_fim}
                                        onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                                        className="bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Texto do Contrato */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Termos do Contrato</CardTitle>
                            <CardDescription>
                                Revise ou altere o detalhamento gerado para o termo/contrato deste cliente
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                className="min-h-[400px] font-mono text-sm leading-relaxed"
                                value={contractBody}
                                onChange={(e) => {
                                    setContractBody(e.target.value)
                                    setIsCustomText(true)
                                }}
                            />
                            {isCustomText && (
                                <p className="text-xs text-muted-foreground mt-2">
                                    O texto foi editado manualmente. Alterar o formulário não irá mais sobrescrever o texto.
                                    <button 
                                        className="text-brandy-rose-600 ml-2 underline" 
                                        onClick={() => setIsCustomText(false)}
                                    >
                                        Restaurar template dinâmico
                                    </button>
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Resumo</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Valor:</span>
                                <span className="font-medium">
                                    {formData.valor_acordado ? formatCurrency(parseFloat(formData.valor_acordado)) : '-'}
                                </span>
                            </div>
                            {parseFloat(formData.desconto_percentual) > 0 && (
                                <div className="flex justify-between text-success">
                                    <span>Desconto ({formData.desconto_percentual}%):</span>
                                    <span>
                                        -{formatCurrency(parseFloat(formData.valor_acordado) * parseFloat(formData.desconto_percentual) / 100)}
                                    </span>
                                </div>
                            )}
                            <div className="border-t pt-3 flex justify-between">
                                <span className="font-medium">Total:</span>
                                <span className="font-bold text-lg">
                                    {formData.valor_acordado
                                        ? formatCurrency(
                                            parseFloat(formData.valor_acordado) * (1 - parseFloat(formData.desconto_percentual) / 100)
                                        )
                                        : '-'
                                    }
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-4 pt-4 border-t">
                        <Button
                            className="w-full gap-2 h-12 text-base"
                            onClick={() => handleSave(false)}
                            disabled={isSaving || !selectedCliente}
                        >
                            {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                            Salvar Contrato
                        </Button>
                        <p className="text-xs text-center text-muted-foreground mt-2">
                            O contrato será salvo. Você poderá enviar para o cliente através da página de detalhes.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

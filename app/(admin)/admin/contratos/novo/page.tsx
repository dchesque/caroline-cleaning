// app/(admin)/admin/contratos/novo/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

    const supabase = createClient()

    // Buscar clientes
    useEffect(() => {
        const fetchClientes = async () => {
            setIsLoading(true)
            const { data } = await supabase
                .from('clientes')
                .select('id, nome, telefone, email, endereco_completo')
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

                    <div className="space-y-2">
                        <Button
                            className="w-full gap-2"
                            onClick={() => handleSave(true)}
                            disabled={isSaving || !selectedCliente}
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Criar e Enviar
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full gap-2"
                            onClick={() => handleSave(false)}
                            disabled={isSaving || !selectedCliente}
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

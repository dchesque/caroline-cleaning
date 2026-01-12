'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { FORMAS_PAGAMENTO } from './constants'
import { CategoryQuickForm } from './category-quick-form'

interface TransactionFormProps {
    type: 'receita' | 'custo'
    transaction?: any | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function TransactionForm({
    type,
    transaction,
    open,
    onOpenChange,
    onSuccess
}: TransactionFormProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        categoria: '',
        subcategoria: '',
        descricao: '',
        valor: '',
        data: new Date().toISOString().split('T')[0],
        forma_pagamento: '',
        status: 'pendente', // Default for receitas
        cliente_id: 'null' // Optional for receitas
    })
    const [clientes, setClientes] = useState<any[]>([])
    const [dbCategories, setDbCategories] = useState<any[]>([])
    const supabase = createClient()

    useEffect(() => {
        if (transaction) {
            setFormData({
                categoria: transaction.categoria,
                subcategoria: transaction.subcategoria || '',
                descricao: transaction.descricao || '',
                valor: transaction.valor.toString(),
                data: transaction.data,
                forma_pagamento: transaction.forma_pagamento,
                status: transaction.status || 'pendente',
                cliente_id: transaction.cliente_id || 'null'
            })
        } else {
            // Reset form
            setFormData({
                categoria: '',
                subcategoria: '',
                descricao: '',
                valor: '',
                data: new Date().toISOString().split('T')[0],
                forma_pagamento: '',
                status: type === 'receita' ? 'pendente' : 'pago', // Expenses usually paid immediately
                cliente_id: 'null'
            })
        }
    }, [transaction, open, type])

    const fetchCategories = async () => {
        const { data } = await supabase
            .from('financeiro_categorias')
            .select('*')
            .eq('tipo', type)
            .eq('ativo', true)
            .order('nome')

        if (data) setDbCategories(data)
    }

    useEffect(() => {
        if (open) {
            fetchCategories()
        }
    }, [open, type])

    useEffect(() => {
        if (type === 'receita') {
            const fetchClientes = async () => {
                const { data } = await supabase
                    .from('clientes')
                    .select('id, nome')
                    .order('nome')

                if (data) setClientes(data)
            }
            fetchClientes()
        }
    }, [type])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const valor = parseFloat(formData.valor)
            if (isNaN(valor)) {
                toast.error('Por favor, insira um valor válido.')
                setLoading(false)
                return
            }

            const payload: any = {
                tipo: type,
                categoria: formData.categoria,
                subcategoria: formData.subcategoria || null,
                descricao: formData.descricao,
                valor: valor,
                data: formData.data,
                forma_pagamento: formData.forma_pagamento,
                status: formData.status,
            }

            if (type === 'receita' && formData.cliente_id !== 'null') {
                payload.cliente_id = formData.cliente_id
            }

            if (transaction) {
                const { error } = await supabase
                    .from('financeiro')
                    .update(payload)
                    .eq('id', transaction.id)

                if (error) throw error
                toast.success(`${type === 'receita' ? 'Receita' : 'Despesa'} atualizada com sucesso!`)
            } else {
                const { error } = await supabase
                    .from('financeiro')
                    .insert(payload)

                if (error) throw error
                toast.success(`${type === 'receita' ? 'Receita' : 'Despesa'} criada com sucesso!`)
            }

            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            toast.error('Erro ao salvar transação')
        } finally {
            setLoading(false)
        }
    }

    // Removido categorias fixas para usar as do banco
    // const categories = type === 'receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {transaction ? 'Editar' : 'Nova'} {type === 'receita' ? 'Receita' : 'Despesa'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Cliente Select (Only for Receita) */}
                    {type === 'receita' && (
                        <div className="space-y-2">
                            <Label>Cliente (Opcional)</Label>
                            <Select
                                value={formData.cliente_id}
                                onValueChange={(val) => setFormData({ ...formData, cliente_id: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um cliente" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="null">Nenhum / Avulso</SelectItem>
                                    {clientes.map(cliente => (
                                        <SelectItem key={cliente.id} value={cliente.id}>
                                            {cliente.nome}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Categoria</Label>
                            <div className="flex gap-2">
                                <Select
                                    value={formData.categoria}
                                    onValueChange={(val) => setFormData({ ...formData, categoria: val })}
                                    required
                                >
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {dbCategories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.nome}>
                                                {cat.nome}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <CategoryQuickForm
                                    tipo={type}
                                    onSuccess={(newCat) => {
                                        setDbCategories(prev => [...prev, newCat].sort((a, b) => a.nome.localeCompare(b.nome)))
                                        setFormData(prev => ({ ...prev, categoria: newCat.nome }))
                                    }}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Valor ($)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.valor}
                                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Input
                            value={formData.descricao}
                            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                            placeholder="Ex: Limpeza Residencial"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Data</Label>
                            <Input
                                type="date"
                                value={formData.data}
                                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Pagamento</Label>
                            <Select
                                value={formData.forma_pagamento}
                                onValueChange={(val) => setFormData({ ...formData, forma_pagamento: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    {FORMAS_PAGAMENTO.map(forma => (
                                        <SelectItem key={forma.value} value={forma.value}>
                                            {forma.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {type === 'receita' && (
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(val) => setFormData({ ...formData, status: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pendente">Pendente</SelectItem>
                                    <SelectItem value="pago">Pago</SelectItem>
                                    <SelectItem value="cancelado">Cancelado</SelectItem>
                                    <SelectItem value="reembolsado">Reembolsado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Salvar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

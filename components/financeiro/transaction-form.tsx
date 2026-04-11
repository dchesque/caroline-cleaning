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
import { useAdminI18n } from '@/lib/admin-i18n/context'

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
    const { t } = useAdminI18n()
    const txT = t('finance_transaction')
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        categoria: '',
        subcategoria: '',
        descricao: '',
        valor: '',
        data: new Date().toISOString().split('T')[0],
        forma_pagamento: '',
        status: 'pendente',
        cliente_id: 'null'
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
            setFormData({
                categoria: '',
                subcategoria: '',
                descricao: '',
                valor: '',
                data: new Date().toISOString().split('T')[0],
                forma_pagamento: '',
                status: type === 'receita' ? 'pendente' : 'pago',
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
                toast.error(txT.invalidValue)
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
                toast.success(type === 'receita' ? txT.revenueUpdated : txT.expenseUpdated)
            } else {
                const { error } = await supabase
                    .from('financeiro')
                    .insert(payload)

                if (error) throw error

                // Notify admins when a paid revenue is logged (fire-and-forget)
                if (type === 'receita' && formData.status === 'pago') {
                    const clientName = clientes.find(c => c.id === formData.cliente_id)?.nome
                    fetch('/api/notify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            event: 'paymentReceived',
                            data: {
                                name: clientName || 'Avulso',
                                amount: valor,
                                method: formData.forma_pagamento,
                                description: formData.descricao,
                                date: formData.data,
                            },
                        }),
                    }).catch(() => {})
                }

                toast.success(type === 'receita' ? txT.revenueCreated : txT.expenseCreated)
            }

            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            toast.error(txT.saveError)
        } finally {
            setLoading(false)
        }
    }

    const dialogTitle = transaction
        ? (type === 'receita' ? txT.editRevenue : txT.editExpense)
        : (type === 'receita' ? txT.newRevenue : txT.newExpense)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{dialogTitle}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Cliente Select (Only for Receita) */}
                    {type === 'receita' && (
                        <div className="space-y-2">
                            <Label>{txT.clientOptional}</Label>
                            <Select
                                value={formData.cliente_id}
                                onValueChange={(val) => setFormData({ ...formData, cliente_id: val })}
                            >
                                <SelectTrigger className="bg-white border-gray-200 shadow-sm">
                                    <SelectValue placeholder={txT.selectClient} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="null">{txT.noneWalkIn}</SelectItem>
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
                            <Label>{txT.category}</Label>
                            <div className="flex gap-2">
                                <Select
                                    value={formData.categoria}
                                    onValueChange={(val) => setFormData({ ...formData, categoria: val })}
                                    required
                                >
                                    <SelectTrigger className="flex-1 bg-white border-gray-200 shadow-sm">
                                        <SelectValue placeholder={txT.select} />
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
                            <Label>{txT.value}</Label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.valor}
                                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                                required
                                className="bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>{txT.description}</Label>
                        <Input
                            value={formData.descricao}
                            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                            placeholder={txT.descriptionPlaceholder}
                            required
                            className="bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>{txT.date}</Label>
                            <Input
                                type="date"
                                value={formData.data}
                                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                                required
                                className="bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>{txT.payment}</Label>
                            <Select
                                value={formData.forma_pagamento}
                                onValueChange={(val) => setFormData({ ...formData, forma_pagamento: val })}
                            >
                                <SelectTrigger className="bg-white border-gray-200 shadow-sm">
                                    <SelectValue placeholder={txT.select} />
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
                            <Label>{txT.status}</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(val) => setFormData({ ...formData, status: val })}
                            >
                                <SelectTrigger className="bg-white border-gray-200 shadow-sm">
                                    <SelectValue placeholder={txT.select} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pendente">{txT.statusPending}</SelectItem>
                                    <SelectItem value="pago">{txT.statusPaid}</SelectItem>
                                    <SelectItem value="cancelado">{txT.statusCancelled}</SelectItem>
                                    <SelectItem value="reembolsado">{txT.statusRefunded}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            {txT.cancel}
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {txT.save}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

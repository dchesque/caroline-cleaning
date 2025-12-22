'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    ArrowLeft,
    Plus,
    Loader2,
    Pencil,
    Trash2,
    Package,
    Clock,
    DollarSign
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Interfaces
interface AddonType {
    id: string
    codigo: string
    nome: string
    descricao: string | null
    preco: number
    tipo_cobranca: 'fixo' | 'por_unidade' | 'por_hora'
    unidade: string | null
    minutos_adicionais: number
    ativo: boolean
    ordem: number
}

const TIPOS_COBRANCA = [
    { value: 'fixo', label: 'Preço Fixo' },
    { value: 'por_unidade', label: 'Por Unidade' },
    { value: 'por_hora', label: 'Por Hora' },
]

export default function AddonsPage() {
    const [addons, setAddons] = useState<AddonType[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [editingItem, setEditingItem] = useState<AddonType | null>(null)

    const supabase = createClient()

    useEffect(() => {
        fetchAddons()
    }, [])

    const fetchAddons = async () => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('addons')
            .select('*')
            .order('ordem', { ascending: true })

        if (error) {
            console.error('Error fetching addons:', error)
            toast.error('Erro ao carregar addons')
        } else {
            setAddons(data || [])
        }
        setIsLoading(false)
    }

    const handleCreate = () => {
        setEditingItem({
            id: '',
            codigo: '',
            nome: '',
            descricao: '',
            preco: 0,
            tipo_cobranca: 'fixo',
            unidade: null,
            minutos_adicionais: 15,
            ativo: true,
            ordem: addons.length + 1
        })
        setIsModalOpen(true)
    }

    const handleEdit = (item: AddonType) => {
        setEditingItem({ ...item })
        setIsModalOpen(true)
    }

    const handleSave = async () => {
        if (!editingItem) return

        if (!editingItem.codigo || !editingItem.nome) {
            toast.error('Código e Nome são obrigatórios')
            return
        }

        if (!/^[a-z_]+$/.test(editingItem.codigo)) {
            toast.error('Código deve conter apenas letras minúsculas e underscore')
            return
        }

        setIsSaving(true)
        try {
            const { id, ...dataToSave } = editingItem

            if (id) {
                // Update
                const { error } = await supabase
                    .from('addons')
                    .update(dataToSave)
                    .eq('id', id)

                if (error) throw error
                toast.success('Addon atualizado!')
            } else {
                // Insert
                const { error } = await supabase
                    .from('addons')
                    .insert(dataToSave)

                if (error) throw error
                toast.success('Addon criado!')
            }

            setIsModalOpen(false)
            fetchAddons()
        } catch (error) {
            console.error('Error saving addon:', error)
            toast.error('Erro ao salvar addon')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (id: string, nome: string) => {
        if (!confirm(`Tem certeza que deseja excluir "${nome}"?`)) return

        try {
            const { error } = await supabase
                .from('addons')
                .delete()
                .eq('id', id)

            if (error) throw error
            toast.success('Addon excluído!')
            fetchAddons()
        } catch (error) {
            console.error('Error deleting addon:', error)
            toast.error('Erro ao excluir')
        }
    }

    const toggleActive = async (item: AddonType) => {
        try {
            const { error } = await supabase
                .from('addons')
                .update({ ativo: !item.ativo })
                .eq('id', item.id)

            if (error) throw error
            toast.success(`Addon ${!item.ativo ? 'ativado' : 'desativado'}!`)
            fetchAddons()
        } catch (error) {
            console.error('Error toggling addon status:', error)
            toast.error('Erro ao atualizar status')
        }
    }

    const getPriceLabel = (addon: AddonType) => {
        const price = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(addon.preco)
        if (addon.tipo_cobranca === 'fixo') return price
        if (addon.tipo_cobranca === 'por_hora') return `${price}/hour`
        if (addon.tipo_cobranca === 'por_unidade') return `${price}/${addon.unidade || 'unit'}`
        return price
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/configuracoes">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="font-heading text-2xl font-bold text-foreground">
                            Serviços Adicionais
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Configure os extras (addons) disponíveis para agendamento
                        </p>
                    </div>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Addon
                </Button>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {addons.map((addon) => (
                        <Card key={addon.id} className={cn(
                            "hover:shadow-md transition-shadow relative overflow-hidden group",
                            !addon.ativo && "opacity-75 bg-muted/20"
                        )}>
                            <CardContent className="pt-6 flex flex-col h-full">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-brandy-rose-100 rounded-lg text-brandy-rose-600">
                                            <Package className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg leading-tight">{addon.nome}</h3>
                                            <p className="text-xs font-mono text-muted-foreground mt-0.5">{addon.codigo}</p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={addon.ativo}
                                        onCheckedChange={() => toggleActive(addon)}
                                    />
                                </div>

                                <div className="mb-4 flex-1">
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {addon.descricao || 'Sem descrição definida'}
                                    </p>
                                </div>

                                <div className="space-y-3 mt-auto">
                                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                                        <div className="flex items-center gap-2 text-sm text-foreground">
                                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                                            <span className="font-medium">{getPriceLabel(addon)}</span>
                                        </div>
                                        {addon.minutos_adicionais > 0 && (
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-background px-2 py-1 rounded shadow-sm">
                                                <Clock className="w-3 h-3" />
                                                +{addon.minutos_adicionais}min
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-2">
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(addon)}>
                                            <Pencil className="w-4 h-4 mr-2" />
                                            Editar
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-destructive/70 hover:text-destructive" onClick={() => handleDelete(addon.id, addon.nome)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Add Card */}
                    <Card className="hover:border-primary/50 hover:bg-muted/10 transition-colors border-dashed cursor-pointer flex flex-col items-center justify-center min-h-[220px]" onClick={handleCreate}>
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <Plus className="w-6 h-6 text-primary" />
                        </div>
                        <p className="font-semibold text-primary">Adicionar Addon</p>
                    </Card>
                </div>
            )}

            {/* Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editingItem?.id ? 'Editar Addon' : 'Novo Addon'}
                        </DialogTitle>
                    </DialogHeader>

                    {editingItem && (
                        <div className="grid gap-6 py-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nome</Label>
                                    <Input
                                        value={editingItem.nome}
                                        onChange={e => setEditingItem({ ...editingItem, nome: e.target.value })}
                                        placeholder="Ex: Inside Fridge"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Código (Slug)</Label>
                                    <Input
                                        value={editingItem.codigo}
                                        onChange={e => setEditingItem({ ...editingItem, codigo: e.target.value.toLowerCase() })}
                                        placeholder="Ex: inside_fridge"
                                        disabled={!!editingItem.id}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Descrição</Label>
                                <Textarea
                                    value={editingItem.descricao || ''}
                                    onChange={e => setEditingItem({ ...editingItem, descricao: e.target.value })}
                                    rows={2}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Preço ($)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={editingItem.preco}
                                        onChange={e => setEditingItem({ ...editingItem, preco: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tipo de Cobrança</Label>
                                    <Select
                                        value={editingItem.tipo_cobranca}
                                        onValueChange={(val: any) => setEditingItem({ ...editingItem, tipo_cobranca: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TIPOS_COBRANCA.map(t => (
                                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {editingItem.tipo_cobranca === 'por_unidade' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <Label>Nome da Unidade</Label>
                                    <Input
                                        value={editingItem.unidade || ''}
                                        onChange={e => setEditingItem({ ...editingItem, unidade: e.target.value })}
                                        placeholder="Ex: por janela, por cômodo"
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Tempo Adicional (minutos)</Label>
                                <div className="flex items-center gap-4">
                                    <Input
                                        type="number"
                                        min="0"
                                        step="5"
                                        value={editingItem.minutos_adicionais}
                                        onChange={e => setEditingItem({ ...editingItem, minutos_adicionais: parseInt(e.target.value) })}
                                        className="w-32"
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Tempo extra adicionado à duração total do serviço
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between border rounded-lg p-3">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Ativo</Label>
                                    <p className="text-xs text-muted-foreground">Disponível para seleção</p>
                                </div>
                                <Switch
                                    checked={editingItem.ativo}
                                    onCheckedChange={checked => setEditingItem({ ...editingItem, ativo: checked })}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

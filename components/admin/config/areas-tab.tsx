'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
    Plus,
    Loader2,
    Pencil,
    Trash2,
    MapPin,
    X,
    Navigation
} from 'lucide-react'
import { toast } from 'sonner'

// Interfaces
interface AreaType {
    id: string
    nome: string
    cidade: string
    estado: string
    zip_codes: string[]
    taxa_deslocamento: number
    tempo_deslocamento_minutos: number
    ativo: boolean
    ordem: number
}

// Componente Interno de Input de CEPs
function ZipCodeInput({
    value,
    onChange
}: {
    value: string[],
    onChange: (zips: string[]) => void
}) {
    const [inputValue, setInputValue] = useState('')

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            e.preventDefault()
            const zip = inputValue.trim()
            // Basic 5-digit validation, can be adjusted
            if (/^\d{5}$/.test(zip)) {
                if (!value.includes(zip)) {
                    onChange([...value, zip])
                    setInputValue('')
                } else {
                    toast.error('CEP já adicionado')
                }
            } else {
                toast.error('CEP deve ter 5 dígitos (ex: 33139)')
            }
        }
    }

    const removeZip = (zipToRemove: string) => {
        onChange(value.filter(z => z !== zipToRemove))
    }

    return (
        <div className="space-y-3">
            <Input
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite o CEP (5 dígitos) e pressione Enter"
                className="w-full"
            />
            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-muted/10">
                {value.length === 0 && (
                    <p className="text-sm text-muted-foreground italic px-2">Nenhum CEP adicionado</p>
                )}
                {value.map(zip => (
                    <Badge key={zip} variant="secondary" className="gap-1 pl-2 pr-1 py-1">
                        {zip}
                        <button
                            onClick={() => removeZip(zip)}
                            className="hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </Badge>
                ))}
            </div>
        </div>
    )
}

export function AreasTab() {
    const [areas, setAreas] = useState<AreaType[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [editingItem, setEditingItem] = useState<AreaType | null>(null)

    const supabase = createClient()

    useEffect(() => {
        fetchAreas()
    }, [])

    const fetchAreas = async () => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('areas_atendidas')
            .select('*')
            .order('ordem', { ascending: true })

        if (error) {
            console.error('Error fetching areas:', error)
            toast.error('Erro ao carregar áreas')
        } else {
            setAreas(data || [])
        }
        setIsLoading(false)
    }

    const handleCreate = () => {
        setEditingItem({
            id: '',
            nome: '',
            cidade: 'Miami',
            estado: 'FL',
            zip_codes: [],
            taxa_deslocamento: 0,
            tempo_deslocamento_minutos: 0,
            ativo: true,
            ordem: areas.length + 1
        })
        setIsModalOpen(true)
    }

    const handleEdit = (item: AreaType) => {
        setEditingItem({ ...item })
        setIsModalOpen(true)
    }

    const handleSave = async () => {
        if (!editingItem) return

        if (!editingItem.nome || !editingItem.cidade) {
            toast.error('Nome e Cidade são obrigatórios')
            return
        }

        setIsSaving(true)
        try {
            const { id, ...dataToSave } = editingItem

            if (id) {
                // Update
                const { error } = await supabase
                    .from('areas_atendidas')
                    .update(dataToSave)
                    .eq('id', id)

                if (error) throw error
                toast.success('Área atualizada!')
            } else {
                // Insert
                const { error } = await supabase
                    .from('areas_atendidas')
                    .insert(dataToSave)

                if (error) throw error
                toast.success('Área criada!')
            }

            setIsModalOpen(false)
            fetchAreas()
        } catch (error) {
            console.error('Error saving area:', error)
            toast.error('Erro ao salvar área')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (id: string, nome: string) => {
        if (!confirm(`Tem certeza que deseja excluir a área "${nome}"?`)) return

        try {
            const { error } = await supabase
                .from('areas_atendidas')
                .delete()
                .eq('id', id)

            if (error) throw error
            toast.success('Área excluída!')
            fetchAreas()
        } catch (error) {
            console.error('Error deleting area:', error)
            toast.error('Erro ao excluir área')
        }
    }

    const toggleActive = async (item: AreaType) => {
        try {
            const { error } = await supabase
                .from('areas_atendidas')
                .update({ ativo: !item.ativo })
                .eq('id', item.id)

            if (error) throw error
            toast.success(`Área ${!item.ativo ? 'ativada' : 'desativada'}!`)
            fetchAreas()
        } catch (error) {
            console.error('Error toggling area status:', error)
            toast.error('Erro ao atualizar status')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-medium">Áreas de Cobertura</h2>
                    <p className="text-sm text-muted-foreground">Gerencie as regiões atendidas e taxas de deslocamento</p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Área
                </Button>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {areas.map((area) => (
                        <Card key={area.id} className="hover:shadow-md transition-shadow relative overflow-hidden">
                            {!area.ativo && (
                                <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center pointer-events-none">
                                    <Badge variant="destructive" className="pointer-events-auto">Inativo</Badge>
                                </div>
                            )}
                            <CardContent className="pt-6 flex flex-col h-full">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-success/10 rounded-lg text-success">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">{area.nome}</h3>
                                            <p className="text-sm text-muted-foreground">{area.cidade}, {area.estado}</p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={area.ativo}
                                        onCheckedChange={() => toggleActive(area)}
                                        className="z-20"
                                    />
                                </div>

                                <div className="space-y-3 flex-1">
                                    <div className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-md">
                                        <span className="text-muted-foreground">CEPs Cobertos</span>
                                        <Badge variant="secondary" className="font-mono">
                                            {area.zip_codes?.length || 0}
                                        </Badge>
                                    </div>

                                    {(area.taxa_deslocamento > 0 || area.tempo_deslocamento_minutos > 0) && (
                                        <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                                            {area.taxa_deslocamento > 0 && (
                                                <div className="flex flex-col bg-muted/30 p-2 rounded">
                                                    <span className="text-[10px] text-muted-foreground uppercase">Taxa Extra</span>
                                                    <span className="font-medium text-foreground">${area.taxa_deslocamento}</span>
                                                </div>
                                            )}
                                            {area.tempo_deslocamento_minutos > 0 && (
                                                <div className="flex flex-col bg-muted/30 p-2 rounded">
                                                    <span className="text-[10px] text-muted-foreground uppercase">Tempo Extra</span>
                                                    <span className="font-medium text-foreground">+{area.tempo_deslocamento_minutos}min</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {area.zip_codes && area.zip_codes.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {area.zip_codes.slice(0, 5).map(zip => (
                                                <span key={zip} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                                                    {zip}
                                                </span>
                                            ))}
                                            {area.zip_codes.length > 5 && (
                                                <span className="text-[10px] px-1.5 py-0.5 text-muted-foreground italic">
                                                    +{area.zip_codes.length - 5}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t z-20">
                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(area)}>
                                        <Pencil className="w-4 h-4 mr-2" />
                                        Editar
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive/70 hover:text-destructive" onClick={() => handleDelete(area.id, area.nome)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Add Card */}
                    <Card className="hover:border-primary/50 hover:bg-muted/10 transition-colors border-dashed cursor-pointer flex flex-col items-center justify-center min-h-[200px]" onClick={handleCreate}>
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <Plus className="w-6 h-6 text-primary" />
                        </div>
                        <p className="font-semibold text-primary">Adicionar Nova Área</p>
                    </Card>
                </div>
            )}

            {/* Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingItem?.id ? 'Editar Área' : 'Nova Área de Cobertura'}
                        </DialogTitle>
                    </DialogHeader>

                    {editingItem && (
                        <div className="grid gap-6 py-4">
                            <div className="space-y-4">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Nome da Área</Label>
                                        <Input
                                            value={editingItem.nome}
                                            onChange={e => setEditingItem({ ...editingItem, nome: e.target.value })}
                                            placeholder="Ex: Miami Beach"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Cidade</Label>
                                            <Input
                                                value={editingItem.cidade}
                                                onChange={e => setEditingItem({ ...editingItem, cidade: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Estado</Label>
                                            <Input
                                                value={editingItem.estado}
                                                onChange={e => setEditingItem({ ...editingItem, estado: e.target.value })}
                                                maxLength={2}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Lista de CEPs</Label>
                                    <ZipCodeInput
                                        value={editingItem.zip_codes}
                                        onChange={zips => setEditingItem({ ...editingItem, zip_codes: zips })}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Digite o CEP e pressione Enter para adicionar
                                    </p>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg">
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            Taxa de Deslocamento ($)
                                            <span className="text-[10px] text-muted-foreground font-normal">(Opcional)</span>
                                        </Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={editingItem.taxa_deslocamento}
                                            onChange={e => setEditingItem({ ...editingItem, taxa_deslocamento: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            Tempo de Deslocamento (min)
                                            <Navigation className="w-3 h-3 text-muted-foreground" />
                                        </Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="15"
                                            value={editingItem.tempo_deslocamento_minutos}
                                            onChange={e => setEditingItem({ ...editingItem, tempo_deslocamento_minutos: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between border rounded-lg p-3">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Área Ativa</Label>
                                        <p className="text-xs text-muted-foreground">Habilitar agendamentos para esta região</p>
                                    </div>
                                    <Switch
                                        checked={editingItem.ativo}
                                        onCheckedChange={checked => setEditingItem({ ...editingItem, ativo: checked })}
                                    />
                                </div>
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

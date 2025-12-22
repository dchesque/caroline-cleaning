'use client'

import { useState, useEffect } from 'react'
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
    Plus,
    Loader2,
    Pencil,
    Trash2,
    Sparkles,
    Home,
    Building2,
    Briefcase,
    Plane,
    Star,
    CheckCircle2,
    XCircle
} from 'lucide-react'
import { toast } from 'sonner'

// Schema matching 'servicos_tipos' table (based on previous file content)
interface ServiceType {
    id: string
    codigo: string
    nome: string
    descricao: string | null
    multiplicador_preco: number
    duracao_base_minutos: number
    cor: string
    icone: string
    ativo: boolean
    disponivel_agendamento_online: boolean
    ordem: number
}

const CORES_SERVICO = [
    { value: '#6B8E6B', label: 'Verde (Regular)', preview: 'bg-[#6B8E6B]' },
    { value: '#C4A35A', label: 'Dourado (Deep)', preview: 'bg-[#C4A35A]' },
    { value: '#7B9EB8', label: 'Azul (Move)', preview: 'bg-[#7B9EB8]' },
    { value: '#9B8BB8', label: 'Roxo (Office)', preview: 'bg-[#9B8BB8]' },
    { value: '#C4856B', label: 'Coral (Airbnb)', preview: 'bg-[#C4856B]' },
    { value: '#8B7355', label: 'Marrom', preview: 'bg-[#8B7355]' },
]

const ICONES_SERVICO = [
    { value: 'Sparkles', label: 'Brilho', icon: Sparkles },
    { value: 'Home', label: 'Casa', icon: Home },
    { value: 'Building2', label: 'Prédio', icon: Building2 },
    { value: 'Briefcase', label: 'Escritório', icon: Briefcase },
    { value: 'Plane', label: 'Viagem', icon: Plane },
    { value: 'Star', label: 'Estrela', icon: Star },
]

export default function ServicosPage() {
    const [services, setServices] = useState<ServiceType[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [editingItem, setEditingItem] = useState<ServiceType | null>(null)

    const supabase = createClient()

    useEffect(() => {
        fetchServices()
    }, [])

    const fetchServices = async () => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('servicos_tipos')
            .select('*')
            .order('ordem', { ascending: true })

        if (error) {
            console.error('Error fetching services:', error)
            toast.error('Erro ao carregar serviços')
        } else {
            setServices(data || [])
        }
        setIsLoading(false)
    }

    const handleCreate = () => {
        setEditingItem({
            id: '',
            codigo: '',
            nome: '',
            descricao: '',
            multiplicador_preco: 1.0,
            duracao_base_minutos: 180,
            cor: CORES_SERVICO[0].value,
            icone: 'Sparkles',
            ativo: true,
            disponivel_agendamento_online: true,
            ordem: services.length + 1
        })
        setIsModalOpen(true)
    }

    const handleEdit = (item: ServiceType) => {
        setEditingItem({ ...item })
        setIsModalOpen(true)
    }

    const handleSave = async () => {
        if (!editingItem) return

        // Validate
        if (!editingItem.codigo || !editingItem.nome) {
            toast.error('Preencha os campos obrigatórios')
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
                    .from('servicos_tipos')
                    .update(dataToSave)
                    .eq('id', id)

                if (error) throw error
                toast.success('Serviço atualizado!')
            } else {
                // Insert
                const { error } = await supabase
                    .from('servicos_tipos')
                    .insert(dataToSave)

                if (error) throw error
                toast.success('Serviço criado!')
            }

            setIsModalOpen(false)
            fetchServices()
        } catch (error) {
            console.error('Error saving service:', error)
            toast.error('Erro ao salvar serviço')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (id: string, nome: string) => {
        if (!confirm(`Tem certeza que deseja excluir o serviço "${nome}"?`)) return

        try {
            const { error } = await supabase
                .from('servicos_tipos')
                .delete()
                .eq('id', id)

            if (error) throw error
            toast.success('Serviço excluído!')
            fetchServices()
        } catch (error) {
            console.error('Error deleting service:', error)
            toast.error('Erro ao excluir serviço')
        }
    }

    const toggleActive = async (item: ServiceType) => {
        try {
            const { error } = await supabase
                .from('servicos_tipos')
                .update({ ativo: !item.ativo })
                .eq('id', item.id)

            if (error) throw error
            toast.success(`Serviço ${!item.ativo ? 'ativado' : 'desativado'}!`)
            fetchServices()
        } catch (error) {
            console.error('Error toggling service status:', error)
            toast.error('Erro ao atualizar status')
        }
    }

    const getIconComponent = (iconName: string) => {
        const iconObj = ICONES_SERVICO.find(i => i.value === iconName)
        return iconObj ? iconObj.icon : Sparkles
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-foreground">
                        Nossos Serviços
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Gerencie o catálogo de serviços, preços e durações.
                    </p>
                </div>
                <Button onClick={handleCreate} className="bg-[#C48B7F] hover:bg-[#A66D60]">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Serviço
                </Button>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="grid gap-4">
                    {services.map((service) => {
                        const Icon = getIconComponent(service.icone)

                        return (
                            <Card key={service.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="pt-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">

                                            <div
                                                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                                                style={{ backgroundColor: service.cor }}
                                            >
                                                <Icon className="w-6 h-6 text-white" />
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-lg">{service.nome}</h3>
                                                    <Badge variant="outline" className="font-mono text-xs">
                                                        {service.codigo}
                                                    </Badge>
                                                    {!service.ativo && (
                                                        <Badge variant="destructive">Inativo</Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-1">
                                                    {service.descricao || 'Sem descrição'}
                                                </p>
                                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <span className="font-medium text-foreground">x{service.multiplicador_preco}</span> preço base
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <span className="font-medium text-foreground">{service.duracao_base_minutos}min</span> duração
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 sm:ml-auto">
                                            <div className="flex flex-col gap-1 mr-4">
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    {service.disponivel_agendamento_online ? (
                                                        <CheckCircle2 className="w-3 h-3 text-success" />
                                                    ) : (
                                                        <XCircle className="w-3 h-3 text-muted-foreground" />
                                                    )}
                                                    Online
                                                </div>
                                            </div>

                                            <Switch
                                                checked={service.ativo}
                                                onCheckedChange={() => toggleActive(service)}
                                            />

                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(service)}>
                                                <Pencil className="w-4 h-4 text-muted-foreground" />
                                            </Button>

                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(service.id, service.nome)}>
                                                <Trash2 className="w-4 h-4 text-destructive/70 hover:text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}

                    {services.length === 0 && (
                        <Card className="border-dashed">
                            <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                                <Sparkles className="w-12 h-12 text-muted-foreground/30 mb-4" />
                                <h3 className="font-semibold text-lg mb-2">Nenhum serviço encontrado</h3>
                                <p className="text-muted-foreground mb-4">Comece criando o primeiro tipo de serviço.</p>
                                <Button onClick={handleCreate} className="bg-[#C48B7F] hover:bg-[#A66D60]">
                                    Criar Serviço
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingItem?.id ? 'Editar Serviço' : 'Novo Serviço'}
                        </DialogTitle>
                    </DialogHeader>

                    {editingItem && (
                        <div className="grid gap-6 py-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nome do Serviço</Label>
                                    <Input
                                        value={editingItem.nome}
                                        onChange={e => setEditingItem({ ...editingItem, nome: e.target.value })}
                                        placeholder="Ex: Regular Cleaning"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Código (Slug)</Label>
                                    <Input
                                        value={editingItem.codigo}
                                        onChange={e => setEditingItem({ ...editingItem, codigo: e.target.value.toLowerCase() })}
                                        placeholder="Ex: regular_cleaning"
                                        disabled={!!editingItem.id} // Disable editing code after creation to avoid breaking refs
                                    />
                                    <p className="text-[10px] text-muted-foreground">Único, letras minúsculas e underscore</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Descrição</Label>
                                <Textarea
                                    value={editingItem.descricao || ''}
                                    onChange={e => setEditingItem({ ...editingItem, descricao: e.target.value })}
                                    placeholder="Descrição detalhada do serviço..."
                                    rows={2}
                                />
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Multiplicador de Preço</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        min="0.1"
                                        value={editingItem.multiplicador_preco}
                                        onChange={e => setEditingItem({ ...editingItem, multiplicador_preco: parseFloat(e.target.value) })}
                                    />
                                    <p className="text-[10px] text-muted-foreground">Ex: 1.5 = 50% mais caro que o base</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Duração Base (minutos)</Label>
                                    <Input
                                        type="number"
                                        step="15"
                                        min="30"
                                        value={editingItem.duracao_base_minutos}
                                        onChange={e => setEditingItem({ ...editingItem, duracao_base_minutos: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Cor de Exibição</Label>
                                    <Select
                                        value={editingItem.cor}
                                        onValueChange={val => setEditingItem({ ...editingItem, cor: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione uma cor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CORES_SERVICO.map(color => (
                                                <SelectItem key={color.value} value={color.value}>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-4 h-4 rounded-full bg-[${color.value}]`} style={{ backgroundColor: color.value }} />
                                                        {color.label}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Ícone</Label>
                                    <Select
                                        value={editingItem.icone}
                                        onValueChange={val => setEditingItem({ ...editingItem, icone: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione um ícone" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ICONES_SERVICO.map(icon => (
                                                <SelectItem key={icon.value} value={icon.value}>
                                                    <div className="flex items-center gap-2">
                                                        <icon.icon className="w-4 h-4" />
                                                        {icon.label}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4 pt-2">
                                <div className="flex items-center justify-between border rounded-lg p-3">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Ativo</Label>
                                        <p className="text-xs text-muted-foreground">Disponível no sistema</p>
                                    </div>
                                    <Switch
                                        checked={editingItem.ativo}
                                        onCheckedChange={checked => setEditingItem({ ...editingItem, ativo: checked })}
                                    />
                                </div>

                                <div className="flex items-center justify-between border rounded-lg p-3">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Agendamento Online</Label>
                                        <p className="text-xs text-muted-foreground">Visível no site público</p>
                                    </div>
                                    <Switch
                                        checked={editingItem.disponivel_agendamento_online}
                                        onCheckedChange={checked => setEditingItem({ ...editingItem, disponivel_agendamento_online: checked })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving} className="bg-[#C48B7F] hover:bg-[#A66D60]">
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

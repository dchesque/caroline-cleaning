'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    ArrowLeft,
    Plus,
    Edit,
    Trash,
    Loader2,
    GripVertical
} from 'lucide-react'
import { toast } from 'sonner'

interface ServiceType {
    id: string
    nome: string
    descricao: string
    duracao_padrao: number
    preco_base: number
    cor: string
    ativo: boolean
    ordem: number
}

export default function ServicosConfigPage() {
    const [services, setServices] = useState<ServiceType[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [editingService, setEditingService] = useState<ServiceType | null>(null)

    const [formData, setFormData] = useState({
        nome: '',
        descricao: '',
        duracao_padrao: '180',
        preco_base: '',
        cor: '#BE9982',
        ativo: true,
    })

    const supabase = createClient()

    useEffect(() => {
        fetchServices()
    }, [])

    const fetchServices = async () => {
        setIsLoading(true)
        const { data } = await supabase
            .from('tipos_servico')
            .select('*')
            .order('ordem')

        setServices(data || [])
        setIsLoading(false)
    }

    const handleSave = async () => {
        if (!formData.nome) {
            toast.error('Nome é obrigatório')
            return
        }

        setIsSaving(true)
        try {
            const serviceData = {
                nome: formData.nome,
                descricao: formData.descricao,
                duracao_padrao: parseInt(formData.duracao_padrao),
                preco_base: formData.preco_base ? parseFloat(formData.preco_base) : null,
                cor: formData.cor,
                ativo: formData.ativo,
            }

            if (editingService) {
                const { error } = await supabase
                    .from('tipos_servico')
                    .update(serviceData)
                    .eq('id', editingService.id)
                if (error) throw error
                toast.success('Serviço atualizado!')
            } else {
                const { error } = await supabase
                    .from('tipos_servico')
                    .insert({ ...serviceData, ordem: services.length })
                if (error) throw error
                toast.success('Serviço criado!')
            }

            setIsModalOpen(false)
            resetForm()
            fetchServices()
        } catch (error) {
            console.error('Error:', error)
            toast.error('Erro ao salvar serviço')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este serviço?')) return

        try {
            const { error } = await supabase
                .from('tipos_servico')
                .delete()
                .eq('id', id)

            if (error) throw error
            toast.success('Serviço excluído!')
            fetchServices()
        } catch (error) {
            toast.error('Erro ao excluir serviço')
        }
    }

    const resetForm = () => {
        setFormData({
            nome: '',
            descricao: '',
            duracao_padrao: '180',
            preco_base: '',
            cor: '#BE9982',
            ativo: true,
        })
        setEditingService(null)
    }

    const openEditModal = (service: ServiceType) => {
        setEditingService(service)
        setFormData({
            nome: service.nome,
            descricao: service.descricao || '',
            duracao_padrao: service.duracao_padrao.toString(),
            preco_base: service.preco_base?.toString() || '',
            cor: service.cor || '#BE9982',
            ativo: service.ativo,
        })
        setIsModalOpen(true)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/configuracoes">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="font-heading text-h2 text-foreground">Tipos de Serviço</h1>
                        <p className="text-body text-muted-foreground">
                            Configure os serviços oferecidos
                        </p>
                    </div>
                </div>

                <Dialog open={isModalOpen} onOpenChange={(open) => {
                    setIsModalOpen(open)
                    if (!open) resetForm()
                }}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" />
                            Novo Serviço
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingService ? 'Editar Serviço' : 'Novo Serviço'}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nome *</Label>
                                <Input
                                    value={formData.nome}
                                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                    placeholder="Ex: Limpeza Regular"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Descrição</Label>
                                <Textarea
                                    value={formData.descricao}
                                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                    placeholder="Descrição do serviço..."
                                    rows={3}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Duração Padrão (min)</Label>
                                    <Input
                                        type="number"
                                        value={formData.duracao_padrao}
                                        onChange={(e) => setFormData({ ...formData, duracao_padrao: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Preço Base ($)</Label>
                                    <Input
                                        type="number"
                                        value={formData.preco_base}
                                        onChange={(e) => setFormData({ ...formData, preco_base: e.target.value })}
                                        placeholder="150.00"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Cor</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="color"
                                            value={formData.cor}
                                            onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                                            className="w-12 h-10 p-1"
                                        />
                                        <Input
                                            value={formData.cor}
                                            onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                                            className="flex-1"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <div className="flex items-center gap-2 h-10">
                                        <Switch
                                            checked={formData.ativo}
                                            onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                                        />
                                        <span className="text-body-sm">
                                            {formData.ativo ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => {
                                    setIsModalOpen(false)
                                    resetForm()
                                }}>
                                    Cancelar
                                </Button>
                                <Button onClick={handleSave} disabled={isSaving}>
                                    {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    {editingService ? 'Salvar' : 'Criar'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Services List */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-6 text-center text-muted-foreground">Carregando...</div>
                    ) : services.length === 0 ? (
                        <div className="p-6 text-center text-muted-foreground">
                            Nenhum serviço cadastrado
                        </div>
                    ) : (
                        <div className="divide-y divide-pampas">
                            {services.map((service) => (
                                <div key={service.id} className="flex items-center gap-4 p-4">
                                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                                    <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: service.cor }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">{service.nome}</p>
                                            <Badge variant={service.ativo ? 'success' : 'secondary'}>
                                                {service.ativo ? 'Ativo' : 'Inativo'}
                                            </Badge>
                                        </div>
                                        <p className="text-caption text-muted-foreground">
                                            {service.duracao_padrao} min
                                            {service.preco_base && ` • $${service.preco_base}`}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openEditModal(service)}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(service.id)}
                                        >
                                            <Trash className="w-4 h-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

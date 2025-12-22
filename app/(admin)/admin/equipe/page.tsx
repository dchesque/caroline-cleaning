// app/(admin)/admin/equipe/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Plus,
    Loader2,
    MoreHorizontal,
    Pencil,
    Trash2,
    Phone,
    Mail,
    Calendar,
    Users2
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Membro {
    id: string
    nome: string
    telefone: string | null
    email: string | null
    cargo: 'cleaner' | 'supervisor' | 'admin'
    foto_url: string | null
    cor: string
    ativo: boolean
    data_admissao: string
    notas: string | null
}

const CARGOS = [
    { value: 'cleaner', label: 'Cleaner' },
    { value: 'supervisor', label: 'Supervisor' },
    { value: 'admin', label: 'Administrador' },
]

const CORES = [
    { value: '#C48B7F', label: 'Rosa' },
    { value: '#6B8E6B', label: 'Verde' },
    { value: '#7B9EB8', label: 'Azul' },
    { value: '#C4A35A', label: 'Dourado' },
    { value: '#9B8BB8', label: 'Roxo' },
    { value: '#C4856B', label: 'Coral' },
]

export default function EquipePage() {
    const [membros, setMembros] = useState<Membro[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [editingMembro, setEditingMembro] = useState<Membro | null>(null)

    const supabase = createClient()

    useEffect(() => {
        fetchMembros()
    }, [])

    const fetchMembros = async () => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('equipe')
            .select('*')
            .order('nome')

        if (error) {
            toast.error('Erro ao carregar equipe')
        } else {
            setMembros(data || [])
        }
        setIsLoading(false)
    }

    const handleCreate = () => {
        setEditingMembro({
            id: '',
            nome: '',
            telefone: '',
            email: '',
            cargo: 'cleaner',
            foto_url: null,
            cor: '#C48B7F',
            ativo: true,
            data_admissao: new Date().toISOString().split('T')[0],
            notas: ''
        })
        setIsModalOpen(true)
    }

    const handleEdit = (membro: Membro) => {
        setEditingMembro({ ...membro })
        setIsModalOpen(true)
    }

    const handleSave = async () => {
        if (!editingMembro?.nome) {
            toast.error('Nome é obrigatório')
            return
        }

        setIsSaving(true)

        try {
            const { id, ...data } = editingMembro

            if (id) {
                // Atualizar
                const { error } = await supabase
                    .from('equipe')
                    .update(data)
                    .eq('id', id)

                if (error) throw error
                toast.success('Membro atualizado!')
            } else {
                // Criar
                const { error } = await supabase
                    .from('equipe')
                    .insert(data)

                if (error) throw error
                toast.success('Membro adicionado!')
            }

            setIsModalOpen(false)
            fetchMembros()
        } catch (error) {
            console.error(error)
            toast.error('Erro ao salvar')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover este membro?')) return

        try {
            const { error } = await supabase
                .from('equipe')
                .update({ ativo: false })
                .eq('id', id)

            if (error) throw error
            toast.success('Membro removido!')
            fetchMembros()
        } catch (error) {
            toast.error('Erro ao remover')
        }
    }

    const getInitials = (nome: string) => {
        return nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-heading text-h2 text-foreground">Equipe</h1>
                    <p className="text-body text-muted-foreground">
                        Gerencie os membros da sua equipe
                    </p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Membro
                </Button>
            </div>

            {/* Grid de Membros */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : membros.filter(m => m.ativo).length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Users2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Nenhum membro cadastrado</p>
                        <Button className="mt-4" onClick={handleCreate}>
                            Adicionar Primeiro Membro
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {membros.filter(m => m.ativo).map((membro) => (
                        <Card key={membro.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="w-12 h-12" style={{ borderColor: membro.cor, borderWidth: 2 }}>
                                            <AvatarImage src={membro.foto_url || undefined} />
                                            <AvatarFallback style={{ backgroundColor: membro.cor + '20', color: membro.cor }}>
                                                {getInitials(membro.nome)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{membro.nome}</p>
                                            <Badge variant="secondary" className="text-xs">
                                                {CARGOS.find(c => c.value === membro.cargo)?.label}
                                            </Badge>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEdit(membro)}>
                                                <Pencil className="w-4 h-4 mr-2" />
                                                Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleDelete(membro.id)}
                                                className="text-destructive"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Remover
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                                    {membro.telefone && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4" />
                                            {membro.telefone}
                                        </div>
                                    )}
                                    {membro.email && (
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4" />
                                            {membro.email}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Desde {format(new Date(membro.data_admissao), 'MMM yyyy')}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingMembro?.id ? 'Editar Membro' : 'Novo Membro'}
                        </DialogTitle>
                    </DialogHeader>

                    {editingMembro && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nome *</Label>
                                <Input
                                    value={editingMembro.nome}
                                    onChange={(e) => setEditingMembro({ ...editingMembro, nome: e.target.value })}
                                    placeholder="Nome completo"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Telefone</Label>
                                    <Input
                                        value={editingMembro.telefone || ''}
                                        onChange={(e) => setEditingMembro({ ...editingMembro, telefone: e.target.value })}
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                        type="email"
                                        value={editingMembro.email || ''}
                                        onChange={(e) => setEditingMembro({ ...editingMembro, email: e.target.value })}
                                        placeholder="email@exemplo.com"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Cargo</Label>
                                    <Select
                                        value={editingMembro.cargo}
                                        onValueChange={(v: any) => setEditingMembro({ ...editingMembro, cargo: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CARGOS.map((c) => (
                                                <SelectItem key={c.value} value={c.value}>
                                                    {c.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Cor de Identificação</Label>
                                    <Select
                                        value={editingMembro.cor}
                                        onValueChange={(v) => setEditingMembro({ ...editingMembro, cor: v })}
                                    >
                                        <SelectTrigger>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-4 h-4 rounded-full"
                                                    style={{ backgroundColor: editingMembro.cor }}
                                                />
                                                <SelectValue />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CORES.map((c) => (
                                                <SelectItem key={c.value} value={c.value}>
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-4 h-4 rounded-full"
                                                            style={{ backgroundColor: c.value }}
                                                        />
                                                        {c.label}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Data de Admissão</Label>
                                <Input
                                    type="date"
                                    value={editingMembro.data_admissao}
                                    onChange={(e) => setEditingMembro({ ...editingMembro, data_admissao: e.target.value })}
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

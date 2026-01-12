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
    DialogDescription,
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
    Users2,
    UserX,
    UserCheck,
    AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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

const EMPTY_MEMBER: Membro = {
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
}

export default function EquipePage() {
    const [membros, setMembros] = useState<Membro[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [editingMembro, setEditingMembro] = useState<Membro | null>(null)
    const [filterStatus, setFilterStatus] = useState<'ativos' | 'inativos'>('ativos')
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isToggleStatusDialogOpen, setIsToggleStatusDialogOpen] = useState(false)
    const [memberToDelete, setMemberToDelete] = useState<string | null>(null)
    const [memberToToggle, setMemberToToggle] = useState<Membro | null>(null)

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
            console.error('Error fetching team:', error)
            toast.error('Erro ao carregar equipe')
        } else {
            setMembros(data || [])
        }
        setIsLoading(false)
    }

    const handleCreate = () => {
        setEditingMembro({ ...EMPTY_MEMBER })
        setIsModalOpen(true)
    }

    const handleEdit = (membro: Membro) => {
        setEditingMembro({ ...membro })
        setIsModalOpen(true)
    }

    const handleSave = async () => {
        if (!editingMembro?.nome.trim()) {
            toast.error('Nome é obrigatório')
            return
        }

        setIsSaving(true)

        try {
            const { id, ...data } = editingMembro

            if (id) {
                // Update
                const { error } = await supabase
                    .from('equipe')
                    .update({
                        nome: data.nome.trim(),
                        telefone: data.telefone?.trim() || null,
                        email: data.email?.trim() || null,
                        cargo: data.cargo,
                        cor: data.cor,
                        ativo: data.ativo,
                        data_admissao: data.data_admissao,
                        notas: data.notas?.trim() || null,
                    })
                    .eq('id', id)

                if (error) throw error
                toast.success('Membro atualizado!')
            } else {
                // Insert
                const { error } = await supabase
                    .from('equipe')
                    .insert({
                        nome: data.nome.trim(),
                        telefone: data.telefone?.trim() || null,
                        email: data.email?.trim() || null,
                        cargo: data.cargo,
                        cor: data.cor,
                        ativo: data.ativo,
                        data_admissao: data.data_admissao,
                        notas: data.notas?.trim() || null,
                    })

                if (error) throw error
                toast.success('Membro adicionado!')
            }

            setIsModalOpen(false)
            fetchMembros()
        } catch (error) {
            console.error('Error saving:', error)
            toast.error('Erro ao salvar')
        } finally {
            setIsSaving(false)
        }
    }

    const handleToggleAtivo = async () => {
        if (!memberToToggle) return
        const novoStatus = !memberToToggle.ativo
        const acao = novoStatus ? 'reativar' : 'desativar'

        try {
            const { error } = await supabase
                .from('equipe')
                .update({ ativo: novoStatus })
                .eq('id', memberToToggle.id)

            if (error) throw error
            toast.success(novoStatus ? 'Membro reativado!' : 'Membro desativado!')
            setIsToggleStatusDialogOpen(false)
            setMemberToToggle(null)
            fetchMembros()
        } catch (error) {
            console.error(`Error ${acao}:`, error)
            toast.error(`Erro ao ${acao}`)
        }
    }

    const handleDeletePermanent = async () => {
        if (!memberToDelete) return

        try {
            const { error } = await supabase
                .from('equipe')
                .delete()
                .eq('id', memberToDelete)

            if (error) throw error
            toast.success('Membro excluído permanentemente!')
            setIsDeleteDialogOpen(false)
            setMemberToDelete(null)
            fetchMembros()
        } catch (error) {
            console.error('Error deleting permanently:', error)
            toast.error('Erro ao excluir membro')
        }
    }

    const getInitials = (nome: string) => {
        return nome
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-foreground">Equipe</h1>
                    <p className="text-sm text-muted-foreground">
                        Gerencie os membros da sua equipe de limpeza
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Tabs
                        value={filterStatus}
                        onValueChange={(v) => setFilterStatus(v as 'ativos' | 'inativos')}
                        className="w-[200px]"
                    >
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="ativos">Ativos</TabsTrigger>
                            <TabsTrigger value="inativos">Inativos</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <Button onClick={handleCreate} className="bg-[#C48B7F] hover:bg-[#A66D60]">
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Membro
                    </Button>
                </div>
            </div>

            {/* Grid de Membros */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            ) : membros.filter(m => filterStatus === 'ativos' ? m.ativo : !m.ativo).length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Users2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">
                            {filterStatus === 'ativos' ? 'Nenhum membro ativo cadastrado' : 'Nenhum membro inativo'}
                        </p>
                        {filterStatus === 'ativos' && (
                            <Button onClick={handleCreate} className="bg-[#C48B7F] hover:bg-[#A66D60]">
                                Adicionar Primeiro Membro
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {membros.filter(m => filterStatus === 'ativos' ? m.ativo : !m.ativo).map((membro) => (
                        <Card
                            key={membro.id}
                            className={`hover:shadow-md transition-shadow ${!membro.ativo ? 'opacity-75 bg-gray-50/50' : ''}`}
                        >
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <Avatar
                                            className="w-12 h-12 border-2"
                                            style={{ borderColor: membro.cor }}
                                        >
                                            <AvatarImage src={membro.foto_url || undefined} />
                                            <AvatarFallback
                                                style={{
                                                    backgroundColor: membro.cor + '20',
                                                    color: membro.cor
                                                }}
                                            >
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
                                            {membro.ativo ? (
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setMemberToToggle(membro)
                                                        setIsToggleStatusDialogOpen(true)
                                                    }}
                                                    className="text-amber-600 focus:text-amber-600 focus:bg-amber-50"
                                                >
                                                    <UserX className="w-4 h-4 mr-2" />
                                                    Desativar
                                                </DropdownMenuItem>
                                            ) : (
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setMemberToToggle(membro)
                                                        setIsToggleStatusDialogOpen(true)
                                                    }}
                                                    className="text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50"
                                                >
                                                    <UserCheck className="w-4 h-4 mr-2" />
                                                    Reativar
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    setMemberToDelete(membro.id)
                                                    setIsDeleteDialogOpen(true)
                                                }}
                                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Excluir Permanentemente
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {!membro.ativo && (
                                    <div className="mt-2 text-[10px] uppercase tracking-wider font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full inline-block">
                                        Membro Inativo
                                    </div>
                                )}

                                <div className="mt-4 space-y-2 text-sm text-gray-500">
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
                        <DialogDescription>
                            Preencha os dados do membro da equipe
                        </DialogDescription>
                    </DialogHeader>

                    {editingMembro && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nome *</Label>
                                <Input
                                    value={editingMembro.nome}
                                    onChange={(e) => setEditingMembro({
                                        ...editingMembro,
                                        nome: e.target.value
                                    })}
                                    placeholder="Nome completo"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Telefone</Label>
                                    <Input
                                        value={editingMembro.telefone || ''}
                                        onChange={(e) => setEditingMembro({
                                            ...editingMembro,
                                            telefone: e.target.value
                                        })}
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                        type="email"
                                        value={editingMembro.email || ''}
                                        onChange={(e) => setEditingMembro({
                                            ...editingMembro,
                                            email: e.target.value
                                        })}
                                        placeholder="email@exemplo.com"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Cargo</Label>
                                    <Select
                                        value={editingMembro.cargo}
                                        onValueChange={(v: any) => setEditingMembro({
                                            ...editingMembro,
                                            cargo: v
                                        })}
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
                                        onValueChange={(v) => setEditingMembro({
                                            ...editingMembro,
                                            cor: v
                                        })}
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
                                    onChange={(e) => setEditingMembro({
                                        ...editingMembro,
                                        data_admissao: e.target.value
                                    })}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-[#C48B7F] hover:bg-[#A66D60]"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                'Salvar'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirmação de Exclusão Permanente */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="flex items-center gap-2 text-red-600 mb-2">
                            <AlertTriangle className="w-5 h-5" />
                            <AlertDialogTitle>Excluir Permanentemente?</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o membro
                            da equipe e todos os dados associados do nosso banco de dados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setMemberToDelete(null)}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeletePermanent}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Confirmar Exclusão
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Confirmação de Alteração de Status */}
            <AlertDialog open={isToggleStatusDialogOpen} onOpenChange={setIsToggleStatusDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className={`flex items-center gap-2 mb-2 ${memberToToggle?.ativo ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {memberToToggle?.ativo ? <UserX className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                            <AlertDialogTitle>
                                {memberToToggle?.ativo ? 'Desativar Membro?' : 'Reativar Membro?'}
                            </AlertDialogTitle>
                        </div>
                        <AlertDialogDescription>
                            {memberToToggle?.ativo
                                ? 'Isso ocultará o membro da lista de ativos, mas seus dados serão preservados.'
                                : 'Isso tornará o membro visível e ativo na equipe novamente.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setMemberToToggle(null)}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleToggleAtivo}
                            className={memberToToggle?.ativo
                                ? "bg-amber-600 hover:bg-amber-700 text-white border-none"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white border-none"}
                        >
                            {memberToToggle?.ativo ? 'Confirmar Desativação' : 'Confirmar Reativação'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

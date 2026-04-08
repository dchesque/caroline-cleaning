'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAdminI18n } from '@/lib/admin-i18n/context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
    Users,
    UserX,
    UserCheck,
    UserPlus,
    AlertTriangle,
    CheckCircle,
    XCircle,
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

interface MembroSimple {
    id: string
    nome: string
    cargo: string | null
    cor: string | null
    ativo: boolean
}

interface Equipe {
    id: string
    nome: string
    tipo: string
    cor: string | null
    ativo: boolean
    notas: string | null
}

const CORES = [
    { value: '#C48B7F', label: 'Rosa' },
    { value: '#6B8E6B', label: 'Verde' },
    { value: '#7B9EB8', label: 'Azul' },
    { value: '#C4A35A', label: 'Dourado' },
    { value: '#9B8BB8', label: 'Roxo' },
    { value: '#C4856B', label: 'Coral' },
]

const CORES_EQUIPE = [
    { value: '#4A90D9', label: 'Azul' },
    { value: '#22c55e', label: 'Verde' },
    { value: '#f59e0b', label: 'Amarelo' },
    { value: '#ef4444', label: 'Vermelho' },
    { value: '#8b5cf6', label: 'Roxo' },
    { value: '#ec4899', label: 'Rosa' },
    { value: '#06b6d4', label: 'Ciano' },
    { value: '#BE9982', label: 'Brandy Rose' },
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
    const { t } = useAdminI18n()
    const teamT = t('team')
    const common = t('common')
    const groupsT = teamT.groups

    const [activeView, setActiveView] = useState<'membros' | 'equipes'>('membros')

    // Member states
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

    // Equipes (groups) states
    const [equipes, setEquipes] = useState<Equipe[]>([])
    const [membrosSimple, setMembrosSimple] = useState<MembroSimple[]>([])
    const [equipeMembroIds, setEquipeMembroIds] = useState<Record<string, string[]>>({})
    const [showEquipeModal, setShowEquipeModal] = useState(false)
    const [showManageMembrosModal, setShowManageMembrosModal] = useState(false)
    const [editingEquipe, setEditingEquipe] = useState<Equipe | null>(null)
    const [managingEquipe, setManagingEquipe] = useState<Equipe | null>(null)
    const [selectedMembroIds, setSelectedMembroIds] = useState<string[]>([])
    const [equipeForm, setEquipeForm] = useState({
        nome: '', tipo: 'cleaning', cor: '#4A90D9', ativo: true, notas: '',
    })

    const supabase = createClient()

    const TIPOS_EQUIPE = [
        { value: 'cleaning', label: groupsT.types.cleaning },
        { value: 'first_visit', label: groupsT.types.first_visit },
        { value: 'general', label: groupsT.types.general },
    ]

    useEffect(() => {
        fetchMembros()
        fetchEquipesData()
    }, [])

    const fetchMembros = async () => {
        setIsLoading(true)
        const { data, error } = await supabase.from('equipe').select('*').order('nome')
        if (error) {
            console.error('Error fetching team:', error)
            toast.error('Erro ao carregar equipe')
        } else {
            setMembros(data || [])
        }
        setIsLoading(false)
    }

    const fetchEquipesData = async () => {
        const [equipesRes, membrosSimpleRes, membrosMappingRes] = await Promise.all([
            supabase.from('equipes').select('*').order('nome'),
            supabase.from('equipe').select('id, nome, cargo, cor, ativo').eq('ativo', true).order('nome'),
            supabase.from('equipe_membros').select('equipe_id, membro_id'),
        ])
        if (equipesRes.data) setEquipes(equipesRes.data)
        if (membrosSimpleRes.data) setMembrosSimple(membrosSimpleRes.data)
        if (membrosMappingRes.data) {
            const map: Record<string, string[]> = {}
            for (const row of membrosMappingRes.data) {
                if (!map[row.equipe_id]) map[row.equipe_id] = []
                map[row.equipe_id].push(row.membro_id)
            }
            setEquipeMembroIds(map)
        }
    }

    // ---- MEMBER HANDLERS ----
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
            fetchEquipesData()
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
            toast.error('Erro ao alterar status')
        }
    }

    const handleDeletePermanent = async () => {
        if (!memberToDelete) return
        try {
            const { error } = await supabase.from('equipe').delete().eq('id', memberToDelete)
            if (error) throw error
            toast.success('Membro excluído permanentemente!')
            setIsDeleteDialogOpen(false)
            setMemberToDelete(null)
            fetchMembros()
        } catch (error) {
            toast.error('Erro ao excluir membro')
        }
    }

    // ---- EQUIPES (GROUPS) HANDLERS ----
    const openEquipeModal = (equipe?: Equipe) => {
        if (equipe) {
            setEditingEquipe(equipe)
            setEquipeForm({
                nome: equipe.nome,
                tipo: equipe.tipo,
                cor: equipe.cor || '#4A90D9',
                ativo: equipe.ativo,
                notas: equipe.notas || '',
            })
        } else {
            setEditingEquipe(null)
            setEquipeForm({ nome: '', tipo: 'cleaning', cor: '#4A90D9', ativo: true, notas: '' })
        }
        setShowEquipeModal(true)
    }

    const saveEquipe = async () => {
        if (!equipeForm.nome.trim()) {
            toast.error(groupsT.modal.validation.nameRequired)
            return
        }
        setIsSaving(true)
        try {
            if (editingEquipe) {
                const { error } = await supabase
                    .from('equipes')
                    .update({
                        nome: equipeForm.nome,
                        tipo: equipeForm.tipo,
                        cor: equipeForm.cor,
                        ativo: equipeForm.ativo,
                        notas: equipeForm.notas || null,
                    })
                    .eq('id', editingEquipe.id)
                if (error) throw error
                toast.success('Equipe atualizada!')
            } else {
                const { error } = await supabase
                    .from('equipes')
                    .insert({
                        nome: equipeForm.nome,
                        tipo: equipeForm.tipo,
                        cor: equipeForm.cor,
                        ativo: equipeForm.ativo,
                        notas: equipeForm.notas || null,
                    })
                if (error) throw error
                toast.success('Equipe criada!')
            }
            setShowEquipeModal(false)
            fetchEquipesData()
        } catch (err: any) {
            toast.error(err.message || 'Erro ao salvar equipe')
        } finally {
            setIsSaving(false)
        }
    }

    const deleteEquipe = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta equipe?')) return
        const { error } = await supabase.from('equipes').delete().eq('id', id)
        if (error) { toast.error(error.message); return }
        toast.success('Equipe excluída!')
        fetchEquipesData()
    }

    const toggleEquipeAtivo = async (equipe: Equipe) => {
        try {
            const { error } = await supabase
                .from('equipes')
                .update({ ativo: !equipe.ativo })
                .eq('id', equipe.id)
            if (error) throw error
            toast.success(equipe.ativo ? 'Equipe desativada' : 'Equipe ativada')
            fetchEquipesData()
        } catch (err: any) {
            toast.error(err.message || 'Erro ao alterar status')
        }
    }

    const openManageMembros = (equipe: Equipe) => {
        setManagingEquipe(equipe)
        setSelectedMembroIds(equipeMembroIds[equipe.id] ?? [])
        setShowManageMembrosModal(true)
    }

    const saveMembroAssignments = async () => {
        if (!managingEquipe) return
        setIsSaving(true)
        try {
            await supabase.from('equipe_membros').delete().eq('equipe_id', managingEquipe.id)
            if (selectedMembroIds.length > 0) {
                const rows = selectedMembroIds.map(membro_id => ({ equipe_id: managingEquipe.id, membro_id }))
                const { error } = await supabase.from('equipe_membros').insert(rows)
                if (error) throw error
            }
            toast.success('Membros atualizados!')
            setShowManageMembrosModal(false)
            fetchEquipesData()
        } catch (err: any) {
            toast.error(err.message || 'Erro ao salvar membros')
        } finally {
            setIsSaving(false)
        }
    }

    const toggleMembroSelection = (membroId: string) => {
        setSelectedMembroIds(prev =>
            prev.includes(membroId) ? prev.filter(id => id !== membroId) : [...prev, membroId]
        )
    }

    const getInitials = (nome: string) => {
        return nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }

    const filteredMembros = membros.filter(m => filterStatus === 'ativos' ? m.ativo : !m.ativo)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-foreground">{teamT.title}</h1>
                    <p className="text-sm text-muted-foreground">{teamT.subtitle}</p>
                </div>
                {activeView === 'membros' ? (
                    <Button onClick={handleCreate} className="bg-[#C48B7F] hover:bg-[#A66D60]">
                        <Plus className="w-4 h-4 mr-2" />
                        {teamT.newMember}
                    </Button>
                ) : (
                    <Button onClick={() => openEquipeModal()} className="bg-[#C48B7F] hover:bg-[#A66D60]">
                        <Plus className="w-4 h-4 mr-2" />
                        {groupsT.newGroup}
                    </Button>
                )}
            </div>

            {/* Main Tabs: Membros | Equipes */}
            <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'membros' | 'equipes')}>
                <div className="flex items-center justify-between gap-4">
                    <TabsList>
                        <TabsTrigger value="membros" className="gap-2">
                            <Users2 className="w-4 h-4" />
                            Membros ({membros.filter(m => m.ativo).length})
                        </TabsTrigger>
                        <TabsTrigger value="equipes" className="gap-2">
                            <Users className="w-4 h-4" />
                            {groupsT.title} ({equipes.length})
                        </TabsTrigger>
                    </TabsList>

                    {activeView === 'membros' && (
                        <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as 'ativos' | 'inativos')}>
                            <TabsList className="h-8">
                                <TabsTrigger value="ativos" className="text-xs px-3">{teamT.tabs.active}</TabsTrigger>
                                <TabsTrigger value="inativos" className="text-xs px-3">{teamT.tabs.inactive}</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    )}
                </div>

                {/* Membros Tab */}
                <TabsContent value="membros" className="mt-6">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                    ) : filteredMembros.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Users2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 mb-4">
                                    {filterStatus === 'ativos' ? teamT.emptyActive : teamT.emptyInactive}
                                </p>
                                {filterStatus === 'ativos' && (
                                    <Button onClick={handleCreate} className="bg-[#C48B7F] hover:bg-[#A66D60]">
                                        {teamT.addFirst}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredMembros.map((membro) => (
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
                                                        {teamT.roles[membro.cargo]}
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
                                                        {common.edit}
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
                                                            {common.inactive}
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
                                                            {common.active}
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
                                                        {teamT.deleteDialog.confirm}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        {!membro.ativo && (
                                            <div className="mt-2 text-[10px] uppercase tracking-wider font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full inline-block">
                                                {teamT.card.inactiveBadge}
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
                                                {teamT.card.since} {format(new Date(membro.data_admissao), 'MMM yyyy')}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Equipes Tab */}
                <TabsContent value="equipes" className="mt-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {equipes.map((equipe) => (
                            <Card key={equipe.id} className={`relative ${!equipe.ativo ? 'opacity-60' : ''}`}>
                                <div
                                    className="absolute top-0 left-0 right-0 h-1 rounded-t-lg"
                                    style={{ backgroundColor: equipe.cor || '#4A90D9' }}
                                />
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                {equipe.nome}
                                                {!equipe.ativo && (
                                                    <Badge variant="destructive" className="text-xs">
                                                        {groupsT.card.inactive}
                                                    </Badge>
                                                )}
                                            </CardTitle>
                                            <Badge variant="outline" className="text-xs mt-1">
                                                {TIPOS_EQUIPE.find(tp => tp.value === equipe.tipo)?.label ?? equipe.tipo}
                                            </Badge>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openEquipeModal(equipe)}>
                                                    <Pencil className="w-4 h-4 mr-2" />
                                                    {groupsT.card.edit}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => openManageMembros(equipe)}>
                                                    <UserPlus className="w-4 h-4 mr-2" />
                                                    {groupsT.card.manageMembers}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => toggleEquipeAtivo(equipe)}>
                                                    {equipe.ativo ? (
                                                        <>
                                                            <XCircle className="w-4 h-4 mr-2" />
                                                            {groupsT.card.deactivate}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle className="w-4 h-4 mr-2" />
                                                            {groupsT.card.activate}
                                                        </>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => deleteEquipe(equipe.id)}
                                                    className="text-red-600"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    {groupsT.card.delete}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {equipe.notas && (
                                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{equipe.notas}</p>
                                    )}
                                    <div className="flex items-center gap-2 text-sm">
                                        <Users className="w-4 h-4 text-muted-foreground" />
                                        <span>
                                            {(equipeMembroIds[equipe.id]?.length ?? 0) > 0
                                                ? `${equipeMembroIds[equipe.id].length} ${groupsT.card.memberCount}`
                                                : groupsT.card.noMembers}
                                        </span>
                                    </div>
                                    {(equipeMembroIds[equipe.id]?.length ?? 0) > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {equipeMembroIds[equipe.id].map(membroId => {
                                                const m = membrosSimple.find(mb => mb.id === membroId)
                                                if (!m) return null
                                                return (
                                                    <Badge key={membroId} variant="secondary" className="text-xs gap-1">
                                                        {m.cor && (
                                                            <span
                                                                className="inline-block w-2 h-2 rounded-full"
                                                                style={{ backgroundColor: m.cor }}
                                                            />
                                                        )}
                                                        {m.nome.split(' ')[0]}
                                                    </Badge>
                                                )
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}

                        {equipes.length === 0 && (
                            <Card className="col-span-full">
                                <CardContent className="py-12 text-center">
                                    <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                    <p className="text-muted-foreground">{groupsT.noGroups}</p>
                                    <Button
                                        className="mt-4 bg-[#C48B7F] hover:bg-[#A66D60]"
                                        onClick={() => openEquipeModal()}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        {groupsT.createFirst}
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Modal Membro */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingMembro?.id ? teamT.modal.editTitle : teamT.modal.newTitle}
                        </DialogTitle>
                        <DialogDescription>
                            {teamT.modal.description}
                        </DialogDescription>
                    </DialogHeader>

                    {editingMembro && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>{teamT.modal.fullName} *</Label>
                                <Input
                                    value={editingMembro.nome}
                                    onChange={(e) => setEditingMembro({
                                        ...editingMembro,
                                        nome: e.target.value
                                    })}
                                    placeholder={teamT.modal.fullName}
                                    className="bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"
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
                                        className="bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"
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
                                        className="bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{teamT.modal.role}</Label>
                                    <Select
                                        value={editingMembro.cargo}
                                        onValueChange={(v: any) => setEditingMembro({
                                            ...editingMembro,
                                            cargo: v
                                        })}
                                    >
                                        <SelectTrigger className="bg-white border-gray-200 shadow-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cleaner">{teamT.roles.cleaner}</SelectItem>
                                            <SelectItem value="supervisor">{teamT.roles.supervisor}</SelectItem>
                                            <SelectItem value="admin">{teamT.roles.admin}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>{teamT.modal.idColor}</Label>
                                    <Select
                                        value={editingMembro.cor}
                                        onValueChange={(v) => setEditingMembro({
                                            ...editingMembro,
                                            cor: v
                                        })}
                                    >
                                        <SelectTrigger className="bg-white border-gray-200 shadow-sm">
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
                                <Label>{teamT.modal.admissionDate}</Label>
                                <Input
                                    type="date"
                                    value={editingMembro.data_admissao}
                                    onChange={(e) => setEditingMembro({
                                        ...editingMembro,
                                        data_admissao: e.target.value
                                    })}
                                    className="bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                            {common.cancel}
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-[#C48B7F] hover:bg-[#A66D60]"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {teamT.modal.saving}
                                </>
                            ) : (
                                common.save
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Equipe */}
            <Dialog open={showEquipeModal} onOpenChange={setShowEquipeModal}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editingEquipe ? groupsT.modal.editGroup : groupsT.modal.newGroup}
                        </DialogTitle>
                        <DialogDescription>
                            {groupsT.modal.description}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>{groupsT.modal.fields.name} *</Label>
                            <Input
                                value={equipeForm.nome}
                                onChange={(e) => setEquipeForm({ ...equipeForm, nome: e.target.value })}
                                placeholder="Equipe Alpha"
                                className="bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>{groupsT.modal.fields.type}</Label>
                            <Select
                                value={equipeForm.tipo}
                                onValueChange={(v) => setEquipeForm({ ...equipeForm, tipo: v })}
                            >
                                <SelectTrigger className="bg-white border-gray-200 shadow-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {TIPOS_EQUIPE.map((tipo) => (
                                        <SelectItem key={tipo.value} value={tipo.value}>
                                            {tipo.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>{groupsT.modal.fields.color}</Label>
                            <div className="flex gap-2">
                                {CORES_EQUIPE.map((cor) => (
                                    <button
                                        key={cor.value}
                                        type="button"
                                        onClick={() => setEquipeForm({ ...equipeForm, cor: cor.value })}
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${equipeForm.cor === cor.value
                                            ? 'border-gray-900 scale-110'
                                            : 'border-transparent'
                                            }`}
                                        style={{ backgroundColor: cor.value }}
                                        title={cor.label}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>{groupsT.modal.fields.notes}</Label>
                            <Textarea
                                value={equipeForm.notas}
                                onChange={(e) => setEquipeForm({ ...equipeForm, notas: e.target.value })}
                                placeholder={groupsT.modal.fields.notesPlaceholder}
                                rows={2}
                                className="bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400 resize-none"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Switch
                                checked={equipeForm.ativo}
                                onCheckedChange={(checked) => setEquipeForm({ ...equipeForm, ativo: checked })}
                            />
                            <Label>{groupsT.modal.fields.active}</Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEquipeModal(false)}>
                            {common.cancel}
                        </Button>
                        <Button onClick={saveEquipe} disabled={isSaving} className="bg-[#C48B7F] hover:bg-[#A66D60]">
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {common.save}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Gerenciar Membros */}
            <Dialog open={showManageMembrosModal} onOpenChange={setShowManageMembrosModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {groupsT.modal.manageMembersTitle}
                            {managingEquipe && ` — ${managingEquipe.nome}`}
                        </DialogTitle>
                        <DialogDescription>
                            {groupsT.modal.manageMembersDesc}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2 max-h-64 overflow-y-auto py-1">
                        {membrosSimple.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                {groupsT.modal.noMembersAvailable}
                            </p>
                        ) : membrosSimple.map((membro) => (
                            <div
                                key={membro.id}
                                className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer"
                                onClick={() => toggleMembroSelection(membro.id)}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedMembroIds.includes(membro.id)}
                                    onChange={() => toggleMembroSelection(membro.id)}
                                    className="w-4 h-4 accent-brandy-rose-500"
                                />
                                {membro.cor && (
                                    <span
                                        className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: membro.cor }}
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{membro.nome}</p>
                                    {membro.cargo && (
                                        <p className="text-xs text-muted-foreground truncate">{membro.cargo}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowManageMembrosModal(false)}>
                            {common.cancel}
                        </Button>
                        <Button onClick={saveMembroAssignments} disabled={isSaving} className="bg-[#C48B7F] hover:bg-[#A66D60]">
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {common.save}
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
                            <AlertDialogTitle>{teamT.deleteDialog.title}</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription>
                            {teamT.deleteDialog.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setMemberToDelete(null)}>
                            {common.cancel}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeletePermanent}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {teamT.deleteDialog.confirm}
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
                                {memberToToggle?.ativo ? teamT.toggleDialog.deactivateTitle : teamT.toggleDialog.activateTitle}
                            </AlertDialogTitle>
                        </div>
                        <AlertDialogDescription>
                            {memberToToggle?.ativo
                                ? teamT.toggleDialog.deactivateDesc
                                : teamT.toggleDialog.activateDesc}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setMemberToToggle(null)}>
                            {common.cancel}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleToggleAtivo}
                            className={memberToToggle?.ativo
                                ? "bg-amber-600 hover:bg-amber-700 text-white border-none"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white border-none"}
                        >
                            {memberToToggle?.ativo ? teamT.toggleDialog.confirmDeactivate : teamT.toggleDialog.confirmActivate}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

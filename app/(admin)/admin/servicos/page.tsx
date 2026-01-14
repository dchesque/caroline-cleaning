'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Sparkles,
    Plus,
    MoreHorizontal,
    Pencil,
    Trash2,
    Clock,
    DollarSign,
    Palette,
    Package,
    CheckCircle,
    XCircle,
    Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrencyUSD, formatCurrencyInput, parseCurrency } from '@/lib/formatters'
import { useAdminI18n } from '@/lib/admin-i18n/context'

interface ServicoTipo {
    id: string
    codigo: string
    nome: string
    descricao: string | null
    multiplicador_preco: number
    duracao_base_minutos: number
    cor: string | null
    icone: string | null
    ativo: boolean
    disponivel_agendamento_online: boolean
    ordem: number
}

interface Addon {
    id: string
    codigo: string
    nome: string
    descricao: string | null
    preco: number
    tipo_cobranca: string
    unidade: string | null
    minutos_adicionais: number
    ativo: boolean
    ordem: number
}

// Constantes movidas para dentro do componente para usar i18n

export default function ServicosPage() {
    const { t } = useAdminI18n()
    const servicesT = t('services')
    const common = t('common')

    const CORES_SERVICO = [
        { value: '#22c55e', label: 'Verde', class: 'bg-green-500' },
        { value: '#3b82f6', label: 'Azul', class: 'bg-blue-500' },
        { value: '#f59e0b', label: 'Amarelo', class: 'bg-yellow-500' },
        { value: '#ef4444', label: 'Vermelho', class: 'bg-red-500' },
        { value: '#8b5cf6', label: 'Roxo', class: 'bg-purple-500' },
        { value: '#ec4899', label: 'Rosa', class: 'bg-pink-500' },
        { value: '#06b6d4', label: 'Ciano', class: 'bg-cyan-500' },
        { value: '#BE9982', label: 'Brandy Rose', class: 'bg-[#BE9982]' },
    ]

    const TIPOS_COBRANCA = [
        { value: 'fixo', label: servicesT.modals.billingTypes.fixed },
        { value: 'por_hora', label: servicesT.modals.billingTypes.hourly },
        { value: 'por_unidade', label: servicesT.modals.billingTypes.unit },
    ]
    const [activeTab, setActiveTab] = useState('servicos')
    const [servicos, setServicos] = useState<ServicoTipo[]>([])
    const [addons, setAddons] = useState<Addon[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Modal states
    const [showServicoModal, setShowServicoModal] = useState(false)
    const [showAddonModal, setShowAddonModal] = useState(false)
    const [editingServico, setEditingServico] = useState<ServicoTipo | null>(null)
    const [editingAddon, setEditingAddon] = useState<Addon | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    // Form states
    const [servicoForm, setServicoForm] = useState({
        codigo: '',
        nome: '',
        descricao: '',
        multiplicador_preco: '1.0',
        duracao_base_minutos: '180',
        cor: '#BE9982',
        ativo: true,
        disponivel_agendamento_online: true,
    })

    const [addonForm, setAddonForm] = useState({
        codigo: '',
        nome: '',
        descricao: '',
        preco: '',
        tipo_cobranca: 'fixo',
        unidade: '',
        minutos_adicionais: '15',
        ativo: true,
    })

    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setIsLoading(true)

        const [servicosRes, addonsRes] = await Promise.all([
            supabase.from('servicos_tipos').select('*').order('ordem'),
            supabase.from('addons').select('*').order('ordem')
        ])

        if (servicosRes.data) setServicos(servicosRes.data)
        if (addonsRes.data) setAddons(addonsRes.data)

        setIsLoading(false)
    }

    // SERVIÇOS HANDLERS
    const openServicoModal = (servico?: ServicoTipo) => {
        if (servico) {
            setEditingServico(servico)
            setServicoForm({
                codigo: servico.codigo,
                nome: servico.nome,
                descricao: servico.descricao || '',
                multiplicador_preco: servico.multiplicador_preco.toString(),
                duracao_base_minutos: servico.duracao_base_minutos.toString(),
                cor: servico.cor || '#BE9982',
                ativo: servico.ativo,
                disponivel_agendamento_online: servico.disponivel_agendamento_online,
            })
        } else {
            setEditingServico(null)
            setServicoForm({
                codigo: '',
                nome: '',
                descricao: '',
                multiplicador_preco: '1.0',
                duracao_base_minutos: '180',
                cor: '#BE9982',
                ativo: true,
                disponivel_agendamento_online: true,
            })
        }
        setShowServicoModal(true)
    }

    const saveServico = async () => {
        if (!servicoForm.codigo || !servicoForm.nome) {
            toast.error(servicesT.modals.validation.required)
            return
        }

        if (!/^[a-z_]+$/.test(servicoForm.codigo)) {
            toast.error(servicesT.modals.validation.codeFormat)
            return
        }

        setIsSaving(true)
        try {
            const data = {
                codigo: servicoForm.codigo,
                nome: servicoForm.nome,
                descricao: servicoForm.descricao || null,
                multiplicador_preco: parseFloat(servicoForm.multiplicador_preco),
                duracao_base_minutos: parseInt(servicoForm.duracao_base_minutos),
                cor: servicoForm.cor,
                ativo: servicoForm.ativo,
                disponivel_agendamento_online: servicoForm.disponivel_agendamento_online,
            }

            if (editingServico) {
                const { error } = await supabase
                    .from('servicos_tipos')
                    .update(data)
                    .eq('id', editingServico.id)
                if (error) throw error
                toast.success(common.save)
            } else {
                const { error } = await supabase
                    .from('servicos_tipos')
                    .insert({ ...data, ordem: servicos.length })
                if (error) throw error
                toast.success(common.save)
            }

            setShowServicoModal(false)
            fetchData()
        } catch (error) {
            console.error(error)
            toast.error(common.error)
        } finally {
            setIsSaving(false)
        }
    }

    const deleteServico = async (id: string) => {
        if (!confirm(servicesT.modals.confirmDelete)) return

        try {
            const { error } = await supabase
                .from('servicos_tipos')
                .delete()
                .eq('id', id)
            if (error) throw error
            toast.success(common.delete)
            fetchData()
        } catch (error) {
            toast.error(common.error)
        }
    }

    const toggleServicoAtivo = async (servico: ServicoTipo) => {
        try {
            const { error } = await supabase
                .from('servicos_tipos')
                .update({ ativo: !servico.ativo })
                .eq('id', servico.id)
            if (error) throw error
            toast.success(common.save)
            fetchData()
        } catch (error) {
            toast.error(common.error)
        }
    }

    // ADDONS HANDLERS
    const openAddonModal = (addon?: Addon) => {
        if (addon) {
            setEditingAddon(addon)
            setAddonForm({
                codigo: addon.codigo,
                nome: addon.nome,
                descricao: addon.descricao || '',
                preco: addon.preco.toString(),
                tipo_cobranca: addon.tipo_cobranca,
                unidade: addon.unidade || '',
                minutos_adicionais: addon.minutos_adicionais.toString(),
                ativo: addon.ativo,
            })
        } else {
            setEditingAddon(null)
            setAddonForm({
                codigo: '',
                nome: '',
                descricao: '',
                preco: '',
                tipo_cobranca: 'fixo',
                unidade: '',
                minutos_adicionais: '15',
                ativo: true,
            })
        }
        setShowAddonModal(true)
    }

    const saveAddon = async () => {
        if (!addonForm.codigo || !addonForm.nome || !addonForm.preco) {
            toast.error(servicesT.modals.validation.addonRequired)
            return
        }

        if (!/^[a-z_]+$/.test(addonForm.codigo)) {
            toast.error(servicesT.modals.validation.codeFormat)
            return
        }

        setIsSaving(true)
        try {
            const data = {
                codigo: addonForm.codigo,
                nome: addonForm.nome,
                descricao: addonForm.descricao || null,
                preco: parseCurrency(addonForm.preco),
                tipo_cobranca: addonForm.tipo_cobranca,
                unidade: addonForm.unidade || null,
                minutos_adicionais: parseInt(addonForm.minutos_adicionais) || 0,
                ativo: addonForm.ativo,
            }

            if (editingAddon) {
                const { error } = await supabase
                    .from('addons')
                    .update(data)
                    .eq('id', editingAddon.id)
                if (error) throw error
                toast.success(common.save)
            } else {
                const { error } = await supabase
                    .from('addons')
                    .insert({ ...data, ordem: addons.length })
                if (error) throw error
                toast.success(common.save)
            }

            setShowAddonModal(false)
            fetchData()
        } catch (error) {
            console.error(error)
            toast.error(common.error)
        } finally {
            setIsSaving(false)
        }
    }

    const deleteAddon = async (id: string) => {
        if (!confirm(servicesT.modals.confirmDelete)) return

        try {
            const { error } = await supabase
                .from('addons')
                .delete()
                .eq('id', id)
            if (error) throw error
            toast.success(common.delete)
            fetchData()
        } catch (error) {
            toast.error(common.error)
        }
    }

    const toggleAddonAtivo = async (addon: Addon) => {
        try {
            const { error } = await supabase
                .from('addons')
                .update({ ativo: !addon.ativo })
                .eq('id', addon.id)
            if (error) throw error
            toast.success(common.save)
            fetchData()
        } catch (error) {
            toast.error(common.error)
        }
    }

    const getPrecoLabel = (addon: Addon) => {
        const price = formatCurrencyUSD(addon.preco)
        if (addon.tipo_cobranca === 'fixo') return price
        if (addon.tipo_cobranca === 'por_hora') return `${price}/${servicesT.modals.billingTypes.hourLabel}`
        if (addon.tipo_cobranca === 'por_unidade') return `${price}/${addon.unidade || servicesT.modals.billingTypes.unitLabel}`
        return price
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-[#C48B7F]" />
                        {servicesT.title}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {servicesT.subtitle}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="servicos" className="gap-2">
                            <Sparkles className="w-4 h-4" />
                            {servicesT.tabs.services} ({servicos.length})
                        </TabsTrigger>
                        <TabsTrigger value="addons" className="gap-2">
                            <Package className="w-4 h-4" />
                            {servicesT.tabs.addons} ({addons.length})
                        </TabsTrigger>
                    </TabsList>

                    {activeTab === 'servicos' ? (
                        <Button onClick={() => openServicoModal()}>
                            <Plus className="w-4 h-4 mr-2" />
                            {servicesT.buttons.newService}
                        </Button>
                    ) : (
                        <Button onClick={() => openAddonModal()}>
                            <Plus className="w-4 h-4 mr-2" />
                            {servicesT.buttons.newAddon}
                        </Button>
                    )}
                </div>

                {/* Serviços Tab */}
                <TabsContent value="servicos" className="mt-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {servicos.map((servico) => (
                            <Card key={servico.id} className={`relative ${!servico.ativo ? 'opacity-60' : ''}`}>
                                <div
                                    className="absolute top-0 left-0 right-0 h-1 rounded-t-lg"
                                    style={{ backgroundColor: servico.cor || '#BE9982' }}
                                />
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                {servico.nome}
                                                {!servico.ativo && (
                                                    <Badge variant="destructive" className="text-xs">
                                                        {servicesT.serviceCard.inactive}
                                                    </Badge>
                                                )}
                                            </CardTitle>
                                            <Badge variant="outline" className="font-mono text-xs mt-1">
                                                {servico.codigo}
                                            </Badge>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openServicoModal(servico)}>
                                                    <Pencil className="w-4 h-4 mr-2" />
                                                    {servicesT.serviceCard.edit}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => toggleServicoAtivo(servico)}>
                                                    {servico.ativo ? (
                                                        <>
                                                            <XCircle className="w-4 h-4 mr-2" />
                                                            {servicesT.serviceCard.deactivate}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle className="w-4 h-4 mr-2" />
                                                            {servicesT.serviceCard.activate}
                                                        </>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => deleteServico(servico.id)}
                                                    className="text-red-600"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    {servicesT.serviceCard.delete}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                        {servico.descricao || servicesT.serviceCard.noDescription}
                                    </p>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                                            <span>x{servico.multiplicador_preco} {servicesT.serviceCard.priceMultiplier}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-muted-foreground" />
                                            <span>{servico.duracao_base_minutos}{servicesT.serviceCard.min}</span>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2">
                                        <div
                                            className="w-4 h-4 rounded-full border"
                                            style={{ backgroundColor: servico.cor || '#BE9982' }}
                                        />
                                        <span className="text-xs text-muted-foreground">
                                            {servico.disponivel_agendamento_online ? servicesT.serviceCard.availableOnline : servicesT.serviceCard.internalOnly}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {servicos.length === 0 && (
                            <Card className="col-span-full">
                                <CardContent className="py-12 text-center">
                                    <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                    <p className="text-muted-foreground">{servicesT.table.noServices}</p>
                                    <Button className="mt-4" onClick={() => openServicoModal()}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        {servicesT.buttons.createFirstService}
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                {/* Addons Tab */}
                <TabsContent value="addons" className="mt-6">
                    <Card>
                        <CardContent className="p-0">
                            {addons.length === 0 ? (
                                <div className="py-12 text-center">
                                    <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                    <p className="text-muted-foreground">{servicesT.table.noAddons}</p>
                                    <Button className="mt-4" onClick={() => openAddonModal()}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        {servicesT.buttons.createFirstAddon}
                                    </Button>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{servicesT.table.name}</TableHead>
                                            <TableHead>{servicesT.table.code}</TableHead>
                                            <TableHead>{servicesT.table.price}</TableHead>
                                            <TableHead>{servicesT.table.additionalTime}</TableHead>
                                            <TableHead>{servicesT.table.status}</TableHead>
                                            <TableHead className="w-[70px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {addons.map((addon) => (
                                            <TableRow key={addon.id} className={!addon.ativo ? 'opacity-60' : ''}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{addon.nome}</p>
                                                        {addon.descricao && (
                                                            <p className="text-xs text-muted-foreground line-clamp-1">
                                                                {addon.descricao}
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-mono text-xs">
                                                        {addon.codigo}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {getPrecoLabel(addon)}
                                                </TableCell>
                                                <TableCell>
                                                    +{addon.minutos_adicionais}min
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={addon.ativo ? 'default' : 'destructive'}>
                                                        {addon.ativo ? servicesT.serviceCard.active : servicesT.serviceCard.inactive}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreHorizontal className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => openAddonModal(addon)}>
                                                                <Pencil className="w-4 h-4 mr-2" />
                                                                {servicesT.serviceCard.edit}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => toggleAddonAtivo(addon)}>
                                                                {addon.ativo ? (
                                                                    <>
                                                                        <XCircle className="w-4 h-4 mr-2" />
                                                                        {servicesT.serviceCard.deactivate}
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                                        {servicesT.serviceCard.activate}
                                                                    </>
                                                                )}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => deleteAddon(addon.id)}
                                                                className="text-red-600"
                                                            >
                                                                <Trash2 className="w-4 h-4 mr-2" />
                                                                {servicesT.serviceCard.delete}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Modal Serviço */}
            <Dialog open={showServicoModal} onOpenChange={setShowServicoModal}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editingServico ? servicesT.modals.editService : servicesT.modals.newService}
                        </DialogTitle>
                        <DialogDescription>
                            {servicesT.modals.serviceDescription}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{servicesT.modals.fields.code} *</Label>
                                <Input
                                    value={servicoForm.codigo}
                                    onChange={(e) => setServicoForm({
                                        ...servicoForm,
                                        codigo: e.target.value.toLowerCase().replace(/[^a-z_]/g, '')
                                    })}
                                    placeholder="regular_cleaning"
                                    disabled={!!editingServico}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {servicesT.modals.fields.codeHelp}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label>{servicesT.modals.fields.name} *</Label>
                                <Input
                                    value={servicoForm.nome}
                                    onChange={(e) => setServicoForm({ ...servicoForm, nome: e.target.value })}
                                    placeholder="Regular Cleaning"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>{servicesT.modals.fields.description}</Label>
                            <Textarea
                                value={servicoForm.descricao}
                                onChange={(e) => setServicoForm({ ...servicoForm, descricao: e.target.value })}
                                placeholder={servicesT.modals.fields.descriptionPlaceholder}
                                rows={2}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{servicesT.modals.fields.multiplier}</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    min="0.1"
                                    value={servicoForm.multiplicador_preco}
                                    onChange={(e) => setServicoForm({ ...servicoForm, multiplicador_preco: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {servicesT.modals.fields.multiplierHelp}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label>{servicesT.modals.fields.duration}</Label>
                                <Input
                                    type="number"
                                    min="30"
                                    step="30"
                                    value={servicoForm.duracao_base_minutos}
                                    onChange={(e) => setServicoForm({ ...servicoForm, duracao_base_minutos: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>{servicesT.modals.fields.calendarColor}</Label>
                            <div className="flex gap-2">
                                {CORES_SERVICO.map((cor) => (
                                    <button
                                        key={cor.value}
                                        type="button"
                                        onClick={() => setServicoForm({ ...servicoForm, cor: cor.value })}
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${servicoForm.cor === cor.value
                                            ? 'border-gray-900 scale-110'
                                            : 'border-transparent'
                                            }`}
                                        style={{ backgroundColor: cor.value }}
                                        title={cor.label}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={servicoForm.ativo}
                                    onCheckedChange={(checked) => setServicoForm({ ...servicoForm, ativo: checked })}
                                />
                                <Label>{servicesT.modals.fields.active}</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={servicoForm.disponivel_agendamento_online}
                                    onCheckedChange={(checked) => setServicoForm({
                                        ...servicoForm,
                                        disponivel_agendamento_online: checked
                                    })}
                                />
                                <Label>{servicesT.modals.fields.availableOnline}</Label>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowServicoModal(false)}>
                            {common.cancel}
                        </Button>
                        <Button onClick={saveServico} disabled={isSaving}>
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {editingServico ? common.save : common.save}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Addon */}
            <Dialog open={showAddonModal} onOpenChange={setShowAddonModal}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editingAddon ? servicesT.modals.editAddon : servicesT.modals.newAddon}
                        </DialogTitle>
                        <DialogDescription>
                            {servicesT.modals.addonDescription}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{servicesT.modals.fields.code} *</Label>
                                <Input
                                    value={addonForm.codigo}
                                    onChange={(e) => setAddonForm({
                                        ...addonForm,
                                        codigo: e.target.value.toLowerCase().replace(/[^a-z_]/g, '')
                                    })}
                                    placeholder="inside_fridge"
                                    disabled={!!editingAddon}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{servicesT.modals.fields.name} *</Label>
                                <Input
                                    value={addonForm.nome}
                                    onChange={(e) => setAddonForm({ ...addonForm, nome: e.target.value })}
                                    placeholder="Inside Fridge"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>{servicesT.modals.fields.description}</Label>
                            <Textarea
                                value={addonForm.descricao}
                                onChange={(e) => setAddonForm({ ...addonForm, descricao: e.target.value })}
                                placeholder={servicesT.modals.fields.descriptionPlaceholder}
                                rows={2}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{servicesT.modals.fields.price} *</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                    <Input
                                        value={addonForm.preco}
                                        onChange={(e) => setAddonForm({
                                            ...addonForm,
                                            preco: formatCurrencyInput(e.target.value)
                                        })}
                                        placeholder="25.00"
                                        className="pl-7"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>{servicesT.modals.fields.billingType}</Label>
                                <Select
                                    value={addonForm.tipo_cobranca}
                                    onValueChange={(v) => setAddonForm({ ...addonForm, tipo_cobranca: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TIPOS_COBRANCA.map((tipo) => (
                                            <SelectItem key={tipo.value} value={tipo.value}>
                                                {tipo.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {addonForm.tipo_cobranca === 'por_unidade' && (
                            <div className="space-y-2">
                                <Label>{servicesT.modals.fields.unit}</Label>
                                <Input
                                    value={addonForm.unidade}
                                    onChange={(e) => setAddonForm({ ...addonForm, unidade: e.target.value })}
                                    placeholder="window, room, etc."
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{servicesT.modals.fields.additionalMinutes}</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="5"
                                    value={addonForm.minutos_adicionais}
                                    onChange={(e) => setAddonForm({ ...addonForm, minutos_adicionais: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center gap-2 pt-6">
                                <Switch
                                    checked={addonForm.ativo}
                                    onCheckedChange={(checked) => setAddonForm({ ...addonForm, ativo: checked })}
                                />
                                <Label>{servicesT.modals.fields.addonActive}</Label>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddonModal(false)}>
                            {common.cancel}
                        </Button>
                        <Button onClick={saveAddon} disabled={isSaving}>
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {editingAddon ? common.save : common.save}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

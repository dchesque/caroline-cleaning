'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAdminI18n } from '@/lib/admin-i18n/context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
    Users,
    Phone,
    MapPin,
    Clock,
    Search,
    Loader2,
    Eye,
    CheckCircle2,
    XCircle,
    UserPlus,
    MessageSquare,
    Filter,
    RefreshCw
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR, enUS } from 'date-fns/locale'
import { toast } from 'sonner'

interface ContactLead {
    id: string
    nome: string
    telefone: string
    cidade: string | null
    origem: string
    status: 'novo' | 'contatado' | 'convertido' | 'descartado'
    notas: string | null
    created_at: string
    contacted_at: string | null
}

interface LeadStats {
    novos: number
    contatados: number
    convertidos: number
    descartados: number
    total: number
    hoje: number
    ultimos_7_dias: number
    ultimos_30_dias: number
}

const statusIcons = {
    novo: UserPlus,
    contatado: Phone,
    convertido: CheckCircle2,
    descartado: XCircle,
}

const statusColors = {
    novo: 'bg-blue-100 text-blue-800',
    contatado: 'bg-yellow-100 text-yellow-800',
    convertido: 'bg-green-100 text-green-800',
    descartado: 'bg-gray-100 text-gray-800',
}

export default function LeadsPage() {
    const [leads, setLeads] = useState<ContactLead[]>([])
    const [stats, setStats] = useState<LeadStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [selectedLead, setSelectedLead] = useState<ContactLead | null>(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const { t, locale } = useAdminI18n()
    const leadsT = t('leads')
    const common = t('common')
    const dateLocale = locale === 'pt-BR' ? ptBR : enUS
    const dateFormat = locale === 'pt-BR' ? 'dd/MM/yyyy HH:mm' : 'MM/dd/yyyy hh:mm a'

    const supabase = createClient()

    useEffect(() => {
        fetchLeads()
        fetchStats()
    }, [statusFilter])

    async function fetchLeads() {
        setIsLoading(true)

        let query = supabase
            .from('contact_leads')
            .select('*')
            .order('created_at', { ascending: false })

        if (statusFilter !== 'all') {
            query = query.eq('status', statusFilter)
        }

        const { data, error } = await query

        if (error) {
            toast.error(leadsT.error?.load || 'Error loading leads')
            console.error(error)
        } else {
            setLeads(data || [])
        }
        setIsLoading(false)
    }

    async function fetchStats() {
        const { data, error } = await supabase
            .from('contact_leads_stats')
            .select('*')
            .single()

        if (!error && data) {
            setStats(data)
        }
    }

    async function updateLeadStatus(leadId: string, newStatus: string) {
        setIsSaving(true)

        const updateData: any = { status: newStatus }
        if (newStatus === 'contatado' && selectedLead?.status === 'novo') {
            updateData.contacted_at = new Date().toISOString()
        }

        const { error } = await supabase
            .from('contact_leads')
            .update(updateData)
            .eq('id', leadId)

        if (error) {
            toast.error(leadsT.error?.updateStatus)
        } else {
            toast.success(leadsT.success?.statusUpdated)
            fetchLeads()
            fetchStats()
            if (selectedLead) {
                setSelectedLead({
                    ...selectedLead,
                    status: newStatus as any,
                    contacted_at: updateData.contacted_at || selectedLead.contacted_at,
                })
            }
        }
        setIsSaving(false)
    }

    async function updateLeadNotes(leadId: string, notes: string) {
        const { error } = await supabase
            .from('contact_leads')
            .update({ notas: notes })
            .eq('id', leadId)

        if (error) {
            toast.error(leadsT.error?.saveNotes)
        } else {
            toast.success(leadsT.success?.notesSaved)
        }
    }

    function handleViewLead(lead: ContactLead) {
        setSelectedLead(lead)
        setIsDetailOpen(true)
    }

    function getStatusLabel(status: string) {
        return leadsT.status?.[status as keyof typeof leadsT.status] || status
    }

    const filteredLeads = leads.filter(lead =>
        lead.nome.toLowerCase().includes(search.toLowerCase()) ||
        lead.telefone.includes(search) ||
        (lead.cidade && lead.cidade.toLowerCase().includes(search.toLowerCase()))
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-foreground">
                        {leadsT.title}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {leadsT.subtitle}
                    </p>
                </div>
                <Button onClick={() => { fetchLeads(); fetchStats() }} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {common.update}
                </Button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-2xl font-bold text-blue-600">{stats.novos}</p>
                                    <p className="text-xs text-muted-foreground">{leadsT.stats.new}</p>
                                </div>
                                <UserPlus className="w-8 h-8 text-blue-200" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-2xl font-bold text-yellow-600">{stats.contatados}</p>
                                    <p className="text-xs text-muted-foreground">{leadsT.stats.contacted}</p>
                                </div>
                                <Phone className="w-8 h-8 text-yellow-200" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-2xl font-bold text-green-600">{stats.convertidos}</p>
                                    <p className="text-xs text-muted-foreground">{leadsT.stats.converted}</p>
                                </div>
                                <CheckCircle2 className="w-8 h-8 text-green-200" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-2xl font-bold text-foreground">{stats.hoje}</p>
                                    <p className="text-xs text-muted-foreground">{common.today}</p>
                                </div>
                                <Clock className="w-8 h-8 text-muted-foreground/20" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder={leadsT.filters.search}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px] bg-white border-gray-200 shadow-sm">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder={leadsT.filters.statusPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{common.all}</SelectItem>
                        <SelectItem value="novo">{leadsT.stats.new}</SelectItem>
                        <SelectItem value="contatado">{leadsT.stats.contacted}</SelectItem>
                        <SelectItem value="convertido">{leadsT.stats.converted}</SelectItem>
                        <SelectItem value="descartado">{leadsT.stats.dropped}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Leads Table */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredLeads.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>{common.noResults}</p>
                        </div>
                    ) : (
                        <>
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{leadsT.table.name}</TableHead>
                                            <TableHead>{leadsT.table.phone}</TableHead>
                                            <TableHead>{leadsT.table.city}</TableHead>
                                            <TableHead>{leadsT.table.status}</TableHead>
                                            <TableHead>{leadsT.table.received}</TableHead>
                                            <TableHead className="text-right">{common.actions}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredLeads.map((lead) => (
                                            <TableRow key={lead.id}>
                                                <TableCell className="font-medium">
                                                    {lead.nome}
                                                </TableCell>
                                                <TableCell>
                                                    <a
                                                        href={`tel:${lead.telefone}`}
                                                        className="text-brandy-rose-600 hover:underline"
                                                    >
                                                        {lead.telefone}
                                                    </a>
                                                </TableCell>
                                                <TableCell>
                                                    {lead.cidade || '—'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={statusColors[lead.status]}>
                                                        {getStatusLabel(lead.status)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {formatDistanceToNow(new Date(lead.created_at), {
                                                        addSuffix: true,
                                                        locale: dateLocale,
                                                    })}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleViewLead(lead)}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile View */}
                            <div className="md:hidden divide-y divide-pampas">
                                {filteredLeads.map((lead) => (
                                    <div
                                        key={lead.id}
                                        className="p-4 bg-white flex items-center justify-between hover:bg-desert-storm/50 cursor-pointer"
                                        onClick={() => handleViewLead(lead)}
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-foreground">
                                                    {lead.nome}
                                                </span>
                                                <Badge className={`${statusColors[lead.status]} text-[10px] h-4 px-1.5`}>
                                                    {getStatusLabel(lead.status)}
                                                </Badge>
                                            </div>
                                            <div className="flex flex-col text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="w-3 h-3" />
                                                    {lead.cidade || leadsT.modal?.noCityProvided || '—'}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDistanceToNow(new Date(lead.created_at), {
                                                        addSuffix: true,
                                                        locale: dateLocale,
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="text-muted-foreground">
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Lead Detail Modal */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{leadsT.modal.title}</DialogTitle>
                    </DialogHeader>

                    {selectedLead && (
                        <div className="space-y-4">
                            {/* Contact Info */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-brandy-rose-100 flex items-center justify-center">
                                        <Users className="w-5 h-5 text-brandy-rose-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">{selectedLead.nome}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {format(new Date(selectedLead.created_at), dateFormat, { locale: dateLocale })}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <a
                                        href={`tel:${selectedLead.telefone}`}
                                        className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                                    >
                                        <Phone className="w-4 h-4" />
                                        <span className="text-sm font-medium">{leadsT.modal.call}</span>
                                    </a>
                                    <a
                                        href={`sms:${selectedLead.telefone}`}
                                        className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                        <span className="text-sm font-medium">{leadsT.modal.sms}</span>
                                    </a>
                                </div>

                                <div className="p-3 bg-muted rounded-lg space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone className="w-4 h-4 text-muted-foreground" />
                                        {selectedLead.telefone}
                                    </div>
                                    {selectedLead.cidade && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <MapPin className="w-4 h-4 text-muted-foreground" />
                                            {selectedLead.cidade}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Status */}
                            <div className="space-y-2">
                                <Label>{common.status}</Label>
                                <Select
                                    value={selectedLead.status}
                                    onValueChange={(value) => updateLeadStatus(selectedLead.id, value)}
                                    disabled={isSaving}
                                >
                                    <SelectTrigger className="bg-white border-gray-200 shadow-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="novo">{leadsT.stats.new}</SelectItem>
                                        <SelectItem value="contatado">{leadsT.stats.contacted}</SelectItem>
                                        <SelectItem value="convertido">{leadsT.stats.converted}</SelectItem>
                                        <SelectItem value="descartado">{leadsT.stats.dropped}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <Label>{common.notes}</Label>
                                <Textarea
                                    placeholder={leadsT.modal.notesPlaceholder}
                                    defaultValue={selectedLead.notas || ''}
                                    onBlur={(e) => {
                                        if (e.target.value !== selectedLead.notas) {
                                            updateLeadNotes(selectedLead.id, e.target.value)
                                        }
                                    }}
                                    rows={3}
                                    className="bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400 resize-none"
                                />
                            </div>

                            {/* Timestamps */}
                            <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                                <p>{leadsT.modal?.receivedAt}: {format(new Date(selectedLead.created_at), dateFormat, { locale: dateLocale })}</p>
                                {selectedLead.contacted_at && (
                                    <p>{leadsT.modal?.contactedAt}: {format(new Date(selectedLead.contacted_at), dateFormat, { locale: dateLocale })}</p>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                            {common.close}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

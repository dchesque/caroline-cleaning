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

const statusConfig = {
    novo: { label: 'Novo', color: 'bg-blue-100 text-blue-800', icon: UserPlus },
    contatado: { label: 'Contatado', color: 'bg-yellow-100 text-yellow-800', icon: Phone },
    convertido: { label: 'Convertido', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
    descartado: { label: 'Descartado', color: 'bg-gray-100 text-gray-800', icon: XCircle },
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

    const { t } = useAdminI18n()
    const leadsT = t('leads')
    const common = t('common')

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
            toast.error(common.noResults) // Or generic error
            console.error(error)
        } else {
            setLeads(data || [])
        }
        setIsLoading(false)
    }

    async function fetchStats() {
        // we can try to get stats from a view or calculate them
        // the prompt mentions contact_leads_stats table/view
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
            toast.error('Erro ao atualizar status')
        } else {
            toast.success('Status atualizado!')
            fetchLeads()
            fetchStats()
            if (selectedLead) {
                setSelectedLead({ ...selectedLead, status: newStatus as any })
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
            toast.error('Erro ao salvar notas')
        } else {
            toast.success('Notas salvas!')
        }
    }

    function handleViewLead(lead: ContactLead) {
        setSelectedLead(lead)
        setIsDetailOpen(true)
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
                                <UserPlus className="w-8 h-8 text-yellow-200" />
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
                                {filteredLeads.map((lead) => {
                                    const status = statusConfig[lead.status]
                                    return (
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
                                                <Badge className={status.color}>
                                                    {status.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatDistanceToNow(new Date(lead.created_at), {
                                                    addSuffix: true
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
                                    )
                                })}
                            </TableBody>
                        </Table>
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
                                            {format(new Date(selectedLead.created_at), 'dd/MM/yyyy HH:mm')}
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
                                <p>Recebido: {format(new Date(selectedLead.created_at), 'dd/MM/yyyy HH:mm')}</p>
                                {selectedLead.contacted_at && (
                                    <p>Contatado: {format(new Date(selectedLead.contacted_at), 'dd/MM/yyyy HH:mm')}</p>
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

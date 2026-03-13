'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAdminI18n } from '@/lib/admin-i18n/context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Plus,
    Search,
    FileText,
    CheckCircle,
    Clock,
    XCircle,
    Eye,
    Download,
    MoreHorizontal,
    Send
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

const STATUS_CONTRACT = {
    rascunho: { label: 'Rascunho', variant: 'secondary', icon: FileText },
    enviado: { label: 'Enviado', variant: 'warning', icon: Clock },
    assinado: { label: 'Assinado', variant: 'success', icon: CheckCircle },
    cancelado: { label: 'Cancelado', variant: 'destructive', icon: XCircle },
    expirado: { label: 'Expirado', variant: 'outline', icon: XCircle },
}

export default function ContratosPage() {
    const { t } = useAdminI18n()
    const contractsT = t('contracts')
    const common = t('common')

    const [contracts, setContracts] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const supabase = createClient()

    useEffect(() => {
        const fetchContracts = async () => {
            setIsLoading(true)

            let query = supabase
                .from('contratos')
                .select(`
          *,
          clientes (
            id,
            nome,
            telefone,
            email
          )
        `)
                .order('created_at', { ascending: false })

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter)
            }

            if (search) {
                query = query.or(`numero.ilike.%${search}%,clientes.nome.ilike.%${search}%`)
            }

            const { data } = await query
            setContracts(data || [])
            setIsLoading(false)
        }

        fetchContracts()
    }, [search, statusFilter])

    // Stats
    const stats = {
        total: contracts.length,
        assinados: contracts.filter(c => c.status === 'assinado').length,
        pendentes: contracts.filter(c => c.status === 'enviado').length,
        valorTotal: contracts
            .filter(c => c.status === 'assinado')
            .reduce((acc, c) => acc + (c.valor_acordado || 0), 0),
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-heading text-h2 text-foreground">{contractsT.title}</h1>
                    <p className="text-body text-muted-foreground">
                        {contractsT.subtitle}
                    </p>
                </div>
                <Button asChild className="gap-2">
                    <Link href="/admin/contratos/novo">
                        <Plus className="w-4 h-4" />
                        {contractsT.newContract}
                    </Link>
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg">
                                <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-caption text-muted-foreground">{contractsT.stats.total}</p>
                                <p className="text-h3 font-semibold">{stats.total}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-success/10 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-success" />
                            </div>
                            <div>
                                <p className="text-caption text-muted-foreground">{contractsT.stats.signed}</p>
                                <p className="text-h3 font-semibold">{stats.assinados}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-warning/10 rounded-lg">
                                <Clock className="w-5 h-5 text-warning" />
                            </div>
                            <div>
                                <p className="text-caption text-muted-foreground">{contractsT.stats.pending}</p>
                                <p className="text-h3 font-semibold">{stats.pendentes}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-brandy-rose-100 rounded-lg">
                                <FileText className="w-5 h-5 text-brandy-rose-600" />
                            </div>
                            <div>
                                <p className="text-caption text-muted-foreground">{contractsT.stats.totalValue}</p>
                                <p className="text-h3 font-semibold">{formatCurrency(stats.valorTotal)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder={contractsT.filters.search}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px] bg-white border-gray-200 shadow-sm">
                        <SelectValue placeholder={contractsT.filters.statusPlaceholder || "Status"} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{common.all}</SelectItem>
                        {Object.entries(STATUS_CONTRACT).map(([key, value]) => (
                            <SelectItem key={key} value={key}>
                                {contractsT.status[key as keyof typeof contractsT.status] || value.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-6 space-y-4">
                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}
                        </div>
                    ) : contracts.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">{common.noResults}</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{contractsT.table.contract}</TableHead>
                                    <TableHead>{contractsT.table.client}</TableHead>
                                    <TableHead>{contractsT.table.value}</TableHead>
                                    <TableHead>{contractsT.table.period}</TableHead>
                                    <TableHead>{contractsT.table.status}</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {contracts.map((contract) => {
                                    const statusConfig = STATUS_CONTRACT[contract.status as keyof typeof STATUS_CONTRACT]
                                    const StatusIcon = statusConfig?.icon

                                    return (
                                        <TableRow key={contract.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">#{contract.numero}</p>
                                                    <p className="text-caption text-muted-foreground">
                                                        {formatDate(contract.created_at)}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Link
                                                    href={`/admin/clientes/${contract.cliente_id}`}
                                                    className="hover:text-brandy-rose-600 font-medium"
                                                >
                                                    {contract.clientes?.nome}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <p className="font-medium">{formatCurrency(contract.valor_acordado)}</p>
                                                <p className="text-caption text-muted-foreground capitalize">
                                                    {contract.frequencia}
                                                </p>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-body-sm">
                                                    {formatDate(contract.data_inicio)}
                                                </p>
                                                {contract.data_fim && (
                                                    <p className="text-caption text-muted-foreground">
                                                        até {formatDate(contract.data_fim)}
                                                    </p>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={statusConfig?.variant as any} className="gap-1">
                                                    {StatusIcon && <StatusIcon className="w-3 h-3" />}
                                                    {statusConfig?.label}
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
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/admin/contratos/${contract.id}`}>
                                                                <Eye className="w-4 h-4 mr-2" />
                                                                {common.view}
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        {(contract.status === 'rascunho' || contract.status === 'pendente') && (
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/admin/contratos/${contract.id}`}>
                                                                    <Send className="w-4 h-4 mr-2 text-brandy-rose-600" />
                                                                    Enviar p/ Assinar
                                                                </Link>
                                                            </DropdownMenuItem>
                                                        )}
                                                        {contract.documento_url && (
                                                            <DropdownMenuItem>
                                                                <Download className="w-4 h-4 mr-2" />
                                                                {contractsT.table.downloadPdf || 'Download PDF'}
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

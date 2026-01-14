'use client'

import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'
import { useAdminI18n } from '@/lib/admin-i18n/context'

interface ClientsFiltersProps {
    filters: {
        search: string
        status: string
        sortBy: string
        sortOrder: 'asc' | 'desc'
    }
    onChange: (filters: any) => void
}

export function ClientsFilters({ filters, onChange }: ClientsFiltersProps) {
    const { t } = useAdminI18n()
    const clientsT = t('clients')

    return (
        <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder={clientsT.filters.search}
                    className="pl-8 bg-white"
                    value={filters.search}
                    onChange={(e) => onChange({ ...filters, search: e.target.value })}
                />
            </div>
            <Select
                value={filters.status}
                onValueChange={(value) => onChange({ ...filters, status: value })}
            >
                <SelectTrigger className="w-[180px] bg-white">
                    <SelectValue placeholder={clientsT.filters.statusPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">{clientsT.filters.statusAll}</SelectItem>
                    <SelectItem value="lead">{clientsT.status.lead}</SelectItem>
                    <SelectItem value="ativo">{clientsT.status.active}</SelectItem>
                    <SelectItem value="pausado">{clientsT.status.paused}</SelectItem>
                    <SelectItem value="cancelado">{clientsT.status.cancelled}</SelectItem>
                </SelectContent>
            </Select>
            <Select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onValueChange={(value) => {
                    const [sortBy, sortOrder] = value.split('-')
                    onChange({ ...filters, sortBy, sortOrder })
                }}
            >
                <SelectTrigger className="w-[180px] bg-white">
                    <SelectValue placeholder={clientsT.filters.orderBy} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="created_at-desc">{clientsT.filters.recent}</SelectItem>
                    <SelectItem value="created_at-asc">{clientsT.filters.oldest}</SelectItem>
                    <SelectItem value="nome-asc">{clientsT.filters.nameAZ}</SelectItem>
                    <SelectItem value="nome-desc">{clientsT.filters.nameZA}</SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
}

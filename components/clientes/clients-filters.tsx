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
    return (
        <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar clientes por nome ou telefone..."
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
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="pausado">Pausado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
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
                    <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="created_at-desc">Mais recentes</SelectItem>
                    <SelectItem value="created_at-asc">Mais antigos</SelectItem>
                    <SelectItem value="nome-asc">Nome (A-Z)</SelectItem>
                    <SelectItem value="nome-desc">Nome (Z-A)</SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
}

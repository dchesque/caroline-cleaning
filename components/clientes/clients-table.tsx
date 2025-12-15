'use client'

import React from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { STATUS_CONFIG } from '@/lib/constants'

interface ClientsTableProps {
    clients: any[]
    isLoading: boolean
}

export function ClientsTable({ clients, isLoading }: ClientsTableProps) {
    const router = useRouter()

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (clients.length === 0) {
        return (
            <div className="text-center p-8 border rounded-lg bg-[#FDF8F6] border-[#EAE0D5]">
                <p className="text-muted-foreground">Nenhum cliente encontrado.</p>
            </div>
        )
    }

    return (
        <div className="rounded-md border border-[#EAE0D5] bg-white">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Endereço</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {clients.map((client) => {
                        const status = STATUS_CONFIG.cliente[client.status as keyof typeof STATUS_CONFIG.cliente] || STATUS_CONFIG.cliente.lead
                        return (
                            <TableRow key={client.id} className="hover:bg-[#FDF8F6]">
                                <TableCell className="font-medium">{client.nome}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col text-sm">
                                        <span>{client.telefone}</span>
                                        <span className="text-xs text-muted-foreground">{client.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate" title={client.endereco_rua}>
                                    {client.endereco_rua || '-'}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={status.variant}>
                                        {status.label}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => router.push(`/admin/clientes/${client.id}`)}>
                                                Ver Detalhes
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>Editar</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}

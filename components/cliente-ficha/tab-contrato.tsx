'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { FileText, Plus, Download, Eye } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_COLORS: Record<string, string> = {
    pendente: 'bg-yellow-100 text-yellow-700',
    enviado: 'bg-blue-100 text-blue-700',
    assinado: 'bg-green-100 text-green-700',
    cancelado: 'bg-red-100 text-red-700',
    expirado: 'bg-gray-100 text-gray-700',
}

interface TabContratoProps {
    client: any
}

export function TabContrato({ client }: TabContratoProps) {
    const [contracts, setContracts] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    const fetchContracts = async () => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('contratos')
            .select('*')
            .eq('cliente_id', client.id)
            .order('created_at', { ascending: false })

        if (!error && data) {
            setContracts(data)
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchContracts()
    }, [client.id])

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-24" />
                <Skeleton className="h-64" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header com botão */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Contratos</h3>
                    <p className="text-sm text-muted-foreground">
                        {contracts.length} contrato(s) cadastrado(s)
                    </p>
                </div>
                <Button asChild className="bg-[#C48B7F] hover:bg-[#A66D60]">
                    <Link href="/admin/contratos/novo">
                        <Plus className="h-4 w-4 mr-1" />
                        Novo Contrato
                    </Link>
                </Button>
            </div>

            {/* Lista de Contratos */}
            <Card>
                <CardContent className="p-0">
                    {contracts.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg mb-2">Nenhum contrato cadastrado</p>
                            <p className="text-sm">Clique em "Novo Contrato" para criar um</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Número</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Valor</TableHead>
                                    <TableHead>Início</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[100px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {contracts.map((contract) => (
                                    <TableRow key={contract.id}>
                                        <TableCell className="font-mono">
                                            {contract.numero || '-'}
                                        </TableCell>
                                        <TableCell className="capitalize">
                                            {contract.tipo_servico?.replace('_', ' ') || '-'}
                                        </TableCell>
                                        <TableCell>
                                            ${Number(contract.valor_acordado).toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(contract.data_inicio), 'dd/MM/yyyy')}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={STATUS_COLORS[contract.status]}>
                                                {contract.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/admin/contratos/${contract.id}`}>
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

        </div>
    )
}

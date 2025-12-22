'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
    MoreHorizontal,
    Eye,
    Pencil,
    Trash2,
    Phone,
    MessageSquare,
    UserCheck,
    UserX,
    UserMinus,
    Clock
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Client {
    id: string
    nome: string
    telefone: string
    email?: string
    status: string
    frequencia?: string
    endereco_completo?: string
    cidade?: string
}

interface ClientsTableProps {
    clients: Client[]
    isLoading: boolean
    onRefresh?: () => void
}

const STATUS_CONFIG = {
    lead: { label: 'Lead', color: 'bg-blue-100 text-blue-700' },
    ativo: { label: 'Ativo', color: 'bg-green-100 text-green-700' },
    pausado: { label: 'Pausado', color: 'bg-yellow-100 text-yellow-700' },
    cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
    inativo: { label: 'Inativo', color: 'bg-gray-100 text-gray-700' },
}

const FREQUENCIA_LABELS: Record<string, string> = {
    weekly: 'Semanal',
    biweekly: 'Quinzenal',
    monthly: 'Mensal',
    one_time: 'Avulso',
}

export function ClientsTable({ clients, isLoading, onRefresh }: ClientsTableProps) {
    const router = useRouter()
    const supabase = createClient()
    const [deletingClient, setDeletingClient] = useState<Client | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Função para alterar status
    const handleStatusChange = async (clientId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('clientes')
                .update({ status: newStatus })
                .eq('id', clientId)

            if (error) throw error

            toast.success(`Status alterado para ${STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG]?.label}`)
            onRefresh?.()
        } catch (error) {
            console.error('Error updating status:', error)
            toast.error('Erro ao alterar status')
        }
    }

    // Função para excluir cliente
    const handleDelete = async () => {
        if (!deletingClient) return

        setIsDeleting(true)
        try {
            const { error } = await supabase
                .from('clientes')
                .delete()
                .eq('id', deletingClient.id)

            if (error) throw error

            toast.success('Cliente excluído com sucesso')
            setDeletingClient(null)
            onRefresh?.()
        } catch (error) {
            console.error('Error deleting client:', error)
            toast.error('Erro ao excluir cliente. Verifique se não há agendamentos vinculados.')
        } finally {
            setIsDeleting(false)
        }
    }

    // Função para abrir SMS
    const handleSMS = (telefone: string) => {
        const cleanPhone = telefone.replace(/\D/g, '')
        window.open(`sms:+1${cleanPhone}`, '_blank')
    }

    // Função para abrir WhatsApp
    const handleWhatsApp = (telefone: string) => {
        const cleanPhone = telefone.replace(/\D/g, '')
        window.open(`https://wa.me/1${cleanPhone}`, '_blank')
    }

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
        )
    }

    if (clients.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                Nenhum cliente encontrado
            </div>
        )
    }

    return (
        <>
            {/* Desktop Table */}
            <div className="hidden md:block rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Telefone</TableHead>
                            <TableHead>Cidade</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Frequência</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clients.map((client) => {
                            const status = STATUS_CONFIG[client.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.lead
                            return (
                                <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50">
                                    <TableCell
                                        className="font-medium"
                                        onClick={() => router.push(`/admin/clientes/${client.id}`)}
                                    >
                                        {client.nome}
                                    </TableCell>
                                    <TableCell onClick={() => router.push(`/admin/clientes/${client.id}`)}>
                                        {client.telefone}
                                    </TableCell>
                                    <TableCell onClick={() => router.push(`/admin/clientes/${client.id}`)}>
                                        {client.cidade || '-'}
                                    </TableCell>
                                    <TableCell onClick={() => router.push(`/admin/clientes/${client.id}`)}>
                                        <Badge className={cn('font-normal', status.color)}>
                                            {status.label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell onClick={() => router.push(`/admin/clientes/${client.id}`)}>
                                        {client.frequencia ? FREQUENCIA_LABELS[client.frequencia] || client.frequencia : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                <DropdownMenuSeparator />

                                                <DropdownMenuItem onClick={() => router.push(`/admin/clientes/${client.id}`)}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    Ver Detalhes
                                                </DropdownMenuItem>

                                                <DropdownMenuItem onClick={() => router.push(`/admin/clientes/${client.id}?edit=true`)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Editar
                                                </DropdownMenuItem>

                                                <DropdownMenuSeparator />

                                                <DropdownMenuItem onClick={() => handleSMS(client.telefone)}>
                                                    <MessageSquare className="mr-2 h-4 w-4" />
                                                    Enviar SMS
                                                </DropdownMenuItem>

                                                <DropdownMenuItem onClick={() => handleWhatsApp(client.telefone)}>
                                                    <Phone className="mr-2 h-4 w-4" />
                                                    WhatsApp
                                                </DropdownMenuItem>

                                                <DropdownMenuSeparator />

                                                {/* Submenu de Status */}
                                                <DropdownMenuSub>
                                                    <DropdownMenuSubTrigger>
                                                        <UserCheck className="mr-2 h-4 w-4" />
                                                        Alterar Status
                                                    </DropdownMenuSubTrigger>
                                                    <DropdownMenuSubContent>
                                                        <DropdownMenuItem onClick={() => handleStatusChange(client.id, 'lead')}>
                                                            <Clock className="mr-2 h-4 w-4 text-blue-500" />
                                                            Lead
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleStatusChange(client.id, 'ativo')}>
                                                            <UserCheck className="mr-2 h-4 w-4 text-green-500" />
                                                            Ativo
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleStatusChange(client.id, 'pausado')}>
                                                            <UserMinus className="mr-2 h-4 w-4 text-yellow-500" />
                                                            Pausado
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleStatusChange(client.id, 'cancelado')}>
                                                            <UserX className="mr-2 h-4 w-4 text-red-500" />
                                                            Cancelado
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleStatusChange(client.id, 'inativo')}>
                                                            <UserMinus className="mr-2 h-4 w-4 text-gray-500" />
                                                            Inativo
                                                        </DropdownMenuItem>
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuSub>

                                                <DropdownMenuSeparator />

                                                <DropdownMenuItem
                                                    onClick={() => setDeletingClient(client)}
                                                    className="text-red-600 focus:text-red-600"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {clients.map((client) => {
                    const status = STATUS_CONFIG[client.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.lead
                    return (
                        <div
                            key={client.id}
                            className="bg-white rounded-lg border p-4 space-y-3"
                        >
                            <div className="flex justify-between items-start">
                                <div onClick={() => router.push(`/admin/clientes/${client.id}`)}>
                                    <p className="font-semibold">{client.nome}</p>
                                    <p className="text-sm text-muted-foreground">{client.telefone}</p>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => router.push(`/admin/clientes/${client.id}`)}>
                                            <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleSMS(client.telefone)}>
                                            <MessageSquare className="mr-2 h-4 w-4" /> SMS
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleWhatsApp(client.telefone)}>
                                            <Phone className="mr-2 h-4 w-4" /> WhatsApp
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => setDeletingClient(client)}
                                            className="text-red-600"
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="flex gap-2">
                                <Badge className={cn('font-normal', status.color)}>
                                    {status.label}
                                </Badge>
                                {client.frequencia && (
                                    <Badge variant="outline">
                                        {FREQUENCIA_LABELS[client.frequencia] || client.frequencia}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deletingClient} onOpenChange={() => setDeletingClient(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar Exclusão</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja excluir o cliente <strong>{deletingClient?.nome}</strong>?
                            <br /><br />
                            Esta ação não pode ser desfeita. Todos os dados do cliente serão removidos permanentemente.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeletingClient(null)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Excluindo...' : 'Excluir'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

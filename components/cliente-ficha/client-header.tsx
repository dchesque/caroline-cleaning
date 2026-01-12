'use client'

import { EditClientModal } from '@/components/clientes/edit-client-modal'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
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
import {
    ArrowLeft,
    MoreVertical,
    Phone,
    Mail,
    MapPin,
    MessageSquare,
    Calendar,
    Pencil,
    Trash2,
    CheckCircle,
    UserX,
    UserMinus,
    Clock
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { AppointmentModal } from '@/components/agenda/appointment-modal'

interface ClientHeaderProps {
    client: any
}

const STATUS_CONFIG = {
    lead: { label: 'Lead', color: 'bg-blue-100 text-blue-700', icon: Clock },
    ativo: { label: 'Ativo', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    pausado: { label: 'Pausado', color: 'bg-yellow-100 text-yellow-700', icon: UserMinus },
    cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: UserX },
    inativo: { label: 'Inativo', color: 'bg-gray-100 text-gray-700', icon: UserMinus },
}

export function ClientHeader({ client }: ClientHeaderProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showAppointmentModal, setShowAppointmentModal] = useState(false)
    const [currentStatus, setCurrentStatus] = useState(client.status)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

    useEffect(() => {
        if (searchParams.get('edit') === 'true') {
            setIsEditModalOpen(true)
        }
    }, [searchParams])

    const status = STATUS_CONFIG[currentStatus as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.lead
    const StatusIcon = status.icon

    // Função para alterar status
    const handleStatusChange = async (newStatus: string) => {
        try {
            const { error } = await supabase
                .from('clientes')
                .update({ status: newStatus })
                .eq('id', client.id)

            if (error) throw error

            setCurrentStatus(newStatus)
            toast.success(`Status alterado para ${STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG]?.label}`)
        } catch (error) {
            console.error('Error updating status:', error)
            toast.error('Erro ao alterar status')
        }
    }

    // Função para excluir cliente
    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const { error } = await supabase
                .from('clientes')
                .delete()
                .eq('id', client.id)

            if (error) throw error

            toast.success('Cliente excluído com sucesso')
            router.push('/admin/clientes')
        } catch (error) {
            console.error('Error deleting client:', error)
            toast.error('Erro ao excluir cliente')
        } finally {
            setIsDeleting(false)
            setShowDeleteDialog(false)
        }
    }

    // Função para abrir SMS
    const handleSMS = () => {
        const cleanPhone = client.telefone.replace(/\D/g, '')
        window.open(`sms:+1${cleanPhone}`, '_blank')
    }

    // Função para abrir WhatsApp
    const handleWhatsApp = () => {
        const cleanPhone = client.telefone.replace(/\D/g, '')
        window.open(`https://wa.me/1${cleanPhone}`, '_blank')
    }

    // Função para ligar
    const handleCall = () => {
        const cleanPhone = client.telefone.replace(/\D/g, '')
        window.open(`tel:+1${cleanPhone}`, '_blank')
    }

    return (
        <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                {/* Left Side - Client Info */}
                <div className="flex items-start gap-4">
                    <Link href="/admin/clientes">
                        <Button variant="ghost" size="icon" className="shrink-0">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold">{client.nome}</h1>
                            {/* Status Badge com Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Badge
                                        className={cn('cursor-pointer hover:opacity-80', status.color)}
                                    >
                                        <StatusIcon className="w-3 h-3 mr-1" />
                                        {status.label}
                                    </Badge>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuLabel>Alterar Status</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                        <DropdownMenuItem
                                            key={key}
                                            onClick={() => handleStatusChange(key)}
                                            className={currentStatus === key ? 'bg-muted' : ''}
                                        >
                                            <config.icon className={cn('mr-2 h-4 w-4', config.color.replace('bg-', 'text-').split(' ')[0])} />
                                            {config.label}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Contact Info */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Phone className="h-3.5 w-3.5" />
                                {client.telefone}
                            </span>
                            {client.email && (
                                <span className="flex items-center gap-1">
                                    <Mail className="h-3.5 w-3.5" />
                                    {client.email}
                                </span>
                            )}
                            {client.cidade && (
                                <span className="flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {client.cidade}, {client.estado}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side - Action Buttons */}
                <div className="flex items-center gap-2 pl-12 sm:pl-0">
                    {/* SMS Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSMS}
                        className="gap-2"
                    >
                        <MessageSquare className="h-4 w-4" />
                        <span className="hidden sm:inline">SMS</span>
                    </Button>

                    {/* WhatsApp Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleWhatsApp}
                        className="gap-2 text-green-600 border-green-600 hover:bg-green-50"
                    >
                        <Phone className="h-4 w-4" />
                        <span className="hidden sm:inline">WhatsApp</span>
                    </Button>

                    {/* Call Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCall}
                        className="gap-2"
                    >
                        <Phone className="h-4 w-4" />
                        <span className="hidden sm:inline">Ligar</span>
                    </Button>

                    {/* Schedule Button */}
                    <Button
                        size="sm"
                        onClick={() => setShowAppointmentModal(true)}
                        className="gap-2 bg-[#C48B7F] hover:bg-[#A66D60]"
                    >
                        <Calendar className="h-4 w-4" />
                        <span className="hidden sm:inline">Agendar</span>
                    </Button>

                    {/* More Options */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/admin/clientes/${client.id}?edit=true`)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar Cliente
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => setShowDeleteDialog(true)}
                                className="text-red-600 focus:text-red-600"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir Cliente
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar Exclusão</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja excluir o cliente <strong>{client.nome}</strong>?
                            <br /><br />
                            Esta ação não pode ser desfeita.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
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

            {/* Appointment Modal */}
            <AppointmentModal
                open={showAppointmentModal}
                onOpenChange={setShowAppointmentModal}
                preSelectedClientId={client.id}
                onSuccess={() => router.refresh()}
            />

            {/* Edit Client Modal */}
            <EditClientModal
                open={isEditModalOpen}
                onOpenChange={(open) => {
                    setIsEditModalOpen(open)
                    if (!open) {
                        router.replace(`/admin/clientes/${client.id}`)
                    }
                }}
                clientId={client.id}
                onSuccess={() => {
                    router.refresh()
                }}
            />
        </>
    )
}

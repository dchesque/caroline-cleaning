'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
    Calendar,
    Clock,
    MapPin,
    User,
    Phone,
    FileText,
    DollarSign,
    Edit2,
    Trash2,
    CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrencyUSD } from '@/lib/formatters'

interface AppointmentDetailModalProps {
    appointment: any | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onEdit?: (appointment: any) => void
    onDelete?: (appointment: any) => void
}

export function AppointmentDetailModal({
    appointment,
    open,
    onOpenChange,
    onEdit,
    onDelete
}: AppointmentDetailModalProps) {
    if (!appointment) return null

    const statusColors = {
        agendado: 'bg-blue-100 text-blue-700',
        confirmado: 'bg-green-100 text-green-700',
        em_andamento: 'bg-yellow-100 text-yellow-700',
        concluido: 'bg-slate-100 text-slate-700',
        cancelado: 'bg-red-100 text-red-700',
    }

    const formatTime = (time: string) => time?.substring(0, 5)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-[#FDF8F6] border-[#C48B7F]/20">
                <DialogHeader>
                    <div className="flex items-center justify-between mr-8">
                        <Badge
                            variant="secondary"
                            className={cn(
                                "border-none font-bold uppercase tracking-tighter text-[10px] px-2 py-0.5",
                                statusColors[appointment.status as keyof typeof statusColors]
                            )}
                        >
                            {appointment.status}
                        </Badge>
                        <div className="flex gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-[#5D5D5D] hover:bg-[#C48B7F]/10 hover:text-[#C48B7F]"
                                onClick={() => onEdit?.(appointment)}
                            >
                                <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-400 hover:bg-red-50 hover:text-red-500"
                                onClick={() => onDelete?.(appointment)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <DialogTitle className="text-2xl font-heading text-[#2C211A] pt-2">
                        Detalhes do Agendamento
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-5 pt-4">
                    {/* Cliente */}
                    <div className="flex items-center gap-4">
                        <div className="bg-[#C48B7F] p-2.5 rounded-full shadow-sm">
                            <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-[#2C211A] leading-tight">
                                {appointment.cliente?.nome || 'Cliente'}
                            </p>
                            <div className="flex items-center gap-1.5 text-sm text-[#BE9982] mt-0.5 font-medium">
                                <Phone className="w-3.5 h-3.5" />
                                <span>{appointment.cliente?.telefone || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Data e Hora */}
                    <div className="grid grid-cols-2 gap-3 bg-white p-4 rounded-xl border border-[#C48B7F]/10 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="bg-[#FDF8F6] p-2 rounded-lg">
                                <Calendar className="w-4 h-4 text-[#C48B7F]" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-[#BE9982] tracking-wider">Data</p>
                                <p className="font-bold text-[#5D5D5D] whitespace-nowrap">
                                    {format(new Date(appointment.data), 'dd/MM/yyyy')}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-[#FDF8F6] p-2 rounded-lg">
                                <Clock className="w-4 h-4 text-[#C48B7F]" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-[#BE9982] tracking-wider">Horário</p>
                                <p className="font-bold text-[#5D5D5D] whitespace-nowrap">
                                    {formatTime(appointment.horario_inicio)} - {formatTime(appointment.horario_fim_estimado) || '...'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Endereço */}
                    <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div className="text-sm">
                            <p className="text-xs text-muted-foreground">Localização</p>
                            <p>{appointment.cliente?.endereco_completo || 'Endereço não informado'}</p>
                        </div>
                    </div>

                    <Separator />

                    {/* Serviço e Valores */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#C48B7F]" />
                                <span className="text-sm font-medium">{appointment.tipo}</span>
                            </div>
                            <span className="text-sm font-bold text-[#C48B7F]">
                                {formatCurrencyUSD(appointment.valor_final || appointment.valor)}
                            </span>
                        </div>

                        {appointment.addons && Array.isArray(appointment.addons) && appointment.addons.length > 0 && (
                            <div className="pl-4 space-y-1">
                                {appointment.addons.map((addon: any, idx: number) => (
                                    <div key={idx} className="flex justify-between text-xs text-muted-foreground">
                                        <span>• {addon.nome} x{addon.quantidade}</span>
                                        <span>+{formatCurrencyUSD(addon.preco * addon.quantidade)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {appointment.notas && (
                        <>
                            <Separator />
                            <div className="flex items-start gap-3">
                                <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                                <div className="text-sm">
                                    <p className="text-xs text-muted-foreground">Notas</p>
                                    <p className="text-gray-600 italic">"{appointment.notas}"</p>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="pt-2">
                        <Button
                            className="w-full bg-[#C48B7F] hover:bg-[#A66D60]"
                            onClick={() => onOpenChange(false)}
                        >
                            Fechar
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

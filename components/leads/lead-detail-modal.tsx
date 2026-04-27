'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UnifiedLead } from '@/types/leads'
import { useAdminI18n } from '@/lib/admin-i18n/context'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Users, Phone, MessageSquare, MapPin, Trash2, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR, enUS } from 'date-fns/locale'

interface LeadDetailModalProps {
  lead: UnifiedLead | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onLeadUpdated: () => void
  onConvert?: (lead: UnifiedLead) => void
}

const statusColors: Record<string, string> = {
  novo: 'bg-blue-100 text-blue-800',
  novo_incompleto: 'bg-blue-50 text-blue-600',
  contatado: 'bg-yellow-100 text-yellow-800',
  convertido: 'bg-green-100 text-green-800',
  descartado: 'bg-gray-100 text-gray-800',
  retorno_futuro: 'bg-purple-100 text-purple-800'
}

const sourceLabels = {
  chat: 'Chat IA',
  form: 'Formulário de Contato'
}

export function LeadDetailModal({ lead, open, onOpenChange, onLeadUpdated, onConvert }: LeadDetailModalProps) {
  const { t, locale } = useAdminI18n()
  const leadsT = t('leads')
  const common = t('common')
  const dateLocale = locale === 'pt-BR' ? ptBR : enUS
  const dateFormat = locale === 'pt-BR' ? 'dd/MM/yyyy HH:mm' : 'MM/dd/yyyy hh:mm a'

  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [notes, setNotes] = useState(lead?.notas || '')
  const [showReturnDate, setShowReturnDate] = useState(false)
  const [returnDate, setReturnDate] = useState('')
  const router = useRouter()
  const supabase = createClient()

  if (!lead) return null

  const getStatusLabel = (status: string) => {
    return leadsT.status?.[status as keyof typeof leadsT.status] || status
  }

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    } else if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
    }
    return phone
  }

  const handleStatusChange = async (newStatus: string) => {
    setIsSaving(true)

    try {
      const updateData: any = { status: newStatus }

      if (newStatus === 'contatado' && lead.status !== 'contatado') {
        updateData.contacted_at = new Date().toISOString()
      }

      if (newStatus === 'retorno_futuro') {
        setShowReturnDate(true)
        setIsSaving(false)
        return
      }

      if (lead.source === 'chat') {
        await supabase.from('clientes').update(updateData).eq('id', lead.id)
      } else {
        await supabase.from('contact_leads').update(updateData).eq('id', lead.id)
      }

      toast.success(leadsT.actions?.convert || 'Status atualizado')
      onLeadUpdated()
      onOpenChange(false)
    } catch (err) {
      toast.error('Erro ao atualizar status')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveReturnDate = async () => {
    if (!returnDate) {
      toast.error('Selecione uma data para retorno')
      return
    }

    setIsSaving(true)

    try {
      const updateData = {
        status: 'retorno_futuro',
        data_retorno: returnDate
      }

      if (lead.source === 'chat') {
        await supabase.from('clientes').update(updateData).eq('id', lead.id)
      } else {
        await supabase.from('contact_leads').update(updateData).eq('id', lead.id)
      }

      toast.success('Lead marcado para retorno')
      onLeadUpdated()
      onOpenChange(false)
    } catch (err) {
      toast.error('Erro ao salvar data de retorno')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveNotes = async () => {
    if (notes === lead.notas) return

    setIsSaving(true)

    try {
      if (lead.source === 'chat') {
        await supabase.from('clientes').update({ notas_internas: notes }).eq('id', lead.id)
      } else {
        await supabase.from('contact_leads').update({ notas: notes }).eq('id', lead.id)
      }

      toast.success('Notas salvas')
      onLeadUpdated()
    } catch (err) {
      toast.error('Erro ao salvar notas')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(leadsT.modal?.confirmDelete || 'Tem certeza?')) return

    setIsDeleting(true)

    try {
      if (lead.source === 'chat') {
        await supabase.from('clientes').update({ deleted_at: new Date().toISOString() }).eq('id', lead.id)
      } else {
        await supabase.from('contact_leads').update({ deleted_at: new Date().toISOString() }).eq('id', lead.id)
      }

      toast.success('Lead excluído')
      onLeadUpdated()
      onOpenChange(false)
    } catch (err) {
      toast.error('Erro ao excluir lead')
      console.error(err)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{leadsT.modal?.title || 'Detalhes do Lead'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brandy-rose-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-brandy-rose-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{lead.nome}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(lead.created_at), dateFormat, { locale: dateLocale })}
              </p>
            </div>
            <Badge className={`${statusColors[lead.status]} text-xs`}>
              {getStatusLabel(lead.status)}
            </Badge>
          </div>

          <div className="text-sm text-muted-foreground">
            {sourceLabels[lead.source]} • {leadsT.table?.received}{' '}
            {format(new Date(lead.created_at), dateFormat, { locale: dateLocale })}
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-muted rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <a href={`tel:${lead.telefone}`} className="text-brandy-rose-600 hover:underline">
                  {formatPhone(lead.telefone)}
                </a>
              </div>
              {lead.cidade && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  {lead.cidade}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <a href={`tel:${lead.telefone}`} className="flex items-center justify-center gap-2 p-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors text-sm">
                <Phone className="w-4 h-4" />
                {leadsT.actions?.call || 'Ligar'}
              </a>
              <a href={`sms:${lead.telefone}`} className="flex items-center justify-center gap-2 p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-sm">
                <MessageSquare className="w-4 h-4" />
                {leadsT.actions?.sms || 'SMS'}
              </a>
            </div>
          </div>

          {lead.source === 'form' && lead.mensagem && (
            <div className="space-y-2">
              <Label>{leadsT.modal?.message || 'Mensagem'}</Label>
              <div className="p-3 bg-muted rounded-lg text-sm">
                {lead.mensagem}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>{common.status}</Label>
            <Select value={lead.status} onValueChange={handleStatusChange} disabled={isSaving}>
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="novo">{getStatusLabel('novo')}</SelectItem>
                <SelectItem value="contatado">{getStatusLabel('contatado')}</SelectItem>
                <SelectItem value="retorno_futuro">{getStatusLabel('retorno_futuro')}</SelectItem>
                <SelectItem value="convertido">{getStatusLabel('convertido')}</SelectItem>
                <SelectItem value="descartado">{getStatusLabel('descartado')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showReturnDate && (
            <div className="space-y-2">
              <Label>
                <Calendar className="w-4 h-4 inline mr-1" />
                {leadsT.modal?.returnDate || 'Data de Retorno'}
              </Label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-2 border rounded-lg"
              />
              <div className="flex gap-2">
                <Button onClick={handleSaveReturnDate} disabled={isSaving} size="sm">
                  {isSaving ? 'Salvando...' : 'Salvar Data'}
                </Button>
                <Button variant="outline" onClick={() => setShowReturnDate(false)} size="sm">
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>{common.notes}</Label>
            <Textarea
              placeholder={leadsT.modal?.notesPlaceholder || 'Adicione notas...'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleSaveNotes}
              rows={3}
              className="bg-white resize-none"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button onClick={() => onConvert?.(lead)} className="bg-brandy-rose-500 hover:bg-brandy-rose-600 w-full sm:w-auto">
            <Users className="w-4 h-4 mr-2" />
            {leadsT.actions?.convert || 'Transformar em Cliente'}
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="w-full sm:w-auto">
            <Trash2 className="w-4 h-4 mr-2" />
            {leadsT.actions?.delete || 'Excluir'}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            {common.close}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

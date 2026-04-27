'use client'

import { UnifiedLead } from '@/types/leads'
import { useAdminI18n } from '@/lib/admin-i18n/context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, MapPin, Clock, MessageSquare, MessageSquareOff } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR, enUS } from 'date-fns/locale'

interface LeadsMobileListProps {
  leads: UnifiedLead[]
  onViewDetails: (lead: UnifiedLead) => void
}

const statusColors: Record<string, string> = {
  novo: 'bg-blue-100 text-blue-800',
  novo_incompleto: 'bg-blue-50 text-blue-600',
  contatado: 'bg-yellow-100 text-yellow-800',
  convertido: 'bg-green-100 text-green-800',
  descartado: 'bg-gray-100 text-gray-800',
  retorno_futuro: 'bg-purple-100 text-purple-800'
}

const sourceIcons = {
  chat: '💬',
  form: '📝'
}

export function LeadsMobileList({ leads, onViewDetails }: LeadsMobileListProps) {
  const { t, locale } = useAdminI18n()
  const leadsT = t('leads')
  const dateLocale = locale === 'pt-BR' ? ptBR : enUS

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

  if (leads.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground md:hidden">
        <p>Nenhum lead encontrado.</p>
      </div>
    )
  }

  return (
    <div className="md:hidden divide-y divide-pampas">
      {leads.map((lead) => (
        <div
          key={`${lead.source}-${lead.id}`}
          className="p-4 bg-white flex items-center justify-between hover:bg-desert-storm/50 cursor-pointer"
          onClick={() => onViewDetails(lead)}
        >
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{lead.nome}</span>
              <Badge className={`${statusColors[lead.status]} text-[10px] h-4 px-1.5`}>
                {getStatusLabel(lead.status)}
              </Badge>
              <span className="text-lg">{sourceIcons[lead.source]}</span>
            </div>

            <div className="text-sm text-muted-foreground">
              {formatPhone(lead.telefone)}
            </div>

            <div className="flex flex-col text-sm text-muted-foreground gap-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3" />
                {lead.location_display}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(lead.created_at), {
                  addSuffix: true,
                  locale: dateLocale
                })}
              </div>
              {lead.mensagem && (
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3" />
                  <span className="truncate max-w-[200px]">{lead.mensagem}</span>
                </div>
              )}
            </div>
          </div>

          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}

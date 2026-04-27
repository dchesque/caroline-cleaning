'use client'

import { UnifiedLead } from '@/types/leads'
import { useAdminI18n } from '@/lib/admin-i18n/context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MessageSquare, MessageSquareOff } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR, enUS } from 'date-fns/locale'

interface LeadsTableProps {
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

export function LeadsTable({ leads, onViewDetails }: LeadsTableProps) {
  const { t, locale } = useAdminI18n()
  const leadsT = t('leads')
  const common = t('common')
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

  const getMessagePreview = (mensagem: string | null) => {
    if (!mensagem) return <MessageSquareOff className="w-4 h-4 text-muted-foreground opacity-30" />
    const preview = mensagem.length > 30 ? mensagem.slice(0, 30) + '...' : mensagem
    return (
      <div className="flex items-center gap-1" title={mensagem}>
        <MessageSquare className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground truncate max-w-[150px]">{preview}</span>
      </div>
    )
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhum lead encontrado.</p>
      </div>
    )
  }

  return (
    <div className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{leadsT.table.name}</TableHead>
            <TableHead>{leadsT.table.phone}</TableHead>
            <TableHead>{leadsT.table.source}</TableHead>
            <TableHead>{leadsT.table.city}</TableHead>
            <TableHead>{leadsT.table.status}</TableHead>
            <TableHead>{leadsT.table.messagePreview}</TableHead>
            <TableHead>{leadsT.table.received}</TableHead>
            <TableHead className="text-right">{common.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={`${lead.source}-${lead.id}`}>
              <TableCell className="font-medium">{lead.nome}</TableCell>
              <TableCell>
                <a
                  href={`tel:${lead.telefone}`}
                  className="text-brandy-rose-600 hover:underline"
                >
                  {formatPhone(lead.telefone)}
                </a>
              </TableCell>
              <TableCell>
                <span className="text-lg">{sourceIcons[lead.source]}</span>
                <span className="ml-1 text-sm text-muted-foreground">
                  {lead.source === 'chat' ? leadsT.source.chat : leadsT.source.form}
                </span>
              </TableCell>
              <TableCell>{lead.location_display}</TableCell>
              <TableCell>
                <Badge className={statusColors[lead.status]}>
                  {getStatusLabel(lead.status)}
                </Badge>
              </TableCell>
              <TableCell>{getMessagePreview(lead.mensagem)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(lead.created_at), {
                  addSuffix: true,
                  locale: dateLocale
                })}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewDetails(lead)}
                >
                  {leadsT.actions.viewDetails}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

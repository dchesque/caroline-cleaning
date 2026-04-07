// app/(admin)/admin/chat-logs/components/SessionList.tsx
'use client'

import { formatDistanceToNow } from 'date-fns'
import { ptBR, enUS } from 'date-fns/locale'
import { CheckCircle, Clock, AlertTriangle, MessageSquare } from 'lucide-react'
import { SessionSummary } from '@/lib/services/chat-logger'

interface Props {
  sessions: SessionSummary[]
  selectedId?: string
  onSelect: (id: string) => void
  locale: string
}

export function SessionList({ sessions, selectedId, onSelect, locale }: Props) {
  const dateLocale = locale === 'pt-BR' ? ptBR : enUS

  const getStatusIcon = (session: SessionSummary) => {
    if (session.has_errors) return <AlertTriangle className="w-4 h-4 text-red-500" />
    if (session.final_state === 'DONE') return <CheckCircle className="w-4 h-4 text-green-500" />
    return <Clock className="w-4 h-4 text-yellow-500" />
  }

  const getStatusColor = (session: SessionSummary) => {
    if (session.has_errors) return 'border-l-red-500'
    if (session.final_state === 'DONE') return 'border-l-green-500'
    return 'border-l-yellow-500'
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => (
        <button
          key={session.session_id}
          onClick={() => onSelect(session.session_id)}
          className={`w-full text-left p-3 rounded-lg border border-l-4 ${getStatusColor(session)} ${
            selectedId === session.session_id ? 'bg-muted' : 'hover:bg-muted/50'
          } transition-colors`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(session)}
              <span className="font-mono text-sm truncate max-w-[120px]">
                {session.session_id}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(session.last_message_at), { addSuffix: true, locale: dateLocale })}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {session.message_count}
            </span>
            <span>{session.final_state || 'started'}</span>
            {session.cliente_nome && (
              <span className="truncate">{session.cliente_nome}</span>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}

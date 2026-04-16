// app/(admin)/admin/chat-logs/components/SessionList.tsx
'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR, enUS } from 'date-fns/locale'
import { CheckCircle, Clock, AlertTriangle, MessageSquare, Eye, Download, Copy, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SessionSummary } from '@/lib/services/chat-logger'

interface Props {
  sessions: SessionSummary[]
  selectedId?: string
  onSelect: (id: string) => void
  locale: string
}

export function SessionList({ sessions, selectedId, onSelect, locale }: Props) {
  const dateLocale = locale === 'pt-BR' ? ptBR : enUS
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copyingId, setCopyingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

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

  const handleDownload = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    if (downloadingId === sessionId) return
    setDownloadingId(sessionId)
    try {
      const res = await fetch(`/api/admin/chat-logs/${sessionId}/export?format=json`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `chat-${sessionId}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      console.error('Failed to download logs')
    } finally {
      setDownloadingId(null)
    }
  }

  const handleCopy = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    if (copyingId === sessionId) return
    setCopyingId(sessionId)
    try {
      const res = await fetch(`/api/admin/chat-logs/${sessionId}/export?format=json`)
      const text = await res.text()
      await navigator.clipboard.writeText(text)
      setCopiedId(sessionId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      console.error('Failed to copy logs')
    } finally {
      setCopyingId(null)
    }
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => (
        <div
          key={session.session_id}
          role="button"
          tabIndex={0}
          aria-pressed={selectedId === session.session_id}
          onClick={() => onSelect(session.session_id)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(session.session_id) }}
          className={`w-full text-left p-3 rounded-lg border border-l-4 cursor-pointer ${getStatusColor(session)} ${
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
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="Ver detalhes"
                onClick={(e) => { e.stopPropagation(); onSelect(session.session_id) }}
              >
                <Eye className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="Download JSON"
                disabled={downloadingId === session.session_id}
                onClick={(e) => handleDownload(e, session.session_id)}
              >
                {downloadingId === session.session_id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="Copiar logs"
                disabled={copyingId === session.session_id}
                onClick={(e) => handleCopy(e, session.session_id)}
              >
                {copyingId === session.session_id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : copiedId === session.session_id ? (
                  <Check className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </Button>
            </div>
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
            <span className="ml-auto text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(session.last_message_at), { addSuffix: true, locale: dateLocale })}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

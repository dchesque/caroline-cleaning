'use client'

import { User, Bot, AlertTriangle, Clock, ChevronLeft, Download } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LogEntry } from '@/lib/services/chat-logger'
import { LlmCallsPanel } from './LlmCallsPanel'
import { ContextViewer } from './ContextViewer'

interface Props {
  sessionId: string
  session: {
    cliente_id?: string
    cliente_nome?: string
    final_state: string
  }
  messages: LogEntry[]
}

export function SessionDetail({ sessionId, session, messages }: Props) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/chat-logs">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
          </Link>
          <div>
            <h2 className="font-mono text-lg">{sessionId}</h2>
            <div className="text-sm text-muted-foreground">
              {session.cliente_nome && <span>{session.cliente_nome} • </span>}
              Estado: <span className="font-mono">{session.final_state || 'started'}</span>
            </div>
          </div>
        </div>
        <Link href={`/api/admin/chat-logs/${sessionId}/export?format=json`}>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </Link>
      </div>

      {/* Messages */}
      <div className="space-y-4">
        {messages.map((msg) => (
          <Card key={msg.id} className={msg.direction === 'user' ? 'bg-blue-50/50' : ''}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${msg.direction === 'user' ? 'bg-blue-100' : 'bg-green-100'}`}>
                  {msg.direction === 'user' ? (
                    <User className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Bot className="w-4 h-4 text-green-600" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{msg.direction === 'user' ? 'Usuário' : 'Carol'}</span>
                    {msg.state_after && (
                      <span className="font-mono bg-muted px-1 rounded">
                        {msg.state_before || 'START'} → {msg.state_after}
                      </span>
                    )}
                    {msg.response_time_ms > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {msg.response_time_ms}ms
                      </span>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.message_content}</p>

                  {/* Errors */}
                  {msg.errors && msg.errors.length > 0 && (
                    <div className="space-y-1">
                      {msg.errors.map((err, i) => (
                        <div key={i} className={`text-xs p-2 rounded flex items-center gap-2 ${
                          err.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          <AlertTriangle className="w-3 h-3" />
                          {err.message}
                          {err.state && <span className="font-mono">({err.state})</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* LLM Calls */}
                  {msg.llm_calls && msg.llm_calls.length > 0 && (
                    <LlmCallsPanel calls={msg.llm_calls} />
                  )}

                  {/* Extracted Data */}
                  {msg.extracted_data && Object.keys(msg.extracted_data).length > 0 && (
                    <ContextViewer data={msg.extracted_data} title="Dados Extraidos" />
                  )}

                  {/* Handlers Executed */}
                  {msg.handlers_executed && msg.handlers_executed.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {msg.handlers_executed.map((h, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-mono"
                        >
                          {h.handler}
                          <span className="ml-1 text-purple-400">{h.duration_ms}ms</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Context */}
                  {msg.context_snapshot && Object.keys(msg.context_snapshot).length > 0 && (
                    <ContextViewer data={msg.context_snapshot} title="Contexto" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { SessionDetail } from '../components/SessionDetail'
import { LogEntry } from '@/lib/services/chat-logger'

export default function ChatLogDetailPage() {
  const params = useParams()
  const sessionId = params.sessionId as string

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<{
    cliente_id?: string
    cliente_nome?: string
    final_state: string
  }>({ final_state: '' })
  const [messages, setMessages] = useState<LogEntry[]>([])

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const res = await fetch(`/api/admin/chat-logs/${sessionId}`)
        if (!res.ok) throw new Error('Failed to fetch')

        const data = await res.json()
        setSession(data.session)
        setMessages(data.messages)
      } catch (err) {
        setError('Erro ao carregar detalhes da sessão')
        console.error('Failed to fetch session details:', err)
      } finally {
        setIsLoading(false)
      }
    }

    if (sessionId) {
      fetchDetails()
    }
  }, [sessionId])

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center text-muted-foreground">
        Carregando...
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center text-red-500">
        {error}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <SessionDetail
        sessionId={sessionId}
        session={session}
        messages={messages}
      />
    </div>
  )
}

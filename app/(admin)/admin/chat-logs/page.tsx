// app/(admin)/admin/chat-logs/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RefreshCw } from 'lucide-react'
import { SessionList } from './components/SessionList'
import { SessionSummary } from '@/lib/services/chat-logger'

export default function ChatLogsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = 'pt-BR'

  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pagination, setPagination] = useState({ page: 1, total_pages: 0, total_count: 0 })

  // Filters
  const [hasErrors, setHasErrors] = useState(false)
  const [dateRange, setDateRange] = useState('7')

  const fetchSessions = async (page = 1) => {
    setIsLoading(true)
    const from = new Date()
    from.setDate(from.getDate() - parseInt(dateRange))

    const params = new URLSearchParams({
      page: String(page),
      page_size: '20',
      from: from.toISOString(),
      has_errors: String(hasErrors),
    })

    const res = await fetch(`/api/admin/chat-logs?${params}`)
    const data = await res.json()

    setSessions(data.sessions || [])
    setPagination({
      page: data.pagination?.page || 1,
      total_pages: data.pagination?.total_pages || 0,
      total_count: data.pagination?.total_count || 0,
    })
    setIsLoading(false)
  }

  useEffect(() => {
    fetchSessions(1)
  }, [hasErrors, dateRange])

  const handleSelect = (id: string) => {
    setSelectedId(id)
    router.push(`/admin/chat-logs/${id}`)
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-h2 text-foreground">Logs de Conversas</h1>
          <p className="text-muted-foreground">
            Auditoria e debug das conversas da Carol AI
          </p>
        </div>
        <Button variant="outline" onClick={() => fetchSessions(pagination.page)}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="has-errors"
                checked={hasErrors}
                onCheckedChange={(checked) => setHasErrors(checked === true)}
              />
              <label htmlFor="has-errors" className="text-sm">
                Apenas com erros
              </label>
            </div>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Hoje</SelectItem>
                <SelectItem value="7">Ultimos 7 dias</SelectItem>
                <SelectItem value="30">Ultimos 30 dias</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground ml-auto">
              {pagination.total_count} sessoes
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma conversa encontrada
            </div>
          ) : (
            <>
              <SessionList
                sessions={sessions}
                selectedId={selectedId || undefined}
                onSelect={handleSelect}
                locale={locale}
              />

              {pagination.total_pages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    disabled={pagination.page === 1}
                    onClick={() => fetchSessions(pagination.page - 1)}
                  >
                    Anterior
                  </Button>
                  <span className="py-2 px-4 text-sm">
                    {pagination.page} / {pagination.total_pages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={pagination.page >= pagination.total_pages}
                    onClick={() => fetchSessions(pagination.page + 1)}
                  >
                    Proximo
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

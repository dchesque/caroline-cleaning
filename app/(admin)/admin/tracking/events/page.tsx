// app/(admin)/admin/tracking/events/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RefreshCw, CheckCircle2, XCircle, Copy, ChevronDown, ChevronRight } from 'lucide-react'

interface TrackingEvent {
  id: string
  event_name: string
  event_id: string
  ip_address: string | null
  user_agent: string | null
  fbc: string | null
  fbp: string | null
  custom_data: Record<string, unknown> | null
  page_url: string | null
  referrer: string | null
  sent_to_meta: boolean
  meta_http_status: number | null
  meta_fbtrace_id: string | null
  meta_error: string | null
  meta_response: unknown
  meta_attempts: number | null
  created_at: string
  updated_at: string | null
}

interface Stats24h {
  [eventName: string]: { total: number; ok: number }
}

const EVENT_NAMES = ['all', 'Lead', 'Schedule', 'Contact', 'PageView', 'InitiateChat', 'ClickToWhatsApp', 'CompleteRegistration']

export default function TrackingEventsPage() {
  const [events, setEvents] = useState<TrackingEvent[]>([])
  const [stats, setStats] = useState<Stats24h>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [eventName, setEventName] = useState('all')
  const [status, setStatus] = useState('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [pagination, setPagination] = useState({ page: 1, total_pages: 0, total_count: 0 })

  const fetchEvents = useCallback(async (page = 1) => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: '50',
        ...(eventName !== 'all' ? { event_name: eventName } : {}),
        ...(status !== 'all' ? { status } : {}),
      })
      const res = await fetch(`/api/admin/tracking-events?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setEvents(data.events || [])
      setStats(data.stats_24h || {})
      setPagination({
        page: data.pagination?.page || 1,
        total_pages: data.pagination?.total_pages || 0,
        total_count: data.pagination?.total_count || 0,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events')
    } finally {
      setIsLoading(false)
    }
  }, [eventName, status])

  useEffect(() => {
    fetchEvents(1)
  }, [fetchEvents])

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {})
  }

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'medium' })
    } catch {
      return iso
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-heading text-[#5D5D5D]">Tracking Events</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Server-side Meta CAPI delivery status — inspect failures, copy fbtrace_id for Meta support.
          </p>
        </div>
        <Button onClick={() => fetchEvents(pagination.page)} variant="outline" size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats last 24h */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(stats).map(([name, s]) => {
          const pct = s.total > 0 ? Math.round((s.ok / s.total) * 100) : 0
          const unhealthy = s.total > 0 && pct < 80
          return (
            <Card key={name}>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">{name} (24h)</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">{s.ok}/{s.total}</span>
                  <Badge variant={unhealthy ? 'destructive' : 'secondary'} className="text-xs">
                    {pct}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {Object.keys(stats).length === 0 && !isLoading && (
          <Card className="col-span-full">
            <CardContent className="p-4 text-sm text-muted-foreground">No events in the last 24h.</CardContent>
          </Card>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <Select value={eventName} onValueChange={setEventName}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {EVENT_NAMES.map((e) => (
              <SelectItem key={e} value={e}>{e === 'all' ? 'All events' : e}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="ok">Sent to Meta</SelectItem>
            <SelectItem value="failed">Failed / Skipped</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">
          {pagination.total_count} events · page {pagination.page}/{pagination.total_pages || 1}
        </span>
      </div>

      {error && (
        <Card className="border-red-300">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr className="text-left">
                  <th className="p-3 w-8"></th>
                  <th className="p-3">When</th>
                  <th className="p-3">Event</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">HTTP</th>
                  <th className="p-3">fbc</th>
                  <th className="p-3">fbp</th>
                  <th className="p-3">Attempts</th>
                  <th className="p-3">fbtrace_id</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => {
                  const isOpen = expanded.has(e.id)
                  return (
                    <>
                      <tr key={e.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => toggleExpand(e.id)}>
                        <td className="p-3">{isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</td>
                        <td className="p-3 text-xs whitespace-nowrap">{formatTime(e.created_at)}</td>
                        <td className="p-3 font-medium">{e.event_name}</td>
                        <td className="p-3">
                          {e.sent_to_meta ? (
                            <span className="inline-flex items-center gap-1 text-green-700">
                              <CheckCircle2 className="w-4 h-4" /> OK
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-700">
                              <XCircle className="w-4 h-4" /> Failed
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-xs">{e.meta_http_status ?? '—'}</td>
                        <td className="p-3">{e.fbc ? <Badge variant="secondary" className="text-xs">yes</Badge> : '—'}</td>
                        <td className="p-3">{e.fbp ? <Badge variant="secondary" className="text-xs">yes</Badge> : '—'}</td>
                        <td className="p-3 text-xs">{e.meta_attempts ?? 0}</td>
                        <td className="p-3 text-xs font-mono">
                          {e.meta_fbtrace_id ? (
                            <button
                              onClick={(ev) => { ev.stopPropagation(); copyToClipboard(e.meta_fbtrace_id!) }}
                              className="inline-flex items-center gap-1 hover:text-[#C48B7F]"
                              title="Click to copy"
                            >
                              <span className="truncate max-w-[120px] inline-block">{e.meta_fbtrace_id}</span>
                              <Copy className="w-3 h-3" />
                            </button>
                          ) : '—'}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="border-b bg-gray-50/50">
                          <td colSpan={9} className="p-4">
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <div className="font-semibold text-gray-600 mb-1">event_id</div>
                                <div className="font-mono break-all">{e.event_id}</div>
                              </div>
                              <div>
                                <div className="font-semibold text-gray-600 mb-1">page_url</div>
                                <div className="break-all">{e.page_url || '—'}</div>
                              </div>
                              <div>
                                <div className="font-semibold text-gray-600 mb-1">referrer</div>
                                <div className="break-all">{e.referrer || '—'}</div>
                              </div>
                              <div>
                                <div className="font-semibold text-gray-600 mb-1">ip_address (hashed)</div>
                                <div className="font-mono">{e.ip_address || '—'}</div>
                              </div>
                              <div className="col-span-2">
                                <div className="font-semibold text-gray-600 mb-1">user_agent</div>
                                <div className="break-all">{e.user_agent || '—'}</div>
                              </div>
                              {e.meta_error && (
                                <div className="col-span-2">
                                  <div className="font-semibold text-red-700 mb-1">meta_error</div>
                                  <pre className="whitespace-pre-wrap break-all bg-red-50 border border-red-200 p-2 rounded">{e.meta_error}</pre>
                                </div>
                              )}
                              {e.custom_data && Object.keys(e.custom_data).length > 0 && (
                                <div className="col-span-2">
                                  <div className="font-semibold text-gray-600 mb-1">custom_data</div>
                                  <pre className="whitespace-pre-wrap bg-white border p-2 rounded">{JSON.stringify(e.custom_data, null, 2)}</pre>
                                </div>
                              )}
                              {e.meta_response != null && (
                                <div className="col-span-2">
                                  <div className="font-semibold text-gray-600 mb-1">meta_response</div>
                                  <pre className="whitespace-pre-wrap bg-white border p-2 rounded">{JSON.stringify(e.meta_response, null, 2)}</pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
                {events.length === 0 && !isLoading && (
                  <tr><td colSpan={9} className="p-6 text-center text-sm text-muted-foreground">No events found for the selected filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => fetchEvents(pagination.page - 1)}>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled={pagination.page >= pagination.total_pages} onClick={() => fetchEvents(pagination.page + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

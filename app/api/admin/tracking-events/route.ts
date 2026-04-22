// app/api/admin/tracking-events/route.ts
//
// Admin-only listing of tracking_events with Meta CAPI delivery status.
// Exposed so the /admin/tracking page can show which events reached Meta,
// which failed, and why (http status, fbtrace_id, error message).

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!checkRateLimit(getClientIp(req), RATE_LIMITS.admin)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const { searchParams } = new URL(req.url)
    const eventName = searchParams.get('event_name') || undefined
    const statusFilter = searchParams.get('status') || undefined // 'ok' | 'failed' | 'all'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const pageSize = Math.max(1, Math.min(parseInt(searchParams.get('page_size') || '50') || 50, 200))
    const from = searchParams.get('from') || undefined
    const to = searchParams.get('to') || undefined

    // Service role: tracking_events has RLS that blocks anon reads.
    const admin = createAdminClient()

    let q = admin
      .from('tracking_events')
      .select(
        'id, event_name, event_id, ip_address, user_agent, fbc, fbp, custom_data, page_url, referrer, sent_to_meta, meta_http_status, meta_fbtrace_id, meta_error, meta_response, meta_attempts, created_at, updated_at',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })

    if (eventName) q = q.eq('event_name', eventName)
    if (statusFilter === 'ok') q = q.eq('sent_to_meta', true)
    if (statusFilter === 'failed') q = q.eq('sent_to_meta', false)
    if (from) q = q.gte('created_at', from)
    if (to) q = q.lte('created_at', to)

    const fromIdx = (page - 1) * pageSize
    const toIdx = fromIdx + pageSize - 1
    const { data, count, error } = await q.range(fromIdx, toIdx)

    if (error) {
      logger.error('tracking-events query failed', { error: error.message })
      return NextResponse.json({ error: 'Query failed' }, { status: 500 })
    }

    // Aggregate counts for the dashboard header (last 24h)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: statsRows } = await admin
      .from('tracking_events')
      .select('event_name, sent_to_meta')
      .gte('created_at', yesterday)

    const stats: Record<string, { total: number; ok: number }> = {}
    for (const r of statsRows || []) {
      const name = (r as { event_name: string }).event_name
      const ok = (r as { sent_to_meta: boolean }).sent_to_meta
      if (!stats[name]) stats[name] = { total: 0, ok: 0 }
      stats[name].total += 1
      if (ok) stats[name].ok += 1
    }

    return NextResponse.json({
      events: data || [],
      pagination: {
        page,
        page_size: pageSize,
        total_count: count || 0,
        total_pages: count ? Math.ceil(count / pageSize) : 0,
      },
      stats_24h: stats,
    })
  } catch (err) {
    logger.error('Error fetching tracking events', { error: err instanceof Error ? err.message : String(err) })
    return NextResponse.json({ error: 'Failed to fetch tracking events' }, { status: 500 })
  }
}

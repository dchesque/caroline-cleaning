// app/api/admin/chat-logs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { chatLogger } from '@/lib/services/chat-logger'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Rate limit AFTER auth so unauth spam hits 401 first and doesn't
    // consume rate-limit slots meant for real admins.
    if (!checkRateLimit(getClientIp(req), RATE_LIMITS.admin)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const { searchParams } = new URL(req.url)
    const params = {
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
      cliente_id: searchParams.get('cliente_id') || undefined,
      state: searchParams.get('state') || undefined,
      has_errors: searchParams.get('has_errors') === 'true',
      page: parseInt(searchParams.get('page') || '1'),
      page_size: Math.max(1, Math.min(parseInt(searchParams.get('page_size') || '20') || 20, 100)),
    }

    const result = await chatLogger.getSessions(params)
    return NextResponse.json(result)
  } catch (error) {
    logger.error('Error fetching chat logs', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Failed to fetch chat logs' }, { status: 500 })
  }
}

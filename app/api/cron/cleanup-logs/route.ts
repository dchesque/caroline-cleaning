// app/api/cron/cleanup-logs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { timingSafeEqual } from 'crypto'

export async function GET(req: NextRequest) {
  // Auth check with timing-safe comparison
  const authHeader = req.headers.get('authorization') || ''
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('CRON_SECRET not configured')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Timing-safe comparison
  const expectedAuth = `Bearer ${cronSecret}`
  if (
    authHeader.length !== expectedAuth.length ||
    !timingSafeEqual(Buffer.from(authHeader), Buffer.from(expectedAuth))
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Delete logs older than 30 days
  const { data, error } = await supabase
    .from('chat_logs')
    .delete()
    .lt('created_at', `now() - interval '30 days'`)
    .select('id')

  if (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    deleted: data?.length || 0,
    timestamp: new Date().toISOString(),
  })
}

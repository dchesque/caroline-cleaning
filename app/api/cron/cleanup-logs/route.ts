// app/api/cron/cleanup-logs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  // Auth check
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
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

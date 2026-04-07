// app/api/admin/chat-logs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { chatLogger } from '@/lib/services/chat-logger'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const params = {
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
      cliente_id: searchParams.get('cliente_id') || undefined,
      state: searchParams.get('state') || undefined,
      has_errors: searchParams.get('has_errors') === 'true',
      page: parseInt(searchParams.get('page') || '1'),
      page_size: parseInt(searchParams.get('page_size') || '20'),
    }

    const result = await chatLogger.getSessions(params)
    return NextResponse.json(result)
  } catch (error) {
    logger.error('Error fetching chat logs', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Failed to fetch chat logs' }, { status: 500 })
  }
}

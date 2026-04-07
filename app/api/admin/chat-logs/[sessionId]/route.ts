// app/api/admin/chat-logs/[sessionId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { chatLogger } from '@/lib/services/chat-logger'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId } = await params
    const result = await chatLogger.getSessionDetails(sessionId)
    return NextResponse.json(result)
  } catch (error) {
    logger.error('Error fetching session details', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Failed to fetch session details' }, { status: 500 })
  }
}

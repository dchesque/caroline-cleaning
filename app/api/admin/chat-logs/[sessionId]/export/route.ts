// app/api/admin/chat-logs/[sessionId]/export/route.ts
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

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { sessionId } = await params
    const { searchParams } = new URL(req.url)
    const formatParam = searchParams.get('format') || 'json';
    if (formatParam !== 'json' && formatParam !== 'csv') {
      return NextResponse.json({ error: 'Invalid format. Use json or csv.' }, { status: 400 });
    }
    const format = formatParam as 'json' | 'csv'

    const content = await chatLogger.exportSession(sessionId, format)
    const filename = `chat-${sessionId}.${format}`

    return new NextResponse(content, {
      headers: {
        'Content-Type': format === 'json' ? 'application/json' : 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    logger.error('Error exporting session', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Failed to export session' }, { status: 500 })
  }
}

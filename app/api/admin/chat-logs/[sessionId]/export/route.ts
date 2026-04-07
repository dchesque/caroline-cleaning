// app/api/admin/chat-logs/[sessionId]/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { chatLogger } from '@/lib/services/chat-logger'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const { searchParams } = new URL(req.url)
    const format = (searchParams.get('format') || 'json') as 'json' | 'csv'

    const content = await chatLogger.exportSession(sessionId, format)
    const filename = `chat-${sessionId}.${format}`

    return new NextResponse(content, {
      headers: {
        'Content-Type': format === 'json' ? 'application/json' : 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting session:', error)
    return NextResponse.json({ error: 'Failed to export session' }, { status: 500 })
  }
}

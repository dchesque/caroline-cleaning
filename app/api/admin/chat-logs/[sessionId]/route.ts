// app/api/admin/chat-logs/[sessionId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { chatLogger } from '@/lib/services/chat-logger'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const result = await chatLogger.getSessionDetails(sessionId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching session details:', error)
    return NextResponse.json({ error: 'Failed to fetch session details' }, { status: 500 })
  }
}

// app/api/admin/chat-logs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { chatLogger } from '@/lib/services/chat-logger'

export async function GET(req: NextRequest) {
  try {
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
    console.error('Error fetching chat logs:', error)
    return NextResponse.json({ error: 'Failed to fetch chat logs' }, { status: 500 })
  }
}

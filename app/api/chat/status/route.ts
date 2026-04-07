import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Session IDs use nanoid(16) which provides ~85 bits of entropy,
// making them effectively unguessable (comparable to UUIDv4).
// Rate limiting below serves as an additional practical guard against enumeration.

// NOTE: In-memory rate limiter — best-effort in serverless (resets on cold start).
const statusRateLimitMap = new Map<string, { count: number; timestamp: number }>()
const STATUS_RATE_LIMIT = 60 // requests per minute per IP
const STATUS_RATE_WINDOW_MS = 60_000

function checkStatusRateLimit(ip: string): boolean {
    const now = Date.now()
    const record = statusRateLimitMap.get(ip)

    if (!record || now - record.timestamp > STATUS_RATE_WINDOW_MS) {
        statusRateLimitMap.set(ip, { count: 1, timestamp: now })
        return true
    }

    if (record.count >= STATUS_RATE_LIMIT) {
        return false
    }

    record.count++
    return true
}

export async function GET(request: NextRequest) {
    try {
        // Rate limit: 60 requests per minute per IP
        const ip = request.headers.get('x-forwarded-for') || 'unknown'
        if (!checkStatusRateLimit(ip)) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
        }

        const { searchParams } = new URL(request.url)
        const sessionId = searchParams.get('sessionId')

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
        }

        const supabase = await createClient()

        // Buscar a última mensagem dessa sessão
        const { data: lastMessage, error } = await supabase
            .from('mensagens_chat')
            .select('id, role, content, created_at')
            .eq('session_id', sessionId)
            .eq('role', 'assistant')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            return NextResponse.json({ error: 'Database error' }, { status: 500 })
        }

        if (!lastMessage) {
            return NextResponse.json({ hasNewMessage: false })
        }

        // Verificar se a mensagem é recente (ex: últimos 10 segundos)
        // Para simplificar, vou retornar se é assistant. O frontend filtra id duplicado se já tiver.
        // O ideal seria passar o lastMessageId conhecido pelo front, mas o hook não manda.
        // Vamos apenas retornar a última msg assistant.

        return NextResponse.json({
            hasNewMessage: true,
            message: {
                id: lastMessage.id,
                content: lastMessage.content,
                created_at: lastMessage.created_at
            }
        })

    } catch (error) {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit'

// Session IDs use nanoid(16) which provides ~85 bits of entropy,
// making them effectively unguessable (comparable to UUIDv4).
// Rate limiting below serves as an additional practical guard against enumeration.

export async function GET(request: NextRequest) {
    try {
        const ip = getClientIp(request)
        if (!checkRateLimit(ip, RATE_LIMITS.api)) {
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

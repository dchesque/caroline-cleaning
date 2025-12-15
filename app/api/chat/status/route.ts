import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
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

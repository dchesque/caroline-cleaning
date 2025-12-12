import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { message, sessionId } = await request.json()

        if (!message || !sessionId) {
            return NextResponse.json(
                { error: 'Message and sessionId are required' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // 1. Save User Message
        const { error: insertUserError } = await supabase
            .from('mensagens_chat')
            .insert({
                session_id: sessionId,
                role: 'user',
                content: message,
            })

        if (insertUserError) {
            console.error('Error saving user message:', insertUserError)
            return NextResponse.json(
                { error: 'Failed to save message' },
                { status: 500 }
            )
        }

        // 2. Simulate AI Response (Mock for Phase 3)
        // In Phase 6, we will call n8n webhook here
        let replyContent = "I'm Carol, your virtual assistant. How can I help you schedule a cleaning today?"

        // Simple mock logic for better demo experience
        const lowerMsg = message.toLowerCase()
        if (lowerMsg.includes('price') || lowerMsg.includes('cost')) {
            replyContent = "Our pricing depends on the size of your home and the type of cleaning. Would you like a free estimate?"
        } else if (lowerMsg.includes('schedule') || lowerMsg.includes('book')) {
            replyContent = "I can help you with that! fully online. What implies the best time for a quick visit?"
        } else if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
            replyContent = "Hello! I'm Carol. Ready to make your home sparkle?"
        }

        // 3. Save Assistant Message
        const { error: insertAiError } = await supabase
            .from('mensagens_chat')
            .insert({
                session_id: sessionId,
                role: 'assistant',
                content: replyContent,
            })

        if (insertAiError) {
            console.error('Error saving AI message:', insertAiError)
        }

        return NextResponse.json({ reply: replyContent })
    } catch (error) {
        console.error('Chat API Error:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface ResponsePayload {
    session_id: string
    message: string
    source: 'website' | 'whatsapp'
    phone?: string  // Para WhatsApp
    metadata?: Record<string, any>
}

export async function POST(request: NextRequest) {
    try {
        const payload: ResponsePayload = await request.json()
        const supabase = await createClient()

        const { session_id, message, source, phone, metadata } = payload

        // Salvar resposta no banco
        const { data: savedMessage, error } = await supabase
            .from('mensagens_chat')
            .insert({
                session_id,
                role: 'assistant',
                content: message,
                source,
                metadata,
            })
            .select()
            .single()

        if (error) {
            console.error('Error saving response:', error)
            return NextResponse.json({ error: 'Failed to save response' }, { status: 500 })
        }

        // Se for WhatsApp, enviar via Evolution API
        if (source === 'whatsapp' && phone) {
            await sendWhatsAppMessage(phone, message)
        }

        return NextResponse.json({
            success: true,
            message_id: savedMessage.id
        })

    } catch (error) {
        console.error('[Response Webhook] Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

async function sendWhatsAppMessage(phone: string, message: string) {
    const evolutionUrl = process.env.EVOLUTION_API_URL
    const evolutionKey = process.env.EVOLUTION_API_KEY
    const instance = process.env.EVOLUTION_INSTANCE || 'caroline'

    if (!evolutionUrl || !evolutionKey) {
        console.warn('Evolution API not configured')
        return
    }

    try {
        await fetch(`${evolutionUrl}/message/sendText/${instance}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': evolutionKey,
            },
            body: JSON.stringify({
                number: phone,
                text: message,
            }),
        })
    } catch (error) {
        console.error('Error sending WhatsApp message:', error)
    }
}

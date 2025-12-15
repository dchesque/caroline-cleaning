import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface EvolutionWebhookPayload {
    event: string
    instance: string
    data: {
        key: {
            remoteJid: string
            fromMe: boolean
            id: string
        }
        pushName?: string
        message?: {
            conversation?: string
            extendedTextMessage?: {
                text: string
            }
        }
        messageType: string
        messageTimestamp: number
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload: EvolutionWebhookPayload = await request.json()
        const supabase = await createClient()

        console.log('[WhatsApp Webhook]', payload.event, payload.data?.key?.remoteJid)

        // Apenas processar mensagens recebidas (não enviadas por nós)
        if (payload.event !== 'messages.upsert' || payload.data?.key?.fromMe) {
            return NextResponse.json({ success: true, action: 'ignored' })
        }

        // Extrair informações
        const phone = payload.data.key.remoteJid.replace('@s.whatsapp.net', '')
        const messageContent =
            payload.data.message?.conversation ||
            payload.data.message?.extendedTextMessage?.text || ''
        const senderName = payload.data.pushName || 'WhatsApp User'

        // Gerar session_id baseado no telefone
        const sessionId = `whatsapp_${phone}`

        // Salvar mensagem no banco
        const { data: savedMessage, error } = await supabase
            .from('mensagens_chat')
            .insert({
                session_id: sessionId,
                role: 'user',
                content: messageContent,
                source: 'whatsapp',
                // lead_info removed as it doesn't match schema directly, handled differently or mapped if needed
                // Assuming metadata or mapped columns. But schema update showed 'lead_info' wasn't added explicitly
                // Looking at Prompt code: `lead_info: contact || null` in 2.1, but in 2.2 it uses `lead_info: {nome, telefone}` 
                // My previous migration did NOT add lead_info column because it wasn't in provided schema in 3.6 or update list.
                // I will use metadata for now to store this info to be safe.
                metadata: {
                    whatsapp_message_id: payload.data.key.id,
                    timestamp: payload.data.messageTimestamp,
                    sender_name: senderName,
                    sender_phone: phone
                },
            })
            .select()
            .single()

        if (error) {
            console.error('Error saving WhatsApp message:', error)
            return NextResponse.json({ error: 'Failed to save message' }, { status: 500 })
        }

        // Disparar processamento no n8n
        await triggerN8nWorkflow({
            event: 'whatsapp.message.received',
            session_id: sessionId,
            message_id: savedMessage.id,
            phone,
            name: senderName,
            content: messageContent,
        })

        return NextResponse.json({
            success: true,
            message_id: savedMessage.id,
            session_id: sessionId
        })

    } catch (error) {
        console.error('[WhatsApp Webhook] Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// Função para disparar workflow no n8n
async function triggerN8nWorkflow(data: any) {
    const n8nWebhookUrl = process.env.N8N_TRIGGER_WEBHOOK_URL

    if (!n8nWebhookUrl) {
        console.warn('N8N_TRIGGER_WEBHOOK_URL not configured')
        return
    }

    try {
        await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-webhook-secret': process.env.N8N_WEBHOOK_SECRET || '',
            },
            body: JSON.stringify(data),
        })
    } catch (error) {
        console.error('Error triggering n8n workflow:', error)
    }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { timingSafeEqual } from 'crypto'
import { logger } from '@/lib/logger'

// ============================================
// TIPOS DE EVENTOS RECEBIDOS DO N8N
// ============================================

type IncomingEventType =
    | 'chat.response'           // Resposta da Carol para o chat
    | 'notification.dashboard'  // Notificação para o dashboard
    | 'client.update'           // Atualizar dados de cliente
    | 'appointment.update'      // Atualizar agendamento

interface IncomingWebhookPayload {
    event: IncomingEventType
    timestamp: string
    data: Record<string, any>
}

// ============================================
// VERIFICAÇÃO DE AUTENTICAÇÃO
// ============================================

const webhookSecret = process.env.N8N_WEBHOOK_SECRET

function verifyAuth(request: NextRequest): boolean {
    const secret = request.headers.get('x-webhook-secret') || ''
    const timestamp = request.headers.get('x-webhook-timestamp') || ''

    if (!secret || !webhookSecret) return false

    // Timing-safe secret comparison
    const secretBuffer = Buffer.from(secret)
    const expectedBuffer = Buffer.from(webhookSecret)
    if (secretBuffer.length !== expectedBuffer.length) return false
    if (!timingSafeEqual(secretBuffer, expectedBuffer)) return false

    // Replay protection: reject requests older than 5 minutes
    if (timestamp) {
        const requestTime = new Date(timestamp).getTime()
        const now = Date.now()
        if (isNaN(requestTime) || Math.abs(now - requestTime) > 5 * 60 * 1000) {
            console.warn('[webhook/n8n] Request rejected: timestamp outside window')
            return false
        }
    }

    return true
}

// ============================================
// HANDLER PRINCIPAL
// ============================================

export async function POST(request: NextRequest) {
    try {
        // Verificar autenticação
        if (!verifyAuth(request)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const payload: IncomingWebhookPayload = await request.json()
        const supabase = await createClient()

        logger.info(`[Webhook N8N] Evento recebido: ${payload.event}`)

        // Rotear para handler apropriado
        switch (payload.event) {
            case 'chat.response':
                return await handleChatResponse(supabase, payload.data)

            case 'notification.dashboard':
                return await handleDashboardNotification(supabase, payload.data)

            case 'client.update':
                return await handleClientUpdate(supabase, payload.data)

            case 'appointment.update':
                return await handleAppointmentUpdate(supabase, payload.data)

            default:
                logger.warn(`[Webhook N8N] Evento desconhecido: ${payload.event}`)
                return NextResponse.json({ error: 'Unknown event' }, { status: 400 })
        }

    } catch (error) {
        logger.error('[Webhook N8N] Erro', { error: error instanceof Error ? error.message : String(error) })
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// ============================================
// HANDLERS
// ============================================

async function handleChatResponse(supabase: any, data: any) {
    const { session_id, message, metadata } = data

    if (!session_id || !message) {
        return NextResponse.json(
            { error: 'session_id and message are required' },
            { status: 400 }
        )
    }

    // Salvar resposta da Carol no banco
    const { data: savedMessage, error } = await supabase
        .from('mensagens_chat')
        .insert({
            session_id,
            role: 'assistant',
            content: message,
            source: 'website',
            intent_detected: metadata?.intent,
            intent_confidence: metadata?.confidence,
            metadata,
        })
        .select()
        .single()

    if (error) {
        logger.error('[Webhook N8N] Erro ao salvar mensagem', { error: error instanceof Error ? error.message : String(error) })
        return NextResponse.json({ error: 'Failed to save message' }, { status: 500 })
    }

    // Atualizar sessão
    await supabase
        .from('chat_sessions')
        .upsert({
            id: session_id,
            last_activity: new Date().toISOString(),
            last_intent: metadata?.intent,
            status: 'active'
        })

    return NextResponse.json({
        success: true,
        message_id: savedMessage.id,
        action: 'chat_response_saved'
    })
}

async function handleDashboardNotification(supabase: any, data: any) {
    const { type, title, message, priority } = data

    // Salvar notificação (se você tiver uma tabela de notificações)
    // Por enquanto, apenas loga
    logger.info(`[Notification] ${type}: ${title} - ${message}`)

    return NextResponse.json({ success: true })
}

const ALLOWED_CLIENT_FIELDS = ['nome', 'email', 'telefone', 'endereco', 'notas']
const ALLOWED_APPOINTMENT_FIELDS = ['status', 'data_hora', 'notas', 'servico_id']

async function handleClientUpdate(supabase: any, data: any) {
    const { client_id, updates } = data

    if (!client_id || !updates) {
        return NextResponse.json(
            { error: 'client_id and updates are required' },
            { status: 400 }
        )
    }

    // Only allow known fields to be updated
    const sanitizedUpdates: Record<string, any> = {}
    for (const key of Object.keys(updates)) {
        if (ALLOWED_CLIENT_FIELDS.includes(key)) {
            sanitizedUpdates[key] = updates[key]
        }
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
        return NextResponse.json(
            { error: 'No valid fields to update' },
            { status: 400 }
        )
    }

    const { error } = await supabase
        .from('clientes')
        .update(sanitizedUpdates)
        .eq('id', client_id)

    if (error) {
        logger.error('[Webhook N8N] Erro ao atualizar cliente', { error: error instanceof Error ? error.message : String(error) })
        return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}

async function handleAppointmentUpdate(supabase: any, data: any) {
    const { appointment_id, updates } = data

    if (!appointment_id || !updates) {
        return NextResponse.json(
            { error: 'appointment_id and updates are required' },
            { status: 400 }
        )
    }

    // Only allow known fields to be updated
    const sanitizedUpdates: Record<string, any> = {}
    for (const key of Object.keys(updates)) {
        if (ALLOWED_APPOINTMENT_FIELDS.includes(key)) {
            sanitizedUpdates[key] = updates[key]
        }
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
        return NextResponse.json(
            { error: 'No valid fields to update' },
            { status: 400 }
        )
    }

    const { error } = await supabase
        .from('agendamentos')
        .update(sanitizedUpdates)
        .eq('id', appointment_id)

    if (error) {
        logger.error('[Webhook N8N] Erro ao atualizar agendamento', { error: error instanceof Error ? error.message : String(error) })
        return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}

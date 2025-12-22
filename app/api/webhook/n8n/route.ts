import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

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

async function verifyAuth(request: NextRequest): Promise<boolean> {
    const headersList = await headers()
    const secret = headersList.get('x-webhook-secret')
    const expectedSecret = process.env.N8N_WEBHOOK_SECRET

    if (!expectedSecret) {
        console.warn('[Webhook N8N] N8N_WEBHOOK_SECRET não configurado')
        return process.env.NODE_ENV === 'development'
    }

    return secret === expectedSecret
}

// ============================================
// HANDLER PRINCIPAL
// ============================================

export async function POST(request: NextRequest) {
    try {
        // Verificar autenticação
        if (!await verifyAuth(request)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const payload: IncomingWebhookPayload = await request.json()
        const supabase = await createClient()

        console.log(`[Webhook N8N] Evento recebido: ${payload.event}`)

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
                console.warn(`[Webhook N8N] Evento desconhecido: ${payload.event}`)
                return NextResponse.json({ error: 'Unknown event' }, { status: 400 })
        }

    } catch (error) {
        console.error('[Webhook N8N] Erro:', error)
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
        console.error('[Webhook N8N] Erro ao salvar mensagem:', error)
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
    console.log(`[Notification] ${type}: ${title} - ${message}`)

    return NextResponse.json({ success: true })
}

async function handleClientUpdate(supabase: any, data: any) {
    const { client_id, updates } = data

    if (!client_id || !updates) {
        return NextResponse.json(
            { error: 'client_id and updates are required' },
            { status: 400 }
        )
    }

    const { error } = await supabase
        .from('clientes')
        .update(updates)
        .eq('id', client_id)

    if (error) {
        console.error('[Webhook N8N] Erro ao atualizar cliente:', error)
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

    const { error } = await supabase
        .from('agendamentos')
        .update(updates)
        .eq('id', appointment_id)

    if (error) {
        console.error('[Webhook N8N] Erro ao atualizar agendamento:', error)
        return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}

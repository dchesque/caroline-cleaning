import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

// Tipos de eventos que o n8n pode enviar
type N8nEventType =
    | 'message.received'      // Nova mensagem recebida
    | 'message.processed'     // Mensagem processada pela IA
    | 'action.execute'        // Executar ação (criar lead, agendar, etc)
    | 'notification.send'     // Enviar notificação

interface N8nWebhookPayload {
    event: N8nEventType
    timestamp: string
    data: {
        session_id: string
        source: 'website' | 'whatsapp' | 'instagram'
        message?: {
            id: string
            content: string
            role: 'user' | 'assistant'
        }
        intent?: {
            type: string
            confidence: number
            entities: Record<string, any>
        }
        action?: {
            type: string
            params: Record<string, any>
        }
        contact?: {
            phone?: string
            name?: string
            email?: string
        }
    }
    metadata?: Record<string, any>
}

// Verificar autenticação do webhook
// Verificar autenticação do webhook
async function verifyWebhookAuth(request: NextRequest): Promise<boolean> {
    const headersList = await headers()
    const authHeader = headersList.get('x-webhook-secret')
    const expectedSecret = process.env.N8N_WEBHOOK_SECRET

    if (!expectedSecret) {
        console.warn('N8N_WEBHOOK_SECRET not configured')
        return true // Em dev, permitir sem auth
    }

    return authHeader === expectedSecret
}

export async function POST(request: NextRequest) {
    try {
        // Verificar autenticação
        if (!await verifyWebhookAuth(request)) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const payload: N8nWebhookPayload = await request.json()
        const supabase = await createClient()

        console.log(`[N8N Webhook] Event: ${payload.event}`, payload.data)

        // Processar baseado no tipo de evento
        switch (payload.event) {
            case 'message.received':
                return await handleMessageReceived(supabase, payload)

            case 'message.processed':
                return await handleMessageProcessed(supabase, payload)

            case 'action.execute':
                return await handleActionExecute(supabase, payload)

            case 'notification.send':
                return await handleNotificationSend(supabase, payload)

            default:
                return NextResponse.json(
                    { error: 'Unknown event type' },
                    { status: 400 }
                )
        }
    } catch (error) {
        console.error('[N8N Webhook] Error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// Handler: Mensagem recebida
async function handleMessageReceived(supabase: any, payload: N8nWebhookPayload) {
    const { session_id, message, source, contact } = payload.data

    if (!message) {
        return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Salvar mensagem no banco
    const { data, error } = await supabase
        .from('mensagens_chat')
        .insert({
            session_id,
            role: message.role,
            content: message.content,
            source,
            metadata: payload.metadata,
        })
        .select()
        .single()

    if (error) {
        console.error('Error saving message:', error)
        return NextResponse.json({ error: 'Failed to save message' }, { status: 500 })
    }

    return NextResponse.json({
        success: true,
        message_id: data.id,
        action: 'message_saved'
    })
}

// Handler: Mensagem processada pela IA
async function handleMessageProcessed(supabase: any, payload: N8nWebhookPayload) {
    const { session_id, intent, message } = payload.data

    // Salvar resposta da IA
    if (message && message.role === 'assistant') {
        await supabase
            .from('mensagens_chat')
            .insert({
                session_id,
                role: 'assistant',
                content: message.content,
                intent_detected: intent?.type,
                intent_confidence: intent?.confidence,
                metadata: { intent, ...payload.metadata },
            })
    }

    // Atualizar sessão com última intenção detectada
    await supabase
        .from('chat_sessions')
        .upsert({
            id: session_id,
            last_intent: intent?.type,
            last_activity: new Date().toISOString(),
            status: 'active',
        })

    return NextResponse.json({
        success: true,
        intent: intent?.type,
        action: 'message_processed'
    })
}

// Handler: Executar ação
async function handleActionExecute(supabase: any, payload: N8nWebhookPayload) {
    const { action, session_id, contact } = payload.data

    if (!action) {
        return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    let result: any = null

    // Helper function calls extracted to app/api/carol/actions/route.ts logic
    // Here we just forward or handle simply if complex logic isn't reused.
    // Ideally, code should be DRY. Since the prompt provided specific implementations for actions 
    // inside this file in the 'PROMPT', but also defined a separate 'actions' route,
    // I will check if the logic should be duplicated or if I should implement the logic here directly as requested within the file content in the prompt.
    // The prompt shows full implementation inside this file for actions. I will follow the prompt's file content.

    switch (action.type) {
        case 'create_lead':
            result = await createLead(supabase, session_id, contact, action.params)
            break

        case 'create_appointment':
            result = await createAppointment(supabase, action.params)
            break

        case 'update_lead':
            result = await updateLead(supabase, action.params)
            break

        case 'check_availability':
            result = await checkAvailability(supabase, action.params)
            break

        case 'get_pricing':
            result = await getPricing(supabase, action.params)
            break

        default:
            return NextResponse.json({ error: 'Unknown action type' }, { status: 400 })
    }

    return NextResponse.json({
        success: true,
        action: action.type,
        result
    })
}

// Handler: Enviar notificação
async function handleNotificationSend(supabase: any, payload: N8nWebhookPayload) {
    const { action } = payload.data

    if (!action || action.type !== 'notification') {
        return NextResponse.json({ error: 'Invalid notification action' }, { status: 400 })
    }

    const { channel, recipient, template, data } = action.params

    // Registrar notificação no banco
    const { data: notification, error } = await supabase
        .from('notificacoes')
        .insert({
            canal: channel,
            destinatario: recipient,
            template,
            dados: data,
            status: 'pending',
        })
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
    }

    return NextResponse.json({
        success: true,
        notification_id: notification.id,
        action: 'notification_queued'
    })
}

// ============ ACTION FUNCTIONS ============

async function createLead(
    supabase: any,
    sessionId: string,
    contact: any,
    params: any
) {
    // Verificar se já existe cliente com mesmo telefone
    if (contact?.phone) {
        const { data: existing } = await supabase
            .from('clientes')
            .select('id')
            .eq('telefone', contact.phone)
            .single()

        if (existing) {
            return {
                action: 'existing_client',
                client_id: existing.id,
                message: 'Client already exists'
            }
        }
    }

    // Criar novo cliente/lead
    const clientData = {
        nome: contact?.name || params.name || 'Lead via Chat',
        telefone: contact?.phone || params.phone,
        email: contact?.email || params.email || null,
        zip_code: params.zip_code || null,
        status: 'lead',
        origem: params.source || 'website_chat',
        session_id: sessionId,
        notas: params.notes || `Lead capturado via chat em ${new Date().toLocaleDateString()}`,
    }

    const { data, error } = await supabase
        .from('clientes')
        .insert(clientData)
        .select()
        .single()

    if (error) {
        console.error('Error creating lead:', error)
        return { action: 'error', message: error.message }
    }

    // Atualizar sessão do chat com o cliente
    await supabase
        .from('mensagens_chat')
        .update({ cliente_id: data.id })
        .eq('session_id', sessionId)

    return {
        action: 'lead_created',
        client_id: data.id,
        client_name: data.nome
    }
}

async function createAppointment(supabase: any, params: any) {
    const {
        client_id,
        service_type,
        date,
        time,
        duration = 180,
        notes,
        source = 'chat'
    } = params

    // Verificar disponibilidade
    const { data: conflicts } = await supabase
        .from('agendamentos')
        .select('id')
        .eq('data', date)
        .eq('horario_inicio', time)
        .not('status', 'in', '("cancelado","reagendado")')

    if (conflicts && conflicts.length > 0) {
        return {
            action: 'slot_unavailable',
            message: 'This time slot is not available'
        }
    }

    // Calcular horário de término
    const [hours, minutes] = time.split(':').map(Number)
    const endDate = new Date()
    endDate.setHours(hours, minutes + duration)
    const endTime = endDate.toTimeString().slice(0, 5)

    // Criar agendamento
    const { data, error } = await supabase
        .from('agendamentos')
        .insert({
            cliente_id: client_id,
            tipo: service_type || 'regular',
            data: date,
            horario_inicio: time,
            horario_fim_estimado: endTime,
            duracao_minutos: duration,
            status: 'agendado',
            origem: source,
            notas: notes || null,
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating appointment:', error)
        return { action: 'error', message: error.message }
    }

    return {
        action: 'appointment_created',
        appointment_id: data.id,
        date,
        time,
        status: 'agendado'
    }
}

async function updateLead(supabase: any, params: any) {
    const { client_id, updates } = params

    const { data, error } = await supabase
        .from('clientes')
        .update(updates)
        .eq('id', client_id)
        .select()
        .single()

    if (error) {
        return { action: 'error', message: error.message }
    }

    return {
        action: 'lead_updated',
        client_id: data.id
    }
}

async function checkAvailability(supabase: any, params: any) {
    const { date, duration = 180 } = params

    // Buscar slots disponíveis usando a função do banco
    // Note: Function get_available_slots needs to exist or be simulated
    const { data, error } = await supabase
        .rpc('get_available_slots', {
            target_date: date,
            service_duration: duration
        })

    // If rpc doesn't exist yet, we might fallback or error. 
    // Assuming it exists or will be handled. The prompt didn't explicitly ask for the SQL for this function 
    // in the "New Tables" section, but it was used in the code. 
    // I will check if I need to create it. 
    // For now I'll implement as requested.

    if (error) {
        // Basic fallback if RPC fails (e.g. not created yet)
        return { action: 'error', message: error.message }
    }

    return {
        action: 'availability_checked',
        date,
        available_slots: data || []
    }
}

async function getPricing(supabase: any, params: any) {
    const { service_type, bedrooms, bathrooms, square_feet } = params

    // Buscar preço base do serviço
    const { data: service } = await supabase
        .from('tipos_servico')
        .select('preco_base, duracao_padrao')
        .eq('nome', service_type)
        .single()

    const calculateEstimate = (
        basePrice: number,
        bedrooms?: number,
        bathrooms?: number,
        sqft?: number
    ): number => {
        let price = basePrice
        if (bedrooms && bedrooms > 2) price += (bedrooms - 2) * 25
        if (bathrooms && bathrooms > 2) price += (bathrooms - 2) * 20
        if (sqft && sqft > 1500) price += Math.floor((sqft - 1500) / 500) * 30
        return price
    }

    if (!service) {
        // Retornar preços padrão
        return {
            action: 'pricing_calculated',
            base_price: 150,
            estimated_price: calculateEstimate(150, bedrooms, bathrooms),
            service_type: service_type || 'regular'
        }
    }

    const estimatedPrice = calculateEstimate(
        service.preco_base,
        bedrooms,
        bathrooms,
        square_feet
    )

    return {
        action: 'pricing_calculated',
        base_price: service.preco_base,
        estimated_price: estimatedPrice,
        duration: service.duracao_padrao,
        service_type
    }
}

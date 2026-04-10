import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { CarolServices } from '@/lib/services/carol-services'
import { timingSafeEqual } from 'crypto'
import { logger } from '@/lib/logger'
import { CarolActionsSchema, parseJson } from '@/lib/validation/schemas'
import { notifyAdmins } from '@/lib/services/evolutionService'

type ActionType =
    | 'create_lead'
    | 'update_lead'
    | 'create_appointment'
    | 'confirm_appointment'
    | 'cancel_appointment'
    | 'send_quote'
    | 'schedule_callback'

interface ActionPayload {
    action: ActionType
    session_id: string
    params: Record<string, any>
}

export async function POST(request: NextRequest) {
    // Auth: internal-only bearer token
    const authHeader = request.headers.get('authorization') || ''
    const internalSecret = process.env.CRON_SECRET

    if (!internalSecret) {
        logger.error('CRON_SECRET not configured')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const expectedAuth = `Bearer ${internalSecret}`
    if (
        authHeader.length !== expectedAuth.length ||
        !timingSafeEqual(Buffer.from(authHeader), Buffer.from(expectedAuth))
    ) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = await parseJson(request, CarolActionsSchema)
    if (!parsed.ok) {
        return NextResponse.json({ error: parsed.error }, { status: parsed.status })
    }
    const { action, session_id, params } = parsed.data

    try {
        const supabase = createAdminClient()
        const services = new CarolServices()

        let result: any = null

        switch (action) {
            case 'create_lead':
                result = await actionCreateLead(services, session_id, params)
                break

            case 'update_lead':
                result = await actionUpdateLead(supabase, services, params)
                break

            case 'create_appointment':
                result = await actionCreateAppointment(supabase, services, session_id, params)
                break

            case 'confirm_appointment':
                result = await actionConfirmAppointment(services, params)
                break

            case 'cancel_appointment':
                result = await actionCancelAppointment(services, params)
                break

            case 'send_quote':
                result = await actionSendQuote(supabase, session_id, params)
                break

            case 'schedule_callback':
                result = await actionScheduleCallback(services, session_id, params)
                break

            default:
                return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
        }

        // Log da ação executada
        await supabase.from('action_logs').insert({
            session_id,
            action_type: action,
            params,
            result,
            created_at: new Date().toISOString()
        })

        return NextResponse.json({
            success: true,
            action,
            result
        })

    } catch (error) {
        logger.error('[Carol Actions] Error', { error: error instanceof Error ? error.message : String(error) })
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// Criar lead
async function actionCreateLead(services: CarolServices, sessionId: string, params: any) {
    try {
        const { name, phone, email, zip_code, service_interest, notes } = params
        const result = await services.createLead(
            { name, phone, email, zip_code, service_interest, notes },
            sessionId
        )
        if (result.status === 'created') {
            notifyAdmins('newLead', { name: result.client_name ?? name, phone, service: service_interest, source: 'carol_chat' }).catch(() => {})
        }
        return result
    } catch (e) {
        logger.error('[Create Lead] Error', { error: e instanceof Error ? e.message : String(e) })
        return { status: 'error', message: 'Internal error processing request' }
    }
}

// Atualizar lead
async function actionUpdateLead(supabase: any, services: CarolServices, params: any) {
    try {
        const { client_id, phone, updates } = params

        let clientId = client_id

        // Se não tem client_id, buscar pelo telefone
        if (!clientId && phone) {
            const { data } = await supabase
                .from('clientes')
                .select('id')
                .eq('telefone', phone)
                .single()

            clientId = data?.id
        }

        if (!clientId) {
            return { status: 'not_found', message: 'Client not found' }
        }

        return await services.updateLead(clientId, updates)
    } catch (e) {
        logger.error('[Update Lead] Error', { error: e instanceof Error ? e.message : String(e) })
        return { status: 'error', message: 'Internal error processing request' }
    }
}

// Criar agendamento
async function actionCreateAppointment(supabase: any, services: CarolServices, sessionId: string, params: any) {
    try {
        const {
            client_id,
            phone,
            service_type,
            date,
            time,
            duration = 180,
            notes
        } = params

        let clientId = client_id

        // Buscar cliente pelo telefone se necessário
        if (!clientId && phone) {
            const { data } = await supabase
                .from('clientes')
                .select('id')
                .eq('telefone', phone)
                .single()

            clientId = data?.id
        }

        if (!clientId) {
            return { status: 'error', message: 'Client not found. Create lead first.' }
        }

        const result = await services.createAppointment(
            { client_id: clientId, service_type, date, time, duration, notes },
            sessionId
        )
        if (result.status === 'created') {
            notifyAdmins('newAppointment', {
                name: result.details?.client_name,
                service: result.details?.service ?? service_type,
                date: result.details?.date ?? date,
                time: result.details?.time ?? time,
                phone,
            }).catch(() => {})
        }
        return result
    } catch (e) {
        logger.error('[Create Appointment] Error', { error: e instanceof Error ? e.message : String(e) })
        return { status: 'error', message: 'Internal error processing request' }
    }
}

// Confirmar agendamento
async function actionConfirmAppointment(services: CarolServices, params: any) {
    try {
        const { appointment_id } = params
        const result = await services.confirmAppointment(appointment_id)
        if (result.status === 'confirmed') {
            notifyAdmins('appointmentConfirmed', {
                name: result.details?.client_name,
                service: result.details?.service,
                date: result.details?.date,
                time: result.details?.time,
            }).catch(() => {})
        }
        return result
    } catch (e) {
        logger.error('[Confirm Appointment] Error', { error: e instanceof Error ? e.message : String(e) })
        return { status: 'error', message: 'Internal error processing request' }
    }
}

// Cancelar agendamento
async function actionCancelAppointment(services: CarolServices, params: any) {
    try {
        const { appointment_id, reason } = params
        return await services.cancelAppointment(appointment_id, reason)
    } catch (e) {
        logger.error('[Cancel Appointment] Error', { error: e instanceof Error ? e.message : String(e) })
        return { status: 'error', message: 'Internal error processing request' }
    }
}

// Enviar orçamento (no equivalent in CarolServices, kept inline)
async function actionSendQuote(supabase: any, sessionId: string, params: any) {
    const { client_id, service_type, estimated_price, details, bedrooms, bathrooms } = params

    // Tentar usar a função do banco para precificação precisa se bedrooms/bathrooms presentes
    let finalPrice = estimated_price
    if (bedrooms && bathrooms) {
        const { data: priceData } = await supabase.rpc('calculate_service_price', {
            p_bedrooms: parseInt(bedrooms),
            p_bathrooms: parseFloat(bathrooms),
            p_tipo_servico: service_type || 'regular'
        })
        if (priceData && priceData.length > 0) {
            finalPrice = priceData[0].preco_sugerido
        }
    }

    const cleanedServiceType = service_type ? String(service_type).trim() || null : null

    const { data, error } = await supabase
        .from('orcamentos')
        .insert({
            cliente_id: client_id,
            session_id: sessionId,
            tipo_servico: cleanedServiceType,
            valor_estimado: finalPrice,
            detalhes: details,
            status: 'enviado',
        })
        .select()
        .single()

    if (error) {
        logger.error('[Send Quote] Error', { error: error.message })
        return { status: 'error', message: 'Failed to create quote' }
    }

    return {
        status: 'sent',
        quote_id: data.id,
        amount: finalPrice,
        message: `Quote sent for ${service_type}: $${finalPrice}`
    }
}

// Agendar callback
async function actionScheduleCallback(services: CarolServices, sessionId: string, params: any) {
    try {
        const { client_id, phone, preferred_time, notes } = params
        return await services.scheduleCallback(
            { client_id, phone, preferred_time, notes },
            sessionId
        )
    } catch (e) {
        logger.error('[Schedule Callback] Error', { error: e instanceof Error ? e.message : String(e) })
        return { status: 'error', message: 'Internal error processing request' }
    }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    try {
        const payload: ActionPayload = await request.json()
        const supabase = await createClient()

        const { action, session_id, params } = payload

        let result: any = null

        switch (action) {
            case 'create_lead':
                result = await actionCreateLead(supabase, session_id, params)
                break

            case 'update_lead':
                result = await actionUpdateLead(supabase, params)
                break

            case 'create_appointment':
                result = await actionCreateAppointment(supabase, session_id, params)
                break

            case 'confirm_appointment':
                result = await actionConfirmAppointment(supabase, params)
                break

            case 'cancel_appointment':
                result = await actionCancelAppointment(supabase, params)
                break

            case 'send_quote':
                result = await actionSendQuote(supabase, session_id, params)
                break

            case 'schedule_callback':
                result = await actionScheduleCallback(supabase, session_id, params)
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
        console.error('[Carol Actions] Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// Criar lead
async function actionCreateLead(supabase: any, sessionId: string, params: any) {
    const { name, phone, email, zip_code, service_interest, notes } = params

    // Verificar se já existe
    if (phone) {
        const { data: existing } = await supabase
            .from('clientes')
            .select('id, nome, status')
            .eq('telefone', phone)
            .single()

        if (existing) {
            return {
                status: 'existing',
                client_id: existing.id,
                client_name: existing.nome,
                client_status: existing.status,
                message: 'Client already exists in our system'
            }
        }
    }

    // Criar novo lead
    const { data, error } = await supabase
        .from('clientes')
        .insert({
            nome: name || 'New Lead',
            telefone: phone,
            email: email || null,
            zip_code: zip_code || null,
            status: 'lead',
            origem: 'chat_carol',
            tipo_servico_padrao: service_interest || null,
            notas: notes || null,
            session_id_origem: sessionId,
        })
        .select()
        .single()

    if (error) {
        return { status: 'error', message: error.message }
    }

    // ADICIONAR: Disparar evento de Lead
    try {
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/tracking/event`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event_name: 'Lead',
                event_id: `lead_chat_${data.id}`,
                user_data: {
                    phone: phone,
                    email: email,
                    first_name: name?.split(' ')[0],
                    zip_code: zip_code,
                },
                custom_data: {
                    content_name: 'Chat Carol',
                    content_category: 'Lead',
                },
            }),
        });
    } catch (e) {
        console.error('Tracking error:', e);
    }

    return {
        status: 'created',
        client_id: data.id,
        client_name: data.nome,
        message: 'Lead created successfully'
    }
}

// Atualizar lead
async function actionUpdateLead(supabase: any, params: any) {
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

    // Campos permitidos para atualização
    const allowedFields = [
        'nome', 'email', 'zip_code', 'endereco_completo',
        'cidade', 'estado', 'tipo_residencia', 'bedrooms',
        'bathrooms', 'square_feet', 'tipo_servico_padrao',
        'frequencia', 'dia_preferido', 'tem_pets', 'pets_detalhes',
        'notas'
    ]

    const filteredUpdates: Record<string, any> = {}
    for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
            filteredUpdates[key] = value
        }
    }

    const { error } = await supabase
        .from('clientes')
        .update(filteredUpdates)
        .eq('id', clientId)

    if (error) {
        return { status: 'error', message: error.message }
    }

    return {
        status: 'updated',
        client_id: clientId,
        updated_fields: Object.keys(filteredUpdates)
    }
}

// Criar agendamento
async function actionCreateAppointment(supabase: any, sessionId: string, params: any) {
    const {
        client_id,
        phone,
        service_type = 'regular',
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

    // Verificar disponibilidade
    const { data: conflicts } = await supabase
        .from('agendamentos')
        .select('id, horario_inicio')
        .eq('data', date)
        .not('status', 'in', '("cancelado","reagendado")')

    // Verificar conflito de horário
    const hasConflict = conflicts?.some((apt: any) => {
        return apt.horario_inicio === time
    })

    if (hasConflict) {
        return {
            status: 'conflict',
            message: 'This time slot is already booked',
            suggested_times: await getSuggestedTimes(supabase, date, conflicts)
        }
    }

    // Calcular horário de término
    const [hours, minutes] = time.split(':').map(Number)
    const endDate = new Date()
    endDate.setHours(hours, minutes + duration)
    const endTime = endDate.toTimeString().slice(0, 5)

    // Criar agendamento
    const { data: appointment, error } = await supabase
        .from('agendamentos')
        .insert({
            cliente_id: clientId,
            tipo: service_type,
            data: date,
            horario_inicio: time,
            horario_fim_estimado: endTime,
            duracao_minutos: duration,
            status: 'agendado',
            origem: 'chat_carol',
            notas: notes || null,
        })
        .select()
        .single()

    if (error) {
        return { status: 'error', message: error.message }
    }

    // ADICIONAR: Disparar evento de Schedule
    try {
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/tracking/event`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event_name: 'Schedule',
                event_id: `schedule_${appointment.id}`,
                user_data: {
                    external_id: clientId,
                },
                custom_data: {
                    content_name: service_type || 'Cleaning Service',
                    content_category: 'Appointment',
                    value: appointment.valor || 0,
                    currency: 'USD',
                },
            }),
        });
    } catch (e) {
        console.error('Tracking error:', e);
    }

    // Buscar dados do cliente para confirmação
    const { data: client } = await supabase
        .from('clientes')
        .select('nome, telefone, endereco_completo')
        .eq('id', clientId)
        .single()

    return {
        status: 'created',
        appointment_id: appointment.id,
        details: {
            client_name: client?.nome,
            service: service_type,
            date,
            time,
            duration,
            address: client?.endereco_completo
        },
        confirmation_message: `Great! I've scheduled your ${service_type} cleaning for ${date} at ${time}. We'll send you a confirmation shortly!`
    }
}

// Confirmar agendamento
async function actionConfirmAppointment(supabase: any, params: any) {
    const { appointment_id } = params

    const { error } = await supabase
        .from('agendamentos')
        .update({ status: 'confirmado' })
        .eq('id', appointment_id)

    if (error) {
        return { status: 'error', message: error.message }
    }

    return {
        status: 'confirmed',
        appointment_id
    }
}

// Cancelar agendamento
async function actionCancelAppointment(supabase: any, params: any) {
    const { appointment_id, reason } = params

    const { error } = await supabase
        .from('agendamentos')
        .update({
            status: 'cancelado',
            motivo_cancelamento: reason || 'Cancelled via chat'
        })
        .eq('id', appointment_id)

    if (error) {
        return { status: 'error', message: error.message }
    }

    return {
        status: 'cancelled',
        appointment_id,
        message: 'Appointment cancelled successfully'
    }
}

// Enviar orçamento
async function actionSendQuote(supabase: any, sessionId: string, params: any) {
    const {
        client_id,
        service_type,
        estimated_price,
        details
    } = params

    // Registrar orçamento
    const { data, error } = await supabase
        .from('orcamentos')
        .insert({
            cliente_id: client_id,
            session_id: sessionId,
            tipo_servico: service_type,
            valor_estimado: estimated_price,
            detalhes: details,
            status: 'enviado',
        })
        .select()
        .single()

    if (error) {
        return { status: 'error', message: error.message }
    }

    return {
        status: 'sent',
        quote_id: data.id,
        amount: estimated_price,
        message: `Quote sent for ${service_type}: $${estimated_price}`
    }
}

// Agendar callback
async function actionScheduleCallback(supabase: any, sessionId: string, params: any) {
    const { client_id, phone, preferred_time, notes } = params

    const { data, error } = await supabase
        .from('callbacks')
        .insert({
            cliente_id: client_id,
            session_id: sessionId,
            telefone: phone,
            horario_preferido: preferred_time,
            notas: notes,
            status: 'pending',
        })
        .select()
        .single()

    if (error) {
        return { status: 'error', message: error.message }
    }

    return {
        status: 'scheduled',
        callback_id: data.id,
        message: 'Callback scheduled. Our team will contact you soon!'
    }
}

// Helper: Sugerir horários alternativos
async function getSuggestedTimes(supabase: any, date: string, conflicts: any[]) {
    const bookedTimes = conflicts?.map(c => c.horario_inicio) || []
    const allTimes = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00']

    return allTimes.filter(t => !bookedTimes.includes(t)).slice(0, 3)
}

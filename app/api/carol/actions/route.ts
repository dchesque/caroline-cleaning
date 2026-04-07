import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { timingSafeEqual } from 'crypto'
import { logger } from '@/lib/logger'

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

    try {
        const payload: ActionPayload = await request.json()

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

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
        logger.error('[Carol Actions] Error', { error: error instanceof Error ? error.message : String(error) })
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

    // 🆕 CONSTRUIR OBJETO APENAS COM CAMPOS QUE TÊM VALOR (LIMPANDO COM cleanValue)
    const insertData: Record<string, any> = {
        nome: cleanValue(name) || 'New Lead',
        telefone: cleanValue(phone),
        status: 'lead',
        origem: 'chat_carol',
        session_id_origem: sessionId,
    }

    // Adicionar campos opcionais apenas se tiverem valor real
    const cleanEmail = cleanValue(email)
    if (cleanEmail) insertData.email = cleanEmail

    const cleanZip = cleanValue(zip_code)
    if (cleanZip) insertData.zip_code = cleanZip

    const cleanNotes = cleanValue(notes)
    if (cleanNotes) insertData.notas = cleanNotes

    const cleanService = cleanValue(service_interest)
    if (cleanService) insertData.tipo_servico_padrao = cleanService

    const { data, error } = await supabase
        .from('clientes')
        .insert(insertData)
        .select()
        .single()

    if (error) {
        logger.error('[Create Lead] Error', { error: error instanceof Error ? error.message : String(error) })
        return { status: 'error', message: 'Internal error processing request' }
    }

    // Disparar evento de Lead
    try {
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/tracking/event`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.CRON_SECRET}`,
            },
            body: JSON.stringify({
                event_name: 'Lead',
                event_id: `lead_chat_${data.id}`,
                user_data: {
                    phone: phone,
                    email: cleanEmail || undefined,
                    first_name: name?.split(' ')[0],
                    zip_code: cleanZip || undefined,
                },
                custom_data: {
                    content_name: 'Chat Carol',
                    content_category: 'Lead',
                },
            }),
        });
    } catch (e) {
        logger.error('Tracking error', { error: e instanceof Error ? e.message : String(e) });
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
        'status', 'notas'
    ]

    const filteredUpdates: Record<string, any> = {}
    for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
            const cleanedValue = cleanValue(value)

            if (cleanedValue !== null) {
                // Conversões de tipo
                if (key === 'tem_pets') {
                    filteredUpdates[key] = cleanedValue.toLowerCase() === 'true' || cleanedValue === 'yes' || cleanedValue === '1'
                } else if (['bedrooms', 'bathrooms', 'square_feet'].includes(key)) {
                    if (isValidNumber(cleanedValue)) {
                        filteredUpdates[key] = Number(cleanedValue)
                    }
                } else {
                    // 🆕 Aceita qualquer string agora que as constraints foram removidas
                    filteredUpdates[key] = cleanedValue
                }
            }
        }
    }

    // Se não tem nada para atualizar, retornar sucesso mesmo assim
    if (Object.keys(filteredUpdates).length === 0) {
        return {
            status: 'updated',
            client_id: clientId,
            updated_fields: [],
            message: 'No fields to update'
        }
    }

    const { error } = await supabase
        .from('clientes')
        .update(filteredUpdates)
        .eq('id', clientId)

    if (error) {
        logger.error('[Update Lead] Error', { error: error instanceof Error ? error.message : String(error) })
        return { status: 'error', message: 'Internal error processing request' }
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

    // VALIDAÇÃO: VERIFICAR SE CLIENTE TEM ENDEREÇO
    const { data: client, error: clientError } = await supabase
        .from('clientes')
        .select('id, nome, telefone, endereco_completo, cidade, zip_code')
        .eq('id', clientId)
        .single()

    if (clientError || !client) {
        return { status: 'error', message: 'Client not found' }
    }

    // CRÍTICO: Verificar se tem endereço completo e ZIP code
    if (!client.endereco_completo || !client.zip_code) {
        return {
            status: 'missing_address',
            message: 'Client address is required to schedule an appointment. Please provide the full address and ZIP code first.',
            client_id: client.id,
            client_name: client.nome,
            required_fields: {
                endereco_completo: !client.endereco_completo,
                zip_code: !client.zip_code
            }
        }
    }

    const cleanServiceType = cleanValue(service_type) || 'regular'

    // Verificar disponibilidade considerando a duração
    const [hours, minutes] = time.split(':').map(Number)
    const startMinutes = hours * 60 + minutes
    const endMinutes = startMinutes + duration
    
    const startTimeStr = time
    const endTimeStr = new Date(0, 0, 0, hours, minutes + duration).toTimeString().slice(0, 5)

    const { data: conflicts } = await supabase
        .from('agendamentos')
        .select('id, horario_inicio, duracao_minutos, horario_fim_estimado')
        .eq('data', date)
        .not('status', 'in', '("cancelado","reagendado")')

    const hasConflict = conflicts?.some((apt: any) => {
        const aptStartStr = apt.horario_inicio
        const aptEndStr = apt.horario_fim_estimado || 
                         new Date(0, 0, 0, ...aptStartStr.split(':').map(Number)).getTime() + (apt.duracao_minutos * 60000)
        
        // Verificação de sobreposição: (StartA < EndB) AND (EndA > StartB)
        const aptStartArr = aptStartStr.split(':').map(Number)
        const aptStartMin = aptStartArr[0] * 60 + aptStartArr[1]
        const aptEndMin = aptStartMin + (apt.duracao_minutos || 180)

        return (startMinutes < aptEndMin) && (endMinutes > aptStartMin)
    })

    if (hasConflict) {
        return {
            status: 'conflict',
            message: 'This time slot is already booked or overlaps with another appointment',
            suggested_times: await getSuggestedTimes(supabase, date, conflicts)
        }
    }

    // Calcular horário de término (reusando hours e minutes)
    const endDate = new Date()
    endDate.setHours(hours, minutes + duration)
    const endTime = endDate.toTimeString().slice(0, 5)

    // Criar agendamento
    const { data: appointment, error } = await supabase
        .from('agendamentos')
        .insert({
            cliente_id: clientId,
            tipo: cleanServiceType,
            data: date,
            horario_inicio: time,
            horario_fim_estimado: endTime,
            duracao_minutos: duration,
            status: 'agendado',
            origem: 'chat_carol',
            notas: cleanValue(notes),
        })
        .select()
        .single()

    if (error) {
        logger.error('[Create Appointment] Error', { error: error instanceof Error ? error.message : String(error) })
        return { status: 'error', message: error.message }
    }

    // Disparar evento de Schedule
    try {
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/tracking/event`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.CRON_SECRET}`,
            },
            body: JSON.stringify({
                event_name: 'Schedule',
                event_id: `schedule_${appointment.id}`,
                user_data: { external_id: clientId },
                custom_data: {
                    content_name: cleanServiceType || 'Cleaning Service',
                    content_category: 'Appointment',
                    value: appointment.valor || 0,
                    currency: 'USD',
                },
            }),
        });
    } catch (e) {
        logger.error('Tracking error', { error: e instanceof Error ? e.message : String(e) });
    }

    return {
        status: 'created',
        appointment_id: appointment.id,
        details: {
            client_name: client.nome,
            service: cleanServiceType,
            date,
            time,
            duration,
            address: client.endereco_completo
        },
        confirmation_message: `Great! I've scheduled your ${cleanServiceType} cleaning for ${date} at ${time}. We'll send you a confirmation shortly!`
    }
}

// Confirmar agendamento
async function actionConfirmAppointment(supabase: any, params: any) {
    const { appointment_id } = params

    const { error } = await supabase
        .from('agendamentos')
        .update({ status: 'confirmado' })
        .eq('id', appointment_id)

    if (error) return { status: 'error', message: error.message }

    return { status: 'confirmed', appointment_id }
}

// Cancelar agendamento
async function actionCancelAppointment(supabase: any, params: any) {
    const { appointment_id, reason } = params

    const { error } = await supabase
        .from('agendamentos')
        .update({
            status: 'cancelado',
            motivo_cancelamento: cleanValue(reason) || 'Cancelled via chat'
        })
        .eq('id', appointment_id)

    if (error) return { status: 'error', message: error.message }

    return {
        status: 'cancelled',
        appointment_id,
        message: 'Appointment cancelled successfully'
    }
}

// Enviar orçamento
async function actionSendQuote(supabase: any, sessionId: string, params: any) {
    const { client_id, service_type, estimated_price, details, bedrooms, bathrooms } = params

    // ✅ Tentar usar a função do banco para precificação precisa se bedrooms/bathrooms presentes
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

    // Nota: A tabela 'orcamentos' deve existir no schema (não vi no schema.sql mas Carol usa)
    const { data, error } = await supabase
        .from('orcamentos')
        .insert({
            cliente_id: client_id,
            session_id: sessionId,
            tipo_servico: cleanValue(service_type),
            valor_estimado: finalPrice,
            detalhes: details,
            status: 'enviado',
        })
        .select()
        .single()

    if (error) {
        logger.error('[Send Quote] Error', { error: error instanceof Error ? error.message : String(error) })
        return { status: 'error', message: error.message }
    }

    return {
        status: 'sent',
        quote_id: data.id,
        amount: finalPrice,
        message: `Quote sent for ${service_type}: $${finalPrice}`
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
            telefone: cleanValue(phone),
            horario_preferido: cleanValue(preferred_time),
            notas: cleanValue(notes),
            status: 'pending',
        })
        .select()
        .single()

    if (error) return { status: 'error', message: error.message }

    return {
        status: 'scheduled',
        callback_id: data.id,
        message: 'Callback scheduled. Our team will contact you soon!'
    }
}

// Helpers
async function getSuggestedTimes(supabase: any, date: string, conflicts: any[]) {
    const bookedTimes = conflicts?.map(c => c.horario_inicio) || []
    const allTimes = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00']
    return allTimes.filter(t => !bookedTimes.includes(t)).slice(0, 3)
}

function cleanValue(val: any): string | null {
    if (val === null || val === undefined) return null
    const cleaned = String(val).trim()
    if (cleaned === '' || cleaned === '=') return null
    return cleaned
}

function isValidNumber(val: any): boolean {
    if (val === null || val === undefined) return false
    const num = Number(val)
    return !isNaN(num)
}

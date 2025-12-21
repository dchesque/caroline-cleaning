import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type QueryType =
    | 'client_info'
    | 'client_history'
    | 'available_slots'
    | 'service_pricing'
    | 'service_areas'
    | 'business_info'

interface QueryPayload {
    type: QueryType
    params: Record<string, any>
}

export async function POST(request: NextRequest) {
    try {
        const { type, params }: QueryPayload = await request.json()
        const supabase = await createClient()

        let result: any = null

        switch (type) {
            case 'client_info':
                result = await queryClientInfo(supabase, params)
                break

            case 'client_history':
                result = await queryClientHistory(supabase, params)
                break

            case 'available_slots':
                result = await queryAvailableSlots(supabase, params)
                break

            case 'service_pricing':
                result = await queryServicePricing(supabase, params)
                break

            case 'service_areas':
                result = await queryServiceAreas(supabase, params)
                break

            case 'business_info':
                result = await queryBusinessInfo(supabase)
                break

            default:
                return NextResponse.json({ error: 'Unknown query type' }, { status: 400 })
        }

        return NextResponse.json({
            success: true,
            type,
            data: result
        })

    } catch (error) {
        console.error('[Carol Query] Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// Buscar informações do cliente
async function queryClientInfo(supabase: any, params: any) {
    const { phone, email, client_id } = params

    let query = supabase.from('clientes').select(`
    id, nome, telefone, email, status,
    endereco_completo, cidade, estado, zip_code,
    tipo_residencia, bedrooms, bathrooms, square_feet,
    tipo_servico_padrao, frequencia, dia_preferido,
    tem_pets, pets_detalhes,
    notas
  `)

    if (client_id) {
        query = query.eq('id', client_id)
    } else if (phone) {
        query = query.eq('telefone', phone)
    } else if (email) {
        query = query.eq('email', email)
    } else {
        return null
    }

    const { data, error } = await query.single()

    if (error) return null
    return data
}

// Buscar histórico do cliente
async function queryClientHistory(supabase: any, params: any) {
    const { client_id, phone, limit = 5 } = params

    let clientId = client_id

    // Se passou telefone, buscar client_id
    if (!clientId && phone) {
        const { data: client } = await supabase
            .from('clientes')
            .select('id')
            .eq('telefone', phone)
            .single()

        clientId = client?.id
    }

    if (!clientId) return { appointments: [], total_spent: 0 }

    // Buscar agendamentos
    const { data: appointments } = await supabase
        .from('agendamentos')
        .select('id, tipo, data, horario_inicio, status, valor')
        .eq('cliente_id', clientId)
        .order('data', { ascending: false })
        .limit(limit)

    // Buscar total gasto
    const { data: financial } = await supabase
        .from('financeiro')
        .select('valor')
        .eq('cliente_id', clientId)
        .eq('tipo', 'receita')
        .eq('status', 'pago')

    const totalSpent = financial?.reduce((acc: number, f: any) => acc + f.valor, 0) || 0

    return {
        client_id: clientId,
        appointments: appointments || [],
        total_appointments: appointments?.length || 0,
        total_spent: totalSpent,
        is_returning_client: (appointments?.length || 0) > 0
    }
}

// Buscar slots disponíveis
async function queryAvailableSlots(supabase: any, params: any) {
    const { date, duration = 180, days_ahead = 7 } = params

    const slots: any[] = []
    const startDate = date ? new Date(date) : new Date()

    for (let i = 0; i < days_ahead; i++) {
        const currentDate = new Date(startDate)
        currentDate.setDate(currentDate.getDate() + i)

        // Pular domingos
        if (currentDate.getDay() === 0) continue

        const dateStr = currentDate.toISOString().split('T')[0]

        // Buscar agendamentos do dia
        const { data: booked } = await supabase
            .from('agendamentos')
            .select('horario_inicio, horario_fim_estimado')
            .eq('data', dateStr)
            .not('status', 'in', '("cancelado","reagendado")')

        // Horários disponíveis (8h às 17h)
        const availableHours = []
        for (let hour = 8; hour <= 17; hour++) {
            const timeStr = `${hour.toString().padStart(2, '0')}:00`

            // Verificar se o horário está livre
            const isBooked = booked?.some((apt: any) => {
                return apt.horario_inicio <= timeStr && apt.horario_fim_estimado > timeStr
            })

            if (!isBooked) {
                availableHours.push(timeStr)
            }
        }

        if (availableHours.length > 0) {
            slots.push({
                date: dateStr,
                day_of_week: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
                available_times: availableHours
            })
        }
    }

    return {
        slots,
        duration_requested: duration,
        total_available: slots.reduce((acc, s) => acc + s.available_times.length, 0)
    }
}

// Buscar preços dos serviços
async function queryServicePricing(supabase: any, params: any) {
    const { service_type } = params

    let query = supabase
        .from('tipos_servico')
        .select('nome, descricao, preco_base, duracao_padrao')
        .eq('ativo', true)
        .order('ordem')

    if (service_type) {
        query = query.eq('nome', service_type)
    }

    const { data } = await query

    // Formatar para a IA
    return {
        services: data?.map((s: any) => ({
            name: s.nome,
            description: s.descricao,
            base_price: s.preco_base,
            duration_minutes: s.duracao_padrao,
            price_range: `$${s.preco_base} - $${Math.round(s.preco_base * 1.5)}`
        })) || [],
        note: 'Prices may vary based on home size and specific requirements'
    }
}

// Buscar áreas atendidas
async function queryServiceAreas(supabase: any, params: any) {
    const { zip_code } = params

    const { data: areas } = await supabase
        .from('areas_atendidas')
        .select('nome, tipo, zip_codes, taxa_adicional')
        .eq('ativo', true)

    // Se passou ZIP code, verificar se é atendido
    let isServiced = false
    let additionalFee = 0

    if (zip_code && areas) {
        for (const area of areas) {
            if (area.zip_codes?.includes(zip_code)) {
                isServiced = true
                additionalFee = area.taxa_adicional || 0
                break
            }
        }
    }

    return {
        areas: areas?.map((a: any) => ({
            name: a.nome,
            type: a.tipo,
            additional_fee: a.taxa_adicional
        })) || [],
        zip_code_check: zip_code ? {
            zip_code,
            is_serviced: isServiced,
            additional_fee: additionalFee
        } : null
    }
}

// Buscar informações do negócio
async function queryBusinessInfo(supabase: any) {
    const { data } = await supabase
        .from('configuracoes')
        .select('settings')
        .eq('id', 1)
        .single()

    const settings = data?.settings || {}

    return {
        name: settings.business_name || 'Caroline Premium Cleaning',
        phone: settings.business_phone || '(551) 389-7394',
        email: settings.business_email || 'hello@carolinecleaning.com',
        hours: {
            start: settings.operating_start || '08:00',
            end: settings.operating_end || '18:00',
            days: settings.operating_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        },
        booking_rules: {
            min_notice_hours: settings.min_booking_notice || 24,
            max_advance_days: settings.max_booking_advance || 30
        }
    }
}

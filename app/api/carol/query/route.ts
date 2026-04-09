import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { timingSafeEqual } from 'crypto'
import { logger } from '@/lib/logger'
import { CarolQuerySchema, parseJson } from '@/lib/validation/schemas'

function escapeLikePattern(value: string): string {
    return value.replace(/[%_\\]/g, '\\$&');
}

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

    const parsed = await parseJson(request, CarolQuerySchema)
    if (!parsed.ok) {
        return NextResponse.json({ error: parsed.error }, { status: parsed.status })
    }
    const { type, params } = parsed.data

    try {
        const supabase = createAdminClient()

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
        logger.error('[Carol Query] Error', { error: error instanceof Error ? error.message : String(error) })
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

        // ✅ USAR RPC get_available_slots para precisão total
        const { data, error } = await supabase.rpc('get_available_slots', {
            p_data: dateStr,
            p_duracao_minutos: duration
        })

        if (!error && data) {
            const availableTimes = data
                .filter((s: any) => s.disponivel)
                .map((s: any) => s.slot_inicio.substring(0, 5))

            if (availableTimes.length > 0) {
                slots.push({
                    date: dateStr,
                    day_of_week: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
                    available_times: availableTimes
                })
            }
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

    // ✅ Corrigido nome da tabela para servicos_tipos
    let query = supabase
        .from('servicos_tipos')
        .select('nome, descricao, multiplicador_preco, duracao_base_minutos')
        .eq('ativo', true)
        .order('ordem')

    if (service_type) {
        query = query.ilike('nome', `%${escapeLikePattern(service_type)}%`)
    }

    const { data } = await query

    // Buscar configurações de preços base para dar uma estimativa real
    const { data: basePrices } = await supabase.from('precos_base').select('*')

    // Formatar para a IA
    return {
        services: data?.map((s: any) => {
            const baseMin = basePrices?.[0]?.preco_minimo || 120
            const multiplier = parseFloat(s.multiplicador_preco || 1)
            return {
                name: s.nome,
                description: s.descricao,
                estimated_price_range: `$${Math.round(baseMin * multiplier)} - $${Math.round(baseMin * multiplier * 1.5)}`,
                base_duration_minutes: s.duracao_base_minutos
            }
        }) || [],
        note: 'Final price depends on number of bedrooms/bathrooms and home condition.'
    }
}

// Buscar áreas atendidas
async function queryServiceAreas(supabase: any, params: any) {
    const { zip_code } = params

    const { data: areas } = await supabase
        .from('areas_atendidas')
        .select('nome, cidade, estado, zip_codes, taxa_deslocamento')
        .eq('ativo', true)

    // Se passou ZIP code, verificar se é atendido
    let isServiced = false
    let additionalFee = 0

    if (zip_code && areas) {
        for (const area of areas) {
            if (area.zip_codes?.includes(zip_code)) {
                isServiced = true
                additionalFee = area.taxa_deslocamento || 0
                break
            }
        }
    }

    return {
        areas: areas?.map((a: any) => ({
            name: a.nome,
            city: a.cidade,
            state: a.estado,
            additional_fee: a.taxa_deslocamento
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
    // ✅ Corrigido para buscar da estrutura chave/valor
    const keys = ['business_name', 'business_phone', 'business_email', 'horario_inicio', 'horario_fim']
    const { data } = await supabase
        .from('configuracoes')
        .select('chave, valor')
        .in('chave', keys)

    const settings: Record<string, any> = {}
    data?.forEach((item: any) => {
        settings[item.chave] = item.valor
    })

    return {
        name: settings.business_name || 'Chesque Premium Cleaning',
        phone: settings.business_phone || '(551) 389-7394',
        email: settings.business_email || 'hello@chesquecleaning.com',
        hours: {
            start: settings.horario_inicio || '08:00',
            end: settings.horario_fim || '18:00',
            days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        }
    }
}

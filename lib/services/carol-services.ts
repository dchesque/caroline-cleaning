// lib/services/carol-services.ts
// Service Layer unificado - toda lógica de negócio da Carol em funções diretas
// Sem overhead de HTTP. Reutilizável pela State Machine e pelas API routes.

import { createAdminClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { env } from '@/lib/env'
import type { CarolState } from '@/lib/ai/state-machine/types'

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export interface CustomerResult {
    found: boolean
    client_id?: string
    customer?: {
        id: string
        name: string
        phone: string
        email: string | null
        address: string | null
        zip_code: string | null
        city: string | null
        state: string | null
        status: string
        has_pets: boolean
        pets_details: string | null
        notes: string | null
        preferred_channel: string | null
    }
    upcoming_appointments?: Array<{
        id: string
        date: string
        time: string
        end_time: string | null
        status: string
        service_type: string
    }>
}

export interface ClientHistoryResult {
    client_id: string
    appointments: Array<{
        id: string
        service_type: string
        date: string
        time: string
        status: string
        value: number | null
    }>
    total_appointments: number
    total_spent: number
    is_returning: boolean
}

export interface SlotInfo {
    time: string
    end_time: string
}

export interface SlotsResult {
    date: string
    slots: SlotInfo[]
    total: number
}

export interface MultiDaySlotsResult {
    days: Array<{
        date: string
        day_name: string
        day_name_en: string
        slots: SlotInfo[]
    }>
    duration_requested: number
    total_available: number
}

export interface ZipCoverageResult {
    covered: boolean
    area_name: string | null
    additional_fee: number
}

export interface ServiceInfo {
    code: string
    name: string
    duration_minutes: number
    price_multiplier: number
}

export interface SystemConfig {
    services: ServiceInfo[]
    operating_start: string
    operating_end: string
    default_duration: number
}

export interface BusinessInfo {
    name: string
    phone: string
    email: string
    hours: {
        start: string
        end: string
        days: string[]
    }
}

export interface CreateLeadParams {
    name: string
    phone: string
    email?: string | null
    address?: string | null
    zip_code?: string | null
    notes?: string | null
    service_interest?: string | null
}

export interface LeadResult {
    status: 'created' | 'existing' | 'error'
    client_id: string | null
    client_name: string | null
    message: string
}

export interface UpdateLeadParams {
    [key: string]: any
}

export interface UpdateResult {
    status: 'updated' | 'not_found' | 'error'
    client_id: string | null
    updated_fields: string[]
    message?: string
}

export interface CreateAppointmentParams {
    client_id: string
    service_type: string
    date: string
    time: string
    duration: number
    notes?: string | null
}

export interface AppointmentResult {
    status: 'created' | 'conflict' | 'missing_address' | 'error'
    appointment_id?: string
    details?: {
        client_name: string
        service: string
        date: string
        time: string
        duration: number
        address: string | null
    }
    message: string
    suggested_times?: string[]
}

export interface CancelResult {
    status: 'cancelled' | 'error'
    appointment_id: string
    message: string
}

export interface CallbackParams {
    client_id?: string | null
    phone: string
    preferred_time: string
    notes?: string | null
}

export interface CallbackResult {
    status: 'scheduled' | 'error'
    callback_id?: string
    message: string
}

export interface SessionContext {
    state: CarolState
    previousState: CarolState | null
    language: 'pt' | 'en'
    cliente_id: string | null
    cliente_nome: string | null
    cliente_telefone: string | null
    cliente_endereco: string | null
    cliente_zip: string | null
    cliente_email: string | null
    is_returning: boolean
    service_type: string | null
    selected_date: string | null
    selected_time: string | null
    duration_minutes: number | null
    available_slots: SlotInfo[] | null
    target_appointment_id: string | null
    appointments: any[] | null
    booking_confirmed: boolean
    booking_id: string | null
    canal_preferencia: 'sms' | 'whatsapp' | null
    retry_count: number
    last_error: string | null
    pets_info: string | null
    allergy_info: string | null
    _same_state_count?: number
    _last_processed_state?: CarolState
    [key: string]: any
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

function escapeLikePattern(value: string): string {
    return value.replace(/[%_\\]/g, '\\$&');
}

function cleanValue(val: any): string | null {
    if (val === null || val === undefined) return null
    const cleaned = String(val).trim()
    if (cleaned === '' || cleaned === '=') return null
    return cleaned
}

function getNowNY(): Date {
    const nowStr = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
    return new Date(nowStr)
}

function getTodayStr(): string {
    const now = getNowNY()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

// ═══════════════════════════════════════════
// SERVICE CLASS
// ═══════════════════════════════════════════

export class CarolServices {
    private _supabase: ReturnType<typeof createAdminClient> | null = null

    private get supabase() {
        if (!this._supabase) {
            this._supabase = createAdminClient()
        }
        return this._supabase
    }

    // ═══════════════════════════════════════
    // QUERIES (leitura)
    // ═══════════════════════════════════════

    async findCustomerByPhone(phone: string): Promise<CustomerResult> {
        // Normalize to digits-only for consistent matching
        const normalizedPhone = phone.replace(/\D/g, '')
        logger.debug('findCustomerByPhone', { phone, normalizedPhone })

        // Try exact match first, then fallback to digits-only match
        let data: any = null
        let error: any = null

        const exactResult = await this.supabase
            .from('clientes')
            .select(`
                id, nome, telefone, email, status,
                endereco_completo, cidade, estado, zip_code,
                tem_pets, pets_detalhes, notas, canal_preferencia
            `)
            .eq('telefone', normalizedPhone)
            .single()

        data = exactResult.data
        error = exactResult.error

        // If not found with normalized, try original format
        if ((error || !data) && normalizedPhone !== phone) {
            const fallbackResult = await this.supabase
                .from('clientes')
                .select(`
                    id, nome, telefone, email, status,
                    endereco_completo, cidade, estado, zip_code,
                    tem_pets, pets_detalhes, notas, canal_preferencia
                `)
                .eq('telefone', phone)
                .single()

            data = fallbackResult.data
            error = fallbackResult.error
        }

        if (error || !data) {
            return { found: false }
        }

        // Buscar agendamentos futuros
        const todayStr = getTodayStr()
        const { data: appointments } = await this.supabase
            .from('agendamentos')
            .select('id, data, horario_inicio, horario_fim_estimado, status, tipo')
            .eq('cliente_id', data.id)
            .not('status', 'in', '("cancelado","reagendado")')
            .gte('data', todayStr)
            .order('data', { ascending: true })
            .limit(5)

        return {
            found: true,
            client_id: data.id,
            customer: {
                id: data.id,
                name: data.nome,
                phone: data.telefone,
                email: data.email,
                address: data.endereco_completo,
                zip_code: data.zip_code,
                city: data.cidade,
                state: data.estado,
                status: data.status,
                has_pets: data.tem_pets || false,
                pets_details: data.pets_detalhes,
                notes: data.notas,
                preferred_channel: data.canal_preferencia
            },
            upcoming_appointments: (appointments || []).map((a: any) => ({
                id: a.id,
                date: a.data,
                time: a.horario_inicio?.substring(0, 5) || '',
                end_time: a.horario_fim_estimado?.substring(0, 5) || null,
                status: a.status,
                service_type: a.tipo
            }))
        }
    }

    async getClientHistory(clientId: string, limit: number = 10): Promise<ClientHistoryResult> {
        logger.debug('getClientHistory', { clientId, limit })

        const { data: appointments } = await this.supabase
            .from('agendamentos')
            .select('id, tipo, data, horario_inicio, status, valor')
            .eq('cliente_id', clientId)
            .order('data', { ascending: false })
            .limit(limit)

        const { data: financial } = await this.supabase
            .from('financeiro')
            .select('valor')
            .eq('cliente_id', clientId)
            .eq('tipo', 'receita')
            .eq('status', 'pago')

        const totalSpent = financial?.reduce((acc: number, f: any) => acc + (f.valor || 0), 0) || 0

        return {
            client_id: clientId,
            appointments: (appointments || []).map((a: any) => ({
                id: a.id,
                service_type: a.tipo,
                date: a.data,
                time: a.horario_inicio?.substring(0, 5) || '',
                status: a.status,
                value: a.valor
            })),
            total_appointments: appointments?.length || 0,
            total_spent: totalSpent,
            is_returning: (appointments?.length || 0) > 0
        }
    }

    async getAvailableSlots(date: string, durationMinutes: number): Promise<SlotsResult> {
        logger.debug('getAvailableSlots', { date, durationMinutes })

        const { data, error } = await this.supabase.rpc('get_available_slots', {
            p_data: date,
            p_duracao_minutos: durationMinutes
        })

        if (error) {
            logger.error('getAvailableSlots RPC error', { error })
            return { date, slots: [], total: 0 }
        }

        let availableSlots = (data || []).filter((s: any) => s.disponivel)

        // Se for hoje, filtrar horários passados (+3h de antecedência)
        const todayStr = getTodayStr()
        if (date === todayStr) {
            const now = getNowNY()
            const minTime = new Date(now.getTime() + 3 * 60 * 60 * 1000)
            const minHour = minTime.getHours()
            const minMin = minTime.getMinutes()

            availableSlots = availableSlots.filter((slot: any) => {
                const parts = slot.slot_inicio.split(':')
                const h = parseInt(parts[0], 10)
                const m = parseInt(parts[1], 10)
                return h > minHour || (h === minHour && m >= minMin)
            })
        }

        const slots: SlotInfo[] = availableSlots.map((s: any) => ({
            time: s.slot_inicio.substring(0, 5),
            end_time: s.slot_fim.substring(0, 5)
        }))

        return { date, slots, total: slots.length }
    }

    async getAvailableSlotsMultiDay(
        startDate: string,
        days: number,
        durationMinutes: number
    ): Promise<MultiDaySlotsResult> {
        logger.debug('getAvailableSlotsMultiDay', { startDate, days, durationMinutes })

        const weekdaysPt = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
        const weekdaysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        const result: MultiDaySlotsResult = { days: [], duration_requested: durationMinutes, total_available: 0 }

        const start = new Date(startDate + 'T12:00:00')

        for (let i = 0; i < days; i++) {
            const current = new Date(start)
            current.setDate(current.getDate() + i)

            // Pular domingos
            if (current.getDay() === 0) continue

            const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`
            const slotsResult = await this.getAvailableSlots(dateStr, durationMinutes)

            if (slotsResult.slots.length > 0) {
                result.days.push({
                    date: dateStr,
                    day_name: weekdaysPt[current.getDay()],
                    day_name_en: weekdaysEn[current.getDay()],
                    slots: slotsResult.slots
                })
                result.total_available += slotsResult.slots.length
            }
        }

        return result
    }

    async checkZipCoverage(zipCode: string): Promise<ZipCoverageResult> {
        logger.debug('checkZipCoverage', { zipCode })

        const { data, error } = await this.supabase
            .from('areas_atendidas')
            .select('id, nome, taxa_deslocamento')
            .eq('ativo', true)
            .contains('zip_codes', [zipCode])
            .limit(1)

        if (error) {
            logger.error('checkZipCoverage error', { error })
            return { covered: false, area_name: null, additional_fee: 0 }
        }

        const isCovered = data && data.length > 0
        return {
            covered: isCovered,
            area_name: isCovered ? data[0].nome : null,
            additional_fee: isCovered ? (data[0].taxa_deslocamento || 0) : 0
        }
    }

    async getServicePricing(serviceType?: string): Promise<{ services: any[]; note: string }> {
        let query = this.supabase
            .from('servicos_tipos')
            .select('codigo, nome, descricao, multiplicador_preco, duracao_base_minutos')
            .eq('ativo', true)
            .order('ordem')

        if (serviceType) {
            query = query.ilike('nome', `%${escapeLikePattern(serviceType)}%`)
        }

        const { data: services } = await query
        const { data: basePrices } = await this.supabase.from('precos_base').select('*')

        return {
            services: (services || []).map((s: any) => {
                const baseMin = basePrices?.[0]?.preco_minimo || 120
                const multiplier = parseFloat(s.multiplicador_preco || '1')
                return {
                    code: s.codigo,
                    name: s.nome,
                    description: s.descricao,
                    price_range: `$${Math.round(baseMin * multiplier)} - $${Math.round(baseMin * multiplier * 1.5)}`,
                    duration_minutes: s.duracao_base_minutos
                }
            }),
            note: 'Final price depends on home size and condition.'
        }
    }

    async getBusinessInfo(): Promise<BusinessInfo> {
        const keys = ['business_name', 'business_phone', 'business_email', 'horario_inicio', 'horario_fim']
        const { data } = await this.supabase
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

    async getSystemConfig(): Promise<SystemConfig> {
        const { data: settings } = await this.supabase
            .from('business_settings')
            .select('chave, valor')
            .in('chave', ['operating_start', 'operating_end', 'booking_default_duration'])

        const { data: services } = await this.supabase
            .from('servicos_tipos')
            .select('codigo, nome, duracao_base_minutos, multiplicador_preco')
            .eq('ativo', true)
            .eq('disponivel_agendamento_online', true)
            .order('ordem', { ascending: true })

        const settingsMap = new Map(settings?.map((s: any) => [s.chave, s.valor]) || [])

        return {
            services: (services || []).map((s: any) => ({
                code: s.codigo,
                name: s.nome,
                duration_minutes: s.duracao_base_minutos,
                price_multiplier: parseFloat(s.multiplicador_preco || '1')
            })),
            operating_start: (settingsMap.get('operating_start') as string) || '08:00',
            operating_end: (settingsMap.get('operating_end') as string) || '17:00',
            default_duration: parseInt((settingsMap.get('booking_default_duration') as string) || '60', 10)
        }
    }

    // ═══════════════════════════════════════
    // ACTIONS (escrita)
    // ═══════════════════════════════════════

    async createLead(params: CreateLeadParams, sessionId?: string): Promise<LeadResult> {
        logger.info('createLead', { name: params.name, phone: params.phone })

        // Verificar se já existe
        if (params.phone) {
            const { data: existing } = await this.supabase
                .from('clientes')
                .select('id, nome, status')
                .eq('telefone', params.phone)
                .single()

            if (existing) {
                return {
                    status: 'existing',
                    client_id: existing.id,
                    client_name: existing.nome,
                    message: 'Client already exists'
                }
            }
        }

        const insertData: Record<string, any> = {
            nome: cleanValue(params.name) || 'New Lead',
            telefone: cleanValue(params.phone),
            status: 'lead',
            origem: 'chat_carol',
            session_id_origem: sessionId || null
        }

        if (cleanValue(params.email)) insertData.email = cleanValue(params.email)
        if (cleanValue(params.zip_code)) insertData.zip_code = cleanValue(params.zip_code)
        if (cleanValue(params.address)) insertData.endereco_completo = cleanValue(params.address)
        if (cleanValue(params.notes)) insertData.notas = cleanValue(params.notes)
        if (cleanValue(params.service_interest)) insertData.tipo_servico_padrao = cleanValue(params.service_interest)

        const { data, error } = await this.supabase
            .from('clientes')
            .insert(insertData)
            .select()
            .single()

        if (error) {
            logger.error('createLead error', { error })
            return { status: 'error', client_id: null, client_name: null, message: error.message }
        }

        // Tracking event (Lead)
        this.fireTrackingEvent('Lead', {
            event_id: `lead_chat_${data.id}`,
            user_data: {
                phone: params.phone,
                email: params.email || undefined,
                first_name: params.name?.split(' ')[0],
                zip_code: params.zip_code || undefined
            },
            custom_data: {
                content_name: 'Chat Carol',
                content_category: 'Lead'
            }
        })

        return {
            status: 'created',
            client_id: data.id,
            client_name: data.nome,
            message: 'Lead created successfully'
        }
    }

    async updateLead(clientId: string, updates: UpdateLeadParams): Promise<UpdateResult> {
        logger.info('updateLead', { clientId, fields: Object.keys(updates) })

        const allowedFields = [
            'nome', 'email', 'zip_code', 'endereco_completo',
            'cidade', 'estado', 'tipo_residencia', 'bedrooms',
            'bathrooms', 'square_feet', 'tipo_servico_padrao',
            'frequencia', 'dia_preferido', 'tem_pets', 'pets_detalhes',
            'status', 'notas', 'canal_preferencia'
        ]

        const filtered: Record<string, any> = {}
        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                const cleaned = cleanValue(value)
                if (cleaned !== null) {
                    if (key === 'tem_pets') {
                        filtered[key] = String(cleaned).toLowerCase() === 'true' || cleaned === 'yes'
                    } else if (['bedrooms', 'bathrooms', 'square_feet'].includes(key)) {
                        const num = Number(cleaned)
                        if (!isNaN(num)) filtered[key] = num
                    } else {
                        filtered[key] = cleaned
                    }
                }
            }
        }

        if (Object.keys(filtered).length === 0) {
            return { status: 'updated', client_id: clientId, updated_fields: [], message: 'No fields to update' }
        }

        const { error } = await this.supabase
            .from('clientes')
            .update(filtered)
            .eq('id', clientId)

        if (error) {
            logger.error('updateLead error', { error })
            return { status: 'error', client_id: clientId, updated_fields: [], message: error.message }
        }

        return { status: 'updated', client_id: clientId, updated_fields: Object.keys(filtered) }
    }

    async createAppointment(params: CreateAppointmentParams, sessionId?: string): Promise<AppointmentResult> {
        logger.info('createAppointment', { client_id: params.client_id, date: params.date, time: params.time })

        // 1. Verificar se cliente existe e tem endereço
        const { data: client, error: clientError } = await this.supabase
            .from('clientes')
            .select('id, nome, telefone, endereco_completo, cidade, zip_code')
            .eq('id', params.client_id)
            .single()

        if (clientError || !client) {
            return { status: 'error', message: 'Client not found' }
        }

        if (!client.endereco_completo || !client.zip_code) {
            return {
                status: 'missing_address',
                message: 'Client address is required. Please provide address and ZIP code first.',
                details: {
                    client_name: client.nome,
                    service: params.service_type,
                    date: params.date,
                    time: params.time,
                    duration: params.duration,
                    address: null
                }
            }
        }

        // 2. Verificar conflitos
        const [hours, minutes] = params.time.split(':').map(Number)
        const startMinutes = hours * 60 + minutes
        const endMinutes = startMinutes + params.duration

        const { data: conflicts } = await this.supabase
            .from('agendamentos')
            .select('id, horario_inicio, duracao_minutos')
            .eq('data', params.date)
            .not('status', 'in', '("cancelado","reagendado")')

        const hasConflict = conflicts?.some((apt: any) => {
            const aptParts = apt.horario_inicio.split(':').map(Number)
            const aptStartMin = aptParts[0] * 60 + aptParts[1]
            const aptEndMin = aptStartMin + (apt.duracao_minutos || 180)
            return (startMinutes < aptEndMin) && (endMinutes > aptStartMin)
        })

        if (hasConflict) {
            // Sugerir horários alternativos
            const allTimes = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00']
            const bookedTimes = conflicts?.map((c: any) => c.horario_inicio?.substring(0, 5)) || []
            const suggested = allTimes.filter(t => !bookedTimes.includes(t)).slice(0, 3)

            return {
                status: 'conflict',
                message: 'This time slot is already booked.',
                suggested_times: suggested
            }
        }

        // 3. Calcular horário de fim
        const endH = Math.floor(endMinutes / 60)
        const endM = endMinutes % 60
        const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`

        // 4. Criar agendamento
        const { data: appointment, error } = await this.supabase
            .from('agendamentos')
            .insert({
                cliente_id: params.client_id,
                tipo: cleanValue(params.service_type) || 'regular',
                data: params.date,
                horario_inicio: params.time,
                horario_fim_estimado: endTime,
                duracao_minutos: params.duration,
                status: 'agendado',
                origem: 'chat_carol',
                notas: cleanValue(params.notes)
            })
            .select()
            .single()

        if (error) {
            logger.error('createAppointment error', { error })
            return { status: 'error', message: error.message }
        }

        // 4b. Re-verify conflict after insert (race condition protection)
        const { data: postInsertConflicts } = await this.supabase
            .from('agendamentos')
            .select('id')
            .eq('data', params.date)
            .not('status', 'in', '("cancelado","reagendado")')
            .neq('id', appointment.id)

        const hasPostConflict = postInsertConflicts?.some((apt: any) => {
            // We need to re-check time overlap, but we only have IDs here
            // Simple approach: if another appointment was inserted between our check and insert,
            // we should re-run the full overlap check
            return false // Placeholder - full check below
        })

        // Full post-insert conflict check with time overlap
        if (postInsertConflicts && postInsertConflicts.length > 0) {
            const { data: detailedConflicts } = await this.supabase
                .from('agendamentos')
                .select('id, horario_inicio, duracao_minutos')
                .eq('data', params.date)
                .not('status', 'in', '("cancelado","reagendado")')
                .neq('id', appointment.id)

            const realConflict = detailedConflicts?.some((apt: any) => {
                const aptParts = apt.horario_inicio.split(':').map(Number)
                const aptStartMin = aptParts[0] * 60 + aptParts[1]
                const aptEndMin = aptStartMin + (apt.duracao_minutos || 180)
                return (startMinutes < aptEndMin) && (endMinutes > aptStartMin)
            })

            if (realConflict) {
                // Rollback: delete the appointment we just created
                await this.supabase.from('agendamentos').delete().eq('id', appointment.id)
                logger.warn('createAppointment: post-insert conflict detected, rolled back', {
                    appointmentId: appointment.id, date: params.date, time: params.time
                })
                const allTimes = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00']
                const bookedTimes = detailedConflicts?.map((c: any) => c.horario_inicio?.substring(0, 5)) || []
                const suggested = allTimes.filter(t => !bookedTimes.includes(t)).slice(0, 3)
                return {
                    status: 'conflict',
                    message: 'This time slot was just booked by someone else.',
                    suggested_times: suggested
                }
            }
        }

        // 5. Tracking event (Schedule)
        this.fireTrackingEvent('Schedule', {
            event_id: `schedule_${appointment.id}`,
            user_data: { external_id: params.client_id },
            custom_data: {
                content_name: params.service_type || 'Cleaning Service',
                content_category: 'Appointment',
                value: appointment.valor || 0,
                currency: 'USD'
            }
        })

        // 6. Log da ação
        if (sessionId) {
            await this.supabase.from('action_logs').insert({
                session_id: sessionId,
                action_type: 'create_appointment',
                params: { client_id: params.client_id, date: params.date, time: params.time },
                result: { appointment_id: appointment.id }
            })
        }

        return {
            status: 'created',
            appointment_id: appointment.id,
            details: {
                client_name: client.nome,
                service: params.service_type,
                date: params.date,
                time: params.time,
                duration: params.duration,
                address: client.endereco_completo
            },
            message: `Appointment created successfully! ID: ${appointment.id}`
        }
    }

    async cancelAppointment(appointmentId: string, reason?: string): Promise<CancelResult> {
        logger.info('cancelAppointment', { appointmentId, reason })

        const { error } = await this.supabase
            .from('agendamentos')
            .update({
                status: 'cancelado',
                motivo_cancelamento: cleanValue(reason) || 'Cancelled via chat'
            })
            .eq('id', appointmentId)

        if (error) {
            logger.error('cancelAppointment error', { error })
            return { status: 'error', appointment_id: appointmentId, message: error.message }
        }

        return {
            status: 'cancelled',
            appointment_id: appointmentId,
            message: 'Appointment cancelled successfully'
        }
    }

    async confirmAppointment(appointmentId: string): Promise<{ status: string; appointment_id: string }> {
        const { error } = await this.supabase
            .from('agendamentos')
            .update({ status: 'confirmado' })
            .eq('id', appointmentId)

        if (error) {
            return { status: 'error', appointment_id: appointmentId }
        }
        return { status: 'confirmed', appointment_id: appointmentId }
    }

    async scheduleCallback(params: CallbackParams, sessionId?: string): Promise<CallbackResult> {
        logger.info('scheduleCallback', { phone: params.phone })

        const { data, error } = await this.supabase
            .from('callbacks')
            .insert({
                cliente_id: params.client_id || null,
                session_id: sessionId || null,
                telefone: cleanValue(params.phone),
                horario_preferido: cleanValue(params.preferred_time),
                notas: cleanValue(params.notes),
                status: 'pending'
            })
            .select()
            .single()

        if (error) {
            logger.error('scheduleCallback error', { error })
            return { status: 'error', message: error.message }
        }

        return {
            status: 'scheduled',
            callback_id: data.id,
            message: 'Callback scheduled. Team will contact soon!'
        }
    }

    // ═══════════════════════════════════════
    // SESSION (memória persistente)
    // ═══════════════════════════════════════

    async getSession(sessionId: string): Promise<SessionContext> {
        const { data } = await this.supabase
            .from('chat_sessions')
            .select('contexto')
            .eq('id', sessionId)
            .single()

        if (data?.contexto && data.contexto.state) {
            return data.contexto as SessionContext
        }

        // Contexto padrão para nova sessão
        return this.getDefaultContext()
    }

    getDefaultContext(): SessionContext {
        return {
            state: 'GREETING',
            previousState: null,
            language: 'en',
            cliente_id: null,
            cliente_nome: null,
            cliente_telefone: null,
            cliente_endereco: null,
            cliente_zip: null,
            cliente_email: null,
            is_returning: false,
            service_type: null,
            selected_date: null,
            selected_time: null,
            duration_minutes: null,
            available_slots: null,
            target_appointment_id: null,
            appointments: null,
            booking_confirmed: false,
            booking_id: null,
            canal_preferencia: null,
            retry_count: 0,
            last_error: null,
            pets_info: null,
            allergy_info: null
        }
    }

    async updateSession(sessionId: string, context: SessionContext): Promise<void> {
        const now = new Date().toISOString()
        // Store last_activity in context for optimistic locking
        context._last_activity = now

        const { error } = await this.supabase
            .from('chat_sessions')
            .upsert({
                id: sessionId,
                contexto: context,
                last_activity: now,
                status: 'active',
                cliente_id: context.cliente_id || null
            })

        if (error) {
            logger.error('updateSession error', { sessionId, error: error.message })
        }
    }

    async saveMessage(
        sessionId: string,
        role: 'user' | 'assistant',
        content: string,
        meta?: { state?: string; previousState?: string | null; execution_logs?: string }
    ): Promise<void> {
        await this.supabase
            .from('mensagens_chat')
            .insert({
                session_id: sessionId,
                role,
                content,
                source: 'website',
                intent_detected: meta?.state || null,
                execution_logs: meta?.execution_logs || null
            })
    }

    async getHistory(sessionId: string, limit: number = 20): Promise<Array<{ role: string; content: string }>> {
        const { data } = await this.supabase
            .from('mensagens_chat')
            .select('role, content')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true })
            .limit(limit)

        return data || []
    }

    // ═══════════════════════════════════════
    // INTERNAL HELPERS
    // ═══════════════════════════════════════

    private fireTrackingEvent(eventName: string, payload: any): void {
        // Fire-and-forget, não bloqueia o fluxo
        const siteUrl = env.appUrl
        fetch(`${siteUrl}/api/tracking/event`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.CRON_SECRET}`,
            },
            body: JSON.stringify({
                event_name: eventName,
                ...payload
            })
        }).catch(e => logger.error('Tracking event error', { error: e }))
    }
}

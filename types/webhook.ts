export type WebhookEventType =
    // Chat
    | 'chat.message_received'
    // Leads
    | 'lead.created'
    | 'lead.updated'
    | 'lead.converted'
    // Agendamentos
    | 'appointment.created'
    | 'appointment.confirmed'
    | 'appointment.completed'
    | 'appointment.cancelled'
    | 'appointment.rescheduled'
    // Feedback
    | 'feedback.received'
    // Pagamentos
    | 'payment.received'
    // Clientes
    | 'client.inactive_alert'
    | 'client.birthday'

export interface WebhookResponse {
    success: boolean
    message?: string
    data?: Record<string, any>
    error?: string
}

export interface WebhookOptions {
    timeout?: number      // Default: 30000 (30s)
    retries?: number      // Default: 3
    retryDelay?: number   // Default: 1000 (1s)
}

// ============================================
// PAYLOADS - CHAT
// ============================================

export interface ChatMessagePayload {
    session_id: string
    message_id?: string
    content: string
    source: 'website' | 'whatsapp'
    timestamp: string
    client_info?: {
        name?: string
        phone?: string
        email?: string
    }
    metadata?: Record<string, any>
}

// ============================================
// PAYLOADS - LEADS
// ============================================

export interface LeadCreatedPayload {
    lead_id: string
    nome: string
    telefone: string
    email?: string
    endereco?: string
    cidade?: string
    cep?: string
    bedrooms?: number
    bathrooms?: number
    service_type?: string
    frequency?: string
    source: 'website' | 'whatsapp' | 'manual'
    session_id?: string
    created_at: string
}

export interface LeadUpdatedPayload {
    lead_id: string
    changes: Record<string, any>
    updated_at: string
}

export interface LeadConvertedPayload {
    lead_id: string
    client_id: string
    converted_at: string
}

// ============================================
// PAYLOADS - AGENDAMENTOS
// ============================================

export interface AppointmentCreatedPayload {
    appointment_id: string
    client_id: string
    client_name: string
    client_phone: string
    client_email?: string
    service_type: 'visit' | 'regular' | 'deep' | 'move_in_out' | 'office' | 'airbnb'
    date: string           // YYYY-MM-DD
    time_start: string     // HH:MM
    time_end?: string      // HH:MM
    duration_minutes: number
    address: string
    price?: number
    notes?: string
    source: 'chat' | 'admin' | 'recurrence'
    created_at: string
}

export interface AppointmentConfirmedPayload {
    appointment_id: string
    client_id: string
    client_name: string
    client_phone: string
    date: string
    time_start: string
    confirmed_at: string
}

export interface AppointmentCompletedPayload {
    appointment_id: string
    client_id: string
    client_name: string
    client_phone: string
    service_type: string
    date: string
    duration_actual?: number
    price: number
    completed_at: string
}

export interface AppointmentCancelledPayload {
    appointment_id: string
    client_id: string
    client_name: string
    client_phone: string
    date: string
    time_start: string
    reason?: string
    cancelled_by: 'client' | 'admin'
    late_cancellation: boolean  // < 24h
    cancelled_at: string
}

export interface AppointmentRescheduledPayload {
    appointment_id: string
    client_id: string
    client_name: string
    client_phone: string
    old_date: string
    old_time: string
    new_date: string
    new_time: string
    rescheduled_at: string
}

// ============================================
// PAYLOADS - FEEDBACK
// ============================================

export interface FeedbackReceivedPayload {
    feedback_id: string
    appointment_id: string
    client_id: string
    client_name: string
    client_phone: string
    rating: 1 | 2 | 3 | 4 | 5
    comment?: string
    service_type: string
    service_date: string
    received_at: string
}

// ============================================
// PAYLOADS - PAGAMENTOS
// ============================================

export interface PaymentReceivedPayload {
    payment_id: string
    appointment_id?: string
    client_id: string
    client_name: string
    amount: number
    method: 'cash' | 'zelle' | 'other'
    notes?: string
    received_at: string
}

// ============================================
// PAYLOADS - CLIENTES
// ============================================

export interface ClientInactiveAlertPayload {
    client_id: string
    client_name: string
    client_phone: string
    client_email?: string
    last_service_date: string
    days_inactive: number
    total_services: number
    lifetime_value: number
}

export interface ClientBirthdayPayload {
    client_id: string
    client_name: string
    client_phone: string
    client_email?: string
    birthday: string
}

// ============================================
// UNION TYPE DE TODOS OS PAYLOADS
// ============================================

export type WebhookPayload =
    | ChatMessagePayload
    | LeadCreatedPayload
    | LeadUpdatedPayload
    | LeadConvertedPayload
    | AppointmentCreatedPayload
    | AppointmentConfirmedPayload
    | AppointmentCompletedPayload
    | AppointmentCancelledPayload
    | AppointmentRescheduledPayload
    | FeedbackReceivedPayload
    | PaymentReceivedPayload
    | ClientInactiveAlertPayload
    | ClientBirthdayPayload

// types/carol.ts

export interface ChatMessage {
    id: string
    role: 'user' | 'assistant' | 'system' | 'tool'
    content: string
    timestamp: string
    status?: 'sending' | 'sent' | 'error' | 'processing'
    tool_calls?: ToolCall[]
    tool_call_id?: string // Para mensagens do tipo 'tool'
    name?: string // Para mensagens do tipo 'tool'
}

export interface ToolCall {
    id: string
    type: 'function'
    function: {
        name: string
        arguments: string
    }
}

export interface ChatResponse {
    message: string
    session_id: string
    tool_calls_executed: number
    timestamp: string
}

export interface CarolConfig {
    model: string
    temperature: number
    max_tokens: number
}

// Tool-specific types
export interface CheckAvailabilityParams {
    date: string // YYYY-MM-DD
    duration_minutes: number // 120, 180, 240
}

export interface CalculatePriceParams {
    bedrooms: number
    bathrooms: number
    service_type: 'regular' | 'deep' | 'move_in_out' | 'post_construction'
    frequency?: 'one_time' | 'weekly' | 'biweekly' | 'monthly'
    addons?: Array<'cabinets' | 'fridge' | 'oven' | 'laundry' | 'windows'>
}

export interface CreateLeadParams {
    name: string
    phone: string
    email?: string
    address?: string
    zip_code?: string
    notes?: string
    canal_preferencia?: 'sms' | 'whatsapp'
}

export interface CreateBookingParams {
    cliente_id: string
    date: string
    time_slot: string // HH:MM
    service_type: string
    duration_minutes: number
    total_price: number
    special_instructions?: string
    canal_preferencia?: 'sms' | 'whatsapp'
}

export interface CheckZipCoverageParams {
    zip_code: string
}

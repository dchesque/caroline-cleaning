import type { WebhookEventType } from '@/types/webhook'

// ============================================
// CONFIGURAÇÃO BASE
// ============================================

const getBaseUrl = (): string => {
    const url = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL
    if (!url) {
        console.warn('[Webhooks] NEXT_PUBLIC_N8N_WEBHOOK_URL não configurada')
        return ''
    }
    // Remove trailing slash se existir
    return url.replace(/\/$/, '')
}

// ============================================
// MAPEAMENTO DE ENDPOINTS
// ============================================

export const WEBHOOK_ENDPOINTS: Record<WebhookEventType, string> = {
    // Chat
    'chat.message_received': '/chat/message-received',

    // Leads
    'lead.created': '/leads/created',
    'lead.updated': '/leads/updated',
    'lead.converted': '/leads/converted',

    // Agendamentos
    'appointment.created': '/appointments/created',
    'appointment.confirmed': '/appointments/confirmed',
    'appointment.completed': '/appointments/completed',
    'appointment.cancelled': '/appointments/cancelled',
    'appointment.rescheduled': '/appointments/rescheduled',

    // Feedback
    'feedback.received': '/feedback/received',

    // Pagamentos
    'payment.received': '/payments/received',

    // Clientes
    'client.inactive_alert': '/clients/inactive-alert',
    'client.birthday': '/clients/birthday',
}

// ============================================
// FUNÇÕES HELPER
// ============================================

/**
 * Retorna a URL completa do webhook para um evento
 */
export function getWebhookUrl(event: WebhookEventType): string {
    const baseUrl = getBaseUrl()
    const endpoint = WEBHOOK_ENDPOINTS[event]

    if (!baseUrl) {
        return ''
    }

    return `${baseUrl}${endpoint}`
}

/**
 * Verifica se os webhooks estão configurados
 */
export function isWebhookConfigured(): boolean {
    return !!process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL
}

/**
 * Retorna o secret para autenticação
 */
export function getWebhookSecret(): string {
    return process.env.N8N_WEBHOOK_SECRET || ''
}

// ============================================
// CONFIGURAÇÕES DE TIMEOUT POR TIPO
// ============================================

export const WEBHOOK_TIMEOUTS: Partial<Record<WebhookEventType, number>> = {
    // Chat precisa de mais tempo (IA processando)
    'chat.message_received': 60000, // 60s

    // Outros usam default (30s)
}

/**
 * Retorna o timeout para um evento específico
 */
export function getWebhookTimeout(event: WebhookEventType): number {
    return WEBHOOK_TIMEOUTS[event] || 30000 // Default: 30s
}

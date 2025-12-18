import {
    getWebhookUrl,
    getWebhookSecret,
    getWebhookTimeout,
    isWebhookConfigured,
} from '@/lib/config/webhooks'
import type {
    WebhookEventType,
    WebhookPayload,
    WebhookResponse,
    WebhookOptions,
} from '@/types/webhook'

// ============================================
// CONFIGURAÇÕES PADRÃO
// ============================================

const DEFAULT_OPTIONS: Required<WebhookOptions> = {
    timeout: 30000,    // 30 segundos
    retries: 3,        // 3 tentativas
    retryDelay: 1000,  // 1 segundo entre tentativas
}

// ============================================
// FUNÇÃO DE DELAY
// ============================================

const delay = (ms: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, ms))

// ============================================
// CLASSE PRINCIPAL
// ============================================

class WebhookService {
    /**
     * Envia um webhook para o n8n
     */
    async send<T extends WebhookPayload>(
        event: WebhookEventType,
        payload: T,
        options?: WebhookOptions
    ): Promise<WebhookResponse> {
        // Verificar se está configurado
        if (!isWebhookConfigured()) {
            console.warn(`[Webhook] n8n não configurado. Evento ignorado: ${event}`)
            return {
                success: false,
                error: 'Webhook URL não configurada',
            }
        }

        const url = getWebhookUrl(event)
        if (!url) {
            return {
                success: false,
                error: 'URL do webhook não encontrada',
            }
        }

        const config: Required<WebhookOptions> = {
            ...DEFAULT_OPTIONS,
            timeout: getWebhookTimeout(event),
            ...options,
        }

        // Tentar com retry
        let lastError: Error | null = null

        for (let attempt = 1; attempt <= config.retries; attempt++) {
            try {
                const result = await this.executeRequest(url, event, payload, config.timeout)

                console.log(`[Webhook] ✅ ${event} enviado com sucesso (tentativa ${attempt})`)
                return result

            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error))
                console.warn(
                    `[Webhook] ⚠️ ${event} falhou (tentativa ${attempt}/${config.retries}):`,
                    lastError.message
                )

                // Se não for a última tentativa, aguardar antes de retry
                if (attempt < config.retries) {
                    await delay(config.retryDelay)
                }
            }
        }

        // Todas as tentativas falharam
        console.error(`[Webhook] ❌ ${event} falhou após ${config.retries} tentativas`)
        return {
            success: false,
            error: lastError?.message || 'Erro desconhecido',
        }
    }

    /**
     * Executa a requisição HTTP
     */
    private async executeRequest<T extends WebhookPayload>(
        url: string,
        event: WebhookEventType,
        payload: T,
        timeout: number
    ): Promise<WebhookResponse> {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Secret': getWebhookSecret(),
                    'X-Webhook-Event': event,
                    'X-Webhook-Timestamp': new Date().toISOString(),
                },
                body: JSON.stringify({
                    event,
                    timestamp: new Date().toISOString(),
                    data: payload,
                }),
                signal: controller.signal,
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            // Tentar parsear resposta JSON
            let data: Record<string, any> | undefined
            try {
                data = await response.json()
            } catch {
                // Resposta não é JSON, tudo bem
            }

            return {
                success: true,
                data,
            }

        } catch (error) {
            clearTimeout(timeoutId)

            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error(`Timeout após ${timeout}ms`)
            }

            throw error
        }
    }

    /**
     * Verifica se o serviço de webhooks está disponível
     */
    isAvailable(): boolean {
        return isWebhookConfigured()
    }
}

// ============================================
// INSTÂNCIA SINGLETON
// ============================================

export const webhookService = new WebhookService()

// ============================================
// FUNÇÕES HELPER TIPADAS
// ============================================

// Chat
export const sendChatMessage = (payload: import('@/types/webhook').ChatMessagePayload) =>
    webhookService.send('chat.message_received', payload)

// Leads
export const notifyLeadCreated = (payload: import('@/types/webhook').LeadCreatedPayload) =>
    webhookService.send('lead.created', payload)

export const notifyLeadUpdated = (payload: import('@/types/webhook').LeadUpdatedPayload) =>
    webhookService.send('lead.updated', payload)

export const notifyLeadConverted = (payload: import('@/types/webhook').LeadConvertedPayload) =>
    webhookService.send('lead.converted', payload)

// Agendamentos
export const notifyAppointmentCreated = (payload: import('@/types/webhook').AppointmentCreatedPayload) =>
    webhookService.send('appointment.created', payload)

export const notifyAppointmentConfirmed = (payload: import('@/types/webhook').AppointmentConfirmedPayload) =>
    webhookService.send('appointment.confirmed', payload)

export const notifyAppointmentCompleted = (payload: import('@/types/webhook').AppointmentCompletedPayload) =>
    webhookService.send('appointment.completed', payload)

export const notifyAppointmentCancelled = (payload: import('@/types/webhook').AppointmentCancelledPayload) =>
    webhookService.send('appointment.cancelled', payload)

export const notifyAppointmentRescheduled = (payload: import('@/types/webhook').AppointmentRescheduledPayload) =>
    webhookService.send('appointment.rescheduled', payload)

// Feedback
export const notifyFeedbackReceived = (payload: import('@/types/webhook').FeedbackReceivedPayload) =>
    webhookService.send('feedback.received', payload)

// Pagamentos
export const notifyPaymentReceived = (payload: import('@/types/webhook').PaymentReceivedPayload) =>
    webhookService.send('payment.received', payload)

// Clientes
export const notifyClientInactive = (payload: import('@/types/webhook').ClientInactiveAlertPayload) =>
    webhookService.send('client.inactive_alert', payload)

export const notifyClientBirthday = (payload: import('@/types/webhook').ClientBirthdayPayload) =>
    webhookService.send('client.birthday', payload)

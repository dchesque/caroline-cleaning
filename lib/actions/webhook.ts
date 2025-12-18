'use server'

import { webhookService } from '@/lib/services/webhookService'
import type { WebhookEventType, WebhookPayload, WebhookResponse } from '@/types/webhook'

/**
 * Server Action para enviar webhooks de forma segura (sem expor secrets no client)
 */
export async function sendWebhookAction<T extends WebhookPayload>(
    event: WebhookEventType,
    payload: T
): Promise<WebhookResponse> {
    try {
        return await webhookService.send(event, payload)
    } catch (error) {
        console.error(`[Action] Erro ao enviar webhook ${event}:`, error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro ao processar requisição',
        }
    }
}

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
import { notify, notifyOwner } from '@/lib/notifications'

// ============================================
// CONFIGURAÇÕES PADRÃO
// ============================================

const DEFAULT_OPTIONS: Required<WebhookOptions> = {
    timeout: 30000,    // 30 segundos
    retries: 3,        // 3 tentativas
    retryDelay: 1000,  // 1 segundo entre tentativas
}

const delay = (ms: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, ms))

class WebhookService {
    /**
     * Envia um webhook ou notificação native (Twilio)
     */
    async send<T extends WebhookPayload>(
        event: WebhookEventType,
        payload: T,
        options?: WebhookOptions
    ): Promise<WebhookResponse> {
        // 1. Desviar eventos de agendamento e leads para notificações nativas (Twilio)
        const notificationMapping: any = {
            'appointment.created': 'appointment_created',
            'appointment.confirmed': 'appointment_confirmed',
            'appointment.cancelled': 'appointment_cancelled',
            'appointment.rescheduled': 'appointment_rescheduled',
            'lead.created': 'owner_new_customer',
        };

        const notificationType = notificationMapping[event];

        if (notificationType) {
            console.log(`[WebhookService] ⚡ Notificação nativa Twilio para ${event}`);
            const data = payload as any;

            // Gatilho para o Proprietário (WhatsApp)
            if (event === 'appointment.created') {
                await notifyOwner('owner_new_appointment', {
                    name: data.client_name || data.nome,
                    phone: data.client_phone || data.telefone,
                    service: data.service_type || data.tipo,
                    date: data.date || data.data,
                    time: data.time_start || data.horario
                });
            }

            if (event === 'lead.created') {
                await notifyOwner('owner_new_customer', {
                    name: data.nome,
                    phone: data.telefone
                });
                return { success: true, data: { channel: 'twilio_whatsapp', target: 'owner' } };
            }

            // Gatilho para o Cliente (SMS)
            const recipient = data.client_phone || data.telefone;

            if (recipient) {
                try {
                    const result = await notify(recipient, notificationType, {
                        name: data.client_name || data.nome,
                        date: data.date || data.data,
                        time: data.time_start || data.horario,
                        service: data.service_type || data.tipo
                    }) as any;

                    if (result.success) {
                        return { success: true, data: { channel: 'twilio', sid: result.messageSid } };
                    }
                } catch (e) {
                    console.error(`[WebhookService] Erro Twilio para ${event}:`, e);
                }
            }
        }

        // 2. Fallback para n8n
        if (!isWebhookConfigured()) {
            return {
                success: !!notificationType, // Sucesso se já tentamos o Twilio
                error: notificationType ? undefined : 'n8n not configured',
            }
        }

        const url = getWebhookUrl(event);
        if (!url) return { success: true };

        const config: Required<WebhookOptions> = {
            ...DEFAULT_OPTIONS,
            timeout: getWebhookTimeout(event),
            ...options,
        }

        let lastError: Error | null = null;
        for (let attempt = 1; attempt <= config.retries; attempt++) {
            try {
                const result = await this.executeRequest(url, event, payload, config.timeout);
                return result;
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                if (attempt < config.retries) await delay(config.retryDelay);
            }
        }

        return { success: false, error: lastError?.message || 'Error sending to n8n' };
    }

    private async executeRequest<T extends WebhookPayload>(
        url: string,
        event: WebhookEventType,
        payload: T,
        timeout: number
    ): Promise<WebhookResponse> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Secret': getWebhookSecret(),
                    'X-Webhook-Event': event,
                    'X-Webhook-Timestamp': new Date().toISOString(),
                },
                body: JSON.stringify({ event, timestamp: new Date().toISOString(), data: payload }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            let data: any;
            try { data = await response.json(); } catch { }
            return { success: true, data };
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    isAvailable(): boolean {
        return isWebhookConfigured();
    }
}

export const webhookService = new WebhookService();

// Agendamentos
export const notifyAppointmentCreated = (payload: any) => webhookService.send('appointment.created', payload)
export const notifyAppointmentConfirmed = (payload: any) => webhookService.send('appointment.confirmed', payload)
export const notifyAppointmentCompleted = (payload: any) => webhookService.send('appointment.completed', payload)
export const notifyAppointmentCancelled = (payload: any) => webhookService.send('appointment.cancelled', payload)
export const notifyAppointmentRescheduled = (payload: any) => webhookService.send('appointment.rescheduled', payload)

// Leads
export const notifyLeadCreated = (payload: any) => webhookService.send('lead.created', payload)
export const notifyLeadUpdated = (payload: any) => webhookService.send('lead.updated', payload)
export const notifyLeadConverted = (payload: any) => webhookService.send('lead.converted', payload)

// Feedback
export const notifyFeedbackReceived = (payload: any) => webhookService.send('feedback.received', payload)
export const notifyPaymentReceived = (payload: any) => webhookService.send('payment.received', payload)

'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { sendWebhookAction } from '@/lib/actions/webhook'
import type {
    WebhookEventType,
    WebhookPayload,
    WebhookResponse,
    WebhookOptions,
    ChatMessagePayload,
    LeadCreatedPayload,
    AppointmentCreatedPayload,
    AppointmentCompletedPayload,
    AppointmentCancelledPayload,
    FeedbackReceivedPayload,
    PaymentReceivedPayload,
} from '@/types/webhook'

// ============================================
// HOOK GENÉRICO
// ============================================

interface UseWebhookResult<T extends WebhookPayload> {
    send: (payload: T) => Promise<WebhookResponse>
    isLoading: boolean
    error: string | null
    lastResponse: WebhookResponse | null
}

export function useWebhook<T extends WebhookPayload>(
    event: WebhookEventType,
    options?: WebhookOptions & {
        showToast?: boolean
        successMessage?: string
        errorMessage?: string
    }
): UseWebhookResult<T> {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [lastResponse, setLastResponse] = useState<WebhookResponse | null>(null)

    const {
        showToast = false,
        successMessage = 'Operação realizada com sucesso',
        errorMessage = 'Erro ao processar operação',
    } = options || {}

    const send = useCallback(async (payload: T): Promise<WebhookResponse> => {
        setIsLoading(true)
        setError(null)

        try {
            // Usa Server Action para segurança
            const response = await sendWebhookAction(event, payload)
            setLastResponse(response)

            if (response.success) {
                if (showToast) {
                    toast.success(successMessage)
                }
            } else {
                setError(response.error || 'Erro desconhecido')
                if (showToast) {
                    toast.error(errorMessage)
                }
            }

            return response
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido'
            setError(errorMsg)
            setLastResponse({ success: false, error: errorMsg })

            if (showToast) {
                toast.error(errorMessage)
            }

            return { success: false, error: errorMsg }
        } finally {
            setIsLoading(false)
        }
    }, [event, showToast, successMessage, errorMessage])

    return { send, isLoading, error, lastResponse }
}

// ============================================
// HOOKS ESPECÍFICOS
// ============================================

/**
 * Hook para enviar mensagens do chat
 */
export function useSendChatMessage(options?: WebhookOptions) {
    return useWebhook<ChatMessagePayload>('chat.message_received', {
        ...options,
        showToast: false, // Chat não mostra toast
    })
}

/**
 * Hook para notificar criação de lead
 */
export function useNotifyLeadCreated(options?: WebhookOptions) {
    return useWebhook<LeadCreatedPayload>('lead.created', {
        ...options,
        showToast: true,
        successMessage: 'Lead registrado com sucesso',
        errorMessage: 'Erro ao registrar lead',
    })
}

/**
 * Hook para notificar criação de agendamento
 */
export function useNotifyAppointmentCreated(options?: WebhookOptions) {
    return useWebhook<AppointmentCreatedPayload>('appointment.created', {
        ...options,
        showToast: true,
        successMessage: 'Agendamento criado com sucesso',
        errorMessage: 'Erro ao criar agendamento',
    })
}

/**
 * Hook para notificar conclusão de agendamento
 */
export function useNotifyAppointmentCompleted(options?: WebhookOptions) {
    return useWebhook<AppointmentCompletedPayload>('appointment.completed', {
        ...options,
        showToast: true,
        successMessage: 'Serviço marcado como concluído',
        errorMessage: 'Erro ao concluir serviço',
    })
}

/**
 * Hook para notificar cancelamento
 */
export function useNotifyAppointmentCancelled(options?: WebhookOptions) {
    return useWebhook<AppointmentCancelledPayload>('appointment.cancelled', {
        ...options,
        showToast: true,
        successMessage: 'Agendamento cancelado',
        errorMessage: 'Erro ao cancelar agendamento',
    })
}

/**
 * Hook para notificar feedback recebido
 */
export function useNotifyFeedbackReceived(options?: WebhookOptions) {
    return useWebhook<FeedbackReceivedPayload>('feedback.received', {
        ...options,
        showToast: false,
    })
}

/**
 * Hook para notificar pagamento recebido
 */
export function useNotifyPaymentReceived(options?: WebhookOptions) {
    return useWebhook<PaymentReceivedPayload>('payment.received', {
        ...options,
        showToast: true,
        successMessage: 'Pagamento registrado',
        errorMessage: 'Erro ao registrar pagamento',
    })
}

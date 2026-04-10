// Internal WhatsApp notifications to admin staff via self-hosted Evolution API.
// All functions catch errors internally and never throw.
// No-ops silently if EVOLUTION_API_URL / EVOLUTION_API_KEY / EVOLUTION_INSTANCE_NAME are missing.

import { createAdminClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export type EvolutionEventType =
    | 'newLead'
    | 'newAppointment'
    | 'appointmentConfirmed'
    | 'paymentReceived'
    | 'lowRating'

function isConfigured(): boolean {
    return !!(
        process.env.EVOLUTION_API_URL &&
        process.env.EVOLUTION_API_KEY &&
        process.env.EVOLUTION_INSTANCE_NAME
    )
}

// WhatsApp-formatted message templates (PT-BR)
const TEMPLATES: Record<EvolutionEventType, (d: Record<string, any>) => string> = {
    newLead: (d) =>
        `👤 *Novo Lead!*\n\n` +
        `*Nome:* ${d.name || 'N/A'}\n` +
        `*Telefone:* ${d.phone || 'N/A'}\n` +
        (d.service ? `*Interesse:* ${d.service}\n` : '') +
        (d.source ? `*Origem:* ${d.source}\n` : '') +
        `\n_Acesse o painel para ver detalhes._`,

    newAppointment: (d) =>
        `🗓️ *Novo Agendamento!*\n\n` +
        `*Cliente:* ${d.name || 'N/A'}\n` +
        `*Serviço:* ${d.service || 'N/A'}\n` +
        `*Data:* ${d.date || 'N/A'}\n` +
        `*Hora:* ${d.time || 'N/A'}\n` +
        (d.phone ? `*Telefone:* ${d.phone}\n` : '') +
        (d.address ? `*Endereço:* ${d.address}\n` : ''),

    appointmentConfirmed: (d) =>
        `✅ *Agendamento Confirmado!*\n\n` +
        `*Cliente:* ${d.name || 'N/A'}\n` +
        `*Serviço:* ${d.service || 'N/A'}\n` +
        `*Data:* ${d.date || 'N/A'}\n` +
        `*Hora:* ${d.time || 'N/A'}\n`,

    paymentReceived: (d) =>
        `💰 *Pagamento Recebido!*\n\n` +
        `*Cliente:* ${d.name || 'N/A'}\n` +
        `*Valor:* $${typeof d.amount === 'number' ? d.amount.toFixed(2) : d.amount || '0.00'}\n` +
        (d.method ? `*Forma:* ${d.method}\n` : '') +
        (d.description ? `*Descrição:* ${d.description}\n` : ''),

    lowRating: (d) =>
        `⚠️ *Avaliação Baixa!*\n\n` +
        `*Cliente:* ${d.name || 'N/A'}\n` +
        `*Nota:* ${'⭐'.repeat(Math.max(1, Number(d.rating) || 1))} (${d.rating}/5)\n` +
        (d.comment ? `*Comentário:* "${d.comment}"\n` : '') +
        (d.service ? `*Serviço:* ${d.service}\n` : ''),
}

// Maps EvolutionEventType → notification_types JSONB key in user_profiles
const PREF_KEY: Record<EvolutionEventType, string> = {
    newLead:              'newLead',
    newAppointment:       'newAppointment',
    appointmentConfirmed: 'newAppointment', // no separate pref for confirmations
    paymentReceived:      'paymentReceived',
    lowRating:            'lowRating',
}

async function sendText(to: string, text: string): Promise<void> {
    if (!isConfigured()) return
    const url = `${process.env.EVOLUTION_API_URL}/message/sendText/${process.env.EVOLUTION_INSTANCE_NAME}`
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                apikey: process.env.EVOLUTION_API_KEY!,
            },
            body: JSON.stringify({ number: to, text }),
            signal: AbortSignal.timeout(10_000),
        })
        if (!res.ok) {
            logger.warn('[Evolution] send failed', { status: res.status, to })
        } else {
            logger.info('[Evolution] sent', { to })
        }
    } catch (err) {
        logger.warn('[Evolution] send error (swallowed)', { err: String(err), to })
    }
}

async function getEligiblePhones(eventType: EvolutionEventType): Promise<string[]> {
    const prefKey = PREF_KEY[eventType]
    try {
        const { data } = await createAdminClient()
            .from('user_profiles')
            .select('phone, notification_types, sms_notifications')
            .in('role', ['admin', 'manager'])

        return (data ?? [])
            .filter((p: any) => p.phone && p.sms_notifications && p.notification_types?.[prefKey])
            .map((p: any) => p.phone as string)
    } catch (err) {
        logger.warn('[Evolution] getEligiblePhones error (swallowed)', { err: String(err) })
        return []
    }
}

/**
 * Format a message for the given event type and send it to all eligible admins.
 *
 * Eligible = role is admin/manager + sms_notifications = true + notification_types[key] = true.
 * EVOLUTION_ADMIN_PHONE (if set) is always included as a catch-all regardless of profile prefs.
 *
 * Fire-and-forget safe: call without await or with await — never throws, never blocks callers.
 */
export async function notifyAdmins(
    eventType: EvolutionEventType,
    data: Record<string, any>
): Promise<void> {
    if (!isConfigured()) return
    try {
        const text = TEMPLATES[eventType]?.(data)
        if (!text) return

        const profilePhones = await getEligiblePhones(eventType)
        const catchAll = process.env.EVOLUTION_ADMIN_PHONE
        const phones = catchAll
            ? Array.from(new Set([...profilePhones, catchAll]))
            : profilePhones

        if (phones.length === 0) {
            logger.info('[Evolution] no eligible recipients', { eventType })
            return
        }

        await Promise.allSettled(phones.map((p) => sendText(p, text)))
    } catch (err) {
        logger.warn('[Evolution] notifyAdmins error (swallowed)', { err: String(err), eventType })
    }
}

// lib/tracking/meta-capi.ts
//
// Shared Meta Conversions API (CAPI) sender + tracking_events recorder.
// Used by both the public /api/tracking/event route and the internal
// fireServerConversion helper, so internal fires do NOT loopback via HTTP.

import { createAdminClient } from '@/lib/supabase/server'
import { hashData, normalizePhone } from '@/lib/tracking/utils'
import type { UserData, CustomData } from '@/lib/tracking/types'
import { logger } from '@/lib/logger'

export interface MetaCapiEventInput {
    eventName: string
    eventId: string
    eventTime?: number
    eventSourceUrl?: string
    actionSource?: string
    userData?: UserData
    customData?: CustomData
    clientIp?: string
    userAgent?: string
    referrer?: string
}

interface MetaSettings {
    metaEnabled: boolean
    metaCapiEnabled: boolean
    pixelId: string
    accessToken: string
    testEventCode: string
}

async function loadMetaSettings(): Promise<MetaSettings> {
    const supabase = createAdminClient()
    const { data: configs } = await supabase
        .from('configuracoes')
        .select('chave, valor')
        .in('chave', [
            'tracking_meta_enabled',
            'tracking_meta_pixel_id',
            'tracking_meta_access_token',
            'tracking_meta_capi_enabled',
            'tracking_meta_test_event_code',
        ])

    const getString = (key: string): string => {
        const config = configs?.find((c) => c.chave === key)
        const raw = config?.valor
        if (raw == null) return ''
        if (typeof raw === 'string') return raw.replace(/^"|"$/g, '')
        if (typeof raw === 'number' || typeof raw === 'boolean') return String(raw)
        return ''
    }
    const getBool = (key: string): boolean => {
        const config = configs?.find((c) => c.chave === key)
        const raw = config?.valor
        if (typeof raw === 'boolean') return raw
        if (typeof raw === 'number') return raw === 1
        if (typeof raw === 'string') {
            const v = raw.replace(/^"|"$/g, '').toLowerCase()
            return v === 'true' || v === '1'
        }
        return false
    }

    return {
        metaEnabled: getBool('tracking_meta_enabled'),
        metaCapiEnabled: getBool('tracking_meta_capi_enabled'),
        pixelId: getString('tracking_meta_pixel_id'),
        accessToken: getString('tracking_meta_access_token'),
        testEventCode: getString('tracking_meta_test_event_code'),
    }
}

function buildHashedUserData(userData: UserData | undefined, clientIp: string, userAgent: string): Record<string, unknown> {
    const hashed: Record<string, unknown> = {}
    if (userData?.email) hashed.em = [hashData(userData.email)]
    if (userData?.phone) hashed.ph = [hashData(normalizePhone(userData.phone))]
    if (userData?.first_name) hashed.fn = [hashData(userData.first_name)]
    if (userData?.last_name) hashed.ln = [hashData(userData.last_name)]
    if (userData?.city) hashed.ct = [hashData(userData.city)]
    if (userData?.state) hashed.st = [hashData(userData.state)]
    if (userData?.zip_code) hashed.zp = [hashData(userData.zip_code)]
    if (userData?.country) hashed.country = [hashData(userData.country)]
    if (userData?.external_id) hashed.external_id = [hashData(userData.external_id)]
    if (userData?.fbc) hashed.fbc = userData.fbc
    if (userData?.fbp) hashed.fbp = userData.fbp
    hashed.client_ip_address = clientIp
    hashed.client_user_agent = userAgent
    return hashed
}

async function sendToMeta(event: MetaCapiEventInput, cfg: MetaSettings): Promise<boolean> {
    const clientIp = event.clientIp || '0.0.0.0'
    const userAgent = event.userAgent || ''
    const hashedUserData = buildHashedUserData(event.userData, clientIp, userAgent)

    const metaPayload = {
        data: [
            {
                event_name: event.eventName,
                event_time: event.eventTime ?? Math.floor(Date.now() / 1000),
                event_id: event.eventId,
                event_source_url: event.eventSourceUrl || event.referrer || '',
                action_source: event.actionSource || 'website',
                user_data: hashedUserData,
                custom_data: event.customData || {},
            },
        ],
        ...(cfg.testEventCode && { test_event_code: cfg.testEventCode }),
    }

    const url = `https://graph.facebook.com/v18.0/${cfg.pixelId}/events?access_token=${cfg.accessToken}`

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(metaPayload),
        })

        if (!response.ok) {
            const body = await response.json().catch(() => ({}))
            logger.error('Meta CAPI Error', {
                status: response.status,
                errorType: body?.error?.type,
                errorMessage: body?.error?.message,
                eventName: event.eventName,
                eventId: event.eventId,
            })
            return false
        }
        return true
    } catch (err) {
        logger.error('Meta CAPI Exception', {
            error: err instanceof Error ? err.message : String(err),
            eventName: event.eventName,
            eventId: event.eventId,
        })
        return false
    }
}

function hashIp(ip: string): string {
    return hashData(ip).substring(0, 16)
}

/**
 * Full pipeline: load settings, send to Meta CAPI if enabled, and upsert
 * the event into tracking_events (idempotent on event_id).
 */
export async function recordTrackingEvent(event: MetaCapiEventInput): Promise<{ metaSent: boolean }> {
    const cfg = await loadMetaSettings()

    let metaSent = false
    if (cfg.metaEnabled && cfg.metaCapiEnabled && cfg.pixelId && cfg.accessToken) {
        metaSent = await sendToMeta(event, cfg)
    }

    const supabase = createAdminClient()
    const clientIp = event.clientIp || '0.0.0.0'
    const { error: dbError } = await supabase
        .from('tracking_events')
        .upsert(
            {
                event_name: event.eventName,
                event_id: event.eventId,
                user_email_hash: event.userData?.email ? hashData(event.userData.email) : null,
                user_phone_hash: event.userData?.phone ? hashData(normalizePhone(event.userData.phone)) : null,
                ip_address: hashIp(clientIp),
                user_agent: event.userAgent || '',
                fbc: event.userData?.fbc || null,
                fbp: event.userData?.fbp || null,
                custom_data: event.customData || {},
                page_url: event.eventSourceUrl || event.referrer || null,
                referrer: event.referrer || null,
                sent_to_meta: metaSent,
            },
            { onConflict: 'event_id', ignoreDuplicates: false }
        )

    if (dbError) {
        logger.error('Error saving tracking event', {
            error: dbError.message,
            eventId: event.eventId,
            eventName: event.eventName,
        })
    }

    return { metaSent }
}

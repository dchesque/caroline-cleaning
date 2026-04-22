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

interface MetaSendResult {
    ok: boolean
    status: number
    fbtraceId: string | null
    errorMessage: string | null
    responseBody: unknown
    attempts: number
}

const RETRIABLE_STATUS = new Set([408, 429, 500, 502, 503, 504])
const MAX_RETRIES = 1
const RETRY_DELAY_MS = 500

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
    if (clientIp && clientIp !== '0.0.0.0') hashed.client_ip_address = clientIp
    if (userAgent) hashed.client_user_agent = userAgent
    return hashed
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

async function sendToMeta(event: MetaCapiEventInput, cfg: MetaSettings): Promise<MetaSendResult> {
    const clientIp = event.clientIp || ''
    const userAgent = event.userAgent || ''
    const hashedUserData = buildHashedUserData(event.userData, clientIp, userAgent)

    // Empty strings in DB must not leak into the payload — Meta treats any
    // truthy test_event_code as "route to Test Events tab".
    const testCode = cfg.testEventCode?.trim() || ''

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
        ...(testCode ? { test_event_code: testCode } : {}),
    }

    // Pixel IDs arrive via JSONB and can be number or string — coerce to be
    // safe. Access token is trimmed defensively.
    const pixelId = String(cfg.pixelId).trim()
    const accessToken = cfg.accessToken.trim()
    const url = `https://graph.facebook.com/v18.0/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(accessToken)}`

    let attempts = 0
    let lastResult: MetaSendResult = {
        ok: false,
        status: 0,
        fbtraceId: null,
        errorMessage: 'no attempt',
        responseBody: null,
        attempts: 0,
    }

    while (attempts <= MAX_RETRIES) {
        attempts += 1
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(metaPayload),
            })

            const responseBody = await response.json().catch(() => null)
            const fbtraceId =
                (responseBody && typeof responseBody === 'object' && 'fbtrace_id' in responseBody
                    ? String((responseBody as { fbtrace_id?: unknown }).fbtrace_id ?? '')
                    : '') || null

            if (response.ok) {
                return {
                    ok: true,
                    status: response.status,
                    fbtraceId,
                    errorMessage: null,
                    responseBody,
                    attempts,
                }
            }

            const errObj =
                responseBody && typeof responseBody === 'object' && 'error' in responseBody
                    ? (responseBody as { error?: { type?: string; message?: string; code?: number } }).error
                    : undefined
            const errorMessage = errObj?.message || `HTTP ${response.status}`

            lastResult = {
                ok: false,
                status: response.status,
                fbtraceId,
                errorMessage,
                responseBody,
                attempts,
            }

            logger.error('Meta CAPI Error', {
                attempt: attempts,
                status: response.status,
                fbtrace_id: fbtraceId,
                errorType: errObj?.type,
                errorCode: errObj?.code,
                errorMessage,
                eventName: event.eventName,
                eventId: event.eventId,
            })

            // Retry only on transient errors; auth/validation errors are terminal.
            if (attempts <= MAX_RETRIES && RETRIABLE_STATUS.has(response.status)) {
                await sleep(RETRY_DELAY_MS)
                continue
            }
            return lastResult
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err)
            lastResult = {
                ok: false,
                status: 0,
                fbtraceId: null,
                errorMessage,
                responseBody: null,
                attempts,
            }
            logger.error('Meta CAPI Exception', {
                attempt: attempts,
                error: errorMessage,
                eventName: event.eventName,
                eventId: event.eventId,
            })
            if (attempts <= MAX_RETRIES) {
                await sleep(RETRY_DELAY_MS)
                continue
            }
            return lastResult
        }
    }

    return lastResult
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

    let metaResult: MetaSendResult = {
        ok: false,
        status: 0,
        fbtraceId: null,
        errorMessage: null,
        responseBody: null,
        attempts: 0,
    }
    let skippedReason: string | null = null

    if (!cfg.metaEnabled) skippedReason = 'tracking_meta_enabled=false'
    else if (!cfg.metaCapiEnabled) skippedReason = 'tracking_meta_capi_enabled=false'
    else if (!cfg.pixelId) skippedReason = 'missing pixel_id'
    else if (!cfg.accessToken) skippedReason = 'missing access_token'

    if (!skippedReason) {
        metaResult = await sendToMeta(event, cfg)
    } else {
        metaResult.errorMessage = `skipped: ${skippedReason}`
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
                sent_to_meta: metaResult.ok,
                meta_http_status: metaResult.status || null,
                meta_fbtrace_id: metaResult.fbtraceId,
                meta_error: metaResult.errorMessage,
                meta_response: metaResult.responseBody as object | null,
                meta_attempts: metaResult.attempts,
                updated_at: new Date().toISOString(),
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

    return { metaSent: metaResult.ok }
}

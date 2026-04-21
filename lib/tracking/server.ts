// lib/tracking/server.ts
//
// Server-side conversion fire-and-forget helper. Called from chat handlers
// (state machine + lead-chat) so Meta CAPI receives milestones even when the
// client is blocked by an ad-blocker. Returns an eventId that the client is
// expected to fire via fbq with the same eventID to deduplicate.

import { generateEventId } from '@/lib/tracking/utils'
import type { TrackingEventName, UserData, CustomData } from '@/lib/tracking/types'
import { logger } from '@/lib/logger'

export interface ServerConversionInput {
    eventName: TrackingEventName
    userData?: UserData
    customData?: CustomData
    eventSourceUrl?: string
}

export interface ServerConversionResult {
    eventId: string
    eventName: TrackingEventName
    userData?: UserData
    customData?: CustomData
}

function resolveBaseUrl(): string {
    return (
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}` ||
        'http://localhost:3000'
    )
}

/**
 * Fires a conversion event to the internal /api/tracking/event endpoint
 * (which handles Meta CAPI + tracking_events DB log). Non-blocking: promise
 * rejection never propagates. Returns the generated eventId synchronously so
 * the caller can forward it to the client for dedup.
 */
export function fireServerConversion(input: ServerConversionInput): ServerConversionResult {
    const eventId = generateEventId()
    const result: ServerConversionResult = {
        eventId,
        eventName: input.eventName,
        userData: input.userData,
        customData: input.customData,
    }

    const secret = process.env.CRON_SECRET
    if (!secret) {
        logger.warn('[tracking/server] CRON_SECRET missing, skipping CAPI fire', {
            eventName: input.eventName,
        })
        return result
    }

    const url = `${resolveBaseUrl()}/api/tracking/event`
    const payload = {
        event_name: input.eventName,
        event_id: eventId,
        event_time: Math.floor(Date.now() / 1000),
        event_source_url: input.eventSourceUrl,
        user_data: input.userData,
        custom_data: input.customData,
    }

    // Fire-and-forget; any failure is logged but never throws.
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify(payload),
    })
        .then(async (res) => {
            if (!res.ok) {
                const body = await res.text().catch(() => '')
                logger.error('[tracking/server] CAPI fire failed', {
                    status: res.status,
                    eventName: input.eventName,
                    eventId,
                    body: body.slice(0, 300),
                })
            }
        })
        .catch((err) => {
            logger.error('[tracking/server] CAPI fire threw', {
                eventName: input.eventName,
                eventId,
                error: err instanceof Error ? err.message : String(err),
            })
        })

    return result
}

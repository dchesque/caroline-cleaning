// lib/tracking/server.ts
//
// Server-side conversion fire helper. Called from chat handlers (state machine
// + lead-chat) so Meta CAPI receives milestones even when the client is
// blocked by an ad-blocker. Returns an eventId that the client is expected to
// fire via fbq with the same eventID to deduplicate.
//
// The actual CAPI POST is scheduled via Next 15's `after()` so it runs AFTER
// the HTTP response is flushed but before the serverless function terminates
// — this preserves chat latency while guaranteeing delivery. Previously this
// was a plain `void recordTrackingEvent()` which could be cut off on Vercel
// mid-fetch, silently dropping events (observed in tracking_events: 0/5
// Schedule + 0/7 Lead reached Meta).

import { after } from 'next/server'
import { generateEventId } from '@/lib/tracking/utils'
import { recordTrackingEvent } from '@/lib/tracking/meta-capi'
import type { TrackingEventName, UserData, CustomData } from '@/lib/tracking/types'
import { logger } from '@/lib/logger'

export interface ServerConversionBrowserContext {
    fbc?: string
    fbp?: string
    clientIp?: string
    userAgent?: string
    eventSourceUrl?: string
    referrer?: string
}

export interface ServerConversionInput {
    eventName: TrackingEventName
    userData?: UserData
    customData?: CustomData
    eventSourceUrl?: string
    browserContext?: ServerConversionBrowserContext
}

export interface ServerConversionResult {
    eventId: string
    eventName: TrackingEventName
    userData?: UserData
    customData?: CustomData
}

/**
 * Fires a conversion event directly via Meta CAPI + tracking_events upsert.
 * Returns the generated eventId synchronously so the caller can forward it to
 * the client for dedup. The CAPI call itself is scheduled via `after()` —
 * guaranteed to run to completion on Vercel.
 */
export function fireServerConversion(input: ServerConversionInput): ServerConversionResult {
    const eventId = generateEventId()
    const result: ServerConversionResult = {
        eventId,
        eventName: input.eventName,
        userData: input.userData,
        customData: input.customData,
    }

    // Merge fbc/fbp from browserContext into userData so Meta CAPI receives
    // them in user_data (Meta matches events to browser sessions via these).
    const mergedUserData: UserData | undefined = input.userData || input.browserContext?.fbc || input.browserContext?.fbp
        ? {
              ...input.userData,
              ...(input.browserContext?.fbc ? { fbc: input.browserContext.fbc } : {}),
              ...(input.browserContext?.fbp ? { fbp: input.browserContext.fbp } : {}),
          }
        : undefined

    const eventSourceUrl = input.eventSourceUrl || input.browserContext?.eventSourceUrl
    const clientIp = input.browserContext?.clientIp
    const userAgent = input.browserContext?.userAgent
    const referrer = input.browserContext?.referrer

    const run = async () => {
        try {
            await recordTrackingEvent({
                eventName: input.eventName,
                eventId,
                eventTime: Math.floor(Date.now() / 1000),
                eventSourceUrl,
                userData: mergedUserData,
                customData: input.customData,
                clientIp,
                userAgent,
                referrer,
            })
        } catch (err) {
            logger.error('[tracking/server] recordTrackingEvent threw', {
                eventName: input.eventName,
                eventId,
                error: err instanceof Error ? err.message : String(err),
            })
        }
    }

    // `after()` is only callable inside a request scope (route handlers, etc).
    // If called outside (scripts, tests) fall back to fire-and-forget so the
    // module still works.
    try {
        after(run)
    } catch {
        void run()
    }

    return result
}

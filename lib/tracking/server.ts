// lib/tracking/server.ts
//
// Server-side conversion fire-and-forget helper. Called from chat handlers
// (state machine + lead-chat) so Meta CAPI receives milestones even when the
// client is blocked by an ad-blocker. Returns an eventId that the client is
// expected to fire via fbq with the same eventID to deduplicate.

import { generateEventId } from '@/lib/tracking/utils'
import { recordTrackingEvent } from '@/lib/tracking/meta-capi'
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

/**
 * Fires a conversion event directly via Meta CAPI + tracking_events upsert.
 * Non-blocking: promise rejection never propagates. Returns the generated
 * eventId synchronously so the caller can forward it to the client for dedup.
 */
export function fireServerConversion(input: ServerConversionInput): ServerConversionResult {
    const eventId = generateEventId()
    const result: ServerConversionResult = {
        eventId,
        eventName: input.eventName,
        userData: input.userData,
        customData: input.customData,
    }

    // Fire-and-forget; any failure is logged but never throws.
    void recordTrackingEvent({
        eventName: input.eventName,
        eventId,
        eventTime: Math.floor(Date.now() / 1000),
        eventSourceUrl: input.eventSourceUrl,
        userData: input.userData,
        customData: input.customData,
    }).catch((err) => {
        logger.error('[tracking/server] recordTrackingEvent threw', {
            eventName: input.eventName,
            eventId,
            error: err instanceof Error ? err.message : String(err),
        })
    })

    return result
}

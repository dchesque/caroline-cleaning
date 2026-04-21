// app/api/tracking/event/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { logger } from '@/lib/logger';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';
import { recordTrackingEvent } from '@/lib/tracking/meta-capi';
import type { UserData, CustomData } from '@/lib/tracking/types';

interface EventPayload {
    event_name: string;
    event_id: string;
    event_time?: number;
    event_source_url?: string;
    user_data?: UserData;
    custom_data?: CustomData;
    action_source?: string;
}

export async function POST(request: NextRequest) {
    // Server-to-server bypass of rate limit via internal bearer token
    const authHeader = request.headers.get('authorization') || '';
    const internalSecret = process.env.CRON_SECRET;
    let isInternal = false;

    if (internalSecret && authHeader.length > 0) {
        const expectedAuth = `Bearer ${internalSecret}`;
        if (
            authHeader.length === expectedAuth.length &&
            timingSafeEqual(Buffer.from(authHeader), Buffer.from(expectedAuth))
        ) {
            isInternal = true;
        }
    }

    // Public tracking endpoint: rate-limit by IP to prevent abuse while
    // allowing anonymous landing visitors to fire events (primary use case).
    if (!isInternal) {
        const ip = getClientIp(request);
        if (!checkRateLimit(ip, RATE_LIMITS.tracking)) {
            return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
        }
    }

    try {
        const body: EventPayload = await request.json();
        const { event_name, event_id, user_data, custom_data } = body;

        if (!event_name || !event_id) {
            return NextResponse.json(
                { error: 'event_name and event_id are required' },
                { status: 400 }
            );
        }

        const clientIp =
            request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            '0.0.0.0';
        const userAgent = request.headers.get('user-agent') || '';
        const referrer = request.headers.get('referer') || undefined;

        const { metaSent } = await recordTrackingEvent({
            eventName: event_name,
            eventId: event_id,
            eventTime: body.event_time,
            eventSourceUrl: body.event_source_url,
            actionSource: body.action_source,
            userData: user_data,
            customData: custom_data,
            clientIp,
            userAgent,
            referrer,
        });

        return NextResponse.json({
            success: true,
            event_id,
            meta_sent: metaSent,
        });
    } catch (error) {
        logger.error('Error processing tracking event', {
            error: error instanceof Error ? error.message : error,
        });
        return NextResponse.json(
            { error: 'Failed to process tracking event' },
            { status: 500 }
        );
    }
}

// app/api/tracking/event/route.ts

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { hashData, normalizePhone } from '@/lib/tracking/utils';
import { timingSafeEqual } from 'crypto';
import { logger } from '@/lib/logger';

interface EventPayload {
    event_name: string;
    event_id: string;
    event_time?: number;
    event_source_url?: string;
    user_data?: {
        email?: string;
        phone?: string;
        first_name?: string;
        last_name?: string;
        city?: string;
        state?: string;
        zip_code?: string;
        country?: string;
        external_id?: string;
        fbc?: string;
        fbp?: string;
    };
    custom_data?: {
        value?: number;
        currency?: string;
        content_name?: string;
        content_category?: string;
        content_ids?: string[];
        order_id?: string;
    };
    action_source?: string;
}

function hashIp(ip: string): string {
  return hashData(ip).substring(0, 16);
}

export async function POST(request: NextRequest) {
    // Auth: accept internal bearer token OR valid user session
    const authHeader = request.headers.get('authorization') || '';
    const internalSecret = process.env.CRON_SECRET;
    let isAuthorized = false;

    // Check internal bearer token (server-to-server calls)
    if (internalSecret && authHeader.length > 0) {
        const expectedAuth = `Bearer ${internalSecret}`;
        if (
            authHeader.length === expectedAuth.length &&
            timingSafeEqual(Buffer.from(authHeader), Buffer.from(expectedAuth))
        ) {
            isAuthorized = true;
        }
    }

    // Fall back to session auth (client-side calls from tracking-provider)
    if (!isAuthorized) {
        const supabaseAuth = await createClient();
        const { data: { user } } = await supabaseAuth.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        isAuthorized = true;
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

        const supabase = await createClient();

        // Buscar configurações de tracking
        const { data: configs } = await supabase
            .from('configuracoes')
            .select('chave, valor')
            .in('chave', [
                'tracking_meta_enabled',
                'tracking_meta_pixel_id',
                'tracking_meta_access_token',
                'tracking_meta_capi_enabled',
                'tracking_meta_test_event_code'
            ]);

        const getConfig = (key: string): string => {
            const config = configs?.find(c => c.chave === key);
            return config?.valor?.replace(/^"|"$/g, '') || '';
        };

        const metaEnabled = getConfig('tracking_meta_enabled') === 'true';
        const metaCapiEnabled = getConfig('tracking_meta_capi_enabled') === 'true';
        const pixelId = getConfig('tracking_meta_pixel_id');
        const accessToken = getConfig('tracking_meta_access_token');
        const testEventCode = getConfig('tracking_meta_test_event_code');

        // Capturar IP e User Agent
        const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            '0.0.0.0';
        const userAgent = request.headers.get('user-agent') || '';

        let metaSent = false;
        let metaResponse = null;

        // Enviar para Meta Conversions API se habilitado
        if (metaEnabled && metaCapiEnabled && pixelId && accessToken) {
            try {
                // Preparar dados do usuário com hash
                const hashedUserData: Record<string, any> = {};

                if (user_data?.email) {
                    hashedUserData.em = [hashData(user_data.email)];
                }
                if (user_data?.phone) {
                    hashedUserData.ph = [hashData(normalizePhone(user_data.phone))];
                }
                if (user_data?.first_name) {
                    hashedUserData.fn = [hashData(user_data.first_name)];
                }
                if (user_data?.last_name) {
                    hashedUserData.ln = [hashData(user_data.last_name)];
                }
                if (user_data?.city) {
                    hashedUserData.ct = [hashData(user_data.city)];
                }
                if (user_data?.state) {
                    hashedUserData.st = [hashData(user_data.state)];
                }
                if (user_data?.zip_code) {
                    hashedUserData.zp = [hashData(user_data.zip_code)];
                }
                if (user_data?.country) {
                    hashedUserData.country = [hashData(user_data.country || 'us')];
                }
                if (user_data?.external_id) {
                    hashedUserData.external_id = [hashData(user_data.external_id)];
                }
                if (user_data?.fbc) {
                    hashedUserData.fbc = user_data.fbc;
                }
                if (user_data?.fbp) {
                    hashedUserData.fbp = user_data.fbp;
                }

                hashedUserData.client_ip_address = clientIp;
                hashedUserData.client_user_agent = userAgent;

                // Preparar payload para Meta CAPI
                const metaPayload = {
                    data: [{
                        event_name: event_name,
                        event_time: body.event_time || Math.floor(Date.now() / 1000),
                        event_id: event_id,
                        event_source_url: body.event_source_url || request.headers.get('referer') || '',
                        action_source: body.action_source || 'website',
                        user_data: hashedUserData,
                        custom_data: custom_data || {},
                    }],
                    ...(testEventCode && { test_event_code: testEventCode }),
                };

                // Enviar para Meta
                // NOTE: Meta's Conversions API requires the access_token as a URL parameter;
                // it does not support Authorization header authentication.
                const metaUrl = `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`;

                const response = await fetch(metaUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(metaPayload),
                });

                metaResponse = await response.json();
                metaSent = response.ok;

                if (!response.ok) {
                    logger.error('Meta CAPI Error', {
                        status: response.status,
                        errorType: metaResponse?.error?.type,
                        errorMessage: metaResponse?.error?.message,
                    });
                }

            } catch (metaError) {
                logger.error('Meta CAPI Exception', { error: metaError instanceof Error ? metaError.message : metaError });
            }
        }

        // Salvar evento no banco de dados
        const { error: dbError } = await supabase
            .from('tracking_events')
            .insert({
                event_name,
                event_id,
                user_email_hash: user_data?.email ? hashData(user_data.email) : null,
                user_phone_hash: user_data?.phone ? hashData(normalizePhone(user_data.phone)) : null,
                ip_address: hashIp(clientIp),
                user_agent: userAgent,
                fbc: user_data?.fbc || null,
                fbp: user_data?.fbp || null,
                custom_data: custom_data || {},
                page_url: body.event_source_url || request.headers.get('referer'),
                referrer: request.headers.get('referer'),
                sent_to_meta: metaSent,
            });

        if (dbError) {
            logger.error('Error saving tracking event', { error: dbError.message });
        }

        return NextResponse.json({
            success: true,
            event_id,
            meta_sent: metaSent,
        });

    } catch (error) {
        logger.error('Error processing tracking event', { error: error instanceof Error ? error.message : error });
        return NextResponse.json(
            { error: 'Failed to process tracking event' },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { timingSafeEqual } from 'crypto'

interface NotificationPayload {
    channel: 'whatsapp' | 'email' | 'sms'
    recipient: string
    template: string
    data: Record<string, any>
}

function verifyInternalToken(authHeader: string): boolean {
    const internalSecret = process.env.CRON_SECRET
    if (!internalSecret) return false
    const expectedAuth = `Bearer ${internalSecret}`
    if (authHeader.length !== expectedAuth.length) return false
    return timingSafeEqual(Buffer.from(authHeader), Buffer.from(expectedAuth))
}

export async function POST(request: NextRequest) {
    // Auth: accept internal bearer token OR admin session
    const authHeader = request.headers.get('authorization') || ''
    const hasValidToken = verifyInternalToken(authHeader)

    const supabase = await createClient()

    if (!hasValidToken) {
        // Fall back to session-based admin auth
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!profile || profile.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
    }

    try {
        const payload: NotificationPayload = await request.json()

        const { channel, recipient, template, data } = payload

        const validChannels = ['sms', 'whatsapp', 'email'] as const;
        if (channel && !validChannels.includes(channel)) {
            return NextResponse.json({ error: 'Invalid channel' }, { status: 400 });
        }

        // 1. Registrar notificação e obter ID
        const { data: notification, error } = await supabase
            .from('notificacoes')
            .insert({
                canal: channel,
                destinatario: recipient,
                template,
                dados: data,
                status: 'pending'
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating notification:', error)
            return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
        }

        // 2. Disparar envio (Integração com Twilio real)
        const { notify } = await import('@/lib/notifications')

        const smsChannel = (channel === 'whatsapp' ? 'whatsapp' : 'sms') as 'sms' | 'whatsapp'
        const result = await notify(
            recipient,
            template as any,
            data,
            smsChannel
        ) as any // Cast temporário para simplificar acesso aos campos do resultado

        if (result.success) {
            await supabase
                .from('notificacoes')
                .update({
                    status: 'sent',
                    enviado_em: new Date().toISOString(),
                    metadata: {
                        message: result.message,
                        sid: result.messageSid
                    }
                })
                .eq('id', notification.id)

            return NextResponse.json({
                success: true,
                notification_id: notification.id,
                status: 'sent',
                message: result.message
            })
        } else {
            await supabase
                .from('notificacoes')
                .update({
                    status: 'error',
                    erro: result.error?.toString() || 'Failed to send'
                })
                .eq('id', notification.id)

            return NextResponse.json({
                success: false,
                notification_id: notification.id,
                error: result.error
            }, { status: 500 })
        }

    } catch (error) {
        console.error('[Notification API] Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

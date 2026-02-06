import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface NotificationPayload {
    channel: 'whatsapp' | 'email' | 'sms'
    recipient: string
    template: string
    data: Record<string, any>
}

export async function POST(request: NextRequest) {
    try {
        const payload: NotificationPayload = await request.json()
        const supabase = await createClient()

        const { channel, recipient, template, data } = payload

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

        const result = await notify(
            recipient,
            template as any,
            data
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

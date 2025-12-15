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

        // 2. Disparar envio (Integração com provedor real seria aqui)
        // Se for WhatsApp, usaríamos a Evolution API
        // Se for Email, Resend ou SendGrid

        // Simulação de envio
        const isSuccess = true

        if (isSuccess) {
            await supabase
                .from('notificacoes')
                .update({
                    status: 'sent',
                    enviado_em: new Date().toISOString()
                })
                .eq('id', notification.id)

            return NextResponse.json({
                success: true,
                notification_id: notification.id,
                status: 'sent'
            })
        } else {
            await supabase
                .from('notificacoes')
                .update({
                    status: 'error',
                    erro: 'Failed to send'
                })
                .eq('id', notification.id)

            return NextResponse.json({
                success: false,
                notification_id: notification.id,
                error: 'Failed to send'
            }, { status: 500 })
        }

    } catch (error) {
        console.error('[Notification API] Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

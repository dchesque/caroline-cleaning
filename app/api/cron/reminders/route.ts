import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { notify, notifyOwner } from '@/lib/notifications';
import { timingSafeEqual } from 'crypto';
import { logger } from '@/lib/logger';

/**
 * Endpoint de Cron para disparar lembretes 1h antes do agendamento
 * Sugestão: Executar este cron a cada 10-15 minutos
 */
export async function GET(request: NextRequest) {
    try {
        // Auth check with timing-safe comparison
        const authHeader = request.headers.get('authorization') || '';
        const cronSecret = process.env.CRON_SECRET;

        if (!cronSecret) {
            logger.error('CRON_SECRET not configured');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Timing-safe comparison
        const expectedAuth = `Bearer ${cronSecret}`;
        if (
            authHeader.length !== expectedAuth.length ||
            !timingSafeEqual(Buffer.from(authHeader), Buffer.from(expectedAuth))
        ) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createAdminClient();

        // 1. Calcular janela de tempo (daqui a 50min até 75min)
        const now = new Date();
        const startWindow = new Date(now.getTime() + 50 * 60000);
        const endWindow = new Date(now.getTime() + 75 * 60000);

        const today = now.toISOString().split('T')[0];
        const timeStartStr = startWindow.toTimeString().split(' ')[0];
        const timeEndStr = endWindow.toTimeString().split(' ')[0];

        logger.info(`[CRON] Buscando agendamentos para ${today} entre ${timeStartStr} e ${timeEndStr}`);

        // 2. Buscar agendamentos na janela de tempo
        const { data: appointments, error } = await supabase
            .from('agendamentos')
            .select(`
                *,
                clientes (
                    nome,
                    telefone
                )
            `)
            .eq('data', today)
            .gte('horario_inicio', timeStartStr)
            .lte('horario_inicio', timeEndStr)
            .eq('status', 'agendado');

        if (error) throw error;
        if (!appointments || appointments.length === 0) {
            return NextResponse.json({ success: true, count: 0 });
        }

        const stats = { sent_to_owner: 0, sent_to_client: 0, skipped: 0 };

        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        for (const appt of appointments) {
            // 3. Verificar se já notificamos este agendamento (evitar duplicidade)
            const { data: existing } = await supabase
                .from('notificacoes')
                .select('id')
                .eq('template', 'owner_reminder')
                .gte('criado_em', twentyFourHoursAgo)
                .filter('dados->>appointment_id', 'eq', String(appt.id))
                .maybeSingle();

            if (existing) {
                stats.skipped++;
                continue;
            }

            // 4. Notificar Proprietário (WhatsApp)
            try {
                const ownerResult = await notifyOwner('owner_reminder', {
                    name: appt.clientes?.nome,
                    service: appt.tipo,
                    time: appt.horario_inicio.substring(0, 5),
                    appointment_id: appt.id
                });

                if (ownerResult.success) {
                    stats.sent_to_owner++;

                    try {
                        await supabase.from('notificacoes').insert({
                            canal: 'whatsapp',
                            destinatario: process.env.OWNER_PHONE_NUMBER,
                            template: 'owner_reminder',
                            dados: {
                                appointment_id: appt.id,
                                sid: (ownerResult as any).messageSid,
                                channel: (ownerResult as any).channel
                            },
                            status: 'sent',
                            enviado_em: new Date().toISOString()
                        });
                    } catch (insertError) {
                        logger.error('[cron/reminders] Failed to persist owner notification record', {
                            appointmentId: appt.id,
                            error: insertError instanceof Error ? insertError.message : String(insertError),
                        });
                    }
                }
            } catch (sendError) {
                logger.error('[cron/reminders] Owner notification send failed', {
                    appointmentId: appt.id,
                    error: sendError instanceof Error ? sendError.message : String(sendError),
                });
            }

            // 5. Notificar Cliente (SMS)
            if (appt.clientes?.telefone) {
                // Check client dedup too
                const { data: existingClient } = await supabase
                    .from('notificacoes')
                    .select('id')
                    .eq('template', 'client_reminder')
                    .gte('criado_em', twentyFourHoursAgo)
                    .filter('dados->>appointment_id', 'eq', String(appt.id))
                    .maybeSingle();

                if (!existingClient) {
                    try {
                        const clientResult = await notify(appt.clientes.telefone, 'visit_reminder', {
                            name: appt.clientes.nome,
                            time: appt.horario_inicio.substring(0, 5)
                        });
                        if (clientResult.success) stats.sent_to_client++;
                    } catch (clientSendError) {
                        logger.error('[cron/reminders] Client notification send failed', {
                            appointmentId: appt.id,
                            error: clientSendError instanceof Error ? clientSendError.message : String(clientSendError),
                        });
                    }
                }
            }
        }

        return NextResponse.json({ success: true, stats });

    } catch (err) {
        logger.error('[cron/reminders] Fatal error:', { error: err instanceof Error ? err.message : String(err) });
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

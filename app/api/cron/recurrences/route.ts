import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Endpoint de Cron para gerar agendamentos futuros a partir de recorrências.
 * Deve ser executado diariamente (ex: 01:00 AM).
 * Gera agendamentos para os próximos 30 dias se ainda não existirem.
 */
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        const supabase = await createClient();

        let authorized = false;
        if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
            authorized = true;
        } else {
            // Check if authenticated user
            const { data: { user } } = await supabase.auth.getUser();
            if (user) authorized = true;
        }

        if (!authorized) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Buscar todas as recorrências ativas
        const { data: recurrences, error: recError } = await supabase
            .from('recorrencias')
            .select('*')
            .eq('ativo', true);

        if (recError) throw recError;
        if (!recurrences || recurrences.length === 0) {
            return NextResponse.json({ success: true, message: 'No active recurrences' });
        }

        const stats = { created: 0, skipped: 0, errors: 0 };
        const horizonDays = 90; // Gerar para os próximos 90 dias
        const now = new Date();
        const futureHorizon = new Date(now.getTime() + horizonDays * 24 * 60 * 60000);
        const todayStr = now.toISOString().split('T')[0];
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

        for (const rec of recurrences) {
            // Construir data base no fuso horário local a partir do YYYY-MM-DD
            let baseDate = new Date(`${rec.data_inicio}T12:00:00.000Z`);
            
            // Encontrar o dia exato compatível com `dia_preferido`
            const targetDayIndex = dayNames.indexOf(rec.dia_preferido);
            let currentDayIndex = baseDate.getUTCDay();
            let daysToTarget = (targetDayIndex - currentDayIndex + 7) % 7;
            
            let firstEventDate = new Date(baseDate.getTime() + daysToTarget * 24 * 60 * 60000);
            
            let currentDate = new Date(firstEventDate);
            if (rec.ultimo_agendamento) {
                currentDate = new Date(`${rec.ultimo_agendamento}T12:00:00.000Z`);
                // Avançar do último com base na recorrência (para o próximo que precisa ser gerado)
                if (rec.frequencia === 'weekly') currentDate.setUTCDate(currentDate.getUTCDate() + 7);
                else if (rec.frequencia === 'biweekly') currentDate.setUTCDate(currentDate.getUTCDate() + 14);
                else if (rec.frequencia === 'monthly') currentDate.setUTCDate(currentDate.getUTCDate() + 28); // Mantém dia da semana (4 semanas)
            }

            // Não gerar no passado - se a data já estiver defasada, dar fast-forward
            while (currentDate.toISOString().split('T')[0] < todayStr) {
                if (rec.frequencia === 'weekly') currentDate.setUTCDate(currentDate.getUTCDate() + 7);
                else if (rec.frequencia === 'biweekly') currentDate.setUTCDate(currentDate.getUTCDate() + 14);
                else if (rec.frequencia === 'monthly') currentDate.setUTCDate(currentDate.getUTCDate() + 28);
                else break;
            }

            // Loop de geração até o horizonte de tempo
            while (currentDate <= futureHorizon) {
                const dateStr = currentDate.toISOString().split('T')[0];
                
                // Verificar se já existe agendamento
                const { data: existing } = await supabase
                    .from('agendamentos')
                    .select('id')
                    .eq('cliente_id', rec.cliente_id)
                    .eq('data', dateStr)
                    .eq('recorrencia_id', rec.id)
                    .maybeSingle();

                if (!existing) {
                    const [h, m] = rec.horario.split(':').map(Number);
                    const endTime = new Date(0, 0, 0, h, m + (rec.duracao_minutos || 180)).toTimeString().slice(0, 5);

                    const { error: insError } = await supabase
                        .from('agendamentos')
                        .insert({
                            cliente_id: rec.cliente_id,
                            recorrencia_id: rec.id,
                            e_recorrente: true,
                            tipo: rec.tipo_servico,
                            data: dateStr,
                            horario_inicio: rec.horario,
                            horario_fim_estimado: endTime,
                            duracao_minutos: rec.duracao_minutos || 180,
                            valor: rec.valor,
                            status: 'agendado'
                        });

                    if (insError) {
                        console.error(`[CRON REC] Error for ${dateStr}:`, insError);
                        stats.errors++;
                    } else {
                        stats.created++;
                        await supabase
                            .from('recorrencias')
                            .update({ ultimo_agendamento: dateStr })
                            .eq('id', rec.id);
                    }
                } else {
                    stats.skipped++;
                }

                // Incrementar para o próximo agendamento de fato (pulo correto)
                if (rec.frequencia === 'weekly') currentDate.setUTCDate(currentDate.getUTCDate() + 7);
                else if (rec.frequencia === 'biweekly') currentDate.setUTCDate(currentDate.getUTCDate() + 14);
                else if (rec.frequencia === 'monthly') currentDate.setUTCDate(currentDate.getUTCDate() + 28);
                else break; 
            }
        }

        return NextResponse.json({ success: true, stats });

    } catch (err) {
        console.error('[CRON REC] Global Error:', err);
        return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
    }
}

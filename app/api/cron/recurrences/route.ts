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

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await createClient();

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
        const horizonDays = 30; // Gerar para os próximos 30 dias
        const now = new Date();
        const futureHorizon = new Date(now.getTime() + horizonDays * 24 * 60 * 60000);

        for (const rec of recurrences) {
            // Calcular próximas datas
            let currentDate = new Date(rec.proximo_agendamento || rec.data_inicio);
            
            // Se a data de início for no passado, ajustar para o próximo dia válido
            if (currentDate < now) {
                // Lógica de skip para não gerar agendamentos retroativos
                currentDate = now;
            }

            // Gerar datas até o horizonte
            while (currentDate <= futureHorizon) {
                // Verificar se o dia da semana bate
                const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                const currentDayName = dayNames[currentDate.getDay()];
                
                if (currentDayName === rec.dia_preferido) {
                    const dateStr = currentDate.toISOString().split('T')[0];
                    
                    // Verificar se já existe agendamento para este cliente, data e recorrência
                    const { data: existing } = await supabase
                        .from('agendamentos')
                        .select('id')
                        .eq('cliente_id', rec.cliente_id)
                        .eq('data', dateStr)
                        .eq('recorrencia_id', rec.id)
                        .maybeSingle();

                    if (!existing) {
                        // Calcular horário de término
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
                            console.error(`[CRON REC] Error creating appointment for ${dateStr}:`, insError);
                            stats.errors++;
                        } else {
                            stats.created++;
                            // Atualizar proximo_agendamento na recorrencia
                            await supabase
                                .from('recorrencias')
                                .update({ ultimo_agendamento: dateStr })
                                .eq('id', rec.id);
                        }
                    } else {
                        stats.skipped++;
                    }
                }
                
                // Incrementar 1 dia
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }

        return NextResponse.json({ success: true, stats });

    } catch (err) {
        console.error('[CRON REC] Global Error:', err);
        return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
    }
}

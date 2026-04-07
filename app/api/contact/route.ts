import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

const contactRateLimitMap = new Map<string, { count: number; timestamp: number }>();
const CONTACT_RATE_LIMIT = 5; // max 5 submissions per 10 minutes per IP
const CONTACT_RATE_WINDOW = 10 * 60_000;

function checkContactRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = contactRateLimitMap.get(ip);
  if (!entry || now - entry.timestamp > CONTACT_RATE_WINDOW) {
    contactRateLimitMap.set(ip, { count: 1, timestamp: now });
    return true;
  }
  if (entry.count >= CONTACT_RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        if (!checkContactRateLimit(ip)) {
            return NextResponse.json({ error: 'Too many submissions. Please try again later.' }, { status: 429 });
        }

        const body = await request.json()
        const { nome, telefone, cidade } = body

        // Validação básica
        if (!nome || !telefone) {
            return NextResponse.json(
                { success: false, error: 'Nome e telefone são obrigatórios' },
                { status: 400 }
            )
        }

        // Validar formato do telefone (básico)
        const phoneRegex = /^[\d\s\-\(\)\+]{10,}$/
        if (!phoneRegex.test(telefone)) {
            return NextResponse.json(
                { success: false, error: 'Formato de telefone inválido' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Capturar informações adicionais
        const userAgent = request.headers.get('user-agent') || null
        const forwardedFor = request.headers.get('x-forwarded-for')
        const ipAddress = forwardedFor?.split(',')[0] || null

        const { data, error } = await supabase
            .from('contact_leads')
            .insert({
                nome: nome.trim(),
                telefone: telefone.trim(),
                cidade: cidade?.trim() || null,
                origem: 'contact_form',
                pagina_origem: request.headers.get('referer') || '/',
                user_agent: userAgent,
                ip_address: ipAddress,
                status: 'novo'
            })
            .select()
            .single()

        if (error) throw error

        // Disparar evento server-side
        try {
            await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/tracking/event`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.CRON_SECRET}`,
                },
                body: JSON.stringify({
                    event_name: 'Lead',
                    event_id: `lead_form_${data.id}`,
                    event_source_url: request.headers.get('referer') || '/',
                    user_data: {
                        email: null,
                        phone: telefone,
                        first_name: nome.split(' ')[0],
                        city: cidade,
                    },
                    custom_data: {
                        content_name: 'Contact Form',
                        content_category: 'Lead',
                    },
                }),
            });
        } catch (trackingError) {
            logger.error('Tracking error', { error: trackingError instanceof Error ? trackingError.message : String(trackingError) });
            // Não falhar a request principal por erro de tracking
        }

        return NextResponse.json({
            success: true,
            message: 'Contato recebido! Entraremos em contato em breve.',
            id: data.id
        })

    } catch (error) {
        logger.error('Error saving contact', { error: error instanceof Error ? error.message : String(error) })
        return NextResponse.json(
            { success: false, error: 'Erro ao enviar contato. Tente novamente.' },
            { status: 500 }
        )
    }
}

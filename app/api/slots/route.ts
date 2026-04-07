import { createClient } from '@/lib/supabase/server'
import { NextResponse, NextRequest } from 'next/server'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
    try {
        const ip = getClientIp(request)
        if (!checkRateLimit(ip, RATE_LIMITS.slots)) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429 }
            )
        }

        const supabase = await createClient()

        const { searchParams } = new URL(request.url)
        const date = searchParams.get('date')
        const durationParam = searchParams.get('duration')
        const duration = durationParam ? parseInt(durationParam, 10) : 180
        if (isNaN(duration) || duration < 15 || duration > 480) {
            return NextResponse.json(
                { error: 'Invalid duration. Must be between 15 and 480 minutes.' },
                { status: 400 }
            )
        }

        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return NextResponse.json(
                { success: false, error: 'Date is required and must be in YYYY-MM-DD format' },
                { status: 400 }
            )
        }

        const { data, error } = await supabase.rpc('get_available_slots', {
            p_data: date,
            p_duracao_minutos: duration
        })

        if (error) throw error

        const availableSlots = (data || []).filter((s: any) => s.disponivel)

        return NextResponse.json({ success: true, date, slots: availableSlots })
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}

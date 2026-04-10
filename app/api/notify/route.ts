import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { notifyAdmins, EvolutionEventType } from '@/lib/services/evolutionService'

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { event, data } = await request.json()
    // Fire-and-forget — return immediately, don't block on the notification
    notifyAdmins(event as EvolutionEventType, data ?? {}).catch(() => {})
    return NextResponse.json({ ok: true })
}

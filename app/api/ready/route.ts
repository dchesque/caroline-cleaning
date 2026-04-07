import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        // Check if all services are ready
        const supabase = await createClient()

        // Test database
        const { error } = await supabase.from('configuracoes').select('id').limit(1)

        // If error is PGRST116 (no rows), it's still a successful connection
        if (error && error.code !== 'PGRST116') {
            return NextResponse.json(
                { ready: false, reason: 'Database not ready' },
                { status: 503 }
            )
        }

        return NextResponse.json({ ready: true }, { status: 200 })

    } catch (error) {
        return NextResponse.json(
            { ready: false, reason: 'Service initialization failed' },
            { status: 503 }
        )
    }
}

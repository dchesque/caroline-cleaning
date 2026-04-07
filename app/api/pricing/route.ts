import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function GET() {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('pricing_config')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true })

        if (error) throw error

        return NextResponse.json({ success: true, data })
    } catch (error) {
        logger.error('[pricing] Error fetching pricing', { error: error instanceof Error ? error.message : String(error) })
        return NextResponse.json(
            { success: false, error: 'Failed to fetch pricing' },
            { status: 500 }
        )
    }
}

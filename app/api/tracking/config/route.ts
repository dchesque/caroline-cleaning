// app/api/tracking/config/route.ts

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        const supabase = await createClient();

        // Buscar todas as configurações de tracking
        const { data, error } = await supabase
            .from('configuracoes')
            .select('chave, valor')
            .like('chave', 'tracking_%');

        if (error) throw error;

        return NextResponse.json({
            success: true,
            data: data || []
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
            }
        });

    } catch (error) {
        console.error('Error fetching tracking config:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch tracking config' },
            { status: 500 }
        );
    }
}

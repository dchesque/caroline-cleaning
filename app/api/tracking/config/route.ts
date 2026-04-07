// app/api/tracking/config/route.ts

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SENSITIVE_KEY_PATTERNS = [
  'access_token',
  'secret',
  'api_key',
  'service_role',
  'private',
];

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return SENSITIVE_KEY_PATTERNS.some(pattern => lower.includes(pattern));
}

export async function GET() {
    try {
        const supabase = await createClient();

        // Buscar todas as configurações de tracking
        const { data, error } = await supabase
            .from('configuracoes')
            .select('chave, valor')
            .like('chave', 'tracking_%');

        if (error) throw error;

        const safeData = (data || []).filter(
            (item: { chave: string }) => !isSensitiveKey(item.chave)
        );

        return NextResponse.json({
            success: true,
            data: safeData
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
            }
        });

    } catch (error) {
        logger.error('[tracking/config] Error fetching tracking config', { error: error instanceof Error ? error.message : String(error) });
        return NextResponse.json(
            { success: false, error: 'Failed to fetch tracking config' },
            { status: 500 }
        );
    }
}

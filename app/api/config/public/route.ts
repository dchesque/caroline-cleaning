// app/api/config/public/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        const supabase = await createClient()

        // Buscar configurações
        const { data: config } = await supabase
            .from('configuracoes')
            .select('*')

        // Buscar áreas ativas
        const { data: areas } = await supabase
            .from('areas_atendidas')
            .select('nome, cidade')
            .eq('ativo', true)
            .order('nome')

        // Buscar pricing ativo
        const { data: pricing } = await supabase
            .from('pricing_config')
            .select('*')
            .eq('is_active', true)
            .order('display_order')

        // Montar objeto de configuração
        const businessConfig = config?.reduce((acc, item) => {
            acc[item.chave] = item.valor
            return acc
        }, {} as Record<string, any>) || {}

        return NextResponse.json({
            business: businessConfig,
            areas: areas || [],
            pricing: pricing || [],
        })
    } catch (error) {
        console.error('Error fetching public config:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

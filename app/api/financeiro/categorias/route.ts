import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export async function GET(request: Request) {
    try {
        const supabase = await createClient()

        // Auth: require authenticated user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Auth: require admin role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || profile.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const tipo = searchParams.get('tipo') // 'receita' ou 'custo'

        let query = supabase
            .from('financeiro_categorias')
            .select('*')
            .eq('ativo', true)
            .order('nome')

        if (tipo) {
            query = query.eq('tipo', tipo)
        }

        const { data, error } = await query

        if (error) throw error

        return NextResponse.json(data)
    } catch (error: any) {
        logger.error('Error fetching categories', { error: error.message })
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()

        // Auth: require authenticated user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Auth: require admin role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || profile.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()

        if (!body.nome || !body.tipo) {
            return NextResponse.json({ error: 'Nome e tipo são obrigatórios' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('financeiro_categorias')
            .insert([
                {
                    nome: body.nome,
                    tipo: body.tipo,
                    cor: body.cor || '#8E8E8E',
                    icone: body.icone || 'Tag',
                    ativo: true
                }
            ])
            .select()

        if (error) throw error

        return NextResponse.json(data[0])
    } catch (error: any) {
        logger.error('Error creating category', { error: error.message })
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

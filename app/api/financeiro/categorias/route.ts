import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    try {
        const supabase = await createClient()
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
        console.error('Error fetching categories:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
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
        console.error('Error creating category:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}

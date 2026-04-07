import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()

        // Auth: require authenticated user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Auth: require admin role
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || profile.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const { id } = await params // Await params in newer Next.js

        // Field allow-list to prevent mass assignment
        const allowedFields = ['nome', 'tipo', 'descricao', 'ativo', 'cor', 'icone'] as const
        const sanitizedBody: Record<string, any> = {}
        for (const field of allowedFields) {
            if (field in body) {
                sanitizedBody[field] = body[field]
            }
        }

        if (Object.keys(sanitizedBody).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('financeiro_categorias')
            .update(sanitizedBody)
            .eq('id', id)
            .select()

        if (error) throw error

        return NextResponse.json(data[0])
    } catch (error: any) {
        logger.error('Error updating category', { error: error.message })
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()

        // Auth: require authenticated user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Auth: require admin role
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || profile.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { id } = await params

        // Soft delete: apenas desativar
        const { error } = await supabase
            .from('financeiro_categorias')
            .update({ ativo: false })
            .eq('id', id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        logger.error('Error deleting category', { error: error.message })
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

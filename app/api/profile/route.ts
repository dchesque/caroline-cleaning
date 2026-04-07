import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

// GET - Buscar perfil do usuário logado
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Buscar perfil
        let { data: profile, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        // Se não existir, criar perfil padrão
        if (!profile) {
            const { data: newProfile, error: insertError } = await supabase
                .from('user_profiles')
                .insert({
                    id: user.id,
                    full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
                })
                .select()
                .single()

            if (insertError) throw insertError
            profile = newProfile
        }

        return NextResponse.json({
            ...profile,
            email: user.email,
            email_confirmed_at: user.email_confirmed_at,
        })

    } catch (error) {
        logger.error('[profile] Error fetching profile', { error: error instanceof Error ? error.message : String(error) })
        return NextResponse.json({ error: 'Error fetching profile' }, { status: 500 })
    }
}

// PUT - Atualizar perfil
export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()

        // Campos permitidos para atualização
        const allowedFields = [
            'full_name', 'phone', 'avatar_url', 'language', 'theme',
            'email_notifications', 'push_notifications', 'sms_notifications',
            'notification_types'
        ]

        const updates: Record<string, any> = {}
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updates[field] = body[field]
            }
        }

        const { data, error } = await supabase
            .from('user_profiles')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(data)

    } catch (error) {
        logger.error('[profile] Error updating profile', { error: error instanceof Error ? error.message : String(error) })
        return NextResponse.json({ error: 'Error updating profile' }, { status: 500 })
    }
}

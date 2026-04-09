import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { validatePassword } from '@/lib/security/password'

export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { currentPassword, newPassword } = await request.json()

        if (!currentPassword || typeof currentPassword !== 'string') {
            return NextResponse.json({ error: 'Current password is required' }, { status: 400 })
        }

        // Validate new password against strong policy
        const check = validatePassword(newPassword)
        if (!check.valid) {
            return NextResponse.json({ error: check.error }, { status: 400 })
        }

        // Verificar senha atual fazendo login novamente
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email!,
            password: currentPassword,
        })

        if (signInError) {
            return NextResponse.json(
                { error: 'Current password is incorrect' },
                { status: 400 }
            )
        }

        // Atualizar senha
        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword
        })

        if (updateError) throw updateError

        return NextResponse.json({ success: true })

    } catch (error) {
        logger.error('[profile/password] Error changing password', { error: error instanceof Error ? error.message : String(error) })
        return NextResponse.json({ error: 'Error changing password' }, { status: 500 })
    }
}

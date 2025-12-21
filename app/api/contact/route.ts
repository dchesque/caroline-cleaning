import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { nome, telefone, cidade } = body

        // Validação básica
        if (!nome || !telefone) {
            return NextResponse.json(
                { success: false, error: 'Nome e telefone são obrigatórios' },
                { status: 400 }
            )
        }

        // Validar formato do telefone (básico)
        const phoneRegex = /^[\d\s\-\(\)\+]{10,}$/
        if (!phoneRegex.test(telefone)) {
            return NextResponse.json(
                { success: false, error: 'Formato de telefone inválido' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Capturar informações adicionais
        const userAgent = request.headers.get('user-agent') || null
        const forwardedFor = request.headers.get('x-forwarded-for')
        const ipAddress = forwardedFor?.split(',')[0] || null

        const { data, error } = await supabase
            .from('contact_leads')
            .insert({
                nome: nome.trim(),
                telefone: telefone.trim(),
                cidade: cidade?.trim() || null,
                origem: 'contact_form',
                pagina_origem: request.headers.get('referer') || '/',
                user_agent: userAgent,
                ip_address: ipAddress,
                status: 'novo'
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({
            success: true,
            message: 'Contato recebido! Entraremos em contato em breve.',
            id: data.id
        })

    } catch (error) {
        console.error('Error saving contact:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao enviar contato. Tente novamente.' },
            { status: 500 }
        )
    }
}

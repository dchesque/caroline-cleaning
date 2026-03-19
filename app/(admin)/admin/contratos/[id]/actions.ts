'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import twilio from 'twilio'

export async function requestContractSignature(contractId: string) {
    try {
        const supabase = await createClient()

        // Get the contract ID and client phone
        const { data: contract, error: fetchError } = await supabase
            .from('contratos')
            .select('*, clientes(nome, telefone)')
            .eq('id', contractId)
            .single()

        if (fetchError || !contract) {
            return { error: 'Contrato não encontrado' }
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chesquecleaning.com'
        const linkAssinatura = `${appUrl}/contrato/${contractId}/assinar`

        const mensagem = `Olá ${contract.clientes.nome}! Seu contrato/termo de serviço com a Chesque Premium Cleaning está pronto.
Por favor, acesse o link para revisar e assinar digitalmente:
${linkAssinatura}`

        // Twilio Setup
        const accountSid = process.env.TWILIO_ACCOUNT_SID
        const authToken = process.env.TWILIO_AUTH_TOKEN
        const fromNumber = process.env.TWILIO_PHONE_NUMBER
        const clientPhone = contract.clientes.telefone

        if (accountSid && authToken && fromNumber && clientPhone) {
            const client = twilio(accountSid, authToken)
            
            let formattedPhone = clientPhone.replace(/\D/g, '')
            if (formattedPhone.length === 10) formattedPhone = '+1' + formattedPhone
            else if (!formattedPhone.startsWith('+')) formattedPhone = '+' + formattedPhone

            await client.messages.create({
                body: mensagem,
                from: fromNumber,
                to: formattedPhone
            })
        } else {
            console.warn('Simulando envio de SMS. Configure as credenciais do Twilio.', mensagem)
        }

        // Update contract status
        await supabase
            .from('contratos')
            .update({ status: 'enviado', enviado_em: new Date().toISOString() })
            .eq('id', contractId)

        revalidatePath(`/admin/contratos/${contractId}`)
        return { success: true }
    } catch (error: any) {
        console.error('Erro ao enviar contrato:', error)
        return { error: 'Falha interna ao enviar contrato' }
    }
}

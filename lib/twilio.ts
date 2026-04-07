import twilio from 'twilio';

/**
 * Cliente Twilio configurado com variáveis de ambiente
 */
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

/**
 * Envia um SMS ou WhatsApp usando Twilio
 */
export async function sendSMS(to: string, body: string, useWhatsApp: boolean = false) {
    if (!client || !fromPhone) {
        console.warn('[TWILIO] Credenciais não configuradas. Mensagem não enviada:', { to, body });
        return { success: false, error: 'Twilio not configured' };
    }

    try {
        const formattedTo = to.startsWith('+') ? to : `+${to}`;
        const message = await client.messages.create({
            body,
            from: useWhatsApp ? `whatsapp:${fromPhone}` : fromPhone,
            to: useWhatsApp ? `whatsapp:${formattedTo}` : formattedTo
        });

        return { success: true, messageSid: message.sid };
    } catch (error) {
        console.error('[TWILIO] Erro ao enviar mensagem:', error);
        return { success: false, error: error instanceof Error ? error.message : 'SMS send failed' };
    }
}

import { sendSMS } from './twilio';

export type NotificationType =
    | 'appointment_created'
    | 'appointment_confirmed'
    | 'appointment_cancelled'
    | 'appointment_rescheduled'
    | 'visit_reminder'
    | 'owner_new_appointment'
    | 'owner_new_customer'
    | 'owner_reminder';

interface NotificationData {
    name?: string;
    phone?: string;
    date?: string;
    time?: string;
    service?: string;
    [key: string]: any;
}

/**
 * Centraliza os templates de notificação do sistema
 */
const TEMPLATES: Record<NotificationType, (data: NotificationData) => string> = {
    appointment_created: (data) =>
        `Olá ${data.name}! Sua limpeza ${data.service} foi agendada para ${data.date} às ${data.time}. Até lá! ✨`,

    appointment_confirmed: (data) =>
        `Confirmado! Sua limpeza está agendada para ${data.date} às ${data.time}. Sua casa vai ficar impecável! 🏠`,

    appointment_cancelled: (data) =>
        `Olá ${data.name}, seu agendamento para o dia ${data.date} foi cancelado conforme solicitado.`,

    appointment_rescheduled: (data) =>
        `Seu agendamento foi alterado para ${data.date} às ${data.time}. Confirmado! ✅`,

    visit_reminder: (data) =>
        `Lembrete: Sua visita de orçamento/limpeza é amanhã às ${data.time}. Nos vemos em breve! 🔔`,

    // Templates para o Proprietário
    owner_new_appointment: (data) =>
        `🚀 *Novo Agendamento!*\n\nCliente: ${data.name}\nServiço: ${data.service}\nData: ${data.date}\nHora: ${data.time}\nTelefone: ${data.phone}`,

    owner_new_customer: (data) =>
        `👤 *Novo Cliente/Lead!*\n\nNome: ${data.name}\nTelefone: ${data.phone}`,

    owner_reminder: (data) =>
        `⏰ *Lembrete de Serviço (em 1h)!*\n\nServiço: ${data.service}\nHora: ${data.time}\nCliente: ${data.name}`
};

/**
 * Gerencia o envio de notificações formatadas
 */
export async function notify(
    recipient: string,
    type: NotificationType,
    data: NotificationData,
    channel: 'sms' | 'whatsapp' = 'sms'
) {
    const templateFn = TEMPLATES[type];

    if (!templateFn) {
        console.error(`[NOTIFICATION] Template não encontrado: ${type}`);
        return { success: false, error: 'Template not found' };
    }

    const message = templateFn(data);

    console.log(`[NOTIFICATION] Enviando ${type} para ${recipient} via ${channel}`);

    const result = await sendSMS(recipient, message, channel === 'whatsapp');

    return {
        ...result,
        channel,
        message
    };
}

/**
 * Notifica o proprietário via WhatsApp
 */
export async function notifyOwner(type: NotificationType, data: NotificationData) {
    const ownerPhone = process.env.OWNER_PHONE_NUMBER;
    if (!ownerPhone) {
        console.warn('[NOTIFICATION] OWNER_PHONE_NUMBER não configurado.');
        return { success: false, error: 'Owner phone not configured' };
    }

    return notify(ownerPhone, type, data, 'whatsapp');
}

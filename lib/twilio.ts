import twilio from 'twilio';
import { logger } from '@/lib/logger';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function sendSMS(to: string, body: string, useWhatsApp: boolean = false) {
  if (!client || !fromPhone) {
    logger.warn('[TWILIO] Credentials not configured. Message not sent:', { to, body: body.substring(0, 50) });
    return { success: false, error: 'Twilio not configured' };
  }

  const formattedTo = to.startsWith('+') ? to : `+${to}`;
  let lastError: string = 'Unknown error';

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const message = await client.messages.create({
        body,
        from: useWhatsApp ? `whatsapp:${fromPhone}` : fromPhone,
        to: useWhatsApp ? `whatsapp:${formattedTo}` : formattedTo,
      });

      if (attempt > 1) {
        logger.info('[TWILIO] Message sent after retry', { attempt, sid: message.sid });
      }

      return { success: true, messageSid: message.sid };
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'SMS send failed';
      logger.error('[TWILIO] Send attempt failed', {
        attempt,
        maxRetries: MAX_RETRIES,
        error: lastError,
      });

      // Don't retry on non-transient errors
      if (error instanceof Error && (
        lastError.includes('is not a valid phone number') ||
        lastError.includes('unverified') ||
        lastError.includes('blacklisted')
      )) {
        break;
      }

      if (attempt < MAX_RETRIES) {
        await delay(BASE_DELAY_MS * Math.pow(2, attempt - 1));
      }
    }
  }

  return { success: false, error: lastError };
}

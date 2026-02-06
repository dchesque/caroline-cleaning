// lib/env.ts
// Validação de variáveis de ambiente em runtime

const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const

const optionalEnvVars = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER',
    'OWNER_PHONE_NUMBER',
    'CRON_SECRET',
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_GA_ID',
    'SENTRY_DSN',
    'PORT',
    'HOSTNAME',
] as const

export function validateEnv() {
    const missing: string[] = []

    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            missing.push(envVar)
        }
    }

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables:\n${missing.join('\n')}`
        )
    }

    if (process.env.NODE_ENV === 'production') {
        const missingOptional: string[] = []
        for (const envVar of optionalEnvVars) {
            if (!process.env[envVar]) {
                missingOptional.push(envVar)
            }
        }
        if (missingOptional.length > 0) {
            console.warn(
                `Warning: Missing optional environment variables:\n${missingOptional.join('\n')}`
            )
        }
    }
}

export const env = {
    // Supabase
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

    // Twilio (SMS)
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
    ownerPhone: process.env.OWNER_PHONE_NUMBER,
    cronSecret: process.env.CRON_SECRET,

    // Analytics
    gaId: process.env.NEXT_PUBLIC_GA_ID,

    // App
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    nodeEnv: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',

    // Server
    port: parseInt(process.env.PORT || '3000', 10),
    hostname: process.env.HOSTNAME || '0.0.0.0',
}
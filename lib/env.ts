// lib/env.ts
// Validação de variáveis de ambiente em runtime

const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'OPENROUTER_API_KEY',
] as const

const productionEnvVars = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER',
    'OWNER_PHONE_NUMBER',
    'CRON_SECRET',
    'NEXT_PUBLIC_APP_URL',
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
        const missingProd: string[] = []
        for (const envVar of productionEnvVars) {
            if (!process.env[envVar]) {
                missingProd.push(envVar)
            }
        }
        if (missingProd.length > 0) {
            console.error(
                `CRITICAL: Missing production environment variables:\n${missingProd.join('\n')}`
            )
        }
    }
}

export const env = {
    // Supabase
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

    // AI
    openRouterKey: process.env.OPENROUTER_API_KEY!,
    defaultModel: process.env.CAROL_DEFAULT_MODEL || 'anthropic/claude-3.5-sonnet',

    // Twilio (SMS/WhatsApp)
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
    ownerPhone: process.env.OWNER_PHONE_NUMBER,
    cronSecret: process.env.CRON_SECRET,

    // App
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    nodeEnv: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',

    // Evolution API (internal WhatsApp admin notifications — all optional)
    evolutionApiUrl: process.env.EVOLUTION_API_URL,
    evolutionApiKey: process.env.EVOLUTION_API_KEY,
    evolutionInstanceName: process.env.EVOLUTION_INSTANCE_NAME,
    evolutionAdminPhone: process.env.EVOLUTION_ADMIN_PHONE,

    // Analytics / Monitoring
    gaId: process.env.NEXT_PUBLIC_GA_ID,
    sentryDsn: process.env.SENTRY_DSN,

    // Server
    port: parseInt(process.env.PORT || '3000', 10),
    hostname: process.env.HOSTNAME || '0.0.0.0',
}
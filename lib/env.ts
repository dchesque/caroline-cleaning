// lib/env.ts
// Validação de variáveis de ambiente em runtime

const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const

const optionalEnvVars = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'N8N_WEBHOOK_SECRET',
    'N8N_CHAT_WEBHOOK_URL',
    'EVOLUTION_API_URL',
    'EVOLUTION_API_KEY',
    'OPENAI_API_KEY',
    'NEXT_PUBLIC_GA_ID',
    'SENTRY_DSN',
    'PORT',
    'HOSTNAME',
] as const

type RequiredEnvVar = typeof requiredEnvVars[number]
type OptionalEnvVar = typeof optionalEnvVars[number]

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

    // Log warning for missing optional vars in production
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

// Chamar no início do app
// validateEnv()

export const env = {
    // Supabase
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

    // N8N
    n8nWebhookSecret: process.env.N8N_WEBHOOK_SECRET,
    n8nChatWebhookUrl: process.env.N8N_CHAT_WEBHOOK_URL,

    // Evolution API
    evolutionUrl: process.env.EVOLUTION_API_URL,
    evolutionKey: process.env.EVOLUTION_API_KEY,
    evolutionInstance: process.env.EVOLUTION_INSTANCE || 'caroline',

    // Analytics
    gaId: process.env.NEXT_PUBLIC_GA_ID,

    // App
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8080',
    nodeEnv: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',

    // Server
    port: parseInt(process.env.PORT || '8080', 10),
    hostname: process.env.HOSTNAME || '0.0.0.0',
}
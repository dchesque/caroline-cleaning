import { z } from 'zod'

export const BrowserContextSchema = z.object({
    fbc: z.string().max(500).optional(),
    fbp: z.string().max(500).optional(),
    userAgent: z.string().max(1000).optional(),
    eventSourceUrl: z.string().max(2000).optional(),
    referrer: z.string().max(2000).optional(),
}).optional()

export const ChatRequestSchema = z.object({
    message: z.string().min(1).max(2000),
    sessionId: z.string().min(1).max(100).optional(),
    browserContext: BrowserContextSchema,
})

export const ContactRequestSchema = z.object({
    nome: z.string().min(1).max(200),
    telefone: z
        .string()
        .regex(/^[\d\s\-\(\)\+]{10,}$/, 'Formato de telefone inválido')
        .max(30),
    cidade: z.string().max(100).optional(),
})

const CarolQueryType = z.enum([
    'client_info',
    'client_history',
    'available_slots',
    'service_pricing',
    'service_areas',
    'business_info',
])

export const CarolQuerySchema = z.object({
    type: CarolQueryType,
    params: z.record(z.string(), z.unknown()).optional().default({}),
})

const CarolActionType = z.enum([
    'create_lead',
    'update_lead',
    'create_appointment',
    'confirm_appointment',
    'cancel_appointment',
    'send_quote',
    'schedule_callback',
])

export const CarolActionsSchema = z.object({
    action: CarolActionType,
    session_id: z.string().min(1).max(100),
    params: z.record(z.string(), z.unknown()).optional().default({}),
})

export async function parseJson<T>(
    request: Request,
    schema: z.ZodType<T>,
    maxBytes = 10_000,
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
    const ct = request.headers.get('content-type') ?? ''
    if (!ct.includes('application/json')) {
        return { ok: false, status: 415, error: 'Content-Type must be application/json' }
    }
    const text = await request.text()
    if (text.length > maxBytes) {
        return { ok: false, status: 413, error: 'Request body too large' }
    }
    let body: unknown
    try {
        body = JSON.parse(text)
    } catch {
        return { ok: false, status: 400, error: 'Invalid JSON' }
    }
    const result = schema.safeParse(body)
    if (!result.success) {
        return { ok: false, status: 400, error: 'Invalid request shape' }
    }
    return { ok: true, data: result.data }
}

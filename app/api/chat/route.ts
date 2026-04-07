import { NextRequest, NextResponse } from 'next/server'
import { CarolAgent } from '@/lib/ai/carol-agent'
import { logger } from '@/lib/logger'
import { chatLogger } from '@/lib/services/chat-logger'
import { createAdminClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit'
import type { ChatResponse } from '@/lib/ai/carol-agent'

export const dynamic = 'force-dynamic'

// Issue 16: Module-level singleton to avoid re-instantiating per request
let agentInstance: CarolAgent | null = null
function getAgent(): CarolAgent {
    if (!agentInstance) {
        agentInstance = new CarolAgent()
    }
    return agentInstance
}

// Issue 14: Per-session rate limit — second layer of defense using Supabase.
// Limits a single session to 100 messages to prevent abuse.
const SESSION_MESSAGE_LIMIT = 100

async function checkSessionMessageLimit(sessionId: string): Promise<boolean> {
    try {
        const supabase = createAdminClient()
        const { count, error } = await supabase
            .from('chat_logs')
            .select('id', { count: 'exact', head: true })
            .eq('session_id', sessionId)

        if (error) {
            // If the check fails, allow the request (fail-open)
            logger.warn('Session rate limit check failed', { error: error.message, sessionId })
            return true
        }

        return (count ?? 0) < SESSION_MESSAGE_LIMIT
    } catch {
        // Fail-open: don't block if check errors out
        return true
    }
}

export async function POST(req: NextRequest) {
    const ip = getClientIp(req);
    if (!checkRateLimit(ip, RATE_LIMITS.chat)) {
        return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            { status: 429 }
        );
    }

    try {
        const body = await req.json()
        const { message, sessionId } = body

        // Validações básicas
        if (!message || typeof message !== 'string') {
            return NextResponse.json(
                { error: 'Message is required and must be a string' },
                { status: 400 }
            )
        }

        if (message.length > 2000) {
            return NextResponse.json(
                { error: 'Message is too long (max 2000 characters)' },
                { status: 400 }
            )
        }

        // Garantir session_id
        const currentSessionId = sessionId || nanoid(16)

        // Issue 14: Per-session rate limit check
        const withinLimit = await checkSessionMessageLimit(currentSessionId)
        if (!withinLimit) {
            logger.warn('Session message limit exceeded', { sessionId: currentSessionId, limit: SESSION_MESSAGE_LIMIT })
            return NextResponse.json(
                { error: 'Limite de mensagens por sessão excedido. Por favor, inicie uma nova conversa.' },
                { status: 429 }
            )
        }

        const startTime = Date.now()

        logger.info('Chat Request Received', {
            sessionId: currentSessionId,
            messageLength: message.length,
            timestamp: new Date().toISOString()
        })

        // Issue 16: Use singleton agent instead of creating per request
        const carol = getAgent()
        const CHAT_TIMEOUT = 60_000; // 60 seconds

        const response: ChatResponse = await Promise.race([
          carol.chat(message, currentSessionId),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Chat processing timeout')), CHAT_TIMEOUT)
          ),
        ]);

        const duration = Date.now() - startTime

        // Log the user interaction (fire-and-forget)
        chatLogger.logInteraction({
            sessionId: currentSessionId,
            clienteId: response.cliente_id,
            direction: 'user',
            messageContent: message,
            stateBefore: response.state_before,
            stateAfter: response.state,
            llmCalls: response.metrics?.llmCalls || [],
            handlersExecuted: response.metrics?.handlersExecuted || [],
            extractedData: response.metrics?.extractedData || {},
            contextSnapshot: response.metrics?.contextSnapshot || {},
            errors: response.metrics?.errors || [],
            responseTimeMs: duration,
        }).catch(() => {}) // Silently ignore logging errors

        // Log the assistant response (fire-and-forget)
        chatLogger.logInteraction({
            sessionId: currentSessionId,
            clienteId: response.cliente_id,
            direction: 'assistant',
            messageContent: response.message,
            stateBefore: response.state_before,
            stateAfter: response.state,
            llmCalls: [],
            handlersExecuted: [],
            extractedData: {},
            contextSnapshot: {},
            errors: [],
            responseTimeMs: 0,
        }).catch(() => {}) // Silently ignore logging errors

        logger.info('Chat Request Completed', {
            sessionId: currentSessionId,
            durationMs: duration,
            state: response.state
        })

        return NextResponse.json({
            success: true,
            ...response
        }, { status: 200 })

    } catch (error) {
        // Issue 15: Log detailed error server-side, return generic message to client
        logger.error('Chat processing failed', {
            error: error instanceof Error ? error.message : error,
            timestamp: new Date().toISOString()
        })

        if (error instanceof Error && error.message === 'Chat processing timeout') {
            return NextResponse.json(
                { error: 'Request took too long. Please try again.' },
                { status: 504 }
            )
        }

        return NextResponse.json(
            { error: 'Ocorreu um erro ao processar sua mensagem. Tente novamente.' },
            { status: 500 }
        )
    }
}

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        service: 'carol-ai-native',
        timestamp: new Date().toISOString()
    })
}

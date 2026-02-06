import { NextRequest, NextResponse } from 'next/server'
import { CarolAgent } from '@/lib/ai/carol-agent'
import { logger } from '@/lib/logger'
import { nanoid } from 'nanoid'
import type { ChatResponse } from '@/types/carol'

export async function POST(req: NextRequest) {
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

        logger.info('Processing chat message', {
            sessionId: currentSessionId,
            messageLength: message.length
        })

        // Instanciar e processar com Carol
        const carol = new CarolAgent()
        const response: ChatResponse = await carol.chat(message, currentSessionId)

        logger.info('Chat processed successfully', {
            sessionId: currentSessionId,
            toolCallsExecuted: response.tool_calls_executed
        })

        return NextResponse.json({
            success: true,
            ...response
        }, { status: 200 })

    } catch (error) {
        logger.error('Chat API error', { error })

        const errorMessage = error instanceof Error ? error.message : 'Failed to process message'

        return NextResponse.json(
            { error: errorMessage },
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

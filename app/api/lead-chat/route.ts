import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { processLeadMessage, defaultLeadContext } from '@/lib/ai/lead-chat-agent'
import { parseJson } from '@/lib/validation/schemas'
import { logger } from '@/lib/logger'
import { chatLogger } from '@/lib/services/chat-logger'

export const dynamic = 'force-dynamic'

const LeadChatRequestSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  sessionId: z.string().min(1).max(100).optional(),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(2000),
      })
    )
    .max(40)
    .optional()
    .default([]),
  context: z
    .object({
      name: z.string().nullable().optional(),
      phone: z.string().nullable().optional(),
      zip: z.string().nullable().optional(),
      leadSaved: z.boolean().optional(),
      leadId: z.string().nullable().optional(),
    })
    .optional(),
})

export async function POST(req: NextRequest) {
  // Rate limiting is handled by middleware (RATE_LIMITS.leadChat bucket).
  // No duplicate check here to avoid consuming the bucket twice per request.

  // Parse + validate — allow larger bodies due to conversation history
  const parsed = await parseJson(req, LeadChatRequestSchema, 100_000)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  }

  const { message, sessionId, history, context: rawContext } = parsed.data
  const sessionIdFinal = sessionId ?? nanoid(16)

  // Merge incoming context with defaults (client may send partial or nothing)
  const context = { ...defaultLeadContext(), ...rawContext }

  try {
    const startTime = Date.now()

    const result = await processLeadMessage({
      message,
      sessionId: sessionIdFinal,
      history: history ?? [],
      context,
    })

    const duration = Date.now() - startTime

    // Log user message (fire-and-forget)
    chatLogger.logInteraction({
      sessionId: sessionIdFinal,
      clienteId: result.context.leadId ?? undefined,
      direction: 'user',
      messageContent: message,
      stateBefore: 'LEAD_CHAT',
      stateAfter: result.context.leadSaved ? 'LEAD_SAVED' : 'LEAD_CHAT',
      llmCalls: [],
      toolCalls: [],
      handlersExecuted: [],
      extractedData: {
        name: result.context.name,
        phone: result.context.phone,
        zip: result.context.zip,
      },
      contextSnapshot: result.context as Record<string, any>,
      errors: [],
      responseTimeMs: duration,
    }).catch(() => {})

    // Log assistant response with full LLM + tool call records (fire-and-forget)
    chatLogger.logInteraction({
      sessionId: sessionIdFinal,
      clienteId: result.context.leadId ?? undefined,
      direction: 'assistant',
      messageContent: result.message,
      stateBefore: 'LEAD_CHAT',
      stateAfter: result.context.leadSaved ? 'LEAD_SAVED' : 'LEAD_CHAT',
      llmCalls: result.llmCalls,
      toolCalls: result.toolCalls,
      handlersExecuted: [],
      extractedData: {
        name: result.context.name,
        phone: result.context.phone,
        zip: result.context.zip,
      },
      contextSnapshot: result.context as Record<string, any>,
      errors: [],
      responseTimeMs: duration,
    }).catch(() => {})

    return NextResponse.json({
      message: result.message,
      context: result.context,
      session_id: sessionIdFinal,
      timestamp: result.timestamp,
    })
  } catch (err) {
    logger.error('[lead-chat route] unhandled error', { error: String(err) })
    return NextResponse.json(
      { error: 'Internal error. Please try again.' },
      { status: 500 }
    )
  }
}

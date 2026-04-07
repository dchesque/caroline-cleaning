// lib/ai/carol-agent.ts
// Carol AI Agent - State Machine Architecture
// The LLM only extracts data and generates responses.
// All business logic is handled deterministically by the state machine.

import { CarolStateMachine } from './state-machine/engine'
import { registerAllHandlers } from './state-machine/handlers/index'
import { CarolServices } from '@/lib/services/carol-services'
import { CarolLLM, LLMCallRecord } from './llm'
import { logger } from '@/lib/logger'
import { env } from '@/lib/env'

export interface ChatResponse {
    message: string
    session_id: string
    state: string
    timestamp: string
    cliente_id?: string
    state_before?: string
    metrics?: {
        llmCalls: LLMCallRecord[]
        handlersExecuted: { handler: string; duration_ms: number }[]
        extractedData: Record<string, any>
        contextSnapshot: Record<string, any>
        errors: { type: 'warning' | 'error'; message: string; state?: string }[]
    }
}

export class CarolAgent {
    private machine: CarolStateMachine

    constructor(model?: string) {
        const services = new CarolServices()
        const llm = new CarolLLM(model || env.defaultModel)
        this.machine = new CarolStateMachine(services, llm)
        registerAllHandlers(this.machine)
    }

    async chat(message: string, sessionId: string): Promise<ChatResponse> {
        logger.info('CarolAgent.chat', { sessionId, messageLength: message.length })

        const result = await this.machine.process(message, sessionId)

        return {
            message: result.response,
            session_id: sessionId,
            state: result.state,
            timestamp: new Date().toISOString(),
            cliente_id: result.cliente_id,
            state_before: result.state_before,
            metrics: result.metrics,
        }
    }
}

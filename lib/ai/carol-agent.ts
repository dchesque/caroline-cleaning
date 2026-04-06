// lib/ai/carol-agent.ts
// Carol AI Agent - State Machine Architecture
// The LLM only extracts data and generates responses.
// All business logic is handled deterministically by the state machine.

import { CarolStateMachine } from './state-machine/engine'
import { registerAllHandlers } from './state-machine/handlers/index'
import { CarolServices } from '@/lib/services/carol-services'
import { CarolLLM } from './llm'
import { logger } from '@/lib/logger'
import { env } from '@/lib/env'

export interface ChatResponse {
    message: string
    session_id: string
    state: string
    tool_calls_executed: number
    timestamp: string
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
            tool_calls_executed: 0, // State machine doesn't use LLM tools
            timestamp: new Date().toISOString()
        }
    }
}

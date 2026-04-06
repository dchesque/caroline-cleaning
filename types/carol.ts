// types/carol.ts

export interface ChatMessage {
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: string
    status?: 'sending' | 'sent' | 'error' | 'processing'
}

export interface ChatResponse {
    message: string
    session_id: string
    state?: string
    tool_calls_executed: number
    timestamp: string
}

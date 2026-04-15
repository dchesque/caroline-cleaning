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
    state: string
    timestamp: string
}

// Shared return-type interface for both useCarolChat and useLeadChat.
// Used to type the `chat` prop in ChatWindow so both hooks are drop-in compatible.
export interface ChatHookReturn {
    messages: ChatMessage[]
    isLoading: boolean
    isProcessing: boolean
    sessionId: string
    sendMessage: (content: string) => Promise<void>
    clearMessages: () => void
    error: string | null
}

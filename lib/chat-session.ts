export function generateSessionId(): string {
    return `session_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`
}

export function getSessionId(): string {
    if (typeof window === 'undefined') return ''

    let sessionId = localStorage.getItem('caroline_chat_session_id')
    if (!sessionId) {
        sessionId = generateSessionId()
        localStorage.setItem('caroline_chat_session_id', sessionId)
    }
    return sessionId
}

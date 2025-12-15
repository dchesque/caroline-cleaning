'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSessionId } from '@/lib/chat-session'

export function useChatSession() {
    const [sessionId, setSessionId] = useState<string>('')

    useEffect(() => {
        setSessionId(getSessionId())
    }, [])

    const saveMessages = useCallback((messages: any[]) => {
        const id = sessionId || getSessionId()
        if (typeof window !== 'undefined' && id) {
            localStorage.setItem(`chat_history_${id}`, JSON.stringify(messages))
        }
    }, [sessionId])

    const loadMessages = useCallback(() => {
        const id = sessionId || getSessionId()
        if (typeof window !== 'undefined' && id) {
            const saved = localStorage.getItem(`chat_history_${id}`)
            return saved ? JSON.parse(saved) : []
        }
        return []
    }, [sessionId])

    return { sessionId, saveMessages, loadMessages }
}

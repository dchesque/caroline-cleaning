'use client'

import { useState, useEffect } from 'react'
import { getSessionId } from '@/lib/chat-session'

export function useChatSession() {
    const [sessionId, setSessionId] = useState<string>('')

    useEffect(() => {
        setSessionId(getSessionId())
    }, [])

    return sessionId
}

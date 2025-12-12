'use client'

import { useState, useCallback, useEffect } from 'react'
import { useChatSession } from './use-chat-session'

export interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    created_at: string
}

export function useChat() {
    const sessionId = useChatSession()
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)

    // Load messages from localStorage on mount (optional simple persistence)
    useEffect(() => {
        if (!sessionId) return
        const saved = localStorage.getItem(`chat_messages_${sessionId}`)
        if (saved) {
            try {
                setMessages(JSON.parse(saved))
            } catch (e) {
                console.error('Failed to parse messages', e)
            }
        } else {
            // Initial greeting if empty
            const initialMessage: Message = {
                id: 'init-1',
                role: 'assistant',
                content: 'Hi! I\'m Carol from Caroline Premium Cleaning. How can I help you today?',
                created_at: new Date().toISOString()
            }
            setMessages([initialMessage])
        }
    }, [sessionId])

    // Save messages when they change
    useEffect(() => {
        if (sessionId && messages.length > 0) {
            localStorage.setItem(`chat_messages_${sessionId}`, JSON.stringify(messages))
        }
    }, [sessionId, messages])


    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim() || !sessionId) return

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content,
            created_at: new Date().toISOString()
        }

        setMessages(prev => [...prev, userMsg])
        setIsLoading(true)

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: content, sessionId })
            })

            if (!response.ok) throw new Error('Failed to send message')

            const data = await response.json()

            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.reply || "Thinking...",
                created_at: new Date().toISOString()
            }

            setMessages(prev => [...prev, assistantMsg])
        } catch (error) {
            console.error('Chat error:', error)
            // Optional: Add error message to chat
        } finally {
            setIsLoading(false)
        }
    }, [sessionId])

    return {
        messages,
        sendMessage,
        isLoading,
        isOpen,
        setIsOpen
    }
}

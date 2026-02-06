// hooks/use-carol-chat.ts
'use client'

import { useState, useCallback, useEffect } from 'react'
import { nanoid } from 'nanoid'
import type { ChatMessage, ChatResponse } from '@/types/carol'

interface UseCarolChatReturn {
    messages: ChatMessage[]
    isLoading: boolean
    isProcessing: boolean
    sessionId: string
    sendMessage: (content: string) => Promise<void>
    clearMessages: () => void
    error: string | null
}

export function useCarolChat(): UseCarolChatReturn {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [sessionId, setSessionId] = useState<string>('')
    const [error, setError] = useState<string | null>(null)

    // Inicializar session_id
    useEffect(() => {
        const stored = localStorage.getItem('carol_session_id')
        if (stored) {
            setSessionId(stored)

            // Tentar carregar histórico do localStorage (opcional, já que Carol foca no banco)
            const saved = localStorage.getItem(`chat_history_${stored}`)
            if (saved) {
                try {
                    setMessages(JSON.parse(saved))
                } catch (e) {
                    console.error('Failed to parse saved chat history', e)
                }
            }
        } else {
            const newId = nanoid(16)
            setSessionId(newId)
            localStorage.setItem('carol_session_id', newId)
        }
    }, [])

    // Salvar no localStorage para persistência visual rápida
    useEffect(() => {
        if (sessionId && messages.length > 0) {
            localStorage.setItem(`chat_history_${sessionId}`, JSON.stringify(messages))
        }
    }, [messages, sessionId])

    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim() || isLoading) return

        setIsLoading(true)
        setError(null)

        // Optimistic update: adicionar mensagem do usuário imediatamente
        const userMessage: ChatMessage = {
            id: nanoid(),
            role: 'user',
            content: content.trim(),
            timestamp: new Date().toISOString(),
            status: 'sending'
        }

        setMessages(prev => [...prev, userMessage])

        try {
            // Chamar API
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: content.trim(),
                    sessionId: sessionId
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to send message')
            }

            const data: ChatResponse = await response.json()

            // Atualizar mensagem do usuário como enviada
            setMessages(prev => prev.map(m =>
                m.id === userMessage.id
                    ? { ...m, status: 'sent' as const }
                    : m
            ))

            // Adicionar resposta da Carol
            const assistantMessage: ChatMessage = {
                id: nanoid(),
                role: 'assistant',
                content: data.message,
                timestamp: data.timestamp,
                status: 'sent'
            }

            setMessages(prev => [...prev, assistantMessage])

        } catch (err) {
            console.error('Error sending message:', err)

            // Marcar mensagem como erro
            setMessages(prev => prev.map(m =>
                m.id === userMessage.id
                    ? { ...m, status: 'error' as const }
                    : m
            ))

            setError(err instanceof Error ? err.message : 'Failed to send message')
        } finally {
            setIsLoading(false)
        }
    }, [isLoading, sessionId])

    const clearMessages = useCallback(() => {
        if (sessionId) {
            localStorage.removeItem(`chat_history_${sessionId}`)
        }
        setMessages([])
        setError(null)
        // Gerar novo session_id para conversa limpa
        const newId = nanoid(16)
        setSessionId(newId)
        localStorage.setItem('carol_session_id', newId)
    }, [sessionId])

    return {
        messages,
        isLoading,
        isProcessing, // Para compatibilidade se necessário
        sessionId,
        sendMessage,
        clearMessages,
        error
    }
}

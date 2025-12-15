'use client'

import { useState, useCallback, useEffect } from 'react'
import { useChatSession } from '@/hooks/use-chat-session'

export interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    created_at: string
    status?: 'sending' | 'sent' | 'error' | 'processing'
}

export type ChatMessage = Message // For backward compatibility if needed locally


export function useChat() {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const { sessionId, saveMessages, loadMessages } = useChatSession()

    // Carregar mensagens salvas
    useEffect(() => {
        const saved = loadMessages()
        if (saved.length > 0) {
            setMessages(saved)
        }
    }, [])

    // Salvar mensagens quando mudar
    useEffect(() => {
        if (messages.length > 0) {
            saveMessages(messages)
        }
    }, [messages])

    // Polling para verificar respostas (quando em modo processing)
    useEffect(() => {
        if (!isProcessing) return

        const pollInterval = setInterval(async () => {
            try {
                // Precisamos de um endpoint para checar novas mensagens
                // Como não criamos um específico apenas para check, podemos usar uma query simples ou
                // assumir que a API de status proposta no prompt (que não me lembro de ter criado)
                // Ah, o prompt mencionou `/api/chat/status`. Vou precisar criar esse endpoint ou usar um existente.
                // O prompt NÃO listou endpoint de status explicitamente na lista de "Arquitetura de APIs 1.1",
                // mas usou no código do hook 9.1.
                // Vou criar esse endpoint rapidinho ou adaptar o hook para usar uma query de mensagens.
                // Vou adaptar para chamar o endpoint de listagem se existisse, mas o mais fácil é criar o status route.
                // Mas espere, na lista de tarefas eu não tenho "Create status route".
                // Vou criar um endpoint simples `app/api/chat/status/route.ts` para suportar isso.

                const response = await fetch(`/api/chat/status?sessionId=${sessionId}`)
                if (!response.ok) return

                const data = await response.json()

                if (data.hasNewMessage) {
                    setMessages(prev => [
                        ...prev.filter(m => m.status !== 'processing'),
                        {
                            id: data.message.id,
                            role: 'assistant',
                            content: data.message.content,
                            created_at: data.message.created_at,
                            status: 'sent'
                        }
                    ])
                    setIsProcessing(false)
                }
            } catch (error) {
                console.error('Polling error:', error)
            }
        }, 2000) // Poll every 2 seconds

        return () => clearInterval(pollInterval)
    }, [isProcessing, sessionId])

    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim() || isLoading) return

        const userMessage: ChatMessage = {
            id: `temp-${Date.now()}`,
            role: 'user',
            content: content.trim(),
            created_at: new Date().toISOString(),
            status: 'sending'
        }

        setMessages(prev => [...prev, userMessage])
        setIsLoading(true)

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: content.trim(),
                    sessionId
                })
            })

            const data = await response.json()

            if (data.success) {
                // Atualizar status da mensagem do usuário
                setMessages(prev => prev.map(m =>
                    m.id === userMessage.id
                        ? { ...m, status: 'sent' as const }
                        : m
                ))

                if (data.processing) {
                    // Modo n8n: aguardar resposta via polling
                    setIsProcessing(true)
                    setMessages(prev => [...prev, {
                        id: 'processing',
                        role: 'assistant',
                        content: '',
                        created_at: new Date().toISOString(),
                        status: 'processing'
                    }])
                } else if (data.message) {
                    // Modo mock: resposta direta
                    setMessages(prev => [
                        ...prev.filter(m => m.id !== 'processing'),
                        {
                            id: data.message.id || `msg-${Date.now()}`,
                            role: 'assistant',
                            content: data.message.content,
                            created_at: data.message.created_at || new Date().toISOString(),
                            status: 'sent'
                        }
                    ])
                }
            } else {
                // Erro
                setMessages(prev => prev.map(m =>
                    m.id === userMessage.id
                        ? { ...m, status: 'error' as const }
                        : m
                ))
            }
        } catch (error) {
            console.error('Error sending message:', error)
            setMessages(prev => prev.map(m =>
                m.id === userMessage.id
                    ? { ...m, status: 'error' as const }
                    : m
            ))
        } finally {
            setIsLoading(false)
        }
    }, [isLoading, sessionId])

    const clearMessages = useCallback(() => {
        setMessages([])
    }, [])

    return {
        messages,
        isLoading,
        isProcessing,
        sendMessage,
        clearMessages
    }
}

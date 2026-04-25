// hooks/use-lead-chat.ts
'use client'

import { useState, useCallback, useEffect } from 'react'
import { nanoid } from 'nanoid'
import type { ChatMessage } from '@/types/carol'
import type { LeadContext } from '@/types/lead-chat'
import { defaultLeadContext } from '@/types/lead-chat'
import { useTracking } from '@/components/tracking/tracking-provider'
import type { TrackingEventName, CustomData, UserData } from '@/lib/tracking/types'
import { getClientBrowserContext } from '@/lib/tracking/browser-context'

// Marker used to exclude synthetic (client-generated) messages from
// the history we send to the LLM — they were never part of a real LLM exchange.
const SYNTHETIC_ID_PREFIX = 'synthetic_'

const LEAD_CONTEXT_KEY = (id: string) => `lead_context_v3_${id}`
const LEAD_HISTORY_KEY = (id: string) => `lead_history_v3_${id}`

export function useLeadChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const [context, setContext] = useState<LeadContext>(defaultLeadContext())
  const [error, setError] = useState<string | null>(null)
  const { trackEvent } = useTracking()

  // Initialize session + show greeting (no LLM call — hardcoded for instant UX)
  useEffect(() => {
    const newId = nanoid(16)
    setSessionId(newId)

    const greeting: ChatMessage = {
      id: `${SYNTHETIC_ID_PREFIX}${nanoid()}`,
      role: 'assistant',
      content:
        "Hi there! I'm Carol from Chesque Premium Cleaning 😊 Our service is fully personalized — a team member will reach out to schedule a free evaluation visit with a no-commitment quote. To get started, what's your name?",
      timestamp: new Date().toISOString(),
      status: 'sent',
    }
    setMessages([greeting])
  }, [])

  // Persist messages to sessionStorage
  useEffect(() => {
    if (sessionId && messages.length > 0) {
      sessionStorage.setItem(LEAD_HISTORY_KEY(sessionId), JSON.stringify(messages))
    }
  }, [messages, sessionId])

  // Persist context to sessionStorage
  useEffect(() => {
    if (sessionId) {
      sessionStorage.setItem(LEAD_CONTEXT_KEY(sessionId), JSON.stringify(context))
    }
  }, [context, sessionId])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return

      setIsLoading(true)
      setError(null)

      const userMessage: ChatMessage = {
        id: nanoid(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date().toISOString(),
        status: 'sending',
      }
      setMessages((prev) => [...prev, userMessage])

      // Build history for API: exclude system messages and synthetic client-generated
      // messages (e.g. the hardcoded greeting) that were never part of an LLM exchange.
      const historyForApi = messages
        .filter((m) => m.role !== 'system' && !m.id.startsWith(SYNTHETIC_ID_PREFIX))
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

      try {
        // Debug: Log the context being sent to server
        console.log('[use-lead-chat] Sending to API:', {
          message: content.trim(),
          contextBeingSent: {
            name: context.name,
            phone: context.phone,
            zip: context.zip,
            zipConfirmed: context.zipConfirmed,
            zipRejectedCount: context.zipRejectedCount,
            offTopicCount: context.offTopicCount,
            attempts: context.attempts,
          },
        })

        const response = await fetch('/api/lead-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content.trim(),
            sessionId,
            history: historyForApi,
            context,
            browserContext: getClientBrowserContext(),
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to send message')
        }

        const data = await response.json()

        // Debug: Log the context received from server
        console.log('[use-lead-chat] Received from API:', {
          contextReceived: {
            name: data.context?.name,
            phone: data.context?.phone,
            zip: data.context?.zip,
            zipConfirmed: data.context?.zipConfirmed,
            zipRejectedCount: data.context?.zipRejectedCount,
            offTopicCount: data.context?.offTopicCount,
            attempts: data.context?.attempts,
          },
        })

        // Update context from server response
        if (data.context) {
          setContext(data.context as LeadContext)
        }

        // Forward server-triggered conversion to the pixel layer (dedup via event_id).
        if (data.conversion?.eventId && data.conversion.eventName) {
          trackEvent(
            data.conversion.eventName as TrackingEventName,
            data.conversion.customData as Partial<CustomData> | undefined,
            data.conversion.userData as Partial<UserData> | undefined,
            { eventId: data.conversion.eventId },
          )
        }

        // Mark user message as sent
        setMessages((prev) =>
          prev.map((m) => (m.id === userMessage.id ? { ...m, status: 'sent' as const } : m))
        )

        // Typing delay for human feel
        await new Promise((resolve) => setTimeout(resolve, 1500))

        const assistantMessage: ChatMessage = {
          id: nanoid(),
          role: 'assistant',
          content: data.message,
          timestamp: data.timestamp || new Date().toISOString(),
          status: 'sent',
        }
        setMessages((prev) => [...prev, assistantMessage])
      } catch (err) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === userMessage.id ? { ...m, status: 'error' as const } : m
          )
        )
        setError(err instanceof Error ? err.message : 'Failed to send message')
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, sessionId, context, messages, trackEvent]
  )

  const clearMessages = useCallback(() => {
    if (sessionId) {
      sessionStorage.removeItem(LEAD_HISTORY_KEY(sessionId))
      sessionStorage.removeItem(LEAD_CONTEXT_KEY(sessionId))
    }
    const newId = nanoid(16)
    setSessionId(newId)
    setMessages([])
    setContext(defaultLeadContext())
    setError(null)
  }, [sessionId])

  return {
    messages,
    isLoading,
    isProcessing: false, // kept for ChatHookReturn interface compatibility
    sessionId,
    sendMessage,
    clearMessages,
    error,
  }
}

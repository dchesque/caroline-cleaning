import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendChatMessage } from '@/lib/services/webhookService'
import { isWebhookConfigured } from '@/lib/config/webhooks'

interface ChatRequest {
    message: string
    sessionId: string
    clientInfo?: {
        name?: string
        phone?: string
        email?: string
    }
}

export async function POST(request: NextRequest) {
    try {
        const body: ChatRequest = await request.json()
        const { message, sessionId, clientInfo } = body

        if (!message || !sessionId) {
            return NextResponse.json(
                { error: 'Message and sessionId are required' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Salvar mensagem do usuário no banco
        const { data: savedMessage, error: saveError } = await supabase
            .from('mensagens_chat')
            .insert({
                session_id: sessionId,
                role: 'user',
                content: message,
                source: 'website',
                ip_address: request.headers.get('x-forwarded-for') || 'unknown',
                user_agent: request.headers.get('user-agent') || 'unknown',
            })
            .select()
            .single()

        if (saveError) {
            console.error('Error saving user message:', saveError)
        }

        // Se n8n está configurado, enviar webhook
        if (isWebhookConfigured()) {
            const webhookResult = await sendChatMessage({
                session_id: sessionId,
                message_id: savedMessage?.id,
                content: message,
                source: 'website',
                timestamp: new Date().toISOString(),
                client_info: clientInfo,
            })

            if (webhookResult.success) {
                // Webhook enviado, resposta virá via /api/webhook/n8n
                return NextResponse.json({
                    success: true,
                    processing: true,
                    message_id: savedMessage?.id,
                })
            } else {
                console.error('Webhook failed:', webhookResult.error)
                // Fallback para mock se webhook falhar
            }
        }

        // Fallback: resposta mock (quando n8n não está configurado)
        const mockResponse = await getMockResponse(message)

        // Salvar resposta mock no banco
        await supabase
            .from('mensagens_chat')
            .insert({
                session_id: sessionId,
                role: 'assistant',
                content: mockResponse,
                source: 'website',
            })

        return NextResponse.json({
            success: true,
            processing: false,
            message: {
                id: `mock-${Date.now()}`,
                content: mockResponse,
                timestamp: new Date().toISOString(),
            },
        })

    } catch (error) {
        console.error('Chat API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// Mock response para desenvolvimento
async function getMockResponse(userMessage: string): Promise<string> {
    const message = userMessage.toLowerCase()
    await new Promise(resolve => setTimeout(resolve, 800))

    if (message.includes('price') || message.includes('cost') || message.includes('quanto')) {
        return "Great question! Prices vary based on your home's size and condition. For a typical 3-bedroom home, regular cleaning starts around $150-180. Would you like to schedule a free estimate visit?"
    }

    if (message.includes('area') || message.includes('location') || message.includes('onde')) {
        return "We serve Miami Beach, Coral Gables, Brickell, Downtown Miami, Coconut Grove, and surrounding areas. What's your zip code? I can check if we cover your area!"
    }

    if (message.includes('schedule') || message.includes('book') || message.includes('agendar')) {
        return "I'd be happy to help you schedule! What day works best for you? We have availability this week."
    }

    return "Hi! I'm Carol from Caroline Premium Cleaning. I can help you with scheduling, pricing, or any questions about our services. What would you like to know?"
}

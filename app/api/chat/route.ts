import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

interface ChatRequest {
    message: string
    sessionId: string
}

export async function POST(request: NextRequest) {
    try {
        const { message, sessionId }: ChatRequest = await request.json()
        const supabase = await createClient()

        // Obter informações do request
        const headersList = await headers()
        const userAgent = headersList.get('user-agent') || ''
        const forwardedFor = headersList.get('x-forwarded-for')
        const ipAddress = forwardedFor?.split(',')[0] || 'unknown'

        // Salvar mensagem do usuário
        const { data: userMessage, error: userError } = await supabase
            .from('mensagens_chat')
            .insert({
                session_id: sessionId,
                role: 'user',
                content: message,
                source: 'website',
                // Note: ip_address and user_agent not explicitly in migration but useful metadata
                metadata: {
                    ip_address: ipAddress,
                    user_agent: userAgent,
                }
            })
            .select()
            .single()

        if (userError) {
            console.error('Error saving user message:', userError)
            return NextResponse.json(
                { success: false, error: 'Failed to save message' },
                { status: 500 }
            )
        }

        // Verificar se n8n está configurado
        const n8nWebhookUrl = process.env.N8N_CHAT_WEBHOOK_URL

        if (n8nWebhookUrl) {
            // Modo produção: Enviar para n8n processar
            try {
                // Log para debug
                console.log('Forwarding to N8N:', n8nWebhookUrl)

                // Não aguardar resposta do n8n (fire and forget ou async handling se n8n responder rápido)
                // O n8n deve processar e chamar o webhook de resposta depois
                // Mas se quisermos que o useChat fique em estado "processing", precisamos retornar isso.

                // Disparar o request para o N8N (sem await se quisermos liberar rápido, ou com await e timeout curto)
                // O ideal é fire and forget para o user não esperar o n8n?
                // Mas o hook espera uma confirmação.

                fetch(n8nWebhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-webhook-secret': process.env.N8N_WEBHOOK_SECRET || '',
                    },
                    body: JSON.stringify({
                        session_id: sessionId,
                        message_id: userMessage.id,
                        content: message,
                        source: 'website',
                        timestamp: new Date().toISOString(),
                    }),
                }).catch(err => console.error('N8N Fetch Error:', err))

                // Retornar indicador de processamento
                return NextResponse.json({
                    success: true,
                    processing: true,
                    message: {
                        id: userMessage.id,
                        status: 'processing'
                    }
                })

            } catch (n8nError) {
                console.error('Error calling n8n:', n8nError)
                // Fallback for mock if N8N fails (caught synchronously)
            }
        }

        // Modo desenvolvimento ou fallback: Resposta mock
        console.log('Using Mock/Fallback response')
        const response = getMockResponse(message)

        // Salvar resposta da Carol
        const { data: assistantMessage, error: assistantError } = await supabase
            .from('mensagens_chat')
            .insert({
                session_id: sessionId,
                role: 'assistant',
                content: response,
                source: 'website',
            })
            .select()
            .single()

        if (assistantError) {
            console.error('Error saving assistant message:', assistantError)
        }

        return NextResponse.json({
            success: true,
            message: {
                id: assistantMessage?.id,
                role: 'assistant',
                content: response,
                created_at: assistantMessage?.created_at || new Date().toISOString()
            }
        })

    } catch (error) {
        console.error('Chat API error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// Respostas mock para desenvolvimento
function getMockResponse(message: string): string {
    const lowerMessage = message.toLowerCase()

    // Saudações
    if (/^(hi|hello|hey|oi|olá)/i.test(lowerMessage)) {
        return `Hi there! 👋 I'm Carol, your cleaning assistant. I'd love to help you with:

• **Get a free quote** - Just tell me about your home
• **Schedule a cleaning** - Check our availability
• **Learn about our services** - Regular, Deep Clean, Move-in/out

What can I help you with today?`
    }

    // Preços
    if (/price|cost|how much|quanto|preço|valor/i.test(lowerMessage)) {
        return `Our prices start at $120 for regular cleaning and vary based on your home's size. Here's a general guide:

🏠 **Regular Cleaning**: $120-$200
✨ **Deep Cleaning**: $200-$350
📦 **Move-in/out**: $250-$400

For an accurate quote, could you tell me:
1. How many bedrooms?
2. How many bathrooms?

I'll give you an exact price! 💰`
    }

    // Agendar
    if (/schedule|book|appointment|agendar|marcar/i.test(lowerMessage)) {
        return `Great! I'd love to schedule your cleaning! 📅

To find the best time for you, I'll need:
1. Your **preferred date** (we're usually available within 2-3 days)
2. **Morning** (8am-12pm) or **Afternoon** (1pm-5pm)?

We're available Monday through Saturday. When works best for you?`
    }

    // Serviços
    if (/service|what do you|serviço|offer/i.test(lowerMessage)) {
        return `We offer several cleaning services tailored to your needs:

🧹 **Regular Cleaning** - Weekly/biweekly maintenance
✨ **Deep Cleaning** - Thorough top-to-bottom clean
📦 **Move-in/Move-out** - Perfect for relocations
🏢 **Office Cleaning** - Commercial spaces

All services include:
✓ Eco-friendly products
✓ Trained & insured cleaners
✓ Satisfaction guarantee

Which service interests you?`
    }

    // Áreas
    if (/area|location|where|zip|miami|onde|região/i.test(lowerMessage)) {
        return `We proudly serve the greater Miami area! 🌴

**Our service areas include:**
• Miami Beach
• Coral Gables
• Brickell
• Downtown Miami
• Coconut Grove
• Key Biscayne
• Wynwood

Could you share your ZIP code? I'll confirm we can serve your area! 📍`
    }

    // Pets
    if (/pet|dog|cat|animal|cachorro|gato/i.test(lowerMessage)) {
        return `We absolutely love pets! 🐕🐱

Our team is pet-friendly and experienced with homes that have furry friends. We use pet-safe, non-toxic products.

Just let us know:
• What type of pet(s) you have
• Any special instructions

We'll make sure your home is sparkling AND safe for your companions! 💕`
    }

    // Contato/Telefone
    if (/phone|call|contact|number|telefone|ligar/i.test(lowerMessage)) {
        return `You can reach us at:

📞 **(305) 555-0123**
📧 hello@carolinecleaning.com

Our office hours are Monday-Saturday, 8am-6pm.

Or I can help you right here! Would you like to:
• Get a quote
• Schedule a cleaning
• Ask a question`
    }

    // Agradecimento
    if (/thank|thanks|obrigad/i.test(lowerMessage)) {
        return `You're welcome! 😊 

Is there anything else I can help you with? I'm here if you need:
• A price quote
• Help scheduling
• More information about our services

Have a wonderful day! ✨`
    }

    // Resposta padrão
    return `Thanks for reaching out! I'm Carol, and I'm here to help you with all your cleaning needs.

I can assist you with:

1️⃣ **Get a Quote** - Tell me about your home
2️⃣ **Schedule Cleaning** - Find available times
3️⃣ **Learn More** - About our services

What would you like to do? 😊`
}

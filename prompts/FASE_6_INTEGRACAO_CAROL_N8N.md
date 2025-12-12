# FASE 6: INTEGRAÇÃO CAROL (IA) + N8N
## Caroline Premium Cleaning - Plataforma de Atendimento e Gestão

**Versão:** 1.0  
**Data:** Dezembro 2024  
**Duração Estimada:** 5-7 dias  
**Prioridade:** 🔴 CRITICAL  
**Pré-requisito:** Fases 1-5 completas

---

## 📋 RESUMO EXECUTIVO

Esta fase implementa a **integração completa** entre o chat da Carol (IA) e o sistema de gestão, usando **n8n** como orquestrador de automações.

### Escopo da Fase 6:
- ✅ Webhook para receber mensagens do n8n
- ✅ API de consulta de dados para a IA
- ✅ Processamento inteligente de intenções
- ✅ Criação automática de leads e agendamentos
- ✅ Integração WhatsApp via Evolution API
- ✅ Notificações automáticas
- ✅ Sistema de filas e retry

### Arquitetura de Integração:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FLUXO DE MENSAGENS                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   [Website Chat]  ──►  /api/chat  ──►  Salva no Supabase               │
│         │                                    │                          │
│         │                                    ▼                          │
│         │              ┌─────────────────────────────────┐              │
│         │              │           N8N                   │              │
│         │              │  ┌─────────────────────────┐    │              │
│         └─────────────►│  │  Webhook Receiver       │    │              │
│                        │  └──────────┬──────────────┘    │              │
│   [WhatsApp]  ────────►│             │                   │              │
│         │              │  ┌──────────▼──────────────┐    │              │
│         │              │  │  Process Intent         │    │              │
│         │              │  │  (OpenAI/Claude)        │    │              │
│         │              │  └──────────┬──────────────┘    │              │
│         │              │             │                   │              │
│         │              │  ┌──────────▼──────────────┐    │              │
│         │              │  │  Execute Actions        │    │              │
│         │              │  │  - Query Supabase       │    │              │
│         │              │  │  - Create Lead          │    │              │
│         │              │  │  - Book Appointment     │    │              │
│         │              │  │  - Send Notification    │    │              │
│         │              │  └──────────┬──────────────┘    │              │
│         │              │             │                   │              │
│         │              │  ┌──────────▼──────────────┐    │              │
│         │              │  │  Generate Response      │    │              │
│         │              │  └──────────┬──────────────┘    │              │
│         │              └─────────────┼───────────────────┘              │
│         │                            │                                  │
│         │                            ▼                                  │
│         │              ┌─────────────────────────────┐                  │
│         ◄──────────────┤  /api/webhook/response     │                  │
│                        └─────────────────────────────┘                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 1. ARQUITETURA DE APIS

### 1.1 Estrutura de Endpoints

```
app/api/
├── chat/
│   └── route.ts                 # POST: Mensagem do chat (já existe)
│
├── webhook/
│   ├── n8n/
│   │   └── route.ts             # POST: Webhook principal do n8n
│   ├── whatsapp/
│   │   └── route.ts             # POST: Webhook Evolution API
│   └── response/
│       └── route.ts             # POST: Resposta do n8n para o chat
│
├── carol/
│   ├── query/
│   │   └── route.ts             # POST: Query de dados para IA
│   ├── actions/
│   │   └── route.ts             # POST: Executar ações
│   └── slots/
│       └── route.ts             # GET: Horários disponíveis
│
├── notifications/
│   ├── send/
│   │   └── route.ts             # POST: Enviar notificação
│   └── templates/
│       └── route.ts             # GET: Templates de mensagem
```

---

## 2. WEBHOOK N8N

### 2.1 Webhook Principal - app/api/webhook/n8n/route.ts

```typescript
// app/api/webhook/n8n/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

// Tipos de eventos que o n8n pode enviar
type N8nEventType = 
  | 'message.received'      // Nova mensagem recebida
  | 'message.processed'     // Mensagem processada pela IA
  | 'action.execute'        // Executar ação (criar lead, agendar, etc)
  | 'notification.send'     // Enviar notificação

interface N8nWebhookPayload {
  event: N8nEventType
  timestamp: string
  data: {
    session_id: string
    source: 'website' | 'whatsapp' | 'instagram'
    message?: {
      id: string
      content: string
      role: 'user' | 'assistant'
    }
    intent?: {
      type: string
      confidence: number
      entities: Record<string, any>
    }
    action?: {
      type: string
      params: Record<string, any>
    }
    contact?: {
      phone?: string
      name?: string
      email?: string
    }
  }
  metadata?: Record<string, any>
}

// Verificar autenticação do webhook
function verifyWebhookAuth(request: NextRequest): boolean {
  const headersList = headers()
  const authHeader = headersList.get('x-webhook-secret')
  const expectedSecret = process.env.N8N_WEBHOOK_SECRET
  
  if (!expectedSecret) {
    console.warn('N8N_WEBHOOK_SECRET not configured')
    return true // Em dev, permitir sem auth
  }
  
  return authHeader === expectedSecret
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    if (!verifyWebhookAuth(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const payload: N8nWebhookPayload = await request.json()
    const supabase = await createClient()

    console.log(`[N8N Webhook] Event: ${payload.event}`, payload.data)

    // Processar baseado no tipo de evento
    switch (payload.event) {
      case 'message.received':
        return await handleMessageReceived(supabase, payload)
      
      case 'message.processed':
        return await handleMessageProcessed(supabase, payload)
      
      case 'action.execute':
        return await handleActionExecute(supabase, payload)
      
      case 'notification.send':
        return await handleNotificationSend(supabase, payload)
      
      default:
        return NextResponse.json(
          { error: 'Unknown event type' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('[N8N Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handler: Mensagem recebida
async function handleMessageReceived(supabase: any, payload: N8nWebhookPayload) {
  const { session_id, message, source, contact } = payload.data

  if (!message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  // Salvar mensagem no banco
  const { data, error } = await supabase
    .from('mensagens_chat')
    .insert({
      session_id,
      role: message.role,
      content: message.content,
      source,
      lead_info: contact || null,
      metadata: payload.metadata,
    })
    .select()
    .single()

  if (error) {
    console.error('Error saving message:', error)
    return NextResponse.json({ error: 'Failed to save message' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message_id: data.id,
    action: 'message_saved'
  })
}

// Handler: Mensagem processada pela IA
async function handleMessageProcessed(supabase: any, payload: N8nWebhookPayload) {
  const { session_id, intent, message } = payload.data

  // Salvar resposta da IA
  if (message && message.role === 'assistant') {
    await supabase
      .from('mensagens_chat')
      .insert({
        session_id,
        role: 'assistant',
        content: message.content,
        intent_detected: intent?.type,
        intent_confidence: intent?.confidence,
        metadata: { intent, ...payload.metadata },
      })
  }

  // Atualizar sessão com última intenção detectada
  await supabase
    .from('chat_sessions')
    .upsert({
      id: session_id,
      last_intent: intent?.type,
      last_activity: new Date().toISOString(),
      status: 'active',
    })

  return NextResponse.json({
    success: true,
    intent: intent?.type,
    action: 'message_processed'
  })
}

// Handler: Executar ação
async function handleActionExecute(supabase: any, payload: N8nWebhookPayload) {
  const { action, session_id, contact } = payload.data

  if (!action) {
    return NextResponse.json({ error: 'Action is required' }, { status: 400 })
  }

  let result: any = null

  switch (action.type) {
    case 'create_lead':
      result = await createLead(supabase, session_id, contact, action.params)
      break

    case 'create_appointment':
      result = await createAppointment(supabase, action.params)
      break

    case 'update_lead':
      result = await updateLead(supabase, action.params)
      break

    case 'check_availability':
      result = await checkAvailability(supabase, action.params)
      break

    case 'get_pricing':
      result = await getPricing(supabase, action.params)
      break

    default:
      return NextResponse.json({ error: 'Unknown action type' }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    action: action.type,
    result
  })
}

// Handler: Enviar notificação
async function handleNotificationSend(supabase: any, payload: N8nWebhookPayload) {
  const { action } = payload.data

  if (!action || action.type !== 'notification') {
    return NextResponse.json({ error: 'Invalid notification action' }, { status: 400 })
  }

  const { channel, recipient, template, data } = action.params

  // Registrar notificação no banco
  const { data: notification, error } = await supabase
    .from('notificacoes')
    .insert({
      canal: channel,
      destinatario: recipient,
      template,
      dados: data,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }

  // Aqui poderia disparar o envio real via outro serviço
  // Por enquanto, apenas registra

  return NextResponse.json({
    success: true,
    notification_id: notification.id,
    action: 'notification_queued'
  })
}

// ============ ACTION FUNCTIONS ============

async function createLead(
  supabase: any, 
  sessionId: string, 
  contact: any, 
  params: any
) {
  // Verificar se já existe cliente com mesmo telefone
  if (contact?.phone) {
    const { data: existing } = await supabase
      .from('clientes')
      .select('id')
      .eq('telefone', contact.phone)
      .single()

    if (existing) {
      return { 
        action: 'existing_client', 
        client_id: existing.id,
        message: 'Client already exists'
      }
    }
  }

  // Criar novo cliente/lead
  const clientData = {
    nome: contact?.name || params.name || 'Lead via Chat',
    telefone: contact?.phone || params.phone,
    email: contact?.email || params.email || null,
    zip_code: params.zip_code || null,
    status: 'lead',
    origem: params.source || 'website_chat',
    session_id: sessionId,
    notas: params.notes || `Lead capturado via chat em ${new Date().toLocaleDateString()}`,
  }

  const { data, error } = await supabase
    .from('clientes')
    .insert(clientData)
    .select()
    .single()

  if (error) {
    console.error('Error creating lead:', error)
    return { action: 'error', message: error.message }
  }

  // Atualizar sessão do chat com o cliente
  await supabase
    .from('mensagens_chat')
    .update({ cliente_id: data.id })
    .eq('session_id', sessionId)

  return {
    action: 'lead_created',
    client_id: data.id,
    client_name: data.nome
  }
}

async function createAppointment(supabase: any, params: any) {
  const {
    client_id,
    service_type,
    date,
    time,
    duration = 180,
    notes,
    source = 'chat'
  } = params

  // Verificar disponibilidade
  const { data: conflicts } = await supabase
    .from('agendamentos')
    .select('id')
    .eq('data', date)
    .eq('horario_inicio', time)
    .not('status', 'in', '("cancelado","reagendado")')

  if (conflicts && conflicts.length > 0) {
    return {
      action: 'slot_unavailable',
      message: 'This time slot is not available'
    }
  }

  // Calcular horário de término
  const [hours, minutes] = time.split(':').map(Number)
  const endDate = new Date()
  endDate.setHours(hours, minutes + duration)
  const endTime = endDate.toTimeString().slice(0, 5)

  // Criar agendamento
  const { data, error } = await supabase
    .from('agendamentos')
    .insert({
      cliente_id: client_id,
      tipo: service_type || 'regular',
      data: date,
      horario_inicio: time,
      horario_fim_estimado: endTime,
      duracao_minutos: duration,
      status: 'agendado',
      origem: source,
      notas: notes || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating appointment:', error)
    return { action: 'error', message: error.message }
  }

  return {
    action: 'appointment_created',
    appointment_id: data.id,
    date,
    time,
    status: 'agendado'
  }
}

async function updateLead(supabase: any, params: any) {
  const { client_id, updates } = params

  const { data, error } = await supabase
    .from('clientes')
    .update(updates)
    .eq('id', client_id)
    .select()
    .single()

  if (error) {
    return { action: 'error', message: error.message }
  }

  return {
    action: 'lead_updated',
    client_id: data.id
  }
}

async function checkAvailability(supabase: any, params: any) {
  const { date, duration = 180 } = params

  // Buscar slots disponíveis usando a função do banco
  const { data, error } = await supabase
    .rpc('get_available_slots', {
      target_date: date,
      service_duration: duration
    })

  if (error) {
    return { action: 'error', message: error.message }
  }

  return {
    action: 'availability_checked',
    date,
    available_slots: data || []
  }
}

async function getPricing(supabase: any, params: any) {
  const { service_type, bedrooms, bathrooms, square_feet } = params

  // Buscar preço base do serviço
  const { data: service } = await supabase
    .from('tipos_servico')
    .select('preco_base, duracao_padrao')
    .eq('nome', service_type)
    .single()

  if (!service) {
    // Retornar preços padrão
    return {
      action: 'pricing_calculated',
      base_price: 150,
      estimated_price: calculateEstimate(150, bedrooms, bathrooms),
      service_type: service_type || 'regular'
    }
  }

  const estimatedPrice = calculateEstimate(
    service.preco_base, 
    bedrooms, 
    bathrooms, 
    square_feet
  )

  return {
    action: 'pricing_calculated',
    base_price: service.preco_base,
    estimated_price: estimatedPrice,
    duration: service.duracao_padrao,
    service_type
  }
}

function calculateEstimate(
  basePrice: number, 
  bedrooms?: number, 
  bathrooms?: number,
  sqft?: number
): number {
  let price = basePrice

  // Ajustar por quartos (acima de 2)
  if (bedrooms && bedrooms > 2) {
    price += (bedrooms - 2) * 25
  }

  // Ajustar por banheiros (acima de 2)
  if (bathrooms && bathrooms > 2) {
    price += (bathrooms - 2) * 20
  }

  // Ajustar por área (acima de 1500 sqft)
  if (sqft && sqft > 1500) {
    price += Math.floor((sqft - 1500) / 500) * 30
  }

  return price
}
```

### 2.2 Webhook WhatsApp - app/api/webhook/whatsapp/route.ts

```typescript
// app/api/webhook/whatsapp/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface EvolutionWebhookPayload {
  event: string
  instance: string
  data: {
    key: {
      remoteJid: string
      fromMe: boolean
      id: string
    }
    pushName?: string
    message?: {
      conversation?: string
      extendedTextMessage?: {
        text: string
      }
    }
    messageType: string
    messageTimestamp: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload: EvolutionWebhookPayload = await request.json()
    const supabase = await createClient()

    console.log('[WhatsApp Webhook]', payload.event, payload.data?.key?.remoteJid)

    // Apenas processar mensagens recebidas (não enviadas por nós)
    if (payload.event !== 'messages.upsert' || payload.data?.key?.fromMe) {
      return NextResponse.json({ success: true, action: 'ignored' })
    }

    // Extrair informações
    const phone = payload.data.key.remoteJid.replace('@s.whatsapp.net', '')
    const messageContent = 
      payload.data.message?.conversation || 
      payload.data.message?.extendedTextMessage?.text || ''
    const senderName = payload.data.pushName || 'WhatsApp User'

    // Gerar session_id baseado no telefone
    const sessionId = `whatsapp_${phone}`

    // Salvar mensagem no banco
    const { data: savedMessage, error } = await supabase
      .from('mensagens_chat')
      .insert({
        session_id: sessionId,
        role: 'user',
        content: messageContent,
        source: 'whatsapp',
        lead_info: {
          nome: senderName,
          telefone: phone,
        },
        metadata: {
          whatsapp_message_id: payload.data.key.id,
          timestamp: payload.data.messageTimestamp,
        },
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving WhatsApp message:', error)
      return NextResponse.json({ error: 'Failed to save message' }, { status: 500 })
    }

    // Disparar processamento no n8n
    await triggerN8nWorkflow({
      event: 'whatsapp.message.received',
      session_id: sessionId,
      message_id: savedMessage.id,
      phone,
      name: senderName,
      content: messageContent,
    })

    return NextResponse.json({
      success: true,
      message_id: savedMessage.id,
      session_id: sessionId
    })

  } catch (error) {
    console.error('[WhatsApp Webhook] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Função para disparar workflow no n8n
async function triggerN8nWorkflow(data: any) {
  const n8nWebhookUrl = process.env.N8N_TRIGGER_WEBHOOK_URL
  
  if (!n8nWebhookUrl) {
    console.warn('N8N_TRIGGER_WEBHOOK_URL not configured')
    return
  }

  try {
    await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': process.env.N8N_WEBHOOK_SECRET || '',
      },
      body: JSON.stringify(data),
    })
  } catch (error) {
    console.error('Error triggering n8n workflow:', error)
  }
}
```

### 2.3 Response Webhook - app/api/webhook/response/route.ts

```typescript
// app/api/webhook/response/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface ResponsePayload {
  session_id: string
  message: string
  source: 'website' | 'whatsapp'
  phone?: string  // Para WhatsApp
  metadata?: Record<string, any>
}

export async function POST(request: NextRequest) {
  try {
    const payload: ResponsePayload = await request.json()
    const supabase = await createClient()

    const { session_id, message, source, phone, metadata } = payload

    // Salvar resposta no banco
    const { data: savedMessage, error } = await supabase
      .from('mensagens_chat')
      .insert({
        session_id,
        role: 'assistant',
        content: message,
        source,
        metadata,
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving response:', error)
      return NextResponse.json({ error: 'Failed to save response' }, { status: 500 })
    }

    // Se for WhatsApp, enviar via Evolution API
    if (source === 'whatsapp' && phone) {
      await sendWhatsAppMessage(phone, message)
    }

    return NextResponse.json({
      success: true,
      message_id: savedMessage.id
    })

  } catch (error) {
    console.error('[Response Webhook] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function sendWhatsAppMessage(phone: string, message: string) {
  const evolutionUrl = process.env.EVOLUTION_API_URL
  const evolutionKey = process.env.EVOLUTION_API_KEY
  const instance = process.env.EVOLUTION_INSTANCE || 'caroline'

  if (!evolutionUrl || !evolutionKey) {
    console.warn('Evolution API not configured')
    return
  }

  try {
    await fetch(`${evolutionUrl}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey,
      },
      body: JSON.stringify({
        number: phone,
        text: message,
      }),
    })
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
  }
}
```

---

## 3. API DE CONSULTA PARA IA

### 3.1 Query Endpoint - app/api/carol/query/route.ts

```typescript
// app/api/carol/query/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type QueryType = 
  | 'client_info'
  | 'client_history'
  | 'available_slots'
  | 'service_pricing'
  | 'service_areas'
  | 'business_info'

interface QueryPayload {
  type: QueryType
  params: Record<string, any>
}

export async function POST(request: NextRequest) {
  try {
    const { type, params }: QueryPayload = await request.json()
    const supabase = await createClient()

    let result: any = null

    switch (type) {
      case 'client_info':
        result = await queryClientInfo(supabase, params)
        break

      case 'client_history':
        result = await queryClientHistory(supabase, params)
        break

      case 'available_slots':
        result = await queryAvailableSlots(supabase, params)
        break

      case 'service_pricing':
        result = await queryServicePricing(supabase, params)
        break

      case 'service_areas':
        result = await queryServiceAreas(supabase, params)
        break

      case 'business_info':
        result = await queryBusinessInfo(supabase)
        break

      default:
        return NextResponse.json({ error: 'Unknown query type' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      type,
      data: result
    })

  } catch (error) {
    console.error('[Carol Query] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Buscar informações do cliente
async function queryClientInfo(supabase: any, params: any) {
  const { phone, email, client_id } = params

  let query = supabase.from('clientes').select(`
    id, nome, telefone, email, status,
    endereco_completo, cidade, estado, zip_code,
    tipo_residencia, bedrooms, bathrooms, square_feet,
    tipo_servico_padrao, frequencia, dia_preferido,
    tem_pets, pets_detalhes,
    notas
  `)

  if (client_id) {
    query = query.eq('id', client_id)
  } else if (phone) {
    query = query.eq('telefone', phone)
  } else if (email) {
    query = query.eq('email', email)
  } else {
    return null
  }

  const { data, error } = await query.single()

  if (error) return null
  return data
}

// Buscar histórico do cliente
async function queryClientHistory(supabase: any, params: any) {
  const { client_id, phone, limit = 5 } = params

  let clientId = client_id

  // Se passou telefone, buscar client_id
  if (!clientId && phone) {
    const { data: client } = await supabase
      .from('clientes')
      .select('id')
      .eq('telefone', phone)
      .single()
    
    clientId = client?.id
  }

  if (!clientId) return { appointments: [], total_spent: 0 }

  // Buscar agendamentos
  const { data: appointments } = await supabase
    .from('agendamentos')
    .select('id, tipo, data, horario_inicio, status, valor')
    .eq('cliente_id', clientId)
    .order('data', { ascending: false })
    .limit(limit)

  // Buscar total gasto
  const { data: financial } = await supabase
    .from('financeiro')
    .select('valor')
    .eq('cliente_id', clientId)
    .eq('tipo', 'receita')
    .eq('status', 'pago')

  const totalSpent = financial?.reduce((acc: number, f: any) => acc + f.valor, 0) || 0

  return {
    client_id: clientId,
    appointments: appointments || [],
    total_appointments: appointments?.length || 0,
    total_spent: totalSpent,
    is_returning_client: (appointments?.length || 0) > 0
  }
}

// Buscar slots disponíveis
async function queryAvailableSlots(supabase: any, params: any) {
  const { date, duration = 180, days_ahead = 7 } = params

  const slots: any[] = []
  const startDate = date ? new Date(date) : new Date()

  for (let i = 0; i < days_ahead; i++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(currentDate.getDate() + i)
    
    // Pular domingos
    if (currentDate.getDay() === 0) continue

    const dateStr = currentDate.toISOString().split('T')[0]

    // Buscar agendamentos do dia
    const { data: booked } = await supabase
      .from('agendamentos')
      .select('horario_inicio, horario_fim_estimado')
      .eq('data', dateStr)
      .not('status', 'in', '("cancelado","reagendado")')

    // Horários disponíveis (8h às 17h)
    const availableHours = []
    for (let hour = 8; hour <= 17; hour++) {
      const timeStr = `${hour.toString().padStart(2, '0')}:00`
      
      // Verificar se o horário está livre
      const isBooked = booked?.some((apt: any) => {
        return apt.horario_inicio <= timeStr && apt.horario_fim_estimado > timeStr
      })

      if (!isBooked) {
        availableHours.push(timeStr)
      }
    }

    if (availableHours.length > 0) {
      slots.push({
        date: dateStr,
        day_of_week: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
        available_times: availableHours
      })
    }
  }

  return {
    slots,
    duration_requested: duration,
    total_available: slots.reduce((acc, s) => acc + s.available_times.length, 0)
  }
}

// Buscar preços dos serviços
async function queryServicePricing(supabase: any, params: any) {
  const { service_type } = params

  let query = supabase
    .from('tipos_servico')
    .select('nome, descricao, preco_base, duracao_padrao')
    .eq('ativo', true)
    .order('ordem')

  if (service_type) {
    query = query.eq('nome', service_type)
  }

  const { data } = await query

  // Formatar para a IA
  return {
    services: data?.map((s: any) => ({
      name: s.nome,
      description: s.descricao,
      base_price: s.preco_base,
      duration_minutes: s.duracao_padrao,
      price_range: `$${s.preco_base} - $${Math.round(s.preco_base * 1.5)}`
    })) || [],
    note: 'Prices may vary based on home size and specific requirements'
  }
}

// Buscar áreas atendidas
async function queryServiceAreas(supabase: any, params: any) {
  const { zip_code } = params

  const { data: areas } = await supabase
    .from('areas_atendidas')
    .select('nome, tipo, zip_codes, taxa_adicional')
    .eq('ativo', true)

  // Se passou ZIP code, verificar se é atendido
  let isServiced = false
  let additionalFee = 0

  if (zip_code && areas) {
    for (const area of areas) {
      if (area.zip_codes?.includes(zip_code)) {
        isServiced = true
        additionalFee = area.taxa_adicional || 0
        break
      }
    }
  }

  return {
    areas: areas?.map((a: any) => ({
      name: a.nome,
      type: a.tipo,
      additional_fee: a.taxa_adicional
    })) || [],
    zip_code_check: zip_code ? {
      zip_code,
      is_serviced: isServiced,
      additional_fee: additionalFee
    } : null
  }
}

// Buscar informações do negócio
async function queryBusinessInfo(supabase: any) {
  const { data } = await supabase
    .from('configuracoes')
    .select('settings')
    .eq('id', 1)
    .single()

  const settings = data?.settings || {}

  return {
    name: settings.business_name || 'Caroline Premium Cleaning',
    phone: settings.business_phone || '(305) 555-0123',
    email: settings.business_email || 'hello@carolinecleaning.com',
    hours: {
      start: settings.operating_start || '08:00',
      end: settings.operating_end || '18:00',
      days: settings.operating_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    },
    booking_rules: {
      min_notice_hours: settings.min_booking_notice || 24,
      max_advance_days: settings.max_booking_advance || 30
    }
  }
}
```

---

## 4. ACTIONS API

### 4.1 Actions Endpoint - app/api/carol/actions/route.ts

```typescript
// app/api/carol/actions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type ActionType =
  | 'create_lead'
  | 'update_lead'
  | 'create_appointment'
  | 'confirm_appointment'
  | 'cancel_appointment'
  | 'send_quote'
  | 'schedule_callback'

interface ActionPayload {
  action: ActionType
  session_id: string
  params: Record<string, any>
}

export async function POST(request: NextRequest) {
  try {
    const payload: ActionPayload = await request.json()
    const supabase = await createClient()

    const { action, session_id, params } = payload

    let result: any = null

    switch (action) {
      case 'create_lead':
        result = await actionCreateLead(supabase, session_id, params)
        break

      case 'update_lead':
        result = await actionUpdateLead(supabase, params)
        break

      case 'create_appointment':
        result = await actionCreateAppointment(supabase, session_id, params)
        break

      case 'confirm_appointment':
        result = await actionConfirmAppointment(supabase, params)
        break

      case 'cancel_appointment':
        result = await actionCancelAppointment(supabase, params)
        break

      case 'send_quote':
        result = await actionSendQuote(supabase, session_id, params)
        break

      case 'schedule_callback':
        result = await actionScheduleCallback(supabase, session_id, params)
        break

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

    // Log da ação executada
    await supabase.from('action_logs').insert({
      session_id,
      action_type: action,
      params,
      result,
      created_at: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      action,
      result
    })

  } catch (error) {
    console.error('[Carol Actions] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Criar lead
async function actionCreateLead(supabase: any, sessionId: string, params: any) {
  const { name, phone, email, zip_code, service_interest, notes } = params

  // Verificar se já existe
  if (phone) {
    const { data: existing } = await supabase
      .from('clientes')
      .select('id, nome, status')
      .eq('telefone', phone)
      .single()

    if (existing) {
      return {
        status: 'existing',
        client_id: existing.id,
        client_name: existing.nome,
        client_status: existing.status,
        message: 'Client already exists in our system'
      }
    }
  }

  // Criar novo lead
  const { data, error } = await supabase
    .from('clientes')
    .insert({
      nome: name || 'New Lead',
      telefone: phone,
      email: email || null,
      zip_code: zip_code || null,
      status: 'lead',
      origem: 'chat_carol',
      tipo_servico_padrao: service_interest || null,
      notas: notes || null,
      session_id: sessionId,
    })
    .select()
    .single()

  if (error) {
    return { status: 'error', message: error.message }
  }

  return {
    status: 'created',
    client_id: data.id,
    client_name: data.nome,
    message: 'Lead created successfully'
  }
}

// Atualizar lead
async function actionUpdateLead(supabase: any, params: any) {
  const { client_id, phone, updates } = params

  let clientId = client_id

  // Se não tem client_id, buscar pelo telefone
  if (!clientId && phone) {
    const { data } = await supabase
      .from('clientes')
      .select('id')
      .eq('telefone', phone)
      .single()
    
    clientId = data?.id
  }

  if (!clientId) {
    return { status: 'not_found', message: 'Client not found' }
  }

  // Campos permitidos para atualização
  const allowedFields = [
    'nome', 'email', 'zip_code', 'endereco_completo',
    'cidade', 'estado', 'tipo_residencia', 'bedrooms',
    'bathrooms', 'square_feet', 'tipo_servico_padrao',
    'frequencia', 'dia_preferido', 'tem_pets', 'pets_detalhes',
    'notas'
  ]

  const filteredUpdates: Record<string, any> = {}
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      filteredUpdates[key] = value
    }
  }

  const { error } = await supabase
    .from('clientes')
    .update(filteredUpdates)
    .eq('id', clientId)

  if (error) {
    return { status: 'error', message: error.message }
  }

  return {
    status: 'updated',
    client_id: clientId,
    updated_fields: Object.keys(filteredUpdates)
  }
}

// Criar agendamento
async function actionCreateAppointment(supabase: any, sessionId: string, params: any) {
  const {
    client_id,
    phone,
    service_type = 'regular',
    date,
    time,
    duration = 180,
    notes
  } = params

  let clientId = client_id

  // Buscar cliente pelo telefone se necessário
  if (!clientId && phone) {
    const { data } = await supabase
      .from('clientes')
      .select('id')
      .eq('telefone', phone)
      .single()
    
    clientId = data?.id
  }

  if (!clientId) {
    return { status: 'error', message: 'Client not found. Create lead first.' }
  }

  // Verificar disponibilidade
  const { data: conflicts } = await supabase
    .from('agendamentos')
    .select('id, horario_inicio')
    .eq('data', date)
    .not('status', 'in', '("cancelado","reagendado")')

  // Verificar conflito de horário
  const hasConflict = conflicts?.some((apt: any) => {
    return apt.horario_inicio === time
  })

  if (hasConflict) {
    return {
      status: 'conflict',
      message: 'This time slot is already booked',
      suggested_times: await getSuggestedTimes(supabase, date, conflicts)
    }
  }

  // Calcular horário de término
  const [hours, minutes] = time.split(':').map(Number)
  const endDate = new Date()
  endDate.setHours(hours, minutes + duration)
  const endTime = endDate.toTimeString().slice(0, 5)

  // Criar agendamento
  const { data: appointment, error } = await supabase
    .from('agendamentos')
    .insert({
      cliente_id: clientId,
      tipo: service_type,
      data: date,
      horario_inicio: time,
      horario_fim_estimado: endTime,
      duracao_minutos: duration,
      status: 'agendado',
      origem: 'chat_carol',
      notas: notes || null,
    })
    .select()
    .single()

  if (error) {
    return { status: 'error', message: error.message }
  }

  // Buscar dados do cliente para confirmação
  const { data: client } = await supabase
    .from('clientes')
    .select('nome, telefone, endereco_completo')
    .eq('id', clientId)
    .single()

  return {
    status: 'created',
    appointment_id: appointment.id,
    details: {
      client_name: client?.nome,
      service: service_type,
      date,
      time,
      duration,
      address: client?.endereco_completo
    },
    confirmation_message: `Great! I've scheduled your ${service_type} cleaning for ${date} at ${time}. We'll send you a confirmation shortly!`
  }
}

// Confirmar agendamento
async function actionConfirmAppointment(supabase: any, params: any) {
  const { appointment_id } = params

  const { error } = await supabase
    .from('agendamentos')
    .update({ status: 'confirmado' })
    .eq('id', appointment_id)

  if (error) {
    return { status: 'error', message: error.message }
  }

  return {
    status: 'confirmed',
    appointment_id
  }
}

// Cancelar agendamento
async function actionCancelAppointment(supabase: any, params: any) {
  const { appointment_id, reason } = params

  const { error } = await supabase
    .from('agendamentos')
    .update({ 
      status: 'cancelado',
      motivo_cancelamento: reason || 'Cancelled via chat'
    })
    .eq('id', appointment_id)

  if (error) {
    return { status: 'error', message: error.message }
  }

  return {
    status: 'cancelled',
    appointment_id,
    message: 'Appointment cancelled successfully'
  }
}

// Enviar orçamento
async function actionSendQuote(supabase: any, sessionId: string, params: any) {
  const { 
    client_id, 
    service_type, 
    estimated_price, 
    details 
  } = params

  // Registrar orçamento
  const { data, error } = await supabase
    .from('orcamentos')
    .insert({
      cliente_id: client_id,
      session_id: sessionId,
      tipo_servico: service_type,
      valor_estimado: estimated_price,
      detalhes: details,
      status: 'enviado',
    })
    .select()
    .single()

  if (error) {
    return { status: 'error', message: error.message }
  }

  return {
    status: 'sent',
    quote_id: data.id,
    amount: estimated_price,
    message: `Quote sent for ${service_type}: $${estimated_price}`
  }
}

// Agendar callback
async function actionScheduleCallback(supabase: any, sessionId: string, params: any) {
  const { client_id, phone, preferred_time, notes } = params

  const { data, error } = await supabase
    .from('callbacks')
    .insert({
      cliente_id: client_id,
      session_id: sessionId,
      telefone: phone,
      horario_preferido: preferred_time,
      notas: notes,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    return { status: 'error', message: error.message }
  }

  return {
    status: 'scheduled',
    callback_id: data.id,
    message: 'Callback scheduled. Our team will contact you soon!'
  }
}

// Helper: Sugerir horários alternativos
async function getSuggestedTimes(supabase: any, date: string, conflicts: any[]) {
  const bookedTimes = conflicts?.map(c => c.horario_inicio) || []
  const allTimes = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00']
  
  return allTimes.filter(t => !bookedTimes.includes(t)).slice(0, 3)
}
```

---

## 5. ATUALIZAR CHAT API

### 5.1 Atualizar app/api/chat/route.ts

```typescript
// app/api/chat/route.ts
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
    const headersList = headers()
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
        ip_address: ipAddress,
        user_agent: userAgent,
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
        const n8nResponse = await fetch(n8nWebhookUrl, {
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
        })

        // n8n vai responder via /api/webhook/response
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
        // Fallback para resposta mock se n8n falhar
      }
    }

    // Modo desenvolvimento ou fallback: Resposta mock
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
        timestamp: assistantMessage?.created_at || new Date().toISOString()
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
```

---

## 6. TABELAS ADICIONAIS NO SUPABASE

Execute no SQL Editor:

```sql
-- Tabela de sessões de chat
CREATE TABLE IF NOT EXISTS chat_sessions (
  id VARCHAR(100) PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id),
  source VARCHAR(20) DEFAULT 'website',
  status VARCHAR(20) DEFAULT 'active',
  last_intent VARCHAR(100),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de logs de ações
CREATE TABLE IF NOT EXISTS action_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id VARCHAR(100),
  action_type VARCHAR(50) NOT NULL,
  params JSONB,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de orçamentos
CREATE TABLE IF NOT EXISTS orcamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES clientes(id),
  session_id VARCHAR(100),
  tipo_servico VARCHAR(50),
  valor_estimado DECIMAL(10,2),
  detalhes JSONB,
  status VARCHAR(20) DEFAULT 'enviado',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- Tabela de callbacks
CREATE TABLE IF NOT EXISTS callbacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES clientes(id),
  session_id VARCHAR(100),
  telefone VARCHAR(20),
  horario_preferido VARCHAR(50),
  notas TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  atendido_por UUID,
  atendido_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  canal VARCHAR(20) NOT NULL, -- whatsapp, email, sms
  destinatario VARCHAR(100) NOT NULL,
  template VARCHAR(50),
  dados JSONB,
  status VARCHAR(20) DEFAULT 'pending',
  enviado_em TIMESTAMPTZ,
  erro TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar coluna source na tabela mensagens_chat se não existir
ALTER TABLE mensagens_chat 
ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'website';

ALTER TABLE mensagens_chat 
ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id);

ALTER TABLE mensagens_chat 
ADD COLUMN IF NOT EXISTS intent_detected VARCHAR(100);

ALTER TABLE mensagens_chat 
ADD COLUMN IF NOT EXISTS intent_confidence DECIMAL(3,2);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_cliente ON chat_sessions(cliente_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_activity ON chat_sessions(last_activity);
CREATE INDEX IF NOT EXISTS idx_action_logs_session ON action_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_created ON action_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_callbacks_status ON callbacks(status);
CREATE INDEX IF NOT EXISTS idx_notificacoes_status ON notificacoes(status);

-- View para conversas recentes
CREATE OR REPLACE VIEW v_conversas_recentes AS
SELECT 
  cs.id as session_id,
  cs.source,
  cs.status,
  cs.last_activity,
  c.id as cliente_id,
  c.nome as cliente_nome,
  c.telefone as cliente_telefone,
  (
    SELECT content 
    FROM mensagens_chat 
    WHERE session_id = cs.id 
    ORDER BY created_at DESC 
    LIMIT 1
  ) as ultima_mensagem,
  (
    SELECT COUNT(*) 
    FROM mensagens_chat 
    WHERE session_id = cs.id
  ) as total_mensagens
FROM chat_sessions cs
LEFT JOIN clientes c ON cs.cliente_id = c.id
ORDER BY cs.last_activity DESC;
```

---

## 7. VARIÁVEIS DE AMBIENTE

Adicionar ao `.env.local`:

```env
# N8N Configuration
N8N_WEBHOOK_SECRET=your-secure-webhook-secret-here
N8N_CHAT_WEBHOOK_URL=https://your-n8n-instance.com/webhook/carol-chat
N8N_TRIGGER_WEBHOOK_URL=https://your-n8n-instance.com/webhook/carol-trigger

# Evolution API (WhatsApp)
EVOLUTION_API_URL=https://your-evolution-api.com
EVOLUTION_API_KEY=your-evolution-api-key
EVOLUTION_INSTANCE=caroline

# OpenAI (para IA no n8n)
OPENAI_API_KEY=sk-your-openai-key
```

---

## 8. WORKFLOW N8N

### 8.1 Estrutura do Workflow Principal

```json
{
  "name": "Carol - Chat Processor",
  "nodes": [
    {
      "name": "Webhook Receiver",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "carol-chat",
        "httpMethod": "POST",
        "authentication": "headerAuth"
      }
    },
    {
      "name": "Get Context",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "={{$env.APP_URL}}/api/carol/query",
        "method": "POST",
        "body": {
          "type": "client_history",
          "params": {
            "phone": "={{$json.phone}}",
            "session_id": "={{$json.session_id}}"
          }
        }
      }
    },
    {
      "name": "Process with AI",
      "type": "n8n-nodes-base.openAi",
      "parameters": {
        "model": "gpt-4",
        "messages": [
          {
            "role": "system",
            "content": "You are Carol, a friendly assistant for Caroline Premium Cleaning..."
          },
          {
            "role": "user",
            "content": "={{$json.content}}"
          }
        ]
      }
    },
    {
      "name": "Extract Intent",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "// Extract intent from AI response..."
      }
    },
    {
      "name": "Execute Action",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "={{$env.APP_URL}}/api/carol/actions",
        "method": "POST"
      }
    },
    {
      "name": "Send Response",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "={{$env.APP_URL}}/api/webhook/response",
        "method": "POST"
      }
    }
  ]
}
```

### 8.2 System Prompt para a Carol

```markdown
You are Carol, a friendly and professional AI assistant for Caroline Premium Cleaning, a premium house cleaning service in Miami, Florida.

## Your Personality
- Warm, friendly, and professional
- Helpful and patient
- Knowledgeable about cleaning services
- Focused on customer satisfaction

## Your Capabilities
1. Answer questions about services and pricing
2. Check availability and schedule appointments
3. Collect lead information (name, phone, email, address)
4. Provide quotes based on home details
5. Help existing clients with their accounts

## Service Information
- Regular Cleaning: $120-200 (weekly/biweekly maintenance)
- Deep Cleaning: $200-350 (thorough cleaning)
- Move-in/Move-out: $250-400 (complete property cleaning)
- Office Cleaning: Starting at $100

## Service Areas
Miami Beach, Coral Gables, Brickell, Downtown Miami, Coconut Grove, Key Biscayne, Wynwood

## Guidelines
1. Always be helpful and positive
2. If asked about availability, check the system first
3. Collect information naturally through conversation
4. If you need to create a lead or appointment, extract the required data
5. For pricing, ask about bedrooms and bathrooms
6. Never make up information about specific appointments or clients
7. If unsure, offer to have a team member call back

## Response Format
Keep responses concise and friendly. Use emojis sparingly. Break long responses into readable chunks.

## Actions You Can Take
- CREATE_LEAD: When you have name and phone number
- CHECK_AVAILABILITY: When user asks about dates/times
- CREATE_APPOINTMENT: When user confirms booking
- GET_PRICING: When user asks about costs
- SCHEDULE_CALLBACK: When user prefers to talk to a human
```

---

## 9. COMPONENTE DE CHAT ATUALIZADO

### 9.1 Atualizar hooks/use-chat.ts

```typescript
// hooks/use-chat.ts
'use client'

import { useState, useCallback, useEffect } from 'react'
import { useChatSession } from './use-chat-session'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  status?: 'sending' | 'sent' | 'error' | 'processing'
}

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
        const response = await fetch(`/api/chat/status?sessionId=${sessionId}`)
        const data = await response.json()

        if (data.hasNewMessage) {
          setMessages(prev => [
            ...prev.filter(m => m.status !== 'processing'),
            {
              id: data.message.id,
              role: 'assistant',
              content: data.message.content,
              timestamp: data.message.timestamp,
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
      timestamp: new Date().toISOString(),
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
            timestamp: new Date().toISOString(),
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
              timestamp: data.message.timestamp || new Date().toISOString(),
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
```

---

## 10. CHECKLIST DE VALIDAÇÃO

### APIs
- [ ] POST /api/webhook/n8n funciona
- [ ] POST /api/webhook/whatsapp funciona
- [ ] POST /api/webhook/response funciona
- [ ] POST /api/carol/query funciona
- [ ] POST /api/carol/actions funciona

### Integrações
- [ ] Chat website envia para n8n (se configurado)
- [ ] Fallback mock funciona sem n8n
- [ ] Criação de lead automática funciona
- [ ] Criação de agendamento funciona
- [ ] Consulta de disponibilidade funciona

### Banco de Dados
- [ ] Tabela chat_sessions criada
- [ ] Tabela action_logs criada
- [ ] Tabela orcamentos criada
- [ ] Tabela callbacks criada
- [ ] Tabela notificacoes criada

### N8N (se configurado)
- [ ] Workflow criado
- [ ] Webhook recebe mensagens
- [ ] IA processa corretamente
- [ ] Ações são executadas
- [ ] Respostas são enviadas

---

## ✅ DEFINIÇÃO DE PRONTO

A Fase 6 está COMPLETA quando:

1. ✅ Webhook n8n recebendo e processando mensagens
2. ✅ API de query retornando dados para IA
3. ✅ Actions API executando ações
4. ✅ Chat funcionando com fallback mock
5. ✅ Criação automática de leads
6. ✅ Criação automática de agendamentos
7. ✅ Consulta de disponibilidade funcionando
8. ✅ Tabelas de suporte criadas
9. ✅ Logs de ações registrados
10. ✅ Build passa sem erros

---

## 🔗 PRÓXIMA FASE

**FASE 7: Analytics e Relatórios**
- Dashboard de métricas
- Relatórios de conversão
- Análise de conversas
- Integração Google Analytics

---

**— FIM DA FASE 6 —**

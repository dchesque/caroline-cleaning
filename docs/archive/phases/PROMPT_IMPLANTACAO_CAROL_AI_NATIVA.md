# 🤖 PROMPT DE IMPLANTAÇÃO: CAROL AI NATIVA NO NEXT.JS

**Projeto:** Chesque Premium Cleaning  
**Versão:** 1.0  
**Data:** Fevereiro 2026  
**Objetivo:** Implementar assistente conversacional IA integrada nativamente ao Next.js (sem dependência de n8n)

---

## 1. VISÃO GERAL DA IMPLANTAÇÃO

### Objetivo da Funcionalidade
Criar a **Carol AI** - assistente virtual conversacional totalmente integrada ao Next.js usando OpenRouter (Claude 3.5 Sonnet), eliminando a dependência de n8n e simplificando a arquitetura do sistema.

### Problema que Resolve
**Problema atual:**
- Dependência de infraestrutura externa (n8n self-hosted)
- Latência adicional devido a roundtrip de webhooks
- Debugging complexo entre dois sistemas (App + n8n)
- Custo operacional extra (hosting n8n)
- Deploy em duas etapas (App + workflows)

**Solução:**
- Carol AI nativa processando conversas diretamente no Next.js
- Comunicação direta com Supabase (sem intermediários)
- Latência reduzida em ~50% (sem webhooks)
- Debugging unificado (logs no mesmo sistema)
- Deploy simplificado (single container Docker)
- Redução de custos operacionais

### Escopo da Implantação
Esta implantação inclui:
- ✅ Biblioteca de agente IA com OpenRouter client
- ✅ System prompts otimizados para conversação natural bilíngue (PT/EN)
- ✅ 5 function tools integradas ao Supabase
- ✅ API route para chat com error handling robusto
- ✅ React hook para gerenciar estado do chat
- ✅ TypeScript types completos
- ✅ Logging estruturado e observabilidade
- ✅ Rate limiting específico para chat
- ✅ Testes e validações

Esta implantação **NÃO** inclui:
- ❌ Integração com n8n (será removida)
- ❌ Webhooks para processamento externo
- ❌ WhatsApp (Evolution API) - fase futura
- ❌ Streaming de respostas - fase futura
- ❌ Multi-modelo fallback - fase futura

---

## 2. ANÁLISE DE CONTEXTO OBRIGATÓRIA

**INSTRUÇÃO CRÍTICA PARA O ANTIGRAVITY:**

Antes de iniciar QUALQUER implementação, você DEVE:

### 2.1 Analisar o `.context` do Projeto
Localize e analise os seguintes arquivos na pasta `.context/`:
- `.context/docs/project-overview.md` - Visão geral do projeto
- `.context/docs/architecture.md` - Arquitetura e camadas
- `.context/docs/data-flow.md` - Fluxo de dados e integrações
- `.context/agents/backend-specialist.md` - Padrões de API routes
- `.context/agents/database-specialist.md` - Esquema do banco

### 2.2 Analisar o Repositório GitHub (Base de Conhecimento)
Examine a estrutura atual:
- **Estrutura de pastas:** `lib/`, `app/api/`, `types/`, `components/`, `hooks/`
- **Padrões de código:** Como são criados services, API routes, hooks
- **Convenções:** Nomenclatura, organização, imports
- **Dependências:** package.json, bibliotecas já instaladas
- **Database:** Tabelas existentes, funções RPC, tipos gerados

### 2.3 Identificar Padrões Existentes
Busque e respeite:
- Como são criados clientes Supabase (`lib/supabase/server.ts`, `lib/supabase/client.ts`)
- Padrão de formatadores (`lib/formatters.ts`, `lib/utils.ts`)
- Estrutura de types (`types/supabase.ts`, `types/index.ts`)
- Como são implementadas API routes (`app/api/*/route.ts`)
- Padrão de hooks React (`hooks/use-*.ts`)
- Sistema de logging (`lib/logger.ts`)
- Error handling existente

### 2.4 Verificar Database Schema
Confirme a existência destas tabelas e funções:

**Tabelas:**
- `mensagens_chat` (id, session_id, role, content, cliente_id, source, created_at)
- `clientes` (id, nome, telefone, email, endereco, cidade, estado, cep, status, origem, notas)
- `agendamentos` (id, cliente_id, data, horario, servico, duracao_minutos, valor, status, observacoes)

**Funções PostgreSQL (RPC):**
- `get_available_slots(p_date DATE, p_duration INTEGER)` - Retorna slots disponíveis
- `calculate_service_price(p_bedrooms INTEGER, p_bathrooms NUMERIC, p_service_type VARCHAR, p_frequency VARCHAR)` - Calcula preços
- `check_zip_code_coverage(p_zip_code VARCHAR)` - Verifica se atende CEP

---

## 3. PLANO DE IMPLANTAÇÃO (TAREFAS)

### TAREFA 1: Instalar Dependências e Configurar OpenRouter

**O que fazer:**
- Instalar `openai` SDK (compatível com OpenRouter)
- Instalar `nanoid` para geração de session IDs
- Criar arquivo `lib/ai/openrouter.ts`
- Configurar cliente OpenRouter com base URL customizada
- Exportar constantes de modelos disponíveis

**Estrutura esperada:**
```typescript
// lib/ai/openrouter.ts
import OpenAI from 'openai'

export const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL,
    'X-Title': 'Chesque Premium Cleaning'
  }
})

export const MODELS = {
  CLAUDE_SONNET: 'anthropic/claude-3.5-sonnet',
  GPT4_TURBO: 'openai/gpt-4-turbo',
  LLAMA_70B: 'meta-llama/llama-3.1-70b-instruct'
}
```

**Validação:**
- [ ] Dependências instaladas sem conflitos
- [ ] Cliente OpenRouter exporta corretamente
- [ ] Constantes de modelos disponíveis
- [ ] TypeScript compila sem erros

---

### TAREFA 2: Criar Types TypeScript para Carol AI

**O que fazer:**
- Criar arquivo `types/carol.ts`
- Definir interfaces para mensagens, tool calls, configurações
- Integrar com types existentes do Supabase

**Interfaces necessárias:**
```typescript
// types/carol.ts

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  status?: 'sending' | 'sent' | 'error' | 'processing'
  tool_calls?: ToolCall[]
}

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface ToolResult {
  tool_call_id: string
  role: 'tool'
  name: string
  content: string
}

export interface ChatResponse {
  message: string
  session_id: string
  tool_calls_executed: number
  timestamp: string
}

export interface CarolConfig {
  model: string
  temperature: number
  max_tokens: number
}

// Tool-specific types
export interface CheckAvailabilityParams {
  date: string // YYYY-MM-DD
  duration_minutes: number // 120, 180, 240
}

export interface CalculatePriceParams {
  bedrooms: number
  bathrooms: number
  service_type: 'regular' | 'deep' | 'move_in_out' | 'post_construction'
  frequency?: 'one_time' | 'weekly' | 'biweekly' | 'monthly'
  addons?: Array<'cabinets' | 'fridge' | 'oven' | 'laundry' | 'windows'>
}

export interface CreateLeadParams {
  name: string
  phone: string
  email?: string
  address?: {
    street?: string
    city?: string
    state?: string
    zip_code?: string
  }
  notes?: string
}

export interface CreateBookingParams {
  cliente_id: string
  date: string
  time_slot: string // HH:MM
  service_type: string
  duration_minutes: number
  total_price: number
  special_instructions?: string
}

export interface CheckZipCoverageParams {
  zip_code: string
}
```

**Validação:**
- [ ] Arquivo `types/carol.ts` criado
- [ ] Todas as interfaces definidas
- [ ] Compatibilidade com `types/supabase.ts`
- [ ] Exports configurados corretamente

---

### TAREFA 3: Criar System Prompt e Definições de Tools

**O que fazer:**
- Criar arquivo `lib/ai/prompts.ts`
- Definir system prompt detalhado da Carol
- Definir schemas JSON para os 5 function tools

**System Prompt deve incluir:**
```typescript
// lib/ai/prompts.ts

export const CAROL_SYSTEM_PROMPT = `Você é Carol, assistente virtual da Chesque Premium Cleaning em Miami/Charlotte.

PERSONALIDADE:
- Calorosa, amigável e profissional
- Fala português e inglês fluentemente (detecte o idioma do usuário)
- Empática e paciente
- Focada em resolver o problema do cliente

CAPACIDADES:
✅ Consultar disponibilidade de horários REAIS (função check_availability)
✅ Calcular orçamentos personalizados (função calculate_price)
✅ Capturar informações de contato (função create_lead)
✅ Criar agendamentos confirmados (função create_booking)
✅ Verificar se atendemos o CEP (função check_zip_coverage)
✅ Responder dúvidas sobre serviços, preços, áreas atendidas

REGRAS CRÍTICAS:
❌ NUNCA invente horários disponíveis - SEMPRE use a função check_availability
❌ NUNCA crie agendamento sem confirmar TODOS os dados com o cliente
❌ NUNCA pressione o cliente - seja consultiva, não vendedora
✅ SEMPRE calcule preços usando a função calculate_price (não estime)
✅ Capture lead SUTILMENTE após cliente mostrar interesse genuíno (não logo no início)
✅ Confirme: nome, telefone, endereço, data, horário, serviço ANTES de criar booking
✅ Se não souber algo, seja honesta e ofereça buscar a informação

FLUXO DE CONVERSA IDEAL:
1. Cumprimente e pergunte como pode ajudar
2. Entenda a necessidade (tipo de limpeza, tamanho da casa)
3. Calcule orçamento usando função (se perguntado)
4. Mostre disponibilidade usando função (se interessado)
5. Capture dados de contato SUTILMENTE (ex: "Para confirmar, qual seu nome e telefone?")
6. Confirme TODOS os detalhes
7. Crie agendamento usando função

INFORMAÇÕES SOBRE SERVIÇOS:

**Tipos de Serviço:**
- Regular Cleaning: Limpeza padrão semanal/quinzenal (2-3h)
- Deep Cleaning: Limpeza profunda inicial (3-4h)
- Move In/Out: Limpeza pré/pós mudança (3-5h)
- Post-Construction: Limpeza pós-obra (4-6h)

**Preços Base (use a função calculate_price para valores exatos):**
- Studio/1BR: $89-129
- 2BR: $119-159
- 3BR: $149-199
- 4BR+: $189-249
- Frequência reduz preço: semanal -15%, quinzenal -10%

**Add-ons Disponíveis ($25-45 cada):**
- Interior de armários (cabinets): $30
- Geladeira (fridge): $35
- Forno (oven): $30
- Lavanderia (laundry): $25
- Janelas (windows): $45

**Áreas Atendidas:**
Miami Beach, Brickell, Coral Gables, Coconut Grove, Downtown Miami, Wynwood, Edgewater, Midtown

**CEPs Principais:**
33139, 33140, 33141, 33154 (Miami Beach)
33131, 33132 (Brickell/Downtown)
33134, 33133, 33146 (Coral Gables)
33145 (Coconut Grove)

**Diferenciais:**
✨ "No Contracts Ever" - sem fidelidade
✨ Profissionais treinados e verificados
✨ Produtos ecológicos inclusos
✨ Satisfação 100% garantida
✨ Agendamento online fácil

TOM DE CONVERSA:
- Natural e conversacional (como uma pessoa real)
- Evite formalidades excessivas
- Use emojis com moderação (1-2 por mensagem)
- Seja direta mas gentil
- Adapte-se ao tom do cliente (formal/informal)

EXEMPLOS DE RESPOSTAS BOAS:
👍 "Oi! Sou a Carol 😊 Como posso te ajudar hoje com limpeza da sua casa?"
👍 "Perfeito! Para uma casa de 3 quartos com limpeza regular quinzenal, vou calcular o valor exato pra você..."
👍 "Deixa eu verificar a disponibilidade real pra semana que vem..."
👍 "Ótimo! Para confirmar o agendamento, preciso do seu nome completo e telefone 📱"

EXEMPLOS DE RESPOSTAS RUINS:
👎 "Nossos preços variam de X a Y" (vago - use a função!)
👎 "Temos horários disponíveis" (genérico - consulte a função!)
👎 "Me passa seus dados" (abrupto demais logo no início)
👎 "Gostaria de agendar?" (pushy - deixe o cliente decidir)

Seja a melhor versão de uma assistente virtual: útil, precisa e humana! 🏡✨`

export const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'check_availability',
      description: 'Verifica horários REAIS disponíveis no sistema para agendamento. Use sempre que o cliente perguntar sobre disponibilidade ou quiser agendar.',
      parameters: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            format: 'date',
            description: 'Data desejada no formato YYYY-MM-DD'
          },
          duration_minutes: {
            type: 'number',
            description: 'Duração estimada do serviço em minutos',
            enum: [120, 180, 240]
          }
        },
        required: ['date', 'duration_minutes']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'calculate_price',
      description: 'Calcula o preço EXATO do serviço baseado em detalhes da casa, tipo de serviço, frequência e add-ons. Sempre use esta função para dar preços precisos.',
      parameters: {
        type: 'object',
        properties: {
          bedrooms: {
            type: 'number',
            description: 'Número de quartos',
            minimum: 0,
            maximum: 10
          },
          bathrooms: {
            type: 'number',
            description: 'Número de banheiros (aceita .5 para lavabo)',
            minimum: 1,
            maximum: 10
          },
          service_type: {
            type: 'string',
            description: 'Tipo de serviço',
            enum: ['regular', 'deep', 'move_in_out', 'post_construction']
          },
          frequency: {
            type: 'string',
            description: 'Frequência do serviço (afeta o preço)',
            enum: ['one_time', 'weekly', 'biweekly', 'monthly']
          },
          addons: {
            type: 'array',
            description: 'Serviços adicionais',
            items: {
              type: 'string',
              enum: ['cabinets', 'fridge', 'oven', 'laundry', 'windows']
            }
          }
        },
        required: ['bedrooms', 'bathrooms', 'service_type']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_lead',
      description: 'Captura informações de contato do cliente interessado. Use APENAS depois que o cliente demonstrar interesse real (perguntou preço, disponibilidade, etc). Não use logo no início da conversa.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Nome completo do cliente'
          },
          phone: {
            type: 'string',
            pattern: '^[0-9]{10,15}$',
            description: 'Telefone (apenas números, 10-15 dígitos)'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Email do cliente (opcional)'
          },
          address: {
            type: 'object',
            properties: {
              street: { type: 'string', description: 'Endereço completo' },
              city: { type: 'string', description: 'Cidade' },
              state: { type: 'string', description: 'Estado (ex: FL)' },
              zip_code: { type: 'string', pattern: '^[0-9]{5}$', description: 'CEP (5 dígitos)' }
            }
          },
          notes: {
            type: 'string',
            description: 'Observações sobre o lead (necessidades especiais, preferências, etc)'
          }
        },
        required: ['name', 'phone']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_booking',
      description: 'Cria um agendamento CONFIRMADO no sistema. Use APENAS após: (1) ter criado o lead, (2) ter confirmado data/hora/serviço/preço com o cliente, (3) cliente concordar explicitamente.',
      parameters: {
        type: 'object',
        properties: {
          cliente_id: {
            type: 'string',
            format: 'uuid',
            description: 'ID do cliente (retornado pela função create_lead)'
          },
          date: {
            type: 'string',
            format: 'date',
            description: 'Data do agendamento (YYYY-MM-DD)'
          },
          time_slot: {
            type: 'string',
            pattern: '^[0-9]{2}:[0-9]{2}$',
            description: 'Horário no formato HH:MM (ex: 09:00, 14:00)'
          },
          service_type: {
            type: 'string',
            description: 'Tipo de serviço'
          },
          duration_minutes: {
            type: 'number',
            description: 'Duração em minutos'
          },
          total_price: {
            type: 'number',
            description: 'Preço total (retornado pela função calculate_price)'
          },
          special_instructions: {
            type: 'string',
            description: 'Instruções especiais ou observações'
          }
        },
        required: ['cliente_id', 'date', 'time_slot', 'service_type', 'duration_minutes', 'total_price']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'check_zip_coverage',
      description: 'Verifica se atendemos determinado CEP. Use quando o cliente perguntar se atende a área dele.',
      parameters: {
        type: 'object',
        properties: {
          zip_code: {
            type: 'string',
            pattern: '^[0-9]{5}$',
            description: 'CEP de 5 dígitos'
          }
        },
        required: ['zip_code']
      }
    }
  }
]
```

**Validação:**
- [ ] System prompt completo e detalhado
- [ ] 5 tools definidas com schemas JSON válidos
- [ ] Descrições claras para a IA entender quando usar cada tool
- [ ] Parameters com validações apropriadas
- [ ] Exports configurados

---

### TAREFA 4: Implementar Carol Agent Class

**O que fazer:**
- Criar arquivo `lib/ai/carol-agent.ts`
- Implementar classe `CarolAgent` com método principal `chat()`
- Implementar loop de tool calling (suportar múltiplas chamadas)
- Implementar métodos privados para cada tool executor
- Integrar com Supabase para persistência

**Estrutura da classe:**
```typescript
// lib/ai/carol-agent.ts
import { openrouter, MODELS } from './openrouter'
import { CAROL_SYSTEM_PROMPT, TOOLS } from './prompts'
import { createClient } from '@/lib/supabase/server'
import { Logger } from '@/lib/logger'
import type { ChatMessage, ChatResponse, CheckAvailabilityParams, ... } from '@/types/carol'

const logger = new Logger()

export class CarolAgent {
  private model: string
  
  constructor(model: string = MODELS.CLAUDE_SONNET) {
    this.model = model
  }
  
  /**
   * Processa uma mensagem do usuário e retorna a resposta da Carol
   * Gerencia histórico, tool calling e persistência no Supabase
   */
  async chat(message: string, sessionId: string): Promise<ChatResponse> {
    logger.info('Carol processing message', { sessionId, messageLength: message.length })
    
    const supabase = await createClient()
    
    // 1. Buscar histórico da conversa (últimas 20 mensagens)
    // 2. Salvar mensagem do usuário
    // 3. Preparar mensagens para LLM
    // 4. Chamar OpenRouter com tools
    // 5. Loop: processar tool calls se existirem
    // 6. Salvar resposta final
    // 7. Retornar resposta
  }
  
  // Tool executors privados
  private async checkAvailability(params: CheckAvailabilityParams) {}
  private async calculatePrice(params: CalculatePriceParams) {}
  private async createLead(params: CreateLeadParams, sessionId: string) {}
  private async createBooking(params: CreateBookingParams) {}
  private async checkZipCoverage(params: CheckZipCoverageParams) {}
}
```

**Lógica do método `chat()`:**

1. **Buscar histórico:**
```sql
SELECT role, content, created_at 
FROM mensagens_chat 
WHERE session_id = $1 
ORDER BY created_at ASC 
LIMIT 20
```

2. **Salvar mensagem do usuário:**
```sql
INSERT INTO mensagens_chat (session_id, role, content, source)
VALUES ($1, 'user', $2, 'website')
```

3. **Preparar mensagens:**
```typescript
const messages = [
  { role: 'system', content: CAROL_SYSTEM_PROMPT },
  ...history.map(h => ({ role: h.role, content: h.content })),
  { role: 'user', content: message }
]
```

4. **Chamar LLM:**
```typescript
let response = await openrouter.chat.completions.create({
  model: this.model,
  messages,
  tools: TOOLS,
  tool_choice: 'auto',
  temperature: 0.7,
  max_tokens: 1000
})
```

5. **Loop de tool calling:**
```typescript
while (assistantMessage.tool_calls?.length > 0) {
  // Executar cada tool call
  // Adicionar resultados ao histórico de mensagens
  // Chamar LLM novamente com os resultados
}
```

6. **Salvar resposta:**
```sql
INSERT INTO mensagens_chat (session_id, role, content, source)
VALUES ($1, 'assistant', $2, 'website')
```

**Implementação dos Tool Executors:**

**check_availability:**
```typescript
private async checkAvailability(params: CheckAvailabilityParams) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_available_slots', {
    p_date: params.date,
    p_duration: params.duration_minutes
  })
  
  if (error) {
    logger.error('Error checking availability', { error })
    return { success: false, error: error.message }
  }
  
  return { 
    success: true, 
    slots: data || [],
    date: params.date
  }
}
```

**calculate_price:**
```typescript
private async calculatePrice(params: CalculatePriceParams) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('calculate_service_price', {
    p_bedrooms: params.bedrooms,
    p_bathrooms: params.bathrooms,
    p_service_type: params.service_type,
    p_frequency: params.frequency || 'one_time'
  })
  
  if (error) {
    logger.error('Error calculating price', { error })
    return { success: false, error: error.message }
  }
  
  // Calcular add-ons
  let addonsPrice = 0
  if (params.addons) {
    const addonPrices: Record<string, number> = {
      cabinets: 30,
      fridge: 35,
      oven: 30,
      laundry: 25,
      windows: 45
    }
    addonsPrice = params.addons.reduce((sum, addon) => 
      sum + (addonPrices[addon] || 0), 0
    )
  }
  
  return {
    success: true,
    base_price: data,
    addons_price: addonsPrice,
    total_price: (data || 0) + addonsPrice,
    currency: 'USD',
    breakdown: {
      bedrooms: params.bedrooms,
      bathrooms: params.bathrooms,
      service_type: params.service_type,
      frequency: params.frequency,
      addons: params.addons
    }
  }
}
```

**create_lead:**
```typescript
private async createLead(params: CreateLeadParams, sessionId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('clientes')
    .insert({
      nome: params.name,
      telefone: params.phone,
      email: params.email,
      endereco: params.address?.street,
      cidade: params.address?.city || 'Miami',
      estado: params.address?.state || 'FL',
      cep: params.address?.zip_code,
      notas: params.notes,
      status: 'lead',
      origem: 'chat'
    })
    .select()
    .single()
  
  if (error) {
    logger.error('Error creating lead', { error })
    return { success: false, error: error.message }
  }
  
  // Atualizar mensagens desta sessão com o cliente_id
  await supabase
    .from('mensagens_chat')
    .update({ cliente_id: data.id })
    .eq('session_id', sessionId)
  
  logger.info('Lead created successfully', { 
    clienteId: data.id, 
    sessionId 
  })
  
  return { 
    success: true, 
    cliente_id: data.id,
    message: 'Lead capturado com sucesso'
  }
}
```

**create_booking:**
```typescript
private async createBooking(params: CreateBookingParams) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('agendamentos')
    .insert({
      cliente_id: params.cliente_id,
      data: params.date,
      horario: params.time_slot,
      servico: params.service_type,
      duracao_minutos: params.duration_minutes,
      valor: params.total_price,
      status: 'confirmado',
      observacoes: params.special_instructions
    })
    .select()
    .single()
  
  if (error) {
    logger.error('Error creating booking', { error })
    return { success: false, error: error.message }
  }
  
  logger.info('Booking created successfully', { 
    appointmentId: data.id,
    clienteId: params.cliente_id,
    date: params.date
  })
  
  return { 
    success: true, 
    appointment_id: data.id,
    message: 'Agendamento criado com sucesso'
  }
}
```

**check_zip_coverage:**
```typescript
private async checkZipCoverage(params: CheckZipCoverageParams) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('check_zip_code_coverage', {
    p_zip_code: params.zip_code
  })
  
  if (error) {
    logger.error('Error checking zip coverage', { error })
    return { success: false, error: error.message }
  }
  
  return { 
    success: true,
    covered: data || false,
    zip_code: params.zip_code
  }
}
```

**Validação:**
- [ ] Classe CarolAgent criada e exportada
- [ ] Método `chat()` implementado com loop de tool calling
- [ ] 5 tool executors implementados
- [ ] Integração com Supabase funcionando
- [ ] Logging estruturado em todos os pontos críticos
- [ ] Error handling robusto
- [ ] TypeScript sem erros

---

### TAREFA 5: Criar API Route de Chat

**O que fazer:**
- Criar arquivo `app/api/chat/route.ts`
- Implementar handler POST para processar mensagens
- Validar payload de entrada
- Instanciar CarolAgent e processar mensagem
- Retornar resposta estruturada
- Adicionar error handling completo

**Estrutura da API:**
```typescript
// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { CarolAgent } from '@/lib/ai/carol-agent'
import { Logger } from '@/lib/logger'
import { nanoid } from 'nanoid'
import type { ChatResponse } from '@/types/carol'

const logger = new Logger()

export async function POST(req: NextRequest) {
  try {
    // 1. Parse e validação do body
    const body = await req.json()
    const { message, session_id } = body
    
    // Validações
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      )
    }
    
    if (message.length > 1000) {
      return NextResponse.json(
        { error: 'Message too long (max 1000 characters)' },
        { status: 400 }
      )
    }
    
    // Gerar session_id se não existir
    const sessionId = session_id || nanoid(16)
    
    logger.info('Processing chat message', { 
      sessionId, 
      messageLength: message.length 
    })
    
    // 2. Processar com Carol
    const carol = new CarolAgent()
    const response: ChatResponse = await carol.chat(message, sessionId)
    
    logger.info('Chat processed successfully', { 
      sessionId,
      toolCallsExecuted: response.tool_calls_executed
    })
    
    // 3. Retornar resposta
    return NextResponse.json(response, { status: 200 })
    
  } catch (error) {
    logger.error('Chat API error', { error })
    
    // Erro específico vs erro genérico
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to process message. Please try again.' },
      { status: 500 }
    )
  }
}

// Opcional: GET para health check
export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    status: 'ok',
    service: 'carol-chat',
    timestamp: new Date().toISOString()
  })
}
```

**Validação:**
- [ ] API route criada em `app/api/chat/route.ts`
- [ ] Handler POST implementado
- [ ] Validação de entrada (message, session_id)
- [ ] CarolAgent instanciado corretamente
- [ ] Resposta estruturada retornada
- [ ] Error handling completo
- [ ] Logs em pontos críticos
- [ ] Status codes apropriados (200, 400, 500)

---

### TAREFA 6: Criar React Hook para Chat

**O que fazer:**
- Criar arquivo `hooks/use-carol-chat.ts`
- Implementar hook customizado para gerenciar estado do chat
- Implementar optimistic updates (mostrar mensagem antes da resposta)
- Gerenciar loading states
- Persistir session_id no localStorage

**Estrutura do hook:**
```typescript
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
    } else {
      const newId = nanoid(16)
      setSessionId(newId)
      localStorage.setItem('carol_session_id', newId)
    }
  }, [])
  
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
          session_id: sessionId
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
    setMessages([])
    setError(null)
    // Gerar novo session_id
    const newId = nanoid(16)
    setSessionId(newId)
    localStorage.setItem('carol_session_id', newId)
  }, [])
  
  return {
    messages,
    isLoading,
    isProcessing,
    sessionId,
    sendMessage,
    clearMessages,
    error
  }
}
```

**Validação:**
- [ ] Hook criado em `hooks/use-carol-chat.ts`
- [ ] Estados gerenciados (messages, isLoading, sessionId)
- [ ] Optimistic updates implementados
- [ ] session_id persistido em localStorage
- [ ] Error handling implementado
- [ ] Método clearMessages funcional
- [ ] TypeScript sem erros

---

### TAREFA 7: Atualizar Componente de Chat Existente

**O que fazer:**
- Localizar componente de chat existente (provavelmente em `components/chat/` ou `components/landing/`)
- Substituir lógica antiga (n8n) pelo novo hook `use-carol-chat`
- Manter UI existente (shadcn/ui, Tailwind)
- Adicionar indicadores de loading/typing
- Adicionar tratamento de erros visual

**Modificações necessárias:**

1. **Importar novo hook:**
```typescript
import { useCarolChat } from '@/hooks/use-carol-chat'
```

2. **Substituir state management:**
```typescript
// ANTES (se houver lógica n8n)
// const [messages, setMessages] = useState([])
// const sendToN8n = async () => { ... }

// DEPOIS
const { 
  messages, 
  isLoading, 
  sessionId,
  sendMessage, 
  clearMessages,
  error 
} = useCarolChat()
```

3. **Atualizar handler de envio:**
```typescript
const handleSend = async (content: string) => {
  await sendMessage(content)
}
```

4. **Adicionar indicadores visuais:**
```typescript
{isLoading && (
  <div className="flex items-center gap-2 text-sm text-muted-foreground">
    <Loader2 className="h-4 w-4 animate-spin" />
    Carol está digitando...
  </div>
)}

{error && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Erro</AlertTitle>
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}
```

5. **Renderizar mensagens:**
```typescript
{messages.map((message) => (
  <div 
    key={message.id}
    className={cn(
      "flex gap-3 p-4 rounded-lg",
      message.role === 'user' 
        ? "bg-primary text-primary-foreground ml-auto max-w-[80%]" 
        : "bg-muted"
    )}
  >
    {message.role === 'assistant' && (
      <Avatar>
        <AvatarImage src="/carol-avatar.png" />
        <AvatarFallback>CA</AvatarFallback>
      </Avatar>
    )}
    
    <div className="flex-1">
      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      
      {message.status === 'sending' && (
        <span className="text-xs opacity-50">Enviando...</span>
      )}
      
      {message.status === 'error' && (
        <span className="text-xs text-destructive">
          Erro ao enviar. Clique para tentar novamente.
        </span>
      )}
    </div>
  </div>
))}
```

**Validação:**
- [ ] Componente de chat localizado
- [ ] Lógica antiga (n8n) removida
- [ ] Hook `use-carol-chat` integrado
- [ ] UI mantém aparência atual
- [ ] Indicadores de loading adicionados
- [ ] Tratamento de erros visual implementado
- [ ] Mensagens renderizam corretamente
- [ ] Optimistic updates visíveis

---

### TAREFA 8: Configurar Variáveis de Ambiente

**O que fazer:**
- Adicionar variáveis necessárias ao `.env.local`
- Atualizar `.env.example` com documentação
- Validar tipos no `lib/env.ts` (se existir)

**Variáveis necessárias:**
```env
# .env.local

# OpenRouter Configuration
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Carol AI Configuration (opcional)
CAROL_DEFAULT_MODEL=anthropic/claude-3.5-sonnet
# Alternativas:
# - openai/gpt-4-turbo
# - meta-llama/llama-3.1-70b-instruct

# App Configuration (para referer header)
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Produção: https://Chesquecleaning.com
```

**Atualizar `.env.example`:**
```env
# .env.example

# ================================
# OPENROUTER CONFIGURATION
# ================================
# Get your API key at: https://openrouter.ai/keys
# Docs: https://openrouter.ai/docs
OPENROUTER_API_KEY=your_openrouter_api_key_here

# ================================
# CAROL AI CONFIGURATION
# ================================
# Default AI model for Carol chat
# Options:
#   - anthropic/claude-3.5-sonnet (recommended, $3/$15 per 1M tokens)
#   - openai/gpt-4-turbo ($10/$30 per 1M tokens)
#   - meta-llama/llama-3.1-70b-instruct (budget, $0.35/$0.40 per 1M tokens)
CAROL_DEFAULT_MODEL=anthropic/claude-3.5-sonnet

# ================================
# APP CONFIGURATION
# ================================
# Used for OpenRouter referer header
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Se existir `lib/env.ts`, adicionar validação:**
```typescript
// lib/env.ts
export function validateEnv() {
  const required = [
    'OPENROUTER_API_KEY',
    'NEXT_PUBLIC_APP_URL',
    // ... outras vars
  ]
  
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`)
    }
  }
}
```

**Validação:**
- [ ] `.env.local` criado com variáveis
- [ ] `.env.example` atualizado com documentação
- [ ] OPENROUTER_API_KEY configurada
- [ ] NEXT_PUBLIC_APP_URL configurada
- [ ] Validação em `lib/env.ts` (se existir)
- [ ] Build passa sem erros de env vars

---

### TAREFA 9: Adicionar Logging e Observabilidade

**O que fazer:**
- Integrar com `lib/logger.ts` existente
- Adicionar logs estruturados em pontos críticos
- Garantir que erros sejam logados com contexto

**Pontos de logging:**

**1. Início de conversa (carol-agent.ts):**
```typescript
logger.info('Carol processing message', { 
  sessionId, 
  messageLength: message.length,
  model: this.model
})
```

**2. Tool calls executados:**
```typescript
logger.info('Executing tool', { 
  toolName, 
  sessionId,
  params: toolArgs
})
```

**3. Tool call bem-sucedido:**
```typescript
logger.info('Tool executed successfully', { 
  toolName,
  sessionId,
  result: { success: true }
})
```

**4. Erros em tools:**
```typescript
logger.error('Tool execution failed', { 
  toolName,
  sessionId,
  error: error.message,
  stack: error.stack
})
```

**5. Lead criado:**
```typescript
logger.info('Lead created successfully', { 
  clienteId: data.id,
  sessionId,
  source: 'chat'
})
```

**6. Agendamento criado:**
```typescript
logger.info('Booking created successfully', { 
  appointmentId: data.id,
  clienteId: params.cliente_id,
  date: params.date,
  sessionId
})
```

**7. Resposta final gerada:**
```typescript
logger.info('Chat response generated', { 
  sessionId,
  messageLength: finalMessage.length,
  toolCallsExecuted: toolCalls.length
})
```

**8. Erros na API:**
```typescript
logger.error('Chat API error', { 
  sessionId,
  error: error.message,
  stack: error.stack,
  request: { message: body.message }
})
```

**Validação:**
- [ ] Logging integrado com `lib/logger.ts`
- [ ] Logs estruturados (JSON) em todos os pontos críticos
- [ ] Context (sessionId) incluído em todos os logs
- [ ] Erros logados com stack trace
- [ ] Logs aparecem no console durante desenvolvimento
- [ ] Formato consistente em todo o código

---

### TAREFA 10: Implementar Rate Limiting para Chat

**O que fazer:**
- Adicionar rate limit específico para `/api/chat`
- Usar middleware existente ou criar novo
- Limites: 30 mensagens por minuto por session_id
- Retornar erro 429 quando exceder

**Se middleware já existe:**
```typescript
// middleware.ts (adicionar regra específica)
if (req.nextUrl.pathname === '/api/chat') {
  const sessionId = req.headers.get('x-session-id') || 'anonymous'
  const limited = await rateLimit(`chat:${sessionId}`, 30, 60) // 30 msgs/min
  
  if (limited) {
    return NextResponse.json(
      { error: 'Too many messages. Please wait a moment.' },
      { status: 429 }
    )
  }
}
```

**Se criar rate limiter próprio:**
```typescript
// lib/rate-limit.ts
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!
})

export async function rateLimitChat(sessionId: string): Promise<boolean> {
  const key = `rate_limit:chat:${sessionId}`
  const now = Date.now()
  const window = 60 * 1000 // 1 minuto
  
  // Adicionar timestamp atual
  await redis.zadd(key, { score: now, member: now })
  
  // Remover timestamps antigos (> 1 min)
  await redis.zremrangebyscore(key, 0, now - window)
  
  // Contar requests no último minuto
  const count = await redis.zcard(key)
  
  // Expirar chave após 2 minutos
  await redis.expire(key, 120)
  
  return count > 30
}
```

**Uso na API route:**
```typescript
// app/api/chat/route.ts
import { rateLimitChat } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const { session_id } = await req.json()
  
  // Check rate limit
  const limited = await rateLimitChat(session_id || 'anonymous')
  if (limited) {
    return NextResponse.json(
      { error: 'Você está enviando mensagens muito rápido. Aguarde um momento.' },
      { status: 429 }
    )
  }
  
  // ... resto do código
}
```

**Validação:**
- [ ] Rate limiting implementado
- [ ] Limite: 30 mensagens/minuto por session_id
- [ ] Retorna erro 429 quando exceder
- [ ] Mensagem de erro amigável
- [ ] Não bloqueia usuários legítimos
- [ ] Redis/Upstash funcionando (se usado)

---

### TAREFA 11: Remover Dependências de n8n (Limpeza)

**O que fazer:**
- Identificar e remover código relacionado a n8n
- Remover variáveis de ambiente antigas
- Atualizar documentação se necessário

**Arquivos para verificar e limpar:**

1. **Variáveis de ambiente antigas:**
```env
# Remover de .env.local e .env.example:
N8N_WEBHOOK_SECRET=...
N8N_CHAT_WEBHOOK_URL=...
N8N_TRIGGER_WEBHOOK_URL=...
```

2. **API routes antigas (se existirem):**
- `app/api/webhook/n8n/route.ts` - pode ser removida se não usada para outros fins
- `app/api/webhook/response/route.ts` - remover se era apenas para n8n chat

3. **Código de integração n8n:**
- Buscar por imports ou referências a "n8n", "webhook" relacionado a chat
- Remover lógica de envio para n8n em componentes de chat antigos

4. **Comentários e TODOs:**
- Remover comentários que referenciam n8n para chat
- Atualizar TODOs que mencionavam integração n8n

**ATENÇÃO:** 
- ⚠️ **NÃO remover** `lib/services/webhookService.ts` se usado para OUTROS webhooks (appointments, payments, etc)
- ⚠️ **NÃO remover** sistema de webhooks para eventos do sistema (apenas remover n8n para CHAT)
- ✅ **Manter** webhooks para notificações, eventos de agendamento, etc se existirem

**Validação:**
- [ ] Variáveis de ambiente n8n removidas (apenas as de chat)
- [ ] Código antigo de integração n8n chat removido
- [ ] Nenhuma referência quebrada (imports órfãos)
- [ ] Build passa sem erros
- [ ] Outros webhooks do sistema continuam funcionando (se existirem)

---

### TAREFA 12: Criar Documentação e Testes Manuais

**O que fazer:**
- Criar arquivo `docs/CAROL_AI.md` com documentação
- Criar checklist de testes manuais
- Documentar troubleshooting comum

**Estrutura da documentação:**
```markdown
# 🤖 Carol AI - Documentação

## Visão Geral
Carol é a assistente virtual conversacional da Chesque Premium Cleaning, implementada nativamente no Next.js usando OpenRouter (Claude 3.5 Sonnet).

## Arquitetura
- **LLM Provider:** OpenRouter (https://openrouter.ai)
- **Modelo padrão:** Claude 3.5 Sonnet (anthropic/claude-3.5-sonnet)
- **Database:** Supabase (tabela mensagens_chat)
- **Tool Calling:** 5 funções integradas

## Capabilities
1. ✅ Consultar disponibilidade real via `get_available_slots()`
2. ✅ Calcular orçamentos via `calculate_service_price()`
3. ✅ Capturar leads via insert em `clientes`
4. ✅ Criar agendamentos via insert em `agendamentos`
5. ✅ Verificar cobertura de CEP via `check_zip_code_coverage()`

## Configuração

### Variáveis de Ambiente
```env
OPENROUTER_API_KEY=sk-or-v1-xxx
CAROL_DEFAULT_MODEL=anthropic/claude-3.5-sonnet
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Custo Estimado
- Claude 3.5 Sonnet: $3 input / $15 output (por 1M tokens)
- Média: 500 tokens input + 300 output por conversa
- Custo: ~$0.006 por conversa
- 10k conversas/mês: ~$60/mês

## Fluxo de Conversa

1. Usuário envia mensagem
2. Carol analisa com LLM
3. Se precisa de dados, chama tool (ex: check_availability)
4. LLM recebe resultado e gera resposta
5. Se múltiplas tools, repete até ter resposta final
6. Retorna mensagem conversacional

## Testes Manuais

### Teste 1: Consulta Simples
**Input:** "Olá! Quanto custa uma limpeza?"
**Esperado:** Carol responde perguntando detalhes (quartos, banheiros)

### Teste 2: Cálculo de Preço
**Input:** "Tenho 3 quartos e 2 banheiros, limpeza regular quinzenal"
**Esperado:** Carol chama `calculate_price` e retorna valor exato

### Teste 3: Verificar Disponibilidade
**Input:** "Quais horários disponíveis amanhã?"
**Esperado:** Carol chama `check_availability` e lista slots reais

### Teste 4: Captura de Lead
**Input:** [Após mostrar interesse] Carol pergunta nome/telefone
**Esperado:** Carol chama `create_lead` e salva no banco

### Teste 5: Criar Agendamento
**Input:** "Quero agendar para amanhã às 10h"
**Esperado:** Carol confirma dados e chama `create_booking`

### Teste 6: Verificar CEP
**Input:** "Vocês atendem o CEP 33139?"
**Esperado:** Carol chama `check_zip_coverage` e confirma

### Teste 7: Conversa Bilíngue
**Input:** "Hi! How much for a cleaning?"
**Esperado:** Carol responde em inglês naturalmente

## Troubleshooting

### Erro: "OPENROUTER_API_KEY is not defined"
**Solução:** Adicionar chave no `.env.local`

### Erro: "Too many messages"
**Causa:** Rate limit atingido (30 msgs/min)
**Solução:** Aguardar 1 minuto

### Carol não executa tools
**Causa:** Erro na função RPC do Supabase
**Debug:** Verificar logs, testar RPC manualmente

### Respostas genéricas (não usa tools)
**Causa:** System prompt pode estar confuso
**Solução:** Revisar CAROL_SYSTEM_PROMPT em `lib/ai/prompts.ts`

## Logs Importantes

```
INFO  Carol processing message { sessionId, messageLength }
INFO  Executing tool { toolName, sessionId }
INFO  Tool executed successfully { toolName, result }
INFO  Lead created { clienteId, sessionId }
INFO  Booking created { appointmentId, date }
ERROR Tool execution failed { toolName, error }
```

## Manutenção

### Trocar Modelo LLM
Editar `lib/ai/carol-agent.ts`:
```typescript
constructor(model: string = MODELS.LLAMA_70B) // Para budget
```

### Ajustar Personalidade
Editar `lib/ai/prompts.ts` → `CAROL_SYSTEM_PROMPT`

### Adicionar Nova Tool
1. Adicionar schema em `TOOLS` array
2. Implementar executor em `CarolAgent` class
3. Adicionar case no switch de tool calling
4. Atualizar types em `types/carol.ts`

## Performance

- Latência média: 2-3 segundos
- 95 percentil: < 5 segundos
- Tool calls adicionam ~500ms cada

## Monitoramento

- Logs: `lib/logger.ts`
- Erros: Sentry (se configurado)
- Métricas: Vercel Analytics
```

**Validação:**
- [ ] Documentação criada em `docs/CAROL_AI.md`
- [ ] Testes manuais documentados
- [ ] Troubleshooting documentado
- [ ] Informações de custo incluídas
- [ ] Exemplos de uso claros

---

## 4. PLANO DE VERIFICAÇÃO

### Testes Funcionais

**TESTE 1: Iniciar Conversa**
- [ ] Abrir chat no website
- [ ] Enviar "Olá"
- [ ] Receber resposta da Carol em < 5 segundos
- [ ] Verificar session_id gerado no localStorage
- [ ] Verificar mensagem salva em `mensagens_chat`

**TESTE 2: Consultar Preços**
- [ ] Enviar "Quanto custa uma limpeza de 3 quartos?"
- [ ] Carol deve perguntar mais detalhes (banheiros, frequência)
- [ ] Responder com detalhes
- [ ] Carol deve chamar `calculate_price`
- [ ] Receber valor exato (não estimativa)

**TESTE 3: Verificar Disponibilidade**
- [ ] Enviar "Quais horários disponíveis amanhã?"
- [ ] Carol deve chamar `check_availability`
- [ ] Receber lista de slots reais do banco
- [ ] Se não houver slots, receber sugestão de outros dias

**TESTE 4: Captura de Lead**
- [ ] Após demonstrar interesse, Carol pergunta dados
- [ ] Fornecer nome e telefone
- [ ] Carol deve chamar `create_lead`
- [ ] Verificar cliente criado em `clientes` com status='lead'
- [ ] Verificar mensagens associadas ao `cliente_id`

**TESTE 5: Criar Agendamento**
- [ ] Com lead criado, confirmar data/hora/serviço
- [ ] Carol deve chamar `create_booking`
- [ ] Verificar agendamento criado em `agendamentos`
- [ ] Status deve ser 'confirmado'
- [ ] Valores devem bater com orçamento

**TESTE 6: Verificar CEP**
- [ ] Enviar "Vocês atendem o 33139?"
- [ ] Carol deve chamar `check_zip_coverage`
- [ ] Receber confirmação ou negação
- [ ] Se não atende, receber sugestão de áreas próximas

**TESTE 7: Conversa Bilíngue**
- [ ] Enviar mensagem em inglês
- [ ] Carol deve responder em inglês
- [ ] Alternar para português
- [ ] Carol deve alternar também

**TESTE 8: Tratamento de Erros**
- [ ] Enviar mensagem vazia
- [ ] Receber erro 400
- [ ] Enviar mensagem > 1000 chars
- [ ] Receber erro 400
- [ ] Simular erro do Supabase
- [ ] Receber mensagem de erro amigável

**TESTE 9: Rate Limiting**
- [ ] Enviar 35 mensagens em < 1 minuto
- [ ] A partir da 31ª, receber erro 429
- [ ] Aguardar 1 minuto
- [ ] Conseguir enviar novamente

**TESTE 10: Session Persistence**
- [ ] Iniciar conversa
- [ ] Recarregar página
- [ ] Histórico deve permanecer
- [ ] session_id deve ser o mesmo

### Testes Técnicos

**DATABASE:**
- [ ] Tabela `mensagens_chat` recebe inserts corretamente
- [ ] Campo `cliente_id` é preenchido após `create_lead`
- [ ] RPC `get_available_slots()` retorna dados
- [ ] RPC `calculate_service_price()` retorna valores corretos
- [ ] RPC `check_zip_code_coverage()` funciona

**API:**
- [ ] POST `/api/chat` retorna 200 com resposta válida
- [ ] POST `/api/chat` valida payload corretamente
- [ ] POST `/api/chat` retorna 400 para payload inválido
- [ ] POST `/api/chat` retorna 429 quando rate limited
- [ ] POST `/api/chat` retorna 500 com mensagem de erro apropriada
- [ ] GET `/api/chat` retorna health check

**LOGGING:**
- [ ] Logs aparecem no console durante desenvolvimento
- [ ] Logs incluem sessionId em todos os pontos
- [ ] Erros logam stack trace completo
- [ ] Tool calls são logadas antes da execução
- [ ] Resultados de tools são logados

**TYPESCRIPT:**
- [ ] `npm run build` passa sem erros
- [ ] Não há tipos `any` desnecessários
- [ ] Todos os exports estão tipados
- [ ] Imports resolvem corretamente

**PERFORMANCE:**
- [ ] Resposta em < 3 segundos (média)
- [ ] Resposta em < 5 segundos (p95)
- [ ] Tool calls adicionam < 1 segundo cada
- [ ] Histórico carrega < 500ms

### Testes de Negócio

**CONVERSAÇÃO NATURAL:**
- [ ] Carol não soa robótica
- [ ] Respostas são contextuais (lembra conversa anterior)
- [ ] Não repete informações desnecessariamente
- [ ] Adapta tom ao idioma do usuário

**PRECISÃO:**
- [ ] Carol NUNCA inventa horários (sempre consulta banco)
- [ ] Carol NUNCA dá preços estimados (sempre calcula)
- [ ] Carol SEMPRE confirma dados antes de criar booking
- [ ] Carol não pressiona o usuário

**CAPTURA DE LEAD:**
- [ ] Não pede dados logo no início (aguarda interesse)
- [ ] Pede de forma natural ("Para confirmar, qual seu nome?")
- [ ] Aceita dados parciais (só nome e telefone)
- [ ] Salva notas relevantes da conversa

**FLUXO COMPLETO:**
- [ ] Do "Olá" até "Agendamento confirmado" funciona sem fricção
- [ ] Usuário consegue completar jornada em < 5 minutos
- [ ] Não há perguntas redundantes
- [ ] Confirmações são claras

---

## 5. RESULTADO ESPERADO

### Comportamento Final do Sistema

**Perspectiva do Usuário:**

1. **Início da Conversa:**
   - Usuário abre chat no website
   - Carol saúda em português ou inglês
   - Conversa flui naturalmente como com humano

2. **Consulta de Informações:**
   - Usuário pergunta sobre preços
   - Carol calcula valores EXATOS baseados em detalhes
   - Usuário pergunta sobre disponibilidade
   - Carol mostra horários REAIS do sistema

3. **Captura de Lead:**
   - Após demonstrar interesse, Carol pede dados
   - Forma natural: "Para te enviar a confirmação, qual seu nome e telefone?"
   - Dados salvos automaticamente no banco

4. **Fechamento:**
   - Carol confirma todos os detalhes
   - Cria agendamento automaticamente
   - Envia confirmação clara
   - Tudo sem sair do chat

**Métricas de Sucesso:**
- ✅ Taxa de conversão lead → booking: > 40%
- ✅ Tempo médio de conversa: < 5 minutos
- ✅ Satisfação do usuário: > 4.5/5 (se perguntado)
- ✅ Taxa de abandono: < 20%

### Impacto no Usuário

**Experiência:**
- ✅ Resposta instantânea (< 3 segundos)
- ✅ Conversa fluida sem fricção
- ✅ Agendamento completo sem sair do chat
- ✅ Orçamento personalizado em tempo real
- ✅ Não precisa ligar ou preencher formulário longo

**Confiança:**
- ✅ Preços e horários são REAIS (não estimativas)
- ✅ Confirmação imediata após agendamento
- ✅ Dados tratados com segurança
- ✅ Transparência total no processo

### Impacto no Sistema

**Técnico:**
- ✅ Eliminação de dependência externa (n8n)
- ✅ Redução de latência em ~50% (de 4-6s para 2-3s)
- ✅ Simplificação de debugging (tudo no mesmo codebase)
- ✅ Logs unificados (um só sistema)
- ✅ Deploy simplificado (single container)

**Operacional:**
- ✅ Redução de custos (sem hosting n8n: economia de $20-50/mês)
- ✅ Manutenção mais fácil (menos sistemas para gerenciar)
- ✅ Escalabilidade horizontal (Next.js já otimizado)
- ✅ Monitoramento centralizado

**Desenvolvimento:**
- ✅ Codebase unificado (tudo TypeScript)
- ✅ Type safety end-to-end
- ✅ Testes mais fáceis (menos mocks)
- ✅ Iteração mais rápida (sem deploy de workflows)

### Métricas Operacionais

**Performance:**
- Latência p50: < 2 segundos
- Latência p95: < 5 segundos
- Latência p99: < 8 segundos
- Uptime: > 99.9%

**Custo:**
- OpenRouter (Claude 3.5 Sonnet): ~$60/mês (10k conversas)
- Supabase (database): já incluído no plano atual
- Next.js (hosting): já incluído no Vercel/Easypanel
- **Total adicional:** ~$60/mês
- **Economia vs n8n:** ~$20-50/mês

**Qualidade:**
- Taxa de erro: < 1%
- Tool calls bem-sucedidos: > 98%
- Rate limit hits: < 0.1%

---

## 6. NOTAS IMPORTANTES

### Ordem de Execução

Execute as tarefas **rigorosamente nesta ordem**:
1. Configuração (OpenRouter, Types, Prompts)
2. Implementação (Agent, API, Hook)
3. Integração (Componente de Chat)
4. Infraestrutura (Env vars, Logging, Rate Limit)
5. Limpeza (Remover n8n)
6. Validação (Testes, Documentação)

### Pontos de Atenção Críticos

⚠️ **CRÍTICO 1: Análise de Contexto**
- Antigravity DEVE analisar `.context/` ANTES de escrever código
- Seguir padrões existentes é OBRIGATÓRIO
- Não reinventar estruturas que já existem

⚠️ **CRÍTICO 2: Tool Calling Loop**
- Implementar loop COMPLETO (while com múltiplas iterações)
- LLM pode chamar várias tools em sequência
- Não assumir que uma tool é suficiente

⚠️ **CRÍTICO 3: System Prompt**
- É a ALMA da Carol - dedicar tempo para deixar perfeito
- Incluir TODOS os exemplos, regras e informações
- Testar iterativamente e ajustar

⚠️ **CRÍTICO 4: Error Handling**
- NUNCA deixar erros sem tratamento
- Sempre logar com contexto (sessionId)
- Retornar mensagens amigáveis ao usuário

⚠️ **CRÍTICO 5: Database Integration**
- Validar que funções RPC existem ANTES de chamar
- Usar tipos gerados (`types/supabase.ts`)
- Tratar erros do Supabase apropriadamente

### Não Esquecer

✅ **Persistência de Session:**
- sessionId DEVE persistir no localStorage
- Histórico DEVE carregar do banco
- Não criar nova sessão a cada refresh

✅ **Optimistic Updates:**
- Mostrar mensagem do usuário IMEDIATAMENTE
- Marcar como "sending" → "sent" → "error"
- Melhor UX que loading spinner

✅ **Bilíngue:**
- Carol DEVE detectar idioma automaticamente
- Suportar PT-BR e EN fluentemente
- Manter idioma consistente na conversa

✅ **Logs Estruturados:**
- Sempre incluir sessionId
- Formato JSON para fácil parsing
- Níveis apropriados (info, error, warn)

✅ **Documentação:**
- README atualizado
- Troubleshooting incluído
- Exemplos de uso claros

### Decisões de Design

**Por que Claude 3.5 Sonnet?**
- Melhor custo-benefício ($3/$15 vs GPT-4 $10/$30)
- Excelente em conversação natural
- Function calling robusto e confiável
- Contexto de 200k tokens (muito histórico)

**Por que OpenRouter?**
- API unificada para múltiplos modelos
- Mesmos preços que direto (sem markup)
- Fallback automático (se configurado)
- Fácil trocar modelos depois

**Por que remover n8n?**
- Single-tenant não precisa de orquestrador pesado
- Latência reduzida sem webhooks
- Debugging mais simples (um sistema)
- Deploy mais fácil (um container)
- Custo menor (sem infra extra)

### Extensões Futuras (NÃO implementar agora)

🔮 **Fase 2 (futuro):**
- Streaming de respostas (token-by-token)
- WhatsApp integration via Evolution API
- Multi-modelo fallback automático
- Carol como agente de follow-up (lembrar de agendar)
- A/B testing de system prompts

🔮 **Fase 3 (futuro distante):**
- Voice chat (Whisper + TTS)
- Análise de sentimento em tempo real
- Recomendação proativa de serviços
- Multi-agente (Carol + especialistas)

---

## 7. CHECKLIST FINAL DE ENTREGA

Antes de considerar a implantação **COMPLETA**, verificar:

### Código
- [ ] Todos os 12 arquivos criados/modificados
- [ ] TypeScript compila sem erros (`npm run build`)
- [ ] Linter passa sem warnings (`npm run lint`)
- [ ] Imports resolvem corretamente
- [ ] Tipos exportados/importados corretamente

### Funcionalidades
- [ ] Chat funciona end-to-end
- [ ] 5 tools funcionam corretamente
- [ ] Lead capture funciona
- [ ] Booking creation funciona
- [ ] Histórico persiste
- [ ] Rate limiting funciona

### Infraestrutura
- [ ] Variáveis de ambiente configuradas
- [ ] Logging estruturado funcionando
- [ ] Error handling robusto
- [ ] Rate limiting implementado
- [ ] Database integração validada

### Limpeza
- [ ] Código n8n removido (apenas chat)
- [ ] Variáveis n8n removidas (apenas chat)
- [ ] Sem imports órfãos
- [ ] Sem TODOs relacionados a n8n chat

### Documentação
- [ ] `docs/CAROL_AI.md` criado
- [ ] README atualizado (se necessário)
- [ ] Comentários de código adequados
- [ ] Troubleshooting documentado

### Testes
- [ ] 10 testes funcionais passam
- [ ] Testes técnicos passam
- [ ] Testes de negócio validados
- [ ] Performance aceitável (< 5s)

### Validação Final
- [ ] Demo completa funciona (olá → agendamento)
- [ ] Logs aparecem corretamente
- [ ] Erros são tratados graciosamente
- [ ] UX é fluida e natural

---

## 8. SUPORTE E PRÓXIMOS PASSOS

### Se Encontrar Problemas

**Durante Implementação:**
1. Verificar análise de contexto foi feita
2. Conferir padrões existentes no código
3. Validar tipos estão corretos
4. Testar RPC functions manualmente no Supabase
5. Verificar logs para identificar ponto de falha

**Após Implantação:**
1. Monitorar logs na produção
2. Coletar feedback de usuários reais
3. Iterar no system prompt baseado em conversas reais
4. Ajustar rate limits se necessário

### Melhorias Iterativas

**Semana 1 pós-deploy:**
- Analisar 100 primeiras conversas
- Identificar padrões de falha
- Ajustar system prompt
- Melhorar mensagens de erro

**Mês 1 pós-deploy:**
- Calcular taxa de conversão real
- Identificar pontos de abandono
- Otimizar fluxo de captura de lead
- Considerar add streaming (Fase 2)

**Mês 2+:**
- Avaliar expansão para WhatsApp
- Implementar follow-up automático
- Considerar A/B testing de prompts

---

## 🎯 DEFINIÇÃO DE PRONTO (DONE)

A implantação está **100% COMPLETA** quando:

1. ✅ Carol responde mensagens naturalmente em PT e EN
2. ✅ 5 tools funcionam e são chamadas automaticamente
3. ✅ Lead capture e booking creation funcionam
4. ✅ Histórico persiste entre sessões
5. ✅ Rate limiting protege o sistema
6. ✅ Logs estruturados aparecem corretamente
7. ✅ Erros são tratados graciosamente
8. ✅ Código n8n de chat foi removido
9. ✅ Documentação completa criada
10. ✅ Todos os 10 testes funcionais passam
11. ✅ Build production passa sem erros
12. ✅ Demo completa funciona (olá → agendamento confirmado)

---

**Boa sorte com a implementação! 🚀**

Esta é uma funcionalidade transformadora que vai melhorar drasticamente a experiência do usuário e simplificar a arquitetura do sistema.

Qualquer dúvida durante a implementação, consulte:
- `.context/` para padrões do projeto
- `docs/CAROL_AI.md` para referência técnica
- Logs estruturados para debugging

**Let's build something amazing! 🏡✨**

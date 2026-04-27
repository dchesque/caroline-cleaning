# Lead Chat - Proposta de Correções

Data: 2026-04-27
Referência: Análise em `docs/lead-chat-bugs-analysis.md`

---

## CORREÇÃO 1: Loop Infinito de Pergunta de Fechamento 🔴 CRÍTICO

### Arquivo: `lib/ai/lead-chat-agent.ts`

#### 1.1 Adicionar "bye" aos closing signals (linha ~646)

```typescript
const closingSignals = [
  'no', 'nope', 'nah', 'nothing', 'none',
  'no more', 'that\'s all', 'that is all', 'thats all',
  'nothing else', 'all good', 'all set', 'done',
  'nao', 'não', // PT
  'bye', 'goodbye', 'see you', 'have a great', // ← ADICIONAR
]
```

#### 1.2 Resetar askedClosingQuestion após responder pergunta (linha ~709)

```typescript
// Depois do LLM responder pergunta do usuário:
const responseContent = sanitizeResponse(choice.message.content ?? "Sure, happy to help! 😊")
return {
  message: `${responseContent}\n\nAnything else I can help with?`,
  context: { ...req.context, askedClosingQuestion: false }, // ← ADICIONAR reset
  timestamp,
  llmCalls,
  toolCalls,
}
```

#### 1.3 Melhorar detecção de closing signals

```typescript
// Melhorar o matching para ser mais flexível:
const isClosingSignal = closingSignals.some(signal =>
  sanitized.toLowerCase().trim() === signal ||
  sanitized.toLowerCase().startsWith(signal + ' ') ||
  sanitized.toLowerCase().startsWith(signal + ',') ||
  sanitized.toLowerCase().startsWith(signal + '.') ||
  sanitized.toLowerCase().endsWith(signal) // ← ADICIONAR para "no", "bye" no final
)
```

---

## CORREÇÃO 2: zipRejectedCount Não Incrementa 🔴 ALTO

### Arquivo: `lib/ai/lead-chat-agent.ts`

#### 2.1 Adicionar log de debug para rastrear (linha ~622)

Já existe log de incomingContext, mas precisamos de mais:

```typescript
// Após incrementar (linha ~757):
if (zipRejected) {
  updatedContext.zipRejectedCount = updatedContext.zipRejectedCount + 1
  logger.warn('[lead-chat] ZIP REJECTED', {
    zip,
    oldCount: req.context.zipRejectedCount,
    newCount: updatedContext.zipRejectedCount,
    willTerminate: updatedContext.zipRejectedCount >= 2,
  })
```

#### 2.2 Verificar merge de contexto no cliente

### Arquivo: `hooks/use-lead-chat.ts` (linha ~133)

```typescript
// Update context from server response
if (data.context) {
  // ADICIONAR log para debug:
  console.log('[use-lead-chat] Context UPDATE:', {
    before: { zipRejectedCount: context.zipRejectedCount },
    after: { zipRejectedCount: data.context.zipRejectedCount },
  })
  setContext(data.context as LeadContext)
}
```

#### 2.3 Soluções de longo prazo

**Opção A (Recomendada):** Server-side state
```typescript
// Novo arquivo: lib/ai/lead-context-store.ts
// Armazenar contexto por sessionId em Redis ou DB
// Cliente envia apenas sessionId, server busca contexto
```

**Opção B:** Validação no server
```typescript
// Server busca logs recentes da sessão para validar contador
const recentRejections = await countRecentZipRejections(sessionId)
const actualCount = Math.max(req.context.zipRejectedCount, recentRejections)
```

---

## CORREÇÃO 3: Contexto Corrompido Após Save 🟡 MÉDIO

### Arquivo: `lib/ai/lead-chat-agent.ts` (linha ~907)

#### 3.1 Garantir que todos os campos são preservados

```typescript
// Após save_lead bem-sucedido:
updatedContext.leadSaved = true
updatedContext.leadId = result.id

// ADICIONAR: Garantir que campos não são perdidos
updatedContext.address = updatedContext.address ?? req.context.address
updatedContext.zipConfirmed = updatedContext.zipConfirmed ?? req.context.zipConfirmed

logger.info('[lead-chat] Lead saved successfully', {
  leadId: result.id,
  contextReturned: {
    name: updatedContext.name,
    phone: updatedContext.phone,
    zip: updatedContext.zip,
    zipConfirmed: updatedContext.zipConfirmed, // ← Deve ser true!
    address: updatedContext.address,
    leadSaved: updatedContext.leadSaved,
  }
})
```

#### 3.2 Investigar serialização

Verificar se `JSON.stringify` / `JSON.parse` está perdendo campos. Adicionar tipo explícito:

```typescript
// API route - garantir tipo correto
return NextResponse.json({
  message: result.message,
  context: result.context as LeadContext, // ← Tipagem explícita
  session_id: sessionIdFinal,
  timestamp: result.timestamp,
  conversion: result.conversion,
})
```

---

## CORREÇÃO 4: ZIP 29708 Misteriosamente Rejeitado 🟡 MÉDIO

### Arquivo: `lib/ai/lead-chat-agent.ts` (linha ~63)

#### 4.1 Melhorar tratamento de erro

```typescript
async function isZipCovered(zip: string): Promise<boolean> {
  logger.info('[lead-chat] isZipCovered checking', { zip })

  try {
    const supabase = createAdminClient()

    // Method 1: Try using .contains()
    const { data, error } = await supabase
      .from('areas_atendidas')
      .select('id, nome, zip_codes')
      .eq('ativo', true)
      .contains('zip_codes', [zip])
      .limit(1)

    if (error) {
      logger.error('[lead-chat] isZipCovered .contains() error', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        zip
      })

      // Fallback to RPC function
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('check_zip_code_coverage', { p_zip_code: zip })

      if (!rpcError && rpcData && rpcData.length > 0) {
        logger.info('[lead-chat] isZipCovered RPC fallback success', { zip, found: rpcData.length })
        return true
      }

      // MUDANÇA CRÍTICA: Logar erro específico antes de fail open
      logger.error('[lead-chat] isZipCovered RPC fallback failed', {
        rpcError: rpcError?.message,
        rpcCode: rpcError?.code,
        zip
      })

      // ANTES: return true (fail open)
      // DEPOIS: return false (fail closed - mais seguro para lead capture)
      return false
    }

    const covered = !!(data && data.length > 0)

    // ADICIONAR log de sucesso
    if (covered) {
      logger.info('[lead-chat] isZipCovered FOUND', {
        zip,
        area: data[0].nome,
        cidade: data[0].cidade
      })
    } else {
      logger.warn('[lead-chat] isZipCovered NOT FOUND', { zip })
    }

    return covered
  } catch (err) {
    logger.error('[lead-chat] isZipCovered exception', {
      error: String(err),
      zip
    })
    return false // ← Mudar de true para false
  }
}
```

#### 4.2 Adicionar monitoramento

Criar dashboard ou alerta para ZIPs rejeitados com frequência.

---

## CORREÇÃO 5: Mensagens Duplicadas 🟢 BAIXO

### Arquivo: `hooks/use-lead-chat.ts` (linha ~58)

#### 5.1 Prevenir requests duplicados

```typescript
const sendMessage = useCallback(
  async (content: string) => {
    if (!content.trim() || isLoading) return  // ← Já existe

    // ADICIONAR: Verificar mensagem duplicada
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === 'user' && lastMessage?.content === content.trim()) {
      console.warn('[use-lead-chat] Duplicate message ignored', { content })
      return
    }

    // ... restante do código
  },
  [isLoading, sessionId, context, messages, trackEvent]
)
```

---

## ORDEM DE IMPLEMENTAÇÃO

1. **Correção 1** (Loop infinito) - CRÍTICA, UX terrível
2. **Correção 2.1+2.2** (Logs para zipRejectedCount) - Diagnosticar primeiro
3. **Correção 4** (ZIP rejeitado) - Leads sendo perdidos
4. **Correção 3** (Contexto corrompido) - Dados importantes
5. **Correção 5** (Mensagens duplicadas) - Baixa prioridade
6. **Correção 2.3** (Server-side state) - Refatoração arquitetural

---

## TESTES NECESSÁRIOS

Após implementar cada correção:

1. **Teste Loop Infinito:**
   - Usuario completa lead
   - Envia "bye" → deve fechar
   - Envia "no" quando perguntado → deve fechar

2. **Teste ZIP Rejeitado:**
   - Enviar ZIP fora da área 2x → deve encerrar
   - Verificar logs para confirmar contador

3. **Teste Contexto Pós-Save:**
   - Completar lead
   - Verificar se address, zipConfirmed são preservados

4. **Teste ZIP Cobertura:**
   - Enviar 29708 → deve aceitar
   - Enviar ZIP realmente fora → deve rejeitar

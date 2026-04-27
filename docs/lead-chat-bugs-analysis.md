# Lead Chat - Análise Profunda de Bugs

Data: 2026-04-27
Sessões analisadas: OUwLuidKDi7p-rsT (falha), P9GfjU2Q8llduPEM (sucesso com bugs)

---

## 📋 RESUMO EXECUTIVO

### Principais Descobertas

Foram identificados **5 bugs críticos** no sistema de Lead Chat que afetam a UX e a conversão de leads:

| Bug | Status | Impacto |
|-----|--------|---------|
| Loop infinito após save | 🔴 CRÍTICO | Usuário preso em chat infinito |
| zipRejectedCount não incrementa | 🔴 ALTO | Chat não encerra quando deve |
| Contexto corrompido pós-save | 🟡 MÉDIO | Dados perdidos no cliente |
| ZIP 29708 misteriosamente rejeitado | 🟡 MÉDIO | Leads perdidos |
| Mensagens duplicadas | 🟢 BAIXO | Confusão mínima |

### Arquitetura: Fonte dos Problemas

O sistema atual usa **client-side state management** onde o cliente mantém todo o contexto (`LeadContext`) e o envia a cada request. Isso causa:

1. **Race conditions**: Cliente envia estado desatualizado
2. **State desync**: Servidor atualiza contexto mas cliente não recebe a tempo
3. **Stale data**: Próximo request usa contexto velho

**Recomendação arquitetural:** Mover para **server-side state** com contexto persistido em DB/Redis associado ao `sessionId`.

---

## BUG 1: zipRejectedCount não incrementa corretamente

### Sintoma
No Log 1, após dois ZIPs rejeitados (07032, 29708), o contador permanece em 1:
```
1º ZIP rejeitado: zipRejectedCount=1 ✓
2º ZIP rejeitado: zipRejectedCount=1 ❌ (deveria ser 2)
```

### Causa Raiz
O problema está na interação entre **race condition de estado** e **falta de validação de update**.

**Fluxo problemático:**
1. Cliente envia `context.zipRejectedCount=1`
2. Servidor incrementa para 2 e retorna contexto atualizado
3. **Cliente NÃO recebe o contexto atualizado a tempo** (ou o contexto do request está "stale")
4. Próximo request chega com `zipRejectedCount=1` novamente

**Problema de arquitetura:** O cliente mantém o estado e o envia a cada request. Se houver:
- Request simultâneos (usuário clica rápido)
- Network lag
-race condition no React state

O servidor recebe um contexto desatualizado.

**Problema adicional:** Mesmo que o servidor receba o contador correto, há um problema na lógica:

```typescript
// lib/ai/lead-chat-agent.ts:754-757
Object.assign(updatedContext, extracted)

if (zipRejected) {
  updatedContext.zipRejectedCount = updatedContext.zipRejectedCount + 1
```

Se `extracted` contiver modificações em outros campos, o `Object.assign` pode sobrescrever o contador se ele não estiver explícito no spread inicial.

---

## BUG 2: Loop infinito de pergunta de fechamento

### Sintoma
No Log 2, após `leadSaved=true`, a mesma pergunta se repete 6x:
```
"Perfect, Tayna! One more thing — do you have any other questions I can help with? 😊"
```

### Causa Raiz

**Problema 1: "bye" não é reconhecido como closing signal**

```typescript
// lib/ai/lead-chat-agent.ts:646-657
const closingSignals = [
  'no', 'nope', 'nah', 'nothing', 'none',
  'no more', 'that\'s all', 'that is all', 'thats all',
  'nothing else', 'all good', 'all set', 'done',
  'nao', 'não', // PT
]
```

**"bye" não está na lista!** Quando o usuário digita "bye":
- `isClosingSignal = false`
- Código cai no bloco de LLM (linhas 683-727)
- LLM responde algo, mas NÃO marca `askedClosingQuestion=false`
- Próxima mensagem: `askedClosingQuestion` ainda é `true`
- Como `isClosingSignal` ainda é false, loop continua

**Problema 2: Pergunta se repete quando usuário tem mais perguntas**

Quando usuário responde algo diferente de "no" (ex: "lopping?", "kkkk"):
- `isClosingSignal = false`
- `askedClosingQuestion = true`
- Código chama LLM para responder pergunta
- LLM responde, mas **não reseta** `askedClosingQuestion`
- Resposta vem com: "Anything else I can help with?"
- Mas `askedClosingQuestion` continua true
- Loop infinito

**Problema 3: Resposta do LLM cai no fluxo errado**

```typescript
// lib/ai/lead-chat-agent.ts:709-713
const responseContent = sanitizeResponse(choice.message.content ?? "Sure, happy to help! 😊")
return {
  message: `${responseContent}\n\nAnything else I can help with?`,
  context: req.context,  // ← NÃO atualiza askedClosingQuestion
  ...
}
```

O contexto retornado é o **mesmo que entrou** (`req.context`), então `askedClosingQuestion` permanece `true` para sempre.

---

## BUG 3: Contexto corrompido após save

### Sintoma
No Log 2, imediatamente após `leadSaved=true`:
```
Antes: address="2030 Acorn Lane", zipConfirmed=true
Depois: address=null, zipConfirmed=false
```

### Causa Raiz

**Problema: Diferença entre contextos em diferentes pontos do código**

Analisando o save no Log 2:
1. Mensagem "yes, correct" → chama save_lead
2. Resposta: "Perfect, Tayna! I've got everything saved..."
3. Contexto retornado: `leadSaved=true, address="2030 Acorn Lane"`
4. **Próxima mensagem do assistant** (id `011ba39d`): `address=null`

Isso indica que há **duas respostas sendo geradas** para a mesma mensagem do usuário, ou o contexto está sendo resetado em algum ponto.

**Possível causa:** O `buildPostSavePrompt` ou a lógica de pós-save está criando um novo contexto com defaults.

```typescript
// lib/ai/lead-chat-agent.ts:198-207
function buildPostSavePrompt(context: LeadContext): string {
  const firstName = context.name?.split(' ')[0] ?? 'there'
  return `You are Carol, virtual assistant for Chesque Premium Cleaning.
The customer's information has already been saved. Name: ${context.name ?? 'unknown'}, ZIP: ${context.zip ?? 'unknown'}, address: ${context.address ?? 'unknown'}.
...
```

O prompt menciona `context.address`, mas o contexto snapshot mostra `address=null`. Isso sugere que o contexto foi perdido entre o save e a próxima mensagem.

**Hipótese:** O problema pode estar no merge do contexto no cliente ou na serialização do contexto no server.

---

## BUG 4: Mensagens de assistant duplicadas

### Sintoma
No Log 1, duas mensagens de assistant consecutivas com mesmo conteúdo:
```
ID: 8e821c84 → "Hmm, that ZIP isn't in our service area..."
ID: c3efc356 → "Hmm, that ZIP isn't in our service area..."
```

Sem mensagem de usuário entre elas.

### Causa Raiz
**Possíveis causas:**
1. Cliente fez 2 requests idênticos (retries automáticos?)
2. Bug no hook que adiciona mensagens duplicadas
3. Server-side: alguma lógica que gera 2 respostas

**Análise do Log:**
- Mesmo timestamp (`created_at: 2026-04-26T20:20:56.9834+00:00` vs `2026-04-26T20:20:56.9834+00:00`)
- Mesmo `response_time_ms: 117`

Isso sugere **dois inserts no banco** para a mesma resposta, ou um problema de logging.

---

## BUG 5: "29708" rejeitado indevidamente

### Sintoma
ZIP `29708` foi rejeitado no Log 1, mas o ZIP **existe na base de dados**.

### Descoberta
**O ZIP 29708 ESTÁ na base de dados:**
- "Fort Mill" tem zip_codes: ["29707", "29708", "29715", "29716"]
- "Cobertura Metro 30mi / Fort Mill" inclui 29708

**Nota geográfica:** 29708 é Fort Mill, SC (não Rock Hill como se pensava). Rock Hill tem ZIPs 29730, 29732, 29733.

### Possível Causa Raiz
O `.contains()` do Supabase client pode não estar funcionando como esperado, ou há um **timing issue** onde a query falha e o fallback RPC também falha.

**Testes realizados:**
```sql
-- Query direta funciona:
SELECT * FROM areas_atendidas WHERE zip_codes @> ARRAY['29708']::text[]
-- Retorna: Fort Mill (id: 1a6e2e81-45dd-496b-a9aa-76b2144a9d8d)

-- RPC também funciona:
SELECT check_zip_code_coverage('29708')
-- Retorna: Fort Mill + Cobertura Metro 30mi
```

**Hipótese:** O problema pode estar em como o Supabase client traduz `.contains()` para SQL, ou um erro transitório que cai no fallback que também falha.

**Código problemático:**
```typescript
// lib/ai/lead-chat-agent.ts:77-91
if (error) {
  // Fallback to RPC function
  const { data: rpcData, error: rpcError } = await supabase
    .rpc('check_zip_code_coverage', { p_zip_code: zip })

  if (!rpcError && rpcData && rpcData.length > 0) {
    return true
  }

  // If both fail, fail open
  logger.error('[lead-chat] isZipCovered RPC fallback also failed', { rpcError: rpcError?.message, zip })
  return true  // ← FAIL OPEN! Deveria ser false para ZIP rejeitado
}
```

**PROBLEMA:** Quando ambas as queries falham, o código retorna `true` (fail open), mas no log o ZIP foi rejeitado. Isso é contraditório.

**Investigação adicional necessária:** Verificar logs do servidor para ver se houve erro na query do Supabase.

---

## BUG 6: Respostas com response_time_ms=0

### Sintoma
Múltiplas mensagens no Log 2 com `response_time_ms: 0` e sem LLM calls.

### Causa Raiz
Essas são **respostas estáticas do código** que não chamam o LLM. Elas vêm do bloco `leadSaved` quando `askedClosingQuestion=true`:

```typescript
// lib/ai/lead-chat-agent.ts:672-680
if (!req.context.askedClosingQuestion) {
  logger.info('[lead-chat] Asking closing question')
  return {
    message: `Perfect, ${firstName}! One more thing — do you have any other questions I can help with? 😊`,
    context: { ...req.context, askedClosingQuestion: true },
    timestamp,
    llmCalls,  // ← Vazio
    toolCalls, // ← Vazio
  }
}
```

Isso é **comportamento esperado**, não um bug. O `response_time_ms: 0` indica que não houve processamento LLM.

---

## Resumo de Prioridades

| Bug | Prioridade | Impacto |
|-----|------------|---------|
| #2: Loop infinito closing | 🔴 CRÍTICO | UX terrível, chat não encerra |
| #1: zipRejectedCount | 🔴 ALTO | Chat não encerra após 2 ZIPs rejeitados |
| #3: Contexto corrompido | 🟡 MÉDIO | Dados perdidos, mas lead salvo |
| #5: ZIP 29708 rejeitado | 🟡 MÉDIO | Usuários perdem leads |
| #4: Mensagens duplicadas | 🟢 BAIXO | Confuso, mas funcional |
| #6: response_time_ms=0 | 🟢 INFO | Comportamento esperado |

---

## Soluções Propostas

### Solução Bug #1 (zipRejectedCount)
**Opção A:** Server-side source of truth
- Manter contador no server (Redis/DB por sessionId)
- Cliente não envia contador, apenas sessionId

**Opção B:** Validar e reconciliar no server
- Server recebe contador do cliente
- Verifica logs recentes para confirmar valor
- Usa max(clientValor, serverValor)

**Opção C:** Remover dependência do cliente
- Cliente envia apenas mensagem + history
- Server busca contexto anterior do DB

### Solução Bug #2 (Loop infinito)
Adicionar "bye", "goodbye", "see you" aos closing signals E resetar `askedClosingQuestion` após responder pergunta do usuário.

### Solução Bug #3 (Contexto corrompido)
Investigar serialização do contexto e garantir que todos os campos são preservados no merge.

### Solução Bug #5 (ZIP 29708)
Investigar logs do Supabase para entender por que `.contains()` ou RPC estão falhando. Considerar usar query SQL direta com operador `@>` ao invés de `.contains()`.

---

## DIAGRAMA: Fluxo Problemático do Loop Infinito

```
┌─────────────────────────────────────────────────────────────────┐
│                         leadSaved=true                          │
│                    askedClosingQuestion=false                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    Usuário envia "thanks"
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Server: !askedClosingQuestion → retorna pergunta + flag=true  │
│  "Perfect! One more thing — do you have other questions?"       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    Cliente atualiza: flag=true
                              │
                              ▼
                    Usuário envia "bye"
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Server: isClosingSignal("bye") → FALSE (não está na lista!)   │
│          cai no bloco do LLM → responde + context = req.context │
│          (não reseta flag, continua true)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    Cliente: flag ainda = true
                              │
                              ▼
                    Usuário envia "no"
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Server: isClosingSignal("no") → TRUE                          │
│          retorna shouldCloseChat=true ← NUNCA ACONTECE!        │
│          POR QUE? "no" está na lista MAS...                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                        LOOP INFINITO
```

**Problema específico:** No log, quando usuário mandou "no", o chat **não fechou**. Isso indica que `isClosingSignal` foi false ou `shouldCloseChat` não foi setado corretamente.

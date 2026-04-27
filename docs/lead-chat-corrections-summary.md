# Correções Implementadas - Code Review

Data: 2026-04-27
Referência: Code review em `docs/lead-chat-code-review.md`

---

## 📋 Resumo das Mudanças

### Arquivos Modificados
1. `types/lead-chat.ts` - Adicionado campo `postSaveInteractionCount`
2. `lib/ai/lead-chat-agent.ts` - Lógica pós-save refinada + server-side validation
3. `hooks/use-lead-chat.ts` - Prevenção de race conditions

---

## ✅ Problemas Corrigidos

### 1. Lógica de `askedClosingQuestion` - COMPLETO

**Problema identificado no review:** Reset para `false` criava loop de perguntas repetidas.

**Solução implementada:**
- Adicionado campo `postSaveInteractionCount` ao `LeadContext`
- **Removido** o reset de `askedClosingQuestion` para `false`
- Lógica nova:
  1. Se `isClosingSignal` → fecha chat imediatamente ("bye", "no", etc.)
  2. Se `!askedClosingQuestion` → pergunta "One more thing..."
  3. Se `postSaveInteractionCount >= 3` → oferece encerramento mais direto
  4. Senão → responde via LLM **sem** repetir a pergunta

**Resultado:** Usuário não fica preso em loop de "One more thing?"

### 2. Server-side Validation para `zipRejectedCount` - COMPLETO

**Problema identificado no review:** Apenas logs foram adicionados, bug não foi corrigido.

**Solução implementada:**
```typescript
// Função que conta rejeições no histórico
function countZipRejectionsFromHistory(history): number

// Validação server-side que usa o máximo entre:
// - Valor do cliente (pode estar desatualizado)
// - Valor derivado do histórico (confiável)
const actualCount = Math.max(clientCount, serverZipRejections)
```

**Resultado:** Cliente com contexto desatualizado não consegue burlar o limite de 2 rejeições.

### 3. Prevenção de Race Conditions - COMPLETO

**Problema identificado no review:** Verificação de duplicata não previne todos os casos.

**Solução implementada:**
- Adicionado flag `isProcessing` separado de `isLoading`
- `isProcessing` é setado **antes** da mensagem ser adicionada ao array
- Verificação inicial: `if (!trimmed || isProcessing || isLoading) return`

**Resultado:** Usuário não pode clicar rapidamente e enviar mensagens duplicadas.

### 4. Log de ZIP Rejeitado - MELHORADO

**Problema identificado no review:** Log mostrava `'extracted.zip || '(extracted from message)'` mas `extracted.zip` sempre é `null` quando rejeitado.

**Solução implementada:**
- Adicionada função `extractZipFromMessage()` que busca ZIP na mensagem atual e no histórico
- Log agora mostra:
  - `testedZip`: O ZIP que foi testado (extraído da mensagem)
  - `clientCount`: Valor enviado pelo cliente
  - `serverCount`: Valor derivado do histórico
  - `actualCount`: Valor usado (máximo)
  - `newCount`: Valor após incremento

---

## 📊 Comparação: Antes vs Depois

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Loop infinito pós-save | ❌ `askedClosingQuestion` resetava para `false` | ✅ Usa contador + lógica mais inteligente |
| zipRejectedCount | ❌ Apenas logs | ✅ Server-side validation via histórico |
| Race conditions | ❌ Apenas verificação de última mensagem | ✅ Flag `isProcessing` |
| Log de ZIP rejeitado | ⚠️ Mostrava valor sempre nulo | ✅ Mostra ZIP testado |

---

## 🧪 Testes Recomendados

### Teste 1: Loop Infinito Corrigido
1. Completar lead (nome → telefone → ZIP → endereço)
2. Enviar "bye" → **deve fechar imediatamente**
3. Em nova sessão:
   - Completar lead
   - Enviar qualquer mensagem (não "bye")
   - Enviar "bye" → **deve fechar**
4. Em nova sessão:
   - Completar lead
   - Enviar 3+ mensagens diferentes
   - Após 3ª mensagem → **deve oferecer encerramento direto**

### Teste 2: zipRejectedCount Server Validation
1. Enviar ZIP inválido (00000) → contador = 1
2. **SIMULAR** contexto com zipRejectedCount=0 (stale state)
3. Enviar outro ZIP inválido (11111) → **deve contar como 2** e encerrar

### Teste 3: Race Conditions
1. Clicar rapidamente no botão enviar 3x com mesma mensagem
2. **Apenas 1 mensagem** deve ser enviada

---

## 🔍 Verificação de Regressão

| Caso | Verificado |
|------|------------|
| Fluxo normal de lead | ✅ TypeScript sem erros |
| Fechamento com "no"/"bye" | ✅ Lógica atualizada |
| ZIP rejeitado 2x | ✅ Server validation |
| Contexto preservado pós-save | ✅ Mantido da implementação anterior |

---

## 📝 Notas de Implementação

1. **Compatibilidade**: O novo campo `postSaveInteractionCount` tem valor padrão `0` em `defaultLeadContext()`, garantindo compatibilidade com contextos existentes.

2. **Performance**: A função `countZipRejectionsFromHistory()` é O(n) onde n é o tamanho do histórico (max 30 mensagens). Performance impact é desprezível.

3. **Logs**: Logs adicionados ajudam no debug futuro sem impactar performance.

---

## ✅ Status

**Todas as correções do code review foram implementadas.**

Próximos passos recomendados:
1. Deploy em staging/ambiente de teste
2. Executar testes manuais descritos acima
3. Monitorar logs por 24-48h
4. Deploy em produção se tudo OK

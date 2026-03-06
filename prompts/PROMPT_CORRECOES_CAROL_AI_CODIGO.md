# 🔧 PROMPT DE IMPLANTAÇÃO: CORREÇÕES CAROL AI — CÓDIGO

**Projeto:** Caroline Premium Cleaning  
**Versão:** 1.1 (Correções pós-auditoria)  
**Data:** 06/03/2026  
**Objetivo:** Corrigir 12 problemas de código identificados na auditoria do sistema Carol AI  
**Pré-requisito:** Script SQL de correções já foi executado no Supabase (RLS, SECURITY DEFINER, áreas, configs)

---

## 1. VISÃO GERAL DA IMPLANTAÇÃO

### Objetivo
Corrigir inconsistências, bugs e falhas no código da Carol AI (`lib/ai/carol-agent.ts`, `lib/ai/prompts.ts`, `types/carol.ts`, `app/api/slots/route.ts`) identificados na auditoria completa do sistema.

### Problema que Resolve
A Carol AI tem 12 problemas de código que causam: tool `calculate_price` não implementada, inconsistências de parâmetros entre schema e executor, leitura de dados usando client errado, loop de tools sem limite, endpoint mock em produção, normalização de telefone ausente, e configurações lidas de tabela errada.

### Escopo
Alterações **apenas** nos seguintes arquivos:
- `lib/ai/carol-agent.ts` — Correções no agente principal
- `lib/ai/prompts.ts` — Ajustes no schema das tools e prompt
- `types/carol.ts` — Alinhamento de tipos
- `app/api/slots/route.ts` — Substituir mock por dados reais

---

## 2. ANÁLISE DE CONTEXTO OBRIGATÓRIA

Antes de qualquer alteração:
- Analisar o `.context` do projeto e do repositório GitHub
- Verificar a estrutura de pastas atual
- Entender as convenções de código existentes (TypeScript, imports, naming)
- Confirmar que os arquivos listados existem nos paths indicados
- Verificar se `lib/supabase/server.ts` exporta tanto `createClient` quanto `createAdminClient`
- Verificar se `lib/env.ts` exporta `env.defaultModel`

---

## 3. PLANO DE IMPLANTAÇÃO

### TAREFA 1: Corrigir `getSystemConfig` — Ler da tabela correta

**Arquivo:** `lib/ai/carol-agent.ts`  
**Método:** `getSystemConfig()`  
**Problema:** O método busca configs de uma tabela `business_settings` que NÃO existe. A tabela real é `configuracoes` (campo `chave` e `valor` como JSONB).

**O que fazer:**
- Alterar a query de `business_settings` para `configuracoes`
- Buscar chaves: `horario_inicio`, `horario_fim`, `duracao_visita`
- O campo `valor` é JSONB — fazer cast apropriado ao ler
- Manter o fallback de `services` da tabela `servicos_tipos` como está

**Lógica correta:**
```
1. Buscar de configuracoes WHERE chave IN ('horario_inicio', 'horario_fim', 'duracao_visita')
2. Parsear: valor é JSONB, então valor de "horario_inicio" será "08:00" (string JSON)
3. Montar CarolConfig com:
   - operatingStart = valor de horario_inicio ou '08:00'
   - operatingEnd = valor de horario_fim ou '18:00'  
   - visitDuration = valor de duracao_visita (número) ou 60
```

**IMPORTANTE:** Esta query usa `createClient()` que agora funciona como `anon` (policy de SELECT para anon em `configuracoes` já existe). Não precisa mudar para admin.

---

### TAREFA 2: Migrar TODAS as leituras do CarolAgent para `adminSupabase`

**Arquivo:** `lib/ai/carol-agent.ts`  
**Problema:** O método `chat()` usa `createClient()` para ler histórico e contexto de sessão. Embora tenhamos adicionado policies anon SELECT via SQL, é mais seguro e consistente usar `adminSupabase` para TODAS as operações do agent, já que ele já é criado no início do método `chat()`.

**O que fazer:**
- No método `chat()`, o `adminSupabase` já é criado. Usar ele para:
  - Buscar contexto da sessão (`chat_sessions`)
  - Buscar histórico de mensagens (`mensagens_chat`)
  - Salvar mensagem do usuário
  - Salvar resposta do assistente
- Nos tool executors, usar `adminSupabase` para:
  - `checkAvailability()` — a RPC `get_available_slots` agora é SECURITY DEFINER, mas passar admin por consistência
  - `findCustomer()` — mudar de `createClient()` para `createAdminClient()`
  - `checkZipCoverage()` — mudar de `createClient()` para `createAdminClient()`
- Manter `createAdminClient()` em `createLead()` e `createBooking()` como já está

**Padrão a seguir:** Criar um único `adminSupabase` no início do `chat()` e passar para os métodos que precisam, OU cada método cria o seu (como já fazem `createLead` e `createBooking`). Manter o padrão existente — cada executor cria o seu.

---

### TAREFA 3: Implementar `calculate_price` no switch de tools

**Arquivo:** `lib/ai/carol-agent.ts`  
**Método:** `executeTool()`  
**Problema:** A tool `calculate_price` está definida no TOOLS array mas não tem case no switch. Cai no `default` e retorna erro.

**O que fazer:**
- Adicionar case `'calculate_price'` no switch
- Implementar método `private async calculatePrice(params: CalculatePriceParams)`
- Chamar a RPC `calculate_service_price` do Supabase
- A RPC aceita: `p_bedrooms` (integer), `p_bathrooms` (numeric), `p_tipo_servico` (text default 'regular')
- A RPC retorna um NUMERIC (preço base × multiplicador do tipo de serviço)
- Salvar resultado no contexto da sessão

**PORÉM — DECISÃO DE NEGÓCIO:**
O prompt da Carol diz "NUNCA dê valores ou estimativas de preço pelo chat" e "a primeira visita é GRATUITA". Se essa regra de negócio se mantém, há duas opções:

**Opção A (recomendada):** Implementar a tool mas fazer ela retornar uma mensagem tipo:
```json
{
  "success": true,
  "message": "Não fornecemos valores pelo chat. A primeira visita é gratuita e serve para conhecer o espaço e passar um orçamento personalizado presencialmente."
}
```

**Opção B:** Remover `calculate_price` do TOOLS array em `prompts.ts` para evitar que a IA tente chamá-la.

**Escolher Opção A** — é mais segura pois a IA pode explicar ao cliente que precisa da visita.

---

### TAREFA 4: Adicionar limite no loop de tool calling

**Arquivo:** `lib/ai/carol-agent.ts`  
**Método:** `chat()` — bloco `while (keepProcessing)`  
**Problema:** Loop sem limite. Se a IA entrar em ciclo, roda indefinidamente.

**O que fazer:**
- Adicionar constante `MAX_TOOL_ITERATIONS = 5` no topo da classe
- No loop while, incrementar contador e verificar:
```
let iterations = 0
while (keepProcessing && iterations < MAX_TOOL_ITERATIONS) {
    iterations++
    // ... código existente
}
if (iterations >= MAX_TOOL_ITERATIONS) {
    finalContent = 'Desculpe, tive um problema processando sua solicitação. Pode tentar novamente?'
    this.trace('Max tool iterations reached', { sessionId, iterations }, 'error')
}
```

---

### TAREFA 5: Implementar normalização de telefone

**Arquivo:** `lib/ai/carol-agent.ts`  
**Problema:** `findCustomer` faz `.eq('telefone', params.phone)` — se formatos forem diferentes, não encontra.

**O que fazer:**
- Criar método utilitário `private normalizePhone(phone: string): string`
- Remover todos os caracteres não-numéricos: `phone.replace(/\D/g, '')`
- Se tiver 11 dígitos e começar com 1 (código dos EUA), remover o 1
- Resultado final: apenas 10 dígitos numéricos
- Usar em `findCustomer()`: normalizar o input antes de buscar
- Usar em `createLead()`: normalizar antes de salvar
- Alterar query de `findCustomer` para buscar por telefone normalizado:
  - Opção simples: `.eq('telefone', normalizedPhone)` (se o banco já tiver normalizado)
  - Opção robusta: usar `ilike` ou fazer a normalização na query SQL com `regexp_replace`

**Sugestão de implementação da query robusta:**
```typescript
const normalizedPhone = this.normalizePhone(params.phone)
const { data, error } = await supabase
    .from('clientes')
    .select('id, nome, telefone, endereco_completo, email, status')
    .or(`telefone.eq.${normalizedPhone},telefone.eq.${params.phone}`)
    .limit(1)
    .single()
```

---

### TAREFA 6: Alinhar nomes de parâmetros — Tool Schema vs TypeScript vs Executor

**Arquivos:** `lib/ai/prompts.ts`, `types/carol.ts`, `lib/ai/carol-agent.ts`  
**Problema:** A tool `create_booking` define `time` no schema, mas o type define `time_slot`, e o executor faz `params.time_slot || params.time` como workaround.

**O que fazer:**
- No schema TOOLS em `prompts.ts`, a tool `create_booking` já tem `time` como parâmetro. **Manter `time`** pois é o nome que a IA vai usar.
- No `types/carol.ts`, alterar `CreateBookingParams`:
  - Mudar `time_slot: string` para `time: string`
  - Adicionar `time_slot?: string` como opcional (backward compat)
- No executor `createBooking()`, a lógica de `params.time_slot || params.time` pode ser simplificada para `params.time || params.time_slot` (priorizar o nome do schema)
- Mesma lógica para `notes` vs `special_instructions`: o schema define `notes`, o type define `special_instructions`. Alinhar para `notes` no type e no executor.

---

### TAREFA 7: Remover `post_construction` do enum da tool e adicionar `visit`

**Arquivo:** `lib/ai/prompts.ts`  
**Problema:** O enum `service_type` na tool `create_booking` inclui `post_construction` que não existe em `servicos_tipos`. E não inclui `visit` que é usado para visitas de orçamento.

**O que fazer:**
- Na tool `create_booking`, alterar enum de service_type:
  - DE: `['visit', 'regular', 'deep', 'move_in_out', 'post_construction']`
  - PARA: `['visit', 'regular', 'deep', 'move_in_out']`
- Verificar que o type `CreateBookingParams` em `types/carol.ts` também reflete essa mudança no tipo `service_type`

---

### TAREFA 8: Substituir endpoint mock de slots

**Arquivo:** `app/api/slots/route.ts`  
**Problema:** Retorna dados mock hardcoded de dezembro 2025.

**O que fazer:**
- Substituir o mock pelo call real à RPC `get_available_slots`
- Aceitar query params: `date` (YYYY-MM-DD) e `duration` (minutos, default 180)
- Retornar slots do banco real
- Manter o `createClient()` aqui pois a RPC agora é SECURITY DEFINER

**Lógica:**
```
1. Ler query params date e duration do request
2. Validar que date existe e é formato YYYY-MM-DD
3. Chamar supabase.rpc('get_available_slots', { p_data: date, p_duracao_minutos: duration })
4. Filtrar apenas slots com disponivel = true
5. Retornar { success: true, date, slots: data }
```

---

### TAREFA 9: Remover referência a Miami no prompt legacy

**Arquivo:** `lib/ai/prompts.ts`  
**Problema:** O `CAROL_SYSTEM_PROMPT` legacy (exportado como constante estática) menciona "Miami/Charlotte". As áreas de Miami estão desativadas.

**O que fazer:**
- No `CAROL_SYSTEM_PROMPT` legacy (o que é gerado com `buildCarolPrompt` usando config padrão vazia), garantir que não mencione Miami
- Se o prompt legacy é usado em algum lugar como fallback, atualizar para refletir apenas Charlotte/Fort Mill/cidades próximas
- Verificar se `CAROL_SYSTEM_PROMPT` é usado em algum outro lugar do código além de `carol-agent.ts`

---

### TAREFA 10: Melhorar tratamento de `checkZipCoverage` no agent

**Arquivo:** `lib/ai/carol-agent.ts`  
**Método:** `checkZipCoverage()`  
**Problema:** O retorno verifica `data && data[0]`, mas a função RPC `check_zip_code_coverage` retorna TABLE (múltiplas rows). Se não encontrar, retorna array vazio. O campo correto é `area_nome` (não `atendido`).

**O que fazer:**
- A RPC retorna: `area_id`, `area_nome`, `taxa_deslocamento`, `tempo_deslocamento`
- Se retornar array vazio = não atendido
- Se retornar 1+ rows = atendido
- Ajustar a lógica:
```
const result = data && data.length > 0 ? data[0] : null
return {
    success: true,
    covered: result !== null,
    area_name: result?.area_nome || null,
    message: result 
        ? `Ótimo! Atendemos a região de ${result.area_nome}!`
        : `Desculpe, não atendemos o CEP ${params.zip_code} no momento.`
}
```

---

### TAREFA 11: Alterar status do agendamento criado para `confirmado`

**Arquivo:** `lib/ai/carol-agent.ts`  
**Método:** `createBooking()`  
**Problema:** O INSERT usa `status: 'agendado'`. Agendamentos criados pela Carol devem ser `confirmado` pois o cliente já confirmou todos os dados na conversa.

**O que fazer:**
- Alterar `status: 'agendado'` para `status: 'confirmado'` no INSERT de agendamentos

---

### TAREFA 12: Atualizar documentação `docs/CAROL_AI.md`

**Arquivo:** `docs/CAROL_AI.md`  
**O que fazer:**
- Atualizar a data de última modificação
- Adicionar nota sobre as correções aplicadas (RLS, SECURITY DEFINER, novas áreas)
- Adicionar `find_customer` na lista de ferramentas (está faltando)
- Atualizar seção de segurança mencionando as policies de anon

---

## 4. PLANO DE VERIFICAÇÃO

### Teste 1: Histórico de Conversa
- [ ] Enviar 3 mensagens seguidas no chat
- [ ] A Carol deve lembrar do contexto das mensagens anteriores
- [ ] Verificar no Supabase que `mensagens_chat` tem as 3 mensagens + 3 respostas

### Teste 2: Buscar Cliente Existente
- [ ] Ter um cliente cadastrado com telefone `7045551234`
- [ ] Informar telefone `(704) 555-1234` no chat
- [ ] Carol deve encontrar o cliente (normalização funciona)
- [ ] Carol deve cumprimentar pelo nome

### Teste 3: Criar Lead Novo
- [ ] Conversar como novo cliente
- [ ] Informar nome, telefone, endereço com ZIP
- [ ] Carol deve chamar `create_lead`
- [ ] Verificar cliente criado com `status = 'lead'` e ZIP salvo

### Teste 4: Verificar Disponibilidade
- [ ] Perguntar "What times are available tomorrow?"
- [ ] Carol deve chamar `check_availability` com a data correta
- [ ] Deve retornar slots reais do banco (não inventados)

### Teste 5: Criar Agendamento
- [ ] Após lead criado, escolher data e horário
- [ ] Carol deve chamar `create_booking` com `cliente_id` correto (UUID)
- [ ] Agendamento criado com `status = 'confirmado'`

### Teste 6: Verificar CEP
- [ ] Perguntar "Do you serve 28202?"
- [ ] Carol deve chamar `check_zip_coverage`
- [ ] Retornar "Charlotte" como área

### Teste 7: CEP Não Atendido
- [ ] Perguntar "Do you serve 90210?"
- [ ] Carol deve informar que não atende a região

### Teste 8: Loop de Tools
- [ ] Simular cenário complexo com múltiplas perguntas
- [ ] Verificar nos logs que não passou de 5 iterações de tool

### Teste 9: Endpoint de Slots
- [ ] Fazer GET em `/api/slots?date=2026-03-10&duration=180`
- [ ] Deve retornar slots reais, não mock

### Teste 10: Preço pelo Chat
- [ ] Perguntar "How much for a 3 bedroom cleaning?"
- [ ] Carol NÃO deve dar valor numérico
- [ ] Deve explicar sobre a visita gratuita de orçamento

---

## 5. RESULTADO ESPERADO

### Comportamento Final
1. Carol mantém contexto durante toda a conversa (histórico + sessão)
2. Encontra clientes existentes por telefone (com normalização)
3. Cria leads corretamente com ZIP e verificação de cobertura
4. Mostra disponibilidade real de horários
5. Cria agendamentos com status `confirmado` e UUID correto de cliente
6. Nunca revela preços — sempre direciona para visita gratuita
7. Loop de tools limitado a 5 iterações
8. Endpoint `/api/slots` retorna dados reais
9. Todas as áreas NC/SC com ZIP codes corretos aparecem nas verificações

### Impacto no Sistema
- Eliminação dos bugs mais críticos de RLS (já corrigidos no banco)
- Código alinhado com o estado atual do banco de dados
- Maior confiabilidade no fluxo de agendamento end-to-end
- Melhoria na experiência do usuário (Carol não "esquece" mais informações)

---

**⚠️ IMPORTANTE: Antes de implementar qualquer tarefa, analise o `.context` do projeto e o repositório GitHub para confirmar os paths e padrões existentes. As correções SQL no banco já foram aplicadas — este prompt trata apenas das correções de código.**

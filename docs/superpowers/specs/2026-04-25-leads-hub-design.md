# Central de Leads - Design Specification

**Date:** 2026-04-25
**Status:** Draft
**Author:** Claude (with user input)

## Overview

Transformar `/admin/leads` em uma central unificada que gerencia leads de duas fontes:
- **Chat IA** (tabela `clientes`, status `lead`/`lead_incomplete`)
- **Formulário de Contato** (tabela `contact_leads`)

A página `/admin/clientes` passará a mostrar apenas clientes reais (já convertidos).

## Goals

1. Unificar leads de múltiplas fontes em uma única interface
2. Distinguir claramente leads de clientes reais
3. Permitir conversão manual de lead → cliente
4. Centralizar mensagens do formulário de contato

## Non-Goals

- Automatizar conversão de leads (sempre manual)
- Modificar a página `/admin/clientes` (fora do escopo)
- Criar novos endpoints de API (usar existentes)

---

## Data Model

### Fontes de Leads

| Fonte | Tabela | Campos | Status Originais |
|-------|--------|--------|------------------|
| Chat IA | `clientes` | nome, telefone, cidade, zip_code, endereco_completo, notas_internas | `lead`, `lead_incomplete` |
| Formulário | `contact_leads` | nome, telefone, cidade, mensagem, notas, pagina_origem | `novo`, `contatado`, `convertido`, `descartado` |

### Novas Colunas

```sql
-- Adicionar mensagem ao formulário de contato
ALTER TABLE public.contact_leads
ADD COLUMN mensagem TEXT;

-- Adicionar campo de data para retorno futuro
ALTER TABLE public.contact_leads
ADD COLUMN data_retorno DATE;

-- Adicionar campo de data para retorno futuro em clientes (para leads do Chat)
ALTER TABLE public.clientes
ADD COLUMN data_retorno DATE;
```

### Normalização de Status

| Origem | Status Original | Status Unificado | Display |
|--------|-----------------|------------------|---------|
| Chat IA | `lead_incomplete` | `novo_incompleto` | "Novo (Incompleto)" |
| Chat IA | `lead` | `novo` | "Novo" |
| Formulário | `novo` | `novo` | "Novo" |
| Ambos | `contatado` | `contatado` | "Contatado" |
| Ambos | `convertido` | `convertido` | "Convertido" |
| Ambos | `descartado` | `descartado` | "Descartado" |
| Ambos | `retorno_futuro` | `retorno_futuro` | "Retorno Futuro" |

### UnifiedLead Interface

```typescript
interface UnifiedLead {
  id: string
  source: 'chat' | 'form'
  nome: string
  telefone: string
  cidade: string | null
  location_display: string  // Cidade ou ZIP formatado
  status: UnifiedLeadStatus
  mensagem: string | null
  notas: string | null  // 'notas' para form, 'notas_internas' para chat
  created_at: string
  contacted_at: string | null
  data_retorno: string | null
  original_record: any  // Registro original para referência
}

type UnifiedLeadStatus =
  | 'novo_incompleto'
  | 'novo'
  | 'contatado'
  | 'convertido'
  | 'descartado'
  | 'retorno_futuro'
```

---

## UI Design

### Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Central de Leads                                        │
│  Gerencie leads do Chat IA e formulário em um só lugar      │
│  [Atualizar]                                                │
├─────────────────────────────────────────────────────────────┤
│  Cards de Estatísticas (5 cards horizontal)                 │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │
│  │ Total│ │ Hoje │ │ Novos│ │ Cont.│ │ Conv.│              │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘              │
├─────────────────────────────────────────────────────────────┤
│  Filtros                                                    │
│  [🔍 Busca]  [Origem: Todas ▼]  [Status: Todos ▼]          │
├─────────────────────────────────────────────────────────────┤
│  Tabela de Leads                                            │
│  ┌──────────┬──────────┬─────┬────────┬─────┬────────┬────┐│
│  │ Nome     │ Telefone │ Origem│ Cidade │Status│ Msg?   │Ações││
│  ├──────────┼──────────┼─────┼────────┼─────┼────────┼────┤│
│  │ João Silva│704-1234 │ Chat │ Charlo.│ Novo │ —      │[👁] ││
│  │ Maria Cost│917-5678 │ Form │ Fort M.│Cont.│ "Gost..│[👁] ││
│  └──────────┴──────────┴─────┴────────┴─────┴────────┴────┘│
└─────────────────────────────────────────────────────────────┘
```

### Colunas da Tabela

| Coluna | Descrição |
|--------|-----------|
| Nome | Nome do lead |
| Telefone | Link para `tel:` |
| Origem | 💬 Chat / 📝 Formulário |
| Cidade/ZIP | Localização |
| Status | Badge colorido |
| Msg? | Preview da mensagem (se existir) |
| Ações | 👁 Ver detalhes |

### Mobile View

Cards responsivos com as mesmas informações.

---

## Modals

### 1. Lead Detail Modal

```
┌─────────────────────────────────────────────┐
│  Detalhes do Lead                    [×]    │
├─────────────────────────────────────────────┤
│  [Avatar] João Silva                         │
│  Recebido em: 25/04/2026 às 14:30           │
│  Origem: 💬 Chat IA                          │
├─────────────────────────────────────────────┤
│  📞 704-123-4567   [Ligar] [SMS]            │
│  📍 Charlotte, NC 28202                      │
├─────────────────────────────────────────────┤
│  Mensagem: (se do formulário)               │
│  "Gostaria de saber mais sobre os           │
│   serviços de limpeza profunda..."          │
├─────────────────────────────────────────────┤
│  Status: [Contatado ▼]                       │
│  Notas: [_________________________________] │
├─────────────────────────────────────────────┤
│  [Transformar em Cliente]  [Marcar Retorno] │
│              [Excluir Lead]   [Fechar]       │
└─────────────────────────────────────────────┘
```

### 2. Convert to Client Modal

```
┌─────────────────────────────────────────────┐
│  Transformar Lead em Cliente        [×]    │
├─────────────────────────────────────────────┤
│  Os seguintes dados serão migrados:         │
│  ┌─────────────────────────────────────┐   │
│  │ Nome:    João Silva                  │   │
│  │ Telefone: 704-123-4567               │   │
│  │ Cidade:   Charlotte, NC              │   │
│  │ Origem:  📝 Formulário de Contato    │   │
│  └─────────────────────────────────────┘   │
│                                              │
│  ⚠️ Após converter, o lead será movido     │
│  para a lista de clientes.                 │
│                                              │
│  [Cancelar]  [Confirmar Conversão]         │
└─────────────────────────────────────────────┘
```

---

## Actions

| Ação | Descrição |
|------|-----------|
| Ver detalhes | Abre modal com informações completas |
| Editar status | Dropdown: Novo → Contatado → Convertido → Descartado → Retorno Futuro |
| Adicionar notas | Textarea com auto-save no blur |
| Marcar retorno | Define status para `retorno_futuro` |
| Transformar em cliente | Abre modal de confirmação e executa conversão |
| Excluir lead | Confirmação antes de excluir |

---

## Conversion Logic

### Deduplicação por Telefone (Antes da Conversão)

Antes de converter, verificar se já existe cliente com o mesmo telefone:

```typescript
async function checkDuplicateLead(phone: string) {
  const normalizedPhone = phone.replace(/\D/g, '')
  const { data } = await supabase
    .from('clientes')
    .select('id, nome, status')
    .eq('telefone', normalizedPhone)
    .maybeSingle()

  return data  // Retorna cliente existente ou null
}
```

Se encontrar duplicata:
- **Chat IA:** Apenas atualiza o lead existente para `ativo`
- **Formulário:** Atualiza `contact_leads.cliente_id` para apontar para o cliente existente

### Lead do Chat IA → Cliente

```typescript
// 1. Verificar duplicata
const existingClient = await checkDuplicateLead(lead.telefone)

if (existingClient) {
  // Já existe cliente - apenas atualiza status
  await supabase
    .from('clientes')
    .update({ status: 'ativo' })
    .eq('id', existingClient.id)

  return { clientId: existingClient.id, isNew: false }
}

// 2. Converter lead do chat
await supabase
  .from('clientes')
  .update({
    status: 'ativo',
    // NOTA: data_primeiro_servico só é definida quando agendamento é criado
  })
  .eq('id', leadId)

return { clientId: leadId, isNew: true }
```

### Lead do Formulário → Cliente

```typescript
// 1. Verificar duplicata
const existingClient = await checkDuplicateLead(lead.telefone)

let clienteId: string

if (existingClient) {
  // Cliente já existe - apenas linkar
  clienteId = existingClient.id
} else {
  // 2. Criar novo cliente
  const { data } = await supabase
    .from('clientes')
    .insert({
      nome: lead.nome,
      telefone: lead.telefone.replace(/\D/g, ''),
      cidade: lead.cidade,
      origem: 'website',
      status: 'ativo'
    })
    .select('id')
    .single()

  clienteId = data.id
}

// 3. Linkar lead ao cliente
await supabase
  .from('contact_leads')
  .update({
    status: 'convertido',
    cliente_id: clienteId
  })
  .eq('id', leadId)

// 4. Redirecionar para página do cliente
router.push(`/admin/clientes/${clienteId}`)
```

### Campo de Notas

- **Leads do Chat:** Usa `clientes.notas_internas`
- **Leads do Form:** Usa `contact_leads.notas`

O hook `useLeadSource` normaliza para o campo `notas` na interface `UnifiedLead`.

---

## Filters

| Filtro | Opções |
|--------|--------|
| Busca | Nome, telefone, cidade |
| Origem | Todas, Chat IA, Formulário |
| Status | Todos, Novo, Contatado, Convertido, Descartado, Retorno Futuro |

---

## Stats Cards

| Card | Métrica |
|------|---------|
| Total | Todos os leads não convertidos |
| Hoje | Leads recebidos hoje |
| Novos | Leads com status `novo` |
| Contatados | Leads com status `contatado` |
| Convertidos | Leads com status `convertido` |

---

## Components

| Componente | Responsabilidade |
|------------|------------------|
| `LeadsPage` | Container principal |
| `LeadsHeader` | Título + botão atualizar |
| `LeadsStatsCards` | Cards de estatísticas |
| `LeadsFilters` | Busca + filtros |
| `LeadsTable` | Tabela desktop |
| `LeadsMobileList` | Cards mobile |
| `LeadDetailModal` | Modal de detalhes |
| `ConvertToClientModal` | Modal de conversão |
| `useLeads` | Hook que busca e mescla leads das duas fontes |
| `useLeadStats` | Hook que calcula estatísticas |

### Hook: useLeads

```typescript
function normalizeToUnifiedLead(
  source: 'chat' | 'form',
  record: any
): UnifiedLead {
  if (source === 'chat') {
    return {
      id: record.id,
      source: 'chat',
      nome: record.nome,
      telefone: record.telefone,
      cidade: record.cidade,
      location_display: record.cidade || record.zip_code || '—',
      status: record.status === 'lead_incomplete' ? 'novo_incompleto' :
              record.status === 'lead' ? 'novo' : record.status,
      mensagem: null,
      notas: record.notas_internas || null,
      created_at: record.created_at,
      contacted_at: null,
      data_retorno: record.data_retorno || null,
      original_record: record
    }
  } else {
    return {
      id: record.id,
      source: 'form',
      nome: record.nome,
      telefone: record.telefone,
      cidade: record.cidade,
      location_display: record.cidade || '—',
      status: record.status,
      mensagem: record.mensagem || null,
      notas: record.notas || null,
      created_at: record.created_at,
      contacted_at: record.contacted_at || null,
      data_retorno: record.data_retorno || null,
      original_record: record
    }
  }
}

export function useLeads(filters: LeadFilters) {
  // Busca leads das duas fontes em paralelo
  // Normaliza para UnifiedLead
  // Aplica filtros client-side (ou via query Supabase)
  // Retorna { leads, isLoading, error, refetch }
}
```

---

## Internationalization

Novos textos em `lib/admin-i18n/`:

```typescript
{
  leads: {
    title: "Central de Leads",
    subtitle: "Leads do Chat IA e formulário em um só lugar",
    source: {
      all: "Todas",
      chat: "Chat IA",
      form: "Formulário"
    },
    status: {
      novo: "Novo",
      contatado: "Contatado",
      convertido: "Convertido",
      descartado: "Descartado",
      retorno_futuro: "Retorno Futuro"
    },
    actions: {
      convert: "Transformar em Cliente",
      markReturn: "Marcar Retorno",
      delete: "Excluir Lead",
      viewDetails: "Ver Detalhes"
    },
    modal: {
      convertConfirm: "Transformar Lead em Cliente",
      convertWarning: "Após converter, o lead será movido para a lista de clientes.",
      message: "Mensagem",
      noMessage: "Sem mensagem"
    },
    table: {
      name: "Nome",
      phone: "Telefone",
      source: "Origem",
      city: "Cidade",
      status: "Status",
      message: "Mensagem",
      messagePreview: "Msg",
      actions: "Ações"
    }
  }
}
```

---

## Migration

```sql
-- =====================================================
-- Migration: Central de Leads
-- =====================================================

-- 1. Adicionar campo de mensagem ao formulário de contato
ALTER TABLE public.contact_leads
ADD COLUMN mensagem TEXT;

-- 2. Adicionar campo de data para retorno futuro
ALTER TABLE public.contact_leads
ADD COLUMN data_retorno DATE;

-- 3. Adicionar campo de data para retorno futuro em clientes
ALTER TABLE public.clientes
ADD COLUMN data_retorno DATE;

-- 4. Atualizar view contact_leads_stats (se existir)
-- DROP VIEW IF EXISTS public.contact_leads_stats;
-- CREATE VIEW public.contact_leads_stats AS ...
-- (Ver implementação atual da view e ajustar conforme necessário)
```

### Frontend Changes

**Formulário de contato** (`components/landing/contact-form.tsx`):
- Adicionar campo `mensagem` (Textarea, opcional)
- Atualizar `formData` para incluir `mensagem`
- Enviar `mensagem` para `/api/contact`

**API** (`app/api/contact/route.ts`):
- Adicionar `mensagem` ao `ContactRequestSchema`
- Incluir `mensagem` no `insert` do Supabase

---

## Testing Checklist

### Frontend
- [ ] Leads do Chat e Formulário aparecem na mesma tabela
- [ ] Filtro por origem funciona (Todos/Chat/Formulário)
- [ ] Filtro por status funciona (todos os status)
- [ ] Busca por nome/telefone/cidade funciona
- [ ] Mobile view funciona (cards responsivos)
- [ ] Preview de mensagem aparece na tabela (primeiros 50 chars)
- [ ] Mensagens sem texto mostram "—" na tabela
- [ ] Notas são salvas automaticamente (onBlur)
- [ ] Status é atualizado corretamente via dropdown
- [ ] Modal de detalhes mostra informações corretas por origem

### Formulário de Contato
- [ ] Campo "Mensagem" aparece no formulário da landing page
- [ ] Campo "Mensagem" é opcional (não required)
- [ ] Mensagem é enviada corretamente para `/api/contact`
- [ ] Mensagem é salva na tabela `contact_leads`

### Conversão (Lead → Cliente)
- [ ] Conversão de lead do Chat → atualiza status para 'ativo'
- [ ] Conversão de lead do Form → cria novo cliente
- [ ] Conversão de lead do Form → linka `cliente_id` no lead
- [ ] Modal de confirmação mostra dados corretos
- [ ] Redirect para página do cliente após conversão

### Deduplicação
- [ ] Conversão com telefone duplicado (Chat) → usa cliente existente
- [ ] Conversão com telefone duplicado (Form) → usa cliente existente
- [ ] Lead do Form com telefone duplicado → linka ao cliente existente

### Retorno Futuro
- [ ] Status "Retorno Futuro" aparece no dropdown
- [ ] Ao marcar "Retorno Futuro", modal pede data
- [ ] Data de retorno é salva corretamente
- [ ] Leads com data de retorno podem ser filtrados

### Exclusão
- [ ] Exclusão de lead requer confirmação
- [ ] Lead do Chat excluído some da lista
- [ ] Lead do Form excluído some da lista
- [ ] Exclusão não afeta cliente vinculado (se convertido)

### Estatísticas
- [ ] Cards mostram números corretos
- [ ] Estatísticas agregam ambas as origens
- [ ] Botão "Atualizar" recarrega os dados

---

## Open Questions

1. **Paginação:** Implementar agora ou deixar para depois? (Recomendação: depois, somente se necessário)
2. **Export CSV:** Adicionar como ação extra? (Recomendação: fora do escopo inicial)
3. **Notificações:** Notificar admins quando novo lead chegar? (Já existe via webhook Evolution)
4. **contact_leads_stats view:** A view atual precisa ser recriada ou está funcional? (Verificar em implementação)

---

## Future Enhancements

- Exportar leads para CSV
- Integrar com WhatsApp/SMS para contato direto
- Dashboard de conversão (lead → cliente)
- Lembrete automático para leads com `data_retorno` definida

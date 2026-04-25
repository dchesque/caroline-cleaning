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

| Fonte | Tabela | Campos | Status |
|-------|--------|--------|--------|
| Chat IA | `clientes` | nome, telefone, zip_code, endereco_completo | `lead`, `lead_incomplete` |
| Formulário | `contact_leads` | nome, telefone, cidade, mensagem (novo) | `novo`, `contatado`, `convertido`, `descartado` |

### Nova Coluna

```sql
ALTER TABLE contact_leads ADD COLUMN mensagem TEXT;
```

### Status Possíveis (unificados)

| Status | Descrição |
|--------|-----------|
| `novo` | Lead recebido, sem contato |
| `contatado` | Houve tentativa de contato |
| `convertido` | Transformado em cliente |
| `descartado` | Lead não qualificado |
| `retorno_futuro` | Marcar para contato futuro |

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

### Lead do Chat IA → Cliente

```typescript
await supabase
  .from('clientes')
  .update({
    status: 'ativo',
    data_primeiro_servico: new Date().toISOString()
  })
  .eq('id', leadId)
```

### Lead do Formulário → Cliente

```typescript
// 1. Criar cliente
const { data: cliente } = await supabase
  .from('clientes')
  .insert({
    nome: lead.nome,
    telefone: lead.telefone,
    cidade: lead.cidade,
    origem: 'website',
    status: 'ativo'
  })
  .select()
  .single()

// 2. Linkar lead ao cliente
await supabase
  .from('contact_leads')
  .update({
    status: 'convertido',
    cliente_id: cliente.id
  })
  .eq('id', leadId)

// 3. Redirecionar para página do cliente
router.push(`/admin/clientes/${cliente.id}`)
```

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
| `useLeadSource` | Hook que busca e mescla leads |
| `useLeadStats` | Hook que calcula estatísticas |

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
-- Adicionar campo de mensagem ao formulário de contato
ALTER TABLE public.contact_leads
ADD COLUMN mensagem TEXT;

-- Atualizar a view de estatísticas se necessário
-- (a view contact_leads_stats precisa incluir o novo campo)
```

---

## Testing Checklist

- [ ] Leads do Chat e Formulário aparecem na mesma tabela
- [ ] Filtro por origem funciona
- [ ] Filtro por status funciona
- [ ] Busca por nome/telefone/cidade funciona
- [ ] Conversão de lead do Chat → atualiza status para 'ativo'
- [ ] Conversão de lead do Form → cria cliente + link
- [ ] Exclusão de lead com confirmação
- [ ] Notas são salvas automaticamente
- [ ] Status é atualizado corretamente
- [ ] Mobile view funciona
- [ ] Campo de mensagem aparece no formulário
- [ ] Preview de mensagem aparece na tabela
- [ ] Redirect para página do cliente após conversão

---

## Open Questions

1. **Paginação:** Implementar agora ou deixar para depois? (Recomendação: depois, somente se necessário)
2. **Export CSV:** Adicionar como ação extra? (Recomendação: fora do escopo inicial)
3. **Notificações:** Notificar admins quando novo lead chegar? (Já existe via webhook)

---

## Future Enhancements

- Adicionar campo "data_retorno" para status `retorno_futuro`
- Exportar leads para CSV
- Integrar com WhatsApp/SMS para contato direto
- Dashboard de conversão (lead → cliente)

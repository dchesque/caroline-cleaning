# FASE 2: DATABASE & SCHEMA
## Chesque Premium Cleaning - Plataforma de Atendimento e Gestão

**Versão:** 1.0  
**Data:** Dezembro 2024  
**Duração Estimada:** 2-3 dias  
**Prioridade:** 🔴 CRITICAL  
**Pré-requisito:** Fase 1 completa

---

## 📋 ÍNDICE

1. [Contexto e Pré-requisitos](#1-contexto-e-pré-requisitos)
2. [Objetivo da Fase 2](#2-objetivo-da-fase-2)
3. [Visão Geral do Schema](#3-visão-geral-do-schema)
4. [Extensões PostgreSQL](#4-extensões-postgresql)
5. [Tabelas - Definições Completas](#5-tabelas---definições-completas)
6. [Índices para Performance](#6-índices-para-performance)
7. [Funções PostgreSQL](#7-funções-postgresql)
8. [Triggers](#8-triggers)
9. [Views](#9-views)
10. [Row Level Security (RLS)](#10-row-level-security-rls)
11. [Storage Buckets](#11-storage-buckets)
12. [Seeds - Dados Iniciais](#12-seeds---dados-iniciais)
13. [Geração de TypeScript Types](#13-geração-de-typescript-types)
14. [Script de Migração Completo](#14-script-de-migração-completo)
15. [Checklist de Validação](#15-checklist-de-validação)

---

## 1. CONTEXTO E PRÉ-REQUISITOS

### 1.1 Resumo do Projeto

**Chesque Premium Cleaning** é uma plataforma de atendimento e gestão para serviços de limpeza residencial/comercial nos EUA (Miami/Florida).

**Componentes principais:**
- **Carol** - Secretária virtual IA (atendimento 24/7)
- **Landing Page** - Conversão de visitantes em leads
- **Painel Admin** - Gestão de agenda, clientes, contratos, finanças

### 1.2 Pré-requisitos da Fase 1

Antes de iniciar a Fase 2, confirme que a Fase 1 está completa:

- [x] Projeto Next.js 15 funcionando
- [x] Design System "Summer Nude" configurado
- [x] Componentes shadcn/ui instalados
- [x] Supabase client configurado (`lib/supabase/client.ts`)
- [x] Supabase server configurado (`lib/supabase/server.ts`)
- [x] Variáveis de ambiente configuradas (`.env.local`)

### 1.3 Credenciais Supabase Necessárias

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 1.4 Acesso ao SQL Editor

1. Acesse o Supabase Dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Execute os scripts desta fase

---

## 2. OBJETIVO DA FASE 2

### 2.1 Escopo

Criar toda a **estrutura do banco de dados** no Supabase:

✅ 12 tabelas principais com relacionamentos  
✅ Índices otimizados para queries frequentes  
✅ Funções PostgreSQL para lógica de negócio  
✅ Triggers para automações  
✅ Views para consultas complexas  
✅ Row Level Security (RLS) para segurança  
✅ Storage buckets para arquivos  
✅ Dados iniciais (seeds)  
✅ TypeScript types gerados  

### 2.2 NÃO está no escopo desta fase

❌ Implementação de páginas (Fase 3+)  
❌ Integração com n8n (Fase 6)  
❌ Lógica de autenticação de usuário admin  

### 2.3 Entregáveis

Ao final da Fase 2:
1. Todas as tabelas criadas e relacionadas
2. Dados de seed inseridos
3. Arquivo `types/supabase.ts` gerado
4. Queries de teste funcionando

---

## 3. VISÃO GERAL DO SCHEMA

### 3.1 Diagrama de Entidades (ER)

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    clientes     │       │   agendamentos  │       │   recorrencias  │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │◄──┐   │ id (PK)         │   ┌──►│ id (PK)         │
│ nome            │   │   │ cliente_id (FK) │───┘   │ cliente_id (FK) │
│ telefone        │   │   │ tipo            │       │ frequencia      │
│ email           │   └───│ data            │       │ dia_preferido   │
│ endereco        │       │ horario_inicio  │       │ horario         │
│ status          │       │ status          │       │ valor           │
│ ...             │       │ recorrencia_id  │───────│ ativo           │
└────────┬────────┘       │ valor           │       └─────────────────┘
         │                │ ...             │
         │                └────────┬────────┘
         │                         │
         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐
│    contratos    │       │    feedback     │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ cliente_id (FK) │       │ agendamento_id  │
│ documento_url   │       │ cliente_id (FK) │
│ valor_acordado  │       │ rating          │
│ status          │       │ comentario      │
│ ...             │       └─────────────────┘
└─────────────────┘
         │
         ▼
┌─────────────────┐       ┌─────────────────┐
│   financeiro    │       │ mensagens_chat  │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ cliente_id (FK) │       │ session_id      │
│ agendamento_id  │       │ cliente_id (FK) │
│ tipo            │       │ role            │
│ valor           │       │ content         │
│ ...             │       │ ...             │
└─────────────────┘       └─────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  configuracoes  │       │ areas_atendidas │       │ servicos_tipos  │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ chave           │       │ nome            │       │ codigo          │
│ valor (JSONB)   │       │ zip_codes       │       │ nome            │
│ ...             │       │ ativo           │       │ multiplicador   │
└─────────────────┘       └─────────────────┘       └─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│     addons      │       │  precos_base    │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ codigo          │       │ bedrooms        │
│ nome            │       │ bathrooms       │
│ preco           │       │ preco_minimo    │
│ ...             │       │ preco_maximo    │
└─────────────────┘       └─────────────────┘
```

### 3.2 Lista de Tabelas

| # | Tabela | Descrição | Prioridade |
|---|--------|-----------|------------|
| 1 | `clientes` | Leads e clientes ativos | Core |
| 2 | `recorrencias` | Configuração de limpezas recorrentes | Core |
| 3 | `agendamentos` | Serviços agendados | Core |
| 4 | `contratos` | Contratos assinados | Core |
| 5 | `financeiro` | Transações financeiras | Core |
| 6 | `mensagens_chat` | Histórico de conversas | Core |
| 7 | `feedback` | Avaliações pós-serviço | Support |
| 8 | `configuracoes` | Parâmetros do sistema | Config |
| 9 | `areas_atendidas` | Regiões de atendimento | Config |
| 10 | `servicos_tipos` | Tipos de serviço | Config |
| 11 | `addons` | Serviços adicionais | Config |
| 12 | `precos_base` | Tabela de preços | Config |

---

## 4. EXTENSÕES POSTGRESQL

Executar primeiro no SQL Editor:

```sql
-- ============================================
-- EXTENSÕES NECESSÁRIAS
-- ============================================

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cryptography functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Verificar extensões ativas
SELECT * FROM pg_extension;
```

---

## 5. TABELAS - DEFINIÇÕES COMPLETAS

### 5.1 Tabela: clientes

Armazena informações de leads e clientes ativos.

```sql
-- ============================================
-- TABELA: clientes
-- ============================================

CREATE TABLE public.clientes (
  -- ==================
  -- IDENTIFICAÇÃO
  -- ==================
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- ==================
  -- DADOS PESSOAIS
  -- ==================
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT,
  
  -- ==================
  -- ENDEREÇO
  -- ==================
  endereco_completo TEXT NOT NULL,
  endereco_linha2 TEXT,
  cidade TEXT,
  estado TEXT DEFAULT 'FL',
  zip_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- ==================
  -- DETALHES DA CASA
  -- ==================
  bedrooms INTEGER,
  bathrooms DECIMAL(3, 1), -- permite 2.5 baths
  square_feet INTEGER,
  tipo_residencia TEXT DEFAULT 'house' CHECK (tipo_residencia IN ('house', 'apartment', 'condo', 'townhouse', 'other')),
  
  -- ==================
  -- SERVIÇO PADRÃO
  -- ==================
  tipo_servico_padrao TEXT DEFAULT 'regular' CHECK (tipo_servico_padrao IN ('regular', 'deep', 'move_in_out', 'office', 'airbnb')),
  frequencia TEXT CHECK (frequencia IN ('weekly', 'biweekly', 'monthly', 'one_time')),
  valor_servico DECIMAL(10, 2),
  dia_preferido TEXT CHECK (dia_preferido IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  horario_preferido TIME,
  
  -- ==================
  -- ACESSO À RESIDÊNCIA
  -- ==================
  acesso_tipo TEXT CHECK (acesso_tipo IN ('client_home', 'garage_code', 'lockbox', 'key_hidden', 'doorman', 'other')),
  acesso_instrucoes TEXT,
  acesso_codigo TEXT,
  
  -- ==================
  -- PETS
  -- ==================
  tem_pets BOOLEAN DEFAULT FALSE,
  pets_detalhes TEXT,
  
  -- ==================
  -- CONTRATO (FK será adicionada depois)
  -- ==================
  contrato_id UUID,
  
  -- ==================
  -- TRACKING / ORIGEM
  -- ==================
  origem TEXT CHECK (origem IN ('google', 'facebook', 'instagram', 'referral', 'website', 'other')),
  origem_detalhe TEXT,
  referido_por UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  
  -- ==================
  -- DATAS IMPORTANTES
  -- ==================
  data_primeiro_contato DATE DEFAULT CURRENT_DATE,
  data_primeiro_servico DATE,
  data_aniversario DATE,
  
  -- ==================
  -- STATUS
  -- ==================
  status TEXT DEFAULT 'lead' CHECK (status IN ('lead', 'ativo', 'pausado', 'cancelado', 'inativo')),
  motivo_cancelamento TEXT,
  data_cancelamento DATE,
  
  -- ==================
  -- OBSERVAÇÕES
  -- ==================
  notas TEXT,
  notas_internas TEXT, -- notas que o cliente não vê
  
  -- ==================
  -- METADATA
  -- ==================
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE public.clientes IS 'Tabela principal de clientes e leads do sistema';
COMMENT ON COLUMN public.clientes.status IS 'lead=novo contato, ativo=cliente recorrente, pausado=temporariamente inativo, cancelado=encerrou contrato, inativo=sem serviço há 90+ dias';
COMMENT ON COLUMN public.clientes.bathrooms IS 'Permite valores decimais como 2.5 para half-bath';
COMMENT ON COLUMN public.clientes.notas_internas IS 'Notas visíveis apenas para a equipe, não para o cliente';
```

### 5.2 Tabela: recorrencias

Configuração de serviços recorrentes.

```sql
-- ============================================
-- TABELA: recorrencias
-- ============================================

CREATE TABLE public.recorrencias (
  -- ==================
  -- IDENTIFICAÇÃO
  -- ==================
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  
  -- ==================
  -- CONFIGURAÇÃO
  -- ==================
  frequencia TEXT NOT NULL CHECK (frequencia IN ('weekly', 'biweekly', 'monthly')),
  dia_preferido TEXT NOT NULL CHECK (dia_preferido IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  horario TIME NOT NULL,
  
  -- ==================
  -- SERVIÇO
  -- ==================
  tipo_servico TEXT NOT NULL DEFAULT 'regular' CHECK (tipo_servico IN ('regular', 'deep', 'move_in_out', 'office', 'airbnb')),
  duracao_minutos INTEGER DEFAULT 180,
  valor DECIMAL(10, 2) NOT NULL,
  
  -- ==================
  -- CONTROLE
  -- ==================
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE, -- NULL = sem data de término
  proximo_agendamento DATE,
  ultimo_agendamento DATE,
  total_agendamentos INTEGER DEFAULT 0,
  
  -- ==================
  -- STATUS
  -- ==================
  ativo BOOLEAN DEFAULT TRUE,
  motivo_pausa TEXT,
  data_pausa DATE,
  
  -- ==================
  -- METADATA
  -- ==================
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE public.recorrencias IS 'Configuração de serviços recorrentes para clientes';
COMMENT ON COLUMN public.recorrencias.frequencia IS 'weekly=semanal, biweekly=quinzenal, monthly=mensal';
COMMENT ON COLUMN public.recorrencias.proximo_agendamento IS 'Próxima data calculada para gerar agendamento';
```

### 5.3 Tabela: agendamentos

Todos os serviços agendados.

```sql
-- ============================================
-- TABELA: agendamentos
-- ============================================

CREATE TABLE public.agendamentos (
  -- ==================
  -- IDENTIFICAÇÃO
  -- ==================
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  
  -- ==================
  -- TIPO E TIMING
  -- ==================
  tipo TEXT NOT NULL CHECK (tipo IN ('visit', 'regular', 'deep', 'move_in_out', 'office', 'airbnb')),
  data DATE NOT NULL,
  horario_inicio TIME NOT NULL,
  horario_fim_estimado TIME,
  duracao_minutos INTEGER DEFAULT 180,
  
  -- ==================
  -- VALORES
  -- ==================
  valor DECIMAL(10, 2),
  valor_addons DECIMAL(10, 2) DEFAULT 0,
  desconto_percentual DECIMAL(5, 2) DEFAULT 0,
  valor_final DECIMAL(10, 2) GENERATED ALWAYS AS (
    ROUND((COALESCE(valor, 0) + COALESCE(valor_addons, 0)) * (1 - COALESCE(desconto_percentual, 0) / 100), 2)
  ) STORED,
  
  -- ==================
  -- ADD-ONS
  -- ==================
  addons JSONB DEFAULT '[]'::jsonb,
  -- Exemplo: [{"codigo": "inside_oven", "nome": "Inside Oven", "valor": 35}, {"codigo": "laundry", "nome": "Laundry", "valor": 30, "quantidade": 2}]
  
  -- ==================
  -- STATUS
  -- ==================
  status TEXT DEFAULT 'agendado' CHECK (status IN (
    'agendado',      -- criado, aguardando
    'confirmado',    -- cliente confirmou
    'em_andamento',  -- serviço iniciado
    'concluido',     -- finalizado com sucesso
    'cancelado',     -- cancelado pelo cliente ou empresa
    'no_show',       -- cliente não estava disponível
    'reagendado'     -- foi movido para outra data
  )),
  
  -- ==================
  -- RECORRÊNCIA
  -- ==================
  recorrencia_id UUID REFERENCES public.recorrencias(id) ON DELETE SET NULL,
  e_recorrente BOOLEAN DEFAULT FALSE,
  
  -- ==================
  -- CHECKLIST PÓS-SERVIÇO
  -- ==================
  checklist JSONB DEFAULT '{
    "sala": false,
    "quartos": false,
    "banheiros": false,
    "cozinha": false,
    "areas_comuns": false
  }'::jsonb,
  
  -- ==================
  -- EXECUÇÃO
  -- ==================
  hora_chegada TIME,
  hora_saida TIME,
  duracao_real_minutos INTEGER,
  
  -- ==================
  -- OBSERVAÇÕES
  -- ==================
  notas TEXT,
  notas_internas TEXT,
  
  -- ==================
  -- CANCELAMENTO/REAGENDAMENTO
  -- ==================
  motivo_cancelamento TEXT,
  reagendado_de UUID REFERENCES public.agendamentos(id) ON DELETE SET NULL,
  reagendado_para UUID,
  
  -- ==================
  -- NOTIFICAÇÕES
  -- ==================
  lembrete_24h_enviado BOOLEAN DEFAULT FALSE,
  lembrete_30min_enviado BOOLEAN DEFAULT FALSE,
  confirmacao_enviada BOOLEAN DEFAULT FALSE,
  
  -- ==================
  -- METADATA
  -- ==================
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE public.agendamentos IS 'Registro de todos os serviços agendados (passados e futuros)';
COMMENT ON COLUMN public.agendamentos.tipo IS 'visit=visita de orçamento, regular=limpeza padrão, deep=limpeza profunda, etc';
COMMENT ON COLUMN public.agendamentos.valor_final IS 'Calculado automaticamente: (valor + addons) * (1 - desconto%)';
COMMENT ON COLUMN public.agendamentos.addons IS 'Array JSON de serviços adicionais com código, nome, valor e quantidade';
```

### 5.4 Tabela: contratos

Contratos assinados com clientes.

```sql
-- ============================================
-- TABELA: contratos
-- ============================================

CREATE TABLE public.contratos (
  -- ==================
  -- IDENTIFICAÇÃO
  -- ==================
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  
  -- ==================
  -- DOCUMENTO
  -- ==================
  numero TEXT UNIQUE, -- Número do contrato (gerado automaticamente)
  documento_url TEXT, -- URL do PDF no Storage
  documento_path TEXT, -- Path no bucket
  
  -- ==================
  -- TERMOS
  -- ==================
  tipo_servico TEXT NOT NULL CHECK (tipo_servico IN ('regular', 'deep', 'move_in_out', 'office', 'airbnb')),
  frequencia TEXT CHECK (frequencia IN ('weekly', 'biweekly', 'monthly', 'one_time')),
  valor_acordado DECIMAL(10, 2) NOT NULL,
  desconto_percentual DECIMAL(5, 2) DEFAULT 0,
  
  -- ==================
  -- VIGÊNCIA
  -- ==================
  data_inicio DATE NOT NULL,
  data_fim DATE, -- NULL = indeterminado
  renovacao_automatica BOOLEAN DEFAULT TRUE,
  
  -- ==================
  -- STATUS
  -- ==================
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviado', 'assinado', 'cancelado', 'expirado')),
  
  -- ==================
  -- ASSINATURA
  -- ==================
  data_assinatura TIMESTAMPTZ,
  ip_assinatura TEXT,
  assinatura_digital TEXT, -- Hash ou referência da assinatura
  
  -- ==================
  -- METADATA
  -- ==================
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE public.contratos IS 'Contratos de serviço com clientes';
COMMENT ON COLUMN public.contratos.numero IS 'Número único do contrato, gerado automaticamente';
COMMENT ON COLUMN public.contratos.documento_url IS 'URL pública (signed) do PDF do contrato';

-- Atualizar FK na tabela clientes
ALTER TABLE public.clientes 
ADD CONSTRAINT fk_clientes_contrato 
FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE SET NULL;
```

### 5.5 Tabela: financeiro

Transações financeiras (receitas e custos).

```sql
-- ============================================
-- TABELA: financeiro
-- ============================================

CREATE TABLE public.financeiro (
  -- ==================
  -- IDENTIFICAÇÃO
  -- ==================
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- ==================
  -- RELACIONAMENTOS
  -- ==================
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  agendamento_id UUID REFERENCES public.agendamentos(id) ON DELETE SET NULL,
  contrato_id UUID REFERENCES public.contratos(id) ON DELETE SET NULL,
  
  -- ==================
  -- TRANSAÇÃO
  -- ==================
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'custo')),
  categoria TEXT NOT NULL,
  -- Receita: 'servico', 'addon', 'taxa_cancelamento', 'gorjeta', 'outro'
  -- Custo: 'produto_limpeza', 'transporte', 'equipamento', 'marketing', 'outro'
  subcategoria TEXT,
  descricao TEXT,
  
  -- ==================
  -- VALORES
  -- ==================
  valor DECIMAL(10, 2) NOT NULL,
  
  -- ==================
  -- PAGAMENTO
  -- ==================
  forma_pagamento TEXT CHECK (forma_pagamento IN ('cash', 'zelle', 'check', 'card', 'other')),
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  data_pagamento DATE,
  
  -- ==================
  -- STATUS
  -- ==================
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado', 'reembolsado')),
  
  -- ==================
  -- REFERÊNCIA
  -- ==================
  referencia_externa TEXT, -- ID de transação externa (Zelle, etc)
  
  -- ==================
  -- METADATA
  -- ==================
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE public.financeiro IS 'Registro de todas as transações financeiras';
COMMENT ON COLUMN public.financeiro.tipo IS 'receita=entrada, custo=saída';
COMMENT ON COLUMN public.financeiro.categoria IS 'Categoria principal da transação';
```

### 5.6 Tabela: mensagens_chat

Histórico de conversas com Carol.

```sql
-- ============================================
-- TABELA: mensagens_chat
-- ============================================

CREATE TABLE public.mensagens_chat (
  -- ==================
  -- IDENTIFICAÇÃO
  -- ==================
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL, -- ID da sessão do chat
  
  -- ==================
  -- RELACIONAMENTO
  -- ==================
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  
  -- ==================
  -- MENSAGEM
  -- ==================
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  
  -- ==================
  -- CONTEXTO
  -- ==================
  intent TEXT, -- Intent identificado (agendar, reagendar, informacao, etc)
  entities JSONB DEFAULT '{}'::jsonb, -- Entidades extraídas
  confidence DECIMAL(3, 2), -- Confiança do modelo (0.00 a 1.00)
  
  -- ==================
  -- TOOLS (para AI Agent)
  -- ==================
  tool_calls JSONB DEFAULT '[]'::jsonb, -- Tools chamadas pelo agente
  tool_results JSONB DEFAULT '[]'::jsonb, -- Resultados das tools
  
  -- ==================
  -- METADATA
  -- ==================
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE public.mensagens_chat IS 'Histórico de todas as mensagens do chat com Carol';
COMMENT ON COLUMN public.mensagens_chat.session_id IS 'Identificador único da sessão de chat';
COMMENT ON COLUMN public.mensagens_chat.role IS 'user=cliente, assistant=Carol, system=sistema';
COMMENT ON COLUMN public.mensagens_chat.tool_calls IS 'Tools chamadas pelo AI Agent durante processamento';
```

### 5.7 Tabela: feedback

Avaliações pós-serviço.

```sql
-- ============================================
-- TABELA: feedback
-- ============================================

CREATE TABLE public.feedback (
  -- ==================
  -- IDENTIFICAÇÃO
  -- ==================
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- ==================
  -- RELACIONAMENTOS
  -- ==================
  agendamento_id UUID NOT NULL REFERENCES public.agendamentos(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  
  -- ==================
  -- AVALIAÇÃO
  -- ==================
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comentario TEXT,
  
  -- ==================
  -- CATEGORIAS (opcional)
  -- ==================
  rating_pontualidade INTEGER CHECK (rating_pontualidade >= 1 AND rating_pontualidade <= 5),
  rating_qualidade INTEGER CHECK (rating_qualidade >= 1 AND rating_qualidade <= 5),
  rating_comunicacao INTEGER CHECK (rating_comunicacao >= 1 AND rating_comunicacao <= 5),
  
  -- ==================
  -- FOLLOW-UP
  -- ==================
  google_review_solicitado BOOLEAN DEFAULT FALSE,
  google_review_deixado BOOLEAN DEFAULT FALSE,
  acao_tomada TEXT, -- Ação tomada em caso de feedback negativo
  respondido_em TIMESTAMPTZ,
  
  -- ==================
  -- ORIGEM
  -- ==================
  origem TEXT DEFAULT 'sms' CHECK (origem IN ('sms', 'email', 'app', 'manual')),
  
  -- ==================
  -- METADATA
  -- ==================
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE public.feedback IS 'Avaliações dos clientes após cada serviço';
COMMENT ON COLUMN public.feedback.rating IS 'Nota geral de 1 a 5 estrelas';
```

### 5.8 Tabela: configuracoes

Parâmetros configuráveis do sistema.

```sql
-- ============================================
-- TABELA: configuracoes
-- ============================================

CREATE TABLE public.configuracoes (
  -- ==================
  -- IDENTIFICAÇÃO
  -- ==================
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- ==================
  -- CONFIGURAÇÃO
  -- ==================
  chave TEXT NOT NULL UNIQUE,
  valor JSONB NOT NULL,
  
  -- ==================
  -- DESCRIÇÃO
  -- ==================
  descricao TEXT,
  categoria TEXT DEFAULT 'geral' CHECK (categoria IN ('geral', 'horarios', 'precos', 'notificacoes', 'integracao')),
  
  -- ==================
  -- METADATA
  -- ==================
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE public.configuracoes IS 'Configurações globais do sistema em formato chave-valor';
COMMENT ON COLUMN public.configuracoes.valor IS 'Valor em formato JSON para flexibilidade';
```

### 5.9 Tabela: areas_atendidas

Regiões onde a empresa opera.

```sql
-- ============================================
-- TABELA: areas_atendidas
-- ============================================

CREATE TABLE public.areas_atendidas (
  -- ==================
  -- IDENTIFICAÇÃO
  -- ==================
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- ==================
  -- LOCALIZAÇÃO
  -- ==================
  nome TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'FL',
  zip_codes TEXT[] DEFAULT '{}', -- Array de CEPs atendidos
  
  -- ==================
  -- CONFIGURAÇÃO
  -- ==================
  ativo BOOLEAN DEFAULT TRUE,
  taxa_deslocamento DECIMAL(10, 2) DEFAULT 0,
  tempo_deslocamento_minutos INTEGER DEFAULT 0,
  
  -- ==================
  -- ORDENAÇÃO
  -- ==================
  ordem INTEGER DEFAULT 0,
  
  -- ==================
  -- METADATA
  -- ==================
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE public.areas_atendidas IS 'Áreas/regiões onde a empresa oferece serviços';
COMMENT ON COLUMN public.areas_atendidas.zip_codes IS 'Array de códigos postais (ZIP codes) atendidos';
```

### 5.10 Tabela: servicos_tipos

Tipos de serviço disponíveis.

```sql
-- ============================================
-- TABELA: servicos_tipos
-- ============================================

CREATE TABLE public.servicos_tipos (
  -- ==================
  -- IDENTIFICAÇÃO
  -- ==================
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- ==================
  -- DADOS
  -- ==================
  codigo TEXT NOT NULL UNIQUE, -- 'regular', 'deep', etc
  nome TEXT NOT NULL,
  descricao TEXT,
  
  -- ==================
  -- PREÇO
  -- ==================
  multiplicador_preco DECIMAL(4, 2) DEFAULT 1.0, -- 1.0 = preço base, 1.5 = 50% a mais
  duracao_base_minutos INTEGER DEFAULT 180,
  
  -- ==================
  -- VISUAL
  -- ==================
  cor TEXT, -- Cor hex para exibição
  icone TEXT, -- Nome do ícone (lucide)
  
  -- ==================
  -- CONFIGURAÇÃO
  -- ==================
  ativo BOOLEAN DEFAULT TRUE,
  disponivel_agendamento_online BOOLEAN DEFAULT TRUE,
  ordem INTEGER DEFAULT 0,
  
  -- ==================
  -- METADATA
  -- ==================
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE public.servicos_tipos IS 'Catálogo de tipos de serviço oferecidos';
COMMENT ON COLUMN public.servicos_tipos.multiplicador_preco IS 'Fator multiplicador sobre o preço base (1.0 = 100%, 1.5 = 150%)';
```

### 5.11 Tabela: addons

Serviços adicionais disponíveis.

```sql
-- ============================================
-- TABELA: addons
-- ============================================

CREATE TABLE public.addons (
  -- ==================
  -- IDENTIFICAÇÃO
  -- ==================
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- ==================
  -- DADOS
  -- ==================
  codigo TEXT NOT NULL UNIQUE, -- 'inside_oven', 'laundry', etc
  nome TEXT NOT NULL,
  descricao TEXT,
  
  -- ==================
  -- PREÇO
  -- ==================
  preco DECIMAL(10, 2) NOT NULL,
  tipo_cobranca TEXT DEFAULT 'fixo' CHECK (tipo_cobranca IN ('fixo', 'por_unidade', 'por_hora')),
  unidade TEXT, -- 'load', 'window', 'hour', etc
  
  -- ==================
  -- TEMPO
  -- ==================
  minutos_adicionais INTEGER DEFAULT 0,
  
  -- ==================
  -- CONFIGURAÇÃO
  -- ==================
  ativo BOOLEAN DEFAULT TRUE,
  ordem INTEGER DEFAULT 0,
  
  -- ==================
  -- METADATA
  -- ==================
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE public.addons IS 'Serviços adicionais que podem ser incluídos em um agendamento';
COMMENT ON COLUMN public.addons.tipo_cobranca IS 'fixo=preço único, por_unidade=preço x quantidade, por_hora=preço x horas';
```

### 5.12 Tabela: precos_base

Tabela de preços por tamanho de residência.

```sql
-- ============================================
-- TABELA: precos_base
-- ============================================

CREATE TABLE public.precos_base (
  -- ==================
  -- IDENTIFICAÇÃO
  -- ==================
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- ==================
  -- TAMANHO
  -- ==================
  bedrooms INTEGER NOT NULL,
  bathrooms DECIMAL(3, 1) NOT NULL, -- permite 2.5
  
  -- ==================
  -- PREÇO
  -- ==================
  preco_minimo DECIMAL(10, 2) NOT NULL,
  preco_maximo DECIMAL(10, 2) NOT NULL,
  
  -- ==================
  -- TEMPO ESTIMADO
  -- ==================
  duracao_minutos INTEGER DEFAULT 180,
  
  -- ==================
  -- METADATA
  -- ==================
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- ==================
  -- CONSTRAINTS
  -- ==================
  UNIQUE(bedrooms, bathrooms)
);

-- Comentários
COMMENT ON TABLE public.precos_base IS 'Tabela de preços base por número de quartos e banheiros';
COMMENT ON COLUMN public.precos_base.preco_minimo IS 'Preço mínimo para este tamanho de residência';
COMMENT ON COLUMN public.precos_base.preco_maximo IS 'Preço máximo para este tamanho de residência';
```

---

## 6. ÍNDICES PARA PERFORMANCE

```sql
-- ============================================
-- ÍNDICES
-- ============================================

-- === CLIENTES ===
CREATE INDEX idx_clientes_status ON public.clientes(status);
CREATE INDEX idx_clientes_telefone ON public.clientes(telefone);
CREATE INDEX idx_clientes_email ON public.clientes(email);
CREATE INDEX idx_clientes_zip_code ON public.clientes(zip_code);
CREATE INDEX idx_clientes_created_at ON public.clientes(created_at DESC);
CREATE INDEX idx_clientes_data_primeiro_contato ON public.clientes(data_primeiro_contato DESC);

-- === AGENDAMENTOS ===
CREATE INDEX idx_agendamentos_cliente_id ON public.agendamentos(cliente_id);
CREATE INDEX idx_agendamentos_data ON public.agendamentos(data);
CREATE INDEX idx_agendamentos_status ON public.agendamentos(status);
CREATE INDEX idx_agendamentos_tipo ON public.agendamentos(tipo);
CREATE INDEX idx_agendamentos_recorrencia_id ON public.agendamentos(recorrencia_id);
CREATE INDEX idx_agendamentos_data_status ON public.agendamentos(data, status);

-- Índice composto para buscar agenda do dia
CREATE INDEX idx_agendamentos_agenda_dia ON public.agendamentos(data, horario_inicio) 
WHERE status NOT IN ('cancelado', 'reagendado');

-- === RECORRÊNCIAS ===
CREATE INDEX idx_recorrencias_cliente_id ON public.recorrencias(cliente_id);
CREATE INDEX idx_recorrencias_ativo ON public.recorrencias(ativo);
CREATE INDEX idx_recorrencias_proximo ON public.recorrencias(proximo_agendamento) 
WHERE ativo = TRUE;

-- === FINANCEIRO ===
CREATE INDEX idx_financeiro_cliente_id ON public.financeiro(cliente_id);
CREATE INDEX idx_financeiro_agendamento_id ON public.financeiro(agendamento_id);
CREATE INDEX idx_financeiro_data ON public.financeiro(data DESC);
CREATE INDEX idx_financeiro_tipo ON public.financeiro(tipo);
CREATE INDEX idx_financeiro_status ON public.financeiro(status);
CREATE INDEX idx_financeiro_mes ON public.financeiro(DATE_TRUNC('month', data));

-- === MENSAGENS CHAT ===
CREATE INDEX idx_mensagens_session_id ON public.mensagens_chat(session_id);
CREATE INDEX idx_mensagens_cliente_id ON public.mensagens_chat(cliente_id);
CREATE INDEX idx_mensagens_created_at ON public.mensagens_chat(created_at DESC);

-- === FEEDBACK ===
CREATE INDEX idx_feedback_agendamento_id ON public.feedback(agendamento_id);
CREATE INDEX idx_feedback_cliente_id ON public.feedback(cliente_id);
CREATE INDEX idx_feedback_rating ON public.feedback(rating);

-- === CONTRATOS ===
CREATE INDEX idx_contratos_cliente_id ON public.contratos(cliente_id);
CREATE INDEX idx_contratos_status ON public.contratos(status);
CREATE INDEX idx_contratos_numero ON public.contratos(numero);

-- === CONFIGURAÇÕES ===
CREATE INDEX idx_configuracoes_chave ON public.configuracoes(chave);
CREATE INDEX idx_configuracoes_categoria ON public.configuracoes(categoria);

-- === ÁREAS ===
CREATE INDEX idx_areas_ativo ON public.areas_atendidas(ativo);
CREATE INDEX idx_areas_zip_codes ON public.areas_atendidas USING GIN(zip_codes);

-- === SERVIÇOS ===
CREATE INDEX idx_servicos_codigo ON public.servicos_tipos(codigo);
CREATE INDEX idx_servicos_ativo ON public.servicos_tipos(ativo);

-- === ADDONS ===
CREATE INDEX idx_addons_codigo ON public.addons(codigo);
CREATE INDEX idx_addons_ativo ON public.addons(ativo);
```

---

## 7. FUNÇÕES POSTGRESQL

### 7.1 Função: handle_updated_at

Atualiza automaticamente o campo `updated_at`.

```sql
-- ============================================
-- FUNÇÃO: handle_updated_at
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.handle_updated_at() IS 'Atualiza o campo updated_at automaticamente';
```

### 7.2 Função: get_available_slots

Retorna slots disponíveis para agendamento.

```sql
-- ============================================
-- FUNÇÃO: get_available_slots
-- ============================================

CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_data DATE,
  p_duracao_minutos INTEGER DEFAULT 180
)
RETURNS TABLE (
  slot_inicio TIME,
  slot_fim TIME,
  disponivel BOOLEAN
) AS $$
DECLARE
  v_horario_inicio TIME;
  v_horario_fim TIME;
  v_buffer_minutos INTEGER;
  v_slot_atual TIME;
BEGIN
  -- Buscar configurações
  SELECT 
    (valor::TEXT)::TIME,
    (SELECT valor::TEXT FROM public.configuracoes WHERE chave = 'horario_fim')::TIME,
    (SELECT (valor::TEXT)::INTEGER FROM public.configuracoes WHERE chave = 'buffer_deslocamento')
  INTO v_horario_inicio, v_horario_fim, v_buffer_minutos
  FROM public.configuracoes 
  WHERE chave = 'horario_inicio';
  
  -- Valores padrão se não configurado
  v_horario_inicio := COALESCE(v_horario_inicio, '08:00'::TIME);
  v_horario_fim := COALESCE(v_horario_fim, '18:00'::TIME);
  v_buffer_minutos := COALESCE(v_buffer_minutos, 60);
  
  -- Gerar slots de hora em hora
  v_slot_atual := v_horario_inicio;
  
  WHILE v_slot_atual + (p_duracao_minutos || ' minutes')::INTERVAL <= v_horario_fim LOOP
    RETURN QUERY
    SELECT 
      v_slot_atual,
      (v_slot_atual + (p_duracao_minutos || ' minutes')::INTERVAL)::TIME,
      NOT EXISTS (
        SELECT 1 
        FROM public.agendamentos a
        WHERE a.data = p_data
          AND a.status NOT IN ('cancelado', 'reagendado')
          AND (
            -- Verifica sobreposição
            (v_slot_atual >= a.horario_inicio AND v_slot_atual < a.horario_fim_estimado)
            OR
            ((v_slot_atual + (p_duracao_minutos || ' minutes')::INTERVAL)::TIME > a.horario_inicio 
             AND (v_slot_atual + (p_duracao_minutos || ' minutes')::INTERVAL)::TIME <= a.horario_fim_estimado)
            OR
            (v_slot_atual <= a.horario_inicio 
             AND (v_slot_atual + (p_duracao_minutos || ' minutes')::INTERVAL)::TIME >= a.horario_fim_estimado)
          )
      );
    
    v_slot_atual := v_slot_atual + '1 hour'::INTERVAL;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.get_available_slots(DATE, INTEGER) IS 'Retorna slots disponíveis para uma data específica';
```

### 7.3 Função: calculate_next_recurrence

Calcula a próxima data de recorrência.

```sql
-- ============================================
-- FUNÇÃO: calculate_next_recurrence
-- ============================================

CREATE OR REPLACE FUNCTION public.calculate_next_recurrence(
  p_ultima_data DATE,
  p_frequencia TEXT,
  p_dia_preferido TEXT
)
RETURNS DATE AS $$
DECLARE
  v_proxima_data DATE;
  v_dia_semana INTEGER;
  v_dias_map JSONB := '{
    "sunday": 0, "monday": 1, "tuesday": 2, "wednesday": 3,
    "thursday": 4, "friday": 5, "saturday": 6
  }'::JSONB;
BEGIN
  -- Calcular próxima data base
  CASE p_frequencia
    WHEN 'weekly' THEN
      v_proxima_data := p_ultima_data + INTERVAL '7 days';
    WHEN 'biweekly' THEN
      v_proxima_data := p_ultima_data + INTERVAL '14 days';
    WHEN 'monthly' THEN
      v_proxima_data := p_ultima_data + INTERVAL '1 month';
    ELSE
      RETURN NULL;
  END CASE;
  
  -- Ajustar para o dia da semana preferido
  v_dia_semana := (v_dias_map ->> p_dia_preferido)::INTEGER;
  
  -- Encontrar o próximo dia preferido
  WHILE EXTRACT(DOW FROM v_proxima_data) != v_dia_semana LOOP
    v_proxima_data := v_proxima_data + INTERVAL '1 day';
  END LOOP;
  
  RETURN v_proxima_data;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.calculate_next_recurrence(DATE, TEXT, TEXT) IS 'Calcula a próxima data de agendamento recorrente';
```

### 7.4 Função: update_cliente_status

Atualiza status do cliente baseado na atividade.

```sql
-- ============================================
-- FUNÇÃO: update_cliente_status
-- ============================================

CREATE OR REPLACE FUNCTION public.update_cliente_status()
RETURNS TRIGGER AS $$
DECLARE
  v_ultimo_servico DATE;
  v_tem_recorrencia_ativa BOOLEAN;
  v_tem_agendamento_futuro BOOLEAN;
BEGIN
  -- Buscar último serviço concluído
  SELECT MAX(data) INTO v_ultimo_servico
  FROM public.agendamentos
  WHERE cliente_id = NEW.cliente_id
    AND status = 'concluido';
  
  -- Verificar se tem recorrência ativa
  SELECT EXISTS(
    SELECT 1 FROM public.recorrencias
    WHERE cliente_id = NEW.cliente_id AND ativo = TRUE
  ) INTO v_tem_recorrencia_ativa;
  
  -- Verificar se tem agendamento futuro
  SELECT EXISTS(
    SELECT 1 FROM public.agendamentos
    WHERE cliente_id = NEW.cliente_id
      AND data >= CURRENT_DATE
      AND status NOT IN ('cancelado', 'reagendado')
  ) INTO v_tem_agendamento_futuro;
  
  -- Atualizar status do cliente
  UPDATE public.clientes
  SET status = CASE
    -- Se teve primeiro serviço e tem recorrência/agendamento futuro
    WHEN v_ultimo_servico IS NOT NULL AND (v_tem_recorrencia_ativa OR v_tem_agendamento_futuro) THEN 'ativo'
    -- Se teve serviço mas não tem nada futuro e já passou 90 dias
    WHEN v_ultimo_servico IS NOT NULL AND v_ultimo_servico < CURRENT_DATE - INTERVAL '90 days' THEN 'inativo'
    -- Se teve serviço mas não tem nada futuro (menos de 90 dias)
    WHEN v_ultimo_servico IS NOT NULL AND NOT v_tem_recorrencia_ativa AND NOT v_tem_agendamento_futuro THEN 'ativo'
    -- Mantém o status atual
    ELSE status
  END,
  data_primeiro_servico = COALESCE(data_primeiro_servico, v_ultimo_servico)
  WHERE id = NEW.cliente_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.update_cliente_status() IS 'Atualiza automaticamente o status do cliente baseado em atividade';
```

### 7.5 Função: generate_contract_number

Gera número único de contrato.

```sql
-- ============================================
-- FUNÇÃO: generate_contract_number
-- ============================================

CREATE OR REPLACE FUNCTION public.generate_contract_number()
RETURNS TRIGGER AS $$
DECLARE
  v_ano TEXT;
  v_sequencia INTEGER;
  v_numero TEXT;
BEGIN
  v_ano := TO_CHAR(NOW(), 'YYYY');
  
  -- Buscar próxima sequência do ano
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(numero, '-', 2) AS INTEGER)
  ), 0) + 1
  INTO v_sequencia
  FROM public.contratos
  WHERE numero LIKE 'CPC-' || v_ano || '-%';
  
  -- Formatar número: CPC-YYYY-XXXX
  v_numero := 'CPC-' || v_ano || '-' || LPAD(v_sequencia::TEXT, 4, '0');
  
  NEW.numero := v_numero;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.generate_contract_number() IS 'Gera número de contrato no formato CPC-YYYY-XXXX';
```

### 7.6 Função: check_zip_code_coverage

Verifica se um CEP está na área de cobertura.

```sql
-- ============================================
-- FUNÇÃO: check_zip_code_coverage
-- ============================================

CREATE OR REPLACE FUNCTION public.check_zip_code_coverage(p_zip_code TEXT)
RETURNS TABLE (
  atendido BOOLEAN,
  area_id UUID,
  area_nome TEXT,
  taxa_deslocamento DECIMAL(10, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TRUE,
    a.id,
    a.nome,
    a.taxa_deslocamento
  FROM public.areas_atendidas a
  WHERE a.ativo = TRUE
    AND p_zip_code = ANY(a.zip_codes)
  LIMIT 1;
  
  -- Se não encontrou, retorna não atendido
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::DECIMAL(10,2);
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.check_zip_code_coverage(TEXT) IS 'Verifica se um ZIP code está na área de cobertura';
```

### 7.7 Função: calculate_service_price

Calcula preço do serviço baseado no tamanho e tipo.

```sql
-- ============================================
-- FUNÇÃO: calculate_service_price
-- ============================================

CREATE OR REPLACE FUNCTION public.calculate_service_price(
  p_bedrooms INTEGER,
  p_bathrooms DECIMAL(3,1),
  p_tipo_servico TEXT DEFAULT 'regular',
  p_frequencia TEXT DEFAULT NULL
)
RETURNS TABLE (
  preco_minimo DECIMAL(10, 2),
  preco_maximo DECIMAL(10, 2),
  preco_sugerido DECIMAL(10, 2),
  duracao_estimada INTEGER
) AS $$
DECLARE
  v_preco_base_min DECIMAL(10, 2);
  v_preco_base_max DECIMAL(10, 2);
  v_duracao INTEGER;
  v_multiplicador DECIMAL(4, 2);
  v_desconto DECIMAL(5, 2);
BEGIN
  -- Buscar preço base
  SELECT pb.preco_minimo, pb.preco_maximo, pb.duracao_minutos
  INTO v_preco_base_min, v_preco_base_max, v_duracao
  FROM public.precos_base pb
  WHERE pb.bedrooms = p_bedrooms
    AND pb.bathrooms = p_bathrooms;
  
  -- Se não encontrou, usar estimativa
  IF v_preco_base_min IS NULL THEN
    v_preco_base_min := 120 + (p_bedrooms * 30) + (p_bathrooms * 20);
    v_preco_base_max := v_preco_base_min + 40;
    v_duracao := 120 + (p_bedrooms * 30) + (p_bathrooms::INTEGER * 15);
  END IF;
  
  -- Buscar multiplicador do tipo de serviço
  SELECT COALESCE(st.multiplicador_preco, 1.0), COALESCE(st.duracao_base_minutos, v_duracao)
  INTO v_multiplicador, v_duracao
  FROM public.servicos_tipos st
  WHERE st.codigo = p_tipo_servico;
  
  v_multiplicador := COALESCE(v_multiplicador, 1.0);
  
  -- Buscar desconto por frequência
  v_desconto := CASE p_frequencia
    WHEN 'weekly' THEN (SELECT (valor::TEXT)::DECIMAL FROM public.configuracoes WHERE chave = 'desconto_weekly')
    WHEN 'biweekly' THEN (SELECT (valor::TEXT)::DECIMAL FROM public.configuracoes WHERE chave = 'desconto_biweekly')
    WHEN 'monthly' THEN (SELECT (valor::TEXT)::DECIMAL FROM public.configuracoes WHERE chave = 'desconto_monthly')
    ELSE 0
  END;
  v_desconto := COALESCE(v_desconto, 0);
  
  -- Calcular preços finais
  RETURN QUERY SELECT
    ROUND(v_preco_base_min * v_multiplicador * (1 - v_desconto / 100), 2),
    ROUND(v_preco_base_max * v_multiplicador * (1 - v_desconto / 100), 2),
    ROUND(((v_preco_base_min + v_preco_base_max) / 2) * v_multiplicador * (1 - v_desconto / 100), 2),
    ROUND(v_duracao * v_multiplicador)::INTEGER;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.calculate_service_price(INTEGER, DECIMAL, TEXT, TEXT) IS 'Calcula preço estimado do serviço';
```

---

## 8. TRIGGERS

```sql
-- ============================================
-- TRIGGERS
-- ============================================

-- === UPDATED_AT para todas as tabelas ===

CREATE TRIGGER set_updated_at_clientes
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_agendamentos
  BEFORE UPDATE ON public.agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_recorrencias
  BEFORE UPDATE ON public.recorrencias
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_contratos
  BEFORE UPDATE ON public.contratos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_financeiro
  BEFORE UPDATE ON public.financeiro
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_configuracoes
  BEFORE UPDATE ON public.configuracoes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_areas
  BEFORE UPDATE ON public.areas_atendidas
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_servicos
  BEFORE UPDATE ON public.servicos_tipos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_addons
  BEFORE UPDATE ON public.addons
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_precos
  BEFORE UPDATE ON public.precos_base
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- === NÚMERO DO CONTRATO ===

CREATE TRIGGER generate_contract_number_trigger
  BEFORE INSERT ON public.contratos
  FOR EACH ROW
  WHEN (NEW.numero IS NULL)
  EXECUTE FUNCTION public.generate_contract_number();

-- === ATUALIZAR STATUS DO CLIENTE ===

CREATE TRIGGER update_cliente_status_trigger
  AFTER INSERT OR UPDATE OF status ON public.agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_cliente_status();
```

---

## 9. VIEWS

### 9.1 View: Agenda do Dia

```sql
-- ============================================
-- VIEW: v_agenda_hoje
-- ============================================

CREATE OR REPLACE VIEW public.v_agenda_hoje AS
SELECT 
  a.id,
  a.data,
  a.horario_inicio,
  a.horario_fim_estimado,
  a.tipo,
  a.status,
  a.valor_final,
  a.notas,
  a.e_recorrente,
  c.id AS cliente_id,
  c.nome AS cliente_nome,
  c.telefone AS cliente_telefone,
  c.endereco_completo AS cliente_endereco,
  c.cidade AS cliente_cidade,
  c.bedrooms,
  c.bathrooms,
  c.acesso_tipo,
  c.acesso_instrucoes,
  c.acesso_codigo,
  c.tem_pets,
  c.pets_detalhes,
  st.nome AS tipo_servico_nome,
  st.cor AS tipo_servico_cor
FROM public.agendamentos a
JOIN public.clientes c ON a.cliente_id = c.id
LEFT JOIN public.servicos_tipos st ON a.tipo = st.codigo
WHERE a.data = CURRENT_DATE
  AND a.status NOT IN ('cancelado', 'reagendado')
ORDER BY a.horario_inicio;

COMMENT ON VIEW public.v_agenda_hoje IS 'Agendamentos do dia atual com dados do cliente';
```

### 9.2 View: Clientes Inativos

```sql
-- ============================================
-- VIEW: v_clientes_inativos
-- ============================================

CREATE OR REPLACE VIEW public.v_clientes_inativos AS
SELECT 
  c.*,
  (
    SELECT MAX(a.data) 
    FROM public.agendamentos a 
    WHERE a.cliente_id = c.id 
      AND a.status = 'concluido'
  ) AS ultimo_servico,
  CURRENT_DATE - (
    SELECT MAX(a.data) 
    FROM public.agendamentos a 
    WHERE a.cliente_id = c.id 
      AND a.status = 'concluido'
  ) AS dias_inativo
FROM public.clientes c
WHERE c.status = 'ativo'
  AND NOT EXISTS (
    SELECT 1 
    FROM public.agendamentos a 
    WHERE a.cliente_id = c.id 
      AND a.data >= CURRENT_DATE
      AND a.status NOT IN ('cancelado', 'reagendado')
  )
  AND (
    SELECT MAX(a.data) 
    FROM public.agendamentos a 
    WHERE a.cliente_id = c.id 
      AND a.status = 'concluido'
  ) < CURRENT_DATE - INTERVAL '30 days';

COMMENT ON VIEW public.v_clientes_inativos IS 'Clientes ativos sem serviço nos últimos 30 dias';
```

### 9.3 View: Resumo Mensal Financeiro

```sql
-- ============================================
-- VIEW: v_resumo_mensal
-- ============================================

CREATE OR REPLACE VIEW public.v_resumo_mensal AS
SELECT 
  DATE_TRUNC('month', data) AS mes,
  COUNT(*) FILTER (WHERE tipo = 'receita') AS total_receitas,
  COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita'), 0) AS valor_receitas,
  COUNT(*) FILTER (WHERE tipo = 'custo') AS total_custos,
  COALESCE(SUM(valor) FILTER (WHERE tipo = 'custo'), 0) AS valor_custos,
  COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita'), 0) - COALESCE(SUM(valor) FILTER (WHERE tipo = 'custo'), 0) AS lucro
FROM public.financeiro
WHERE status != 'cancelado'
GROUP BY DATE_TRUNC('month', data)
ORDER BY mes DESC;

COMMENT ON VIEW public.v_resumo_mensal IS 'Resumo financeiro mensal (receitas, custos, lucro)';
```

### 9.4 View: Dashboard Stats

```sql
-- ============================================
-- VIEW: v_dashboard_stats
-- ============================================

CREATE OR REPLACE VIEW public.v_dashboard_stats AS
SELECT
  -- Agendamentos hoje
  (SELECT COUNT(*) FROM public.agendamentos WHERE data = CURRENT_DATE AND status NOT IN ('cancelado', 'reagendado')) AS agendamentos_hoje,
  
  -- Agendamentos confirmados hoje
  (SELECT COUNT(*) FROM public.agendamentos WHERE data = CURRENT_DATE AND status = 'confirmado') AS confirmados_hoje,
  
  -- Novos leads esta semana
  (SELECT COUNT(*) FROM public.clientes WHERE status = 'lead' AND created_at >= DATE_TRUNC('week', CURRENT_DATE)) AS novos_leads_semana,
  
  -- Total clientes ativos
  (SELECT COUNT(*) FROM public.clientes WHERE status = 'ativo') AS clientes_ativos,
  
  -- Receita do mês
  (SELECT COALESCE(SUM(valor), 0) FROM public.financeiro WHERE tipo = 'receita' AND status = 'pago' AND DATE_TRUNC('month', data) = DATE_TRUNC('month', CURRENT_DATE)) AS receita_mes,
  
  -- Receita do mês anterior
  (SELECT COALESCE(SUM(valor), 0) FROM public.financeiro WHERE tipo = 'receita' AND status = 'pago' AND DATE_TRUNC('month', data) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')) AS receita_mes_anterior,
  
  -- Média de rating
  (SELECT ROUND(AVG(rating), 1) FROM public.feedback WHERE created_at >= CURRENT_DATE - INTERVAL '90 days') AS rating_medio;

COMMENT ON VIEW public.v_dashboard_stats IS 'Estatísticas para o dashboard';
```

### 9.5 View: Próximos Agendamentos

```sql
-- ============================================
-- VIEW: v_proximos_agendamentos
-- ============================================

CREATE OR REPLACE VIEW public.v_proximos_agendamentos AS
SELECT 
  a.id,
  a.data,
  a.horario_inicio,
  a.horario_fim_estimado,
  a.tipo,
  a.status,
  a.valor_final,
  a.e_recorrente,
  c.id AS cliente_id,
  c.nome AS cliente_nome,
  c.telefone AS cliente_telefone,
  c.endereco_completo AS cliente_endereco,
  st.nome AS tipo_servico_nome,
  st.cor AS tipo_servico_cor,
  a.data - CURRENT_DATE AS dias_ate_servico
FROM public.agendamentos a
JOIN public.clientes c ON a.cliente_id = c.id
LEFT JOIN public.servicos_tipos st ON a.tipo = st.codigo
WHERE a.data >= CURRENT_DATE
  AND a.status NOT IN ('cancelado', 'reagendado', 'concluido')
ORDER BY a.data, a.horario_inicio
LIMIT 50;

COMMENT ON VIEW public.v_proximos_agendamentos IS 'Próximos 50 agendamentos futuros';
```

---

## 10. ROW LEVEL SECURITY (RLS)

```sql
-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recorrencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas_atendidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos_tipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.precos_base ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS PARA USUÁRIOS AUTENTICADOS
-- ============================================

-- === CLIENTES ===
CREATE POLICY "Authenticated users can view all clientes"
  ON public.clientes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert clientes"
  ON public.clientes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update clientes"
  ON public.clientes FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete clientes"
  ON public.clientes FOR DELETE
  TO authenticated
  USING (true);

-- === AGENDAMENTOS ===
CREATE POLICY "Authenticated users can view all agendamentos"
  ON public.agendamentos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert agendamentos"
  ON public.agendamentos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update agendamentos"
  ON public.agendamentos FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete agendamentos"
  ON public.agendamentos FOR DELETE
  TO authenticated
  USING (true);

-- === RECORRÊNCIAS ===
CREATE POLICY "Authenticated users can view all recorrencias"
  ON public.recorrencias FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert recorrencias"
  ON public.recorrencias FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update recorrencias"
  ON public.recorrencias FOR UPDATE
  TO authenticated
  USING (true);

-- === CONTRATOS ===
CREATE POLICY "Authenticated users can view all contratos"
  ON public.contratos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert contratos"
  ON public.contratos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update contratos"
  ON public.contratos FOR UPDATE
  TO authenticated
  USING (true);

-- === FINANCEIRO ===
CREATE POLICY "Authenticated users can view all financeiro"
  ON public.financeiro FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert financeiro"
  ON public.financeiro FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update financeiro"
  ON public.financeiro FOR UPDATE
  TO authenticated
  USING (true);

-- === MENSAGENS CHAT ===
-- Chat pode ser inserido por anon (visitantes do site)
CREATE POLICY "Anyone can insert mensagens_chat"
  ON public.mensagens_chat FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view all mensagens_chat"
  ON public.mensagens_chat FOR SELECT
  TO authenticated
  USING (true);

-- Anon só pode ver mensagens da própria sessão
CREATE POLICY "Anon can view own session mensagens"
  ON public.mensagens_chat FOR SELECT
  TO anon
  USING (session_id = current_setting('request.headers')::json->>'x-session-id');

-- === FEEDBACK ===
CREATE POLICY "Authenticated users can view all feedback"
  ON public.feedback FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert feedback"
  ON public.feedback FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- === CONFIGURAÇÕES ===
CREATE POLICY "Authenticated users can view configuracoes"
  ON public.configuracoes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update configuracoes"
  ON public.configuracoes FOR UPDATE
  TO authenticated
  USING (true);

-- Anon pode ver algumas configurações públicas
CREATE POLICY "Anon can view public configuracoes"
  ON public.configuracoes FOR SELECT
  TO anon
  USING (categoria IN ('horarios', 'geral'));

-- === ÁREAS ATENDIDAS ===
CREATE POLICY "Anyone can view areas_atendidas"
  ON public.areas_atendidas FOR SELECT
  TO anon, authenticated
  USING (ativo = true);

CREATE POLICY "Authenticated users can manage areas"
  ON public.areas_atendidas FOR ALL
  TO authenticated
  USING (true);

-- === SERVIÇOS ===
CREATE POLICY "Anyone can view servicos_tipos"
  ON public.servicos_tipos FOR SELECT
  TO anon, authenticated
  USING (ativo = true);

CREATE POLICY "Authenticated users can manage servicos"
  ON public.servicos_tipos FOR ALL
  TO authenticated
  USING (true);

-- === ADDONS ===
CREATE POLICY "Anyone can view addons"
  ON public.addons FOR SELECT
  TO anon, authenticated
  USING (ativo = true);

CREATE POLICY "Authenticated users can manage addons"
  ON public.addons FOR ALL
  TO authenticated
  USING (true);

-- === PREÇOS BASE ===
CREATE POLICY "Anyone can view precos_base"
  ON public.precos_base FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage precos"
  ON public.precos_base FOR ALL
  TO authenticated
  USING (true);
```

---

## 11. STORAGE BUCKETS

Execute no SQL Editor:

```sql
-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Bucket para contratos (PDFs) - Privado
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contratos',
  'contratos',
  false,
  5242880, -- 5MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket para fotos de serviço - Privado
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fotos-servico',
  'fotos-servico',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket para assets públicos (logo, imagens do site)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-assets',
  'public-assets',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- POLÍTICAS DE STORAGE
-- ============================================

-- === CONTRATOS ===
CREATE POLICY "Authenticated users can upload contracts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'contratos');

CREATE POLICY "Authenticated users can view contracts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'contratos');

CREATE POLICY "Authenticated users can update contracts"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'contratos');

CREATE POLICY "Authenticated users can delete contracts"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'contratos');

-- === FOTOS SERVIÇO ===
CREATE POLICY "Authenticated users can upload fotos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'fotos-servico');

CREATE POLICY "Authenticated users can view fotos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'fotos-servico');

-- === PUBLIC ASSETS ===
CREATE POLICY "Anyone can view public assets"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'public-assets');

CREATE POLICY "Authenticated users can upload public assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'public-assets');
```

---

## 12. SEEDS - DADOS INICIAIS

### 12.1 Configurações Padrão

```sql
-- ============================================
-- SEED: Configurações
-- ============================================

INSERT INTO public.configuracoes (chave, valor, descricao, categoria) VALUES
  -- Dados da empresa
  ('empresa_nome', '"Chesque Premium Cleaning"', 'Nome da empresa', 'geral'),
  ('empresa_telefone', '"(551) 389-7394"', 'Telefone principal', 'geral'),
  ('empresa_email', '"hello@Chesquecleaning.com"', 'Email principal', 'geral'),
  ('empresa_endereco', '"500 Main St, Miami, FL 33139"', 'Endereço base', 'geral'),
  
  -- Horários
  ('horario_inicio', '"08:00"', 'Hora de início do expediente', 'horarios'),
  ('horario_fim', '"18:00"', 'Hora de fim do expediente', 'horarios'),
  ('buffer_deslocamento', '60', 'Minutos de buffer entre serviços', 'horarios'),
  ('dias_trabalho', '["monday","tuesday","wednesday","thursday","friday","saturday"]', 'Dias de trabalho', 'horarios'),
  
  -- Descontos por frequência
  ('desconto_weekly', '15', 'Desconto % para frequência semanal', 'precos'),
  ('desconto_biweekly', '10', 'Desconto % para frequência quinzenal', 'precos'),
  ('desconto_monthly', '5', 'Desconto % para frequência mensal', 'precos'),
  
  -- Promoções
  ('promo_primeira_deep', '20', 'Desconto % na primeira deep cleaning', 'precos'),
  
  -- Taxas
  ('fee_cancelamento_24h', '50', 'Taxa de cancelamento com menos de 24h', 'precos'),
  ('fee_no_show', '50', 'Taxa de no-show', 'precos'),
  
  -- Integrações
  ('google_review_url', '"https://g.page/r/Chesque-cleaning/review"', 'Link para deixar review no Google', 'integracao'),
  
  -- Notificações
  ('sms_lembrete_24h', 'true', 'Enviar lembrete SMS 24h antes', 'notificacoes'),
  ('sms_lembrete_30min', 'true', 'Enviar SMS 30min antes (on my way)', 'notificacoes'),
  ('sms_pos_servico', 'true', 'Enviar SMS pedindo feedback após serviço', 'notificacoes'),
  ('email_confirmacao', 'true', 'Enviar email de confirmação', 'notificacoes')
ON CONFLICT (chave) DO NOTHING;
```

### 12.2 Áreas Atendidas

```sql
-- ============================================
-- SEED: Áreas Atendidas
-- ============================================

INSERT INTO public.areas_atendidas (nome, cidade, estado, zip_codes, ativo, ordem, taxa_deslocamento) VALUES
  (
    'Miami',
    'Miami',
    'FL',
    ARRAY['33101','33102','33125','33126','33127','33128','33129','33130','33131','33132','33133','33134','33135','33136','33137','33138','33139','33140','33141','33142','33143','33144','33145','33146','33147','33149','33150','33151','33152','33153','33154','33155','33156','33157','33158','33161','33162','33163','33164','33165','33166','33167','33168','33169','33170','33172','33173','33174','33175','33176','33177','33178','33179','33180','33181','33182','33183','33184','33185','33186','33187','33188','33189','33190','33193','33194','33196','33197'],
    TRUE,
    1,
    0
  ),
  (
    'Miami Beach',
    'Miami Beach',
    'FL',
    ARRAY['33109','33119','33139','33140','33141','33154'],
    TRUE,
    2,
    0
  ),
  (
    'Coral Gables',
    'Coral Gables',
    'FL',
    ARRAY['33114','33124','33134','33143','33144','33145','33146','33156','33158'],
    TRUE,
    3,
    0
  ),
  (
    'Brickell',
    'Miami',
    'FL',
    ARRAY['33129','33130','33131'],
    TRUE,
    4,
    0
  ),
  (
    'Coconut Grove',
    'Miami',
    'FL',
    ARRAY['33133','33146'],
    TRUE,
    5,
    0
  ),
  (
    'Doral',
    'Doral',
    'FL',
    ARRAY['33122','33166','33172','33178'],
    TRUE,
    6,
    10.00
  ),
  (
    'Aventura',
    'Aventura',
    'FL',
    ARRAY['33160','33180'],
    TRUE,
    7,
    15.00
  )
ON CONFLICT DO NOTHING;
```

### 12.3 Tipos de Serviço

```sql
-- ============================================
-- SEED: Tipos de Serviço
-- ============================================

INSERT INTO public.servicos_tipos (codigo, nome, descricao, multiplicador_preco, duracao_base_minutos, cor, icone, ativo, disponivel_agendamento_online, ordem) VALUES
  (
    'visit',
    'Estimate Visit',
    'Free 15-minute visit for accurate quote',
    0,
    30,
    '#8E8E8E',
    'clipboard-list',
    TRUE,
    TRUE,
    0
  ),
  (
    'regular',
    'Regular Cleaning',
    'Weekly or bi-weekly maintenance cleaning to keep your home fresh and tidy',
    1.0,
    180,
    '#6B8E6B',
    'sparkles',
    TRUE,
    TRUE,
    1
  ),
  (
    'deep',
    'Deep Cleaning',
    'Thorough top-to-bottom cleaning including hard-to-reach areas, inside appliances, and detailed scrubbing',
    1.5,
    300,
    '#C4A35A',
    'sparkles',
    TRUE,
    TRUE,
    2
  ),
  (
    'move_in_out',
    'Move-in/Move-out',
    'Complete cleaning for empty homes - perfect for moving day or preparing for new tenants',
    1.75,
    360,
    '#7B9EB8',
    'home',
    TRUE,
    TRUE,
    3
  ),
  (
    'office',
    'Office Cleaning',
    'Professional cleaning for commercial spaces, offices, and workplaces',
    1.0,
    180,
    '#9B8BB8',
    'building',
    TRUE,
    FALSE,
    4
  ),
  (
    'airbnb',
    'Airbnb Turnover',
    'Quick and efficient cleaning between guests - linens, restocking, and guest-ready presentation',
    1.1,
    180,
    '#C4856B',
    'key',
    TRUE,
    FALSE,
    5
  )
ON CONFLICT (codigo) DO NOTHING;
```

### 12.4 Add-ons

```sql
-- ============================================
-- SEED: Add-ons
-- ============================================

INSERT INTO public.addons (codigo, nome, descricao, preco, tipo_cobranca, unidade, minutos_adicionais, ativo, ordem) VALUES
  (
    'inside_oven',
    'Inside Oven',
    'Deep cleaning inside the oven including racks',
    35.00,
    'fixo',
    NULL,
    30,
    TRUE,
    1
  ),
  (
    'inside_fridge',
    'Inside Refrigerator',
    'Complete cleaning inside the refrigerator including shelves and drawers',
    35.00,
    'fixo',
    NULL,
    30,
    TRUE,
    2
  ),
  (
    'interior_windows',
    'Interior Windows',
    'Cleaning of interior window surfaces',
    5.00,
    'por_unidade',
    'window',
    5,
    TRUE,
    3
  ),
  (
    'laundry',
    'Laundry',
    'Wash, dry, and fold clothes',
    30.00,
    'por_unidade',
    'load',
    60,
    TRUE,
    4
  ),
  (
    'organizing',
    'Organizing/Decluttering',
    'Help organize closets, cabinets, or other areas',
    40.00,
    'por_hora',
    'hour',
    60,
    TRUE,
    5
  ),
  (
    'inside_cabinets',
    'Inside Cabinets',
    'Cleaning inside kitchen or bathroom cabinets',
    25.00,
    'por_unidade',
    'cabinet',
    20,
    TRUE,
    6
  ),
  (
    'baseboards',
    'Baseboards Detail',
    'Detailed cleaning of all baseboards',
    25.00,
    'fixo',
    NULL,
    30,
    TRUE,
    7
  ),
  (
    'garage',
    'Garage Sweep',
    'Sweep and basic cleaning of garage floor',
    40.00,
    'fixo',
    NULL,
    30,
    TRUE,
    8
  ),
  (
    'blinds',
    'Blinds Cleaning',
    'Detailed dusting and cleaning of blinds',
    5.00,
    'por_unidade',
    'blind',
    10,
    TRUE,
    9
  ),
  (
    'wall_spots',
    'Wall Spot Cleaning',
    'Remove spots and marks from walls',
    20.00,
    'fixo',
    NULL,
    15,
    TRUE,
    10
  )
ON CONFLICT (codigo) DO NOTHING;
```

### 12.5 Tabela de Preços Base

```sql
-- ============================================
-- SEED: Preços Base
-- ============================================

INSERT INTO public.precos_base (bedrooms, bathrooms, preco_minimo, preco_maximo, duracao_minutos) VALUES
  -- 1 bedroom
  (1, 1.0, 120, 140, 120),
  (1, 1.5, 130, 150, 130),
  (1, 2.0, 140, 160, 140),
  
  -- 2 bedrooms
  (2, 1.0, 140, 160, 150),
  (2, 1.5, 150, 170, 160),
  (2, 2.0, 160, 180, 170),
  (2, 2.5, 170, 190, 180),
  
  -- 3 bedrooms
  (3, 1.0, 160, 180, 170),
  (3, 1.5, 170, 190, 180),
  (3, 2.0, 180, 200, 190),
  (3, 2.5, 190, 220, 200),
  (3, 3.0, 200, 230, 210),
  
  -- 4 bedrooms
  (4, 2.0, 200, 230, 220),
  (4, 2.5, 220, 250, 240),
  (4, 3.0, 240, 270, 260),
  (4, 3.5, 260, 300, 280),
  
  -- 5 bedrooms
  (5, 2.5, 260, 300, 280),
  (5, 3.0, 280, 330, 300),
  (5, 3.5, 300, 360, 330),
  (5, 4.0, 330, 400, 360),
  
  -- 6+ bedrooms
  (6, 3.0, 320, 380, 330),
  (6, 3.5, 350, 420, 360),
  (6, 4.0, 380, 460, 390),
  (6, 4.5, 420, 500, 420)
ON CONFLICT (bedrooms, bathrooms) DO NOTHING;
```

### 12.6 Usuário Admin (Supabase Auth)

**IMPORTANTE:** Execute isso no Supabase Dashboard > Authentication > Users > Add User

```
Email: admin@Chesquecleaning.com
Password: [definir senha segura]
```

Ou via SQL (requer service_role):

```sql
-- NOTA: Isso deve ser feito via Supabase Dashboard ou API
-- Este é apenas um exemplo de referência

-- Criar usuário admin via Supabase Auth
-- Dashboard > Authentication > Users > Add User
-- Email: admin@Chesquecleaning.com
-- Password: [escolher senha forte]
```

---

## 13. GERAÇÃO DE TYPESCRIPT TYPES

### 13.1 Instalar Supabase CLI

```bash
# Via npm
npm install supabase --save-dev

# Ou globalmente
npm install -g supabase
```

### 13.2 Login no Supabase

```bash
npx supabase login
```

### 13.3 Gerar Types

```bash
# Gerar types para o projeto
npx supabase gen types typescript --project-id SEU_PROJECT_ID > types/supabase.ts
```

### 13.4 Estrutura do Arquivo Gerado

O arquivo `types/supabase.ts` terá uma estrutura similar a:

```typescript
// types/supabase.ts (gerado automaticamente)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clientes: {
        Row: {
          id: string
          nome: string
          telefone: string
          email: string | null
          // ... todos os campos
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          telefone: string
          email?: string | null
          // ... campos para insert
        }
        Update: {
          id?: string
          nome?: string
          telefone?: string
          email?: string | null
          // ... campos para update
        }
      }
      agendamentos: {
        // ... definição similar
      }
      // ... outras tabelas
    }
    Views: {
      v_agenda_hoje: {
        Row: {
          // ... campos da view
        }
      }
      // ... outras views
    }
    Functions: {
      get_available_slots: {
        Args: {
          p_data: string
          p_duracao_minutos?: number
        }
        Returns: {
          slot_inicio: string
          slot_fim: string
          disponivel: boolean
        }[]
      }
      // ... outras funções
    }
  }
}
```

### 13.5 Atualizar Cliente Supabase com Types

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore
          }
        },
      },
    }
  )
}
```

### 13.6 Helper Types

Adicionar ao arquivo `types/index.ts`:

```typescript
// types/index.ts
import { Database } from './supabase'

// Atalhos para tipos de tabelas
export type Cliente = Database['public']['Tables']['clientes']['Row']
export type ClienteInsert = Database['public']['Tables']['clientes']['Insert']
export type ClienteUpdate = Database['public']['Tables']['clientes']['Update']

export type Agendamento = Database['public']['Tables']['agendamentos']['Row']
export type AgendamentoInsert = Database['public']['Tables']['agendamentos']['Insert']
export type AgendamentoUpdate = Database['public']['Tables']['agendamentos']['Update']

export type Recorrencia = Database['public']['Tables']['recorrencias']['Row']
export type Contrato = Database['public']['Tables']['contratos']['Row']
export type Financeiro = Database['public']['Tables']['financeiro']['Row']
export type MensagemChat = Database['public']['Tables']['mensagens_chat']['Row']
export type Feedback = Database['public']['Tables']['feedback']['Row']
export type Configuracao = Database['public']['Tables']['configuracoes']['Row']
export type AreaAtendida = Database['public']['Tables']['areas_atendidas']['Row']
export type ServicoTipo = Database['public']['Tables']['servicos_tipos']['Row']
export type Addon = Database['public']['Tables']['addons']['Row']
export type PrecoBase = Database['public']['Tables']['precos_base']['Row']

// Views
export type AgendaHoje = Database['public']['Views']['v_agenda_hoje']['Row']
export type DashboardStats = Database['public']['Views']['v_dashboard_stats']['Row']

// ... outros types existentes do index.ts
```

---

## 14. SCRIPT DE MIGRAÇÃO COMPLETO

Para facilitar, aqui está o script completo em ordem de execução:

```sql
-- ============================================
-- Chesque PREMIUM CLEANING
-- SCHEMA COMPLETO - MIGRAÇÃO
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. FUNÇÃO UPDATED_AT
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. TABELAS
-- [Inserir todas as CREATE TABLE da seção 5]

-- 4. ÍNDICES
-- [Inserir todos os CREATE INDEX da seção 6]

-- 5. FUNÇÕES
-- [Inserir todas as funções da seção 7]

-- 6. TRIGGERS
-- [Inserir todos os triggers da seção 8]

-- 7. VIEWS
-- [Inserir todas as views da seção 9]

-- 8. RLS
-- [Inserir todas as políticas da seção 10]

-- 9. STORAGE
-- [Inserir configuração de storage da seção 11]

-- 10. SEEDS
-- [Inserir todos os dados iniciais da seção 12]

-- FIM DA MIGRAÇÃO
```

**NOTA:** Por limitação de tamanho, execute cada seção separadamente no SQL Editor.

---

## 15. CHECKLIST DE VALIDAÇÃO

### 15.1 Pré-execução

- [ ] Fase 1 completa e funcionando
- [ ] Acesso ao Supabase Dashboard
- [ ] Project ID anotado
- [ ] Supabase CLI instalado

### 15.2 Extensões

- [ ] `uuid-ossp` habilitado
- [ ] `pgcrypto` habilitado

### 15.3 Tabelas

- [ ] `clientes` criada
- [ ] `recorrencias` criada
- [ ] `agendamentos` criada
- [ ] `contratos` criada
- [ ] `financeiro` criada
- [ ] `mensagens_chat` criada
- [ ] `feedback` criada
- [ ] `configuracoes` criada
- [ ] `areas_atendidas` criada
- [ ] `servicos_tipos` criada
- [ ] `addons` criada
- [ ] `precos_base` criada

### 15.4 Relacionamentos

- [ ] FK `agendamentos.cliente_id` → `clientes.id`
- [ ] FK `agendamentos.recorrencia_id` → `recorrencias.id`
- [ ] FK `recorrencias.cliente_id` → `clientes.id`
- [ ] FK `contratos.cliente_id` → `clientes.id`
- [ ] FK `clientes.contrato_id` → `contratos.id`
- [ ] FK `financeiro.cliente_id` → `clientes.id`
- [ ] FK `feedback.cliente_id` → `clientes.id`
- [ ] FK `mensagens_chat.cliente_id` → `clientes.id`

### 15.5 Índices

- [ ] Índices em campos de FK
- [ ] Índices em campos de busca (status, data, telefone)
- [ ] Índices compostos para queries frequentes

### 15.6 Funções

- [ ] `handle_updated_at()` funciona
- [ ] `get_available_slots()` retorna dados
- [ ] `calculate_next_recurrence()` calcula corretamente
- [ ] `check_zip_code_coverage()` verifica CEPs
- [ ] `calculate_service_price()` calcula preços

### 15.7 Triggers

- [ ] `updated_at` atualiza automaticamente
- [ ] Número do contrato é gerado

### 15.8 Views

- [ ] `v_agenda_hoje` retorna dados
- [ ] `v_clientes_inativos` funciona
- [ ] `v_resumo_mensal` calcula corretamente
- [ ] `v_dashboard_stats` retorna métricas

### 15.9 RLS

- [ ] RLS habilitado em todas as tabelas
- [ ] Políticas para `authenticated` funcionam
- [ ] Políticas para `anon` (chat) funcionam

### 15.10 Storage

- [ ] Bucket `contratos` criado
- [ ] Bucket `fotos-servico` criado
- [ ] Bucket `public-assets` criado
- [ ] Políticas de storage configuradas

### 15.11 Seeds

- [ ] Configurações inseridas
- [ ] Áreas atendidas inseridas
- [ ] Tipos de serviço inseridos
- [ ] Add-ons inseridos
- [ ] Preços base inseridos

### 15.12 TypeScript Types

- [ ] `types/supabase.ts` gerado
- [ ] Types importados nos clientes Supabase
- [ ] Helper types em `types/index.ts`

### 15.13 Testes de Query

Execute estas queries para validar:

```sql
-- Teste 1: Verificar tabelas
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Teste 2: Verificar configurações
SELECT * FROM public.configuracoes;

-- Teste 3: Verificar áreas
SELECT * FROM public.areas_atendidas WHERE ativo = true;

-- Teste 4: Verificar tipos de serviço
SELECT * FROM public.servicos_tipos ORDER BY ordem;

-- Teste 5: Verificar preços
SELECT * FROM public.precos_base ORDER BY bedrooms, bathrooms;

-- Teste 6: Testar função de slots
SELECT * FROM public.get_available_slots(CURRENT_DATE + 1, 180);

-- Teste 7: Testar verificação de CEP
SELECT * FROM public.check_zip_code_coverage('33139');

-- Teste 8: Testar cálculo de preço
SELECT * FROM public.calculate_service_price(3, 2.0, 'regular', 'biweekly');

-- Teste 9: Verificar views
SELECT * FROM public.v_dashboard_stats;
```

---

## ✅ DEFINIÇÃO DE PRONTO

A Fase 2 está **COMPLETA** quando:

1. ✅ Todas as 12 tabelas criadas sem erros
2. ✅ Todos os relacionamentos (FK) funcionando
3. ✅ Índices criados
4. ✅ Funções PostgreSQL executando corretamente
5. ✅ Triggers disparando automaticamente
6. ✅ Views retornando dados
7. ✅ RLS habilitado com políticas configuradas
8. ✅ Storage buckets criados
9. ✅ Dados de seed inseridos
10. ✅ TypeScript types gerados e importados
11. ✅ Queries de teste passando
12. ✅ Conexão do Next.js com banco funcionando

---

## 📝 NOTAS IMPORTANTES

1. **Execute em ordem**: As tabelas têm dependências, siga a ordem do documento
2. **Teste cada seção**: Não avance sem validar a seção anterior
3. **Seeds são obrigatórios**: O sistema depende das configurações iniciais
4. **Gere os types**: O TypeScript precisa dos types para autocomplete
5. **Backup**: O Supabase faz backup automático, mas anote o que executou

---

## 🔗 PRÓXIMA FASE

Após completar a Fase 2, prossiga para:

**FASE 3: Landing Page + Chat UI**
- Implementação da Landing Page
- Chat Widget e Chat Fullscreen
- Integração com API routes
- Conexão com banco de dados

---

**— FIM DA FASE 2 —**

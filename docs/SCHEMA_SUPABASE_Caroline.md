# SCHEMA SUPABASE - CAROLINE PREMIUM CLEANING

**Versão:** 1.0  
**Data:** Dezembro 2024  
**Referência:** PRD v5.0

---

## ÍNDICE

- [1. Visão Geral](#1-visão-geral)
- [2. Diagrama ER](#2-diagrama-er)
- [3. Tabelas](#3-tabelas)
- [4. Enums e Types](#4-enums-e-types)
- [5. Índices](#5-índices)
- [6. Row Level Security (RLS)](#6-row-level-security-rls)
- [7. Funções](#7-funções)
- [8. Triggers](#8-triggers)
- [9. Views](#9-views)
- [10. Seeds (Dados Iniciais)](#10-seeds-dados-iniciais)
- [11. Migrações](#11-migrações)

---

## 1. VISÃO GERAL

### Banco de Dados
- **Provider:** Supabase (PostgreSQL 15+)
- **Região:** East US (ou mais próxima do público-alvo)
- **Extensões necessárias:** `uuid-ossp`, `pgcrypto`

### Tabelas Principais

| Tabela | Descrição |
|--------|-----------|
| `clientes` | Dados dos clientes (leads e ativos) |
| `agendamentos` | Serviços agendados |
| `recorrencias` | Configuração de limpezas recorrentes |
| `contratos` | Contratos assinados |
| `financeiro` | Transações financeiras |
| `mensagens_chat` | Histórico de conversas com Carol |
| `feedback` | Avaliações pós-serviço |
| `configuracoes` | Parâmetros do sistema |
| `areas_atendidas` | Regiões de atendimento |
| `servicos_tipos` | Tipos de serviço disponíveis |

---

## 2. DIAGRAMA ER

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
         │
         ▼
┌─────────────────┐       ┌─────────────────┐
│   financeiro    │       │ mensagens_chat  │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ cliente_id (FK) │       │ session_id      │
│ agendamento_id  │       │ cliente_id (FK) │
│ tipo_transacao  │       │ role            │
│ valor           │       │ content         │
│ categoria       │       │ ...             │
│ ...             │       └─────────────────┘
└─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│  configuracoes  │       │ areas_atendidas │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ chave           │       │ nome            │
│ valor (JSONB)   │       │ ativo           │
└─────────────────┘       └─────────────────┘

┌─────────────────┐
│ servicos_tipos  │
├─────────────────┤
│ id (PK)         │
│ nome            │
│ multiplicador   │
│ cor             │
│ ativo           │
└─────────────────┘
```

---

## 3. TABELAS

### 3.1 clientes

Armazena informações de leads e clientes ativos.

```sql
CREATE TABLE public.clientes (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dados pessoais
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT,
  
  -- Endereço
  endereco_completo TEXT NOT NULL,
  endereco_linha2 TEXT,
  cidade TEXT,
  estado TEXT DEFAULT 'FL',
  zip_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Detalhes da casa
  bedrooms INTEGER,
  bathrooms DECIMAL(3, 1), -- permite 2.5 baths
  square_feet INTEGER,
  tipo_residencia TEXT DEFAULT 'house', -- house, apartment, condo, townhouse
  
  -- Serviço
  tipo_servico_padrao TEXT DEFAULT 'regular',
  frequencia TEXT, -- weekly, biweekly, monthly, one_time
  valor_servico DECIMAL(10, 2),
  dia_preferido TEXT, -- monday, tuesday, etc.
  horario_preferido TIME,
  
  -- Acesso
  acesso_tipo TEXT, -- client_home, garage_code, lockbox, key_hidden, other
  acesso_instrucoes TEXT,
  acesso_codigo TEXT,
  
  -- Pets
  tem_pets BOOLEAN DEFAULT FALSE,
  pets_detalhes TEXT,
  
  -- Contrato
  contrato_id UUID,
  
  -- Tracking
  origem TEXT, -- google, facebook, instagram, referral, website, other
  origem_detalhe TEXT,
  referido_por UUID REFERENCES public.clientes(id),
  
  -- Datas importantes
  data_primeiro_contato DATE DEFAULT CURRENT_DATE,
  data_primeiro_servico DATE,
  data_aniversario DATE,
  
  -- Status
  status TEXT DEFAULT 'lead' CHECK (status IN ('lead', 'ativo', 'pausado', 'cancelado', 'inativo')),
  motivo_cancelamento TEXT,
  data_cancelamento DATE,
  
  -- Observações
  notas TEXT,
  notas_internas TEXT, -- notas que o cliente não vê
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE public.clientes IS 'Tabela principal de clientes e leads';
COMMENT ON COLUMN public.clientes.status IS 'lead=novo, ativo=cliente recorrente, pausado=temporariamente inativo, cancelado=encerrou, inativo=sem serviço há 90+ dias';
```

---

### 3.2 agendamentos

Armazena todos os serviços agendados.

```sql
CREATE TABLE public.agendamentos (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  
  -- Tipo e timing
  tipo TEXT NOT NULL CHECK (tipo IN ('visit', 'regular', 'deep', 'move_in_out', 'office', 'airbnb')),
  data DATE NOT NULL,
  horario_inicio TIME NOT NULL,
  horario_fim_estimado TIME,
  duracao_minutos INTEGER DEFAULT 180,
  
  -- Valor
  valor DECIMAL(10, 2),
  valor_addons DECIMAL(10, 2) DEFAULT 0,
  desconto_percentual DECIMAL(5, 2) DEFAULT 0,
  valor_final DECIMAL(10, 2) GENERATED ALWAYS AS (
    (valor + COALESCE(valor_addons, 0)) * (1 - COALESCE(desconto_percentual, 0) / 100)
  ) STORED,
  
  -- Add-ons
  addons JSONB DEFAULT '[]',
  -- Exemplo: [{"nome": "inside_oven", "valor": 35}, {"nome": "laundry", "valor": 30, "quantidade": 2}]
  
  -- Status
  status TEXT DEFAULT 'agendado' CHECK (status IN (
    'agendado',      -- criado, aguardando
    'confirmado',    -- cliente confirmou
    'em_andamento',  -- serviço iniciado
    'concluido',     -- finalizado com sucesso
    'cancelado',     -- cancelado pelo cliente ou empresa
    'no_show',       -- cliente não estava disponível
    'reagendado'     -- foi movido para outra data
  )),
  
  -- Recorrência
  recorrencia_id UUID REFERENCES public.recorrencias(id),
  e_recorrente BOOLEAN DEFAULT FALSE,
  
  -- Checklist pós-serviço
  checklist JSONB DEFAULT '{
    "sala": false,
    "quartos": false,
    "banheiros": false,
    "cozinha": false,
    "areas_extras": false,
    "sem_danos": false,
    "fotos_tiradas": false
  }',
  
  -- Lembretes enviados
  lembrete_24h_enviado BOOLEAN DEFAULT FALSE,
  lembrete_30min_enviado BOOLEAN DEFAULT FALSE,
  feedback_solicitado BOOLEAN DEFAULT FALSE,
  
  -- Observações
  notas TEXT,
  notas_internas TEXT,
  
  -- Cancelamento
  motivo_cancelamento TEXT,
  cancelado_por TEXT, -- cliente, empresa
  data_cancelamento TIMESTAMPTZ,
  
  -- Reagendamento
  reagendado_de UUID REFERENCES public.agendamentos(id),
  reagendado_para UUID,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.agendamentos IS 'Serviços agendados - passados e futuros';
```

---

### 3.3 recorrencias

Configuração de serviços recorrentes.

```sql
CREATE TABLE public.recorrencias (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  
  -- Configuração
  frequencia TEXT NOT NULL CHECK (frequencia IN ('weekly', 'biweekly', 'monthly')),
  dia_preferido TEXT NOT NULL CHECK (dia_preferido IN (
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  )),
  horario_preferido TIME NOT NULL,
  
  -- Tipo de serviço
  tipo_servico TEXT DEFAULT 'regular',
  duracao_minutos INTEGER DEFAULT 180,
  
  -- Valor
  valor_base DECIMAL(10, 2) NOT NULL,
  desconto_percentual DECIMAL(5, 2) DEFAULT 0,
  valor_com_desconto DECIMAL(10, 2) GENERATED ALWAYS AS (
    valor_base * (1 - COALESCE(desconto_percentual, 0) / 100)
  ) STORED,
  
  -- Add-ons fixos
  addons_fixos JSONB DEFAULT '[]',
  
  -- Status
  ativo BOOLEAN DEFAULT TRUE,
  pausado_ate DATE,
  motivo_pausa TEXT,
  
  -- Próximo agendamento
  proximo_agendamento DATE,
  ultimo_agendamento DATE,
  
  -- Contagem
  total_agendamentos INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.recorrencias IS 'Configuração de limpezas recorrentes';
```

---

### 3.4 contratos

Contratos de serviço assinados.

```sql
CREATE TABLE public.contratos (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  
  -- Documento
  documento_url TEXT, -- URL no Supabase Storage
  documento_nome TEXT,
  
  -- Detalhes do serviço
  tipo_servico TEXT NOT NULL,
  frequencia TEXT NOT NULL,
  dia_preferido TEXT,
  horario_preferido TIME,
  
  -- Valores
  valor_acordado DECIMAL(10, 2) NOT NULL,
  desconto_percentual DECIMAL(5, 2) DEFAULT 0,
  valor_final DECIMAL(10, 2),
  
  -- Add-ons inclusos
  addons_inclusos JSONB DEFAULT '[]',
  
  -- Vigência
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE, -- NULL = indefinido
  
  -- Assinatura
  data_assinatura TIMESTAMPTZ,
  assinado_por TEXT, -- nome de quem assinou
  ip_assinatura TEXT,
  
  -- Status
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'ativo', 'encerrado', 'cancelado')),
  motivo_encerramento TEXT,
  data_encerramento DATE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.contratos IS 'Contratos de serviço assinados';
```

---

### 3.5 financeiro

Transações financeiras (receitas e custos).

```sql
CREATE TABLE public.financeiro (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamentos (opcionais)
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  agendamento_id UUID REFERENCES public.agendamentos(id) ON DELETE SET NULL,
  
  -- Transação
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'custo')),
  valor DECIMAL(10, 2) NOT NULL,
  
  -- Categorização
  categoria TEXT NOT NULL,
  -- Receitas: regular, deep, move_in_out, office, airbnb, addon, outro
  -- Custos: produto, transporte, equipamento, marketing, outro
  subcategoria TEXT,
  
  -- Detalhes
  descricao TEXT,
  
  -- Pagamento
  metodo_pagamento TEXT CHECK (metodo_pagamento IN ('cash', 'zelle', 'check', 'outro')),
  referencia_pagamento TEXT, -- ex: ID do Zelle
  
  -- Data
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  data_competencia DATE, -- mês de referência (para relatórios)
  
  -- Status
  status TEXT DEFAULT 'confirmado' CHECK (status IN ('pendente', 'confirmado', 'cancelado')),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.financeiro IS 'Registro de receitas e custos';
```

---

### 3.6 mensagens_chat

Histórico de conversas com Carol (IA).

```sql
CREATE TABLE public.mensagens_chat (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Sessão
  session_id TEXT NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  
  -- Mensagem
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  
  -- Metadata da mensagem
  metadata JSONB DEFAULT '{}',
  -- Exemplo: {"intent": "agendar_visita", "entities": {"data": "2024-12-15"}}
  
  -- Ações executadas (pelo assistant)
  actions_taken JSONB DEFAULT '[]',
  -- Exemplo: [{"action": "criar_lead", "result": "success"}]
  
  -- Origem
  origem TEXT DEFAULT 'website', -- website, whatsapp, sms
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.mensagens_chat IS 'Histórico de conversas do chat com Carol';
```

---

### 3.7 feedback

Avaliações pós-serviço dos clientes.

```sql
CREATE TABLE public.feedback (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamentos
  agendamento_id UUID REFERENCES public.agendamentos(id) ON DELETE SET NULL,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  
  -- Avaliação
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comentario TEXT,
  
  -- Follow-up
  acao_necessaria BOOLEAN DEFAULT FALSE,
  acao_tomada TEXT,
  acao_data TIMESTAMPTZ,
  
  -- Google Review
  google_review_solicitado BOOLEAN DEFAULT FALSE,
  google_review_link_enviado BOOLEAN DEFAULT FALSE,
  
  -- Origem
  origem TEXT DEFAULT 'sms', -- sms, email, app
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.feedback IS 'Avaliações dos clientes após serviços';
```

---

### 3.8 configuracoes

Parâmetros configuráveis do sistema.

```sql
CREATE TABLE public.configuracoes (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Chave-valor
  chave TEXT UNIQUE NOT NULL,
  valor JSONB NOT NULL,
  
  -- Descrição
  descricao TEXT,
  
  -- Tipo (para validação no frontend)
  tipo TEXT DEFAULT 'json', -- string, number, boolean, json, array
  
  -- Metadata
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.configuracoes IS 'Configurações do sistema em formato chave-valor';
```

---

### 3.9 areas_atendidas

Regiões onde a empresa atende.

```sql
CREATE TABLE public.areas_atendidas (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Área
  nome TEXT NOT NULL,
  cidade TEXT,
  estado TEXT DEFAULT 'FL',
  zip_codes TEXT[], -- array de CEPs atendidos
  
  -- Status
  ativo BOOLEAN DEFAULT TRUE,
  
  -- Ordem de exibição
  ordem INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.areas_atendidas IS 'Regiões atendidas pela empresa';
```

---

### 3.10 servicos_tipos

Tipos de serviço disponíveis.

```sql
CREATE TABLE public.servicos_tipos (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Detalhes
  codigo TEXT UNIQUE NOT NULL, -- regular, deep, move_in_out, office, airbnb, visit
  nome TEXT NOT NULL,
  descricao TEXT,
  
  -- Preços
  multiplicador_preco DECIMAL(4, 2) DEFAULT 1.0, -- deep = 1.5, move = 1.75
  
  -- Tempo
  duracao_base_minutos INTEGER DEFAULT 180,
  minutos_por_quarto INTEGER DEFAULT 30, -- adicional por quarto
  minutos_por_banheiro INTEGER DEFAULT 20, -- adicional por banheiro
  
  -- Visual
  cor TEXT DEFAULT '#22c55e', -- cor para o calendário (hex)
  icone TEXT, -- nome do ícone (lucide)
  
  -- Status
  ativo BOOLEAN DEFAULT TRUE,
  disponivel_agendamento_online BOOLEAN DEFAULT TRUE,
  
  -- Ordem de exibição
  ordem INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.servicos_tipos IS 'Tipos de serviço oferecidos';
```

---

### 3.11 addons

Serviços adicionais disponíveis.

```sql
CREATE TABLE public.addons (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Detalhes
  codigo TEXT UNIQUE NOT NULL, -- inside_oven, laundry, etc
  nome TEXT NOT NULL,
  descricao TEXT,
  
  -- Preço
  preco DECIMAL(10, 2) NOT NULL,
  tipo_cobranca TEXT DEFAULT 'fixo', -- fixo, por_unidade, por_hora
  unidade TEXT, -- window, load, hour
  
  -- Tempo adicional
  minutos_adicionais INTEGER DEFAULT 0,
  
  -- Status
  ativo BOOLEAN DEFAULT TRUE,
  
  -- Ordem
  ordem INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.addons IS 'Serviços adicionais (add-ons)';
```

---

### 3.12 precos_base

Tabela de preços base por tamanho de casa.

```sql
CREATE TABLE public.precos_base (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tamanho
  bedrooms INTEGER NOT NULL,
  bathrooms DECIMAL(3, 1) NOT NULL,
  
  -- Preços
  preco_minimo DECIMAL(10, 2) NOT NULL,
  preco_maximo DECIMAL(10, 2) NOT NULL,
  preco_sugerido DECIMAL(10, 2) GENERATED ALWAYS AS (
    (preco_minimo + preco_maximo) / 2
  ) STORED,
  
  -- Tempo estimado
  duracao_minutos INTEGER DEFAULT 180,
  
  -- Status
  ativo BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint única
  UNIQUE(bedrooms, bathrooms)
);

COMMENT ON TABLE public.precos_base IS 'Tabela de preços base por tamanho de residência';
```

---

## 4. ENUMS E TYPES

```sql
-- Status do cliente
CREATE TYPE cliente_status AS ENUM ('lead', 'ativo', 'pausado', 'cancelado', 'inativo');

-- Status do agendamento
CREATE TYPE agendamento_status AS ENUM (
  'agendado', 'confirmado', 'em_andamento', 'concluido', 'cancelado', 'no_show', 'reagendado'
);

-- Frequência
CREATE TYPE frequencia_tipo AS ENUM ('weekly', 'biweekly', 'monthly', 'one_time');

-- Tipo de transação
CREATE TYPE transacao_tipo AS ENUM ('receita', 'custo');

-- Método de pagamento
CREATE TYPE pagamento_metodo AS ENUM ('cash', 'zelle', 'check', 'outro');

-- Dias da semana
CREATE TYPE dia_semana AS ENUM (
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
);
```

---

## 5. ÍNDICES

```sql
-- Clientes
CREATE INDEX idx_clientes_status ON public.clientes(status);
CREATE INDEX idx_clientes_telefone ON public.clientes(telefone);
CREATE INDEX idx_clientes_email ON public.clientes(email);
CREATE INDEX idx_clientes_cidade ON public.clientes(cidade);
CREATE INDEX idx_clientes_created_at ON public.clientes(created_at DESC);

-- Agendamentos
CREATE INDEX idx_agendamentos_cliente ON public.agendamentos(cliente_id);
CREATE INDEX idx_agendamentos_data ON public.agendamentos(data);
CREATE INDEX idx_agendamentos_status ON public.agendamentos(status);
CREATE INDEX idx_agendamentos_data_status ON public.agendamentos(data, status);
CREATE INDEX idx_agendamentos_recorrencia ON public.agendamentos(recorrencia_id);

-- Recorrências
CREATE INDEX idx_recorrencias_cliente ON public.recorrencias(cliente_id);
CREATE INDEX idx_recorrencias_ativo ON public.recorrencias(ativo);
CREATE INDEX idx_recorrencias_proximo ON public.recorrencias(proximo_agendamento);

-- Contratos
CREATE INDEX idx_contratos_cliente ON public.contratos(cliente_id);
CREATE INDEX idx_contratos_status ON public.contratos(status);

-- Financeiro
CREATE INDEX idx_financeiro_cliente ON public.financeiro(cliente_id);
CREATE INDEX idx_financeiro_agendamento ON public.financeiro(agendamento_id);
CREATE INDEX idx_financeiro_data ON public.financeiro(data);
CREATE INDEX idx_financeiro_tipo ON public.financeiro(tipo);
CREATE INDEX idx_financeiro_categoria ON public.financeiro(categoria);
CREATE INDEX idx_financeiro_data_tipo ON public.financeiro(data, tipo);

-- Mensagens Chat
CREATE INDEX idx_mensagens_session ON public.mensagens_chat(session_id);
CREATE INDEX idx_mensagens_cliente ON public.mensagens_chat(cliente_id);
CREATE INDEX idx_mensagens_created ON public.mensagens_chat(created_at DESC);

-- Feedback
CREATE INDEX idx_feedback_cliente ON public.feedback(cliente_id);
CREATE INDEX idx_feedback_rating ON public.feedback(rating);
CREATE INDEX idx_feedback_acao ON public.feedback(acao_necessaria) WHERE acao_necessaria = TRUE;

-- Full-text search nos clientes
CREATE INDEX idx_clientes_search ON public.clientes 
  USING gin(to_tsvector('english', nome || ' ' || COALESCE(email, '') || ' ' || telefone));
```

---

## 6. ROW LEVEL SECURITY (RLS)

Como é uma aplicação single-tenant (apenas Thayna usa), o RLS é simplificado.

```sql
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

-- Política: Usuário autenticado tem acesso total
-- (aplicar a todas as tabelas)

CREATE POLICY "Authenticated users full access" ON public.clientes
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON public.agendamentos
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON public.recorrencias
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON public.contratos
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON public.financeiro
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON public.mensagens_chat
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON public.feedback
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON public.configuracoes
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON public.areas_atendidas
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON public.servicos_tipos
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON public.addons
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users full access" ON public.precos_base
  FOR ALL USING (auth.role() = 'authenticated');

-- Política para acesso anônimo (service role para n8n)
-- Mensagens do chat podem ser inseridas anonimamente (via webhook)
CREATE POLICY "Allow anonymous insert on chat" ON public.mensagens_chat
  FOR INSERT WITH CHECK (true);

-- Leitura pública de áreas atendidas (para landing page)
CREATE POLICY "Public read areas" ON public.areas_atendidas
  FOR SELECT USING (ativo = true);

-- Leitura pública de tipos de serviço (para landing page)
CREATE POLICY "Public read servicos" ON public.servicos_tipos
  FOR SELECT USING (ativo = true);
```

---

## 7. FUNÇÕES

### 7.1 Atualizar updated_at automaticamente

```sql
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 7.2 Buscar slots disponíveis

```sql
CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_date DATE,
  p_duration_minutes INTEGER DEFAULT 180,
  p_buffer_minutes INTEGER DEFAULT 60
)
RETURNS TABLE (
  slot_start TIME,
  slot_end TIME,
  available BOOLEAN
) AS $$
DECLARE
  v_start_time TIME := '08:00:00';
  v_end_time TIME := '18:00:00';
  v_slot_interval INTERVAL := '30 minutes';
  v_current_slot TIME;
BEGIN
  -- Gera todos os slots do dia
  v_current_slot := v_start_time;
  
  WHILE v_current_slot + (p_duration_minutes || ' minutes')::INTERVAL <= v_end_time LOOP
    RETURN QUERY
    SELECT 
      v_current_slot,
      (v_current_slot + (p_duration_minutes || ' minutes')::INTERVAL)::TIME,
      NOT EXISTS (
        SELECT 1 FROM public.agendamentos a
        WHERE a.data = p_date
          AND a.status NOT IN ('cancelado', 'reagendado')
          AND (
            -- Novo slot começa durante agendamento existente
            (v_current_slot >= a.horario_inicio 
              AND v_current_slot < (a.horario_fim_estimado + (p_buffer_minutes || ' minutes')::INTERVAL))
            OR
            -- Novo slot termina durante agendamento existente
            ((v_current_slot + (p_duration_minutes || ' minutes')::INTERVAL) > a.horario_inicio
              AND (v_current_slot + (p_duration_minutes || ' minutes')::INTERVAL) <= (a.horario_fim_estimado + (p_buffer_minutes || ' minutes')::INTERVAL))
            OR
            -- Novo slot engloba agendamento existente
            (v_current_slot <= a.horario_inicio 
              AND (v_current_slot + (p_duration_minutes || ' minutes')::INTERVAL) >= (a.horario_fim_estimado + (p_buffer_minutes || ' minutes')::INTERVAL))
          )
      );
    
    v_current_slot := v_current_slot + v_slot_interval;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

### 7.3 Calcular preço sugerido

```sql
CREATE OR REPLACE FUNCTION public.calcular_preco_sugerido(
  p_bedrooms INTEGER,
  p_bathrooms DECIMAL,
  p_tipo_servico TEXT DEFAULT 'regular',
  p_frequencia TEXT DEFAULT 'one_time'
)
RETURNS DECIMAL AS $$
DECLARE
  v_preco_base DECIMAL;
  v_multiplicador DECIMAL;
  v_desconto DECIMAL;
BEGIN
  -- Buscar preço base
  SELECT preco_sugerido INTO v_preco_base
  FROM public.precos_base
  WHERE bedrooms = p_bedrooms AND bathrooms = p_bathrooms;
  
  IF v_preco_base IS NULL THEN
    -- Fallback: calcular baseado em fórmula
    v_preco_base := 120 + (p_bedrooms * 30) + (p_bathrooms * 20);
  END IF;
  
  -- Buscar multiplicador do tipo de serviço
  SELECT multiplicador_preco INTO v_multiplicador
  FROM public.servicos_tipos
  WHERE codigo = p_tipo_servico;
  
  v_multiplicador := COALESCE(v_multiplicador, 1.0);
  
  -- Calcular desconto por frequência
  v_desconto := CASE p_frequencia
    WHEN 'weekly' THEN 0.15
    WHEN 'biweekly' THEN 0.10
    WHEN 'monthly' THEN 0.05
    ELSE 0
  END;
  
  RETURN ROUND(v_preco_base * v_multiplicador * (1 - v_desconto), 2);
END;
$$ LANGUAGE plpgsql;
```

### 7.4 Gerar próximos agendamentos de recorrência

```sql
CREATE OR REPLACE FUNCTION public.gerar_agendamentos_recorrentes()
RETURNS INTEGER AS $$
DECLARE
  v_recorrencia RECORD;
  v_proxima_data DATE;
  v_count INTEGER := 0;
BEGIN
  FOR v_recorrencia IN 
    SELECT * FROM public.recorrencias 
    WHERE ativo = TRUE 
      AND (proximo_agendamento IS NULL OR proximo_agendamento <= CURRENT_DATE + INTERVAL '7 days')
  LOOP
    -- Calcular próxima data
    v_proxima_data := CASE v_recorrencia.frequencia
      WHEN 'weekly' THEN COALESCE(v_recorrencia.proximo_agendamento, CURRENT_DATE) + INTERVAL '7 days'
      WHEN 'biweekly' THEN COALESCE(v_recorrencia.proximo_agendamento, CURRENT_DATE) + INTERVAL '14 days'
      WHEN 'monthly' THEN COALESCE(v_recorrencia.proximo_agendamento, CURRENT_DATE) + INTERVAL '1 month'
    END;
    
    -- Ajustar para o dia preferido
    WHILE LOWER(TO_CHAR(v_proxima_data, 'day')) != v_recorrencia.dia_preferido LOOP
      v_proxima_data := v_proxima_data + INTERVAL '1 day';
    END LOOP;
    
    -- Verificar se já existe agendamento
    IF NOT EXISTS (
      SELECT 1 FROM public.agendamentos
      WHERE cliente_id = v_recorrencia.cliente_id
        AND data = v_proxima_data
        AND status NOT IN ('cancelado', 'reagendado')
    ) THEN
      -- Criar agendamento
      INSERT INTO public.agendamentos (
        cliente_id,
        tipo,
        data,
        horario_inicio,
        horario_fim_estimado,
        duracao_minutos,
        valor,
        recorrencia_id,
        e_recorrente
      ) VALUES (
        v_recorrencia.cliente_id,
        v_recorrencia.tipo_servico,
        v_proxima_data,
        v_recorrencia.horario_preferido,
        v_recorrencia.horario_preferido + (v_recorrencia.duracao_minutos || ' minutes')::INTERVAL,
        v_recorrencia.duracao_minutos,
        v_recorrencia.valor_com_desconto,
        v_recorrencia.id,
        TRUE
      );
      
      v_count := v_count + 1;
    END IF;
    
    -- Atualizar recorrência
    UPDATE public.recorrencias
    SET proximo_agendamento = v_proxima_data,
        total_agendamentos = total_agendamentos + 1
    WHERE id = v_recorrencia.id;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;
```

### 7.5 Dashboard stats

```sql
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_date DATE DEFAULT CURRENT_DATE)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'today', json_build_object(
      'cleanings', (
        SELECT COUNT(*) FROM public.agendamentos 
        WHERE data = p_date AND status NOT IN ('cancelado', 'reagendado')
      ),
      'revenue', (
        SELECT COALESCE(SUM(valor_final), 0) FROM public.agendamentos 
        WHERE data = p_date AND status = 'concluido'
      )
    ),
    'week', json_build_object(
      'cleanings', (
        SELECT COUNT(*) FROM public.agendamentos 
        WHERE data >= date_trunc('week', p_date) 
          AND data < date_trunc('week', p_date) + INTERVAL '7 days'
          AND status NOT IN ('cancelado', 'reagendado')
      ),
      'revenue', (
        SELECT COALESCE(SUM(valor_final), 0) FROM public.agendamentos 
        WHERE data >= date_trunc('week', p_date) 
          AND data < date_trunc('week', p_date) + INTERVAL '7 days'
          AND status = 'concluido'
      )
    ),
    'clients', json_build_object(
      'active', (SELECT COUNT(*) FROM public.clientes WHERE status = 'ativo'),
      'new_this_week', (
        SELECT COUNT(*) FROM public.clientes 
        WHERE created_at >= date_trunc('week', p_date)
      )
    ),
    'leads', json_build_object(
      'pending', (SELECT COUNT(*) FROM public.clientes WHERE status = 'lead')
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
```

### 7.6 Relatório financeiro mensal

```sql
CREATE OR REPLACE FUNCTION public.get_financial_report(
  p_year INTEGER,
  p_month INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_result JSON;
BEGIN
  v_start_date := make_date(p_year, p_month, 1);
  v_end_date := (v_start_date + INTERVAL '1 month')::DATE;
  
  SELECT json_build_object(
    'period', json_build_object(
      'year', p_year,
      'month', p_month,
      'start_date', v_start_date,
      'end_date', v_end_date - 1
    ),
    'revenue', json_build_object(
      'total', (
        SELECT COALESCE(SUM(valor), 0) FROM public.financeiro 
        WHERE tipo = 'receita' AND data >= v_start_date AND data < v_end_date
      ),
      'by_category', (
        SELECT json_agg(json_build_object('categoria', categoria, 'total', total))
        FROM (
          SELECT categoria, SUM(valor) as total 
          FROM public.financeiro 
          WHERE tipo = 'receita' AND data >= v_start_date AND data < v_end_date
          GROUP BY categoria ORDER BY total DESC
        ) sub
      )
    ),
    'costs', json_build_object(
      'total', (
        SELECT COALESCE(SUM(valor), 0) FROM public.financeiro 
        WHERE tipo = 'custo' AND data >= v_start_date AND data < v_end_date
      ),
      'by_category', (
        SELECT json_agg(json_build_object('categoria', categoria, 'total', total))
        FROM (
          SELECT categoria, SUM(valor) as total 
          FROM public.financeiro 
          WHERE tipo = 'custo' AND data >= v_start_date AND data < v_end_date
          GROUP BY categoria ORDER BY total DESC
        ) sub
      )
    ),
    'profit', (
      SELECT COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE -valor END), 0)
      FROM public.financeiro 
      WHERE data >= v_start_date AND data < v_end_date
    ),
    'services', json_build_object(
      'total', (
        SELECT COUNT(*) FROM public.agendamentos 
        WHERE data >= v_start_date AND data < v_end_date AND status = 'concluido'
      ),
      'by_type', (
        SELECT json_agg(json_build_object('tipo', tipo, 'count', count, 'revenue', revenue))
        FROM (
          SELECT tipo, COUNT(*) as count, SUM(valor_final) as revenue
          FROM public.agendamentos 
          WHERE data >= v_start_date AND data < v_end_date AND status = 'concluido'
          GROUP BY tipo ORDER BY count DESC
        ) sub
      )
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
```

---

## 8. TRIGGERS

### 8.1 Trigger updated_at

```sql
-- Aplicar trigger de updated_at em todas as tabelas relevantes
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.agendamentos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.recorrencias
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.contratos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.financeiro
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.precos_base
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

### 8.2 Trigger criar transação financeira ao concluir agendamento

```sql
CREATE OR REPLACE FUNCTION public.handle_agendamento_concluido()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas quando status muda para 'concluido'
  IF NEW.status = 'concluido' AND OLD.status != 'concluido' THEN
    -- Criar registro financeiro de receita
    INSERT INTO public.financeiro (
      cliente_id,
      agendamento_id,
      tipo,
      valor,
      categoria,
      descricao,
      data
    ) VALUES (
      NEW.cliente_id,
      NEW.id,
      'receita',
      NEW.valor_final,
      NEW.tipo,
      'Serviço concluído',
      NEW.data
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_agendamento_concluido
  AFTER UPDATE ON public.agendamentos
  FOR EACH ROW EXECUTE FUNCTION public.handle_agendamento_concluido();
```

### 8.3 Trigger atualizar status do cliente

```sql
CREATE OR REPLACE FUNCTION public.handle_cliente_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando primeiro serviço é agendado, mudar de lead para ativo
  IF NEW.status = 'agendado' AND NEW.tipo != 'visit' THEN
    UPDATE public.clientes
    SET status = 'ativo',
        data_primeiro_servico = COALESCE(data_primeiro_servico, NEW.data)
    WHERE id = NEW.cliente_id AND status = 'lead';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_primeiro_agendamento
  AFTER INSERT ON public.agendamentos
  FOR EACH ROW EXECUTE FUNCTION public.handle_cliente_status();
```

---

## 9. VIEWS

### 9.1 Agenda do dia

```sql
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
  c.id as cliente_id,
  c.nome as cliente_nome,
  c.telefone as cliente_telefone,
  c.endereco_completo as cliente_endereco,
  c.bedrooms,
  c.bathrooms,
  c.acesso_tipo,
  c.acesso_instrucoes,
  c.pets_detalhes
FROM public.agendamentos a
JOIN public.clientes c ON a.cliente_id = c.id
WHERE a.data = CURRENT_DATE
  AND a.status NOT IN ('cancelado', 'reagendado')
ORDER BY a.horario_inicio;
```

### 9.2 Clientes inativos

```sql
CREATE OR REPLACE VIEW public.v_clientes_inativos AS
SELECT 
  c.*,
  (SELECT MAX(a.data) FROM public.agendamentos a WHERE a.cliente_id = c.id AND a.status = 'concluido') as ultimo_servico,
  CURRENT_DATE - (SELECT MAX(a.data) FROM public.agendamentos a WHERE a.cliente_id = c.id AND a.status = 'concluido') as dias_inativo
FROM public.clientes c
WHERE c.status = 'ativo'
  AND NOT EXISTS (
    SELECT 1 FROM public.agendamentos a 
    WHERE a.cliente_id = c.id 
      AND a.data >= CURRENT_DATE
      AND a.status NOT IN ('cancelado', 'reagendado')
  )
  AND (
    SELECT MAX(a.data) FROM public.agendamentos a 
    WHERE a.cliente_id = c.id AND a.status = 'concluido'
  ) < CURRENT_DATE - INTERVAL '30 days';
```

### 9.3 Resumo mensal

```sql
CREATE OR REPLACE VIEW public.v_resumo_mensal AS
SELECT 
  date_trunc('month', data) as mes,
  COUNT(*) FILTER (WHERE tipo = 'receita') as total_receitas,
  COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita'), 0) as valor_receitas,
  COUNT(*) FILTER (WHERE tipo = 'custo') as total_custos,
  COALESCE(SUM(valor) FILTER (WHERE tipo = 'custo'), 0) as valor_custos,
  COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE -valor END), 0) as lucro
FROM public.financeiro
GROUP BY date_trunc('month', data)
ORDER BY mes DESC;
```

---

## 10. SEEDS (DADOS INICIAIS)

### 10.1 Configurações padrão

```sql
INSERT INTO public.configuracoes (chave, valor, descricao) VALUES
  ('empresa_nome', '"Caroline Premium Cleaning"', 'Nome da empresa'),
  ('empresa_telefone', '"(305) 555-1234"', 'Telefone principal'),
  ('empresa_email', '"hello@carolinecleaning.com"', 'Email principal'),
  ('empresa_endereco', '"500 Main St, Miami, FL 33139"', 'Endereço base'),
  
  ('horario_inicio', '"08:00"', 'Hora de início do expediente'),
  ('horario_fim', '"18:00"', 'Hora de fim do expediente'),
  ('buffer_deslocamento', '60', 'Minutos de buffer entre serviços'),
  
  ('dias_trabalho', '["monday","tuesday","wednesday","thursday","friday","saturday"]', 'Dias de trabalho'),
  
  ('desconto_weekly', '15', 'Desconto % para frequência semanal'),
  ('desconto_biweekly', '10', 'Desconto % para frequência quinzenal'),
  ('desconto_monthly', '5', 'Desconto % para frequência mensal'),
  
  ('promo_primeira_deep', '20', 'Desconto % na primeira deep cleaning'),
  
  ('fee_cancelamento_24h', '50', 'Taxa de cancelamento com menos de 24h'),
  ('fee_no_show', '50', 'Taxa de no-show'),
  
  ('google_review_url', '"https://g.page/r/xxx/review"', 'Link para deixar review no Google');
```

### 10.2 Áreas atendidas

```sql
INSERT INTO public.areas_atendidas (nome, cidade, estado, zip_codes, ativo, ordem) VALUES
  ('Miami', 'Miami', 'FL', ARRAY['33101','33102','33125','33126','33127','33128','33129','33130','33131','33132','33133','33134','33135','33136','33137','33138','33139','33140','33141','33142','33143','33144','33145','33146','33147','33149','33150','33151','33152','33153','33154','33155','33156','33157','33158','33161','33162','33163','33164','33165','33166','33167','33168','33169','33170','33172','33173','33174','33175','33176','33177','33178','33179','33180','33181','33182','33183','33184','33185','33186','33187','33188','33189','33190','33193','33194','33196','33197'], TRUE, 1),
  ('Miami Beach', 'Miami Beach', 'FL', ARRAY['33109','33119','33139','33140','33141','33154'], TRUE, 2),
  ('Coral Gables', 'Coral Gables', 'FL', ARRAY['33114','33124','33134','33143','33144','33145','33146','33156','33158'], TRUE, 3),
  ('Brickell', 'Miami', 'FL', ARRAY['33129','33130','33131'], TRUE, 4),
  ('Coconut Grove', 'Miami', 'FL', ARRAY['33133','33146'], TRUE, 5);
```

### 10.3 Tipos de serviço

```sql
INSERT INTO public.servicos_tipos (codigo, nome, descricao, multiplicador_preco, duracao_base_minutos, cor, icone, ativo, disponivel_agendamento_online, ordem) VALUES
  ('visit', 'Estimate Visit', 'Visita gratuita para orçamento', 0, 30, '#9ca3af', 'clipboard-list', TRUE, TRUE, 0),
  ('regular', 'Regular Cleaning', 'Limpeza padrão de manutenção', 1.0, 180, '#22c55e', 'sparkles', TRUE, TRUE, 1),
  ('deep', 'Deep Cleaning', 'Limpeza profunda completa', 1.5, 300, '#eab308', 'sparkles', TRUE, TRUE, 2),
  ('move_in_out', 'Move-in/Move-out', 'Limpeza para mudança', 1.75, 360, '#3b82f6', 'home', TRUE, TRUE, 3),
  ('office', 'Office Cleaning', 'Limpeza comercial/escritório', 1.0, 180, '#a855f7', 'building', TRUE, FALSE, 4),
  ('airbnb', 'Airbnb Turnover', 'Limpeza entre hóspedes', 1.1, 180, '#f97316', 'key', TRUE, FALSE, 5);
```

### 10.4 Add-ons

```sql
INSERT INTO public.addons (codigo, nome, descricao, preco, tipo_cobranca, unidade, minutos_adicionais, ativo, ordem) VALUES
  ('inside_oven', 'Inside Oven', 'Limpeza interna do forno', 35.00, 'fixo', NULL, 30, TRUE, 1),
  ('inside_fridge', 'Inside Refrigerator', 'Limpeza interna da geladeira', 35.00, 'fixo', NULL, 30, TRUE, 2),
  ('interior_windows', 'Interior Windows', 'Limpeza de janelas internas', 5.00, 'por_unidade', 'window', 5, TRUE, 3),
  ('laundry', 'Laundry', 'Lavar, secar e dobrar roupas', 30.00, 'por_unidade', 'load', 60, TRUE, 4),
  ('organizing', 'Organizing/Decluttering', 'Organização de ambientes', 40.00, 'por_hora', 'hour', 60, TRUE, 5),
  ('inside_cabinets', 'Inside Cabinets', 'Limpeza interna de armários', 25.00, 'por_unidade', 'room', 20, TRUE, 6),
  ('baseboards', 'Baseboards Detail', 'Limpeza detalhada de rodapés', 25.00, 'fixo', NULL, 30, TRUE, 7),
  ('garage', 'Garage Sweep', 'Varrer garagem', 40.00, 'fixo', NULL, 30, TRUE, 8);
```

### 10.5 Tabela de preços base

```sql
INSERT INTO public.precos_base (bedrooms, bathrooms, preco_minimo, preco_maximo, duracao_minutos) VALUES
  (1, 1.0, 120, 140, 120),
  (1, 1.5, 130, 150, 130),
  (2, 1.0, 140, 160, 150),
  (2, 1.5, 145, 165, 160),
  (2, 2.0, 150, 170, 170),
  (3, 1.0, 160, 180, 170),
  (3, 1.5, 170, 190, 180),
  (3, 2.0, 180, 200, 190),
  (3, 2.5, 190, 210, 200),
  (4, 2.0, 200, 230, 220),
  (4, 2.5, 210, 240, 230),
  (4, 3.0, 220, 250, 240),
  (5, 2.5, 250, 290, 270),
  (5, 3.0, 270, 320, 300),
  (5, 3.5, 290, 340, 320);
```

---

## 11. MIGRAÇÕES

### Ordem de execução

Execute os scripts na seguinte ordem:

1. **01_extensions.sql** - Extensões necessárias
2. **02_types.sql** - Enums e tipos customizados
3. **03_tables.sql** - Criação das tabelas
4. **04_indexes.sql** - Índices
5. **05_functions.sql** - Funções
6. **06_triggers.sql** - Triggers
7. **07_views.sql** - Views
8. **08_rls.sql** - Row Level Security
9. **09_seeds.sql** - Dados iniciais

### Script completo de migração

```sql
-- ================================================
-- CAROLINE PREMIUM CLEANING - SCHEMA COMPLETO
-- Execute este script no SQL Editor do Supabase
-- ================================================

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
-- (incluir todas as CREATE TABLE definidas acima)

-- 4. ÍNDICES
-- (incluir todos os CREATE INDEX definidos acima)

-- 5. TRIGGERS
-- (incluir todos os CREATE TRIGGER definidos acima)

-- 6. FUNÇÕES
-- (incluir todas as funções definidas acima)

-- 7. VIEWS
-- (incluir todas as views definidas acima)

-- 8. RLS
-- (incluir todas as políticas de RLS definidas acima)

-- 9. SEEDS
-- (incluir todos os INSERTs de dados iniciais)

-- FIM
```

---

## STORAGE (SUPABASE STORAGE)

### Buckets necessários

```sql
-- Bucket para contratos (PDFs)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('contratos', 'contratos', false);

-- Bucket para fotos de serviço (opcional)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('fotos-servico', 'fotos-servico', false);

-- Políticas de acesso
CREATE POLICY "Authenticated users can upload contracts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'contratos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view contracts"
ON storage.objects FOR SELECT
USING (bucket_id = 'contratos' AND auth.role() = 'authenticated');
```

---

**— FIM DO SCHEMA SUPABASE —**

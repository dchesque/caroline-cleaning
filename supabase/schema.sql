/* ============================================
   Chesque PREMIUM CLEANING
   SCHEMA COMPLETO - FASE 3 (ATUALIZADO)
   ============================================ */

/* 1. EXTENSÕES */
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

/* 2. FUNÇÕES AUXILIARES */
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

/* 3. TABELAS CORE */

/* TABELA: clientes */
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT,
  endereco_completo TEXT,  /* Pode ser NULL para leads iniciais. OBRIGATÓRIO antes de criar agendamentos. */
  endereco_linha2 TEXT,
  cidade TEXT,
  estado TEXT DEFAULT 'NC',
  zip_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  bedrooms INTEGER,
  bathrooms DECIMAL(3, 1),
  square_feet INTEGER,
  tipo_residencia TEXT DEFAULT 'house' CHECK (tipo_residencia IN ('house', 'apartment', 'condo', 'townhouse', 'other')),
  tipo_servico_padrao TEXT DEFAULT 'regular' CHECK (tipo_servico_padrao IN ('regular', 'deep', 'move_in_out', 'office', 'airbnb')),
  frequencia TEXT CHECK (frequencia IN ('weekly', 'biweekly', 'monthly', 'one_time')),
  valor_servico DECIMAL(10, 2),
  dia_preferido TEXT CHECK (dia_preferido IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  horario_preferido TIME,
  acesso_tipo TEXT CHECK (acesso_tipo IN ('client_home', 'garage_code', 'lockbox', 'key_hidden', 'doorman', 'other')),
  acesso_instrucoes TEXT,
  acesso_codigo TEXT,
  tem_pets BOOLEAN DEFAULT FALSE,
  pets_detalhes TEXT,
  contrato_id UUID,
  origem TEXT CHECK (origem IN ('google', 'facebook', 'instagram', 'referral', 'website', 'other')),
  origem_detalhe TEXT,
  referido_por UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  data_primeiro_contato DATE DEFAULT CURRENT_DATE,
  data_primeiro_servico DATE,
  data_aniversario DATE,
  status TEXT DEFAULT 'lead' CHECK (status IN ('lead', 'ativo', 'pausado', 'cancelado', 'inativo')),
  motivo_cancelamento TEXT,
  data_cancelamento DATE,
  notas TEXT,
  notas_internas TEXT,
  session_id_origem VARCHAR,
  canal_preferencia TEXT DEFAULT 'sms',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

/* TABELA: recorrencias */
CREATE TABLE public.recorrencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  frequencia TEXT NOT NULL CHECK (frequencia IN ('weekly', 'biweekly', 'monthly')),
  dia_preferido TEXT NOT NULL CHECK (dia_preferido IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  horario TIME NOT NULL,
  tipo_servico TEXT NOT NULL DEFAULT 'regular' CHECK (tipo_servico IN ('regular', 'deep', 'move_in_out', 'office', 'airbnb')),
  duracao_minutos INTEGER DEFAULT 180,
  valor DECIMAL(10, 2) NOT NULL,
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE,
  proximo_agendamento DATE,
  ultimo_agendamento DATE,
  total_agendamentos INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  motivo_pausa TEXT,
  data_pausa DATE,
  dias_semana TEXT[] DEFAULT ARRAY['monday'],
  servicos_por_dia JSONB DEFAULT '[]'::jsonb,
  addons_selecionados TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

/* TABELA: agendamentos */
CREATE TABLE public.agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('visit', 'regular', 'deep', 'move_in_out', 'office', 'airbnb')),
  data DATE NOT NULL,
  horario_inicio TIME NOT NULL,
  horario_fim_estimado TIME,
  duracao_minutos INTEGER DEFAULT 180,
  valor DECIMAL(10, 2),
  valor_addons DECIMAL(10, 2) DEFAULT 0,
  desconto_percentual DECIMAL(5, 2) DEFAULT 0,
  valor_final DECIMAL(10, 2) GENERATED ALWAYS AS (
    ROUND((COALESCE(valor, 0) + COALESCE(valor_addons, 0)) * (1 - COALESCE(desconto_percentual, 0) / 100), 2)
  ) STORED,
  addons JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'agendado' CHECK (status IN ('agendado', 'confirmado', 'em_andamento', 'concluido', 'cancelado', 'no_show', 'reagendado')),
  recorrencia_id UUID REFERENCES public.recorrencias(id) ON DELETE SET NULL,
  e_recorrente BOOLEAN DEFAULT FALSE,
  checklist JSONB DEFAULT '{"sala": false, "quartos": false, "banheiros": false, "cozinha": false, "areas_comuns": false}'::jsonb,
  hora_chegada TIME,
  hora_saida TIME,
  duracao_real_minutos INTEGER,
  notas TEXT,
  notas_internas TEXT,
  motivo_cancelamento TEXT,
  reagendado_de UUID REFERENCES public.agendamentos(id) ON DELETE SET NULL,
  reagendado_para UUID,
  lembrete_24h_enviado BOOLEAN DEFAULT FALSE,
  lembrete_30min_enviado BOOLEAN DEFAULT FALSE,
  confirmacao_enviada BOOLEAN DEFAULT FALSE,
  canal_preferencia TEXT DEFAULT 'sms',
  origem TEXT DEFAULT 'admin' CHECK (origem IN ('admin', 'chat_carol', 'recurrence', 'api')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

/* TABELA: contratos */
CREATE TABLE public.contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  numero TEXT UNIQUE,
  documento_url TEXT,
  documento_path TEXT,
  tipo_servico TEXT NOT NULL CHECK (tipo_servico IN ('regular', 'deep', 'move_in_out', 'office', 'airbnb')),
  frequencia TEXT CHECK (frequencia IN ('weekly', 'biweekly', 'monthly', 'one_time')),
  valor_acordado DECIMAL(10, 2) NOT NULL,
  desconto_percentual DECIMAL(5, 2) DEFAULT 0,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  renovacao_automatica BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviado', 'assinado', 'cancelado', 'expirado')),
  data_assinatura TIMESTAMPTZ,
  ip_assinatura TEXT,
  assinatura_digital TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

/* Atualizar FK de contrato em clientes */
ALTER TABLE public.clientes 
ADD CONSTRAINT fk_clientes_contrato 
FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE SET NULL;

/* TABELA: financeiro */
CREATE TABLE public.financeiro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  agendamento_id UUID REFERENCES public.agendamentos(id) ON DELETE SET NULL,
  contrato_id UUID REFERENCES public.contratos(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'custo')),
  categoria TEXT NOT NULL,
  subcategoria TEXT,
  descricao TEXT,
  valor DECIMAL(10, 2) NOT NULL,
  forma_pagamento TEXT CHECK (forma_pagamento IN ('cash', 'zelle', 'check', 'card', 'other')),
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  data_pagamento DATE,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado', 'reembolsado')),
  referencia_externa TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

/* TABELA: mensagens_chat */
CREATE TABLE public.mensagens_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  intent TEXT,
  entities JSONB DEFAULT '{}'::jsonb,
  confidence DECIMAL(3, 2),
  tool_calls JSONB DEFAULT '[]'::jsonb,
  tool_results JSONB DEFAULT '[]'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  source VARCHAR DEFAULT 'website',
  intent_detected VARCHAR,
  intent_confidence DECIMAL(3, 2),
  metadata JSONB DEFAULT '{}'::jsonb,
  execution_logs TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

/* TABELA: feedback */
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agendamento_id UUID NOT NULL REFERENCES public.agendamentos(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comentario TEXT,
  rating_pontualidade INTEGER CHECK (rating_pontualidade >= 1 AND rating_pontualidade <= 5),
  rating_qualidade INTEGER CHECK (rating_qualidade >= 1 AND rating_qualidade <= 5),
  rating_comunicacao INTEGER CHECK (rating_comunicacao >= 1 AND rating_comunicacao <= 5),
  google_review_solicitado BOOLEAN DEFAULT FALSE,
  google_review_deixado BOOLEAN DEFAULT FALSE,
  acao_tomada TEXT,
  respondido_em TIMESTAMPTZ,
  origem TEXT DEFAULT 'sms' CHECK (origem IN ('sms', 'email', 'app', 'manual')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

/* TABELA: configuracoes */
CREATE TABLE public.configuracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT NOT NULL UNIQUE,
  valor JSONB NOT NULL,
  descricao TEXT,
  categoria TEXT DEFAULT 'geral' CHECK (categoria IN ('geral', 'horarios', 'precos', 'notificacoes', 'integracao')),
  grupo TEXT DEFAULT 'empresa',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

/* TABELA: areas_atendidas */
CREATE TABLE public.areas_atendidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'NC',
  zip_codes TEXT[] DEFAULT '{}',
  ativo BOOLEAN DEFAULT TRUE,
  taxa_deslocamento DECIMAL(10, 2) DEFAULT 0,
  tempo_deslocamento_minutos INTEGER DEFAULT 0,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

/* TABELA: servicos_tipos */
CREATE TABLE public.servicos_tipos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  descricao TEXT,
  multiplicador_preco DECIMAL(4, 2) DEFAULT 1.0,
  duracao_base_minutos INTEGER DEFAULT 180,
  cor TEXT,
  icone TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  disponivel_agendamento_online BOOLEAN DEFAULT TRUE,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

/* TABELA: addons */
CREATE TABLE public.addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco DECIMAL(10, 2) NOT NULL,
  tipo_cobranca TEXT DEFAULT 'fixo' CHECK (tipo_cobranca IN ('fixo', 'por_unidade', 'por_hora')),
  unidade TEXT,
  minutos_adicionais INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

/* TABELA: equipe */
CREATE TABLE public.equipe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  cargo TEXT DEFAULT 'cleaner',
  foto_url TEXT,
  cor TEXT DEFAULT '#C48B7F',
  ativo BOOLEAN DEFAULT TRUE,
  data_admissao DATE DEFAULT CURRENT_DATE,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

/* TABELA: agendamento_equipe */
CREATE TABLE public.agendamento_equipe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agendamento_id UUID NOT NULL REFERENCES public.agendamentos(id) ON DELETE CASCADE,
  membro_id UUID NOT NULL REFERENCES public.equipe(id) ON DELETE CASCADE,
  funcao TEXT DEFAULT 'cleaner',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

/* TABELA: user_profiles */
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'admin',
  avatar_url TEXT,
  language TEXT DEFAULT 'pt-BR',
  theme TEXT DEFAULT 'light',
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  notification_types JSONB DEFAULT '{"newLead": true, "lowRating": true, "newAppointment": true, "paymentReceived": true, "appointmentReminder": true}'::jsonb,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

/* TABELA: chat_sessions */
CREATE TABLE public.chat_sessions (
  id VARCHAR PRIMARY KEY,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  source VARCHAR DEFAULT 'website',
  status VARCHAR DEFAULT 'active',
  last_intent VARCHAR,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  contexto JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

/* TABELA: chat_logs */
CREATE TABLE public.chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  direction TEXT NOT NULL,
  message_content TEXT NOT NULL,
  state_before TEXT,
  state_after TEXT,
  llm_calls JSONB DEFAULT '[]'::jsonb,
  handlers_executed JSONB DEFAULT '[]'::jsonb,
  extracted_data JSONB DEFAULT '{}'::jsonb,
  context_snapshot JSONB DEFAULT '{}'::jsonb,
  errors JSONB DEFAULT '[]'::jsonb,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

/* TABELA: action_logs */
CREATE TABLE public.action_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id VARCHAR,
  action_type VARCHAR NOT NULL,
  params JSONB,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

/* TABELA: callbacks */
CREATE TABLE public.callbacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  session_id VARCHAR,
  telefone VARCHAR,
  horario_preferido VARCHAR,
  notas TEXT,
  status VARCHAR DEFAULT 'pending',
  atendido_por UUID,
  atendido_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

/* TABELA: orcamentos */
CREATE TABLE public.orcamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  session_id VARCHAR,
  tipo_servico VARCHAR,
  valor_estimado DECIMAL(10, 2),
  detalhes JSONB,
  status VARCHAR DEFAULT 'enviado',
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

/* TABELA: notificacoes */
CREATE TABLE public.notificacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  canal VARCHAR NOT NULL,
  destinatario VARCHAR NOT NULL,
  template VARCHAR,
  dados JSONB,
  status VARCHAR DEFAULT 'pending',
  enviado_em TIMESTAMPTZ,
  erro TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

/* TABELA: contact_leads */
CREATE TABLE public.contact_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  cidade TEXT,
  origem TEXT DEFAULT 'contact_form',
  pagina_origem TEXT,
  user_agent TEXT,
  ip_address TEXT,
  status TEXT DEFAULT 'novo',
  notas TEXT,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  contacted_at TIMESTAMPTZ,
  contacted_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

/* TABELA: tracking_events */
CREATE TABLE public.tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  event_id TEXT,
  user_email_hash TEXT,
  user_phone_hash TEXT,
  ip_address TEXT,
  user_agent TEXT,
  fbc TEXT,
  fbp TEXT,
  custom_data JSONB DEFAULT '{}'::jsonb,
  page_url TEXT,
  referrer TEXT,
  sent_to_meta BOOLEAN DEFAULT FALSE,
  sent_to_google BOOLEAN DEFAULT FALSE,
  sent_to_tiktok BOOLEAN DEFAULT FALSE,
  client_id UUID,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

/* TABELA: financeiro_categorias */
CREATE TABLE public.financeiro_categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  descricao TEXT,
  cor TEXT,
  icone TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

/* TABELA: pricing_config */
CREATE TABLE public.pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type TEXT NOT NULL,
  service_name TEXT NOT NULL,
  description TEXT,
  price_min DECIMAL(10, 2) NOT NULL,
  price_max DECIMAL(10, 2) NOT NULL,
  price_unit TEXT DEFAULT 'per visit',
  badge TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

/* TABELA: sistema_heartbeat */
CREATE TABLE public.sistema_heartbeat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

/* TABELA: precos_base */
CREATE TABLE public.precos_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bedrooms INTEGER NOT NULL,
  bathrooms DECIMAL(3, 1) NOT NULL,
  preco_minimo DECIMAL(10, 2) NOT NULL,
  preco_maximo DECIMAL(10, 2) NOT NULL,
  duracao_minutos INTEGER DEFAULT 180,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bedrooms, bathrooms)
);

/* 4. ÍNDICES */

/* CLIENTES */
CREATE INDEX idx_clientes_status ON public.clientes(status);
CREATE INDEX idx_clientes_telefone ON public.clientes(telefone);
CREATE INDEX idx_clientes_email ON public.clientes(email);
CREATE INDEX idx_clientes_zip_code ON public.clientes(zip_code);
CREATE INDEX idx_clientes_created_at ON public.clientes(created_at DESC);
CREATE INDEX idx_clientes_data_primeiro_contato ON public.clientes(data_primeiro_contato DESC);

/* AGENDAMENTOS */
CREATE INDEX idx_agendamentos_cliente_id ON public.agendamentos(cliente_id);
CREATE INDEX idx_agendamentos_data ON public.agendamentos(data);
CREATE INDEX idx_agendamentos_status ON public.agendamentos(status);
CREATE INDEX idx_agendamentos_tipo ON public.agendamentos(tipo);
CREATE INDEX idx_agendamentos_recorrencia_id ON public.agendamentos(recorrencia_id);
CREATE INDEX idx_agendamentos_data_status ON public.agendamentos(data, status);
CREATE INDEX idx_agendamentos_agenda_dia ON public.agendamentos(data, horario_inicio) 
WHERE status NOT IN ('cancelado', 'reagendado');

/* RECORRENCIAS */
CREATE INDEX idx_recorrencias_cliente_id ON public.recorrencias(cliente_id);
CREATE INDEX idx_recorrencias_ativo ON public.recorrencias(ativo);
CREATE INDEX idx_recorrencias_proximo ON public.recorrencias(proximo_agendamento) 
WHERE ativo = TRUE;

/* FINANCEIRO */
CREATE INDEX idx_financeiro_cliente_id ON public.financeiro(cliente_id);
CREATE INDEX idx_financeiro_agendamento_id ON public.financeiro(agendamento_id);
CREATE INDEX idx_financeiro_data ON public.financeiro(data DESC);
CREATE INDEX idx_financeiro_tipo ON public.financeiro(tipo);
CREATE INDEX idx_financeiro_status ON public.financeiro(status);

/* MENSAGENS CHAT */
CREATE INDEX idx_mensagens_session_id ON public.mensagens_chat(session_id);
CREATE INDEX idx_mensagens_cliente_id ON public.mensagens_chat(cliente_id);
CREATE INDEX idx_mensagens_created_at ON public.mensagens_chat(created_at DESC);

/* FEEDBACK */
CREATE INDEX idx_feedback_agendamento_id ON public.feedback(agendamento_id);
CREATE INDEX idx_feedback_cliente_id ON public.feedback(cliente_id);
CREATE INDEX idx_feedback_rating ON public.feedback(rating);

/* CONTRATOS */
CREATE INDEX idx_contratos_cliente_id ON public.contratos(cliente_id);
CREATE INDEX idx_contratos_status ON public.contratos(status);
CREATE INDEX idx_contratos_numero ON public.contratos(numero);

/* CONFIG */
CREATE INDEX idx_configuracoes_chave ON public.configuracoes(chave);
CREATE INDEX idx_configuracoes_categoria ON public.configuracoes(categoria);
CREATE INDEX idx_areas_ativo ON public.areas_atendidas(ativo);
CREATE INDEX idx_areas_zip_codes ON public.areas_atendidas USING GIN(zip_codes);
CREATE INDEX idx_servicos_codigo ON public.servicos_tipos(codigo);
CREATE INDEX idx_addons_codigo ON public.addons(codigo);

/* Índices tabelas adicionais */
CREATE INDEX idx_equipe_ativo ON public.equipe(ativo);
CREATE INDEX idx_agendamento_equipe_agendamento ON public.agendamento_equipe(agendamento_id);
CREATE INDEX idx_agendamento_equipe_membro ON public.agendamento_equipe(membro_id);
CREATE INDEX idx_chat_sessions_status ON public.chat_sessions(status);
CREATE INDEX idx_chat_sessions_cliente ON public.chat_sessions(cliente_id);
CREATE INDEX idx_chat_logs_session ON public.chat_logs(session_id);
CREATE INDEX idx_chat_logs_created ON public.chat_logs(created_at DESC);
CREATE INDEX idx_action_logs_session ON public.action_logs(session_id);
CREATE INDEX idx_callbacks_status ON public.callbacks(status);
CREATE INDEX idx_orcamentos_cliente ON public.orcamentos(cliente_id);
CREATE INDEX idx_notificacoes_status ON public.notificacoes(status);
CREATE INDEX idx_notificacoes_created ON public.notificacoes(created_at DESC);
CREATE INDEX idx_contact_leads_status ON public.contact_leads(status);
CREATE INDEX idx_tracking_events_event ON public.tracking_events(event_name);
CREATE INDEX idx_tracking_events_created ON public.tracking_events(created_at DESC);
CREATE INDEX idx_financeiro_categorias_tipo ON public.financeiro_categorias(tipo);
CREATE INDEX idx_pricing_config_active ON public.pricing_config(is_active);

/* 5. FUNÇÕES DE NEGÓCIO */

/* FUNÇÃO: get_available_slots */
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
  v_slot_fim TIME;
  v_has_conflict BOOLEAN;
BEGIN
  /* Buscar configurações */
  SELECT 
    (valor::TEXT)::TIME,
    (SELECT valor::TEXT FROM public.configuracoes WHERE chave = 'horario_fim')::TIME,
    (SELECT (valor::TEXT)::INTEGER FROM public.configuracoes WHERE chave = 'buffer_deslocamento')
  INTO v_horario_inicio, v_horario_fim, v_buffer_minutos
  FROM public.configuracoes 
  WHERE chave = 'horario_inicio';
  
  v_horario_inicio := COALESCE(v_horario_inicio, '08:00'::TIME);
  v_horario_fim := COALESCE(v_horario_fim, '18:00'::TIME);
  v_buffer_minutos := COALESCE(v_buffer_minutos, 30);
  
  v_slot_atual := v_horario_inicio;
  
  WHILE v_slot_atual + (p_duracao_minutos || ' minutes')::INTERVAL <= v_horario_fim LOOP
    v_slot_fim := (v_slot_atual + (p_duracao_minutos || ' minutes')::INTERVAL)::TIME;
    
    SELECT EXISTS (
      SELECT 1 
      FROM public.agendamentos a
      WHERE a.data = p_data
        AND a.status NOT IN ('cancelado', 'reagendado')
        AND (
          (v_slot_atual >= a.horario_inicio AND v_slot_atual < a.horario_fim_estimado)
          OR
          (v_slot_fim > a.horario_inicio AND v_slot_fim <= a.horario_fim_estimado)
          OR
          (v_slot_atual <= a.horario_inicio AND v_slot_fim >= a.horario_fim_estimado)
          OR
          (a.horario_inicio >= v_slot_atual - (v_buffer_minutos || ' minutes')::INTERVAL 
           AND a.horario_inicio < v_slot_fim + (v_buffer_minutos || ' minutes')::INTERVAL)
        )
    ) INTO v_has_conflict;
    
    RETURN QUERY SELECT v_slot_atual, v_slot_fim, NOT v_has_conflict;
    
    v_slot_atual := v_slot_atual + '1 hour'::INTERVAL;
  END LOOP;
  RETURN;
END;
$$ LANGUAGE plpgsql;

/* FUNÇÃO: calculate_next_recurrence */
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
  CASE p_frequencia
    WHEN 'weekly' THEN v_proxima_data := p_ultima_data + INTERVAL '7 days';
    WHEN 'biweekly' THEN v_proxima_data := p_ultima_data + INTERVAL '14 days';
    WHEN 'monthly' THEN v_proxima_data := p_ultima_data + INTERVAL '1 month';
    ELSE RETURN NULL;
  END CASE;
  
  v_dia_semana := (v_dias_map ->> p_dia_preferido)::INTEGER;
  
  WHILE EXTRACT(DOW FROM v_proxima_data) != v_dia_semana LOOP
    v_proxima_data := v_proxima_data + INTERVAL '1 day';
  END LOOP;
  
  RETURN v_proxima_data;
END;
$$ LANGUAGE plpgsql;

/* FUNÇÃO: update_cliente_status */
CREATE OR REPLACE FUNCTION public.update_cliente_status()
RETURNS TRIGGER AS $$
DECLARE
  v_ultimo_servico DATE;
  v_tem_recorrencia_ativa BOOLEAN;
  v_tem_agendamento_futuro BOOLEAN;
BEGIN
  SELECT MAX(data) INTO v_ultimo_servico
  FROM public.agendamentos
  WHERE cliente_id = NEW.cliente_id AND status = 'concluido';
  
  SELECT EXISTS(SELECT 1 FROM public.recorrencias WHERE cliente_id = NEW.cliente_id AND ativo = TRUE) INTO v_tem_recorrencia_ativa;
  
  SELECT EXISTS(SELECT 1 FROM public.agendamentos WHERE cliente_id = NEW.cliente_id AND data >= CURRENT_DATE AND status NOT IN ('cancelado', 'reagendado')) INTO v_tem_agendamento_futuro;
  
  UPDATE public.clientes
  SET status = CASE
    WHEN v_ultimo_servico IS NOT NULL AND (v_tem_recorrencia_ativa OR v_tem_agendamento_futuro) THEN 'ativo'
    WHEN v_ultimo_servico IS NOT NULL AND v_ultimo_servico < CURRENT_DATE - INTERVAL '90 days' THEN 'inativo'
    WHEN v_ultimo_servico IS NOT NULL AND NOT v_tem_recorrencia_ativa AND NOT v_tem_agendamento_futuro THEN 'ativo'
    ELSE status
  END,
  data_primeiro_servico = COALESCE(data_primeiro_servico, v_ultimo_servico)
  WHERE id = NEW.cliente_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

/* FUNÇÃO: generate_contract_number */
CREATE OR REPLACE FUNCTION public.generate_contract_number()
RETURNS TRIGGER AS $$
DECLARE
  v_ano TEXT;
  v_sequencia INTEGER;
  v_numero TEXT;
BEGIN
  v_ano := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SPLIT_PART(numero, '-', 2) AS INTEGER)), 0) + 1 INTO v_sequencia
  FROM public.contratos WHERE numero LIKE 'CPC-' || v_ano || '-%';
  v_numero := 'CPC-' || v_ano || '-' || LPAD(v_sequencia::TEXT, 4, '0');
  NEW.numero := v_numero;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

/* FUNÇÃO: check_zip_code_coverage */
CREATE OR REPLACE FUNCTION public.check_zip_code_coverage(p_zip_code TEXT)
RETURNS TABLE (
  atendido BOOLEAN,
  area_id UUID,
  area_nome TEXT,
  taxa_deslocamento DECIMAL(10, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT TRUE, a.id, a.nome, a.taxa_deslocamento
  FROM public.areas_atendidas a
  WHERE a.ativo = TRUE AND p_zip_code = ANY(a.zip_codes)
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::DECIMAL(10,2);
  END IF;
END;
$$ LANGUAGE plpgsql;

/* FUNÇÃO: calculate_service_price */
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
  SELECT pb.preco_minimo, pb.preco_maximo, pb.duracao_minutos INTO v_preco_base_min, v_preco_base_max, v_duracao
  FROM public.precos_base pb WHERE pb.bedrooms = p_bedrooms AND pb.bathrooms = p_bathrooms;
  
  IF v_preco_base_min IS NULL THEN
    v_preco_base_min := 120 + (p_bedrooms * 30) + (p_bathrooms * 20);
    v_preco_base_max := v_preco_base_min + 40;
    v_duracao := 120 + (p_bedrooms * 30) + (p_bathrooms::INTEGER * 15);
  END IF;
  
  SELECT COALESCE(st.multiplicador_preco, 1.0), COALESCE(st.duracao_base_minutos, v_duracao) INTO v_multiplicador, v_duracao
  FROM public.servicos_tipos st WHERE st.codigo = p_tipo_servico;
  v_multiplicador := COALESCE(v_multiplicador, 1.0);
  
  v_desconto := CASE p_frequencia
    WHEN 'weekly' THEN (SELECT (valor::TEXT)::DECIMAL FROM public.configuracoes WHERE chave = 'desconto_weekly')
    WHEN 'biweekly' THEN (SELECT (valor::TEXT)::DECIMAL FROM public.configuracoes WHERE chave = 'desconto_biweekly')
    WHEN 'monthly' THEN (SELECT (valor::TEXT)::DECIMAL FROM public.configuracoes WHERE chave = 'desconto_monthly')
    ELSE 0
  END;
  v_desconto := COALESCE(v_desconto, 0);
  
  RETURN QUERY SELECT
    ROUND(v_preco_base_min * v_multiplicador * (1 - v_desconto / 100), 2),
    ROUND(v_preco_base_max * v_multiplicador * (1 - v_desconto / 100), 2),
    ROUND(((v_preco_base_min + v_preco_base_max) / 2) * v_multiplicador * (1 - v_desconto / 100), 2),
    ROUND(v_duracao * v_multiplicador)::INTEGER;
END;
$$ LANGUAGE plpgsql;

/* 6. TRIGGERS */

CREATE TRIGGER set_updated_at_clientes BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_agendamentos BEFORE UPDATE ON public.agendamentos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_recorrencias BEFORE UPDATE ON public.recorrencias FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_contratos BEFORE UPDATE ON public.contratos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_financeiro BEFORE UPDATE ON public.financeiro FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_configuracoes BEFORE UPDATE ON public.configuracoes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_areas BEFORE UPDATE ON public.areas_atendidas FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_servicos BEFORE UPDATE ON public.servicos_tipos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_addons BEFORE UPDATE ON public.addons FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_precos BEFORE UPDATE ON public.precos_base FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER generate_contract_number_trigger BEFORE INSERT ON public.contratos FOR EACH ROW WHEN (NEW.numero IS NULL) EXECUTE FUNCTION public.generate_contract_number();
CREATE TRIGGER update_cliente_status_trigger AFTER INSERT OR UPDATE OF status ON public.agendamentos FOR EACH ROW EXECUTE FUNCTION public.update_cliente_status();

CREATE TRIGGER set_updated_at_equipe BEFORE UPDATE ON public.equipe FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_user_profiles BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_contact_leads BEFORE UPDATE ON public.contact_leads FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_financeiro_categorias BEFORE UPDATE ON public.financeiro_categorias FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_pricing_config BEFORE UPDATE ON public.pricing_config FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

/* 7. VIEWS */

CREATE OR REPLACE VIEW public.v_agenda_hoje AS
SELECT a.id, a.data, a.horario_inicio, a.horario_fim_estimado, a.tipo, a.status, a.valor_final, a.notas, a.e_recorrente,
  c.id AS cliente_id, c.nome AS cliente_nome, c.telefone AS cliente_telefone, c.endereco_completo AS cliente_endereco,
  c.bedrooms, c.bathrooms, c.acesso_tipo, c.acesso_instrucoes, c.acesso_codigo, c.tem_pets, c.pets_detalhes,
  st.nome AS tipo_servico_nome, st.cor AS tipo_servico_cor
FROM public.agendamentos a
JOIN public.clientes c ON a.cliente_id = c.id
LEFT JOIN public.servicos_tipos st ON a.tipo = st.codigo
WHERE a.data = CURRENT_DATE AND a.status NOT IN ('cancelado', 'reagendado')
ORDER BY a.horario_inicio;

CREATE OR REPLACE VIEW public.v_clientes_inativos AS
SELECT c.*,
  (SELECT MAX(a.data) FROM public.agendamentos a WHERE a.cliente_id = c.id AND a.status = 'concluido') AS ultimo_servico,
  CURRENT_DATE - (SELECT MAX(a.data) FROM public.agendamentos a WHERE a.cliente_id = c.id AND a.status = 'concluido') AS dias_inativo
FROM public.clientes c
WHERE c.status = 'ativo' AND NOT EXISTS (
  SELECT 1 FROM public.agendamentos a WHERE a.cliente_id = c.id AND a.data >= CURRENT_DATE AND a.status NOT IN ('cancelado', 'reagendado')
) AND (SELECT MAX(a.data) FROM public.agendamentos a WHERE a.cliente_id = c.id AND a.status = 'concluido') < CURRENT_DATE - INTERVAL '30 days';

CREATE OR REPLACE VIEW public.v_resumo_mensal AS
SELECT DATE_TRUNC('month', data) AS mes,
  COUNT(*) FILTER (WHERE tipo = 'receita') AS total_receitas,
  COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita'), 0) AS valor_receitas,
  COUNT(*) FILTER (WHERE tipo = 'custo') AS total_custos,
  COALESCE(SUM(valor) FILTER (WHERE tipo = 'custo'), 0) AS valor_custos,
  COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita'), 0) - COALESCE(SUM(valor) FILTER (WHERE tipo = 'custo'), 0) AS lucro
FROM public.financeiro WHERE status != 'cancelado' GROUP BY DATE_TRUNC('month', data) ORDER BY mes DESC;

CREATE OR REPLACE VIEW public.v_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM public.agendamentos WHERE data = CURRENT_DATE AND status NOT IN ('cancelado', 'reagendado')) AS agendamentos_hoje,
  (SELECT COUNT(*) FROM public.agendamentos WHERE data = CURRENT_DATE AND status = 'confirmado') AS confirmados_hoje,
  (SELECT COUNT(*) FROM public.clientes WHERE status = 'lead' AND created_at >= DATE_TRUNC('week', CURRENT_DATE)) AS novos_leads_semana,
  (SELECT COUNT(*) FROM public.clientes WHERE status = 'ativo') AS clientes_ativos,
  (SELECT COALESCE(SUM(valor), 0) FROM public.financeiro WHERE tipo = 'receita' AND status = 'pago' AND DATE_TRUNC('month', data) = DATE_TRUNC('month', CURRENT_DATE)) AS receita_mes,
  (SELECT COALESCE(SUM(valor), 0) FROM public.financeiro WHERE tipo = 'receita' AND status = 'pago' AND DATE_TRUNC('month', data) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')) AS receita_mes_anterior,
  (SELECT ROUND(AVG(rating), 1) FROM public.feedback WHERE created_at >= CURRENT_DATE - INTERVAL '90 days') AS rating_medio;

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

/* 8. RLS */

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
ALTER TABLE public.equipe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamento_equipe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.callbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_config ENABLE ROW LEVEL SECURITY;

/* Policies - tabelas core */
CREATE POLICY "Authenticated users can do everything" ON public.clientes FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can do everything" ON public.agendamentos FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can do everything" ON public.recorrencias FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can do everything" ON public.contratos FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can do everything" ON public.financeiro FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can do everything" ON public.mensagens_chat FOR ALL TO authenticated USING (true);
CREATE POLICY "Anon can insert chat" ON public.mensagens_chat FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Authenticated users can do everything" ON public.feedback FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can do everything" ON public.configuracoes FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can do everything" ON public.areas_atendidas FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can do everything" ON public.servicos_tipos FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can do everything" ON public.addons FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can do everything" ON public.precos_base FOR ALL TO authenticated USING (true);

/* Policies - tabelas adicionais */
CREATE POLICY "Authenticated users can do everything" ON public.equipe FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can do everything" ON public.agendamento_equipe FOR ALL TO authenticated USING (true);
CREATE POLICY "Users manage own profile" ON public.user_profiles FOR ALL TO authenticated USING (auth.uid() = id);
CREATE POLICY "Authenticated users can do everything" ON public.chat_sessions FOR ALL TO authenticated USING (true);
CREATE POLICY "Anon can upsert chat sessions" ON public.chat_sessions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can do everything" ON public.chat_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "Anon can insert chat logs" ON public.chat_logs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Authenticated users can do everything" ON public.action_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "Anon can insert action logs" ON public.action_logs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Authenticated users can do everything" ON public.callbacks FOR ALL TO authenticated USING (true);
CREATE POLICY "Anon can insert callbacks" ON public.callbacks FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Authenticated users can do everything" ON public.orcamentos FOR ALL TO authenticated USING (true);
CREATE POLICY "Anon can insert orcamentos" ON public.orcamentos FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Authenticated users can do everything" ON public.notificacoes FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can do everything" ON public.contact_leads FOR ALL TO authenticated USING (true);
CREATE POLICY "Anon can insert contact leads" ON public.contact_leads FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Authenticated users can do everything" ON public.tracking_events FOR ALL TO authenticated USING (true);
CREATE POLICY "Anon can insert tracking events" ON public.tracking_events FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Authenticated users can do everything" ON public.financeiro_categorias FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can do everything" ON public.pricing_config FOR ALL TO authenticated USING (true);
CREATE POLICY "Public read pricing config" ON public.pricing_config FOR SELECT TO anon USING (is_active = true);

/* Public Read Policies */
CREATE POLICY "Public read areas" ON public.areas_atendidas FOR SELECT TO anon USING (ativo = true);
CREATE POLICY "Public read servicos" ON public.servicos_tipos FOR SELECT TO anon USING (ativo = true);
CREATE POLICY "Public read addons" ON public.addons FOR SELECT TO anon USING (ativo = true);
CREATE POLICY "Public read precos" ON public.precos_base FOR SELECT TO anon USING (true);

/* 10. STORAGE */

/* Bucket para contratos (PDFs) - Privado */
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contratos',
  'contratos',
  false,
  5242880, /* 5MB */
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

/* Bucket para fotos de serviço - Privado */
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fotos-servico',
  'fotos-servico',
  false,
  10485760, /* 10MB */
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

/* Bucket para assets públicos (logo, imagens do site) */
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-assets',
  'public-assets',
  true,
  5242880, /* 5MB */
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

/* POLÍTICAS DE STORAGE */

/* CONTRATOS */
CREATE POLICY "Authenticated users can upload contracts" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'contratos');
CREATE POLICY "Authenticated users can view contracts" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'contratos');
CREATE POLICY "Authenticated users can update contracts" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'contratos');
CREATE POLICY "Authenticated users can delete contracts" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'contratos');

/* FOTOS SERVIÇO */
CREATE POLICY "Authenticated users can upload fotos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'fotos-servico');
CREATE POLICY "Authenticated users can view fotos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'fotos-servico');

/* PUBLIC ASSETS */
CREATE POLICY "Anyone can view public assets" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'public-assets');
CREATE POLICY "Authenticated users can upload public assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'public-assets');

/* 9. SEEDS */

INSERT INTO public.configuracoes (chave, valor, descricao, categoria) VALUES
  ('empresa_nome', '"Chesque Premium Cleaning"', 'Nome da empresa', 'geral'),
  ('empresa_telefone', '"(551) 389-7394"', 'Telefone principal', 'geral'),
  ('empresa_email', '"hello@Chesquecleaning.com"', 'Email principal', 'geral'),
  ('horario_inicio', '"08:00"', 'Hora de início', 'horarios'),
  ('horario_fim', '"18:00"', 'Hora de fim', 'horarios'),
  ('buffer_deslocamento', '60', 'Buffer minutos', 'horarios')
ON CONFLICT (chave) DO NOTHING;

INSERT INTO public.areas_atendidas (nome, cidade, estado, zip_codes, ativo, ordem) VALUES
  ('Charlotte', 'Charlotte', 'NC', ARRAY['28201','28202','28203','28204','28205','28206','28207','28208','28209','28210','28211','28212','28213','28214','28215','28216','28217','28226','28227','28269','28270','28273','28277','28278'], TRUE, 1),
  ('Fort Mill', 'Fort Mill', 'SC', ARRAY['29707','29708','29715','29716'], TRUE, 2),
  ('Indian Land', 'Indian Land', 'SC', ARRAY['29707','29720'], TRUE, 3),
  ('Pineville', 'Pineville', 'NC', ARRAY['28134','28210'], TRUE, 4),
  ('Matthews', 'Matthews', 'NC', ARRAY['28104','28105','28106'], TRUE, 5)
ON CONFLICT DO NOTHING;

INSERT INTO public.servicos_tipos (codigo, nome, descricao, multiplicador_preco, duracao_base_minutos, cor) VALUES
  ('regular', 'Regular Cleaning', 'Maintenance cleaning', 1.0, 180, '#6B8E6B'),
  ('deep', 'Deep Cleaning', 'Thorough cleaning', 1.5, 300, '#C4A35A'),
  ('move_in_out', 'Move-in/out', 'Empty home cleaning', 1.75, 360, '#7B9EB8')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO public.precos_base (bedrooms, bathrooms, preco_minimo, preco_maximo) VALUES
  (1, 1.0, 120, 140), (2, 2.0, 160, 180), (3, 2.0, 180, 200)
ON CONFLICT (bedrooms, bathrooms) DO NOTHING;

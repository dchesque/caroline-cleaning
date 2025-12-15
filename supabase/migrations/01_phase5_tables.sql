-- Tabela de Tipos de Serviço
CREATE TABLE IF NOT EXISTS tipos_servico (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  duracao_padrao INTEGER DEFAULT 180,
  preco_base DECIMAL(10,2),
  cor VARCHAR(7) DEFAULT '#BE9982',
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir tipos padrão
INSERT INTO tipos_servico (nome, descricao, duracao_padrao, preco_base, cor, ordem) VALUES
('Limpeza Regular', 'Limpeza de manutenção semanal/quinzenal', 180, 150, '#BE9982', 0),
('Limpeza Profunda', 'Limpeza detalhada e completa', 300, 280, '#8B7355', 1),
('Move-in/Move-out', 'Limpeza para mudança', 360, 350, '#6B5B4F', 2),
('Escritório', 'Limpeza comercial', 120, 100, '#9A8478', 3);

-- Tabela de Áreas Atendidas
CREATE TABLE IF NOT EXISTS areas_atendidas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(100) NOT NULL,
  tipo VARCHAR(20) DEFAULT 'city', -- city, zip, neighborhood
  zip_codes TEXT[], -- array de ZIP codes
  ativo BOOLEAN DEFAULT true,
  taxa_adicional DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir áreas padrão
INSERT INTO areas_atendidas (nome, tipo, ativo) VALUES
('Miami Beach', 'city', true),
('Coral Gables', 'city', true),
('Brickell', 'neighborhood', true),
('Downtown Miami', 'neighborhood', true),
('Coconut Grove', 'neighborhood', true);

-- Tabela de Configurações
CREATE TABLE IF NOT EXISTS configuracoes (
  id INTEGER PRIMARY KEY DEFAULT 1,
  settings JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir config padrão
INSERT INTO configuracoes (id, settings) VALUES (1, '{
  "business_name": "Caroline Premium Cleaning",
  "business_phone": "(305) 555-0123",
  "business_email": "hello@carolinecleaning.com",
  "operating_start": "08:00",
  "operating_end": "18:00",
  "operating_days": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
}');

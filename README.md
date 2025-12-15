# Caroline Premium Cleaning - Plataforma de Gestão

> *"Professional cleaning, instantly scheduled."*

Plataforma completa de atendimento automatizado via IA e gestão operacional para serviços de limpeza residencial e comercial de alto padrão.

## 🚀 Visão Geral

Este projeto é uma aplicação web moderna construída com **Next.js 15** (App Router), projetada para:
1.  **Atendimento Automático**: Secretária virtual "Carol" (IA) que atende leads 24/7.
2.  **Gestão Operacional**: Painel administrativo para controle completo da operação (agenda, clientes, financeiro).
3.  **Experiência Premium**: Design high-end focado em conversão e confiança.

## 🛠️ Tech Stack

-   **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Actions)
-   **Linguagem**: TypeScript
-   **Estilização**: [Tailwind CSS v4](https://tailwindcss.com/)
-   **UI Components**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI)
-   **Banco de Dados**: [Supabase](https://supabase.com/) (PostgreSQL)
-   **Autenticação**: Supabase Auth
-   **Ícones**: Lucide React
-   **Integração**: Webhooks para n8n (Automação AI)
-   **Charts**: Recharts
-   **Deploy**: Docker / Easypanel

## 📂 Estrutura do Projeto

```
/
├── app/
│   ├── (public)/       # Landing Page e Chat de Atendimento (Rotas públicas)
│   ├── (auth)/         # Login administrativo
│   ├── (admin)/        # Painel Administrativo (Protegido)
│   │   ├── agenda/     # Calendário de serviços
│   │   ├── clientes/   # CRM e gestão de leads
│   │   ├── contratos/  # Gestão de contratos digitais
│   │   └── financeiro/ # Dashboard financeiro
│   └── api/            # API Routes (Webhooks n8n, Health checks)
├── components/         # Componentes React reutilizáveis
│   ├── admin/          # Componentes específicos do painel
│   ├── chat/           # Interface do Chat (Widget e Fullscreen)
│   ├── landing/        # Seções da Landing Page
│   └── ui/             # Componentes base (shadcn)
├── lib/                # Utilitários e configurações (Supabase, Utils)
├── docs/               # Documentação completa do projeto (PRD, Schema, etc)
├── supabase/           # Migrações e Seeds do banco de dados
└── types/              # Definições de tipos TypeScript
```

## ⚡ Instalação e Execução

### Pré-requisitos
-   Node.js 20+
-   Conta no Supabase

### 1. Clone o repositório
```bash
git clone <repo-url>
cd carolinas-premium
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
Crie um arquivo `.env.local` na raiz baseado no `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# Outras variáveis conforme necessário para n8n e integrações
```

### 4. Execute o servidor de desenvolvimento
```bash
npm run dev
```
Acesse `http://localhost:3000`.

## 🐳 Deployment (Docker)

O projeto está configurado para deploy via Docker, compatível com Easypanel/Coolify.

### Build da Imagem
```bash
docker build -t caroline-cleaning .
```

### Executar Container
```bash
docker run -p 3000:3000 caroline-cleaning
```

**Nota sobre Deploy**: O `Dockerfile` foi otimizado para produção usando Next.js Standalone output. Certifique-se de que sua plataforma de deploy suporte Dockerfile builds.

## 📚 Documentação

A documentação detalhada do projeto encontra-se na pasta `docs/`:

-   [PRD (Visão do Produto)](docs/PRD_Caroline_Premium_Cleaning_v5.md)
-   [Rotas e Telas](docs/ROTAS_TELAS_Caroline.md)
-   [Schema do Banco de Dados](docs/SCHEMA_SUPABASE_Caroline.md)
-   [Design System](docs/DESIGN_SYSTEM_Caroline.md)

## 🤝 Colaboração

Instruções para desenvolvimento:
1.  Siga o **Design System** definido em `docs/DESIGN_SYSTEM_Caroline.md`.
2.  Mantenha a estrutura de pastas do **App Router**.
3.  Use **Server Components** por padrão, adicione `'use client'` apenas quando necessário.
4.  Commits devem seguir o padrão [Conventional Commits](https://www.conventionalcommits.org/).

---

Desenvolvido para **Caroline Premium Cleaning**.

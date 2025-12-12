# FASE 1: SETUP & INFRAESTRUTURA
## Caroline Premium Cleaning - Plataforma de Atendimento e Gestão

**Versão:** 1.0  
**Data:** Dezembro 2024  
**Duração Estimada:** 2-3 dias  
**Prioridade:** 🔴 CRITICAL

---

## 📋 ÍNDICE

1. [Contexto do Projeto](#1-contexto-do-projeto)
2. [Objetivo da Fase 1](#2-objetivo-da-fase-1)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Estrutura de Pastas](#4-estrutura-de-pastas)
5. [Passo a Passo de Implementação](#5-passo-a-passo-de-implementação)
6. [Design System Completo](#6-design-system-completo)
7. [Componentes shadcn/ui](#7-componentes-shadcnui)
8. [Configuração Supabase](#8-configuração-supabase)
9. [Arquivos de Configuração](#9-arquivos-de-configuração)
10. [Checklist de Validação](#10-checklist-de-validação)

---

## 1. CONTEXTO DO PROJETO

### 1.1 Visão Geral

**Nome:** Caroline Premium Cleaning - Plataforma de Atendimento e Gestão

**Tagline:** *"Professional cleaning, instantly scheduled."*

Uma plataforma completa que combina:
- **Atendimento automatizado via IA** (Carol) - secretária virtual 24/7
- **Gestão operacional** - agenda, clientes, contratos, finanças
- **Landing Page** - conversão de visitantes em leads

### 1.2 Problema que Resolve

O mercado de house cleaning nos EUA usa modelo defasado (formulários + espera). Caroline Premium Cleaning:
- Responde em segundos, 24/7
- Agenda no calor do momento
- Zero lead perdido por falta de resposta

### 1.3 Público-Alvo

**Cliente final:**
- Mulheres 35-55 anos
- Subúrbio americano (Miami/Florida)
- Household income: $80k-150k/ano
- Preferem resolver pelo celular/chat

**Operadora:**
- Thayna (dona do negócio)
- Opera com 2 pessoas
- Precisa de sistema simples e eficiente

### 1.4 Arquitetura Geral

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   FRONTEND      │     │    BACKEND      │     │    DATABASE     │
│   Next.js 15    │◄───►│    n8n          │◄───►│    Supabase     │
│   App Router    │     │    AI Agent     │     │    PostgreSQL   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │                       ▼
        │               ┌─────────────────┐
        │               │   EXTERNOS      │
        └──────────────►│   Twilio/Resend │
                        │   OpenAI/Claude │
                        └─────────────────┘
```

---

## 2. OBJETIVO DA FASE 1

### 2.1 Escopo

Criar a **fundação técnica** do projeto:

✅ Projeto Next.js 15 com App Router configurado  
✅ Design System "Summer Nude" implementado  
✅ Tailwind CSS configurado com tokens customizados  
✅ Componentes shadcn/ui instalados e customizados  
✅ Conexão com Supabase configurada  
✅ Estrutura de pastas definitiva criada  
✅ Tipografia e fontes configuradas  

### 2.2 NÃO está no escopo desta fase

❌ Criação de tabelas no banco (Fase 2)  
❌ Páginas funcionais (Fase 3+)  
❌ Integração com n8n (Fase 6)  
❌ Deploy (Fase 7)  

### 2.3 Entregáveis

Ao final da Fase 1, o projeto deve:
1. Rodar com `npm run dev` sem erros
2. Exibir página de teste com Design System aplicado
3. Ter todos os componentes UI disponíveis
4. Conectar com Supabase (teste de conexão)

---

## 3. STACK TECNOLÓGICO

### 3.1 Core

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **Next.js** | 15.x | Framework React com App Router |
| **React** | 19.x | Biblioteca UI |
| **TypeScript** | 5.x | Tipagem estática |
| **Tailwind CSS** | 3.4.x | Estilização utility-first |

### 3.2 UI/UX

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **shadcn/ui** | latest | Componentes base |
| **Radix UI** | latest | Primitivos acessíveis |
| **Lucide React** | latest | Biblioteca de ícones |
| **tailwindcss-animate** | latest | Animações |

### 3.3 Backend/Database

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **Supabase** | latest | PostgreSQL + Auth + Storage |
| **@supabase/supabase-js** | 2.x | Cliente JavaScript |
| **@supabase/ssr** | latest | Helpers para SSR |

### 3.4 Fontes

| Fonte | Uso |
|-------|-----|
| **Playfair Display** | Headings (h1, h2, display) |
| **Inter** | Body text, UI |

---

## 4. ESTRUTURA DE PASTAS

Criar EXATAMENTE esta estrutura:

```
caroline-cleaning/
├── app/
│   ├── (public)/                    # Layout público (sem sidebar)
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # / (Landing Page - placeholder)
│   │   └── chat/
│   │       └── page.tsx             # /chat (placeholder)
│   │
│   ├── (auth)/                      # Layout de autenticação
│   │   ├── layout.tsx
│   │   └── login/
│   │       └── page.tsx             # /login (placeholder)
│   │
│   ├── (admin)/                     # Layout admin (com sidebar)
│   │   ├── layout.tsx
│   │   └── admin/
│   │       ├── page.tsx             # /admin (Dashboard placeholder)
│   │       ├── agenda/
│   │       │   └── page.tsx         # /admin/agenda (placeholder)
│   │       ├── clientes/
│   │       │   ├── page.tsx         # /admin/clientes (placeholder)
│   │       │   └── [id]/
│   │       │       └── page.tsx     # /admin/clientes/[id] (placeholder)
│   │       ├── contratos/
│   │       │   └── page.tsx         # /admin/contratos (placeholder)
│   │       ├── financeiro/
│   │       │   └── page.tsx         # /admin/financeiro (placeholder)
│   │       └── configuracoes/
│   │           └── page.tsx         # /admin/configuracoes (placeholder)
│   │
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts             # POST /api/chat (placeholder)
│   │   ├── webhooks/
│   │   │   └── n8n/
│   │   │       └── route.ts         # POST /api/webhooks/n8n (placeholder)
│   │   └── slots/
│   │       └── route.ts             # GET /api/slots (placeholder)
│   │
│   ├── globals.css
│   ├── layout.tsx                   # Root layout
│   └── favicon.ico
│
├── components/
│   ├── ui/                          # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── select.tsx
│   │   ├── tabs.tsx
│   │   ├── table.tsx
│   │   ├── calendar.tsx
│   │   ├── toast.tsx
│   │   ├── toaster.tsx
│   │   ├── skeleton.tsx
│   │   ├── separator.tsx
│   │   ├── accordion.tsx
│   │   ├── avatar.tsx
│   │   ├── checkbox.tsx
│   │   ├── textarea.tsx
│   │   ├── switch.tsx
│   │   ├── sheet.tsx
│   │   └── label.tsx
│   │
│   ├── chat/                        # Componentes do chat (placeholders)
│   │   └── .gitkeep
│   │
│   ├── landing/                     # Componentes da landing (placeholders)
│   │   └── .gitkeep
│   │
│   ├── admin/                       # Componentes do admin (placeholders)
│   │   └── .gitkeep
│   │
│   └── shared/                      # Componentes compartilhados
│       └── .gitkeep
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # Cliente browser
│   │   ├── server.ts                # Cliente server
│   │   └── middleware.ts            # Auth middleware helper
│   ├── utils.ts                     # Utilitários (cn, etc)
│   └── constants.ts                 # Constantes do app
│
├── hooks/
│   └── .gitkeep                     # Custom hooks (futuro)
│
├── types/
│   ├── index.ts                     # Types gerais
│   └── supabase.ts                  # Types do banco (gerado)
│
├── public/
│   ├── images/
│   │   └── .gitkeep
│   └── fonts/
│       └── .gitkeep
│
├── .env.local                       # Variáveis de ambiente (não commitar)
├── .env.example                     # Exemplo de variáveis
├── .gitignore
├── components.json                  # Config shadcn/ui
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 5. PASSO A PASSO DE IMPLEMENTAÇÃO

### 5.1 Criar Projeto Next.js

```bash
npx create-next-app@latest caroline-cleaning --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
```

**Opções durante criação:**
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- `src/` directory: No
- App Router: Yes
- Import alias: @/*

### 5.2 Instalar Dependências

```bash
cd caroline-cleaning

# UI Components
npm install @radix-ui/react-slot
npm install @radix-ui/react-dialog
npm install @radix-ui/react-dropdown-menu
npm install @radix-ui/react-select
npm install @radix-ui/react-tabs
npm install @radix-ui/react-accordion
npm install @radix-ui/react-avatar
npm install @radix-ui/react-checkbox
npm install @radix-ui/react-switch
npm install @radix-ui/react-label
npm install @radix-ui/react-separator
npm install @radix-ui/react-toast

# Utilitários
npm install lucide-react
npm install clsx
npm install tailwind-merge
npm install class-variance-authority
npm install tailwindcss-animate

# Date handling
npm install date-fns
npm install react-day-picker

# Supabase
npm install @supabase/supabase-js
npm install @supabase/ssr

# Formulários (para futuro)
npm install react-hook-form
npm install @hookform/resolvers
npm install zod
```

### 5.3 Inicializar shadcn/ui

```bash
npx shadcn@latest init
```

**Configurações durante init:**
- Style: Default
- Base color: Neutral (vamos customizar depois)
- CSS variables: Yes
- React Server Components: Yes
- Components directory: components/ui
- Utils: lib/utils.ts
- Tailwind config: tailwind.config.ts
- Global CSS: app/globals.css

### 5.4 Instalar Componentes shadcn/ui

```bash
# Instalar todos os componentes necessários
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add card
npx shadcn@latest add badge
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add select
npx shadcn@latest add tabs
npx shadcn@latest add table
npx shadcn@latest add calendar
npx shadcn@latest add toast
npx shadcn@latest add skeleton
npx shadcn@latest add separator
npx shadcn@latest add accordion
npx shadcn@latest add avatar
npx shadcn@latest add checkbox
npx shadcn@latest add textarea
npx shadcn@latest add switch
npx shadcn@latest add sheet
npx shadcn@latest add label
```

---

## 6. DESIGN SYSTEM COMPLETO

### 6.1 Filosofia de Design

| Princípio | Descrição |
|-----------|-----------|
| **Elegância** | Visual sofisticado que transmite premium e confiança |
| **Calma** | Tons neutros que passam tranquilidade e organização |
| **Clareza** | Informação hierarquizada e fácil de ler |
| **Acessibilidade** | Contraste adequado e navegação intuitiva |

**Tom Visual:** *"Premium, mas acessível. Profissional, mas acolhedor."*

### 6.2 Paleta de Cores - "Summer Nude"

#### Cores Principais

| Nome | Hex | RGB | Uso |
|------|-----|-----|-----|
| **Desert Storm** | `#F8F8F7` | `rgb(248, 248, 247)` | Background principal |
| **Pampas** | `#ECE9E4` | `rgb(236, 233, 228)` | Cards, surfaces, inputs |
| **Pot Pourri** | `#F3E8DC` | `rgb(243, 232, 220)` | Hover states, highlights |
| **Akaroa** | `#D8C4B2` | `rgb(216, 196, 178)` | Bordas, texto secundário |
| **Brandy Rose** | `#BE9982` | `rgb(190, 153, 130)` | **CTA principal**, links |

#### Escala Brandy Rose (Primary)

```
50:  #FAF7F5
100: #F2EBE6
200: #E8D9CF
300: #D9C1B0
400: #CCAB96
500: #BE9982  ← Base
600: #A88470
700: #8F6D5B
800: #755848
900: #5E483A
950: #4A3A2E
```

#### Cores Semânticas

| Cor | Hex | Background | Uso |
|-----|-----|------------|-----|
| **Success** | `#6B8E6B` | `#E8F0E8` | Confirmações, ativo |
| **Warning** | `#D4A574` | `#FDF6EE` | Alertas, pendências |
| **Error** | `#C17B7B` | `#FCF0F0` | Erros, cancelamentos |
| **Info** | `#7B9EB8` | `#F0F5F8` | Informações, dicas |

#### Cores de Texto

| Tipo | Hex | Uso |
|------|-----|-----|
| **Text Primary** | `#4A3A2E` | Títulos, texto principal |
| **Text Secondary** | `#755848` | Subtítulos, descrições |
| **Text Muted** | `#A88470` | Placeholders, auxiliar |
| **Text Inverse** | `#FFFFFF` | Texto sobre fundo escuro |

#### Cores por Tipo de Serviço

| Serviço | Cor | Hex | Badge BG |
|---------|-----|-----|----------|
| Regular | Verde Sage | `#6B8E6B` | `#E8F0E8` |
| Deep | Dourado | `#C4A35A` | `#FAF6EB` |
| Move-in/out | Azul Dusty | `#7B9EB8` | `#F0F5F8` |
| Office | Lavanda | `#9B8BB8` | `#F5F3F8` |
| Airbnb | Coral | `#C4856B` | `#FCF3EF` |
| Visit | Cinza | `#8E8E8E` | `#F5F5F5` |

### 6.3 Tipografia

#### Font Stack

```css
--font-heading: 'Playfair Display', 'Georgia', serif;
--font-body: 'Inter', 'Helvetica Neue', sans-serif;
--font-mono: 'JetBrains Mono', 'Consolas', monospace;
```

#### Escala Tipográfica

| Token | Font | Size | Line Height | Weight | Letter Spacing |
|-------|------|------|-------------|--------|----------------|
| `display` | Playfair Display | 48px | 56px | 600 | -0.02em |
| `h1` | Playfair Display | 36px | 44px | 600 | -0.02em |
| `h2` | Playfair Display | 28px | 36px | 600 | -0.01em |
| `h3` | Inter | 22px | 30px | 600 | 0 |
| `h4` | Inter | 18px | 26px | 600 | 0 |
| `body-lg` | Inter | 18px | 28px | 400 | 0 |
| `body` | Inter | 16px | 24px | 400 | 0 |
| `body-sm` | Inter | 14px | 20px | 400 | 0 |
| `caption` | Inter | 12px | 16px | 400 | 0.01em |
| `overline` | Inter | 11px | 16px | 500 | 0.08em (UPPERCASE) |

### 6.4 Espaçamento

Usar escala padrão do Tailwind:
- `0`: 0
- `px`: 1px
- `0.5`: 2px
- `1`: 4px
- `1.5`: 6px
- `2`: 8px
- `3`: 12px
- `4`: 16px
- `5`: 20px
- `6`: 24px
- `8`: 32px
- `10`: 40px
- `12`: 48px
- `16`: 64px
- `20`: 80px
- `24`: 96px

### 6.5 Bordas e Sombras

#### Border Radius

| Token | Valor | Uso |
|-------|-------|-----|
| `none` | 0 | Elementos sem borda |
| `sm` | 4px | Badges, tags |
| `DEFAULT` | 6px | Buttons, inputs |
| `md` | 8px | Cards pequenos |
| `lg` | 12px | Cards, modais |
| `xl` | 16px | Containers maiores |
| `2xl` | 20px | Chat bubbles |
| `full` | 9999px | Avatares, pills |

#### Shadows

```css
/* Sombras customizadas */
--shadow-sm: 0 1px 2px rgba(74, 58, 46, 0.04);
--shadow-DEFAULT: 0 1px 3px rgba(74, 58, 46, 0.06), 0 1px 2px rgba(74, 58, 46, 0.04);
--shadow-md: 0 4px 6px rgba(74, 58, 46, 0.06), 0 2px 4px rgba(74, 58, 46, 0.04);
--shadow-lg: 0 10px 15px rgba(74, 58, 46, 0.06), 0 4px 6px rgba(74, 58, 46, 0.04);
--shadow-xl: 0 20px 25px rgba(74, 58, 46, 0.08), 0 10px 10px rgba(74, 58, 46, 0.04);
```

### 6.6 Animações

```css
/* Transições padrão */
--transition-fast: 150ms ease;
--transition-DEFAULT: 200ms ease;
--transition-slow: 300ms ease;

/* Keyframes */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slide-in-right {
  from { opacity: 0; transform: translateX(10px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes pulse-dot {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-4px); }
}
```

### 6.7 Breakpoints

| Breakpoint | Min Width | Uso |
|------------|-----------|-----|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Desktop grande |
| `2xl` | 1536px | Monitores grandes |

---

## 7. COMPONENTES SHADCN/UI

### 7.1 Lista de Componentes Necessários

Todos estes componentes devem ser instalados e customizados:

| Componente | Uso Principal |
|------------|---------------|
| `button` | CTAs, ações |
| `input` | Formulários |
| `textarea` | Campos de texto longo |
| `select` | Dropdowns |
| `checkbox` | Opções múltiplas |
| `switch` | Toggles |
| `label` | Labels de form |
| `card` | Containers de conteúdo |
| `badge` | Status, tags |
| `avatar` | Fotos de perfil |
| `dialog` | Modais |
| `sheet` | Drawers laterais |
| `dropdown-menu` | Menus contextuais |
| `tabs` | Navegação por abas |
| `table` | Listagens |
| `calendar` | Seleção de datas |
| `toast` | Notificações |
| `skeleton` | Loading states |
| `separator` | Divisores |
| `accordion` | FAQ, colapsáveis |

### 7.2 Variantes de Button

O componente Button deve ter estas variantes:

```typescript
// Variantes
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

### 7.3 Variantes de Badge

```typescript
// Variantes para status de cliente/agendamento
const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary",
        success: "bg-success-light text-success",
        warning: "bg-warning-light text-warning",
        destructive: "bg-destructive-light text-destructive",
        info: "bg-info-light text-info",
        outline: "border border-current",
        // Tipos de serviço
        regular: "bg-[#E8F0E8] text-[#6B8E6B]",
        deep: "bg-[#FAF6EB] text-[#C4A35A]",
        moveinout: "bg-[#F0F5F8] text-[#7B9EB8]",
        office: "bg-[#F5F3F8] text-[#9B8BB8]",
        airbnb: "bg-[#FCF3EF] text-[#C4856B]",
        visit: "bg-[#F5F5F5] text-[#8E8E8E]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
```

---

## 8. CONFIGURAÇÃO SUPABASE

### 8.1 Criar Projeto no Supabase

1. Acesse https://supabase.com
2. Crie um novo projeto
3. Região: **East US** (ou mais próxima do público)
4. Aguarde a criação do banco

### 8.2 Obter Credenciais

No Supabase Dashboard, vá em **Settings > API** e copie:
- `Project URL` (NEXT_PUBLIC_SUPABASE_URL)
- `anon public key` (NEXT_PUBLIC_SUPABASE_ANON_KEY)
- `service_role key` (SUPABASE_SERVICE_ROLE_KEY) - **NUNCA expor no client**

### 8.3 Configurar Variáveis de Ambiente

Criar arquivo `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# n8n (preparar para Fase 6)
N8N_WEBHOOK_URL=https://n8n.seudominio.com/webhook/carol-chat

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Criar arquivo `.env.example`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# n8n
N8N_WEBHOOK_URL=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 9. ARQUIVOS DE CONFIGURAÇÃO

### 9.1 tailwind.config.ts

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      // Fontes
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-playfair)', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      
      // Cores Summer Nude
      colors: {
        // Paleta Principal
        'desert-storm': '#F8F8F7',
        'pampas': '#ECE9E4',
        'pot-pourri': '#F3E8DC',
        'akaroa': '#D8C4B2',
        'brandy-rose': {
          50: '#FAF7F5',
          100: '#F2EBE6',
          200: '#E8D9CF',
          300: '#D9C1B0',
          400: '#CCAB96',
          500: '#BE9982',
          600: '#A88470',
          700: '#8F6D5B',
          800: '#755848',
          900: '#5E483A',
          950: '#4A3A2E',
        },
        
        // Semânticas
        success: {
          DEFAULT: '#6B8E6B',
          light: '#E8F0E8',
        },
        warning: {
          DEFAULT: '#D4A574',
          light: '#FDF6EE',
        },
        info: {
          DEFAULT: '#7B9EB8',
          light: '#F0F5F8',
        },
        
        // Tipos de serviço
        service: {
          regular: '#6B8E6B',
          'regular-light': '#E8F0E8',
          deep: '#C4A35A',
          'deep-light': '#FAF6EB',
          moveinout: '#7B9EB8',
          'moveinout-light': '#F0F5F8',
          office: '#9B8BB8',
          'office-light': '#F5F3F8',
          airbnb: '#C4856B',
          'airbnb-light': '#FCF3EF',
          visit: '#8E8E8E',
          'visit-light': '#F5F5F5',
        },
        
        // shadcn/ui variables
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
          light: '#FCF0F0',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      
      // Sombras
      boxShadow: {
        'sm': '0 1px 2px rgba(74, 58, 46, 0.04)',
        'DEFAULT': '0 1px 3px rgba(74, 58, 46, 0.06), 0 1px 2px rgba(74, 58, 46, 0.04)',
        'md': '0 4px 6px rgba(74, 58, 46, 0.06), 0 2px 4px rgba(74, 58, 46, 0.04)',
        'lg': '0 10px 15px rgba(74, 58, 46, 0.06), 0 4px 6px rgba(74, 58, 46, 0.04)',
        'xl': '0 20px 25px rgba(74, 58, 46, 0.08), 0 10px 10px rgba(74, 58, 46, 0.04)',
      },
      
      // Border Radius
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        '2xl': '20px',
      },
      
      // Tipografia
      fontSize: {
        'display': ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '600' }],
        'h1': ['36px', { lineHeight: '44px', letterSpacing: '-0.02em', fontWeight: '600' }],
        'h2': ['28px', { lineHeight: '36px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'h3': ['22px', { lineHeight: '30px', fontWeight: '600' }],
        'h4': ['18px', { lineHeight: '26px', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '28px' }],
        'body': ['16px', { lineHeight: '24px' }],
        'body-sm': ['14px', { lineHeight: '20px' }],
        'caption': ['12px', { lineHeight: '16px', letterSpacing: '0.01em' }],
        'overline': ['11px', { lineHeight: '16px', letterSpacing: '0.08em', fontWeight: '500' }],
      },
      
      // Keyframes
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(10px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-dot': {
          '0%, 60%, 100%': { transform: 'translateY(0)' },
          '30%': { transform: 'translateY(-4px)' },
        },
      },
      
      // Animações
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 200ms ease-out',
        'slide-up': 'slide-up 200ms ease-out',
        'slide-in-right': 'slide-in-right 300ms ease-out',
        'pulse-dot': 'pulse-dot 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

### 9.2 app/globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Background e Foreground */
    --background: 30 4% 97%; /* Desert Storm */
    --foreground: 25 23% 24%; /* Brandy Rose 950 */
    
    /* Card */
    --card: 0 0% 100%;
    --card-foreground: 25 23% 24%;
    
    /* Popover */
    --popover: 0 0% 100%;
    --popover-foreground: 25 23% 24%;
    
    /* Primary - Brandy Rose */
    --primary: 22 32% 63%; /* #BE9982 */
    --primary-foreground: 0 0% 100%;
    
    /* Secondary - Pot Pourri */
    --secondary: 28 38% 91%; /* #F3E8DC */
    --secondary-foreground: 22 23% 39%;
    
    /* Muted - Pampas */
    --muted: 30 12% 91%; /* #ECE9E4 */
    --muted-foreground: 22 23% 55%;
    
    /* Accent */
    --accent: 28 38% 91%;
    --accent-foreground: 22 23% 39%;
    
    /* Destructive */
    --destructive: 0 30% 62%; /* #C17B7B */
    --destructive-foreground: 0 0% 100%;
    
    /* Border e Input */
    --border: 30 12% 91%;
    --input: 30 12% 91%;
    --ring: 22 32% 63%;
    
    /* Radius */
    --radius: 0.375rem;
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground font-sans antialiased;
    font-feature-settings: "rlig" 1, "calt" 1;
  }

  /* Headings usam fonte Playfair */
  h1, h2, .font-heading {
    @apply font-heading;
  }
  
  /* Scrollbar customizada */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    @apply bg-pampas;
  }
  
  ::-webkit-scrollbar-thumb {
    @apply bg-akaroa rounded-full;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    @apply bg-brandy-rose-500;
  }
}

@layer components {
  /* Container responsivo */
  .container {
    @apply mx-auto px-4 sm:px-6 lg:px-8;
    max-width: 1400px;
  }
  
  /* Card padrão */
  .card-hover {
    @apply transition-shadow duration-200 hover:shadow-md;
  }
  
  /* Input focus state */
  .input-focus {
    @apply focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20;
  }
  
  /* Status badges */
  .badge-lead {
    @apply bg-brandy-rose-50 text-brandy-rose-500;
  }
  
  .badge-active {
    @apply bg-success-light text-success;
  }
  
  .badge-paused {
    @apply bg-warning-light text-warning;
  }
  
  .badge-canceled {
    @apply bg-destructive-light text-destructive;
  }
  
  .badge-inactive {
    @apply bg-muted text-muted-foreground;
  }
}

@layer utilities {
  /* Text balance para headings */
  .text-balance {
    text-wrap: balance;
  }
  
  /* Hide scrollbar mas mantém funcionalidade */
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
}
```

### 9.3 app/layout.tsx (Root Layout)

```tsx
import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Caroline Premium Cleaning',
    template: '%s | Caroline Premium Cleaning',
  },
  description: 'Professional house cleaning services in Miami. Chat with Carol to book your free estimate 24/7.',
  keywords: ['house cleaning', 'cleaning service', 'Miami', 'professional cleaning', 'maid service'],
  authors: [{ name: 'Caroline Premium Cleaning' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://carolinecleaning.com',
    siteName: 'Caroline Premium Cleaning',
    title: 'Caroline Premium Cleaning - Professional House Cleaning',
    description: 'Professional house cleaning services in Miami. Chat with Carol to book your free estimate 24/7.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

### 9.4 lib/utils.ts

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combina classes CSS com suporte a condicionais e merge de Tailwind
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata valor para moeda USD
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

/**
 * Formata data para exibição
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  }).format(d)
}

/**
 * Formata hora para exibição
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const h = parseInt(hours)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

/**
 * Gera ID único
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

/**
 * Delay para async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Capitaliza primeira letra
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Trunca texto com ellipsis
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}
```

### 9.5 lib/constants.ts

```typescript
/**
 * Constantes do aplicativo
 */

// Status de Cliente
export const CLIENT_STATUS = {
  LEAD: 'lead',
  ACTIVE: 'ativo',
  PAUSED: 'pausado',
  CANCELED: 'cancelado',
  INACTIVE: 'inativo',
} as const

export const CLIENT_STATUS_LABELS: Record<string, string> = {
  lead: 'Lead',
  ativo: 'Active',
  pausado: 'Paused',
  cancelado: 'Canceled',
  inativo: 'Inactive',
}

// Tipos de Serviço
export const SERVICE_TYPES = {
  VISIT: 'visit',
  REGULAR: 'regular',
  DEEP: 'deep',
  MOVE_IN_OUT: 'move_in_out',
  OFFICE: 'office',
  AIRBNB: 'airbnb',
} as const

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  visit: 'Estimate Visit',
  regular: 'Regular Cleaning',
  deep: 'Deep Cleaning',
  move_in_out: 'Move-in/Move-out',
  office: 'Office Cleaning',
  airbnb: 'Airbnb Turnover',
}

export const SERVICE_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  visit: { bg: 'bg-service-visit-light', text: 'text-service-visit' },
  regular: { bg: 'bg-service-regular-light', text: 'text-service-regular' },
  deep: { bg: 'bg-service-deep-light', text: 'text-service-deep' },
  move_in_out: { bg: 'bg-service-moveinout-light', text: 'text-service-moveinout' },
  office: { bg: 'bg-service-office-light', text: 'text-service-office' },
  airbnb: { bg: 'bg-service-airbnb-light', text: 'text-service-airbnb' },
}

// Status de Agendamento
export const APPOINTMENT_STATUS = {
  SCHEDULED: 'agendado',
  CONFIRMED: 'confirmado',
  IN_PROGRESS: 'em_andamento',
  COMPLETED: 'concluido',
  CANCELED: 'cancelado',
  NO_SHOW: 'no_show',
  RESCHEDULED: 'reagendado',
} as const

// Frequências
export const FREQUENCIES = {
  WEEKLY: 'weekly',
  BIWEEKLY: 'biweekly',
  MONTHLY: 'monthly',
  ONE_TIME: 'one_time',
} as const

export const FREQUENCY_LABELS: Record<string, string> = {
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
  one_time: 'One-time',
}

// Dias da semana
export const WEEKDAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const

export const WEEKDAY_LABELS: Record<string, string> = {
  sunday: 'Sunday',
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
}

// Navegação Admin
export const ADMIN_NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/admin/agenda', label: 'Calendar', icon: 'Calendar' },
  { href: '/admin/clientes', label: 'Clients', icon: 'Users' },
  { href: '/admin/contratos', label: 'Contracts', icon: 'FileText' },
  { href: '/admin/financeiro', label: 'Financial', icon: 'DollarSign' },
  { href: '/admin/configuracoes', label: 'Settings', icon: 'Settings' },
] as const
```

### 9.6 lib/supabase/client.ts

```typescript
import { createBrowserClient } from '@supabase/ssr'

/**
 * Cria cliente Supabase para uso no browser (Client Components)
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### 9.7 lib/supabase/server.ts

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Cria cliente Supabase para uso no servidor (Server Components, Route Handlers)
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
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
            // Ignore - chamado de Server Component
          }
        },
      },
    }
  )
}

/**
 * Cria cliente Supabase com Service Role (para operações admin)
 * NUNCA usar no client-side
 */
export async function createServiceClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

### 9.8 lib/supabase/middleware.ts

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware para refresh de sessão e proteção de rotas
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Proteger rotas /admin
  if (request.nextUrl.pathname.startsWith('/admin') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirecionar usuário logado para /admin se tentar acessar /login
  if (request.nextUrl.pathname === '/login' && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

### 9.9 middleware.ts (na raiz)

```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### 9.10 types/index.ts

```typescript
/**
 * Types gerais do aplicativo
 */

// Status de Cliente
export type ClientStatus = 'lead' | 'ativo' | 'pausado' | 'cancelado' | 'inativo'

// Tipos de Serviço
export type ServiceType = 'visit' | 'regular' | 'deep' | 'move_in_out' | 'office' | 'airbnb'

// Status de Agendamento
export type AppointmentStatus = 
  | 'agendado' 
  | 'confirmado' 
  | 'em_andamento' 
  | 'concluido' 
  | 'cancelado' 
  | 'no_show' 
  | 'reagendado'

// Frequências
export type Frequency = 'weekly' | 'biweekly' | 'monthly' | 'one_time'

// Dias da semana
export type Weekday = 
  | 'sunday' 
  | 'monday' 
  | 'tuesday' 
  | 'wednesday' 
  | 'thursday' 
  | 'friday' 
  | 'saturday'

// Chat Message
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  status?: 'sending' | 'sent' | 'error'
}

// API Response padrão
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Pagination
export interface PaginationParams {
  page: number
  perPage: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  perPage: number
  totalPages: number
}
```

### 9.11 components.json (shadcn/ui config)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### 9.12 next.config.ts

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Habilitar standalone output para Docker
  output: 'standalone',
  
  // Otimizações de imagem
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  
  // Headers de segurança
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },
}

export default nextConfig
```

### 9.13 .gitignore

```gitignore
# Dependencies
/node_modules
/.pnp
.pnp.js
.yarn/install-state.gz

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env*.local
.env

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
Thumbs.db
```

---

## 10. CHECKLIST DE VALIDAÇÃO

### 10.1 Pré-requisitos

- [ ] Node.js 18+ instalado
- [ ] npm ou yarn disponível
- [ ] Conta no Supabase criada
- [ ] Git configurado

### 10.2 Estrutura do Projeto

- [ ] Todas as pastas criadas conforme seção 4
- [ ] Arquivos .gitkeep nos diretórios vazios
- [ ] Estrutura de rotas do App Router correta

### 10.3 Configurações

- [ ] `tailwind.config.ts` com todas as cores
- [ ] `globals.css` com variáveis CSS
- [ ] `components.json` do shadcn/ui
- [ ] `.env.local` com credenciais Supabase
- [ ] `.env.example` sem dados sensíveis

### 10.4 Dependências

- [ ] Todas as dependências instaladas (npm install)
- [ ] Sem erros de peer dependencies
- [ ] shadcn/ui components instalados

### 10.5 Supabase

- [ ] Cliente browser (`lib/supabase/client.ts`)
- [ ] Cliente server (`lib/supabase/server.ts`)
- [ ] Middleware configurado
- [ ] Conexão testada com sucesso

### 10.6 Design System

- [ ] Fontes Playfair e Inter carregando
- [ ] Cores renderizando corretamente
- [ ] Componentes shadcn/ui funcionando

### 10.7 Execução

- [ ] `npm run dev` inicia sem erros
- [ ] Página inicial renderiza
- [ ] Sem erros no console do browser
- [ ] Sem erros de TypeScript

### 10.8 Página de Teste

Criar uma página de teste em `app/(public)/page.tsx` que demonstre:

```tsx
// app/(public)/page.tsx
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Sparkles, Calendar, Users, DollarSign } from 'lucide-react'

export default function TestPage() {
  return (
    <div className="min-h-screen bg-desert-storm">
      {/* Header */}
      <header className="bg-white border-b border-pampas">
        <div className="container py-4 flex items-center justify-between">
          <h1 className="font-heading text-h3 text-foreground">
            Caroline Premium Cleaning
          </h1>
          <Button>Chat with Carol</Button>
        </div>
      </header>

      {/* Main */}
      <main className="container py-12">
        {/* Hero */}
        <section className="text-center mb-16">
          <h2 className="font-heading text-display text-foreground mb-4">
            Premium House Cleaning,
            <br />
            <span className="text-brandy-rose-500">Scheduled in Minutes</span>
          </h2>
          <p className="text-body-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Professional cleaning service available 24/7. 
            Chat with Carol to book your free estimate.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg">
              <Sparkles className="mr-2 h-4 w-4" />
              Chat with Carol Now
            </Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </section>

        {/* Cards de Teste */}
        <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-body-sm font-medium">
                Today's Appointments
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-h2 font-bold">4</div>
              <p className="text-caption text-muted-foreground">
                2 confirmed, 2 pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-body-sm font-medium">
                New Leads
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-h2 font-bold">12</div>
              <p className="text-caption text-muted-foreground">
                +3 from yesterday
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-body-sm font-medium">
                Active Clients
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-h2 font-bold">48</div>
              <p className="text-caption text-muted-foreground">
                +5 this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-body-sm font-medium">
                Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-h2 font-bold">$8,420</div>
              <p className="text-caption text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Badges de Teste */}
        <section className="mb-16">
          <h3 className="text-h3 mb-6">Status Badges</h3>
          <div className="flex flex-wrap gap-3">
            <Badge className="badge-lead">Lead</Badge>
            <Badge className="badge-active">Active</Badge>
            <Badge className="badge-paused">Paused</Badge>
            <Badge className="badge-canceled">Canceled</Badge>
            <Badge className="badge-inactive">Inactive</Badge>
          </div>
        </section>

        {/* Service Type Badges */}
        <section className="mb-16">
          <h3 className="text-h3 mb-6">Service Types</h3>
          <div className="flex flex-wrap gap-3">
            <Badge className="bg-service-regular-light text-service-regular">Regular</Badge>
            <Badge className="bg-service-deep-light text-service-deep">Deep</Badge>
            <Badge className="bg-service-moveinout-light text-service-moveinout">Move-in/out</Badge>
            <Badge className="bg-service-office-light text-service-office">Office</Badge>
            <Badge className="bg-service-airbnb-light text-service-airbnb">Airbnb</Badge>
            <Badge className="bg-service-visit-light text-service-visit">Visit</Badge>
          </div>
        </section>

        {/* Formulário de Teste */}
        <section className="max-w-md">
          <h3 className="text-h3 mb-6">Form Elements</h3>
          <Card>
            <CardHeader>
              <CardTitle>Contact Form</CardTitle>
              <CardDescription>Test form elements styling</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-body-sm font-medium">Name</label>
                <Input placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <label className="text-body-sm font-medium">Email</label>
                <Input type="email" placeholder="your@email.com" />
              </div>
              <div className="flex gap-3">
                <Button className="flex-1">Submit</Button>
                <Button variant="outline">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-brandy-rose-950 text-white py-8">
        <div className="container text-center">
          <p className="text-body-sm opacity-80">
            © 2024 Caroline Premium Cleaning. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
```

---

## 11. COMANDOS FINAIS

### 11.1 Verificar Instalação

```bash
# Verificar se tudo está instalado
npm list --depth=0

# Verificar TypeScript
npx tsc --noEmit

# Rodar o projeto
npm run dev
```

### 11.2 Resolver Problemas Comuns

```bash
# Se houver erros de dependências
rm -rf node_modules package-lock.json
npm install

# Se houver erros de TypeScript
npx tsc --noEmit

# Se shadcn/ui não funcionar
npx shadcn@latest init --force
```

### 11.3 Build de Teste

```bash
# Verificar se build funciona
npm run build

# Se build passar, a Fase 1 está completa!
```

---

## 📝 NOTAS IMPORTANTES

1. **NÃO** criar tabelas no Supabase ainda - isso é Fase 2
2. **NÃO** implementar funcionalidades - apenas estrutura
3. Todas as páginas devem ser **placeholders** simples
4. A página de teste em `app/(public)/page.tsx` demonstra o Design System
5. Commits frequentes com mensagens descritivas

---

## ✅ DEFINIÇÃO DE PRONTO

A Fase 1 está **COMPLETA** quando:

1. ✅ `npm run dev` executa sem erros
2. ✅ `npm run build` compila com sucesso
3. ✅ Página de teste exibe Design System corretamente
4. ✅ Fontes Playfair e Inter renderizam
5. ✅ Cores "Summer Nude" aplicadas
6. ✅ Componentes shadcn/ui funcionando
7. ✅ Conexão com Supabase configurada (pode testar com console.log)
8. ✅ Estrutura de pastas completa
9. ✅ Middleware de auth configurado

---

**— FIM DA FASE 1 —**

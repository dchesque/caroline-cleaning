# ROTAS E TELAS - CAROLINE PREMIUM CLEANING

**Versão:** 1.0  
**Data:** Dezembro 2024  
**Referência:** PRD v5.0

---

## ÍNDICE

- [1. Visão Geral das Rotas](#1-visão-geral-das-rotas)
- [2. Rotas Públicas](#2-rotas-públicas)
- [3. Rotas Protegidas (Admin)](#3-rotas-protegidas-admin)
- [4. API Routes](#4-api-routes)
- [5. Componentes Compartilhados](#5-componentes-compartilhados)
- [6. Estados Globais](#6-estados-globais)

---

## 1. VISÃO GERAL DAS ROTAS

```
app/
├── (public)/                    # Layout público (sem sidebar)
│   ├── page.tsx                 # /
│   └── chat/
│       └── page.tsx             # /chat
│
├── (auth)/                      # Layout de autenticação
│   └── login/
│       └── page.tsx             # /login
│
├── (admin)/                     # Layout admin (com sidebar)
│   └── admin/
│       ├── page.tsx             # /admin
│       ├── agenda/
│       │   └── page.tsx         # /admin/agenda
│       ├── clientes/
│       │   ├── page.tsx         # /admin/clientes
│       │   └── [id]/
│       │       └── page.tsx     # /admin/clientes/[id]
│       ├── contratos/
│       │   └── page.tsx         # /admin/contratos
│       ├── financeiro/
│       │   └── page.tsx         # /admin/financeiro
│       └── configuracoes/
│           └── page.tsx         # /admin/configuracoes
│
└── api/
    ├── chat/
    │   └── route.ts             # POST /api/chat
    ├── webhooks/
    │   └── n8n/
    │       └── route.ts         # POST /api/webhooks/n8n
    └── slots/
        └── route.ts             # GET /api/slots
```

### Mapa de Navegação

```
┌─────────────────────────────────────────────────────────────────┐
│                        ROTAS PÚBLICAS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   /  ──────────────────►  Landing Page                          │
│   │                       │                                     │
│   │                       ├── Hero Section                      │
│   │                       ├── Services                          │
│   │                       ├── How it Works                      │
│   │                       ├── Testimonials                      │
│   │                       ├── FAQ                               │
│   │                       └── Footer                            │
│   │                                                             │
│   │   [Chat Widget em todas as páginas públicas]                │
│   │                                                             │
│   └──►  /chat  ────────►  Chat Fullscreen (mobile-first)        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        ROTA DE AUTH                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   /login  ─────────────►  Tela de Login (Supabase Auth)         │
│                           │                                     │
│                           └── Redirect para /admin após login   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      ROTAS PROTEGIDAS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   /admin  ─────────────►  Dashboard                             │
│   │                                                             │
│   ├── /admin/agenda  ──►  Calendário de Agendamentos            │
│   │                                                             │
│   ├── /admin/clientes ─►  Lista de Clientes                     │
│   │   │                                                         │
│   │   └── /admin/clientes/[id] ──► Ficha do Cliente             │
│   │                                                             │
│   ├── /admin/contratos ► Gestão de Contratos                    │
│   │                                                             │
│   ├── /admin/financeiro► Módulo Financeiro                      │
│   │                                                             │
│   └── /admin/configuracoes ──► Configurações do Sistema         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. ROTAS PÚBLICAS

### 2.1 Landing Page

**Rota:** `/`  
**Arquivo:** `app/(public)/page.tsx`  
**Layout:** `app/(public)/layout.tsx`

**Propósito:** Converter visitantes em leads através do chat com Carol.

**Estrutura da Página:**

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER (fixo no scroll)                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  [Logo]                              [Phone] [Chat CTA] │    │
│  └─────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  HERO SECTION                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │     Premium House Cleaning,                             │    │
│  │     Scheduled in Minutes                                │    │
│  │                                                         │    │
│  │     Professional cleaning service available 24/7.       │    │
│  │     Chat with Carol to book your free estimate.         │    │
│  │                                                         │    │
│  │     ┌─────────────────────────────┐                     │    │
│  │     │   💬 Chat with Carol Now    │  ← Primary CTA      │    │
│  │     └─────────────────────────────┘                     │    │
│  │                                                         │    │
│  │     ⭐⭐⭐⭐⭐ 4.9/5 from 200+ reviews                  │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TRUST BADGES                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  ✓ Fully Insured    ✓ Background Checked    ✓ Guaranteed│    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SERVICES SECTION                                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Our Services                         │    │
│  │                                                         │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │    │
│  │  │ Regular │  │  Deep   │  │Move-in/ │  │ Office  │    │    │
│  │  │Cleaning │  │Cleaning │  │Move-out │  │Cleaning │    │    │
│  │  │         │  │         │  │         │  │         │    │    │
│  │  │ Weekly, │  │ Top to  │  │ Fresh   │  │ Clean   │    │    │
│  │  │biweekly │  │ bottom  │  │ start   │  │workplace│    │    │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  HOW IT WORKS                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │      ①                  ②                  ③            │    │
│  │   ┌──────┐          ┌──────┐          ┌──────┐         │    │
│  │   │ Chat │    →     │Visit │    →     │Enjoy │         │    │
│  │   │ with │          │ for  │          │ your │         │    │
│  │   │Carol │          │quote │          │clean │         │    │
│  │   └──────┘          └──────┘          │ home │         │    │
│  │                                       └──────┘         │    │
│  │   Chat with our      Free 15-min      Relax while      │    │
│  │   virtual assistant  estimate visit   we handle        │    │
│  │   anytime, 24/7      at your home     the rest         │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TESTIMONIALS                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 What Our Clients Say                    │    │
│  │                                                         │    │
│  │  ┌─────────────────────────────────────────────────┐   │    │
│  │  │ "Amazing service! Thayna is professional and    │   │    │
│  │  │  thorough. My house has never been cleaner."    │   │    │
│  │  │                                                 │   │    │
│  │  │  ⭐⭐⭐⭐⭐  Sarah M. - Miami Beach             │   │    │
│  │  └─────────────────────────────────────────────────┘   │    │
│  │                                                         │    │
│  │  [  ←  ]  ● ○ ○ ○ ○  [  →  ]   (carousel)              │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FAQ SECTION                                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Frequently Asked Questions                 │    │
│  │                                                         │    │
│  │  ┌─────────────────────────────────────────────────┐   │    │
│  │  │ ▼ Do you bring your own supplies?               │   │    │
│  │  │   Yes! We bring all cleaning products...        │   │    │
│  │  └─────────────────────────────────────────────────┘   │    │
│  │  ┌─────────────────────────────────────────────────┐   │    │
│  │  │ ► Are you insured?                              │   │    │
│  │  └─────────────────────────────────────────────────┘   │    │
│  │  ┌─────────────────────────────────────────────────┐   │    │
│  │  │ ► Do I need to be home?                         │   │    │
│  │  └─────────────────────────────────────────────────┘   │    │
│  │  ┌─────────────────────────────────────────────────┐   │    │
│  │  │ ► What's your cancellation policy?              │   │    │
│  │  └─────────────────────────────────────────────────┘   │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CTA SECTION                                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │        Ready for a Cleaner Home?                        │    │
│  │                                                         │    │
│  │        ┌─────────────────────────────┐                  │    │
│  │        │   💬 Get Your Free Quote    │                  │    │
│  │        └─────────────────────────────┘                  │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FOOTER                                                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │  Caroline Premium Cleaning                              │    │
│  │                                                         │    │
│  │  Contact                    Service Areas               │    │
│  │  📞 (305) 555-1234          Miami                       │    │
│  │  ✉️ hello@caroline.com      Miami Beach                 │    │
│  │                             Coral Gables                │    │
│  │                             Brickell                    │    │
│  │                                                         │    │
│  │  © 2024 Caroline Premium Cleaning. All rights reserved. │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CHAT WIDGET (flutuante, canto inferior direito)                │
│                                              ┌─────────────┐    │
│                                              │     💬      │    │
│                                              │   Chat      │    │
│                                              └─────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Componentes:**
- `components/landing/header.tsx`
- `components/landing/hero.tsx`
- `components/landing/trust-badges.tsx`
- `components/landing/services.tsx`
- `components/landing/how-it-works.tsx`
- `components/landing/testimonials.tsx`
- `components/landing/faq.tsx`
- `components/landing/cta-section.tsx`
- `components/landing/footer.tsx`
- `components/chat/chat-widget.tsx` (flutuante)

**Interações:**
- Click no CTA → Abre Chat Widget
- Scroll → Header fica fixo com sombra
- FAQ → Accordion expandível

---

### 2.2 Chat Fullscreen

**Rota:** `/chat`  
**Arquivo:** `app/(public)/chat/page.tsx`

**Propósito:** Versão fullscreen do chat para mobile ou acesso direto.

**Estrutura da Página:**

```
┌─────────────────────────────────────────────────────────────────┐
│  MOBILE VIEW (375px)                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  ←  Caroline Premium Cleaning                     ✕     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │                                                         │    │
│  │   ┌────────────────────────────────┐                    │    │
│  │   │ Hi! I'm Carol from Caroline    │                    │    │
│  │   │ Premium Cleaning. How can I    │                    │    │
│  │   │ help you today?                │                    │    │
│  │   └────────────────────────────────┘                    │    │
│  │   🤖 Carol · just now                                   │    │
│  │                                                         │    │
│  │                                                         │    │
│  │                    ┌────────────────────────────────┐   │    │
│  │                    │ I'm looking for house cleaning │   │    │
│  │                    └────────────────────────────────┘   │    │
│  │                                          You · 2:34 PM  │    │
│  │                                                         │    │
│  │                                                         │    │
│  │   ┌────────────────────────────────┐                    │    │
│  │   │ Great! I'd be happy to help.   │                    │    │
│  │   │ Let me get a few details.      │                    │    │
│  │   │                                │                    │    │
│  │   │ What's your name?              │                    │    │
│  │   └────────────────────────────────┘                    │    │
│  │   🤖 Carol · just now                                   │    │
│  │                                                         │    │
│  │                                                         │    │
│  │   ┌────────────────────────────────┐                    │    │
│  │   │ ···                            │  ← Typing          │    │
│  │   └────────────────────────────────┘    indicator       │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │ Type your message...                        📎  │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  │                                              [Send →]   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Componentes:**
- `components/chat/chat-header.tsx`
- `components/chat/chat-messages.tsx`
- `components/chat/message-bubble.tsx`
- `components/chat/typing-indicator.tsx`
- `components/chat/chat-input.tsx`

**Estados:**
```typescript
interface ChatState {
  messages: Message[];
  isLoading: boolean;
  sessionId: string;
  error: string | null;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'error';
}
```

**Funcionalidades:**
- Scroll automático para última mensagem
- Indicador de digitação enquanto aguarda resposta
- Retry em caso de erro
- Session ID persistido no localStorage
- Responsive: mesma interface no widget e fullscreen

---

### 2.3 Login

**Rota:** `/login`  
**Arquivo:** `app/(auth)/login/page.tsx`

**Propósito:** Autenticação da Thayna para acessar o painel admin.

**Estrutura da Página:**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                                                                 │
│                                                                 │
│               ┌─────────────────────────────────┐               │
│               │                                 │               │
│               │     [Logo Caroline Cleaning]    │               │
│               │                                 │               │
│               │     ─────────────────────────   │               │
│               │                                 │               │
│               │     Welcome back                │               │
│               │     Sign in to your account     │               │
│               │                                 │               │
│               │     ┌───────────────────────┐   │               │
│               │     │ Email                 │   │               │
│               │     │ thayna@caroline.com   │   │               │
│               │     └───────────────────────┘   │               │
│               │                                 │               │
│               │     ┌───────────────────────┐   │               │
│               │     │ Password              │   │               │
│               │     │ ••••••••••••          │   │               │
│               │     └───────────────────────┘   │               │
│               │                                 │               │
│               │     ☐ Remember me               │               │
│               │                                 │               │
│               │     ┌───────────────────────┐   │               │
│               │     │      Sign In          │   │               │
│               │     └───────────────────────┘   │               │
│               │                                 │               │
│               │     Forgot password?            │               │
│               │                                 │               │
│               └─────────────────────────────────┘               │
│                                                                 │
│                                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Componentes:**
- `components/auth/login-form.tsx`

**Funcionalidades:**
- Login com Supabase Auth (email/password)
- Redirect para `/admin` após sucesso
- Mensagem de erro em caso de falha
- "Remember me" para persistir sessão

---

## 3. ROTAS PROTEGIDAS (ADMIN)

### 3.1 Layout Admin

**Arquivo:** `app/(admin)/layout.tsx`

**Estrutura:**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌──────────┐  ┌────────────────────────────────────────────┐  │
│  │          │  │  HEADER                                    │  │
│  │          │  │  ┌────────────────────────────────────────┐│  │
│  │          │  │  │ 🔍 Search...          [🔔] [👤 Thayna]││  │
│  │          │  │  └────────────────────────────────────────┘│  │
│  │          │  └────────────────────────────────────────────┘  │
│  │          │                                                  │
│  │ SIDEBAR  │  ┌────────────────────────────────────────────┐  │
│  │          │  │                                            │  │
│  │ ┌──────┐ │  │                                            │  │
│  │ │ Logo │ │  │                                            │  │
│  │ └──────┘ │  │                                            │  │
│  │          │  │                                            │  │
│  │ ────────── │  │              PAGE CONTENT                 │  │
│  │          │  │                                            │  │
│  │ 🏠 Dashboard│ │              (children)                   │  │
│  │ 📅 Agenda  │  │                                            │  │
│  │ 👥 Clientes│  │                                            │  │
│  │ 📄 Contratos│ │                                            │  │
│  │ 💰 Financeiro│ │                                           │  │
│  │          │  │                                            │  │
│  │ ────────── │  │                                            │  │
│  │          │  │                                            │  │
│  │ ⚙️ Config  │  │                                            │  │
│  │          │  │                                            │  │
│  │          │  │                                            │  │
│  │ ────────── │  │                                            │  │
│  │ 🚪 Logout │  │                                            │  │
│  │          │  │                                            │  │
│  └──────────┘  └────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Componentes:**
- `components/admin/sidebar.tsx`
- `components/admin/header.tsx`
- `components/admin/user-menu.tsx`

**Mobile (Sidebar como drawer):**
```
┌─────────────────────────────────────────┐
│  ☰  Caroline Admin         [🔔] [👤]   │
├─────────────────────────────────────────┤
│                                         │
│              PAGE CONTENT               │
│                                         │
└─────────────────────────────────────────┘
```

---

### 3.2 Dashboard

**Rota:** `/admin`  
**Arquivo:** `app/(admin)/admin/page.tsx`

**Propósito:** Visão geral rápida do dia e alertas importantes.

**Estrutura da Página:**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Dashboard                                      Dec 11, 2024    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                      STATS CARDS                        │    │
│  │                                                         │    │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────┐ │    │
│  │  │  Today    │ │  This     │ │  Active   │ │ Pending │ │    │
│  │  │           │ │  Week     │ │  Clients  │ │  Leads  │ │    │
│  │  │     4     │ │    12     │ │    28     │ │    3    │ │    │
│  │  │ cleanings │ │ cleanings │ │           │ │         │ │    │
│  │  │           │ │           │ │           │ │         │ │    │
│  │  │  $720     │ │  $2,160   │ │  +2 new   │ │ Action  │ │    │
│  │  │  revenue  │ │  revenue  │ │  this wk  │ │ needed  │ │    │
│  │  └───────────┘ └───────────┘ └───────────┘ └─────────┘ │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌──────────────────────────────┐ ┌────────────────────────┐    │
│  │      TODAY'S SCHEDULE        │ │       ALERTS          │    │
│  │                              │ │                        │    │
│  │  ┌────────────────────────┐  │ │  ⚠️ 3 pending leads   │    │
│  │  │ 9:00 AM                │  │ │     Need follow-up    │    │
│  │  │ 🟢 Sarah Mitchell      │  │ │                        │    │
│  │  │ 123 Ocean Dr, Miami    │  │ │  ⭐ Low rating (2/5)  │    │
│  │  │ Regular · 3BR/2BA      │  │ │     John D. - Dec 10  │    │
│  │  │ $180                   │  │ │     [Call now]        │    │
│  │  └────────────────────────┘  │ │                        │    │
│  │                              │ │  📅 3 clients inactive │    │
│  │  ┌────────────────────────┐  │ │     for 30+ days      │    │
│  │  │ 1:00 PM                │  │ │                        │    │
│  │  │ 🟡 Jennifer Lopez      │  │ │                        │    │
│  │  │ 456 Palm Ave           │  │ │                        │    │
│  │  │ Deep Clean · 4BR/3BA   │  │ │                        │    │
│  │  │ $350                   │  │ │                        │    │
│  │  └────────────────────────┘  │ │                        │    │
│  │                              │ │                        │    │
│  │  ┌────────────────────────┐  │ │                        │    │
│  │  │ 5:00 PM                │  │ │                        │    │
│  │  │ ⚪ NEW - Mike Johnson  │  │ │                        │    │
│  │  │ 789 Beach Blvd         │  │ │                        │    │
│  │  │ Estimate Visit         │  │ │                        │    │
│  │  └────────────────────────┘  │ │                        │    │
│  │                              │ │                        │    │
│  │  [View Full Agenda →]        │ │                        │    │
│  └──────────────────────────────┘ └────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   QUICK ACTIONS                         │    │
│  │                                                         │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │    │
│  │  │ + New       │ │ + New       │ │ 📊 View     │       │    │
│  │  │   Client    │ │   Booking   │ │   Reports   │       │    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Componentes:**
- `components/admin/dashboard/stats-cards.tsx`
- `components/admin/dashboard/today-schedule.tsx`
- `components/admin/dashboard/alerts-panel.tsx`
- `components/admin/dashboard/quick-actions.tsx`

**Dados necessários:**
```typescript
interface DashboardData {
  stats: {
    todayCleanings: number;
    todayRevenue: number;
    weekCleanings: number;
    weekRevenue: number;
    activeClients: number;
    newClientsThisWeek: number;
    pendingLeads: number;
  };
  todaySchedule: Appointment[];
  alerts: Alert[];
}
```

---

### 3.3 Agenda

**Rota:** `/admin/agenda`  
**Arquivo:** `app/(admin)/admin/agenda/page.tsx`

**Propósito:** Visualização e gestão do calendário de agendamentos.

**Estrutura da Página:**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Agenda                                                         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  ┌─────────┐                                            │    │
│  │  │+ Novo   │    [Day] [Week] [Month]     ◄ Dec 2024 ►  │    │
│  │  │Agendamento│                                          │    │
│  │  └─────────┘                                            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    WEEK VIEW                            │    │
│  │                                                         │    │
│  │       Mon    Tue    Wed    Thu    Fri    Sat    Sun    │    │
│  │        9     10     11     12     13     14     15     │    │
│  │  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐          │    │
│  │  │     │     │     │     │     │     │     │  8:00    │    │
│  │  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤          │    │
│  │  │🟢   │     │🟢   │     │🟢   │     │     │  9:00    │    │
│  │  │Sarah│     │Sarah│     │Mike │     │     │          │    │
│  │  │     │     │     │     │     │     │     │          │    │
│  │  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤          │    │
│  │  │     │     │     │     │     │     │     │ 10:00    │    │
│  │  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤          │    │
│  │  │     │     │     │     │     │     │     │ 11:00    │    │
│  │  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤          │    │
│  │  │     │🟡   │     │     │     │     │     │ 12:00    │    │
│  │  │     │Deep │     │     │     │     │     │          │    │
│  │  │     │Clean│     │     │     │     │     │          │    │
│  │  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤          │    │
│  │  │     │     │🟢   │     │     │     │     │  1:00    │    │
│  │  │     │     │Jen  │     │     │     │     │          │    │
│  │  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤          │    │
│  │  │     │     │     │     │     │     │     │  2:00    │    │
│  │  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤          │    │
│  │  │     │     │     │     │     │     │     │  3:00    │    │
│  │  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤          │    │
│  │  │     │     │     │     │     │     │     │  4:00    │    │
│  │  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤          │    │
│  │  │     │     │⚪   │     │     │     │     │  5:00    │    │
│  │  │     │     │Visit│     │     │     │     │          │    │
│  │  │     │     │Mike │     │     │     │     │          │    │
│  │  └─────┴─────┴─────┴─────┴─────┴─────┴─────┘          │    │
│  │                                                         │    │
│  │  LEGENDA:                                               │    │
│  │  🟢 Regular  🟡 Deep  🔵 Move  🟣 Office  🟠 Airbnb  ⚪ Visit│    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Modal: Novo Agendamento**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   Novo Agendamento                  ✕   │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │                                                         │    │
│  │  Cliente *                                              │    │
│  │  ┌─────────────────────────────────────────────────┐   │    │
│  │  │ 🔍 Buscar cliente...                       ▼    │   │    │
│  │  └─────────────────────────────────────────────────┘   │    │
│  │  [+ Novo Cliente]                                       │    │
│  │                                                         │    │
│  │  Tipo de Serviço *                                      │    │
│  │  ┌─────────────────────────────────────────────────┐   │    │
│  │  │ ○ Regular  ○ Deep  ○ Move-in/out  ○ Office     │   │    │
│  │  │ ○ Airbnb   ○ Estimate Visit                    │   │    │
│  │  └─────────────────────────────────────────────────┘   │    │
│  │                                                         │    │
│  │  Data *                        Horário *                │    │
│  │  ┌───────────────────┐        ┌───────────────────┐    │    │
│  │  │ 📅 Dec 11, 2024   │        │ 🕐 9:00 AM    ▼   │    │    │
│  │  └───────────────────┘        └───────────────────┘    │    │
│  │                                                         │    │
│  │  Duração estimada              Valor                    │    │
│  │  ┌───────────────────┐        ┌───────────────────┐    │    │
│  │  │ 3 horas           │        │ $ 180.00          │    │    │
│  │  └───────────────────┘        └───────────────────┘    │    │
│  │                                                         │    │
│  │  Notas                                                  │    │
│  │  ┌─────────────────────────────────────────────────┐   │    │
│  │  │                                                 │   │    │
│  │  │                                                 │   │    │
│  │  └─────────────────────────────────────────────────┘   │    │
│  │                                                         │    │
│  │  ☐ Criar recorrência (bi-weekly)                        │    │
│  │                                                         │    │
│  │  ┌─────────────┐  ┌─────────────────────────────────┐  │    │
│  │  │   Cancelar  │  │        Salvar Agendamento       │  │    │
│  │  └─────────────┘  └─────────────────────────────────┘  │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Componentes:**
- `components/admin/calendar/calendar-view.tsx`
- `components/admin/calendar/calendar-header.tsx`
- `components/admin/calendar/day-view.tsx`
- `components/admin/calendar/week-view.tsx`
- `components/admin/calendar/month-view.tsx`
- `components/admin/calendar/appointment-card.tsx`
- `components/admin/calendar/appointment-modal.tsx`

**Funcionalidades:**
- Alternar entre Day/Week/Month view
- Drag & drop para reagendar (nice to have)
- Click em slot vazio → Modal novo agendamento
- Click em agendamento → Modal de edição
- Cores por tipo de serviço
- Filtro por tipo de serviço

---

### 3.4 Lista de Clientes

**Rota:** `/admin/clientes`  
**Arquivo:** `app/(admin)/admin/clientes/page.tsx`

**Propósito:** Visualizar e gerenciar todos os clientes.

**Estrutura da Página:**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Clientes                                                       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  ┌─────────┐  ┌─────────────────────────────────────┐   │    │
│  │  │+ Novo   │  │ 🔍 Buscar por nome, email, tel...   │   │    │
│  │  │Cliente  │  └─────────────────────────────────────┘   │    │
│  │  └─────────┘                                            │    │
│  │                                                         │    │
│  │  Filtros: [Todos ▼] [Status ▼] [Frequência ▼]          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │  ┌─────────────────────────────────────────────────┐   │    │
│  │  │ Nome          │ Telefone    │ Status  │ Freq.  │→ │   │    │
│  │  ├───────────────┼─────────────┼─────────┼────────┼───┤   │    │
│  │  │ Sarah Mitchell│(305)555-1234│ ●Active │Bi-week │ → │   │    │
│  │  ├───────────────┼─────────────┼─────────┼────────┼───┤   │    │
│  │  │ Jennifer Lopez│(305)555-5678│ ●Active │Weekly  │ → │   │    │
│  │  ├───────────────┼─────────────┼─────────┼────────┼───┤   │    │
│  │  │ Mike Johnson  │(305)555-9999│ ○Lead   │ -      │ → │   │    │
│  │  ├───────────────┼─────────────┼─────────┼────────┼───┤   │    │
│  │  │ Emma Wilson   │(305)555-4321│ ●Active │Monthly │ → │   │    │
│  │  ├───────────────┼─────────────┼─────────┼────────┼───┤   │    │
│  │  │ David Brown   │(305)555-8765│ ○Paused │Bi-week │ → │   │    │
│  │  └───────────────┴─────────────┴─────────┴────────┴───┘   │    │
│  │                                                         │    │
│  │  Showing 1-10 of 45 clients     [← 1 2 3 4 5 →]         │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Componentes:**
- `components/admin/clients/client-list.tsx`
- `components/admin/clients/client-filters.tsx`
- `components/admin/clients/client-row.tsx`
- `components/admin/clients/new-client-modal.tsx`

---

### 3.5 Ficha do Cliente

**Rota:** `/admin/clientes/[id]`  
**Arquivo:** `app/(admin)/admin/clientes/[id]/page.tsx`

**Propósito:** Visualizar detalhes completos e histórico de um cliente.

**Estrutura da Página:**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ← Voltar para Clientes                                         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │  ┌──────┐  Sarah Mitchell                    [Editar]  │    │
│  │  │      │  ●Active · Bi-weekly · Since Jan 2024        │    │
│  │  │  SM  │                                               │    │
│  │  │      │  📞 (305) 555-1234                            │    │
│  │  └──────┘  ✉️ sarah@email.com                           │    │
│  │            📍 123 Ocean Drive, Miami Beach, FL 33139    │    │
│  │            🏠 3 bed / 2 bath                            │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  [Info] [Agendamentos] [Financeiro] [Contrato] [Notas]  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                       TAB: INFO                         │    │
│  │                                                         │    │
│  │  ┌──────────────────────┐  ┌──────────────────────┐    │    │
│  │  │ SERVIÇO              │  │ RECORRÊNCIA          │    │    │
│  │  │                      │  │                      │    │    │
│  │  │ Tipo: Regular        │  │ Frequência: Bi-weekly│    │    │
│  │  │ Valor: $171/visita   │  │ Dia: Wednesday       │    │    │
│  │  │ Duração: 3h          │  │ Horário: 9:00 AM     │    │    │
│  │  │                      │  │ Próximo: Dec 18      │    │    │
│  │  │ Desconto: 10%        │  │                      │    │    │
│  │  └──────────────────────┘  └──────────────────────┘    │    │
│  │                                                         │    │
│  │  ┌──────────────────────┐  ┌──────────────────────┐    │    │
│  │  │ ACESSO               │  │ ESTATÍSTICAS         │    │    │
│  │  │                      │  │                      │    │    │
│  │  │ ☐ Cliente em casa    │  │ Total serviços: 24   │    │    │
│  │  │ ☑ Código garagem     │  │ Total gasto: $4,104  │    │    │
│  │  │   Code: 1234         │  │ Rating médio: 4.8    │    │    │
│  │  │ ☐ Chave guardada     │  │ No-shows: 0          │    │    │
│  │  │                      │  │                      │    │    │
│  │  └──────────────────────┘  └──────────────────────┘    │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   TAB: AGENDAMENTOS                     │    │
│  │                                                         │    │
│  │  Próximos                                               │    │
│  │  ┌─────────────────────────────────────────────────┐   │    │
│  │  │ Dec 18, 2024 · 9:00 AM · Regular · $171         │   │    │
│  │  └─────────────────────────────────────────────────┘   │    │
│  │                                                         │    │
│  │  Histórico                                              │    │
│  │  ┌─────────────────────────────────────────────────┐   │    │
│  │  │ Dec 4, 2024 · Regular · $171 · ✓ Concluído ⭐5  │   │    │
│  │  ├─────────────────────────────────────────────────┤   │    │
│  │  │ Nov 20, 2024 · Regular · $171 · ✓ Concluído ⭐5 │   │    │
│  │  ├─────────────────────────────────────────────────┤   │    │
│  │  │ Nov 6, 2024 · Regular · $171 · ✓ Concluído ⭐4  │   │    │
│  │  └─────────────────────────────────────────────────┘   │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Componentes:**
- `components/admin/clients/client-header.tsx`
- `components/admin/clients/client-tabs.tsx`
- `components/admin/clients/tabs/info-tab.tsx`
- `components/admin/clients/tabs/appointments-tab.tsx`
- `components/admin/clients/tabs/financial-tab.tsx`
- `components/admin/clients/tabs/contract-tab.tsx`
- `components/admin/clients/tabs/notes-tab.tsx`

---

### 3.6 Contratos

**Rota:** `/admin/contratos`  
**Arquivo:** `app/(admin)/admin/contratos/page.tsx`

**Propósito:** Gerenciar contratos de clientes.

**Estrutura da Página:**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Contratos                                                      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  ┌───────────┐  ┌───────────────────────────────────┐   │    │
│  │  │+ Novo     │  │ 🔍 Buscar...                      │   │    │
│  │  │Contrato   │  └───────────────────────────────────┘   │    │
│  │  └───────────┘                                          │    │
│  │                                                         │    │
│  │  Filtros: [Todos ▼] [Ativos ▼]                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │  ┌─────────────────────────────────────────────────┐   │    │
│  │  │ Cliente       │ Data      │ Valor   │ Status │⋯│   │    │
│  │  ├───────────────┼───────────┼─────────┼────────┼───┤   │    │
│  │  │ Sarah Mitchell│ Jan 15/24 │ $171/vis│ ●Ativo │ ⋯│   │    │
│  │  ├───────────────┼───────────┼─────────┼────────┼───┤   │    │
│  │  │ Jennifer Lopez│ Mar 02/24 │ $220/vis│ ●Ativo │ ⋯│   │    │
│  │  ├───────────────┼───────────┼─────────┼────────┼───┤   │    │
│  │  │ Emma Wilson   │ Jun 10/24 │ $190/vis│ ●Ativo │ ⋯│   │    │
│  │  └───────────────┴───────────┴─────────┴────────┴───┘   │    │
│  │                                                         │    │
│  │  ⋯ Menu: [Ver PDF] [Editar] [Encerrar]                  │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Modal: Novo Contrato**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Novo Contrato                    ✕   │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │                                                         │    │
│  │  Cliente *                                              │    │
│  │  ┌─────────────────────────────────────────────────┐   │    │
│  │  │ Sarah Mitchell                              ▼   │   │    │
│  │  └─────────────────────────────────────────────────┘   │    │
│  │                                                         │    │
│  │  Tipo de Serviço *           Frequência *               │    │
│  │  ┌───────────────────┐      ┌───────────────────┐      │    │
│  │  │ Regular       ▼   │      │ Bi-weekly     ▼   │      │    │
│  │  └───────────────────┘      └───────────────────┘      │    │
│  │                                                         │    │
│  │  Valor por visita *          Dia preferido              │    │
│  │  ┌───────────────────┐      ┌───────────────────┐      │    │
│  │  │ $ 171.00          │      │ Wednesday     ▼   │      │    │
│  │  └───────────────────┘      └───────────────────┘      │    │
│  │                                                         │    │
│  │  Add-ons inclusos                                       │    │
│  │  ☐ Inside oven ($35)    ☐ Inside fridge ($35)          │    │
│  │  ☐ Laundry ($30/load)   ☐ Inside cabinets ($25)        │    │
│  │                                                         │    │
│  │  ─────────────────────────────────────────────────      │    │
│  │                                                         │    │
│  │  ┌─────────────────────────────────────────────────┐   │    │
│  │  │                                                 │   │    │
│  │  │           [Pré-visualização do Contrato]        │   │    │
│  │  │                                                 │   │    │
│  │  │           Caroline Premium Cleaning             │   │    │
│  │  │              Service Agreement                  │   │    │
│  │  │                   ...                           │   │    │
│  │  │                                                 │   │    │
│  │  └─────────────────────────────────────────────────┘   │    │
│  │                                                         │    │
│  │  ┌─────────────┐  ┌─────────────────────────────────┐  │    │
│  │  │   Cancelar  │  │     Gerar e Enviar Contrato     │  │    │
│  │  └─────────────┘  └─────────────────────────────────┘  │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Componentes:**
- `components/admin/contracts/contract-list.tsx`
- `components/admin/contracts/contract-row.tsx`
- `components/admin/contracts/new-contract-modal.tsx`
- `components/admin/contracts/contract-preview.tsx`
- `components/admin/contracts/contract-pdf-viewer.tsx`

---

### 3.7 Financeiro

**Rota:** `/admin/financeiro`  
**Arquivo:** `app/(admin)/admin/financeiro/page.tsx`

**Propósito:** Visão financeira completa do negócio.

**Estrutura da Página:**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Financeiro                                    [Dez 2024 ▼]     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                      RESUMO DO MÊS                      │    │
│  │                                                         │    │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ │    │
│  │  │    RECEITA    │ │    CUSTOS     │ │    LUCRO      │ │    │
│  │  │               │ │               │ │               │ │    │
│  │  │   $7,200      │ │   $1,800      │ │   $5,400      │ │    │
│  │  │   ▲ 12%       │ │   ▼ 5%        │ │   ▲ 18%       │ │    │
│  │  │   vs Nov      │ │   vs Nov      │ │   vs Nov      │ │    │
│  │  └───────────────┘ └───────────────┘ └───────────────┘ │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌──────────────────────────────┐ ┌────────────────────────┐    │
│  │    RECEITA POR TIPO          │ │   META MENSAL          │    │
│  │                              │ │                        │    │
│  │  Regular      $4,200  58%    │ │   Meta: $8,000         │    │
│  │  ████████████████████        │ │                        │    │
│  │                              │ │   ████████████░░░░     │    │
│  │  Deep         $1,800  25%    │ │   $7,200 / $8,000      │    │
│  │  ████████                    │ │   90%                  │    │
│  │                              │ │                        │    │
│  │  Move-in/out  $900    12%    │ │   Faltam: $800         │    │
│  │  ████                        │ │   ~4 serviços          │    │
│  │                              │ │                        │    │
│  │  Office       $300    5%     │ │   [Editar Meta]        │    │
│  │  ██                          │ │                        │    │
│  │                              │ │                        │    │
│  └──────────────────────────────┘ └────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    TRANSAÇÕES                           │    │
│  │                                                         │    │
│  │  [+ Receita]  [+ Custo]              [Exportar CSV]     │    │
│  │                                                         │    │
│  │  ┌─────────────────────────────────────────────────┐   │    │
│  │  │ Data     │ Descrição          │ Tipo   │ Valor  │   │    │
│  │  ├──────────┼────────────────────┼────────┼────────┤   │    │
│  │  │ Dec 11   │ Sarah M. - Regular │ Receita│ +$171  │   │    │
│  │  ├──────────┼────────────────────┼────────┼────────┤   │    │
│  │  │ Dec 11   │ Produtos limpeza   │ Custo  │ -$45   │   │    │
│  │  ├──────────┼────────────────────┼────────┼────────┤   │    │
│  │  │ Dec 10   │ Jennifer L.- Deep  │ Receita│ +$350  │   │    │
│  │  ├──────────┼────────────────────┼────────┼────────┤   │    │
│  │  │ Dec 10   │ Gasolina           │ Custo  │ -$60   │   │    │
│  │  └──────────┴────────────────────┴────────┴────────┘   │    │
│  │                                                         │    │
│  │  [← 1 2 3 →]                                            │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    PROJEÇÃO                             │    │
│  │                                                         │    │
│  │  Baseado em 28 recorrências ativas:                     │    │
│  │                                                         │    │
│  │  Janeiro 2025:  ~$6,800                                 │    │
│  │  Fevereiro 2025: ~$6,800                                │    │
│  │  Março 2025:    ~$6,800                                 │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Modal: Nova Transação**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   Nova Transação                    ✕   │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │                                                         │    │
│  │  Tipo *                                                 │    │
│  │  ○ Receita    ○ Custo                                   │    │
│  │                                                         │    │
│  │  Valor *                       Data *                   │    │
│  │  ┌───────────────────┐        ┌───────────────────┐    │    │
│  │  │ $ 45.00           │        │ 📅 Dec 11, 2024   │    │    │
│  │  └───────────────────┘        └───────────────────┘    │    │
│  │                                                         │    │
│  │  Categoria *                                            │    │
│  │  ┌─────────────────────────────────────────────────┐   │    │
│  │  │ Produtos de limpeza                         ▼   │   │    │
│  │  └─────────────────────────────────────────────────┘   │    │
│  │                                                         │    │
│  │  Descrição                                              │    │
│  │  ┌─────────────────────────────────────────────────┐   │    │
│  │  │ Compra de produtos no Costco                    │   │    │
│  │  └─────────────────────────────────────────────────┘   │    │
│  │                                                         │    │
│  │  Método de pagamento                                    │    │
│  │  ○ Cash    ○ Zelle    ○ Outro                          │    │
│  │                                                         │    │
│  │  ┌─────────────┐  ┌─────────────────────────────────┐  │    │
│  │  │   Cancelar  │  │           Salvar                │  │    │
│  │  └─────────────┘  └─────────────────────────────────┘  │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Componentes:**
- `components/admin/financial/summary-cards.tsx`
- `components/admin/financial/revenue-by-type.tsx`
- `components/admin/financial/monthly-goal.tsx`
- `components/admin/financial/transactions-table.tsx`
- `components/admin/financial/new-transaction-modal.tsx`
- `components/admin/financial/projection.tsx`

---

### 3.8 Configurações

**Rota:** `/admin/configuracoes`  
**Arquivo:** `app/(admin)/admin/configuracoes/page.tsx`

**Propósito:** Configurar parâmetros do sistema.

**Estrutura da Página:**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Configurações                                                  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  [Geral] [Horários] [Áreas] [Preços] [Notificações]     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                      TAB: GERAL                         │    │
│  │                                                         │    │
│  │  Nome da Empresa                                        │    │
│  │  ┌─────────────────────────────────────────────────┐   │    │
│  │  │ Caroline Premium Cleaning                       │   │    │
│  │  └─────────────────────────────────────────────────┘   │    │
│  │                                                         │    │
│  │  Telefone                       Email                   │    │
│  │  ┌───────────────────┐         ┌───────────────────┐   │    │
│  │  │ (305) 555-1234    │         │ hello@caroline.com│   │    │
│  │  └───────────────────┘         └───────────────────┘   │    │
│  │                                                         │    │
│  │  Endereço base (para cálculo de deslocamento)           │    │
│  │  ┌─────────────────────────────────────────────────┐   │    │
│  │  │ 500 Main St, Miami, FL 33139                    │   │    │
│  │  └─────────────────────────────────────────────────┘   │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                     TAB: HORÁRIOS                       │    │
│  │                                                         │    │
│  │  Horário de funcionamento                               │    │
│  │  ┌───────────────────┐  até  ┌───────────────────┐     │    │
│  │  │ 8:00 AM           │       │ 6:00 PM           │     │    │
│  │  └───────────────────┘       └───────────────────┘     │    │
│  │                                                         │    │
│  │  Buffer entre serviços (deslocamento)                   │    │
│  │  ┌─────────────────────────────────────────────────┐   │    │
│  │  │ 60 minutos                                  ▼   │   │    │
│  │  └─────────────────────────────────────────────────┘   │    │
│  │                                                         │    │
│  │  Dias de trabalho                                       │    │
│  │  ☑ Mon  ☑ Tue  ☑ Wed  ☑ Thu  ☑ Fri  ☑ Sat  ☐ Sun      │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                      TAB: ÁREAS                         │    │
│  │                                                         │    │
│  │  Áreas atendidas                    [+ Adicionar]       │    │
│  │                                                         │    │
│  │  ┌─────────────────────────────────────────────────┐   │    │
│  │  │ Miami                                       [✕] │   │    │
│  │  │ Miami Beach                                 [✕] │   │    │
│  │  │ Coral Gables                                [✕] │   │    │
│  │  │ Brickell                                    [✕] │   │    │
│  │  │ Coconut Grove                               [✕] │   │    │
│  │  └─────────────────────────────────────────────────┘   │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│                                         [Salvar Alterações]     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Componentes:**
- `components/admin/settings/settings-tabs.tsx`
- `components/admin/settings/general-settings.tsx`
- `components/admin/settings/schedule-settings.tsx`
- `components/admin/settings/areas-settings.tsx`
- `components/admin/settings/pricing-settings.tsx`
- `components/admin/settings/notifications-settings.tsx`

---

## 4. API ROUTES

### 4.1 POST /api/chat

**Arquivo:** `app/api/chat/route.ts`

**Propósito:** Receber mensagem do chat e encaminhar para n8n.

```typescript
// Request
interface ChatRequest {
  session_id: string;
  message: string;
  metadata?: {
    page_url?: string;
    user_agent?: string;
    client_id?: string; // se cliente já identificado
  };
}

// Response
interface ChatResponse {
  response: string;
  actions?: {
    type: 'show_slots' | 'confirm_booking' | 'escalate';
    data?: any;
  };
}
```

**Fluxo:**
1. Recebe mensagem do frontend
2. Envia POST para webhook n8n
3. Aguarda resposta do n8n
4. Retorna resposta para frontend

---

### 4.2 POST /api/webhooks/n8n

**Arquivo:** `app/api/webhooks/n8n/route.ts`

**Propósito:** Receber callbacks do n8n (ex: notificações realtime).

```typescript
// Possíveis eventos do n8n
interface N8NWebhookPayload {
  event: 'new_lead' | 'booking_confirmed' | 'alert';
  data: any;
}
```

---

### 4.3 GET /api/slots

**Arquivo:** `app/api/slots/route.ts`

**Propósito:** Retornar slots disponíveis para agendamento.

```typescript
// Request (query params)
interface SlotsRequest {
  date: string; // YYYY-MM-DD
  duration?: number; // minutos, default 180
}

// Response
interface SlotsResponse {
  date: string;
  slots: {
    start: string; // HH:mm
    end: string;
    available: boolean;
  }[];
}
```

---

## 5. COMPONENTES COMPARTILHADOS

### 5.1 UI Components (shadcn/ui)

```
components/ui/
├── button.tsx
├── input.tsx
├── textarea.tsx
├── select.tsx
├── checkbox.tsx
├── radio-group.tsx
├── switch.tsx
├── dialog.tsx (modal)
├── sheet.tsx (drawer)
├── dropdown-menu.tsx
├── tabs.tsx
├── table.tsx
├── card.tsx
├── badge.tsx
├── avatar.tsx
├── calendar.tsx
├── toast.tsx
├── skeleton.tsx
├── separator.tsx
└── accordion.tsx
```

### 5.2 Componentes Customizados

```
components/
├── chat/
│   ├── chat-widget.tsx          # Widget flutuante
│   ├── chat-window.tsx          # Container do chat
│   ├── chat-header.tsx          # Header do chat
│   ├── chat-messages.tsx        # Lista de mensagens
│   ├── message-bubble.tsx       # Bolha individual
│   ├── typing-indicator.tsx     # Indicador "..."
│   └── chat-input.tsx           # Input de mensagem
│
├── landing/
│   ├── header.tsx
│   ├── hero.tsx
│   ├── trust-badges.tsx
│   ├── services.tsx
│   ├── how-it-works.tsx
│   ├── testimonials.tsx
│   ├── faq.tsx
│   ├── cta-section.tsx
│   └── footer.tsx
│
├── admin/
│   ├── sidebar.tsx
│   ├── header.tsx
│   ├── user-menu.tsx
│   ├── page-header.tsx          # Título + ações da página
│   │
│   ├── dashboard/
│   │   ├── stats-cards.tsx
│   │   ├── today-schedule.tsx
│   │   ├── alerts-panel.tsx
│   │   └── quick-actions.tsx
│   │
│   ├── calendar/
│   │   ├── calendar-view.tsx
│   │   ├── calendar-header.tsx
│   │   ├── day-view.tsx
│   │   ├── week-view.tsx
│   │   ├── month-view.tsx
│   │   ├── appointment-card.tsx
│   │   └── appointment-modal.tsx
│   │
│   ├── clients/
│   │   ├── client-list.tsx
│   │   ├── client-filters.tsx
│   │   ├── client-row.tsx
│   │   ├── client-header.tsx
│   │   ├── client-tabs.tsx
│   │   ├── client-form.tsx
│   │   └── tabs/
│   │       ├── info-tab.tsx
│   │       ├── appointments-tab.tsx
│   │       ├── financial-tab.tsx
│   │       ├── contract-tab.tsx
│   │       └── notes-tab.tsx
│   │
│   ├── contracts/
│   │   ├── contract-list.tsx
│   │   ├── contract-row.tsx
│   │   ├── new-contract-modal.tsx
│   │   ├── contract-preview.tsx
│   │   └── contract-pdf-viewer.tsx
│   │
│   ├── financial/
│   │   ├── summary-cards.tsx
│   │   ├── revenue-by-type.tsx
│   │   ├── monthly-goal.tsx
│   │   ├── transactions-table.tsx
│   │   ├── new-transaction-modal.tsx
│   │   └── projection.tsx
│   │
│   └── settings/
│       ├── settings-tabs.tsx
│       ├── general-settings.tsx
│       ├── schedule-settings.tsx
│       ├── areas-settings.tsx
│       ├── pricing-settings.tsx
│       └── notifications-settings.tsx
│
└── auth/
    └── login-form.tsx
```

---

## 6. ESTADOS GLOBAIS

### 6.1 Chat State

```typescript
// hooks/use-chat.ts
interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isOpen: boolean;
  sessionId: string;
  error: string | null;
}

interface ChatActions {
  sendMessage: (content: string) => Promise<void>;
  toggleChat: () => void;
  clearChat: () => void;
}
```

### 6.2 Auth State

```typescript
// Gerenciado pelo Supabase Auth
// Acessível via useUser() do @supabase/auth-helpers-react
```

### 6.3 Admin Context (opcional)

```typescript
// contexts/admin-context.tsx
interface AdminState {
  sidebarOpen: boolean;
  currentView: 'day' | 'week' | 'month';
  selectedDate: Date;
  filters: {
    clientStatus?: string;
    serviceType?: string;
  };
}
```

---

## RESUMO DE PÁGINAS

| Rota | Página | Acesso | Prioridade |
|------|--------|--------|------------|
| `/` | Landing Page | Público | Must have |
| `/chat` | Chat Fullscreen | Público | Must have |
| `/login` | Login | Público | Must have |
| `/admin` | Dashboard | Protegido | Must have |
| `/admin/agenda` | Calendário | Protegido | Must have |
| `/admin/clientes` | Lista Clientes | Protegido | Must have |
| `/admin/clientes/[id]` | Ficha Cliente | Protegido | Must have |
| `/admin/contratos` | Gestão Contratos | Protegido | Should have |
| `/admin/financeiro` | Módulo Financeiro | Protegido | Should have |
| `/admin/configuracoes` | Configurações | Protegido | Should have |

---

**— FIM DO DOCUMENTO DE ROTAS E TELAS —**

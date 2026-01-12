# Carolinas Premium - Project Overview

**Carolinas Premium** is a full-stack Next.js application for managing premium service businesses like salons, spas, and wellness centers. It features an admin dashboard for CRM, scheduling, finance, analytics, and automations; a client-facing landing page with booking, pricing, FAQs, and AI-powered chat ("Carol"); and webhook integrations for tools like N8N to handle events (e.g., appointments, payments, birthdays).

**Key Users**:
- **Admins/Owners**: Dashboard for clients (`ClientesPage`), agenda (`AgendaPage`), analytics (`ClientesAnalyticsPage`), finance.
- **Clients**: Landing site with `ChatWidget`, self-service booking.
- **Developers**: Extensible via types (`types/index.ts`), hooks (`hooks/`), server actions (`lib/actions/`).

## Quick Facts

| Metric | Details |
|--------|---------|
| **Root** | `C:\Workspace\carolinas-premium` |
| **Files** | 156 total (118 `.tsx`, 36 `.ts`, 15 `.md`, etc.) |
| **Symbols** | 247 (119 components, 40 API routes, 31 utils, 1 service) |
| **Stack** | Next.js 14 (App Router), React 18, TypeScript, Tailwind + Shadcn/UI, Supabase (Postgres), Recharts |
| **Deployment** | Vercel, EasyPanel (`easypanel.yml`), Docker-ready |

## Architecture Overview

```
carolinas-premium/
├── app/                          # Next.js pages/routes/layouts
│   ├── (admin)/                  # Dashboard: agenda, clients, analytics, financeiro
│   │   ├── admin/[...]/          # Dynamic routes (e.g., clientes/[id])
│   │   └── layout.tsx            # AdminLayout + AdminHeader
│   ├── (auth)/                   # Login/signup (AuthLayout)
│   ├── (marketing)/              # Landing: home, pricing, FAQ
│   └── api/                      # Routes: chat, webhooks, notifications
│       ├── api/chat/route.ts     # POST: AI chat handling
│       └── api/webhook/n8n/route.ts # POST: N8N events
├── components/                   # UI (119 symbols, Shadcn-based)
│   ├── admin/                    # Header, layout
│   ├── agenda/                   # CalendarView (day/week/month)
│   ├── analytics/                # TrendsChart, ConversionFunnel, SatisfactionChart
│   ├── chat/                     # ChatWidget, ChatWindow, MessageBubble
│   ├── clientes/                 # ClientsTable, ClientsFilters, cliente-ficha tabs
│   └── financeiro/               # TransactionForm, ExpenseCategories
├── hooks/                        # Custom hooks (chat, webhooks)
├── lib/                          # Utils, Supabase, actions, config
│   ├── supabase/                 # server.ts/client.ts (createClient)
│   ├── actions/                  # auth.ts, webhook.ts
│   └── utils.ts                  # cn(), formatCurrency()
├── types/                        # DB models, webhooks (e.g., Cliente, Agendamento)
├── docs/                         # This overview, tooling.md, etc.
├── prompts/                      # AI chat system prompts
└── supabase/                     # SQL migrations/seed
```

**Patterns**:
- **Server Components** (RSC) for data fetching.
- **Client Hooks** ('use client') for interactivity (e.g., `useChat`).
- **Row-Level Security (RLS)** on Supabase tables.
- **Server Actions** for mutations (e.g., `signOut`).

## Entry Points & Public API

### Core Layouts
- [`app/layout.tsx`]: Root (AnnouncementBar, auth redirects).
- [`app/(admin)/layout.tsx`]: `AdminLayout` + `AdminHeader`.
- [`app/(auth)/layout.tsx`]: `AuthLayout`.

### Key Pages
| Page | Path | Exports |
|------|------|---------|
| Clients | `app/(admin)/admin/clientes/page.tsx` | `ClientesPage` |
| Client Detail | `app/(admin)/admin/clientes/[id]/page.tsx` | `ClienteDetalhePage` |
| Agenda | `app/(admin)/admin/agenda/page.tsx` | `AgendaPage` |
| Clients Analytics | `app/(admin)/admin/analytics/clientes/page.tsx` | `ClientesAnalyticsPage` |

### Core Types (from `types/index.ts`)
```typescript
export type Cliente = { id: string; nome: string; email: string; /* ... */ };
export type Agendamento = { id: string; cliente_id: string; data: string; /* ... */ };
export type Contrato = { /* billing details */ };
export type DashboardStats = { total_clientes: number; receita_mes: number; /* ... */ };
```
- Full schema: `Database` (`types/supabase.ts`).

### Webhook Payloads (`types/webhook.ts`)
```typescript
export interface AppointmentCreatedPayload {
  agendamento: Agendamento;
  cliente: Cliente;
}
export type WebhookEventType = 'APPOINTMENT_CREATED' | 'PAYMENT_RECEIVED' | /* 14 more */;
```

### Hooks
```tsx
// hooks/use-chat.ts
export const useChat = () => { /* Returns { messages: ChatMessage[], sendMessage } */ };

// hooks/use-webhook.ts
export const useNotifyAppointmentCreated = () => (payload: AppointmentCreatedPayload) => { /* ... */ };
```

### Utils
```tsx
// lib/utils.ts
export const cn = (...classes: string[]) => classes.filter(Boolean).join(' '); // Tailwind merger
export const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { /* BRL */ }).format(value);
```

**Exports Summary**: 100+ (see symbol index for full list, e.g., `exportToExcel`, `createClient`).

## API Routes (40+ handlers)
- `POST /api/chat`: AI responses (`ChatRequest`).
- `POST /api/webhook/n8n`: N8N events (`verifyAuth`, `handleChatResponse`).
- `GET /api/slots`: Available times.
- `GET /api/health`: Readiness check.

**Middleware** (`middleware.ts`): `rateLimit`, session validation.

## Key Dependencies & Usage
- **High-import files**:
  - `components/agenda/calendar-view.tsx` (used in 4 files).
  - `components/chat/chat-window.tsx` (3 files).
- **Example Usage**:
  ```tsx
  // Client list with filters
  import { ClientsTable, ClientsFilters } from '@/components/clientes';
  <ClientsFilters onFilterChange={setFilters} />
  <ClientsTable data={clients} filters={filters} />
  ```

## Tech Stack

| Layer | Tools |
|-------|-------|
| **Framework** | Next.js 14 App Router, React 18 |
| **DB/Auth** | Supabase (Postgres, Realtime, `createClient`) |
| **Styling** | Tailwind CSS, Shadcn/UI, `cn()` utility |
| **Charts** | Recharts (`TrendsChartProps`, `SatisfactionData`) |
| **AI/Chat** | N8N webhooks (`WebhookService`), `/prompts/` |
| **Exports** | xlsx (`exportToExcel`), jsPDF (`exportToPDF`) |
| **Icons/UI** | Lucide React, Sonner (toasts) |
| **Formatters** | BRL currency/phone/ZIP (`lib/formatters.ts`) |

## Setup & Development

1. **Clone/Install**: `git clone ... && npm i`.
2. **Env**: `cp .env.production.example .env.local`
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```
3. **DB**: `supabase start` (local) or `supabase db push`.
4. **Run**: `npm run dev` → [localhost:3000](http://localhost:3000).
5. **Scripts**: `npm run build`, `npm run lint`.
6. **Test**: Admin login → `/admin/agenda`; embed `ChatWidget` on landing.

**Troubleshooting**:
- Auth: Check RLS policies in Supabase.
- Chat: Verify N8N webhook (`getWebhookUrl()`).
- See [tooling.md](tooling.md) for VS Code, Docker.

## Contribution Guidelines
- **Types First**: Update `types/index.ts` for schema changes.
- **Components**: Add to `/components/`, use Shadcn addons.
- **Hooks/Actions**: Keep server/client separation.
- **Tests**: Add to existing patterns (no dedicated test dir yet).
- **Changelog**: Update [changelog.md](changelog.md).

**Roadmap**: Multi-location support, mobile app, advanced analytics.

For deeper dives: [Development Workflow](development-workflow.md), [API Reference](api-reference.md).

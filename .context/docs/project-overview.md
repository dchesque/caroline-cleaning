# Carolinas Premium - Project Overview

**Carolinas Premium** is a full-stack Next.js 14 (App Router) application designed for premium service businesses like salons, spas, and wellness centers. It features an admin dashboard for CRM, scheduling, finance, analytics, and team management; a client-facing landing site with booking, pricing, FAQs, and an AI chat widget ("Carol" powered by N8N webhooks); and automations via Supabase Realtime and webhooks for events like appointments, payments, leads, and birthdays.

**Key Users**:
- **Admins/Owners**: Access `/admin/clientes`, `/admin/agenda`, `/admin/analytics/clientes`, `/admin/financeiro`.
- **Clients**: Book appointments, chat with AI, view self-service info.
- **Developers**: Extend via [types/index.ts](types/index.ts), [hooks/](hooks/), [lib/actions/](lib/actions/).

See [api-reference.md](api-reference.md) for API details and [development-workflow.md](development-workflow.md) for setup.

## Quick Facts

| Metric          | Details                                      |
|-----------------|----------------------------------------------|
| **Root**        | `C:\Workspace\carolinas-premium`             |
| **Files**       | 183 (.tsx:137, .ts:44, .mjs:2)               |
| **Symbols**     | 284 (Components:139, Utils:43, Controllers/API:44, Services:2) |
| **Stack**       | Next.js 14, React 18, TypeScript, Tailwind + shadcn/ui, Supabase, Recharts, N8N |
| **Deployment**  | Vercel, EasyPanel ([easypanel.yml](easypanel.yml)), Docker-ready |

## Architecture Overview

```
carolinas-premium/
├── app/                          # Pages (RSC), layouts, API routes (44 handlers)
│   ├── (admin)/                  # Admin dashboard
│   │   ├── admin/agenda/page.tsx # AgendaPage → CalendarView
│   │   ├── admin/clientes/[id]/page.tsx # ClienteDetalhePage
│   │   ├── admin/analytics/clientes/page.tsx # ClientesAnalyticsPage
│   │   └── layout.tsx            # AdminLayout → AdminHeader
│   ├── (auth)/layout.tsx         # AuthLayout
│   ├── (marketing)/              # Landing: home, pricing, FAQ
│   └── api/                      # chat/route.ts, webhook/n8n/route.ts, slots/route.ts
├── components/                   # 139 UI components (shadcn/ui-based)
│   ├── agenda/                   # AppointmentModal (8 imports), CalendarView (5)
│   ├── chat/                     # ChatWidget (2), ChatWindow (3), MessageBubble
│   ├── clientes/                 # ClientsTable, ClientsFilters, cliente-ficha tabs
│   ├── financeiro/               # TransactionForm (2), ExpenseCategories
│   └── analytics/                # ConversionFunnel, TrendsChart
├── hooks/                        # Custom React hooks (e.g., useChat, useWebhook)
├── lib/                          # Core logic (43 utils symbols)
│   ├── supabase/                 # server.ts/client.ts → createClient
│   ├── actions/                  # auth.ts (getUser, signOut), webhook.ts
│   ├── services/                 # WebhookService (class)
│   ├── utils.ts                  # cn, formatCurrency
│   └── config/                   # webhooks.ts → getWebhookUrl
├── types/                        # DB models, webhook payloads
│   ├── index.ts                  # Cliente, Agendamento (21+ exports)
│   └── webhook.ts                # WebhookEventType, AppointmentCreatedPayload (14+)
├── docs/                         # Documentation
├── prompts/                      # AI chat prompts for N8N
└── supabase/                     # Migrations, RLS policies
```

**High-Dependency Files**:
- `components/agenda/appointment-modal.tsx` (imported by 8 files)
- `components/agenda/calendar-view.tsx` (5 files)
- `components/chat/chat-window.tsx` (3 files)
- `components/financeiro/transaction-form.tsx` (2 files)

**Patterns & Conventions**:
- **Server Components**: Data fetching (Supabase queries in pages).
- **Client Components** (`"use client"`): Forms, hooks (e.g., useAppointmentForm).
- **Supabase RLS**: Enabled on all tables; use `createClient` from [lib/supabase/server.ts](lib/supabase/server.ts).
- **Server Actions**: Mutations (e.g., [lib/actions/auth.ts](lib/actions/auth.ts)#signOut).
- **i18n**: AdminI18nProvider ([lib/admin-i18n/context.tsx](lib/admin-i18n/context.tsx)).
- **Middleware** ([middleware.ts](middleware.ts)): rateLimit, auth guards.
- **Business Config**: BusinessSettings ([lib/business-config.ts](lib/business-config.ts)), provider in [lib/context/business-settings-context.tsx](lib/context/business-settings-context.tsx).

## Entry Points & Public API

### Core Layouts & Pages
| Export              | File Path                          | Description                  |
|---------------------|------------------------------------|------------------------------|
| `AdminLayout`       | `app/(admin)/layout.tsx`           | Admin dashboard shell        |
| `AuthLayout`        | `app/(auth)/layout.tsx`            | Login/signup wrapper         |
| `AgendaPage`        | `app/(admin)/admin/agenda/page.tsx`| Schedule calendar            |
| `ClientesPage`      | `app/(admin)/admin/clientes/page.tsx` | Clients list/table       |
| `ClienteDetalhePage`| `app/(admin)/admin/clientes/[id]/page.tsx` | Client detail/tabs   |
| `ClientesAnalyticsPage` | `app/(admin)/admin/analytics/clientes/page.tsx` | Client metrics    |

### Core Types ([types/index.ts](types/index.ts))
```typescript
export interface Cliente { id: string; nome: string; email?: string; phone?: string; /* address, notes */ }
export type ClienteInsert = Omit<Cliente, 'id'>;
export type ClienteUpdate = Partial<Cliente>;

export interface Agendamento { id: string; cliente_id: string; data: string; servico: string; status: string; }
export type AgendamentoInsert = Omit<Agendamento, 'id'>;
export type AgendamentoUpdate = Partial<Agendamento>;

export interface DashboardStats { total_clientes: number; receita_mes: number; agendamentos_hoje: number; }
export interface AgendaHoje { /* today's appointments */ }
```
- Full DB: `Database` ([types/supabase.ts](types/supabase.ts)).

### Webhook Types & Events ([types/webhook.ts](types/webhook.ts))
```typescript
export type WebhookEventType =
  | 'CHAT_MESSAGE' | 'LEAD_CREATED' | 'APPOINTMENT_CREATED' | 'APPOINTMENT_CONFIRMED'
  | 'APPOINTMENT_COMPLETED' | 'APPOINTMENT_CANCELLED' | 'APPOINTMENT_RESCHEDULED'
  | 'FEEDBACK_RECEIVED' | 'PAYMENT_RECEIVED' | 'CLIENT_INACTIVE_ALERT' | 'CLIENT_BIRTHDAY';

export interface AppointmentCreatedPayload { agendamento: Agendamento; cliente: Cliente; }
export interface WebhookPayload = AppointmentCreatedPayload | LeadCreatedPayload | /* 14 total */;
```
- Processed by `WebhookService` ([lib/services/webhookService.ts](lib/services/webhookService.ts)).

### Key Hooks
```tsx
// hooks/use-chat.ts
export interface ChatMessage { id: string; role: 'user' | 'assistant'; content: string; }
export const useChat = () => ({
  messages: ChatMessage[],
  sendMessage: (content: string) => Promise<void>
});

// hooks/use-webhook.ts
export const useNotifyAppointmentCreated = () => (payload: AppointmentCreatedPayload) => Promise<void>;
// Similar: useNotifyAppointmentCompleted, useSendChatMessage, etc.
```

### Key Utils ([lib/utils.ts](lib/utils.ts), [lib/formatters.ts](lib/formatters.ts))
```tsx
export const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ');

export const formatCurrency = (value: number, currency = 'BRL') =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);

export const formatPhoneUS = (phone: string) => phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
export const isValidPhoneUS = (phone: string) => /^\d{10}$/.test(phone.replace(/\D/g, ''));
```

### Classes
- `Logger` ([lib/logger.ts](lib/logger.ts)): Structured logging (`LogEntry` interface).
- `WebhookService` ([lib/services/webhookService.ts](lib/services/webhookService.ts)): Handles webhook events/responses (`WebhookResponse`, `WebhookOptions`).

## API Routes (Key Handlers)
| Method/Route                  | Purpose                       | Key Types/Exports                  |
|-------------------------------|-------------------------------|------------------------------------|
| `POST /api/chat`              | AI chat (N8N)                 | `ChatRequest`                      |
| `POST /api/webhook/n8n`       | Incoming webhooks             | `IncomingWebhookPayload`, `IncomingEventType` |
| `GET /api/slots`              | Booking availability          | `GET` handler                      |
| `POST /api/notifications/send`| Push notifications            | `NotificationPayload`              |
| `POST /api/carol/query`       | Carol AI queries              | `QueryPayload`, `QueryType`        |
| `DELETE /api/financeiro/categorias/[id]` | Delete category     | `DELETE` handler                   |

**Webhook Config**: [lib/config/webhooks.ts](lib/config/webhooks.ts) → `getWebhookUrl()`, `getWebhookSecret()`.

## Tech Stack

| Layer       | Tools & Key Files                                                                 |
|-------------|-----------------------------------------------------------------------------------|
| **Framework**| Next.js 14 App Router, React 18                                                  |
| **DB/Auth** | Supabase (Realtime, RLS), [lib/supabase/server.ts](lib/supabase/server.ts)        |
| **Styling** | Tailwind CSS, shadcn/ui, [lib/utils.ts#cn](lib/utils.ts)                          |
| **Charts**  | Recharts ([components/analytics/conversion-funnel.tsx](components/analytics/conversion-funnel.tsx)) |
| **AI/Chat** | N8N webhooks, [prompts/](prompts/), ChatWidget                                    |
| **Exports** | XLSX/PDF ([lib/export-utils.ts](lib/export-utils.ts)#exportToExcel)               |
| **Other**   | Lucide icons, Sonner toasts, [lib/logger.ts](lib/logger.ts)                       |

## Setup & Development

1. **Prerequisites**: Node.js 20+, Supabase CLI, PostgreSQL (local).
2. **Clone & Install**: `git clone ... && npm i`.
3. **Env** (copy [.env.local.example](.env.local.example)):
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   SUPABASE_SERVICE_ROLE_KEY=...
   WEBHOOK_SECRET=...  # N8N verification
   ```
4. **Supabase**: `supabase login`, `supabase link --project-ref <ref>`, `supabase db push`.
5. **Run**: `npm run dev` (localhost:3000).
6. **Scripts**:
   - `npm run db:generate`: Regenerate [types/supabase.ts](types/supabase.ts).
   - `npm run lint`, `npm run build`.
7. **Test**: Login → `/admin/agenda` (create appointment), add ChatWidget to landing.

**Troubleshooting**:
- **RLS/Auth**: Check Supabase policies; use `getUser` from [lib/actions/auth.ts](lib/actions/auth.ts).
- **Webhooks**: Verify `isWebhookConfigured()`, test `POST /api/webhook/n8n`.
- **Formats**: `formatCurrency(value)`, `isValidEmail(email)`.

## Contribution Guidelines

- **Types/Schema**: Update [types/index.ts](types/index.ts), add Supabase migration.
- **Components**: `/components/`, `npx shadcn@latest add <component>`.
- **Hooks**: Client-side state (e.g., extend `useChat`).
- **Actions/Webhooks**: Server-only, extend [types/webhook.ts](types/webhook.ts).
- **PRs**: Lint, type-check, test agenda/chat/client flows.
- **Changelog**: [changelog.md](changelog.md).

**Roadmap**: Multi-location support, PWA, Stripe payments, advanced Recharts analytics.

For more: [API Reference](api-reference.md), [Components README](components/README.md), symbol search in IDE.

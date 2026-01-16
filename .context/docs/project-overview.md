# Caroline Cleaning - Project Overview

**Caroline Cleaning** is a full-stack Next.js 14 (App Router) application tailored for service businesses like cleaning companies. It provides an admin dashboard for CRM (clients), scheduling (agenda), finance tracking, analytics, and configurations; a public landing site with about-us, announcement bar, pricing, and AI chat ("Carol" via N8N webhooks); and automations using Supabase Realtime and webhooks for events like appointments, payments, leads, feedback, client birthdays, and inactivity alerts.

**Key Users**:
- **Admins/Owners**: `/admin/clientes`, `/admin/agenda`, `/admin/analytics/clientes`, `/admin/financeiro`, `/admin/configuracoes`.
- **Clients**: View landing pages, book via agenda, chat with AI.
- **Developers**: Extend via [types/index.ts](types/index.ts) (21+ DB models), [hooks/](hooks/) (e.g., `useChat`), [lib/services/](lib/services/).

See [api-reference.md](api-reference.md) for full API docs and [development-workflow.md](development-workflow.md) for setup.

## Quick Facts

| Metric          | Details                                      |
|-----------------|----------------------------------------------|
| **Root**        | `C:\Workspace\caroline-cleaning`             |
| **Architecture**| Utils: 55 symbols, Services: 2 (depends on Components), Components: 152 (depends on Repositories), Controllers: 50, Repositories: 3 |
| **Public Exports** | 176+ (e.g., `AgendaPage`, `Cliente`, `useChat`, `cn`) |
| **Files**       | 183+ (.tsx:137, .ts:44, .mjs:2)              |
| **Stack**       | Next.js 14, React 18, TypeScript, Tailwind + shadcn/ui, Supabase, Recharts, N8N, Lucide |
| **Deployment**  | Vercel, EasyPanel ([easypanel.yml](easypanel.yml)), Docker-ready |

## Architecture Overview

```
caroline-cleaning/
├── app/                          # Pages (RSC), layouts, API routes (44+ handlers)
│   ├── (admin)/                  # Admin dashboard (AdminLayout, AdminHeader)
│   │   ├── admin/agenda/page.tsx # AgendaPage → CalendarView
│   │   ├── admin/clientes/[id]/page.tsx # ClienteDetalhePage → client-ficha tabs
│   │   ├── admin/analytics/clientes/page.tsx # ClientesAnalyticsPage → ConversionFunnel
│   │   ├── admin/financeiro/categorias/page.tsx # CategoriasPage → CategoryQuickForm
│   │   └── admin/configuracoes/page.tsx # ConfiguracoesPage → webhooks tabs
│   ├── (auth)/layout.tsx         # AuthLayout
│   ├── (marketing)/              # Landing: AboutUs, AnnouncementBar, pricing
│   └── api/                      # chat/route.ts, webhook/n8n/route.ts, tracking/event/route.ts, carol/query/route.ts
├── components/                   # 152 UI components
│   ├── agenda/                   # CalendarView (5 imports), AppointmentModal (8 imports)
│   ├── chat/                     # ChatWidget (2), ChatWindow (3), ChatInput
│   ├── clientes/                 # ClientsFilters, ClientsTable
│   ├── financeiro/               # TransactionForm (2), CategoryQuickForm, ExpenseCategories
│   ├── analytics/                # ConversionFunnel, TrendsChart (Recharts)
│   └── admin/                    # AdminHeader, ConfigLinkCard, sidebar
├── hooks/                        # 10+ hooks (useChat, useWebhook variants)
├── lib/                          # 55+ utils, services, configs
│   ├── supabase/                 # server.ts/client.ts (createClient)
│   ├── services/                 # WebhookService class
│   ├── utils.ts                  # cn, formatCurrency, formatDate
│   ├── formatters.ts             # formatPhoneUS, isValidEmail, parseCurrency
│   ├── business-config.ts        # BusinessSettings, mapDbToSettings
│   ├── config/webhooks.ts        # getWebhookUrl, getWebhookSecret
│   ├── tracking/                 # utils.ts (generateEventId, getUtmParams)
│   └── actions/                  # webhook.ts (sendWebhookAction)
├── types/                        # DB models, payloads
│   ├── index.ts                  # Cliente, Agendamento, DashboardStats (26 exports)
│   └── webhook.ts                # WebhookEventType, 14+ payloads (e.g., AppointmentCreatedPayload)
├── docs/                         # This file + api-reference.md
├── prompts/                      # N8N AI prompts
└── supabase/                     # Migrations, RLS
```

**High-Dependency Files** (usage counts):
- `components/agenda/appointment-modal.tsx`: 8 imports
- `app/(admin)/admin/configuracoes/webhooks/components/webhooks-tabs.tsx`: 6
- `components/agenda/calendar-view.tsx`: 5
- `components/chat/chat-window.tsx`: 3

**Patterns & Conventions**:
- **Server Components**: Data fetching (Supabase in `page.tsx`).
- **Client Components** (`"use client"`): Interactive UI, hooks (e.g., `useAppointmentForm`).
- **Supabase**: RLS on all tables; use `createClient` ([lib/supabase/server.ts](lib/supabase/server.ts)).
- **Server Actions**: Mutations (e.g., [lib/actions/auth.ts](lib/actions/auth.ts)).
- **i18n**: `AdminI18nProvider` ([lib/admin-i18n/context.tsx](lib/admin-i18n/context.tsx)).
- **Middleware** ([middleware.ts](middleware.ts)): `rateLimit`, auth guards.
- **Business Config**: `BusinessSettingsProvider` ([lib/context/business-settings-context.tsx](lib/context/business-settings-context.tsx)).
- **Tracking**: `TrackingProvider` ([components/tracking/tracking-provider.tsx](components/tracking/tracking-provider.tsx)), events via `/api/tracking/event`.

## Entry Points & Public API

### Core Layouts & Pages
| Export                | File                          | Description                      |
|-----------------------|-------------------------------|----------------------------------|
| `AdminLayout`         | `app/(admin)/layout.tsx`      | Admin shell w/ header/sidebar    |
| `AuthLayout`          | `app/(auth)/layout.tsx`       | Auth pages wrapper               |
| `AgendaPage`          | `app/(admin)/admin/agenda/page.tsx` | Calendar & appointments     |
| `ClientesPage`        | `app/(admin)/admin/clientes/page.tsx` | Clients list/table         |
| `ClienteDetalhePage`  | `app/(admin)/admin/clientes/[id]/page.tsx` | Client profile/tabs     |
| `ClientesAnalyticsPage` | `app/(admin)/admin/analytics/clientes/page.tsx` | Client funnel/metrics |
| `ConfiguracoesPage`   | `app/(admin)/admin/configuracoes/page.tsx` | Settings/webhooks        |
| `CategoriasPage`      | `app/(admin)/admin/financeiro/categorias/page.tsx` | Finance categories     |

### Core Types ([types/index.ts](types/index.ts))
```typescript
export interface Cliente { id: string; nome: string; email?: string; phone?: string; /* notes, address, etc. */ }
export type ClienteInsert = Omit<Cliente, 'id'> & { /* insert props */ };
export type ClienteUpdate = Partial<Cliente>;

export interface Agendamento { id: string; cliente_id: string; data: string; servico: string; status: string; /* recorrencia_id, etc. */ }
export type AgendamentoInsert = Omit<Agendamento, 'id'>;
export type AgendamentoUpdate = Partial<Agendamento>;

export interface DashboardStats { total_clientes: number; receita_mes: number; agendamentos_hoje: number; /* more */ }
export interface AgendaHoje { /* today's schedule */ }
```
- Full schema: `Database` ([types/supabase.ts](types/supabase.ts)).

### Webhook Types ([types/webhook.ts](types/webhook.ts))
```typescript
export type WebhookEventType =
  | 'CHAT_MESSAGE' | 'LEAD_CREATED' | 'APPOINTMENT_CREATED' | 'APPOINTMENT_CONFIRMED'
  | 'APPOINTMENT_COMPLETED' | 'APPOINTMENT_CANCELLED' | 'FEEDBACK_RECEIVED'
  | 'PAYMENT_RECEIVED' | 'CLIENT_INACTIVE_ALERT' | 'CLIENT_BIRTHDAY';

export interface AppointmentCreatedPayload { agendamento: Agendamento; cliente: Cliente; }
export type WebhookPayload = AppointmentCreatedPayload | /* 14 total payloads */;
```

### Key Hooks
```tsx
// hooks/use-chat.ts
export interface ChatMessage { id: string; role: 'user' | 'assistant'; content: string; }
export const useChat = () => ({
  messages: ChatMessage[],
  sendMessage: (content: string) => Promise<void>,
});

// hooks/use-webhook.ts
export const useNotifyAppointmentCreated = () => (payload: AppointmentCreatedPayload) => Promise<void>;
// Variants: useSendChatMessage, useNotifyLeadCreated, useNotifyPaymentReceived, etc.
```

### Key Utils
```tsx
// lib/utils.ts
export const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ');

// lib/formatters.ts
export const formatPhoneUS = (phone: string) => phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
export const isValidPhoneUS = (phone: string) => /^\d{10}$/.test(phone.replace(/\D/g, ''));
export const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
```
Cross-refs: [lib/export-utils.ts](lib/export-utils.ts) (`exportToExcel`), [lib/tracking/utils.ts](lib/tracking/utils.ts) (`getUtmParams`).

### Classes
- `Logger` ([lib/logger.ts](lib/logger.ts)): `new Logger().info({ msg: 'Event', data })`.
- `WebhookService` ([lib/services/webhookService.ts](lib/services/webhookService.ts)): Handles `WebhookResponse`, `WebhookOptions`.

## API Routes (Key Handlers)
| Method/Route                  | Purpose                          | Key Types                        |
|-------------------------------|----------------------------------|----------------------------------|
| `POST /api/chat`              | Send AI chat message             | `ChatRequest`                    |
| `POST /api/webhook/n8n`       | Process incoming events          | `IncomingWebhookPayload`         |
| `POST /api/tracking/event`    | Log tracking events              | `EventPayload`                   |
| `POST /api/notifications/send`| Send notifications               | `NotificationPayload`            |
| `POST /api/carol/query`       | Carol AI query                   | `QueryPayload`                   |
| `POST /api/carol/actions`     | Carol actions                    | `ActionPayload`                  |

**Webhook Utils**: `getWebhookUrl()` ([lib/config/webhooks.ts](lib/config/webhooks.ts)), `sendWebhookAction(payload)`.

## Tech Stack

| Layer       | Tools & Files                                                                 |
|-------------|-------------------------------------------------------------------------------|
| **Framework**| Next.js 14 App Router, React 18                                               |
| **DB/Auth** | Supabase (Realtime/RLS), [lib/supabase/server.ts](lib/supabase/server.ts)     |
| **Styling** | Tailwind, shadcn/ui, [lib/utils.ts#cn](lib/utils.ts)                          |
| **Charts**  | Recharts ([components/analytics/conversion-funnel.tsx](components/analytics/conversion-funnel.tsx)) |
| **AI/Chat** | N8N ([prompts/](prompts/)), [components/chat/chat-widget.tsx](components/chat/chat-widget.tsx) |
| **Exports** | XLSX/PDF ([lib/export-utils.ts](lib/export-utils.ts))                         |
| **Other**   | Sonner toasts, Lucide icons, [middleware.ts#rateLimit](middleware.ts)         |

## Setup & Development

1. **Prerequisites**: Node 20+, Supabase CLI.
2. **Install**: `npm i`.
3. **Env** ([.env.local.example](.env.local.example)):
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_url
   SUPABASE_SERVICE_ROLE_KEY=your_key
   WEBHOOK_SECRET=n8n_secret
   ```
4. **Supabase**: `supabase db push`, `npm run db:generate` (updates [types/supabase.ts](types/supabase.ts)).
5. **Run**: `npm run dev` → localhost:3000/admin/agenda.
6. **Test Flows**: Create appointment → triggers webhook; chat on landing → N8N.

**Troubleshooting**:
- Auth: Use `getUser` ([lib/actions/auth.ts](lib/actions/auth.ts)).
- Webhooks: `isWebhookConfigured()` → test `/api/webhook/n8n`.
- Validation: `isValidEmail(email)`, `parseCurrency(str)`.

## Contribution Guidelines

- **DB Changes**: Update [types/index.ts](types/index.ts), Supabase migration.
- **UI**: `npx shadcn@latest add button`, place in `/components/`.
- **Hooks/Actions**: Client hooks in `/hooks/`, server in `/lib/actions/`.
- **PRs**: `npm run lint`, test agenda/chat/clients.
- **Extend**: Add `WebhookEventType`, hook like `useNotifyClientBirthday`.

**Roadmap**: Multi-location, Stripe, PWA, advanced analytics.

For symbols/search: Use IDE. More: [api-reference.md](api-reference.md).

# Caroline Cleaning - Project Overview

**Caroline Cleaning** is a full-stack Next.js 14 (App Router) application designed for service businesses like cleaning companies. It features an admin dashboard for managing CRM (clients), scheduling (agenda), finances, analytics, and configurations; a public landing site with about-us, announcement bar, pricing, and AI-powered chat ("Carol" integrated via N8N webhooks); and automations powered by Supabase Realtime and webhooks for events such as appointments, payments, leads, feedback, client birthdays, and inactivity alerts.

**Key Users**:
- **Admins/Owners**: Access `/admin/clientes`, `/admin/agenda`, `/admin/analytics/clientes`, `/admin/financeiro`, `/admin/configuracoes`.
- **Clients**: Interact with landing pages, book appointments via agenda, and chat with AI.
- **Developers**: Extend using [types/index.ts](types/index.ts) (26+ DB models), [hooks/](hooks/) (e.g., `useChat`), [lib/services/](lib/services/).

Cross-reference: [api-reference.md](api-reference.md) for full API details; [development-workflow.md](development-workflow.md) for setup instructions.

## Quick Facts

| Metric          | Details                                      |
|-----------------|----------------------------------------------|
| **Root**        | `C:\Workspace\caroline-cleaning`             |
| **Architecture**| Config (depends on Utils) → Utils (55 symbols, depends on Controllers) → Services (depends on Components) → Components (152 symbols, depends on Controllers) → Controllers (50 API routes) |
| **Public Exports** | 176+ (e.g., `AgendaPage`, `Cliente`, `CarolStateMachine`, `cn`, `useChat`) |
| **Files**       | 183+ (.tsx:137, .ts:44, .mjs:2, tests:20+)   |
| **Stack**       | Next.js 14, React 18, TypeScript, Tailwind + shadcn/ui, Supabase (Realtime/RLS), Recharts, N8N, Lucide, Twilio SMS |
| **Deployment**  | Vercel, EasyPanel ([easypanel.yml](easypanel.yml)), Docker-ready |

## Architecture Overview

```
caroline-cleaning/
├── app/                          # Pages (RSC), layouts, API routes (44+ handlers: chat, webhook/n8n, tracking/event, carol/query/actions, notifications/send)
│   ├── (admin)/                  # Admin dashboard (AdminLayout, AdminHeader, sidebar)
│   │   ├── admin/agenda/page.tsx # AgendaPage → CalendarView, AppointmentModal
│   │   ├── admin/clientes/[id]/page.tsx # ClienteDetalhePage → client-ficha tabs
│   │   ├── admin/analytics/clientes/page.tsx # ClientesAnalyticsPage → trends, satisfaction charts
│   │   ├── admin/financeiro/categorias/page.tsx # CategoriasPage → CategoryQuickForm
│   │   └── admin/configuracoes/page.tsx # Settings (webhooks, pricing, team, etc.)
│   ├── (auth)/layout.tsx         # AuthLayout (login)
│   ├── (public)/                 # Landing: announcement-bar, pricing, chat widget, terms/privacy
│   └── api/                      # POST /chat, /webhook/n8n, /tracking/event, /carol/query, /notifications/send, cron/reminders
├── components/                   # 152 UI components (high deps: appointment-modal:8, calendar-view:5)
│   ├── agenda/                   # CalendarView, AppointmentForm (service/addon sections)
│   ├── chat/                     # ChatWidget, ChatWindow (3 imports), ChatInput
│   ├── clientes/                 # ClientsFilters, ClientsTable
│   ├── financeiro/               # TransactionForm, CategoryQuickForm, ExpenseCategories
│   ├── analytics/                # TrendsChart, ConversionFunnel (Recharts), satisfaction metrics
│   └── admin/                    # AdminHeader, ConfigLinkCard, sidebar (NavigationItem)
├── hooks/                        # Custom hooks (useChat, useWebhook variants, useAppointmentForm)
├── lib/                          # 55+ utils/services (logger, rate-limit, notifications)
│   ├── ai/                       # carol-agent.ts (CarolAgent class), llm.ts (CarolLLM), state-machine (engine.ts: CarolStateMachine, handlers/)
│   ├── supabase/                 # server.ts/client.ts (createClient)
│   ├── services/                 # WebhookService, ChatLoggerService
│   ├── utils.ts                  # cn, formatCurrency, formatDate
│   ├── formatters.ts             # formatPhoneUS, isValidEmail
│   ├── tracking/                 # types.ts (TrackingConfig), utils.ts (getUtmParams)
│   ├── context/                  # BusinessSettingsProvider
│   └── admin-i18n/               # AdminI18nProvider
├── types/                        # DB models/payloads
│   ├── index.ts                  # Cliente, Agendamento, DashboardStats (26 exports)
│   ├── supabase.ts               # Database
│   ├── webhook.ts                # WebhookEventType (14 events), payloads (e.g., AppointmentCreatedPayload)
│   └── carol.ts                  # ChatMessage, ChatResponse
├── docs/                         # api-reference.md, development-workflow.md
├── prompts/                      # N8N AI prompts (buildCarolPrompt)
└── supabase/                     # Migrations, RLS policies, functions (e.g., cleanup-logs)
```

**High-Dependency Files**:
- `lib/ai/state-machine/handlers/index.ts` (10 imports)
- `components/agenda/appointment-modal.tsx` (8 imports)
- `components/agenda/calendar-view.tsx` (5 imports)
- `lib/ai/carol-agent.ts` (3 imports)
- `components/chat/chat-window.tsx` (3 imports)

**Patterns & Conventions**:
- **Server Components**: Data fetching via Supabase in `page.tsx`.
- **Client Components** (`"use client"`): Hooks, state (e.g., `useAppointmentFormProps`).
- **Supabase**: RLS enforced; use `createClient` from [lib/supabase/server.ts](lib/supabase/server.ts).
- **Server Actions**: Mutations in [lib/actions/](lib/actions/).
- **i18n**: Wrap admin in `AdminI18nProvider` ([lib/admin-i18n/context.tsx](lib/admin-i18n/context.tsx)).
- **Middleware** ([middleware.ts](middleware.ts)): Rate limiting (`checkRateLimit`), auth.
- **Business Config**: `BusinessSettingsProvider` ([lib/context/business-settings-context.tsx](lib/context/business-settings-context.tsx)).
- **Tracking**: `TrackingProvider` ([components/tracking/tracking-provider.tsx](components/tracking/tracking-provider.tsx)); POST to `/api/tracking/event`.
- **AI State Machine**: `CarolStateMachine` with handlers (e.g., booking.ts, customer.ts); states via `CarolState`.

## Entry Points & Public API

### Core Layouts & Pages
| Export                | File                                      | Description                          |
|-----------------------|-------------------------------------------|--------------------------------------|
| `AdminLayout`         | `app/(admin)/layout.tsx`                  | Admin shell (header, sidebar)        |
| `AuthLayout`          | `app/(auth)/layout.tsx`                   | Auth wrapper                         |
| `AgendaPage`          | `app/(admin)/admin/agenda/page.tsx`       | Calendar + appointments              |
| `ClientesPage`        | `app/(admin)/admin/clientes/page.tsx`     | Clients list/table                   |
| `ClienteDetalhePage`  | `app/(admin)/admin/clientes/[id]/page.tsx`| Client detail/tabs                   |
| `ClientesAnalyticsPage` | `app/(admin)/admin/analytics/clientes/page.tsx` | Client metrics/funnel            |
| `CategoriasPage`      | `app/(admin)/admin/financeiro/categorias/page.tsx` | Categories mgmt                |

### Core Types ([types/index.ts](types/index.ts))
```typescript
export interface Cliente { id: string; nome: string; email?: string; phone?: string; /* address, notes, etc. */ }
export type ClienteInsert = Omit<Cliente, 'id'>;
export type ClienteUpdate = Partial<Cliente>;

export interface Agendamento { id: string; cliente_id: string; data: string; servico: ServicoTipo; status: string; /* addons, recorrencia_id */ }
export type AgendamentoInsert = Omit<Agendamento, 'id'>;
export type AgendamentoUpdate = Partial<Agendamento>;

export interface DashboardStats { total_clientes: number; receita_mes: number; agendamentos_hoje: number; /* more */ }
```
Full DB: `Database` ([types/supabase.ts](types/supabase.ts)); Webhooks: [types/webhook.ts](types/webhook.ts) (`WebhookEventType`, 14 payloads like `AppointmentCreatedPayload { agendamento: Agendamento; cliente: Cliente; }`).

### Key Hooks (Examples)
```tsx
// hooks/use-carol-chat.ts (or similar)
export const useCarolChat = () => ({
  messages: ChatMessage[],
  sendMessage: (content: string) => Promise<ChatResponse>,
});

// components/agenda/appointment-form/use-appointment-form.ts
export interface UseAppointmentFormProps { /* form state */ }
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
See [lib/export-utils.ts](lib/export-utils.ts) for XLSX exports.

### Key Classes
- `CarolAgent` ([lib/ai/carol-agent.ts](lib/ai/carol-agent.ts)): AI chat handler (`new CarolAgent().process(message)`).
- `CarolStateMachine` ([lib/ai/state-machine/engine.ts](lib/ai/state-machine/engine.ts)): State transitions (`new CarolStateMachine(state).handle(event)`).
- `WebhookService` ([lib/services/webhookService.ts](lib/services/webhookService.ts)): Event dispatching.
- `Logger` ([lib/logger.ts](lib/logger.ts)): `new Logger().info({ msg: 'Event', data })`.

## API Routes (Key Handlers)
| Method/Route                  | Purpose                          | Key Types/Params                    |
|-------------------------------|----------------------------------|-------------------------------------|
| `POST /api/chat`              | AI chat (Carol)                  | `{ message: string }` → `ChatResponse` |
| `POST /api/webhook/n8n`       | Incoming N8N events              | `IncomingWebhookPayload`            |
| `POST /api/tracking/event`    | Log events (UTM, conversions)    | `EventPayload { event: TrackingEventName }` |
| `POST /api/notifications/send`| SMS/Email alerts                 | `NotificationPayload`               |
| `POST /api/carol/query`       | AI state query                   | `{ query: string }`                 |
| `POST /api/carol/actions`     | Execute AI actions               | `{ action: ActionType }`            |

Utils: `notify(payload)` ([lib/notifications.ts](lib/notifications.ts)), `sendSMS(phone, msg)` ([lib/twilio.ts](lib/twilio.ts)).

## Tech Stack

| Layer       | Tools & Files                                                                 |
|-------------|-------------------------------------------------------------------------------|
| **Framework**| Next.js 14 App Router, React 18                                               |
| **DB/Auth** | Supabase (Realtime/RLS/migrations), [lib/supabase/server.ts](lib/supabase/server.ts) |
| **Styling** | Tailwind, shadcn/ui, [lib/utils.ts#cn](lib/utils.ts)                          |
| **Charts**  | Recharts ([components/analytics/tendencias.tsx](components/analytics/tendencias.tsx)) |
| **AI/Chat** | N8N webhooks ([prompts/](prompts/)), CarolLLM/Agent/StateMachine              |
| **Comms**   | Twilio SMS, Sonner toasts                                                     |
| **Other**   | Rate limiting ([lib/rate-limit.ts](lib/rate-limit.ts)), Lucide icons, Middleware |

## Setup & Development

1. **Prerequisites**: Node 20+, Supabase CLI, Twilio/N8N accounts.
2. **Install**: `npm i`.
3. **Env** (copy [.env.local.example](.env.local.example)):
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_url
   SUPABASE_SERVICE_ROLE_KEY=your_key
   TWILIO_ACCOUNT_SID=...
   WEBHOOK_SECRET=n8n_secret
   ```
4. **Supabase**: `supabase db push`, `npm run db:generate`.
5. **Run**: `npm run dev` → http://localhost:3000/admin/agenda.
6. **Test**: Create appointment → webhook fires; chat on landing → Carol responds.

**Troubleshooting**:
- **Auth**: `getUser()` from [lib/actions/auth.ts](lib/actions/auth.ts).
- **Webhooks**: Verify `getWebhookUrl()` ([lib/config/webhooks.ts](lib/config/webhooks.ts)).
- **Rate Limits**: `checkRateLimit(ip)` ([lib/rate-limit.ts](lib/rate-limit.ts)).
- **AI Flows**: Scripts in `/scripts/` (e.g., `npm run test:chat-scenarios`).

## Contribution Guidelines

- **DB**: Add to [types/index.ts](types/index.ts), create Supabase migration/RLS.
- **UI**: `npx shadcn@latest add component`, place in `/components/ui` or domain folder.
- **Hooks/Actions**: Client: `/hooks/`; Server: `/lib/actions/`.
- **AI Handlers**: Extend [lib/ai/state-machine/handlers/](lib/ai/state-machine/handlers/) (e.g., new `UserIntent`).
- **PRs**: `npm run lint`, test agenda/chat/clients/analytics; update types.
- **Extend**: New `WebhookEventType` + hook (e.g., `useNotifyClientBirthday`).

**Roadmap**: Multi-location support, Stripe payments, PWA, advanced AI (voice), Stripe integrations.

For full symbols/search: Use IDE. See [api-reference.md](api-reference.md) for exports/interfaces/functions.

# Feature Developer Playbook

This playbook guides the **Feature Developer Agent** in implementing new features for the Caroline Cleaning app—a Next.js 14+ App Router application using TypeScript (.ts/.tsx), React, Tailwind CSS, shadcn/ui components, Prisma database, TanStack Query, react-hook-form with Zod validation, Recharts for charts, and integrations like N8N webhooks (`WebhookService`), Carol AI APIs (`/api/carol/{query,actions}`), notifications, and chat logging (`ChatLoggerService`). The codebase spans ~183 files: UI components (137 .tsx in `components/` domains), API routes (44 .ts in `app/api/`), services (`lib/services/`), and nested pages (`app/(admin)/admin/*`, `app/(public)/`, `app/(auth)/`).

**Core Focus Areas**:
- **Admin Dashboard** (`app/(admin)/admin/*`): Clients (`clientes/[id]` with tabs like `tab-agendamentos`, `tab-financeiro`), finance (`financeiro/{relatorios,receitas,categorias,despesas}`), agenda, analytics (`analytics/{tendencias,satisfacao,receita,conversao,clientes,carol}`), chat logs (`chat-logs/[sessionId]`), configs (`configuracoes/{servicos,equipe,pricing,areas,addons,empresa,trackeamento,sistema}`), contracts (`contratos/{[id],novo}`), team/equipe.
- **Public Landing** (`app/(public)/{landing,chat,contrato/[id]/assinar,terms,privacy}`): Marketing, pricing, contact, chat, contract signing (`SignaturePad`).
- **Components** (152+ symbols): Domain-specific (`components/{agenda,financeiro,clientes,cliente-ficha,chat,analytics,tracking,landing,ui,admin,SignaturePad}`); reusable, typed props, <300 LOC/file; chat bubbles, client fichas, finance forms.
- **API Routes/Controllers** (50+ symbols): `app/api/{slots,profile/pricing/health/contact/chat/status,webhook/n8n,tracking/{event,config},profile/password,notifications/send,financeiro/categorias/[id],cron/{reminders,recurrences,cleanup-logs},config/public,carol/{query,actions},admin/chat-logs/[sessionId]/export}`; Zod schemas, Prisma queries, handlers (`registerAllHandlers`).
- **Services** (business logic): `lib/services/{webhookService.ts (WebhookService), chat-logger.ts (ChatLoggerService)}`; orchestration, logging (`HandlerRecord`, `LogEntry`, `SessionSummary`).
- **Types & Hooks**: `components/agenda/types.ts` (`ServicoTipo`, `Addon`, `AddonSelecionado`, `AppointmentFormData`); `useAppointmentForm`; chat logging types (`LogInteractionParams`, `LogQueryParams`).

New features must be **type-safe**, **responsive** (Tailwind `sm: md: lg:`), **dark-mode ready** (`dark:`), **accessible** (ARIA, keyboard), **optimistic** (TanStack Query), integrate **webhooks/notifications/chat-logging**, and follow Server Components with `Suspense`/`loading.tsx`/`error.tsx`.

## Key Files and Purposes

### Components (UI Primitives, Forms, Tables, Tabs, Charts, Chat, Signature)
Domain-grouped, composable with shadcn/ui (`components/ui/{Button,Input,Table,Tabs,Form,Skeleton,Dialog,...}`). Use `cn()` from `lib/utils.ts`.

| Domain/Path | Purpose | Key Files/Symbols | Usage/Integrations |
|-------------|---------|-------------------|--------------------|
| `components/agenda/` | Scheduling/forms | `types.ts` (`ServicoTipo`, `Addon`, `AddonSelecionado`, `AppointmentFormData`); `appointment-form/use-appointment-form.ts` (`useAppointmentForm`) | Admin/agenda, `cliente-ficha/tab-agendamentos`; react-hook-form + Zod |
| `components/landing/` | Marketing | `pricing.tsx` (`PricingItem`); `whats-included.tsx` (`WhatsIncluded`); `trust-badges.tsx` (`TrustBadges`); `meet-carol.tsx` (`MeetCarol`); `how-it-works.tsx` (`HowItWorks`) | `app/(public)/`; dynamic data |
| `components/financeiro/` | Transactions/categories | `transaction-form.tsx` (`TransactionFormProps`); `financeiro-content.tsx` (`FinanceiroContentProps`); `expense-categories.tsx` (`ExpenseCategoryProps`); `category-quick-form.tsx` (`CategoryQuickFormProps`) | `app/(admin)/admin/financeiro/*`; CRUD |
| `components/clientes/` | Lists/filters | `clients-table.tsx` (`Client`, `ClientsTableProps`); `clients-filters.tsx` (`ClientsFiltersProps`) | `app/(admin)/admin/clientes`; TanStack Table |
| `components/cliente-ficha/` | Client tabs | `tab-notas.tsx` (`TabNotasProps`); `tab-info.tsx` (`TabInfoProps`); `tab-financeiro.tsx` (`TabFinanceiroProps`); `tab-contrato.tsx` (`TabContratoProps`); `tab-agendamentos.tsx` (`TabAgendamentosProps`); `client-header.tsx` (`ClientHeaderProps`) | `app/(admin)/admin/clientes/[id]`; parallel queries |
| `components/chat/` | Messaging | `message-bubble.tsx` | `app/(public)/chat`, `app/(admin)/admin/mensagens/[sessionId]`; `/api/chat/` optimistic |
| `components/tracking/` | Events | `tracking-provider.tsx` (`TrackingProviderProps`, `Window`) | App wrapper; `/api/tracking/` |
| `components/SignaturePad.tsx` | Contract signing | `SignaturePad` (`SignaturePadProps`) | `app/(public)/contrato/[id]/assinar` |
| `components/ui/` | Primitives | Button, Input, etc. | All; responsive/dark |

### API Routes (Controllers: `app/api/`)
Zod-parsed `NextRequest`, Prisma/services (`ChatLoggerService.logInteraction()`), error Responses.

| Path | Methods/Key Symbols | Purpose | Integrations |
|------|---------------------|---------|--------------|
| `chat/` & `chat/status/` | `POST`, `GET` | Messages/status | `ChatLoggerService`, optimistic UI |
| `admin/chat-logs/[sessionId]` & `export` | `GET` | Logs/export | `ChatLoggerService.queryLogs()` |
| `webhook/n8n/` | `POST` | N8N triggers | `WebhookService.process()` |
| `carol/{query,actions}/` | `GET`, `POST` | AI | Chat/agenda |
| `financeiro/categorias/[id]/` | CRUD | Categories | Finance forms |
| `slots/` | `GET` | Availability | Agenda |
| `profile/` | `GET`, `PUT` | Profile | Auth |
| `notifications/send/` | `POST` | Alerts | Post-CRUD |

### Services (lib/services/ - 85% Service Layer Pattern)
Class-based encapsulation.

| File | Purpose | Key Symbols |
|------|---------|-------------|
| `lib/services/webhookService.ts` | Webhooks/N8N, notifications | `WebhookService` (process events) |
| `lib/services/chat-logger.ts` | Interaction logging, summaries, queries | `ChatLoggerService`; `HandlerRecord`, `ErrorRecord`, `LogInteractionParams`, `SessionSummary`, `LogEntry`, `LogQueryParams` |

### Pages/Layouts (`app/`)
Nested RSC, `[id]` dynamics, `Suspense`.

- Admin: `admin/{servicos,mensagens,leads,financeiro,equipe,contratos,conta,configuracoes,clientes,chat-logs,analytics,agenda}`.
- Public: `chat`, `contrato/[id]/assinar`.

## Code Patterns & Conventions
- **Components** (client):
  ```tsx
  'use client';
  import { cn } from '@/lib/utils';
  import { Button } from '@/components/ui/button';
  import { AppointmentFormData } from '@/components/agenda/types';
  import { ChatLoggerService } from '@/lib/services/chat-logger';

  interface Props { /* typed */ }
  export function MyComponent({}: Props) {
    const logger = new ChatLoggerService();
    // ...
    logger.logInteraction({ /* LogInteractionParams */ });
    return <div className={cn('p-6 dark:bg-slate-900')}>...</div>;
  }
  ```
- **Hooks**: `useQuery`, `useMutation` with `invalidateQueries`.
- **API Routes**:
  ```ts
  import { NextRequest } from 'next/server';
  import { z } from 'zod';
  import { ChatLoggerService } from '@/lib/services/chat-logger';
  import { prisma } from '@/lib/prisma';

  export async function POST(req: NextRequest) {
    try {
      const data = schema.parse(await req.json());
      await new ChatLoggerService().logInteraction(data);
      return Response.json({ success: true });
    } catch (error) { /* 400 */ }
  }
  ```
- **Services**:
  ```ts
  export class ChatLoggerService {
    async logInteraction(params: LogInteractionParams): Promise<LogEntry> { /* Prisma */ }
    async getSessionSummary(sessionId: string): Promise<SessionSummary> { /* */ }
  }
  ```
- **Forms/Types**: Zod + `z.infer`; exported enums/types.

## Workflows for Common Tasks

### 1. New Reusable Component (e.g., `components/chat-log-viewer.tsx`)
1. File: `components/chat/chat-log-viewer.tsx`.
2. Props: `interface ChatLogViewerProps { sessionId: string; logs?: LogEntry[]; }`.
3. UI: `<Table data={logs} />` + `SessionSummary`; Skeleton, responsive.
4. Hook: `useQuery(['logs', sessionId], () => fetch(`/api/admin/chat-logs/${sessionId}`))`.
5. Log: `new ChatLoggerService().logInteraction({ handler: 'view-logs' })`.
6. Barrel: `components/chat/index.ts`.
7. Use: Admin chat-logs pages.

### 2. New API Endpoint (e.g., `/api/chat-logs/search`)
1. `app/api/chat-logs/search/route.ts`.
2. Schema: `z.object({ query: z.string(), ...LogQueryParams })`.
3. Logic: `new ChatLoggerService().queryLogs(params)`.
4. Errors: Zod/404; integrate TanStack.

### 3. Extend Client Ficha (e.g., `tab-chat-logs.tsx`)
1. `components/cliente-ficha/tab-chat-logs.tsx` (`TabChatLogsProps { clientId: string; }`).
2. Query: `useQuery(['chat-logs', clientId], () => get(`/api/admin/chat-logs?clientId=${clientId}`))`.
3. UI: `<ChatLogViewer data={data} />`.
4. Page: Add to `clientes/[id]/page.tsx` tabs.
5. Invalidate + toast.

### 4. Full Feature: Enhanced Chat Logging with Analytics
1. **Components**: `components/analytics/chat-trends.tsx` (Recharts + `LogEntry`).
2. **API**: `app/api/analytics/chat-logs/route.ts` (aggregate `LogQueryParams`).
3. **Service**: Extend `ChatLoggerService.getSessionSummary()`.
4. **Page**: `app/(admin)/admin/analytics/carol/page.tsx` + Suspense.
5. **Integrations**: Webhook on log, notifications.
6. **Polish**: Filters, export CSV.

### 5. Contract Signing Feature
1. Component: Extend `SignaturePad` in `app/(public)/contrato/[id]/assinar/page.tsx`.
2. Mutation: POST `/api/contratos/[id]/sign` → Prisma update + `WebhookService.process('contract-signed')`.
3. Logging: `ChatLoggerService.logInteraction({ type: 'contract-sign' })`.
4. Optimistic: Preview signature.

### 6. Admin Chat Logs Page Enhancement
1. Use `registerAllHandlers` from `lib/ai/state-machine/handlers`.
2. Query: `LogQueryParams` for filters.
3. Export: `/api/admin/chat-logs/[sessionId]/export` → CSV.

### 7. Cron/Webhook Integration (e.g., Log Cleanup)
1. Extend `app/api/cron/cleanup-logs/route.ts`: `ChatLoggerService.cleanupOldLogs()`.
2. Trigger: N8N → `WebhookService`.

## Best Practices from Codebase
- **Modularity**: Domain folders, barrels, compose (e.g., `category-quick-form` in tables).
- **Performance**: RSC, Suspense/skeletons, virtualized tables, `useTransition`.
- **UX**: Optimistic, infinite scroll (chat/clients), toasts, empty states.
- **Accessibility**: ARIA, keyboard, focus traps.
- **Security**: Zod, server auth.
- **Styling**: `cn()`, mobile-first, dark.
- **Integrations**: `ChatLoggerService.logInteraction()` on user actions; `WebhookService.process()` on CRUD; notifications; AI handlers.
- **Logging**: Always log interactions (`HandlerRecord/ErrorRecord`); query for analytics.
- **Commits**: `feat(chat-logs): add viewer component + API + service integration`.

## Quick Reference Checklist
- [ ] Domain files (`components/chat/`, `app/api/chat-logs/`, services)?
- [ ] Typed (extend `LogEntry`, `AppointmentFormData`; Zod)?
- [ ] shadcn/Tailwind/Recharts/TanStack patterns?
- [ ] Optimistic mutations + invalidate + toasts?
- [ ] Responsive/dark/accessible?
- [ ] Loading/empty/error states?
- [ ] `ChatLoggerService` + `WebhookService` + notifications?
- [ ] Page/tabs/Suspense integration?
- [ ] Mobile-optimized?
- [ ] Tested in context?

# Glossary & Domain Concepts

This glossary defines project-specific terminology, domain entities, acronyms, key types/interfaces, user personas, and business rules for the **Carolinas Premium** application—a Next.js 14 (App Router) admin dashboard and client-facing system for salon/spa management. Core features include client management (`Cliente`), appointments (`Agendamento`), finances (`Financeiro`), chat (`ChatWidget`), analytics (`ConversionFunnel`, `DashboardStats`), webhooks (`WebhookService`), and business configuration (`BusinessSettings`).

**Tech Stack**: Supabase (auth, PostgreSQL with RLS, realtime), Tailwind CSS + shadcn/ui (`cn`), TypeScript (`types/`), React hooks (`useChat`, `useWebhook`).

**Cross-references**:
- [Core Types](types/index.ts)
- [Webhook Types](types/webhook.ts)
- [Supabase Schema](types/supabase.ts)
- [Business Config](lib/business-config.ts)
- [Utils](lib/utils.ts), [Formatters](lib/formatters.ts)
- [Hooks](hooks/use-chat.ts), [use-webhook.ts](hooks/use-webhook.ts)
- [Logger](lib/logger.ts), [WebhookService](lib/services/webhookService.ts)
- [Tracking](lib/tracking/types.ts)

## Type Definitions

Core data models from `types/index.ts`, `types/webhook.ts`, `types/supabase.ts`, component types, and tracking. Used in Supabase CRUD, API routes (`app/api/*`), components (e.g., `appointment-form.tsx`), and hooks.

| Type/Interface | Description | Source | Example Usage |
|---------------|-------------|--------|--------------|
| **`Addon`** | Service add-on (e.g., tintura). Supports upsells. | [types/index.ts:21](types/index.ts), [components/agenda/types.ts:11](components/agenda/types.ts) | `{ id: 1, nome: 'Tintura', preco: 50 }`<br>`<AddonSection addons={addons} />` |
| **`AddonSelecionado`** | Selected add-on with quantity. | [components/agenda/types.ts:21](components/agenda/types.ts) | `{ addon: Addon, quantidade: 1 }` |
| **`AgendaHoje`** | Daily agenda summary (totals by status). | [types/index.ts:25](types/index.ts) | `{ total: 12, confirmados: 8, pendentes: 4 }` |
| **`Agendamento`** | Appointment: client, service, date/time, status, recurrence. | [types/index.ts:9](types/index.ts) | `{ id: 1, cliente_id: 1, servico: 'Corte', data: '2024-01-01T10:00:00Z', status: 'confirmado' }` |
| **`AgendamentoInsert`** | Create payload (no `id`). | [types/index.ts:10](types/index.ts) | `supabase.from('agendamentos').insert(data)` |
| **`AgendamentoUpdate`** | Partial update (status, date). | [types/index.ts:11](types/index.ts) | `{ status: 'concluido' }` |
| **`AppointmentCreatedPayload`** | New booking webhook. | [types/webhook.ts:90](types/webhook.ts) | `useNotifyAppointmentCreated(payload)` |
| **`AppointmentConfirmedPayload`** | Confirmation event. | [types/webhook.ts:108](types/webhook.ts) | Integrates `/api/slots` availability. |
| **`AppointmentCompletedPayload`** | Checkout trigger. | [types/webhook.ts:118](types/webhook.ts) | `useNotifyAppointmentCompleted()` |
| **`AppointmentCancelledPayload`** | Cancellation. | [types/webhook.ts:130](types/webhook.ts) | `useNotifyAppointmentCancelled()` |
| **`AppointmentRescheduledPayload`** | Date/time change. | [types/webhook.ts:143](types/webhook.ts) | Updates `data`/`hora`. |
| **`AppointmentFormData`** | Form state for create/edit. | [components/agenda/types.ts:28](components/agenda/types.ts) | `const { formData } = useAppointmentForm()` |
| **`AreaAtendida`** | Coverage areas (e.g., "Centro"). | [types/index.ts:19](types/index.ts) | Filters in `ClientsFilters`. |
| **`BusinessSettings`** | Config: hours, pricing, areas. | [lib/business-config.ts:3](lib/business-config.ts) | `const settings = getBusinessSettingsServer()` |
| **`ChatMessage`** | Chat entry from `useChat`. | [hooks/use-chat.ts:14](hooks/use-chat.ts) | `{ role: 'user' \| 'assistant', content: 'Olá!' }` |
| **`ChatMessagePayload`** | AI chat webhook. | [types/webhook.ts:39](types/webhook.ts) | n8n → `/api/chat`. |
| **`Cliente`** | Client: name, phone, email, status, birthday. | [types/index.ts:5](types/index.ts) | `<ClientsTable data={clientes} />` |
| **`ClienteInsert`** / **`ClienteUpdate`** | CRUD payloads. | [types/index.ts:6-7](types/index.ts) | `<EditClientModal client={data} />` |
| **`ClientBirthdayPayload`** | Birthday reminders. | [types/webhook.ts:202](types/webhook.ts) | Cron job. |
| **`ClientInactiveAlertPayload`** | Inactivity alerts (30 days). | [types/webhook.ts:191](types/webhook.ts) | Re-engagement. |
| **`Configuracao`** | App settings (singleton). | [types/index.ts:18](types/index.ts) | Pricing, notifications. |
| **`Contrato`** | Contract: duration, price + addons. | [types/index.ts:14](types/index.ts) | Client detail tab. |
| **`DashboardStats`** | KPIs: clients, revenue, appts. | [types/index.ts:26](types/index.ts) | Dashboard cards. |
| **`Database`** | Supabase schema (generated). | [types/supabase.ts:9](types/supabase.ts) | Type-safe queries. |
| **`Feedback`** | NPS/feedback. | [types/index.ts:17](types/index.ts) | `{ score: 9, comment: 'Ótimo!' }` |
| **`FeedbackReceivedPayload`** | New feedback. | [types/webhook.ts:159](types/webhook.ts) | `useNotifyFeedbackReceived()` |
| **`Financeiro`** | Transactions: payments/expenses. | [types/index.ts:15](types/index.ts) | `<TransactionForm />` |
| **`Json`** | Supabase JSONB. | [types/supabase.ts:1](types/supabase.ts) | Flexible data. |
| **`LeadCreatedPayload`** / **`LeadUpdatedPayload`** / **`LeadConvertedPayload`** | Lead funnel. | [types/webhook.ts:57-80](types/webhook.ts) | Chat → `Cliente`. |
| **`MensagemChat`** | Stored chat messages. | [types/index.ts:16](types/index.ts) | Realtime subs. |
| **`NotificationTypes`** | Alert categories. | [types/index.ts:47](types/index.ts) | Webhook triggers. |
| **`PaymentReceivedPayload`** | Payment confirmation. | [types/webhook.ts:176](types/webhook.ts) | Updates `Financeiro`. |
| **`PrecoBase`** | Base service price. | [types/index.ts:22](types/index.ts) | + `Addon` total. |
| **`Recorrencia`** | Recurring rules. | [types/index.ts:13](types/index.ts) | Auto-generates appts. |
| **`ServicoTipo`** | Services (e.g., "Cabelo"). | [types/index.ts:20](types/index.ts), [components/agenda/types.ts:1](components/agenda/types.ts) | Dropdowns. |
| **`UserProfile`** | User metadata. | [types/index.ts:29](types/index.ts) | Auth context. |
| **`WebhookPayload`** | All webhook unions. | [types/webhook.ts:214](types/webhook.ts) | `/api/webhook/n8n`. |
| **`WebhookEventType`** | Event discriminants. | [types/webhook.ts:1](types/webhook.ts) | `'CHAT_MESSAGE' \| 'APPOINTMENT_CREATED' \| ...` |
| **`WebhookResponse`** | API response. | [types/webhook.ts:22](types/webhook.ts) | `{ success: true, data: ... }` |
| **`WebhookOptions`** | Call config. | [types/webhook.ts:29](types/webhook.ts) | `{ timeout: 5000, secret: '...' }` |

## Enumerations & Unions

TypeScript unions/literals (no native enums):

- **Cliente Status**: `'ativo' \| 'inativo' \| 'pendente'`
- **Agendamento Status**: `'pendente' \| 'confirmado' \| 'concluido' \| 'cancelado'`
- **LogLevel** (`Logger`): `'DEBUG' \| 'INFO' \| 'WARN' \| 'ERROR'` ([lib/logger.ts:2](lib/logger.ts))
- **WebhookEventType**: Payload unions (e.g., `'LEAD_CREATED'`, `'APPOINTMENT_COMPLETED'`).
- **ViewType** (calendar): `'day' \| 'week' \| 'month'` ([components/agenda/calendar-view.tsx:18](components/agenda/calendar-view.tsx))
- **TrackingEventName**: Analytics events ([lib/tracking/types.ts:73](lib/tracking/types.ts))

## Core Terms & Components

Domain entities and UI (152 components; top: `appointment-modal.tsx` imported 8x).

| Term | Description | Key Files/Components | Usage Example |
|------|-------------|----------------------|--------------|
| **Cliente** | Core entity (ficha: tabs for appts/finance/contrato). | `ClientesPage`, `ClienteDetalhePage`, `clients-table.tsx`, `clients-filters.tsx` | `<ClientsTable data={data} filters={props} />`<br>`<ClientsFilters onChange={setFilters} />` |
| **Agendamento** | Bookings (overlap checks via `/api/slots`). | `AgendaPage`, `CalendarView`, `appointment-modal.tsx` (8 imports) | `<CalendarView view="week" />`<br>`useAppointmentForm()` |
| **Ficha do Cliente** | Detail view (header + tabs). | `client-header.tsx`, `tab-agendamentos.tsx`, `tab-financeiro.tsx` | Aggregates `Cliente`/`Agendamento`. |
| **Chat** | AI widget (realtime, sessions). | `ChatWidget`, `ChatWindow` (3 imports), `ChatInput`, `useChat` | `<ChatWidget />`<br>`const { messages } = useChat()` |
| **Financeiro** | Invoices/expenses (quick forms, exports). | `transaction-form.tsx` (2 imports), `category-quick-form.tsx`, `expense-categories.tsx` | `<TransactionForm type="payment" />`<br>`exportToExcel(data)` |
| **Analytics** | Funnels/trends/clients. | `ConversionFunnel`, `ClientesAnalyticsPage`, `trends-chart.tsx` | `<ConversionFunnel data={funnel} />` |
| **Admin UI** | Protected (i18n, sidebar). | `AdminLayout`, `AdminHeader`, `AdminI18nProvider`, `ConfigLinkCard` | `(admin)` routes. |
| **Landing** | Public: bar, about, pricing. | `AnnouncementBar`, `AboutUs`, `pricing.tsx` | `<AnnouncementBar message="Promo!" />` |
| **Webhooks** | n8n automations. | `webhooks-tabs.tsx` (6 imports), `webhook-detail-modal.tsx` | `<WebhooksTabs />` |

## Key Hooks & Utils

**Hooks**:
- `useChat()`: `ChatMessage[]`, `/api/chat`.
- `useWebhook()`: Generic; e.g., `useNotifyAppointmentCreated()`, `useSendChatMessage()`.
- `useAppointmentForm()`: `AppointmentFormData` validation.
- `useChatSession()`: Session ID (`generateSessionId`).

**Utils** (widely imported):
- `cn()`: Classes ([lib/utils.ts:6](lib/utils.ts)).
- Formatters: `formatCurrency()`, `formatPhoneUS()`, `isValidEmail()` ([lib/formatters.ts](lib/formatters.ts)).
- Supabase: `createClient()` (client/server).
- Config: `getBusinessSettingsServer()`, `saveBusinessSettings()`.
- Exports: `exportToExcel()`, `exportToPDF()`.
- Tracking: `generateEventId()`, `getUtmParams()`.
- Webhooks: `getWebhookUrl()`, `sendWebhookAction()`.
- Middleware: `rateLimit()`, `middleware()`.

## Acronyms & Abbreviations

| Acronym | Full Form | Context |
|---------|-----------|---------|
| **n8n** | n8n Automation | `/api/webhook/n8n`, `WebhookPayload`. |
| **RLS** | Row Level Security | Supabase policies (admin/prestador). |
| **BaaS** | Backend-as-a-Service | Supabase (auth/DB/realtime). |
| **NPS** | Net Promoter Score | `Feedback.score` (0-10). |
| **CRUD** | Create/Read/Update/Delete | Supabase via `createClient`. |

## User Personas

| Persona | Role | Permissions | Key Screens |
|---------|------|-------------|-------------|
| **Admin** | Owner | Full CRUD/config/analytics. | `AdminLayout`, `ConfiguracoesPage`, `CategoriasPage`. |
| **Prestador** | Stylist | Agenda/clients read, appt updates. | `AgendaPage`, client ficha. |
| **Cliente** | Customer | Chat/booking (future). | `ChatWidget`, landing. |
| **Bot** | Automation | Webhooks/cron. | `WebhookService`. |

## Business Rules & Constraints

- **Validation**: Phone/ZIP/email (`lib/formatters.ts`); forms/modals.
- **Scheduling**: No overlaps (`/api/slots`); `Recorrencia` auto-appts.
- **Lifecycle**: Lead → `Cliente` → Appt (`created`→`completed`) → Payment/Feedback.
- **Alerts**: Inactive/birthday via webhooks.
- **Security**: RLS, `rateLimit`, webhook secrets, `updateSession()`.
- **Realtime**: Supabase for chat/agenda.
- **Exports**: Clients/finances via `lib/export-utils.ts`.
- **Config**: `BusinessSettings` (client/server getters).
- **i18n**: PT-BR (`AdminI18nProvider`), BRL/USD formats.
- **Tracking**: `TrackingConfig`, events (`lib/tracking/`).

**Regenerate Supabase types**: `npx supabase gen types typescript --local > types/supabase.ts`.

Full API: 284+ symbols. See codebase scans for exports (e.g., `AgendaPage`, `ConversionFunnel`).

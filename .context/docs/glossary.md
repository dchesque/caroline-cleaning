# Glossary & Domain Concepts

This glossary defines project-specific terminology, domain entities, acronyms, key types/interfaces, user personas, and business rules for the **Carolinas Premium** application—a Next.js 14 (App Router) admin dashboard and client-facing system for salon/spa management. Core features include client management (`Cliente`), appointments (`Agendamento`), finances (`Financeiro`), chat (`ChatWidget`), analytics (`ConversionFunnel`, `DashboardStats`), and webhook automations (n8n integration via `WebhookService`).

**Tech Stack**: Supabase (auth, PostgreSQL DB with RLS, realtime subscriptions), Tailwind CSS + shadcn/ui (`cn` utility), TypeScript (`types/`), React hooks (`useChat`, `useWebhook`).

**Cross-references**:
- [Core Types](types/index.ts)
- [Webhook Types](types/webhook.ts)
- [Supabase Schema](types/supabase.ts)
- [Business Config](lib/business-config.ts)
- [Utils](lib/utils.ts), [Formatters](lib/formatters.ts)
- [Hooks](hooks/use-chat.ts), [hooks/use-webhook.ts](hooks/use-webhook.ts)
- [Logger](lib/logger.ts), [WebhookService](lib/services/webhookService.ts)

## Type Definitions

Core data models from `types/index.ts`, `types/webhook.ts`, `types/supabase.ts`, and component-specific types. Used across DB operations (Supabase CRUD), API routes (`app/api/*`), components (e.g., `appointment-form.tsx`), and hooks (e.g., `useAppointmentForm`).

| Type/Interface | Description | Source | Example Usage |
|---------------|-------------|--------|--------------|
| **`Addon`** | Service add-on (e.g., tintura to haircut). Supports pricing upsells. | [types/index.ts:21](types/index.ts), [components/agenda/types.ts:11](components/agenda/types.ts) | `{ id: 1, nome: 'Tintura', preco: 50 }`<br>`<AddonSection addons={selectedAddons} />` |
| **`AddonSelecionado`** | Selected add-on with quantity. | [components/agenda/types.ts:21](components/agenda/types.ts) | `{ addon: Addon, quantidade: 1 }` |
| **`AgendaHoje`** | Daily agenda summary for dashboard. | [types/index.ts:25](types/index.ts) | `{ total: 12, confirmados: 8, pendentes: 4 }` |
| **`Agendamento`** | Appointment: links `cliente_id`, service, date/time, status, recurrence. | [types/index.ts:9](types/index.ts) | `{ id: 1, cliente_id: 1, servico: 'Corte', data: '2024-01-01T10:00:00Z', status: 'confirmado' }` |
| **`AgendamentoInsert`** | Payload for creating appointments (omits `id`). | [types/index.ts:10](types/index.ts) | Used in `useAppointmentForm`. |
| **`AgendamentoUpdate`** | Partial update (e.g., status, date). | [types/index.ts:11](types/index.ts) | `{ status: 'concluido' }` |
| **`AppointmentCreatedPayload`** | Webhook for new bookings. Triggers notifications. | [types/webhook.ts:90](types/webhook.ts) | `useNotifyAppointmentCreated()` |
| **`AppointmentConfirmedPayload`** | Confirmation webhook. | [types/webhook.ts:108](types/webhook.ts) | Integrates with `/api/slots`. |
| **`AppointmentCompletedPayload`** | Check-out webhook (e.g., payment trigger). | [types/webhook.ts:118](types/webhook.ts) | `useNotifyAppointmentCompleted()` |
| **`AppointmentCancelledPayload`** | Cancellation webhook. | [types/webhook.ts:130](types/webhook.ts) | `useNotifyAppointmentCancelled()` |
| **`AppointmentRescheduledPayload`** | Reschedule update. | [types/webhook.ts:143](types/webhook.ts) | Updates `data` field. |
| **`AppointmentFormData`** | Form state for appointment creation/editing. | [components/agenda/types.ts:28](components/agenda/types.ts) | Returned by `useAppointmentForm()`. |
| **`AreaAtendida`** | Service coverage areas (e.g., "Centro"). | [types/index.ts:19](types/index.ts) | Client/appointment filters. |
| **`BusinessSettings`** | Global config (hours, pricing, areas). | [lib/business-config.ts:4](lib/business-config.ts) | `getBusinessSettingsServer()`, `BusinessSettingsProvider` |
| **`ChatMessage`** | Chat message from `useChat` hook. | [hooks/use-chat.ts:14](hooks/use-chat.ts) | `{ role: 'user' \| 'assistant', content: 'Olá!' }` |
| **`ChatMessagePayload`** | Webhook payload for AI chat responses. | [types/webhook.ts:39](types/webhook.ts) | n8n → `/api/chat`. |
| **`Cliente`** | Core client entity: name, phone, email, status, birthday, contracts. | [types/index.ts:5](types/index.ts) | Central to `ClientesPage`, `ClienteDetalhePage`. |
| **`ClienteInsert`** / **`ClienteUpdate`** | CRUD payloads. Validates formats. | [types/index.ts:6-7](types/index.ts) | `EditClientModalProps`. |
| **`ClientBirthdayPayload`** | Daily birthday reminders. | [types/webhook.ts:202](types/webhook.ts) | Cron-triggered. |
| **`ClientInactiveAlertPayload`** | 30-day inactivity alerts. | [types/webhook.ts:191](types/webhook.ts) | Re-engagement. |
| **`Configuracao`** | App-wide settings (singleton). | [types/index.ts:18](types/index.ts) | Pricing rules, hours. |
| **`Contrato`** | Client contract: duration, base price + addons. | [types/index.ts:14](types/index.ts) | `TabContratoProps`. |
| **`DashboardStats`** | Admin KPIs: clients, revenue, appointments. | [types/index.ts:26](types/index.ts) | Dashboard top cards. |
| **`Database`** | Full Supabase schema (tables, relations). | [types/supabase.ts:9](types/supabase.ts) | Auto-generated types. |
| **`Feedback`** | NPS/feedback: score, comment. | [types/index.ts:17](types/index.ts) | Analytics. |
| **`FeedbackReceivedPayload`** | New feedback webhook. | [types/webhook.ts:159](types/webhook.ts) | `useNotifyFeedbackReceived()`. |
| **`Financeiro`** | Transactions: payments, expenses, categories. | [types/index.ts:15](types/index.ts) | `TransactionFormProps`. |
| **`Json`** | Supabase JSONB type (recursive). | [types/supabase.ts:1](types/supabase.ts) | Flexible columns. |
| **`LeadCreatedPayload`** / **`LeadUpdatedPayload`** / **`LeadConvertedPayload`** | Lead funnel webhooks. | [types/webhook.ts:57-80](types/webhook.ts) | Chat/form → `Cliente`. |
| **`MensagemChat`** | Persistent chat messages. | [types/index.ts:16](types/index.ts) | Realtime Supabase. |
| **`PaymentReceivedPayload`** | Payment confirmation. | [types/webhook.ts:176](types/webhook.ts) | Updates `Financeiro`. |
| **`PrecoBase`** | Base service price. | [types/index.ts:22](types/index.ts) | `PrecoBase + Addon`. |
| **`Recorrencia`** | Recurring appointment rules. | [types/index.ts:13](types/index.ts) | Auto-generates `Agendamento`. |
| **`ServicoTipo`** | Service types (e.g., "Cabelo"). | [types/index.ts:20](types/index.ts), [components/agenda/types.ts:1](components/agenda/types.ts) | Form dropdowns. |
| **`WebhookPayload`** | Union of all webhook events. | [types/webhook.ts:214](types/webhook.ts) | `/api/webhook/n8n/route.ts`. |
| **`WebhookEventType`** | Discriminated event keys. | [types/webhook.ts:1](types/webhook.ts) | `'APPOINTMENT_CREATED' \| ...` |
| **`WebhookResponse`** | Webhook API response shape. | [types/webhook.ts:22](types/webhook.ts) | Returned by webhook handlers. |
| **`WebhookOptions`** | Config for webhook calls (timeout, secret). | [types/webhook.ts:29](types/webhook.ts) | `getWebhookTimeout()`, `getWebhookSecret()`. |

## Enumerations & Unions

No native `enum`s; relies on TypeScript unions and literals:

- **Cliente Status**: `'ativo' \| 'inativo' \| 'pendente'`
- **Agendamento Status**: `'confirmado' \| 'cancelado' \| 'concluido' \| 'pendente'`
- **LogLevel** (`Logger` class): `'DEBUG' \| 'INFO' \| 'WARN' \| 'ERROR'` ([lib/logger.ts:2](lib/logger.ts))
- **WebhookEventType**: All payload discriminants (e.g., `'CHAT_MESSAGE'`, `'LEAD_CREATED'`).
- **ViewType** (calendar): `'day' \| 'week' \| 'month'` ([components/agenda/calendar-view.tsx:16](components/agenda/calendar-view.tsx))

## Core Terms & Components

Key domain entities and UI exports (139 components, top usage from scans):

| Term | Description | Key Files/Components | Usage Example |
|------|-------------|----------------------|--------------|
| **Cliente** | Central entity. Ficha includes tabs for agendamentos, financeiro, contrato. | `ClientesPage`, `ClienteDetalhePage`, `clients-table.tsx`, `clients-filters.tsx`, `edit-client-modal.tsx` | `<ClientsTable data={clientes} filters={filters} />`<br>`<EditClientModal client={cliente} />` |
| **Agendamento** | Bookings with no-overlap checks (`/api/slots`). Views: day/week/month. | `AgendaPage`, `calendar-view.tsx`, `appointment-modal.tsx`, `appointment-form/*` | `useAppointmentForm({ initialData })`<br>`<AppointmentModal />` (imported by 8 files) |
| **Ficha do Cliente** | Client detail view (header + tabs: info, agendamentos, financeiro, contrato, notas). | `client-header.tsx`, `tab-agendamentos.tsx`, `tab-financeiro.tsx`, etc. | Aggregates `Cliente`, `Agendamento`, `Contrato`. |
| **Chat** | AI-assisted widget (realtime, session-based). | `ChatWidget`, `chat-window.tsx`, `chat-input.tsx`, `useChat` | `<ChatWidget />` → `/api/chat`<br>`const { messages, sendMessage } = useChat()` (imported by 3 files) |
| **Financeiro** | Invoices, expenses, categories. Quick forms, exports. | `transaction-form.tsx`, `expense-categories.tsx`, `category-quick-form.tsx`, `exportToExcel`/`exportToPDF` | `<CategoryQuickForm onSubmit={addCategory} />`<br>`<TransactionForm />` (imported by 2 files) |
| **Analytics** | Funnels, trends, client stats. | `ConversionFunnel`, `trends-chart.tsx`, `ClientesAnalyticsPage` | `<ConversionFunnel />`<br>`<TrendsChart data={trendData} />` |
| **Admin UI** | Protected layout with i18n, header. | `AdminLayout`, `AdminHeader`, `AdminI18nProvider` | `(admin)` route group, `lib/admin-i18n/context.tsx`. |
| **Landing** | Public pages: announcement, pricing, about. | `AnnouncementBar`, `AboutUs`, `pricing.tsx` | `<AnnouncementBar />` |

## Key Hooks & Utils

**Hooks** (practical for components):
- `useChat()`: Manages `ChatMessage[]`, integrates `/api/chat`.
- `useWebhook()`: Generic notifier; specialized: `useNotifyAppointmentCreated()`, `useSendChatMessage()`, etc.
- `useAppointmentForm()`: Validates `AppointmentFormData`, handles `ServicoTipo` + `Addon`.
- `useChatSession()`: Generates/retrieves session ID (`generateSessionId`).

**Utils** (imported widely):
- `cn()`: Tailwind conditional classes ([lib/utils.ts:6](lib/utils.ts)).
- `formatCurrency()` / `formatCurrencyUSD()` / `formatCurrencyInput()`: BRL/USD handling.
- `formatPhoneUS()` / `isValidPhoneUS()` / `isValidEmail()`: Input validation.
- `createClient()`: Supabase (client/server variants).
- `getBusinessSettingsServer()` / `mapDbToSettings()`: Config layer.
- `exportToExcel()` / `exportToPDF()`: Data exports.
- `rateLimit()`: Middleware protection.

## Acronyms & Abbreviations

| Acronym | Full Form | Context |
|---------|-----------|---------|
| **n8n** | n8n Workflow Automation | Webhook receiver (`/api/webhook/n8n`), event triggers (`WebhookPayload`). |
| **RLS** | Row Level Security | Supabase policies: admin full access, prestador read-only. |
| **BaaS** | Backend-as-a-Service | Supabase handles auth/DB/realtime. |
| **NPS** | Net Promoter Score | `Feedback` score (0-10). |
| **CRUD** | Create, Read, Update, Delete | Supabase ops via `createClient`. |

## User Personas

| Persona | Role | Permissions | Key Screens/Hooks |
|---------|------|-------------|-------------------|
| **Admin** | Owner/Manager | Full CRUD, analytics, config (`EquipeConfigPage`, `CategoriasPage`). | `AdminLayout`, `DashboardStats`, `BusinessSettingsProvider`. |
| **Prestador** | Service Provider (Stylist) | View agenda/clients, update appts (`AgendaHoje`). | `AgendaPage`, client ficha tabs. |
| **Cliente** | End Customer | Chat, self-booking (future?). | `ChatWidget`, landing (`AnnouncementBar`). |
| **Bot/System** | Automation | n8n webhooks, cron jobs. | `WebhookService`, `sendWebhookAction`. |

## Business Rules & Constraints

- **Validation**: Phone/ZIP/email via `lib/formatters.ts`. Enforced in modals/forms (`EditClientModalProps`).
- **Scheduling**: `/api/slots` GET prevents overlaps; `Recorrencia` auto-creates.
- **Lifecycle**:
  1. Lead (chat/form) → `Lead*Payload` → `Cliente`.
  2. Appt: `created` → `confirmed` → `completed` (→ `PaymentReceivedPayload`).
  3. Alerts: Inactive (`ClientInactiveAlertPayload`), birthday (`ClientBirthdayPayload`).
- **Security**: `rateLimit` middleware, Supabase RLS/auth (`getUser`, `signOut`, `updateSession`), webhook secrets (`getWebhookSecret`).
- **Realtime**: Supabase subscriptions for `MensagemChat`, agenda.
- **Exports**: `lib/export-utils.ts` for clients/finances/analytics.
- **Config**: `BusinessSettings` singleton; getters for client/server.
- **Localization**: PT-BR UI (`AdminI18nProvider`), BRL/USD formats (US salon context).
- **Classes**: `Logger` (structured logs), `WebhookService` (n8n handling).

**Regenerate types**: `supabase gen types typescript --local > types/supabase.ts`.

For full API: 284 symbols (139 components, 44 controllers, 43 utils). See [symbol scans](#).

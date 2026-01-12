# Glossary & Domain Concepts

This glossary defines project-specific terminology, domain entities, acronyms, key types/interfaces, user personas, and business rules for the **Carolinas Premium** application—a Next.js 14 (App Router) admin dashboard and client-facing system for salon/spa management. It handles clients (`Cliente`), appointments (`Agendamento`), finances (`Financeiro`), chat (`ChatWidget`), analytics (e.g., `ConversionFunnel`), and webhook automations (n8n integration).

Core tech: Supabase (auth, DB, realtime), Tailwind CSS (`cn` utility), shadcn/ui components, TypeScript types from `types/`.

Cross-references: [Types Overview](types/index.ts), [Webhook Types](types/webhook.ts), [Supabase Schema](types/supabase.ts).

## Type Definitions

Core data models from `types/index.ts`, `types/webhook.ts`, `types/supabase.ts`. Used in DB ops, API routes, components, and hooks.

| Type/Interface | Description | Source | Example |
|---------------|-------------|--------|---------|
| **`Addon`** | Service upsell (e.g., add-on to haircut). | [`types/index.ts#L21`](#) | `{ id: 1, nome: 'Tintura', preco: 50 }` |
| **`AgendaHoje`** | Today's schedule summary (for `DashboardStats`). | [`types/index.ts#L25`](#) | `{ total: 12, confirmados: 8, pendentes: 4 }` |
| **`Agendamento`** | Appointment: client, service, date/time, status. | [`types/index.ts#L9`](#) | `{ id: 1, cliente_id: 1, servico: 'Corte', data: '2024-01-01T10:00:00Z', status: 'confirmado' }` |
| **`AgendamentoInsert`** | Create appointment payload. | [`types/index.ts#L10`](#) | Omit `id`, include `cliente_id`, `servico`. |
| **`AgendamentoUpdate`** | Update appointment payload. | [`types/index.ts#L11`](#) | Partial `Agendamento` for status/date changes. |
| **`AppointmentCancelledPayload`** | Webhook for cancellations. | [`types/webhook.ts#L130`](#) | `{ event: 'APPOINTMENT_CANCELLED', agendamento: Agendamento }` |
| **`AppointmentCompletedPayload`** | Webhook for check-outs. | [`types/webhook.ts#L118`](#) | Triggers payment notifications. |
| **`AppointmentConfirmedPayload`** | Webhook for confirmations. | [`types/webhook.ts#L108`](#) | `{ event: 'APPOINTMENT_CONFIRMED', ... }` |
| **`AppointmentCreatedPayload`** | Webhook for new bookings. | [`types/webhook.ts#L90`](#) | Integrates with `/api/slots`. |
| **`AppointmentRescheduledPayload`** | Webhook for reschedules. | [`types/webhook.ts#L143`](#) | Updates `data` field. |
| **`AreaAtendida`** | Service areas (e.g., "Centro", "Bairro Sul"). | [`types/index.ts#L19`](#) | Filters clients/appointments. |
| **`ChatMessage`** | Chat message from `useChat` hook. | [`hooks/use-chat.ts#L14`](#) | `{ role: 'user', content: 'Olá!' }` |
| **`ChatMessagePayload`** | Webhook chat payload. | [`types/webhook.ts#L39`](#) | For AI responses via n8n. |
| **`Cliente`** | Client: name, phone, email, status, birthday. | [`types/index.ts#L5`](#) | See [Core Terms](#core-terms). |
| **`ClienteInsert`** / **`ClienteUpdate`** | CRUD payloads for clients. | [`types/index.ts#L6-7`](#) | Validates phone/email via `lib/formatters.ts`. |
| **`ClientBirthdayPayload`** | Birthday reminder webhook. | [`types/webhook.ts#L202`](#) | Sent daily via cron. |
| **`ClientInactiveAlertPayload`** | Inactivity alert (e.g., 30 days no appt). | [`types/webhook.ts#L191`](#) | Re-engagement trigger. |
| **`Configuracao`** | App settings (hours, pricing rules). | [`types/index.ts#L18`](#) | Global singleton table. |
| **`Contrato`** | Client contract: duration, `PrecoBase`, addons. | [`types/index.ts#L14`](#) | Tab in `ClienteDetalhePage`. |
| **`DashboardStats`** | Admin metrics (clients, revenue, appts). | [`types/index.ts#L26`](#) | Fetched for dashboard. |
| **`Database`** | Supabase schema (tables, relations). | [`types/supabase.ts#L9`](#) | Generated via Supabase CLI. |
| **`Feedback`** | NPS/satisfaction (score, comment). | [`types/index.ts#L17`](#) | Analytics charts. |
| **`FeedbackReceivedPayload`** | New feedback webhook. | [`types/webhook.ts#L159`](#) | `useNotifyFeedbackReceived`. |
| **`Financeiro`** | Txns: payments, expenses, invoices. | [`types/index.ts#L15`](#) | `transaction-form.tsx`. |
| **`Json`** | Recursive JSON for Supabase. | [`types/supabase.ts#L1`](#) | Dynamic columns. |
| **`LeadCreatedPayload`** / **`LeadUpdatedPayload`** / **`LeadConvertedPayload`** | Lead lifecycle webhooks. | [`types/webhook.ts#L57-80`](#) | Form/chat → client. |
| **`MensagemChat`** | DB chat messages. | [`types/index.ts#L16`](#) | Realtime via Supabase. |
| **`PaymentReceivedPayload`** | Payment webhook. | [`types/webhook.ts#L176`](#) | Updates `Financeiro`. |
| **`PrecoBase`** | Base service price. | [`types/index.ts#L22`](#) | + `Addon` = total. |
| **`Recorrencia`** | Recurring rules (weekly, monthly). | [`types/index.ts#L13`](#) | Auto-generates appts. |
| **`ServicoTipo`** | Services (e.g., "Cabelo", "Massagem"). | [`types/index.ts#L20`](#) | Dropdowns in forms. |
| **`WebhookEventType`** | Event union (e.g., `'APPOINTMENT_CREATED'`). | [`types/webhook.ts#L1`](#) | All payloads. |
| **`WebhookPayload`** | Union of all payloads. | [`types/webhook.ts#L214`](#) | `/api/webhook/n8n`. |
| **`WebhookResponse`** / **`WebhookOptions`** | Response/config for webhooks. | [`types/webhook.ts#L22-29`](#) | Timeout/secret via `lib/config/webhooks.ts`. |

## Enumerations & Unions

No `enum`s; uses discriminated unions (e.g., `WebhookEventType`) and string literals:

- **Status** (in `Cliente`, `Agendamento`): `'ativo' | 'inativo' | 'pendente'`.
- **Servico Status**: `'confirmado' | 'cancelado' | 'concluido'`.
- **LogLevel** (`Logger`): `'DEBUG' | 'INFO' | 'WARN' | 'ERROR'`.

## Core Terms & Components

Domain entities and key exports:

- **Cliente**: Central hub. See [`ClientesPage`](app/(admin)/admin/clientes/page.tsx), [`ClienteDetalhePage`](app/(admin)/admin/clientes/[id]/page.tsx), tabs (`tab-agendamentos.tsx`, `tab-financeiro.tsx`).
  
  ```tsx
  // Usage in table
  <ClientsTable data={clientes} filters={filters} /> // components/clientes/clients-table.tsx
  ```

- **Agendamento**: Slots via [`calendar-view.tsx`](components/agenda/calendar-view.tsx) (day/week/month). API: `/api/slots`.
  
- **Ficha do Cliente**: Aggregated view (`client-header.tsx` + tabs).

- **Chat**: [`ChatWidget`](components/chat/chat-widget.tsx) → `useChat` → `/api/chat`. Messages: `ChatMessage[]`.

- **Analytics**: [`ConversionFunnel`](components/analytics/conversion-funnel.tsx), [`TrendsChart`](components/analytics/trends-chart.tsx), `ClientesAnalyticsPage`.

- **Financeiro**: [`transaction-form.tsx`](components/financeiro/transaction-form.tsx), categories (`ExpenseCategory`), exports (`exportToExcel`/`exportToPDF` from `lib/export-utils.ts`).

- **Admin UI**: [`AdminLayout`](app/(admin)/layout.tsx), [`AdminHeader`](components/admin/header.tsx), pages like `AgendaPage`.

- **Utils**: `cn` (classNames), `formatCurrency` (`lib/utils.ts`), formatters (`lib/formatters.ts`: phone, zip, email).

## Acronyms & Abbreviations

| Acronym | Full Form | Context |
|---------|-----------|---------|
| **n8n** | n8n Workflow Automation | [`/api/webhook/n8n`](app/api/webhook/n8n/route.ts); event triggers. |
| **RLS** | Row Level Security | Supabase policies for admin/client isolation. |
| **BaaS** | Backend-as-a-Service | Supabase (replaces custom server). |
| **NPS** | Net Promoter Score | Feedback metric in analytics. |
| **BRL/USD** | Brazilian Real / US Dollar | `formatCurrency` (BRL), `formatCurrencyUSD`. |

## User Personas

| Persona | Role | Key Features | Pages/Hooks |
|---------|------|--------------|-------------|
| **Admin** | Owner/Manager | Full CRUD, dashboard, exports, analytics. | `(admin)` routes, `DashboardStats`. |
| **Prestador** | Stylist | Agenda, client details (read-only). | `AgendaHoje`, ficha tabs. |
| **Cliente** | Customer | Chat, booking forms, public landing. | `ChatWidget`, `/api/contact`. |
| **Bot/System** | Automation | Webhooks (n8n), API calls. | `WebhookService`, `sendWebhookAction`. |

## Business Rules & Constraints

- **Validation**: Phones (`formatPhoneUS`, `isValidPhoneUS`), emails, zips (`lib/formatters.ts`).
- **Scheduling**: No overlaps (`/api/slots/GET`); recurring (`Recorrencia`).
- **Lifecycle**: Lead → `Cliente` → alerts (birthday/inactive). Appt: created → confirmed → completed.
- **Security**: `rateLimit`/`middleware.ts`, auth (`getUser`, Supabase RLS), webhook secrets.
- **Realtime**: Supabase subs for chat/agenda.
- **Exports**: Excel/PDF for finances/clients (`lib/export-utils.ts`).
- **Localization**: PT-BR terms, mixed US/BRL formats (Brazil ops?).

For full symbols: See codebase scans (247 symbols, 119 components). Update via `supabase gen types`.

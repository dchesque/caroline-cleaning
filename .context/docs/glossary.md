# Glossary & Domain Concepts

This glossary defines project-specific terminology, domain entities, acronyms, key types/interfaces, user personas, and business rules for the **Carolinas Premium** application—a Next.js 14 (App Router) admin dashboard and client-facing system for salon/spa management. Core features include client management (`Cliente`), appointments (`Agendamento`), finances (`Financeiro`), AI chat (`ChatWidget` with `CarolAgent`), analytics (`DashboardStats`), webhooks (`WebhookService`), AI state machine (`CarolStateMachine`), and business configuration (`BusinessSettings`).

**Tech Stack**: Supabase (auth, PostgreSQL with RLS, realtime), Tailwind CSS + shadcn/ui (`cn`), TypeScript (`types/`), React hooks (`useCarolChat`, `useWebhook`), OpenAI/Anthropic LLMs (`CarolLLM`), n8n automations.

**Cross-references**:
- [Core Types](types/index.ts)
- [Webhook Types](types/webhook.ts)
- [Supabase Schema](types/supabase.ts)
- [Carol AI](lib/ai/carol-agent.ts), [State Machine](lib/ai/state-machine/engine.ts)
- [Business Config](lib/business-config.ts)
- [Utils](lib/utils.ts), [Formatters](lib/formatters.ts)
- [Hooks](hooks/use-carol-chat.ts), [use-webhook.ts](hooks/use-webhook.ts)
- [Logger](lib/logger.ts), [Services](lib/services/)
- [Tracking](lib/tracking/types.ts)

## Type Definitions

Core data models from `types/index.ts`, `types/webhook.ts`, `types/supabase.ts`, `types/carol.ts`, component types, AI, and tracking. Used in Supabase CRUD, API routes (`app/api/*`), components (e.g., `appointment-form.tsx`), hooks, and AI handlers.

| Type/Interface | Description | Source | Example Usage |
|---------------|-------------|--------|--------------|
| **`Addon`** | Service add-on (e.g., tintura). Supports upsells. | [types/index.ts:21](types/index.ts), [components/agenda/types.ts:11](components/agenda/types.ts) | `{ id: 1, nome: 'Tintura', preco: 50 }`<br>`<AddonSection addons={addons} />` |
| **`AddonSelecionado`** | Selected add-on with quantity. | [components/agenda/types.ts:21](components/agenda/types.ts) | `{ addon: Addon, quantidade: 1 }` |
| **`AgendaHoje`** | Daily agenda summary (totals by status). | [types/index.ts:25](types/index.ts) | `{ total: 12, confirmados: 8, pendentes: 4 }`<br>`Dashboard cards` |
| **`Agendamento`** | Appointment: client, service, date/time, status, recurrence. | [types/index.ts:9](types/index.ts) | `{ id: 1, cliente_id: 1, servico: 'Corte', data: '2024-01-01T10:00:00Z', status: 'confirmado' }` |
| **`AgendamentoInsert`** | Create payload (no `id`). | [types/index.ts:10](types/index.ts) | `supabase.from('agendamentos').insert(data)` |
| **`AgendamentoUpdate`** | Partial update (status, date). | [types/index.ts:11](types/index.ts) | `{ status: 'concluido' }`<br>`/api/slots` overlap check` |
| **`AppointmentCreatedPayload`** | New booking webhook. | [types/webhook.ts:90](types/webhook.ts) | `notify(payload)` in n8n |
| **`AppointmentConfirmedPayload`** | Confirmation event. | [types/webhook.ts:108](types/webhook.ts) | SMS via `sendSMS()` |
| **`AppointmentCompletedPayload`** | Checkout trigger. | [types/webhook.ts:118](types/webhook.ts) | Financeiro update |
| **`AppointmentCancelledPayload`** | Cancellation. | [types/webhook.ts:130](types/webhook.ts) | Realtime agenda sync |
| **`AppointmentRescheduledPayload`** | Date/time change. | [types/webhook.ts:143](types/webhook.ts) | Recurrence adjustment |
| **`AppointmentFormData`** | Form state for create/edit. | [components/agenda/types.ts:28](components/agenda/types.ts) | `const { formData } = useAppointmentForm()` |
| **`AreaAtendida`** | Coverage areas (e.g., "Centro"). | [types/index.ts:19](types/index.ts) | `<ClientsFilters areas={areas} />` |
| **`BusinessSettings`** | Config: hours, pricing, areas, services. | [lib/business-config.ts:3](lib/business-config.ts) | `const settings = getBusinessSettingsServer()`<br>`BusinessSettingsProvider` |
| **`CarolConfig`** | AI prompts/config (system instructions). | [lib/ai/prompts.ts:4](lib/ai/prompts.ts) | `buildCarolPrompt(config)` |
| **`CarolState`** | AI conversation state (intent, context). | [lib/ai/state-machine/types.ts:14](lib/ai/state-machine/types.ts) | `CarolStateMachine.process(state)` |
| **`ChatMessage`** | Chat entry (role/content). | [types/carol.ts:3](types/carol.ts) | `{ role: 'user', content: 'Olá!' }`<br>`useCarolChat()` |
| **`ChatMessagePayload`** | Incoming chat webhook. | [types/webhook.ts:39](types/webhook.ts) | n8n → `/api/chat` → `CarolAgent` |
| **`ChatResponse`** | AI reply (text/tools). | [types/carol.ts:11](types/carol.ts), [lib/ai/carol-agent.ts:13](lib/ai/carol-agent.ts) | Streaming via `CarolLLM` |
| **`Cliente`** | Client: name, phone, email, status, birthday. | [types/index.ts:5](types/index.ts) | `<ClientsTable data={clientes} />` |
| **`ClienteInsert`** / **`ClienteUpdate`** | CRUD payloads. | [types/index.ts:6-7](types/index.ts) | `<EditClientModal />` |
| **`ClientBirthdayPayload`** | Birthday reminders. | [types/webhook.ts:202](types/webhook.ts) | Cron `/api/cron/reminders` |
| **`ClientInactiveAlertPayload`** | Inactivity alerts (30 days). | [types/webhook.ts:191](types/webhook.ts) | Re-engagement SMS |
| **`Configuracao`** | App settings (singleton). | [types/index.ts:18](types/index.ts) | Pricing/notifications via `/api/config/public` |
| **`Contrato`** | Contract: duration, price + addons. | [types/index.ts:14](types/index.ts) | Client ficha tab |
| **`DashboardStats`** | KPIs: clients, revenue, appts. | [types/index.ts:26](types/index.ts) | `<StatsCards data={stats} />` |
| **`Database`** | Supabase schema (generated). | [types/supabase.ts:9](types/supabase.ts) | Type-safe `supabase.from()` |
| **`Feedback`** | NPS/feedback post-appt. | [types/index.ts:17](types/index.ts) | `{ score: 9, comment: 'Ótimo!' }` |
| **`FeedbackReceivedPayload`** | New feedback webhook. | [types/webhook.ts:159](types/webhook.ts) | Analytics update |
| **`Financeiro`** | Transactions: payments/expenses/categorias. | [types/index.ts:15](types/index.ts) | `<TransactionForm type="receita" />` |
| **`Json`** | Supabase JSONB for flexible data. | [types/supabase.ts:1](types/supabase.ts) | `chat_metadata: Json` |
| **`LeadCreatedPayload`** / **`LeadUpdatedPayload`** / **`LeadConvertedPayload`** | Lead funnel stages. | [types/webhook.ts:57-80](types/webhook.ts) | Chat → `Cliente` conversion |
| **`LLMCallRecord`** | AI call logs (prompt/response/metrics). | [lib/ai/llm.ts:8](lib/ai/llm.ts) | `CarolLLM.trackCall(record)` |
| **`MensagemChat`** | Stored chat messages (realtime). | [types/index.ts:16](types/index.ts) | `/api/admin/chat-logs/[sessionId]` export |
| **`NotificationTypes`** | Alert categories (e.g., 'appointment_created'). | [types/index.ts:47](types/index.ts) | `notify(type, data)` |
| **`PaymentReceivedPayload`** | Payment confirmation. | [types/webhook.ts:176](types/webhook.ts) | `Financeiro` insert |
| **`PrecoBase`** | Base service price. | [types/index.ts:22](types/index.ts) | Total = base + addons |
| **`ProcessingMetrics`** | State machine perf (tokens, latency). | [lib/ai/state-machine/engine.ts:9](lib/ai/state-machine/engine.ts) | `CarolStateMachine.metrics` |
| **`RateLimitConfig`** | Per-IP limits (chat/flood protection). | [lib/rate-limit.ts:23](lib/rate-limit.ts) | `checkRateLimit(ip, config)` |
| **`Recorrencia`** | Recurring rules (weekly/monthly). | [types/index.ts:13](types/index.ts) | Auto-generates `Agendamento` |
| **`ServicoTipo`** | Services (e.g., "Cabelo"). | [types/index.ts:20](types/index.ts), [components/agenda/types.ts:1](components/agenda/types.ts) | Dropdown in `appointment-form` |
| **`TrackingConfig`** | Analytics config (events/UTM). | [lib/tracking/types.ts:3](lib/tracking/types.ts) | `TrackingProvider` context |
| **`TrackingEventData`** | Event payload (name, user, custom). | [lib/tracking/types.ts:37](lib/tracking/types.ts) | `/api/tracking/event` |
| **`UserProfile`** | Auth user metadata. | [types/index.ts:29](types/index.ts) | Session context |
| **`UserIntent`** | AI-detected intent (e.g., 'book_appointment'). | [lib/ai/state-machine/types.ts:68](lib/ai/state-machine/types.ts) | Handlers like `booking.ts` |
| **`WebhookPayload`** | Union of all webhook events. | [types/webhook.ts:214](types/webhook.ts) | `/api/webhook/n8n` discriminator |
| **`WebhookEventType`** | Event discriminants. | [types/webhook.ts:1](types/webhook.ts) | `'CHAT_MESSAGE' \| 'APPOINTMENT_CREATED' \| ...` |
| **`WebhookResponse`** | API response shape. | [types/webhook.ts:22](types/webhook.ts) | `{ success: true, data?: T }` |
| **`WebhookOptions`** | Send config (timeout/secret). | [types/webhook.ts:29](types/webhook.ts) | `WebhookService.send(event, options)` |

## Classes & Services

| Class/Service | Description | Source | Usage |
|---------------|-------------|--------|-------|
| **`CarolAgent`** | Orchestrates chat: LLM + state machine. | [lib/ai/carol-agent.ts:29](lib/ai/carol-agent.ts) | `const agent = new CarolAgent(); agent.handleMessage(msg)` |
| **`CarolLLM`** | LLM wrapper (OpenAI/Anthropic, streaming). | [lib/ai/llm.ts:386](lib/ai/llm.ts) | `llm.stream(prompt)` with `LLMCallRecord` |
| **`CarolStateMachine`** | FSM for conversations (states/handlers/intents). | [lib/ai/state-machine/engine.ts:60](lib/ai/state-machine/engine.ts) | `machine.process({ state: 'greeting', message })` |
| **`ChatLoggerService`** | Logs sessions/summaries/errors. | [lib/services/chat-logger.ts:109](lib/services/chat-logger.ts) | `logger.logInteraction(params)` |
| **`Logger`** | Structured logging (levels, context). | [lib/logger.ts:11](lib/logger.ts) | `logger.error('msg', { error })` |
| **`WebhookService`** | Sends/receives n8n events. | [lib/services/webhookService.ts:29](lib/services/webhookService.ts) | `service.trigger(event)` |

## Enumerations & Unions

TypeScript unions/literals:

- **Cliente Status**: `'ativo' \| 'inativo' \| 'pendente'`
- **Agendamento Status**: `'pendente' \| 'confirmado' \| 'concluido' \| 'cancelado'`
- **LogLevel** (`Logger`): `'DEBUG' \| 'INFO' \| 'WARN' \| 'ERROR'`
- **NotificationType**: `'appointment_created' \| 'payment_received' \| ...`
- **TrackingEventName**: `'lead_created' \| 'appointment_booked' \| ...` ([lib/tracking/types.ts:73](lib/tracking/types.ts))
- **UserIntent**: `'greeting' \| 'booking' \| 'cancel' \| ...`
- **ViewType** (calendar): `'day' \| 'week' \| 'month'`
- **WebhookEventType**: Discriminated unions (22+ events)

## Core Terms & Components

Domain entities and UI (top imports: `appointment-modal.tsx` 8x, `calendar-view.tsx` 5x).

| Term | Description | Key Files/Components | Usage Example |
|------|-------------|----------------------|--------------|
| **Cliente** | Core entity (ficha with tabs: appts/finance/contract). | `ClientesPage`, `ClienteDetalhePage`, `clients-table.tsx`, `ClientsFilters` | `<ClientsTable />`<br>`<ClientsFilters onChange={setFilters} />` |
| **Agendamento** | Bookings (overlap check `/api/slots`). | `AgendaPage`, `CalendarView`, `appointment-modal.tsx` | `<CalendarView view="week" />`<br>`useAppointmentForm()` |
| **Ficha do Cliente** | Client detail (header + tabs). | `client-header.tsx`, `tab-agendamentos.tsx` | Aggregates related data |
| **Chat** | AI widget (`CarolAgent`, realtime). | `ChatWidget`, `ChatWindow` (3x), `ChatInput`, `useCarolChat` | `<ChatWidget />` on landing/admin |
| **Carol AI** | State machine + LLM for natural booking/cancellations. | `carol-agent.ts`, `state-machine/handlers/*` (e.g., `booking.ts`, `customer.ts`) | Handles intents like phone collection |
| **Financeiro** | Invoices/expenses (categorias, relatorios). | `CategoriasPage`, `transaction-form.tsx`, `category-quick-form.tsx` | `<TransactionForm />`<br>Excel/PDF exports |
| **Analytics** | Funnels, trends, satisfaction. | `ClientesAnalyticsPage`, `analytics/tendencias.tsx` | `<ConversionFunnel data={funnel} />` |
| **Admin UI** | Protected layout (i18n/sidebar). | `AdminLayout`, `AdminHeader`, `AdminI18nProvider` | `(admin)` routes, `ConfigLinkCard` |
| **Landing** | Public pages (chat, pricing). | `AnnouncementBar`, `pricing.tsx`, `chat.tsx` | `<AnnouncementBar />` |
| **Webhooks** | n8n integrations (events/lifecycle). | `webhooks-tabs.tsx` (6x), `/api/webhook/n8n` | Automations for alerts/payments |

## Key Hooks & Utils

**Hooks**:
- `useCarolChat()`: `UseCarolChatReturn` → `{ messages: ChatMessage[], sendMessage }`
- `useWebhook()`: `UseWebhookResult` → Generic notifications
- `useAppointmentForm()`: `AppointmentFormData` + validation
- `useBusinessSettings()`: Reactive `BusinessSettings`

**Utils** (high usage):
- `cn()`: Tailwind class merger ([lib/utils.ts:6](lib/utils.ts))
- Formatters: `formatCurrency()`, `formatPhoneUS()`, `isValidEmail()` ([lib/formatters.ts](lib/formatters.ts))
- Notifications: `notify()`, `notifyOwner()` ([lib/notifications.ts](lib/notifications.ts))
- Rate Limiting: `checkRateLimit(ip)` ([lib/rate-limit.ts](lib/rate-limit.ts))
- Twilio: `sendSMS(phone, msg)`
- Supabase: `createClient()` (server/client)
- AI: `buildCarolPrompt()` ([lib/ai/prompts.ts:16](lib/ai/prompts.ts))
- Exports: `exportToExcel(data)`, chat logs CSV
- Tracking: `trackEvent(name, data)` via context

## Acronyms & Abbreviations

| Acronym | Full Form | Context |
|---------|-----------|---------|
| **n8n** | n8n Automation Tool | Webhooks (`/api/webhook/n8n`) |
| **RLS** | Row Level Security | Supabase policies (admin vs. prestador) |
| **BaaS** | Backend-as-a-Service | Supabase (DB/auth/realtime) |
| **NPS** | Net Promoter Score | `Feedback.score` (0-10) |
| **FSM** | Finite State Machine | `CarolStateMachine` for AI flows |
| **LLM** | Large Language Model | `CarolLLM` (streaming/responses) |

## User Personas

| Persona | Role | Permissions (RLS) | Key Screens |
|---------|------|-------------------|-------------|
| **Admin** | Owner/Manager | Full CRUD, config, analytics, logs | `AdminLayout`, `ConfiguracoesPage`, `chat-logs` |
| **Prestador** | Stylist/Team | Read clients/agenda, update appts | `AgendaPage`, client ficha (limited) |
| **Cliente** | Customer | Chat/booking (public) | `ChatWidget`, landing/pricing |
| **Bot** | Automation | Webhooks/cron/n8n | `WebhookService`, `/api/cron/*` |

## Business Rules & Constraints

- **Validation**: Phone/ZIP/email (`lib/formatters.ts`); form schemas (Zod inferred).
- **Scheduling**: No overlaps (`/api/slots`); `Recorrencia` generates child appts.
- **Lifecycle**: Lead (chat) → `Cliente` → Appt (`pendente`→`concluido`) → `Financeiro`/Feedback.
- **AI Flows**: `CarolStateMachine` handlers (`greeting.ts`, `booking.ts`, etc.); intent extraction.
- **Alerts**: Birthday/inactive via cron/webhooks; owner notifications.
- **Security**: RLS policies, `rateLimit()` (chat/IP), webhook secrets, middleware.
- **Realtime**: Supabase subscriptions (chat/agenda updates).
- **Exports**: Clients/finance/chat-logs (`/api/admin/chat-logs/[id]/export`).
- **Config**: `BusinessSettings` (server/client resolvers); areas/services/pricing.
- **i18n**: PT-BR focus (`AdminI18nProvider`), BRL formats.
- **Tracking**: UTM/events (`lib/tracking/`); GDPR-compliant.
- **Regenerate Types**: `npx supabase gen types typescript --local > types/supabase.ts`.

**Full Exports**: 200+ (e.g., `CalendarView`, `ChatInput`, `CategoriaQuickForm`). See symbol scans for details.

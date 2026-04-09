# Data Flow & Integrations

This document outlines the core data flows in **Carolinas Premium**, a Next.js 14 App Router application using Supabase for persistence, n8n for workflow automation, Carol AI for conversational chat, and an admin dashboard for CRM, scheduling, and finance management. Data enters primarily via chat widgets, admin forms, external webhooks, and API integrations; flows through typed hooks, services, and API routes; persists in Supabase (with realtime subscriptions); and outputs via UI components, exports (Excel/PDF), and notifications.

## Key Principles

- **Server-Side Data Fetching**: Use `createClient` from [`lib/supabase/server.ts`](../lib/supabase/server.ts) in Server Components for secure, efficient queries.
- **Client-Side Interactivity**: Custom hooks (e.g., [`hooks/use-chat.ts`](../hooks/use-chat.ts), [`hooks/use-webhook.ts`](../hooks/use-webhook.ts)) manage state and mutations.
- **Event-Driven Architecture**: n8n triggers webhooks with typed payloads from [`types/webhook.ts`](../types/webhook.ts).
- **Security & Reliability**: Rate-limiting via [`middleware.ts`](../middleware.ts), HMAC validation for webhooks, structured logging with [`lib/logger.ts`](../lib/logger.ts).
- **No Queues/DLQ**: Direct Supabase inserts; handle retries client-side or via n8n.
- **Typing Everywhere**: Leverage [`types/index.ts`](../types/index.ts) (`Cliente`, `Agendamento`, etc.) and [`types/supabase.ts`](../types/supabase.ts) (`Database`).

**Cross-References**:
- [Core Types](../types/index.ts): `Cliente(Insert/Update)`, `Agendamento(Insert/Update)`, `DashboardStats`, `AgendaHoje`.
- [Webhook Types](../types/webhook.ts): `WebhookPayload`, `WebhookEventType`, event-specific interfaces (e.g., `AppointmentCreatedPayload`).
- [API Routes](../app/api/): Chat (`/api/chat`), Webhooks (`/api/webhook/n8n`), Notifications (`/api/notifications/send`), Carol AI (`/api/carol/*`).
- [Hooks](../hooks/): `useChat`, `useWebhook`, `useNotify*`.
- [Services](../lib/services/): `WebhookService`.
- [Utils](../lib/utils.ts), [Formatters](../lib/formatters.ts), [Exports](../lib/export-utils.ts).

## Module Dependencies

```mermaid
graph TD
    ChatWidget[ChatWidget<br/>components/chat/chat-widget.tsx] --> ChatWindow[ChatWindow<br/>components/chat/chat-window.tsx]
    ChatWindow --> ChatMessages[ChatMessages<br/>components/chat/chat-messages.tsx]
    ChatWindow --> ChatInput[ChatInput<br/>components/chat/chat-input.tsx]
    ChatMessages --> MessageBubble[MessageBubble<br/>components/chat/message-bubble.tsx]
    
    CalendarView[CalendarView<br/>components/agenda/calendar-view.tsx] --> DayView[DayView]
    CalendarView -->

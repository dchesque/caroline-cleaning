# Project Rules and Guidelines

> Auto-generated from .context/docs on 2026-04-09T12:40:38.298Z

## README

# Carolinas Premium

[![Next.js](https://img.shields.io/badge/Next.js-14%2B-black.svg?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8.svg?logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-DB%20%2B%20Auth-f03c15.svg?logo=supabase)](https://supabase.com/)
[![Shadcn/UI](https://img.shields.io/badge/shadcn/ui-000000.svg?logo=shadcn)](https://ui.shadcn.com/)

**Carolinas Premium** is a production-ready, full-stack Next.js 14 (App Router) application for managing premium salon/spa services. It features an admin dashboard for clients (`Cliente`), appointments (`Agendamento`), finances (`Financeiro`), analytics, contracts (`Contrato`), chat logs, and configurations. Includes customer-facing landing pages, AI-powered `ChatWidget` via `CarolAgent`, Supabase for auth/DB, n8n webhooks for notifications/SMS, tracking pixels, and export tools.

**Codebase Stats** (183 files analyzed):
- **Components**: 152+ exports (e.g., `CalendarView`, `ChatWidget`)
- **API Routes**: 44 (e.g., `/api/carol/query`, `/api/webhook/n8n`)
- **Utils/Services**: 55+ symbols (e.g., `cn`, `CarolStateMachine`)
- **Types/Interfaces**: 50+ (e.g., `Cliente`, `WebhookPayload`)
- **Hooks**: 12+ (e.g., `useChat`, `useNotifyAppointmentCreated`)
- **Languages**: .tsx (137), .ts (44)
- **Deployment**: Vercel-optimized, Docker, Turbopack

**Top Dependencies**:
- `components/agenda/appointment-modal.tsx` (imported by 8 files)
- `lib/ai/state-machine/handlers/index.ts` (10 importers)
- `components/agenda/calendar-view.tsx` (5 importers)

## 🏗️ Architecture Overview

```
Config (lib/config) → Utils (lib/utils, lib/ai) → Services (lib/services)
    ↓
Controllers (app/api/*, lib/ai/state-machine/handlers)
    ↓
Components (components/*, app/(admin)/(public))
```

- **Config**: Business settings (`BusinessSettings`), webhooks (`getWebhookUrl`).
- **Utils**: Formatters (`formatCurrencyUSD`), tracking (`generateEventId`), AI (`CarolLLM`).
- **Services**: `WebhookService`, `ChatLoggerService`.
- **Controllers**: API routes (e.g., `/api/carol/actions`), state handlers (`customer.ts`, `booking.ts`).
- **Components**: UI layers with Shadcn/Tailwind.

**Key Classes**:
- `CarolAgent` ([lib/ai/carol-agent.ts](lib/ai/carol-agent.ts)): Orchestrates AI chat via `CarolStateMachine`.
- `CarolStateMachine` ([lib/ai/state-machine/engine.ts](lib/ai/state-machine/engine.ts)): Handles intents (`UserIntent`) like booking/cancellation.
- `CarolLLM` ([lib/ai/llm.ts](lib/ai/llm.ts)): OpenAI wrapper with `LLMCallRecord`.
- `WebhookService` ([lib/services/webhookService.ts](lib/services/webhookService.ts)): n8n integration.
- `ChatLoggerService` ([lib/services/chat-logger.ts](lib/services/chat-logger.ts)): Logs sessions (`LogInteractionParams`).

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone <repository-url> carolinas-premium
cd carolinas-premium
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env.local`:
```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# n8n (notifications/SMS)
N8N_WEBHOOK_URL=https://your-n8n.app/webhook/carolinas
N8N_WEBHOOK_SECRET=your-hmac-secret

# AI Chat
OPENAI_API_KEY=sk-...

# Business
BUSINESS_NAME="Carolinas Premium"
BUSINESS_CURRENCY="USD"
```
Run `npm run validate-env`.

### 3. Database
```bash
npm run db:generate  # Regenerates types/supabase.ts
```
Tables: `Cliente`, `Agendamento`, `Financeiro`, `MensagemChat`, `Configuracao`.

### 4. Run Dev Server
```bash
npm run dev  # localhost:3000 (Turbopack)
```
- Landing: `/`
- Admin: `/admin` (Supabase login)
- Chat: `/chat` or embed `ChatWidget`

### 5. Scripts
| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Prod build |
| `npm run lint:fix` | ESLint/Prettier |
| `npm run db:generate` | Supabase types |
| `docker compose up` | App + Supabase stack |

## 📁 Project Structure

```
.
├── app/                    # Pages + API (44 routes)
│   ├── (admin)/admin/      # AgendaPage, ClientesPage, Analytics
│   ├── (auth)/login/       # AuthLayout
│   ├── (public)/           # Landing, Chat, Terms
│   └── api/                # /carol/query, /webhook/n8n, /tracking/event
├── components/             # 152 exports
│   ├── agenda/             # CalendarView, AppointmentForm
│   ├── chat/               # ChatWidget, ChatWindow, ChatInput
│   ├── admin/              # Sidebar, Header
│   └── ui/                 # Shadcn primitives
├── lib/                    # 55+ utils
│   ├── ai/                 # CarolAgent, state-machine/handlers
│   ├── supabase/           # server/client.ts
│   ├── tracking/           # types.ts (TrackingEventName)
│   └── services/           # WebhookService, ChatLoggerService
├── hooks/                  # useChat, use-webhook.ts
├── types/                  # index.ts (Cliente), webhook.ts (15 payloads)
├── docs/                   # architecture.md
├── middleware.ts           # Rate limits (checkRateLimit)
└── next.config.ts
```

## ✨ Core Features

### Domain Models ([types/index.ts](types/index.ts))
```ts
export interface Cliente { id: string; nome: string; email?: string; telefone?: string; }
export interface Agendamento {
  id: string;
  cliente_id: string;
  data: string;
  servico_tipo: ServicoTipo;
  addons?: Addon[];
}
export type ServicoTipo = 'corte' | 'coloracao' | ...;
```

### Utilities ([lib/utils.ts](lib/utils.ts))
```ts
import { cn, formatCurrency } from '@/lib/utils';
import { formatPhoneUS, isValidPhoneUS } from '@/lib/formatters';
cn('p-4', { 'bg-primary': true });  // "p-4 bg-primary"
formatCurrency(1234.56, 'USD');     // "$1,234.56"
```

**AI Core**:
- `buildCarolPrompt` ([lib/ai/prompts.ts](lib/ai/prompts.ts))
- States: `CarolState` ([lib/ai/state-machine/types.ts](lib/ai/state-machine/types.ts))
- Handlers: `booking.ts`, `customer.ts`, `phone.ts`

### Hooks
```ts
// Chat
const { messages, append } = useChat();  // hooks/use-chat.ts

// Webhooks (12+)
const notifyAppointmentCreated = useNotifyAppointmentCreated();
notifyAppointmentCreated({ agendamento, cliente });
```

### Key Components
| Component | Path | Importers |
|-----------|------|-----------|
| `CalendarView` | `components/agenda/calendar-view.tsx` | 5 |
| `ChatWidget` | `components/chat/chat-widget.tsx` | 3+ |
| `ClientsFilters` | `components/clientes/clients-filters.tsx` | Table |
| `AppointmentForm` | `components/agenda/appointment-form` | Modal |

### API Endpoints
| Endpoint | Payload | Purpose |
|----------|---------|---------|
| `POST /api/carol/query` | `{ query: string }` | AI state query |
| `POST /api/webhook/n8n` | `WebhookPayload` | n8n events (15 types) |
| `POST /api/chat` | `ChatMessage[]` | OpenAI proxy |
| `POST /api/tracking/event` | `TrackingEventData` | Analytics |

**Webhook Payloads** ([types/webhook.ts](types/webhook.ts)):
```ts
interface AppointmentCreatedPayload {
  event: 'APPOINTMENT_CREATED';
  agendamento: Agendamento;
  cliente: Cliente;
}
```

## 🔗 Integrations
- **Supabase**: Auth, DB (RLS), types auto-generated.
- **n8n**: Webhooks (`WebhookEventType`), SMS via Twilio (`sendSMS`).
- **OpenAI**: `CarolLLM` for chat.
- **Tracking**: UTM, events (`TrackingEventName.LEAD_CREATED`).

## 🤝 Contributing
1. Branch: `feat/your-feature`
2. Lint: `npm run lint:fix`
3. Test: `/admin/agenda`, ChatWidget, webhooks.
4. PR: Update types, reference exports (e.g., `CarolStateMachine`).

**Conventions**: English code/exports; Portuguese domain (e.g., `Agendamento`); Strict TS.

## 🔒 Production
- **Security**: Rate limits (`middleware.ts`), HMAC webhooks, RLS.
- **Monitoring**: `Logger`, chat logs (`/admin/chat-logs`), analytics.
- **Deploy**: Vercel (env vars), Docker.

**Symbol Search**: 284+ exports (e.g., `useCarolChatReturn`). See [Symbol Index](docs/symbols.md) for full list.


# Carolinas Premium

[![Next.js](https://img.shields.io/badge/Next.js-14%2B-black.svg?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8.svg?logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-DB%20%2B%20Auth-f03c15.svg?logo=supabase)](https://supabase.com/)
[![Shadcn/UI](https://img.shields.io/badge/shadcn/ui-000000.svg?logo=shadcn)](https://ui.shadcn.com/)

**Carolinas Premium** is a production-ready, full-stack Next.js 14 (App Router) application for managing premium salon/spa services. It includes an admin dashboard for managing clients (`Cliente`), appointments (`Agendamento`), finances (`Financeiro`), analytics, contracts (`Contrato`), feedback, chat widgets, and configurations. Features customer-facing landing pages, AI-powered `ChatWidget`, Supabase for auth/DB, n8n webhooks for notifications, tracking, and export utilities.

**Codebase Stats**:
- **Files**: 183 | **Components**: 152 symbols | **API Routes**: 44 | **Utils**: 55 symbols | **Services**: 2 | **Hooks**: 12+ | **Types**: 50+
- **Languages**: .tsx (137), .ts (44)
- **Deployment**: Vercel-optimized, Docker, Turbopack dev server
- **Top Dependencies**: `components/agenda/appointment-modal.tsx` (imported by 8 files), `components/agenda/calendar-view.tsx` (5 files)

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone <repository-url> carolinas-premium
cd carolinas-premium
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env.local` and configure:
```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# n8n Webhooks (required for notifications)
N8N_WEBHOOK_URL=https://your-n8n.app/webhook/carolinas
N8N_WEBHOOK_SECRET=your-hmac-secret

# Optional: OpenAI for ChatWidget
OPENAI_API_KEY=sk-...

# Business Config
BUSINESS_NAME="Carolinas Premium"
BUSINESS_CURRENCY="USD"
```
Validate with `npm run validate-env` ([lib/env.ts](lib/env.ts#L20)).

### 3. Database Setup
```bash
npm run db:generate  # Generates types/supabase.ts from Supabase schema
```
Schema includes tables: `Cliente`, `Agendamento`, `Financeiro`, `Contrato`, `Configuracao`, `AreaAtendida`.

### 4. Development Server
```bash
npm run dev  # http://localhost:3000 (Turbopack + HMR)
```
- Landing: [/](http://localhost:3000)
- Admin Dashboard: [/admin](http://localhost:3000/admin) (Supabase auth required)
- API Health: [/api/health](http://localhost:3000/api/health)

### 5. NPM Scripts
| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint:fix` | ESLint + Prettier |
| `npm run db:generate` | Update Supabase types |
| `npm run validate-env` | Check required env vars |
| `docker compose up` | Local stack (app + Supabase) |

## 📁 Project Structure

```
carolinas-premium/
├── app/                          # App Router (pages + 44 API routes)
│   ├── (admin)/                  # AdminLayout (@ app/(admin)/layout.tsx)
│   │   └── admin/                # AgendaPage, ClientesPage, ConfiguracoesPage, etc.
│   ├── (auth)/                   # AuthLayout (@ app/(auth)/layout.tsx)
│   ├── api/                      # /api/chat/route.ts, /api/webhook/n8n/route.ts, /api/tracking/event/route.ts
│   └── layout.tsx                # Root providers (BusinessSettingsProvider, i18n)
├── components/ (152 symbols)     # Shadcn/UI + custom Tailwind components
│   ├── agenda/                   # CalendarView (@ components/agenda/calendar-view.tsx), AppointmentModal
│   ├── chat/                     # ChatWidget (@ components/chat/chat-widget.tsx), ChatWindow, ChatInput
│   ├── clientes/                 # ClientsTable, ClientsFilters (@ components/clientes/clients-filters.tsx)
│   ├── financeiro/               # TransactionForm (@ components/financeiro/transaction-form.tsx), CategoryQuickForm
│   ├── landing/                  # AnnouncementBar, AboutUs (@ components/landing/about-us.tsx)
│   └── tracking/                 # TrackingProvider
├── hooks/                        # Custom React hooks
│   ├── use-chat.ts               # useChat() → { messages: ChatMessage[], append }
│   └── use-webhook.ts            # useNotifyAppointmentCreated(), 12+ notifiers
├── lib/ (55+ utils)              # Core utilities, services, config
│   ├── utils.ts                  # cn(), formatCurrency(), formatDate()
│   ├── formatters.ts             # formatPhoneUS(), parseCurrency()
│   ├── supabase/                 # createClient() (@ lib/supabase/server.ts & client.ts)
│   ├── config/                   # webhooks.ts (getWebhookUrl(), getWebhookSecret())
│   ├── business-config.ts        # BusinessSettings, getBusinessSettingsServer()
│   ├── services/                 # WebhookService (@ lib/services/webhookService.ts)
│   └── tracking/                 # generateEventId(), getUtmParams()
├── types/                        # Domain types + Supabase
│   ├── index.ts                  # Cliente, Agendamento, DashboardStats (29+ exports)
│   └── webhook.ts                # WebhookEventType, AppointmentCreatedPayload (15+ payloads)
├── docs/                         # README.md, architecture.md, glossary.md
├── public/                       # Static assets
├── middleware.ts                 # rateLimit(), session auth
└── next.config.ts                # Turbopack, images
```

## ✨ Core Features

### Domain Models ([types/index.ts](types/index.ts))
Core Supabase types (Portuguese domain terms):
```ts
export interface Cliente { id: string; nome: string; email?: string; telefone?: string; }
export interface ClienteInsert { nome: string; /* ... */ }
export interface Agendamento {
  id: string;
  cliente_id: string;
  data: string;
  servico_tipo: ServicoTipo;
  addons?: Addon[];
}
export interface DashboardStats {
  clientes: number;
  agendamentos: number;
  receita: number;
}
```

### Utilities ([lib/utils.ts](lib/utils.ts), [lib/formatters.ts](lib/formatters.ts))
```ts
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { formatPhoneUS, formatCurrencyUSD, parseCurrency, isValidPhoneUS } from '@/lib/formatters';

cn('flex gap-2 p-4', { 'bg-primary/10': isActive });  // ClassName merge
formatPhoneUS('(123)456-7890');  // "(123) 456-7890"
formatCurrencyUSD(1234.56);  // "$1,234.56"
parseCurrency('$1,234.56');  // 1234.56
```

**Exports** ([lib/export-utils.ts](lib/export-utils.ts)):
```ts
import { exportToExcel, exportToPDF } from '@/lib/export-utils';
exportToExcel(clientsData, 'clientes.xlsx');  // XLSX download
exportToPDF(invoiceData, 'fatura.pdf');       // PDF generation
```

### Hooks
- **Chat** ([hooks/use-chat.ts](hooks/use-chat.ts)):
  ```ts
  const { messages, append, reload, isLoading } = useChat();
  // messages: ChatMessage[] (role: 'user' | 'assistant', content: string)
  append({ role: 'user', content: 'Olá!' });
  ```
- **Webhooks** ([hooks/use-webhook.ts](hooks/use-webhook.ts)):
  ```ts
  const notifyAppointmentCreated = useNotifyAppointmentCreated();
  notifyAppointmentCreated({ agendamento, cliente });  // Sends to n8n
  // Other: useNotifyAppointmentCancelled(), useNotifyClientBirthday(), etc.
  ```

### Key Components (Top Exports)
| Export | Path | Usage |
|--------|------|-------|
| `CalendarView` | [components/agenda/calendar-view.tsx](components/agenda/calendar-view.tsx) | `<CalendarView viewType="day" onSelectSlot={handleBook} />` (5 importers) |
| `ChatWidget` | [components/chat/chat-widget.tsx](components/chat/chat-widget.tsx) | Embed on landing: `<ChatWidget />` (AI chat, 2 importers) |
| `ClientsFilters` | [components/clientes/clients-filters.tsx](components/clientes/clients-filters.tsx) | Filter clients table |
| `TransactionForm` | [components/financeiro/transaction-form.tsx](components/financeiro/transaction-form.tsx) | Income/expense CRUD (2 importers) |
| `AnnouncementBar` | [components/landing/announcement-bar.tsx](components/landing/announcement-bar.tsx) | Marketing banner |

### API Routes (Key Endpoints)
| Endpoint | Method | Type/Payload | Auth |
|----------|--------|--------------|------|
| `/api/chat` | POST | `ChatRequest` | None (OpenAI proxy) |
| `/api/webhook/n8n` | POST | `IncomingWebhookPayload` | HMAC secret |
| `/api/tracking/event` | POST | `EventPayload` (UTM, custom data) | None |
| `/api/notifications/send` | POST | `NotificationPayload` | Server |
| `/api/carol/query` | POST | `QueryPayload` (`QueryType`) | Server |
| `/api/health` | GET | - | None |

**Webhook Payloads** ([types/webhook.ts](types/webhook.ts)):
```ts
export interface AppointmentCreatedPayload {
  event: WebhookEventType.AppointmentCreated;
  agendamento: Agendamento;
  cliente: Cliente;
}
// 15+ types: ClientBirthdayPayload, PaymentReceivedPayload, etc.
```

### Integrations & Services
- **Supabase**: Dual clients ([lib/supabase/server.ts](lib/supabase/server.ts), [client.ts](lib/supabase/client.ts)); RLS enforced.
- **n8n Webhooks**: Config via ([lib/config/webhooks.ts](lib/config/webhooks.ts)) – `getWebhookUrl()`, `isWebhookConfigured()`.
- **Tracking**: ([lib/tracking/types.ts](lib/tracking/types.ts)) – `TrackingEventName`, UTM parsing, Facebook cookies.
- **Business Settings**: ([lib/business-config.ts](lib/business-config.ts)) – `BusinessSettingsProvider`, dynamic config by `grupo`.
- **Middleware**: Rate limiting ([middleware.ts](middleware.ts#L9)), session updates.
- **Logger**: `Logger` class ([lib/logger.ts](lib/logger.ts)).

## 📖 Further Reading
- **[Architecture](docs/architecture.md)**: Layers (Controllers:50, Repositories:3), data flow.
- **[Glossary](docs/glossary.md)**: `Agendamento`, `ServicoTipo`, `Addon`.
- **[Deployment](docs/deploy.md)**: Vercel, Docker Compose.
- **[Security](docs/security.md)**: RLS policies, webhook secrets, rate limits.

## 🤝 Contributing
1. `git checkout -b feat/your-feature`
2. Implement + `npm run lint:fix`
3. Test: Admin (/admin/agenda, /admin/clientes), ChatWidget, exports.
4. PR: Reference symbols (e.g., `useChat`), update changelog.md if breaking.
5. **Conventions**: English code; Portuguese domain (e.g., `Cliente`); strict TS.

**Search Tips**: Use IDE "Go to Symbol" (284+ total) or `grep -r "useNotifyAppointment" .`.

## 🔒 Production Notes
- **Auth**: Supabase + custom middleware.
- **Secrets**: Use `SUPABASE_SERVICE_ROLE_KEY` sparingly (server-only).
- **Monitoring**: Webhooks, tracking events, `Logger`.
- **Generated**: Analyzed from 183 files, 284 symbols. Report issues!

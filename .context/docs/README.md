# Carolinas Premium

[![Next.js](https://img.shields.io/badge/Next.js-14%2B-black.svg?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8.svg?logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-DB%20%2B%20Auth-f03c15.svg?logo=supabase)](https://supabase.com/)

**Carolinas Premium** is a full-stack Next.js application for managing premium salon/spa services. It features an admin dashboard for clients (`Cliente`), appointments (`Agendamento`), finances (`Financeiro`), analytics, and contracts (`Contrato`), alongside customer-facing landing pages, AI chat (`ChatWidget`), and integrations with Supabase and n8n webhooks.

- **Files**: 156 | **Symbols**: 247 (119 components, 40 controllers/API routes, 31 utils)
- **Languages**: TypeScript (.ts/.tsx), minor .mjs
- **Deployment**: Vercel-ready (App Router), Docker support

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
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Webhooks (n8n)
N8N_WEBHOOK_SECRET=your-secret
N8N_WEBHOOK_URL=https://your-n8n.app/webhook/carolinas

# Optional: OpenAI for chat
OPENAI_API_KEY=sk-...

# Exports/Stripe (if enabled)
STRIPE_SECRET_KEY=sk_test_...
```
Validate: `npm run validate-env` ([lib/env.ts](lib/env.ts)).

### 3. Run Development Server
```bash
npm run dev
```
- Landing: [http://localhost:3000](http://localhost:3000)
- Admin: [http://localhost:3000/admin](http://localhost:3000/admin) (login required)

### 4. Build & Production
```bash
npm run build
npm start
```

### Key Scripts
| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | ESLint + Prettier |
| `npm run lint:fix` | Auto-fix linting |
| `npm run db:generate` | Regenerate Supabase types ([types/supabase.ts](types/supabase.ts)) |
| `npm run validate-env` | Check required env vars |
| `docker compose up` | Local Supabase + app |

## 📁 Repository Structure

```
carolinas-premium/
├── app/                    # Next.js 14 App Router
│   ├── (admin)/            # Protected admin ([AdminLayout](app/(admin)/layout.tsx))
│   │   └── admin/          # Pages: ClientesPage, AgendaPage, Analytics
│   ├── (auth)/             # Auth pages ([AuthLayout](app/(auth)/layout.tsx))
│   ├── api/                # API routes
│   │   ├── chat/route.ts   # POST /api/chat ([useChat](hooks/use-chat.ts))
│   │   ├── webhook/n8n/    # POST /api/webhook/n8n (n8n events)
│   │   └── notifications/  # POST /api/notifications/send
│   └── layout.tsx          # Root layout
├── components/             # 119 React components (Shadcn/UI + Tailwind)
│   ├── admin/              # AdminHeader, AdminLayout
│   ├── agenda/             # CalendarView (imported 4x), WeekView, DayView
│   ├── analytics/          # TrendsChart, ConversionFunnel, DashboardStats
│   ├── chat/               # ChatWidget, ChatWindow (imported 3x), MessageBubble
│   ├── clientes/           # ClientsTable, ClientsFilters
│   ├── cliente-ficha/      # Client detail tabs (Info, Financeiro, Agendamentos)
│   ├── financeiro/         # TransactionForm, ExpenseCategories
│   └── landing/            # AboutUs, AnnouncementBar, FAQ, Pricing
├── hooks/                  # Custom hooks
│   ├── use-chat.ts         # useChat, ChatMessage
│   └── use-webhook.ts      # useNotifyAppointmentCreated, etc.
├── lib/                    # 31 utilities
│   ├── utils.ts            # cn (clsx/twm), formatCurrency
│   ├── formatters.ts       # formatPhoneUS, formatCurrencyUSD
│   ├── supabase/           # createClient (server/client)
│   ├── export-utils.ts     # exportToExcel, exportToPDF
│   └── config/webhooks.ts  # getWebhookSecret, getWebhookUrl
├── types/                  # Shared TypeScript types
│   ├── index.ts            # Cliente, Agendamento, DashboardStats
│   └── webhook.ts          # WebhookPayloads (AppointmentCreatedPayload, etc.)
├── docs/                   # Documentation (this folder)
├── public/                 # Static assets (logos, images)
├── prompts/                # AI chat system prompts
└── ...                     # Config: next.config.ts, middleware.ts, tsconfig.json
```

## ✨ Key Features & Public API

### Core Types ([types/index.ts](types/index.ts))
```ts
export interface Cliente { id: string; nome: string; /* ... */ }
export interface Agendamento { id: string; cliente_id: string; data: Date; /* ... */ }
export type DashboardStats = { clientes: number; agendamentos: number; receita: number };
```

### Utilities ([lib/utils.ts](lib/utils.ts), [lib/formatters.ts](lib/formatters.ts))
```ts
import { cn } from '@/lib/utils';  // Tailwind class merger
import { formatCurrency } from '@/lib/utils';  // $1,234.56
import { formatPhoneUS } from '@/lib/formatters';  // (123) 456-7890

const formatted = formatCurrency(1234.56);  // "$1,234.56"
```

### Hooks
- `useChat` ([hooks/use-chat.ts](hooks/use-chat.ts)): AI chat state/messages.
- `useWebhook` ([hooks/use-webhook.ts](hooks/use-webhook.ts)): Notifications like `useNotifyAppointmentCreated(payload)`.

### Components
- `ChatWidget` ([components/chat/chat-widget.tsx](components/chat/chat-widget.tsx)): Embeddable chat.
- `ClientsFilters` + `ClientsTable` ([components/clientes/](components/clientes/)): Client management.
- `CalendarView` ([components/agenda/calendar-view.tsx](components/agenda/calendar-view.tsx)): Agenda (multi-view).

### API Routes
| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/chat` | POST | Send chat message | None |
| `/api/webhook/n8n` | POST | n8n events (verified via [getWebhookSecret](lib/config/webhooks.ts)) | Secret |
| `/api/notifications/send` | POST | Push notifications | Admin |
| `/api/slots` | GET | Available slots | None |

**Exports**: [lib/export-utils.ts](lib/export-utils.ts)
```ts
import { exportToExcel } from '@/lib/export-utils';
exportToExcel(data, 'clientes.xlsx');  // Browser download
```

### Integrations
- **Supabase**: Auth/DB ([lib/supabase/](lib/supabase/)), types auto-generated.
- **n8n Webhooks**: Events like `AppointmentCreatedPayload` → notifications.
- **Chat AI**: OpenAI-powered ([app/api/chat/route.ts](app/api/chat/route.ts)).
- **Middleware**: Rate limiting ([middleware.ts](middleware.ts)).

## 📖 Documentation Guides

| Guide | Description |
|-------|-------------|
| [Project Overview](docs/project-overview.md) | Features, roadmap, personas |
| [Architecture](docs/architecture.md) | Layers, data flow diagrams |
| [Development Workflow](docs/development-workflow.md) | Git, CI/CD, PRs |
| [Domain Glossary](docs/glossary.md) | Cliente, Agendamento, webhook payloads |
| [Security](docs/security.md) | RLS, secrets, rate limits |
| [Deploy](docs/deploy.md) | Vercel, Docker, Easypanel |

## 🤝 Contributing

1. Branch: `feat/admin-analytics`, PR to `main`.
2. Lint: `npm run lint:fix`.
3. Test changes: Focus on no-regression for admin/client flows.
4. Update [changelog.md](changelog.md) for releases.
5. Domain terms: Portuguese (`Cliente`, `Agendamento`).

Search codebase: `grep -r "useChat" .` or use IDE symbols.

## 🔒 Security & Production Notes

- **Auth**: Supabase RLS + middleware checks.
- **Rate Limits**: [middleware.ts](middleware.ts) → `rateLimit`.
- **Secrets**: Never commit `.env`; use Vercel dashboard.
- **Health Check**: `GET /api/health`.

**Last Updated**: October 2024 | **Generated from 156 files, 247 symbols**. Questions? Open an issue!

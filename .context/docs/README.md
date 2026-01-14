# Carolinas Premium

[![Next.js](https://img.shields.io/badge/Next.js-14%2B-black.svg?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8.svg?logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-DB%20%2B%20Auth-f03c15.svg?logo=supabase)](https://supabase.com/)
[![Shadcn/UI](https://img.shields.io/badge/shadcn/ui-000000.svg?logo=shadcn)](https://ui.shadcn.com/)

**Carolinas Premium** is a production-ready, full-stack Next.js 14 (App Router) application for managing premium salon/spa services. It features an admin dashboard for clients (`Cliente`), appointments (`Agendamento`), finances (`Financeiro`), analytics, contracts (`Contrato`), feedback, and configurations. Includes customer-facing landing pages, AI-powered chat widget (`ChatWidget`), Supabase auth/DB, n8n webhooks for notifications, and export tools.

- **Files**: 183 | **Components**: 139 | **API Routes**: 44 | **Utils**: 43 | **Services**: 2
- **Languages**: .tsx (137), .ts (44), .mjs (2)
- **Deployment**: Vercel-optimized, Docker, Turbopack dev server

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

# n8n Webhooks (required for notifications)
N8N_WEBHOOK_URL=https://your-n8n.app/webhook/carolinas
N8N_WEBHOOK_SECRET=your-hmac-secret

# Optional: OpenAI for ChatWidget
OPENAI_API_KEY=sk-...

# Optional: Business Config
BUSINESS_NAME="Carolinas Premium"
BUSINESS_CURRENCY="USD"
```
Run `npm run validate-env` to check ([lib/env.ts](lib/env.ts#L20)).

### 3. Database Setup
```bash
npm run db:generate  # Generate types/supabase.ts
```
Uses Supabase for auth, RLS, and schema (`Cliente`, `Agendamento`, etc.).

### 4. Development Server
```bash
npm run dev  # http://localhost:3000 (Turbopack + HMR)
```
- Landing: [/](http://localhost:3000)
- Admin: [/admin](http://localhost:3000/admin) (Supabase auth)
- API Health: [/api/health](http://localhost:3000/api/health)

### 5. Scripts
| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint:fix` | Lint + format |
| `npm run db:generate` | Update Supabase types |
| `docker compose up` | Local stack (app + Supabase) |

## 📁 Project Structure

```
carolinas-premium/
├── app/                          # App Router: pages + 44 API routes
│   ├── (admin)/                  # AdminLayout ([layout.tsx](app/(admin)/layout.tsx))
│   │   └── admin/                # AgendaPage, ClientesPage, CategoriasPage
│   ├── (auth)/                   # AuthLayout ([layout.tsx](app/(auth)/layout.tsx))
│   ├── api/                      # /api/chat, /api/webhook/n8n, /api/slots
│   └── layout.tsx                # Root: providers, i18n
├── components/ (139)             # Shadcn/UI + Tailwind
│   ├── agenda/                   # CalendarView (5 imports), AppointmentModal (8 imports)
│   ├── chat/                     # ChatWidget (2 imports), ChatWindow (3 imports)
│   ├── clientes/                 # ClientsTable, ClientsFilters
│   ├── cliente-ficha/            # TabAgendamentos, TabFinanceiro
│   ├── financeiro/               # TransactionForm (2 imports), ExpenseCategories
│   └── landing/                  # AnnouncementBar, AboutUs
├── hooks/                        # useChat, useWebhook notifiers
├── lib/ (43 utils)               # cn, formatters, supabase clients, webhooks
│   ├── actions/                  # auth.ts (getUser, signOut)
│   ├── config/                   # webhooks.ts (getWebhookSecret)
│   ├── supabase/                 # server.ts, client.ts (createClient)
│   └── services/                 # WebhookService
├── types/                        # Cliente, Agendamento, WebhookPayloads
│   ├── index.ts                  # Core domain types
│   └── webhook.ts                # 12+ event payloads
├── docs/                         # This README, architecture.md
├── public/                       # Assets
└── ...                           # next.config.ts, middleware.ts (rateLimit)
```

**Top Imports**:
- `components/agenda/appointment-modal.tsx` (8 files)
- `components/agenda/calendar-view.tsx` (5 files)
- `components/chat/chat-window.tsx` (3 files)

## ✨ Core Features

### Domain Types ([types/index.ts](types/index.ts))
```ts
export interface Cliente { id: string; nome: string; email?: string; telefone?: string; }
export interface Agendamento {
  id: string;
  cliente_id: string;
  data: string;
  servico_tipo: ServicoTipo;
  addons?: Addon[];
}
export interface DashboardStats { clientes: number; agendamentos: number; receita: number; }
```

### Utilities
```ts
// lib/utils.ts, lib/formatters.ts
import { cn, formatCurrency } from '@/lib/utils';
import { formatPhoneUS, formatCurrencyUSD, parseCurrency } from '@/lib/formatters';

cn('flex gap-2 p-4', 'bg-primary/10');  // Tailwind merge
formatPhoneUS('1234567890');  // "(123) 456-7890"
formatCurrencyUSD(1234.56, true);  // "$1,234.56"
```

**Exports** ([lib/export-utils.ts](lib/export-utils.ts)):
```ts
import { exportToExcel, exportToPDF } from '@/lib/export-utils';
exportToExcel(data, 'clientes.xlsx');  // Browser download
```

### Hooks
- **Chat** ([hooks/use-chat.ts](hooks/use-chat.ts)):
  ```ts
  const { messages, append, reload } = useChat();
  // messages: ChatMessage[]
  ```
- **Webhooks** ([hooks/use-webhook.ts](hooks/use-webhook.ts)):
  ```ts
  const notifyAppointmentCreated = useNotifyAppointmentCreated();
  notifyAppointmentCreated({ agendamento: agendamentoData });
  // 12+ notifiers: AppointmentCancelledPayload, ClientBirthdayPayload, etc.
  ```

### Components (Key Exports)
| Export | Path | Notes |
|--------|------|-------|
| `ChatWidget` | [components/chat/chat-widget.tsx](components/chat/chat-widget.tsx) | Embeddable AI chat |
| `CalendarView` | [components/agenda/calendar-view.tsx](components/agenda/calendar-view.tsx) | Day/Week views |
| `ClientsFilters` | [components/clientes/clients-filters.tsx](components/clientes/clients-filters.tsx) | Filter `ClientsTable` |
| `TransactionForm` | [components/financeiro/transaction-form.tsx](components/financeiro/transaction-form.tsx) | Income/expenses |
| `AnnouncementBar` | [components/landing/announcement-bar.tsx](components/landing/announcement-bar.tsx) | Marketing banner |

### API Routes
| Endpoint | Method | Payload/Type | Auth |
|----------|--------|--------------|------|
| `/api/chat` | POST | `ChatRequest` | None |
| `/api/webhook/n8n` | POST | `IncomingWebhookPayload` | HMAC ([getWebhookSecret](lib/config/webhooks.ts)) |
| `/api/slots` | GET | - | None |
| `/api/financeiro/categorias/[id]` | DELETE | - | Admin |
| `/api/health` | GET | - | None |

**Webhook Payloads** ([types/webhook.ts](types/webhook.ts)):
```ts
export interface AppointmentCreatedPayload {
  agendamento: Agendamento;
  cliente: Cliente;
}
```

### Integrations
- **Supabase**: [createClient](lib/supabase/server.ts) (server/client), auto-types ([types/supabase.ts](types/supabase.ts))
- **n8n**: Events like `WebhookEventType.AppointmentCreated`
- **AI**: OpenAI via `/api/chat`
- **Middleware**: [rateLimit](middleware.ts#L9), session auth

## 📖 Further Reading
- [Architecture](docs/architecture.md): Layers, data flow
- [Glossary](docs/glossary.md): `Cliente`, `ServicoTipo`
- [Deployment](docs/deploy.md): Vercel/Docker
- [Security](docs/security.md): RLS, secrets

## 🤝 Contributing
1. `git checkout -b feat/your-feature`
2. `npm run lint:fix`
3. Test: Admin agenda/clients, chat widget
4. PR: Update changelog.md if breaking
5. Code: English; Domain: Portuguese (`Agendamento`)

**Search**: IDE "Go to Symbol" (284 total) or `grep -r "useChat" .`

## 🔒 Production Notes
- **Auth**: Supabase + [lib/actions/auth.ts](lib/actions/auth.ts) (`getUser`)
- **Logging**: [Logger](lib/logger.ts)
- **Limits**: [middleware.ts](middleware.ts)
- Validate: `npm run validate-env`

**Generated**: From 183 files, 284 symbols. [Issues](https://github.com/your-repo/issues).

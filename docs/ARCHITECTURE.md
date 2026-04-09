# Architecture - Chesque Premium Cleaning

**Purpose**: System design, technology stack, and request flow  
**Last Updated**: April 2026

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Request Flow](#request-flow)
4. [Project Structure](#project-structure)
5. [Architectural Layers](#architectural-layers)
6. [Design Patterns](#design-patterns)
7. [Data Flow](#data-flow)

---

## System Overview

**Chesque Premium Cleaning** is a **monolithic Next.js 15 application** that combines:

- **Carol AI**: 24/7 automated customer service (LLM-powered chat)
- **Landing Page**: Lead capture with embedded chat widget
- **Admin Panel**: CRM, scheduling, contracts, and financials
- **Webhooks**: n8n integration for complex automations
- **Notifications**: SMS/WhatsApp via Twilio
- **Analytics**: Customer funnels, revenue tracking, satisfaction metrics

**Deployment**: Single Docker artifact (monolithic) deployed on Easypanel/Coolify or Vercel.

---

## Technology Stack

### Frontend Layer
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | Next.js 15 (App Router) | Full-stack React with server components |
| **Language** | TypeScript | Type-safe development |
| **Styling** | Tailwind CSS v4 | Utility-first CSS |
| **Components** | shadcn/ui + Radix UI | Accessible, pre-built UI components |
| **Icons** | Lucide React | SVG icon library |
| **Charts** | Recharts | Analytics visualizations |

### Backend Layer
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **API Routes** | Next.js Route Handlers | RESTful endpoints & webhooks |
| **Server Actions** | Next.js Server Actions | Secure form mutations |
| **Validation** | Zod | Type-safe input validation |
| **Authentication** | Supabase Auth | JWT-based admin login |

### Database Layer
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Database** | PostgreSQL (Supabase) | Main datastore |
| **ORM** | Supabase JS Client | Query builder |
| **Realtime** | Supabase Realtime | Live updates (subscriptions) |
| **Migrations** | Custom SQL scripts | Schema versioning |

### External Integrations
| Service | Purpose | Config |
|---------|---------|--------|
| **OpenRouter API** | LLM gateway for Carol AI | `OPENROUTER_API_KEY` |
| **Twilio** | SMS/WhatsApp notifications | `TWILIO_*` env vars |
| **n8n** | Workflow automation (webhooks) | `N8N_WEBHOOK_*` env vars |
| **Google Analytics** | Traffic & conversion tracking | `NEXT_PUBLIC_GA_ID` |
| **Sentry** | Error tracking & monitoring | `SENTRY_DSN` |

---

## Request Flow

### Public Visitor → Landing Page

```
Browser Request (http://localhost:3000)
    ↓
middleware.ts (rateLimit, session)
    ↓
app/(public)/layout.tsx (SSR)
    ↓
page.tsx (Hero, Services, Chat Widget)
    ↓
ChatWidget Component (embeds /chat iframe)
    ↓
User types message → /api/chat (POST)
```

**Example**: Visitor lands on homepage → clicks "Schedule a Visit" → Chat widget opens → Carol AI responds

### Chat Message Flow

```
ChatWidget (Client)
    ↓ POST /api/chat
    ↓ Validate with Zod
    ↓
Carol AI Service (/api/carol/query)
    ↓ OpenRouter API Call
    ↓
LLM Response (anthropic/claude-3.5-sonnet)
    ↓
/api/webhook/n8n (if action triggered)
    ↓
n8n Workflow (booking, notifications)
    ↓
Supabase (store lead/appointment)
    ↓
Twilio (SMS notification)
    ↓ Realtime subscription
    ↓
Admin Panel (Dashboard updates live)
```

### Admin → Data Mutation

```
Admin Panel (App Component)
    ↓
useWebhook* Hook (e.g., useNotifyAppointmentCreated)
    ↓ Server Action (sendWebhookAction)
    ↓
Supabase (Insert/Update)
    ↓
Webhook trigger
    ↓
n8n Workflow (downstream processes)
    ↓
Twilio (notifications)
    ↓
Supabase Realtime (update all subscribed clients)
```

---

## Project Structure

```
caroline-cleaning/
├── app/                          # Next.js App Router
│   ├── (public)/                 # Public pages (no sidebar)
│   │   ├── page.tsx              # Landing page (/)
│   │   ├── chat/page.tsx         # Fullscreen chat (/chat)
│   │   ├── privacy/page.tsx      # Privacy policy
│   │   └── terms/page.tsx        # Terms of service
│   │
│   ├── (auth)/                   # Auth pages
│   │   ├── login/page.tsx        # Login form (/login)
│   │   └── layout.tsx            # Auth layout
│   │
│   ├── (admin)/                  # Protected admin pages
│   │   └── admin/
│   │       ├── page.tsx          # Admin dashboard (/admin)
│   │       ├── agenda/           # Scheduling module
│   │       ├── clientes/         # CRM module
│   │       ├── contratos/        # Digital contracts
│   │       ├── financeiro/       # Financial tracking
│   │       ├── analytics/        # Reports & analytics
│   │       ├── configuracoes/    # Settings
│   │       ├── equipe/           # Team management
│   │       └── layout.tsx        # Admin sidebar layout
│   │
│   ├── api/                      # API routes
│   │   ├── chat/route.ts         # POST /api/chat (Carol)
│   │   ├── carol/                # Carol AI endpoints
│   │   │   ├── query/route.ts    # POST /api/carol/query
│   │   │   └── actions/route.ts  # POST /api/carol/actions
│   │   ├── webhook/n8n/route.ts  # POST /api/webhook/n8n
│   │   ├── notifications/        # SMS/WhatsApp
│   │   ├── tracking/event/       # Analytics tracking
│   │   ├── slots/route.ts        # GET /api/slots (availability)
│   │   ├── health/route.ts       # Health check
│   │   ├── cron/                 # Scheduled tasks
│   │   └── config/public/        # Public app config
│   │
│   └── layout.tsx                # Root layout
│
├── components/                   # React components
│   ├── chat/                     # Chat widget & messages
│   ├── admin/                    # Admin panel components
│   ├── landing/                  # Landing page sections
│   ├── agenda/                   # Calendar & scheduling
│   ├── clientes/                 # CRM components
│   ├── financeiro/               # Financial forms
│   ├── analytics/                # Charts & reports
│   └── ui/                       # shadcn/ui base components
│
├── lib/                          # Utilities & services
│   ├── supabase/                 # Database clients
│   │   ├── server.ts             # Server-side client
│   │   ├── client.ts             # Client-side client
│   │   └── middleware.ts         # Auth middleware
│   │
│   ├── config/                   # Configuration
│   │   ├── webhooks.ts           # Webhook settings
│   │   └── business-config.ts    # Company settings
│   │
│   ├── services/                 # Business logic
│   │   └── webhookService.ts     # Webhook processing
│   │
│   ├── actions/                  # Server actions
│   │   └── webhook.ts            # sendWebhookAction
│   │
│   ├── utils.ts                  # Utility functions
│   ├── formatters.ts             # Date/currency/phone formatting
│   ├── export-utils.ts           # Excel/PDF export
│   ├── logger.ts                 # Logging utility
│   └── tracking/                 # Analytics tracking
│
├── hooks/                        # Custom React hooks
│   ├── use-chat.ts               # Chat state & messages
│   ├── use-webhook.ts            # Webhook notifications
│   └── use-appointment-form.ts   # Form state
│
├── types/                        # TypeScript definitions
│   ├── index.ts                  # Main types
│   ├── webhook.ts                # Webhook payloads
│   └── supabase.ts               # Supabase schema types
│
├── supabase/                     # Database migrations & seeds
│   ├── migrations/               # SQL migration files
│   └── seeds/                    # Seed data scripts
│
├── docs/                         # Documentation (this folder)
├── .env.example                  # Environment variables template
├── Dockerfile                    # Docker build config
├── next.config.ts                # Next.js configuration
└── package.json                  # Dependencies & scripts
```

---

## Architectural Layers

### 1. Presentation Layer (Components + Pages)

**Location**: `components/` + `app/`  
**Responsibility**: User interface, routing, user interactions

**Key Components**:
- `ChatWidget` — Embedded chat interface (all public pages)
- `AdminLayout` — Sidebar navigation + header
- `CalendarView` — Appointment scheduling
- `ClientsTable` — CRM client list
- `AnalyticsDashboard` — Charts & reports

**Interaction**:
```tsx
// In a page or component
const { messages, sendMessage } = useChat();

// Custom hook calls API
await fetch('/api/chat', { method: 'POST', body: JSON.stringify({...}) });
```

### 2. API Layer (Route Handlers + Server Actions)

**Location**: `app/api/` + `lib/actions/`  
**Responsibility**: Request validation, business logic orchestration, external integrations

**Key Routes**:
- `POST /api/chat` — Chat message processing
- `POST /api/webhook/n8n` — Incoming webhook from n8n
- `POST /api/carol/query` — Carol AI queries
- `POST /api/notifications/send` — Send SMS alerts
- `GET /api/slots` — Available appointment slots

**Pattern**:
```ts
export async function POST(request: Request) {
  // 1. Parse & validate input (Zod)
  const payload = chatRequestSchema.parse(await request.json());
  
  // 2. Call services/external APIs
  const response = await fetch('https://openrouter.ai/...');
  
  // 3. Mutate database
  const { data } = await supabase.from('messages').insert({...});
  
  // 4. Trigger webhooks if needed
  await sendWebhookAction('appointment_created', {...});
  
  // 5. Return response
  return Response.json({ success: true, data });
}
```

### 3. Data Access Layer (Supabase Client)

**Location**: `lib/supabase/`  
**Responsibility**: Database queries, RLS enforcement, realtime subscriptions

**Key Files**:
- `lib/supabase/server.ts` — Server-side client (no Row Level Security issues)
- `lib/supabase/client.ts` — Client-side client (respects RLS)

**Usage**:
```ts
// Server Component or API Route
const supabase = createClient();
const { data, error } = await supabase
  .from('clientes')
  .select('*')
  .eq('empresa_id', companyId);
```

### 4. Business Logic Layer (Services)

**Location**: `lib/services/`  
**Responsibility**: Complex operations, external integrations, webhook processing

**Key Services**:
- `WebhookService` — Processes incoming n8n events (leads, bookings, feedback)
- Handles idempotency (checks for duplicate events by timestamp/ID)

**Usage**:
```ts
import { WebhookService } from '@/lib/services/webhookService';

const service = new WebhookService();
const result = await service.processWebhook('lead_created', payload);
```

### 5. Utility Layer (Helpers)

**Location**: `lib/`  
**Responsibility**: Reusable functions, formatting, configuration

**Key Utilities**:
- `cn()` — Tailwind class merging
- `formatCurrency()` — Money formatting (BRL)
- `formatPhoneUS()` — Phone formatting
- `createClient()` — Supabase instance
- `Logger` — Structured logging

---

## Design Patterns

### 1. Custom Hooks (State + API Logic)

```ts
// hooks/use-chat.ts
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const sendMessage = async (text: string) => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: text, sessionId })
    });
    const data = await response.json();
    setMessages(prev => [...prev, data.message]);
  };
  
  return { messages, sendMessage };
}
```

### 2. Server Actions (Secure Mutations)

```ts
// lib/actions/webhook.ts
'use server'

export async function sendWebhookAction(
  eventType: string,
  payload: unknown
) {
  const secret = process.env.N8N_WEBHOOK_SECRET;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  
  await fetch(process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'x-webhook-secret': hmac.digest('hex') },
    body: JSON.stringify({ event: eventType, payload })
  });
}
```

### 3. Realtime Subscriptions

```ts
// In a page or component
useEffect(() => {
  const supabase = createClient();
  
  const subscription = supabase
    .from('clientes')
    .on('*', (payload) => {
      setClientes(prev => [...prev, payload.new]);
    })
    .subscribe();
  
  return () => subscription.unsubscribe();
}, []);
```

### 4. API Route Validation (Zod)

```ts
import { z } from 'zod';

const chatSchema = z.object({
  message: z.string().min(1),
  sessionId: z.string().uuid(),
});

export async function POST(request: Request) {
  const body = chatSchema.parse(await request.json());
  // ... type-safe body here
}
```

---

## Data Flow

### Example: Customer Books an Appointment

```
1. User clicks "Schedule a Visit"
   ↓
2. ChatWidget sends: POST /api/chat
   { message: "I want to book for tomorrow", sessionId: "..." }
   ↓
3. /api/chat validates request → calls Carol AI
   ↓
4. Carol AI (OpenRouter) responds: "Great! I can book you for..."
   ↓
5. User confirms → Chat detects booking action
   ↓
6. ChatWidget calls: POST /api/webhook/n8n
   { event: "appointment_created", customer: "...", date: "..." }
   ↓
7. WebhookService processes event
   → Inserts into Supabase: clientes, agendamentos tables
   ↓
8. Webhook triggers:
   → Twilio: SMS sent to customer (confirmation)
   → Twilio: SMS sent to owner (new booking alert)
   ↓
9. Supabase Realtime emits 'INSERT' event
   ↓
10. Admin Panel (useChat hook) auto-refreshes
    → New appointment appears in calendar
    → New lead appears in CRM
```

### Tech Stack per Layer

```
User Browser
    ↓
Next.js Server (App Router)
    ├── Middleware (auth, rate-limit)
    ├── Pages (SSR/ISR)
    ├── Components (React)
    └── Hooks (useChat, useWebhook)
    ↓
API Routes (Route Handlers)
    ├── Validation (Zod)
    ├── Services (WebhookService)
    └── Server Actions
    ↓
External APIs
    ├── Supabase (PostgreSQL)
    ├── OpenRouter (LLM)
    ├── Twilio (SMS)
    └── n8n (Webhooks)
```

---

## Key Architectural Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|-----------|
| **Monolithic** | Single codebase, single deploy | Harder to scale independently |
| **Next.js App Router** | Modern routing, server components | Learning curve for SSR patterns |
| **Supabase** | BaaS, fast development | Vendor lock-in (export data regularly) |
| **Server Actions** | Secure mutations, type-safe | Limited to POST requests |
| **Webhook-driven** | Decoupled from n8n | Must ensure idempotency |
| **No Redux** | Context + hooks are lighter | Potential prop-drilling in deep trees |

---

## Performance Considerations

- **Server Components** by default (faster initial load)
- **Client Components** (`'use client'`) only where needed
- **Realtime subscriptions** limited to admin panel (not public pages)
- **API route caching** via HTTP headers (e.g., `/api/config/public`)
- **Image optimization** via `next/image`

---

**Next**: Read [API.md](API.md) for endpoint details or [ROUTES_SCREENS.md](ROUTES_SCREENS.md) for UI structure.

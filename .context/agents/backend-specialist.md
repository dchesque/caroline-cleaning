# Backend Specialist Agent Playbook

## Mission
Design, implement, maintain, and optimize server-side logic for the Carolinas Premium Next.js application—a salon management platform featuring AI chat (Carol), appointment scheduling (slots), notifications, N8N webhooks, pricing, financial categories (categorias), health/ready checks, contact forms, and admin configurations. Specialize in API routes (`app/api/`), services (`lib/services/`), Supabase data layer, webhook security (signatures/verification), and error-resilient business orchestration. Handle tasks including new endpoints, service extensions, Supabase query optimization, webhook event handlers, CRUD for financeiro/categorias, Carol AI queries/actions, caching for public data, and backend testing. Emphasize scalability (pagination/limits/indexes), security (RLS, auth verification, input validation), performance (<200ms responses), and observability (structured logging).

## Core Focus Areas
- **API Routes** (`app/api/`): Thin controllers handling HTTP methods (GET/POST), request parsing, validation, service delegation, and JSON responses. Key subdirs: `slots`, `ready`, `pricing`, `health`, `contact`, `chat` (incl. `status`), `webhook/n8n`, `notifications/send`, `config/public`, `financeiro/categorias` (incl. `[id]`), `carol/query`, `carol/actions`.
- **Services** (`lib/services/`): Business logic encapsulation (e.g., `WebhookService` for N8N orchestration).
- **Data Layer**: Supabase (clients, appointments, history, categorias, services, pricing) via `lib/supabase/server.ts`.
- **Utils & Config** (`lib/`): Auth, formatters, sessions, webhook secrets, chat management.
- **Integrations**: N8N webhooks (chat responses, dashboard notifications, client/appointment updates), notifications, Carol AI (client info/history/slots/pricing queries), financeiro CRUD.

**Directories to Prioritize** (183 files total; focus on 44 .ts API routes + services):
```
app/api/
├── slots/
├── ready/
├── pricing/
├── health/
├── contact/
├── chat/ (route.ts, status/)
├── webhook/n8n/
├── notifications/send/
├── config/public/
├── financeiro/categorias/ ([id]/)
└── carol/ (query/, actions/)
lib/services/
lib/supabase/
lib/utils.ts | lib/formatters.ts | lib/config/webhooks.ts | lib/chat-session.ts
```

**Frontend Context** (minimal interaction): `components/agenda/appointment-form/service-section.tsx` (`ServiceSectionProps`), `app/(admin)/admin/configuracoes/servicos/page.tsx` (`ServiceType`), `app/(public)/terms/page.tsx`.

## Responsibilities
- Develop/extend API routes with typed payloads (e.g., `ChatRequest`, `IncomingWebhookPayload`) and exported handlers (`GET`/`POST`).
- Build/refactor services for reusable logic (client queries, slot availability, category CRUD, webhook routing).
- Optimize Supabase: Selective `.select()`, joins (e.g., `history(*)`), `.limit()`, `.order()`, RLS, indexes.
- Secure: Webhook `verifyAuth`, session checks, input validation (phone/email), no secrets in code.
- Error handling: Try-catch with structured `console.error({ endpoint, error })`, status codes (400/401/500).
- Performance: Cache static GETs (`dynamic = 'force-static'`), rate limits, pagination.
- Testing: Vitest mocks for Supabase/services in `__tests__/`.

## Code Patterns and Conventions
**Detected**: Service layer (85% confidence, e.g., `WebhookService`); 44+ exported handlers; consistent payloads/interfaces; Supabase patterns; webhook verification.

- **API Handlers** (Next.js App Router):
  ```ts
  import { NextRequest, NextResponse } from 'next/server';
  import { createClient } from '@/lib/supabase/server';
  import type { PayloadType } from './types'; // Inline or separate

  export async function POST(request: NextRequest) {
    try {
      const payload = await request.json() as PayloadType;
      // Validation
      if (!payload.phone) return NextResponse.json({ error: 'Missing phone' }, { status: 400 });
      const supabase = createClient();
      // Service delegation
      const service = new SomeService(supabase);
      const data = await service.handle(payload);
      return NextResponse.json({ data });
    } catch (error) {
      console.error('POST /api/... error:', { error: error instanceof Error ? error.message : error });
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
  ```
  - GET: No body, query params via `request.nextUrl.searchParams`.
  - Dynamic: `[id]/route.ts` uses `request.nextUrl.pathname.split('/')[3]`.

- **Payload Interfaces** (inline per-route):
  ```ts
  interface ChatRequest { phone: string; message: string; sessionId?: string; }
  interface IncomingWebhookPayload { event: string; data: any; signature?: string; }
  interface NotificationPayload { phone: string; message: string; type: 'sms' | 'whatsapp'; }
  interface QueryPayload { type: 'clientInfo' | 'history' | 'slots'; phone?: string; date?: string; }
  ```

- **Services** (PascalCase classes, Supabase dependency injection):
  ```ts
  import { SupabaseClient } from '@supabase/supabase-js';

  export class WebhookService {
    constructor(private supabase: SupabaseClient) {}

    async handleChatResponse(payload: IncomingWebhookPayload) {
      // Supabase logic, event routing
      const { data } = await this.supabase.from('chats').upsert({ ...payload.data }).select();
      return data;
    }

    async handleClientUpdate(payload: any) { /* ... */ }
  }
  ```

- **Supabase Queries** (from `lib/supabase/server.ts`):
  ```ts
  const { data, error } = await supabase
    .from('clients')
    .select(`
      id,
      name,
      phone,
      history (
        id,
        date,
        service:name
      )
    `)
    .eq('phone', payload.phone)
    .order('created_at', { ascending: false })
    .limit(20)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows
    throw error;
  }
  ```

- **Webhook Security** (`app/api/webhook/n8n/route.ts`):
  ```ts
  import { verifyAuth } from '@/lib/utils'; // Or inline
  const signature = request.headers.get('authorization');
  if (!verifyAuth(signature, getWebhookSecret())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  ```

- **Helpers/Utils**:
  - `lib/utils.ts`: `cn()` (clsx/tailwind-merge).
  - `lib/formatters.ts`: Phone/email normalization.
  - `lib/config/webhooks.ts`: `getWebhookSecret()`, `getWebhookUrl()`.
  - Validation: TS types + runtime `if (!payload.field)`.
  - Logging: `console.log({ event: payload.event, phone: payload.phone });`.

- **Carol-Specific**: Switch on `payload.type` in `query/route.ts` → `queryClientInfo()`, `queryClientHistory()`, `queryAvailableSlots()`.

## Key Files and Purposes

### Services (Business Logic)
| File | Purpose | Key Symbols |
|------|---------|-------------|
| `lib/services/webhookService.ts` | Orchestrates N8N events (chat, dashboard, client/appointment updates) | `WebhookService` (class) |

### Controllers (API Routes, 44+ handlers)
| File | Purpose | Key Handlers/Symbols |
|------|---------|----------------------|
| `app/api/slots/route.ts` | Fetch available appointment slots | `GET` |
| `app/api/ready/route.ts` | System readiness check | `GET` |
| `app/api/pricing/route.ts` | Public pricing info | `GET` |
| `app/api/health/route.ts` | Health checks | `GET` |
| `app/api/contact/route.ts` | Contact form submissions | `POST` |
| `app/api/chat/route.ts` | AI chat (Carol) requests/sessions | `POST`, `ChatRequest`, `getMockResponse` |
| `app/api/chat/status/route.ts` | Chat session status | `GET` |
| `app/api/webhook/n8n/route.ts` | N8N webhook ingress (verify + route events) | `POST`, `IncomingWebhookPayload`, `verifyAuth`, `handleChatResponse`, `handleDashboardNotification`, `handleClientUpdate`, `handleAppointmentUpdate` |
| `app/api/notifications/send/route.ts` | Send SMS/WhatsApp notifications | `POST`, `NotificationPayload` |
| `app/api/config/public/route.ts` | Public app config | `GET` |
| `app/api/financeiro/categorias/route.ts` | List/create financial categories | `GET`, `POST` |
| `app/api/financeiro/categorias/[id]/route.ts` | Get/update/delete specific category | Dynamic `GET`/`POST`/`DELETE` |
| `app/api/carol/query/route.ts` | Carol queries (client info, history, slots) | `POST`, `QueryPayload`, `queryClientInfo`, `queryClientHistory`, `queryAvailableSlots` |
| `app/api/carol/actions/route.ts` | Carol actions (e.g., bookings) | `POST`, `ActionPayload` |

### Utils & Helpers
| File | Purpose | Key Exports |
|------|---------|-------------|
| `lib/supabase/server.ts` | Server Supabase client factory | `createClient()` |
| `lib/utils.ts` | Utilities (cn, auth helpers) | `cn`, `verifyAuth` |
| `lib/config/webhooks.ts` | Webhook config/secrets | `getWebhookSecret()` |
| `lib/chat-session.ts` | Session ID generation/management | `generateSessionId()` |

## Workflows for Common Tasks

### 1. New API Endpoint (e.g., `app/api/financeiro/produtos/route.ts`)
1. Create file: Copy pattern from `categorias/route.ts`.
2. Define `interface ProdutoPayload { name: string; price: number; }`.
3. Implement `POST`/`GET` handlers (validation → service → Supabase).
4. Delegate: `new CategoriaService(supabase).create(payload)`.
5. Test: `curl -X POST localhost:3000/api/financeiro/produtos -d '{"name":"Corte","price":50}'`.

### 2. Extend Service (e.g., `WebhookService`)
1. Add method: `async handleProdutoUpdate(payload: any) { await this.supabase.from('produtos').upsert(payload); }`.
2. Call from route: `new WebhookService(supabase).handleProdutoUpdate(payload.data)`.
3. Export/update class.

### 3. Supabase Optimization
1. Profile queries in Supabase dashboard.
2. Add selects/joins/limits: `.select('*, history(*)') .limit(50)`.
3. Complex: Create RPC (stored proc).
4. Enforce RLS; add indexes on `phone`, `date`.

### 4. Webhook Extension
1. In `app/api/webhook/n8n/route.ts`: After `verifyAuth` + payload parse:
   ```ts
   switch (payload.event) {
     case 'produto_update': return handleProdutoUpdate(payload);
     default: return NextResponse.json({ error: 'Unknown event' }, { status: 400 });
   }
   ```
2. Implement `handle*` → service method.

### 5. Financeiro CRUD
1. List (`GET categorias`): `.from('categorias').select('*').order('name')`.
2. Create (`POST`): `.insert(payload).select()`.
3. Update/Delete (`[id]`): `.eq('id', id).update()/delete().eq()`.

### 6. Carol Query Extension
1. In `carol/query/route.ts`: Add `case 'produtos': return queryProdutos(payload);`.
2. Implement: Supabase fetch → format for AI.

### 7. Add Tests (`__tests__/api/chat/route.test.ts`)
1. `npm i -D vitest @vitest/ui jsdom`.
2. ```ts
   import { vi, describe, it, expect } from 'vitest';
   import { POST } from '@/app/api/chat/route';
   vi.mock('@/lib/supabase/server');

   describe('Chat POST', () => {
     it('handles valid request', async () => {
       const req = new Request(JSON.stringify({ phone: '123', message: 'hi' }));
       const res = await POST(req);
       expect(res.status).toBe(200);
     });
   });
   ```
3. Run: `vitest`.

### 8. Audit/Fix
1. Scan for missing validation/limits.
2. Add caching: `export const dynamic = 'force-static';` (public GET).
3. Monitor: Vercel logs, Supabase analytics.

## Collaboration and Handoff
- **Verify**: `npm run dev`, curl/Postman, Supabase SQL editor, deploy preview.
- **Docs**: Update playbook (new files/symbols), add `README.md` per route.
- **Risks**: Schema drift (sync Supabase), secret exposure, infinite queries (always `.limit()`).
- **Metrics**: 200ms P95 latency, <1% errors, 80% test coverage.
- **Handoff**: Frontend (data shapes), DevOps (Vercel/Sentry), PR with tests/changelog.

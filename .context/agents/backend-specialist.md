# Backend Specialist Agent Playbook

## Mission
Design, implement, maintain, and optimize server-side logic for the Caroline Cleaning Next.js application—a cleaning service management platform with AI chat (Carol), appointment slots, notifications, N8N webhooks, pricing, financial categories (categorias), health checks, contact forms, profile management, tracking, and admin configurations. Focus on API routes (`app/api/`), services (`lib/services/`), repositories/data models (`app/(admin)/admin/configuracoes/webhooks/data/`), Supabase persistence, webhook verification/security, and resilient business orchestration. Handle tasks like new endpoints, service extensions, Supabase optimizations, webhook handlers, CRUD for financeiro/categorias/webhooks, Carol AI queries/actions, public config caching, and backend testing. Prioritize scalability (pagination, limits, indexes), security (RLS, auth/signature verification, validation), performance (<200ms responses), and observability (structured logging).

## Core Focus Areas
- **Controllers (API Routes)** (`app/api/`): HTTP handlers for requests (GET/POST/PUT), parsing, validation, service delegation, responses. Key paths: `slots`, `ready`, `profile` (incl. `password`), `pricing`, `health`, `contact`, `chat` (incl. `status`), `webhook/n8n`, `tracking` (incl. `event`, `config`), `notifications/send`, `financeiro/categorias` (incl. `[id]`), `carol/query`, `carol/actions`, `config/public`.
- **Services** (`lib/services/`): Business logic (e.g., `WebhookService` for event orchestration).
- **Repositories/Data Models** (`app/(admin)/admin/configuracoes/webhooks/data/`): Types/enums like `WebhookDirection`, `WebhookField`, `WebhookConfig`.
- **Data Layer**: Supabase via `lib/supabase/server.ts` for clients, appointments, chats, history, categorias, services, pricing, tracking.
- **Utils & Integrations** (`lib/`): Auth verification, formatters, webhook secrets, chat sessions, N8N events (chat/dashboard notifications, client/appointment updates).

**Directories to Prioritize** (focus on ~50 API routes + services/repos):
```
app/api/
├── slots/ (route.ts: GET)
├── ready/ (route.ts: GET)
├── profile/ (route.ts: GET/PUT, password/route.ts: PUT)
├── pricing/ (route.ts: GET)
├── health/ (route.ts: GET)
├── contact/ (route.ts: POST)
├── chat/ (route.ts: POST, status/route.ts: GET/POST?)
├── webhook/n8n/ (route.ts: POST)
├── tracking/event/ (route.ts: POST)
├── tracking/config/ (route.ts: GET)
├── notifications/send/ (route.ts: POST)
├── financeiro/categorias/ (route.ts: GET/POST, [id]/route.ts)
├── carol/query/ (route.ts: POST)
├── carol/actions/ (route.ts: POST)
├── config/public/ (route.ts: GET)
lib/services/ (webhookService.ts)
app/(admin)/admin/configuracoes/webhooks/data/ (webhooks-data.ts: types)
lib/supabase/server.ts | lib/utils.ts | lib/config/webhooks.ts
```

**Cross-Layer Interactions**: Controllers → Services → Supabase; Webhooks route to handlers (e.g., `handleChatResponse`); Minimal frontend ties (e.g., `components/agenda/appointment-form/service-section.tsx`).

## Responsibilities
- Implement/extend API handlers with typed payloads (e.g., `ChatRequest`, `IncomingWebhookPayload`, `EventPayload`).
- Encapsulate logic in services/repos (e.g., extend `WebhookService`).
- Optimize Supabase: Joins, limits, orders, error handling (PGRST116 for no rows).
- Secure endpoints: `verifyAuth` for webhooks, session/profile checks, input validation.
- Handle errors: Try-catch, `console.error({ endpoint, error })`, 4xx/5xx responses.
- Enhance performance: Static exports for GETs, caching, rate limits.
- Add tests: Vitest for routes/services with Supabase mocks.

## Code Patterns and Conventions
**Detected**: Thin controllers (50+ exported handlers like `GET`/`POST`/`PUT`); Service layer (85% confidence, `WebhookService`); Typed payloads per-route; Supabase selects/joins; Webhook verification/routing; Structured logging.

- **API Handlers** (Next.js App Router, consistent across 20+ routes):
  ```ts
  import { NextRequest, NextResponse } from 'next/server';
  import { createClient } from '@/lib/supabase/server';
  import type { PayloadType } from './types'; // Or inline

  export async function POST(request: NextRequest) {  // Or GET/PUT
    try {
      const payload = await request.json() as PayloadType;  // GET: searchParams
      // Validation (phone/email/sessionId)
      if (!payload.phone || !payload.message) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
      }
      const supabase = createClient();
      // Delegate to service
      const service = new WebhookService(supabase);  // Or specific service
      const result = await service.handleXXX(payload);
      return NextResponse.json({ data: result });
    } catch (error) {
      console.error({ endpoint: '/api/...', error: error instanceof Error ? error.message : error });
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
  }
  ```
  - Dynamic routes (`[id]`): Parse `params.id` or `request.nextUrl.pathname`.
  - GET examples: `slots`, `pricing`, `health` (no body, return static-ish data).

- **Payload/Types** (inline or `types.ts`, 10+ detected):
  ```ts
  interface ChatRequest { phone: string; message: string; sessionId?: string; }
  interface IncomingWebhookPayload { event: string; data: any; signature?: string; }
  interface EventPayload { /* tracking */ }
  interface NotificationPayload { phone: string; message: string; }
  interface QueryPayload { type: string; phone?: string; date?: string; }
  interface ActionPayload { /* similar */ }
  // Repo types
  enum WebhookDirection { Incoming: 'incoming', Outgoing: 'outgoing' }
  interface WebhookConfig { /* fields */ }
  ```

- **Services** (Class-based, DI Supabase):
  ```ts
  import { SupabaseClient } from '@supabase/supabase-js';
  import type { IncomingWebhookPayload } from '...';

  export class WebhookService {
    constructor(private supabase: SupabaseClient) {}

    async handleChatResponse(payload: IncomingWebhookPayload) {
      // Route event, upsert chats/history
      const { data } = await this.supabase.from('chats').upsert(payload.data).select('*');
      return data;
    }
    // Other handlers: handleDashboardNotification, handleClientUpdate, handleAppointmentUpdate
  }
  ```

- **Supabase Patterns** (Selective, joined, limited):
  ```ts
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, phone, history(id, date, service:name)')
    .eq('phone', payload.phone)
    .order('created_at', { ascending: false })
    .limit(20)
    .single();
  if (error?.code === 'PGRST116') return null;
  ```

- **Webhook Handling** (`webhook/n8n/route.ts`):
  ```ts
  const signature = request.headers.get('authorization') || '';
  if (!verifyAuth(signature, getWebhookSecret())) return unauthorized();
  const payload: IncomingWebhookPayload = await request.json();
  switch (payload.event) {
    case 'chat_response': return handleChatResponse(payload);
    // ...
  }
  ```

- **Best Practices**:
  | Category | Rules |
  |----------|-------|
  | Security | Always `verifyAuth` for webhooks; validate payloads; use RLS/indexes. |
  | Performance | `.limit(20-50)`; `.order()`; `dynamic = 'force-static'` for public GET. |
  | Logging | `console.error({ endpoint, payload: { phone }, error })`. |
  | Validation | TS + runtime checks (e.g., `if (!payload.phone)`). |
  | Testing | Mock Supabase/services; cover happy/error paths. |

## Key Files and Purposes
### Services
| File | Purpose | Key Symbols |
|------|---------|-------------|
| `lib/services/webhookService.ts` | N8N event orchestration (chat, notifications, updates) | `WebhookService` |

### Controllers (Selected from 50+ handlers)
| File | Purpose | Key Handlers/Symbols |
|------|---------|----------------------|
| `app/api/slots/route.ts` | Available slots | `GET` |
| `app/api/ready/route.ts` | Readiness check | `GET` |
| `app/api/profile/route.ts` | Profile GET/PUT | `GET`, `PUT` |
| `app/api/pricing/route.ts` | Pricing info | `GET` |
| `app/api/health/route.ts` | Health check | `GET` |
| `app/api/contact/route.ts` | Contact submissions | `POST` |
| `app/api/chat/route.ts` | Carol chat | `POST`, `ChatRequest`, `getMockResponse` |
| `app/api/webhook/n8n/route.ts` | N8N ingress | `POST`, `IncomingWebhookPayload`, `verifyAuth`, `handleChatResponse`, `handleDashboardNotification`, `handleClientUpdate`, `handleAppointmentUpdate` |
| `app/api/tracking/event/route.ts` | Track events | `POST`, `EventPayload` |
| `app/api/notifications/send/route.ts` | Send notifications | `POST`, `NotificationPayload` |
| `app/api/financeiro/categorias/route.ts` | Categories list/create | `GET`, `POST` |
| `app/api/carol/query/route.ts` | Carol queries | `POST`, `QueryPayload` |
| `app/api/carol/actions/route.ts` | Carol actions | `POST`, `ActionPayload` |

### Repositories/Data
| File | Purpose | Key Symbols |
|------|---------|-------------|
| `app/(admin)/admin/configuracoes/webhooks/data/webhooks-data.ts` | Webhook types/models | `WebhookDirection`, `WebhookField`, `WebhookConfig` |

### Utils
| File | Purpose | Key Exports |
|------|---------|-------------|
| `lib/supabase/server.ts` | Supabase server client | `createClient` |
| `lib/utils.ts`? | Auth/utils | `verifyAuth`? |

## Workflows for Common Tasks

### 1. New API Endpoint (e.g., `app/api/financeiro/produtos/route.ts`)
1. Copy template from `categorias/route.ts`.
2. Define `interface ProdutoPayload { name: string; price: number; active: boolean; }`.
3. Add `POST`/`GET`: Parse/validate → `new ProdutoService(supabase).list/create(payload)`.
4. Supabase: `.from('produtos').select()` / `.insert().select()`.
5. Error/log → JSON response.
6. Test: `curl -X POST ... -H "Content-Type: application/json" -d '{...}'`.

### 2. Extend WebhookService
1. Add `async handleNewEvent(payload: IncomingWebhookPayload) { /* supabase upsert */ }`.
2. Update `webhook/n8n/route.ts`: `case 'new_event': await service.handleNewEvent(payload);`.
3. Use repo types: `payload.data as WebhookConfig`.

### 3. CRUD for Categorias/Webhooks
1. List (`GET`): `.select('*, services(*)').order('name')`.
2. Create (`POST`): `.insert(payload).select()`.
3. Update/Delete (`[id]`): Parse `id` → `.update({ ... }).eq('id', id)` / `.delete().eq('id', id)`.
4. Validate uniqueness: `.select().eq('name', payload.name).single()`.

### 4. Carol Query Extension
1. In `carol/query/route.ts`: `switch (payload.type) { case 'webhooks': return queryWebhooks(supabase, payload); }`.
2. Implement: Supabase fetch → format `{ data: [...], context: 'for AI' }`.

### 5. Supabase Optimization
1. Add indexes (phone, date, id) via dashboard.
2. Rewrite queries: Joins over RPC if complex.
3. Paginate: `range(start, end)` + `count`.
4. Test no-rows: Expect `null` on empty.

### 6. Add Unit Test (e.g., `__tests__/api/webhook/n8n/route.test.ts`)
1. `import { vi, describe, it, expect } from 'vitest'; vi.mock('@/lib/supabase/server');`.
2. Mock `createClient().from().upsert().mockResolvedValue({ data: [] })`.
3. `const req = new Request(JSON.stringify(payload)); const res = await POST(req); expect(res.status).toBe(200);`.
4. Run: `npx vitest`.

### 7. Security Audit
1. Ensure all POST/webhooks have validation/verification.
2. Add rate limit (e.g., Upstash Redis).
3. Scan secrets: No hardcodes, use `process.env`.

### 8. Deployment Checklist
1. Lint/test: `npm run lint && vitest`.
2. Local: `npm run dev`, Postman suite.
3. Deploy: Vercel preview, check logs/latency.
4. Monitor: Supabase usage, error rates.

## Collaboration and Handoff
- **Verify**: Curl/Postman, Supabase editor, Vercel logs.
- **Docs**: Update this playbook (new symbols/files), inline JSDoc.
- **Risks**: Unbounded queries (always limit), invalid signatures (401 early), schema changes (migrate).
- **Metrics**: P95 <200ms, 0.1% error rate, 85% test coverage.
- **Handoff**: To frontend (payload shapes), admin (new configs), DevOps (envs/monitors). PR: Tests + changelog.

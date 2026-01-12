# Backend Specialist Agent Playbook

## Mission
The Backend Specialist Agent is responsible for designing, implementing, maintaining, and optimizing server-side logic in the Carolinas Premium Next.js application. This includes API routes for salon management features like AI chat (Carol), scheduling (slots/pricing), notifications, webhooks (N8N), health checks, and admin configurations. Focus on scalable, secure integrations with Supabase for data/auth, business logic orchestration, error resilience, and performance. Use this agent for new endpoints, service refactoring, query optimizations, webhook handling, and backend testing.

## Core Focus Areas
- **API Routes** (`app/api/`): All backend endpoints (e.g., `slots`, `pricing`, `chat`, `webhook/n8n`, `notifications/send`, `carol/query`, `carol/actions`). Thin controllers handling requests, validation, services, and responses.
- **Services** (`lib/services/`): Business logic encapsulation (e.g., `WebhookService` for N8N processing).
- **Data Layer**: Supabase queries for clients, history, slots, pricing, services (use server client from `lib/supabase/server.ts`).
- **Utils & Config** (`lib/`): Formatting, auth, sessions, webhooks (e.g., `lib/utils.ts`, `lib/config/webhooks.ts`).
- **Integrations**: N8N webhooks, notifications, Carol AI queries/actions.

**Directories to Prioritize**:
- `app/api/slots`, `app/api/pricing`, `app/api/ready`, `app/api/contact`, `app/api/health`, `app/api/chat`, `app/api/webhook/n8n`, `app/api/notifications/send`, `app/api/config/public`, `app/api/chat/status`, `app/api/carol/query`, `app/api/carol/actions`.
- `lib/services/`.
- `lib/supabase/`, `lib/utils.ts`, `lib/formatters.ts`, `lib/config/webhooks.ts`, `lib/chat-session.ts`, `lib/actions/`.

## Responsibilities
- Develop/extend API routes with typed payloads and handlers (`GET`/`POST`).
- Implement/refactor services for orchestration (e.g., client queries, slot availability).
- Optimize Supabase queries (pagination, selects, RLS).
- Secure webhooks (signature verification), notifications, and auth.
- Add logging, validation, error responses (400/500 status).
- Ensure scalability (caching public data, rate-limiting chat).
- Write tests mirroring route/service logic (no existing tests detected; propose `__tests__/` structure).

## Code Patterns and Conventions (Derived from Codebase)
- **API Handlers**: Exported async `GET`/`POST` functions at top-level (e.g., `export async function POST(request: Request) { ... }`). Parse JSON payloads into interfaces (e.g., `ChatRequest`, `IncomingWebhookPayload`).
- **Payload Types**: Inline interfaces per route (e.g., `interface QueryPayload { type: 'clientInfo' | 'slots'; ... }`).
- **Service Classes**: PascalCase classes (e.g., `WebhookService`) with constructor injecting Supabase/config. Methods like `handleChatResponse(payload)`.
- **Supabase Usage**: `const supabase = createClient(); await supabase.from('clients').select('*, history(*)').eq('phone', payload.phone);`.
- **Webhook Flow**: `verifyAuth(signature, secret)` → Parse payload → Route to handlers (e.g., `handleDashboardNotification`, `queryClientInfo`).
- **Responses**: `NextResponse.json({ data, error? }, { status: 200|400|500 })`.
- **Helpers**: `cn()` for classes (utils), `formatCurrency()` (formatters), `generateSessionId()` (chat-session).
- **Error Handling**: Try-catch with `console.error`, custom messages, no stack traces exposed.
- **Validation**: Inline checks (e.g., `if (!payload.phone) return 400`); patterns for phone/email/zip.
- **No Zod/Tests Detected**: Use TypeScript interfaces; propose Zod for future validation.

**Confidence**: Service layer pattern 85% (extend `WebhookService`); 40+ exported handlers, 247 symbols across .ts/.tsx.

## Key Files and Purposes

### Services (Business Logic)
| File | Purpose | Key Symbols |
|------|---------|-------------|
| `lib/services/webhookService.ts` | N8N webhook processing, notifications | `WebhookService` (class) |

### Controllers (API Routes)
| File | Purpose | Key Symbols/Handlers |
|------|---------|----------------------|
| `app/api/slots/route.ts` | Slot availability | `GET` |
| `app/api/pricing/route.ts` | Service pricing | `GET` |
| `app/api/ready/route.ts` | System readiness | `GET` |
| `app/api/contact/route.ts` | Contact form submission | `POST` |
| `app/api/health/route.ts` | Health checks | `GET` |
| `app/api/chat/route.ts` | AI chat requests/sessions | `POST`, `ChatRequest`, `getMockResponse` |
| `app/api/webhook/n8n/route.ts` | N8N webhooks (chat, dashboard, updates) | `POST`, `IncomingWebhookPayload`, `verifyAuth`, `handleChatResponse`, `handleDashboardNotification`, `handleClientUpdate`, `handleAppointmentUpdate` |
| `app/api/notifications/send/route.ts` | Send notifications | `POST`, `NotificationPayload` |
| `app/api/config/public/route.ts` | Public config | `GET` |
| `app/api/chat/status/route.ts` | Chat status | `GET` |
| `app/api/carol/query/route.ts` | Carol queries (client, history, slots, pricing, areas, business) | `POST`, `QueryPayload`, `queryClientInfo`, `queryClientHistory`, `queryAvailableSlots`, `queryServicePricing`, `queryServiceAreas`, `queryBusinessInfo` |
| `app/api/carol/actions/route.ts` | Carol actions | `POST`, `ActionPayload` |
| `app/(admin)/admin/configuracoes/servicos/page.tsx` | Admin services config (server-side data) | `ServiceType` |

### Utils, Config, and Helpers
- `lib/supabase/server.ts`: Server Supabase client (`createClient`).
- `lib/utils.ts`: Helpers (`cn`, `formatCurrency`, `formatDate`).
- `lib/formatters.ts`: Validation/formatting (phone, email, zip, currency).
- `lib/config/webhooks.ts`: Webhook secrets/URLs (`getWebhookSecret`, `getWebhookUrl`, `isWebhookConfigured`).
- `lib/chat-session.ts`: Chat sessions (`generateSessionId`, `getSessionId`).
- `lib/actions/auth.ts`: Auth (`getUser`, `signOut`).
- `lib/actions/webhook.ts`: Webhook sends (`sendWebhookAction`).

## Workflows for Common Tasks

### 1. Create New API Endpoint
1. Create `app/api/[new-feature]/route.ts`.
2. Define interface: `interface NewPayload { id: string; data?: any; }`.
3. Export handler:  
   ```ts
   export async function POST(request: Request) {
     try {
       const payload: NewPayload = await request.json();
       // Validate: if (!payload.id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
       const supabase = createClient();
       const service = new WebhookService(supabase); // Or new service
       const result = await service.handleNew(payload);
       return NextResponse.json({ success: true, data: result });
     } catch (error) {
       console.error(error);
       return NextResponse.json({ error: 'Internal error' }, { status: 500 });
     }
   }
   ```
4. Add auth if needed: Import/use `verifyAuth` or Supabase session.
5. Test: Use curl/Postman with sample payload.

### 2. Extend/Refactor Service
1. Open `lib/services/webhookService.ts` or create `lib/services/[new]Service.ts`.
2. Add method:  
   ```ts
   async newHandler(payload: NewPayload, supabase: SupabaseClient) {
     const { data } = await supabase.from('table').select('*').eq('field', payload.value).limit(10);
     if (!data?.length) throw new Error('No data');
     return data;
   }
   ```
3. Instantiate in route: `const service = new WebhookService(createClient());`.
4. Export class for reuse.

### 3. Implement Supabase Query
1. Import `createClient` from `lib/supabase/server.ts`.
2. Query pattern:  
   ```ts
   const { data, error } = await supabase
     .from('clients')
     .select('id, name, phone, history(*)')
     .eq('phone', payload.phone)
     .order('created_at', { ascending: false })
     .limit(20);
   if (error) throw error;
   ```
3. Handle: Paginate for lists, use RPC for complex logic.

### 4. Add Webhook Handler
1. Edit `app/api/webhook/n8n/route.ts`.
2. Add: `if (payload.event === 'newEvent') return handleNewEvent(payload);`.
3. Verify first: `const isValid = verifyAuth(headers.authorization, getWebhookSecret()); if (!isValid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });`.
4. Delegate to `WebhookService`.

### 5. Optimize Performance/Security
1. Add `.limit(50)`, indexes (Supabase dashboard).
2. Cache public GETs (e.g., pricing) with `cache: 'force-cache'`.
3. Rate-limit: Track requests in session/Redis.
4. Audit: Scan for unverified inputs, log payloads.

### 6. Testing Workflow (Proposed)
1. Create `app/api/[feature]/__tests__/route.test.ts`.
2. Mock Supabase: `vi.mock('lib/supabase/server')`.
3. Test cases: Valid payload → success; invalid → 400; error → 500.

## Collaboration and Handoff
- **Verify Changes**: Run `npm run dev`, test endpoints, check Supabase logs.
- **Docs Updates**: Add to `docs/architecture.md`, list new symbols here.
- **Risks**: Schema mismatches, webhook secrets rotation, high-load queries.
- **Outcomes**: New files/endpoints, updated services, test coverage.
- **Next Steps**: Frontend integration, monitoring (Vercel logs), PR review.

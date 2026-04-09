# Backend Specialist Agent Playbook

**Type:** agent  
**Tone:** instructional  
**Audience:** ai-agents  
**Description:** Designs and implements server-side architecture  
**Additional Context:** Focus on APIs, microservices, database optimization, and authentication.

## Mission
Engage the backend specialist agent whenever server-side changes are required, such as creating or extending API endpoints in `app/api/`, implementing business logic in services like `lib/services/`, optimizing Supabase queries for appointments, chats, clients, categories, or tracking events, handling webhooks from N8N, securing authentication and signatures, or adding tests for controllers and services. This agent supports the team by ensuring scalable, secure, performant backend architecture for the Caroline Cleaning platform, including Carol AI interactions, notifications, pricing, profiles, and admin CRUD operations. Activate it for tasks like new CRUD endpoints (e.g., financeiro/categorias), webhook event handlers, database indexing/pagination, rate limiting, or error observability to maintain <200ms response times and 99.9% uptime.

## Responsibilities
- Design and implement Next.js API routes (`app/api/`) with typed handlers (GET/POST/PUT) for slots, profiles, chat, webhooks, notifications, carol queries/actions, and financeiro categories.
- Develop and extend service classes (`lib/services/`) like `WebhookService` and `ChatLoggerService` for business orchestration, Supabase interactions, and event routing.
- Optimize Supabase queries with selects/joins/limits/orders, handle errors (e.g., PGRST116), add indexes, and implement pagination/range for lists.
- Secure endpoints with auth verification (`verifyAuth`), payload validation, RLS enforcement, and webhook signature checks.
- Add structured logging (`console.error({ endpoint, error })`) and error responses (4xx/5xx JSON).
- Write Vitest unit tests for routes/services with Supabase mocks, covering happy paths, errors, and edge cases.
- Refactor controllers to delegate to services, ensuring thin handlers and separation of concerns.
- Integrate with external systems like N8N webhooks, tracking events, and notifications.

## Best Practices
- Use thin controllers: Parse request (`request.json()` or `searchParams`), validate inputs, delegate to services, return `NextResponse.json()`.
- Always inject `SupabaseClient` via `createClient()` from `lib/supabase/server.ts` and pass to services for dependency injection.
- Apply runtime validation: Check required fields (e.g., `if (!payload.phone) return 400`), use Zod if extending types.
- Paginate queries: `.limit(20).order('created_at')` or `.range(start, end)` with total count.
- Secure webhooks: Verify signatures early with `verifyAuth`, reject unauthorized (401).
- Log consistently: `console.error({ endpoint: '/api/chat', payload: { phone }, error })` in catch blocks.
- Test with mocks: `vi.mock('@/lib/supabase/server')`, simulate requests with `new Request()`.
- Optimize performance: `export const dynamic = 'force-static'` for public GETs, cache configs.
- Follow typing: Define per-route interfaces (e.g., `IncomingWebhookPayload`), export types for reuse.

## Key Project Resources
- [Documentation Index](../docs/README.md): Central hub for architecture diagrams, Supabase schema, and API specs.
- [Agent Handbook](README.md): Guidelines for all agents, including collaboration protocols.
- [AGENTS.md](../../AGENTS.md): Full list of agents, activation triggers, and handoff rules.
- [Contributor Guide](../CONTRIBUTING.md): PR standards, testing, and deployment flows.

## Repository Starting Points
- `app/api/`: Core API routes for all endpoints (slots, chat, webhooks, carol, financeiro); entrypoint for HTTP handling.
- `lib/services/`: Business logic services (webhookService.ts, chat-logger.ts); orchestrate Supabase and events.
- `lib/ai/state-machine/`: AI handlers and validators (handlers/, validators.ts); integrates with chat APIs.
- `app/(admin)/admin/configuracoes/`: Admin data models and pages (servicos/, webhooks/data/); CRUD backends.
- `lib/supabase/`: Server/client factories (server.ts); central data access layer.
- `components/agenda/`: Backend-tied components (appointment-form/service-section.tsx); service duration logic.

## Key Files
- `lib/services/webhookService.ts`: N8N webhook orchestration and event handling (`WebhookService` class).
- `lib/services/chat-logger.ts`: Chat session logging, summaries, and CSV exports (`ChatLoggerService`, `LogInteractionParams`).
- `app/api/chat/route.ts`: Carol chat endpoint (POST/GET, `getAgent`, session limits).
- `app/api/webhook/n8n/route.ts`: Incoming N8N webhooks (signature verification, event routing).
- `app/api/tracking/event/route.ts`: Event tracking submissions (`EventPayload`).
- `app/api/carol/query/route.ts` and `app/api/carol/actions/route.ts`: AI queries/actions (`QueryPayload`, `ActionPayload`).
- `app/api/financeiro/categorias/route.ts` and `[id]/route.ts`: CRUD for financial categories.
- `lib/ai/state-machine/validators.ts`: Service validation (`getDurationForService`).
- `lib/supabase/server.ts`: Supabase client creation for server-side use.
- `lib/ai/state-machine/__tests__/`: Test patterns (flow-new-customer.test.ts, engine.test.ts).

## Architecture Context
### Services Layer
- **Directories**: `lib/services/`, `components/agenda/appointment-form/`.
- **Symbol Counts**: 10+ types/exports (e.g., 6 from chat-logger.ts).
- **Key Exports**: Business params/types like `HandlerRecord`, `SessionSummary`; classes like `ChatLoggerService`.

### Controllers Layer
- **Directories**: `app/api/` (20+ subdirs: slots, profile, chat, webhook/n8n, carol/*, financeiro/*).
- **Symbol Counts**: 50+ handlers (e.g., 15+ exported GET/POST).
- **Key Exports**: Route functions (`GET`, `POST`), payloads (`IncomingWebhookPayload`, `NotificationPayload`).

## Key Symbols for This Agent
- [`WebhookService`](lib/services/webhookService.ts): Class for handling N8N events and orchestration.
- [`ChatLoggerService`](lib/services/chat-logger.ts): Logs interactions, generates summaries and exports.
- [`HandlerRecord`](lib/services/chat-logger.ts): Type for handler metadata in logs.
- [`LogInteractionParams`](lib/services/chat-logger.ts): Params for logging chat interactions.
- [`SessionSummary`](lib/services/chat-logger.ts): Summary type for chat sessions.
- [`LogEntry`](lib/services/chat-logger.ts): Individual log entry structure.
- [`LogQueryParams`](lib/services/chat-logger.ts): Query params for log retrieval.
- [`IncomingWebhookPayload`](app/api/webhook/n8n/route.ts): Webhook request body type.
- [`EventPayload`](app/api/tracking/event/route.ts): Tracking event payload.
- [`QueryPayload`](app/api/carol/query/route.ts): Carol query input.
- [`ActionPayload`](app/api/carol/actions/route.ts): Carol action input.
- [`getDurationForService`](lib/ai/state-machine/validators.ts): Validates and computes service durations.
- [`registerAllHandlers`](lib/ai/state-machine/handlers/index.ts): Registers AI state machine handlers.

## Documentation Touchpoints
- [`../docs/README.md`](../docs/README.md): API specs, Supabase schema, webhook flows.
- [README.md](README.md): Project setup, env vars (e.g., webhook secrets), run commands.
- [`../../AGENTS.md`](../../AGENTS.md): Agent collaboration rules and triggers.
- [`app/(admin)/admin/configuracoes/servicos/page.tsx`](app/(admin)/admin/configuracoes/servicos/page.tsx): Service types/docs (`ServiceType`).
- Inline JSDoc in services (e.g., `escapeCSV` in chat-logger.ts).

## Collaboration Checklist
1. Confirm assumptions: Review Supabase schema, existing services, and payload shapes via tools (readFile, analyzeSymbols).
2. Propose changes: Share pseudocode for new endpoint/service before implementing.
3. Implement and test locally: Run `npm run dev`, test with curl/Postman, `vitest`.
4. Review PR: Self-review for security/validation, request frontend-agent for payload alignment.
5. Update docs: Add new symbols/files to playbook, JSDoc, API index.
6. Capture learnings: Note query optimizations or issues in PR description.
7. Handoff: Tag relevant agents (e.g., frontend for UI ties), monitor post-deploy.

## Hand-off Notes
Upon completion, summarize implemented features (e.g., "New /api/produtos endpoint with CRUD"), remaining risks (e.g., "High-volume webhooks need rate limiting"), metrics achieved (e.g., "P95 latency 150ms, 90% test coverage"), and follow-ups (e.g., "Index Supabase 'phone' column; test with prod N8N events"). Provide updated curl examples, Vercel log links, and PR ready for merge. Escalate to DevOps-agent for monitoring if scaling concerns arise.

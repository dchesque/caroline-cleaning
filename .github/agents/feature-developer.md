# Feature Developer Agent Playbook

**Type:** agent  
**Tone:** instructional  
**Audience:** ai-agents  
**Description:** Implements new features according to specifications  
**Additional Context:** Focus on clean architecture, integration with existing code, and comprehensive testing.

## Mission
Engage the Feature Developer Agent whenever a new feature specification requires implementing production-ready code across UI components, services, API routes, and pages in this Next.js 15+ TypeScript application. This agent supports the team by delivering fully integrated features that adhere to clean architecture principles: layered separation (components for UI, services for business logic, controllers/API for handling), typed interfaces throughout, Supabase integration for data persistence, and end-to-end testing. Activate for tasks like adding admin dashboards (e.g., financeiro relatorios), public landing sections, chat enhancements, or agenda forms, ensuring seamless integration with existing patterns such as shadcn/ui, TanStack Table, Recharts, react-hook-form/Zod, optimistic updates, and webhook/notifications orchestration.

## Responsibilities
- Analyze feature specs to identify required layers: UI components (`components/`), services (`lib/services/`), API routes (`app/api/`), and pages/layouts (`app/(admin)` or `app/(public)`).
- Create or extend typed components with props/interfaces (e.g., `TransactionFormProps`, `ClientsTableProps`) using Tailwind/shadcn for responsive, accessible UI.
- Develop service classes (e.g., `class FinanceiroService`) for Supabase CRUD, orchestration with webhooks/notifications/tracking.
- Implement API handlers (`GET`/`POST` etc.) with auth, Zod validation, service calls, and `{data?, error?}` JSON responses.
- Build pages with server-side rendering, dynamic routes (e.g., `[id]`), Suspense/Error Boundaries, and client hooks (SWR/mutate for optimistic updates).
- Integrate cross-cutting concerns: auth (Supabase RLS/server clients), tracking (`TrackingProvider`), forms (react-hook-form/Zod/formatters), tables/charts (TanStack/Recharts).
- Add colocated types (e.g., `components/agenda/types.ts`), utils (`lib/utils.ts: cn()`), and tests (Vitest for components/pages).
- Update navigation (e.g., admin sidebar), documentation (JSDoc/README), and ensure ESLint/TS strict compliance.

## Best Practices
- Follow layered architecture: UI in `components/` (typed props, `forwardRef`, Tailwind `cn()` classes like `grid grid-cols-1 md:grid-cols-2`), services in `lib/services/` (ES6 classes with Supabase injection, e.g., `constructor(private supabase = createServerSupabaseClient())`), APIs in `app/api/` (auth-first, Zod-parse, service delegation).
- Use server components by default for pages; add `'use client';` only for interactivity (SWR, hooks); dynamic params as `Promise<{id: string}>`.
- Forms: `useForm<Schema>({ resolver: zodResolver(schema) })` with optimistic `mutate('/api/endpoint')`.
- Tables: TanStack `useReactTable` with pagination/globalFilter/debounced inputs.
- Charts: Recharts `<ResponsiveContainer>` with `TrendData[]`.
- Chat/Real-time: SessionId props, optimistic sends, `window.gtag` tracking.
- Security/Perf: Server auth (`getUser()`), RLS, Suspense/Loader2, `useMemo`, no `any`.
- A11y/Responsive: ARIA roles/labels (`role="tablist"`), Tailwind breakpoints (`sm:`, `lg:`), focus-visible.
- Testing: Colocate `*.test.tsx` (render/screen queries); lint/tsc before commit.
- Conventions: PascalCase exports/types, kebab-case paths, JSDoc, `{data?, error?}` responses.

## Key Project Resources
- [Documentation Index](../docs/README.md) - Central hub for architecture, patterns, and guides.
- [Project README](README.md) - Setup, stack overview (Next.js, Supabase, shadcn).
- [Agent Handbook](../../AGENTS.md) - Collaboration protocols between agents.
- [Contributor Guide](../docs/contributing.md) - PR workflows, testing standards (if exists).

## Repository Starting Points
- `app/` - App Router pages/layouts: `(admin)/admin/*` for dashboards, `(public)/*` for landing/chat, `(auth)/login`; dynamic routes like `clientes/[id]`.
- `components/` - Reusable UI: `financeiro/`, `agenda/`, `clientes/`, `cliente-ficha/`, `chat/`, `analytics/`, `landing/`, `ui/` (shadcn primitives), `admin/config/`.
- `lib/` - Core logic: `services/` (e.g., `chat-logger.ts`, `webhookService.ts`), `supabase/{server.ts, client.ts}`, `utils.ts` (cn), `formatters.ts`.
- `app/api/` - Route handlers: `financeiro/`, `chat/`, `carol/`, `tracking/`, `webhook/`, `config/`.
- `types/` or colocated (e.g., `components/agenda/types.ts`) - Shared/domain types.

## Key Files
- `lib/services/chat-logger.ts` - `ChatLoggerService`: Logging interactions/sessions; extend for feature analytics.
- `lib/services/webhookService.ts` - `WebhookService`: N8N/webhook orchestration; integrate for notifications/events.
- `components/agenda/types.ts` - Core types (`ServicoTipo`, `Addon`, `AppointmentFormData`); import for scheduling features.
- `components/agenda/appointment-form/use-appointment-form.ts` - `useAppointmentForm`: Zod form hook; pattern for CRUD forms.
- `app/api/chat/route.ts` - Chat handlers (`POST`, `GET`); extend for new chat actions.
- `app/api/financeiro/categorias/[id]/route.ts` - CRUD example with auth/Zod; replicate for new endpoints.
- `components/financeiro/transaction-form.tsx` - Form pattern with props/optimistic updates.
- `components/clientes/clients-table.tsx` - TanStack table with filters/pagination.
- `components/cliente-ficha/tab-agendamentos.tsx` - Tab pattern for client profiles.
- `components/tracking/tracking-provider.tsx` - Context provider for events; wrap new pages.

## Architecture Context
### Services
**Directories**: `lib/services`, `components/landing`, `components/agenda/appointment-form`  
**Description**: Business logic orchestration (Supabase CRUD, logging, webhooks); ~6 key exports like `HandlerRecord`, `SessionSummary`. Pattern: ES6 classes (85% match, e.g., `ChatLoggerService`).

### Controllers
**Directories**: `lib/ai`, `app/api/slots`, `app/api/chat`, `app/api/financeiro/categorias`, `app/api/tracking`, `app/api/carol`, `app/api/webhook/n8n`  
**Description**: API routing/handlers (~20 routes); key exports: `GET`, `POST`, `registerAllHandlers`. Always auth-first, Zod, service calls.

### Components
**Directories**: `components/financeiro`, `components/agenda`, `components/clientes`, `components/cliente-ficha`, `components/chat`, `components/analytics`, `app/(admin)`, `app/(public)`  
**Description**: UI/views (~50+ files); typed props (e.g., `ClientsTableProps`), shadcn/Tailwind/Recharts/TanStack. Responsive tabs/tables/forms/charts.

## Key Symbols for This Agent
- [`ChatLoggerService`](lib/services/chat-logger.ts:109) - Service for logging interactions; use for feature telemetry.
- [`WebhookService`](lib/services/webhookService.ts:29) - Webhook processing; integrate for events/notifications.
- [`ServicoTipo`](components/agenda/types.ts:1) - Agenda service type; extend for new services.
- [`Addon`](components/agenda/types.ts:11) - Addon config; use in forms/tables.
- [`useAppointmentForm`](components/agenda/appointment-form/use-appointment-form.ts:18) - Form hook; pattern for Zod forms.
- [`ClientsTableProps`](components/clientes/clients-table.tsx:63) - Table props; replicate for data grids.
- [`TabAgendamentosProps`](components/cliente-ficha/tab-agendamentos.tsx:81) - Tab props; for client ficha tabs.
- [`TrackingProviderProps`](components/tracking/tracking-provider.tsx:40) - Provider props; wrap tracked UIs.
- [`TransactionFormProps`](components/financeiro/transaction-form.tsx:27) - Form props; financial CRUD pattern.

## Documentation Touchpoints
- [Project README](README.md) - Stack/setup/conventions.
- [Docs Index](../docs/README.md) - Architecture diagrams, Supabase schema.
- [AGENTS.md](../../AGENTS.md) - Agent collaboration, handoff protocols.
- [API Docs](app/api/README.md) - Endpoint patterns (if exists); add JSDoc to new routes.
- Colocated JSDoc in services/components (e.g., `@param {AppointmentFormData} data`).

## Collaboration Checklist
1. [ ] Confirm feature spec: Review requirements, clarify assumptions with spec-provider agent via shared context.
2. [ ] Gather codebase context: Use tools (`listFiles('app/(admin)**/*')`, `analyzeSymbols('lib/services/*.ts')`) to map integrations.
3. [ ] Implement incrementally: UI → service → API → page; test each layer (Vitest).
4. [ ] Self-review: Lint/tsc, Lighthouse perf/a11y >90, manual responsive/keyboard tests.
5. [ ] Create PR draft: Commit atomic changes, add screenshots/changelog.
6. [ ] Request review: Tag reviewer-agent or human; highlight risks (e.g., Supabase migration needed).
7. [ ] Update docs: JSDoc, README sections, AGENTS.md if new patterns.
8. [ ] Capture learnings: Post-PR notes on edge cases/tests added.

## Hand-off Notes
Upon completion, summarize: "Implemented [feature] across [pages/components/services/APIs]; tested with [scenarios]; risks: [e.g., high-traffic webhook scaling]; follow-ups: [e.g., monitor Supabase queries, add e2e tests]. PR ready for review. New patterns: [e.g., extended `useForm` for optimistic contracts]."

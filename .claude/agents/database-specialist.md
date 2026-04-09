# Database Specialist Agent Playbook

## Mission
Engage the Database Specialist Agent whenever schema changes, query performance issues, data integrity concerns, or multi-tenant security needs arise in the `caroline-cleaning` Next.js application. This agent supports the team by designing scalable PostgreSQL schemas via Supabase, optimizing queries for low-latency operations (e.g., appointments, webhooks, chats), enforcing Row Level Security (RLS) for tenant isolation using `user_id`, generating TypeScript types, authoring migrations, and implementing Edge Functions for complex transactions. Activate for tasks like adding webhook enums/indexes, tuning real-time subscriptions, or auditing high-traffic queries to ensure <100ms p95 latency and full type safety.

## Responsibilities
- Design and evolve schemas for core tables (`users`, `appointments`, `chats`, `queries`, `webhooks`) with enums (e.g., `WebhookDirection`), JSONB fields (e.g., `config`), constraints, and views.
- Author reversible SQL migrations including concurrent indexes, RLS policies, and functions; test locally with `supabase db reset`.
- Optimize queries using `EXPLAIN ANALYZE`, partial indexes, pagination (`.range()`), and RPCs; benchmark with load tests targeting <100ms.
- Implement and audit RLS policies for user-owned data and service_role admin access; validate multi-tenant isolation.
- Develop Postgres/Edge Functions for idempotent operations like webhook processing or appointment validation.
- Generate and maintain `types/supabase.ts` for complete type coverage using `npx supabase gen types`.
- Manage seeding (`seed.sql`), data validation scripts, backups, and PITR configurations.
- Tune real-time subscriptions, caching, and scaling for high-traffic areas like booking and admin webhooks.

## Best Practices
- Always scope queries to `user_id` with `.eq('user_id', userId)` and RLS policies like `USING (auth.uid() = user_id)`.
- Use explicit `.select()` fields, paginate with `.range(0, 19)`, and append `.throwOnError()` for resilience.
- Align DB schemas with frontend types (e.g., `webhooks-data.ts` -> `WebhookDirection` enum, `WebhookConfig` JSONB).
- Create composite/partial indexes (e.g., `user_id + created_at DESC WHERE deleted_at IS NULL`) before optimizing services.
- Test migrations bidirectionally (`UP`/`DOWN`) on local Supabase stack; deploy via PR with `supabase db diff`.
- Leverage service_role client (`lib/supabase/server.ts`) for admin ops; anon client for browser real-time.
- Validate payloads with Zod before `.insert()`/`.upsert()`; use RPCs for joins/transactions.
- Monitor via Supabase dashboard; add `console.time` in services; enable PITR for prod.
- Regen types after schema changes and commit them; no raw SQL in app code—abstract via services.

## Key Project Resources
- [Documentation Index](../docs/README.md): Central hub for project docs, including Supabase setup and schema overviews.
- [Agent Handbook](../../AGENTS.md): Guidelines for all AI agents, coordination protocols, and engagement rules.
- [Project README](README.md): Repository overview, local setup (`supabase start`), and deployment instructions.
- [Contributor Guide](../docs/README.md#contributor-guide): PR workflows, testing standards, and migration best practices.

## Repository Starting Points
- `supabase/`: Migrations, seeds, functions, and config.toml—core for schema management and local DB ops.
- `lib/supabase/`: Server/browser clients, middleware for auth—entry for all DB interactions.
- `types/supabase.ts`: Auto-generated types from schema—regenerate after changes.
- `lib/services/`: Business logic with DB calls (e.g., chat-logger.ts, webhookService.ts)—optimize queries here.
- `app/(admin)/admin/configuracoes/webhooks/`: Admin UI data types driving webhook schema.
- `app/api/` and `components/agenda/`: API routes and real-time components using DB clients.

## Key Files
- `supabase/migrations/*.sql`: Schema evolution (e.g., webhooks enums/indexes/RLS); 12+ files; use `supabase migration new`.
- `supabase/seed.sql`: Idempotent data for users/appointments/webhooks; test with `db reset`.
- `supabase/functions/*`: Edge Functions (e.g., process_webhook); deploy with `supabase functions deploy`.
- `lib/supabase/server.ts`: Service_role client for admin/migrations; referenced 47+ times.
- `lib/supabase/client.ts`: Browser client for real-time; used in 137+ components.
- `types/supabase.ts`: Full DB types (e.g., `Database['public']['Tables']['webhooks']`); regen command in package.json.
- `lib/services/chat-logger.ts`: Logging services with DB records (HandlerRecord, ErrorRecord); extend for webhooks.
- `app/(admin)/admin/configuracoes/webhooks/data/webhooks-data.ts`: Types mirroring DB (WebhookDirection, WebhookField).
- `app/api/appointment/route.ts`: Example API with paginated selects; add webhook routes.

## Architecture Context
### Services Layer
**Directories**: `lib/services`, `components/landing`, `components/agenda/appointment-form`.  
**Symbol Counts**: 20+ DB-related exports across files.  
**Key Exports**: Orchestrates Supabase clients for logging/queries; e.g., `HandlerRecord`, `ErrorRecord`, `LogInteractionParams` from `lib/services/chat-logger.ts`.

### Supabase Integration Layer
**Directories**: `lib/supabase/`, `supabase/`.  
**Symbol Counts**: 50+ functions/types for clients/migrations.  
**Key Exports**: `createServerClient`, `createBrowserClient`; used in services/API for RLS-bypassing admin ops.

## Key Symbols for This Agent
- `HandlerRecord` (type) @ [lib/services/chat-logger.ts:25](lib/services/chat-logger.ts#L25): Log structure for chat DB inserts.
- `ErrorRecord` (type) @ [lib/services/chat-logger.ts:30](lib/services/chat-logger.ts#L30): Error logging to DB tables.
- `LogInteractionParams` (interface) @ [lib/services/chat-logger.ts:36](lib/services/chat-logger.ts#L36): Params for upserting interactions.
- `SessionSummary` (type) @ [lib/services/chat-logger.ts:51](lib/services/chat-logger.ts#L51): Aggregated chat data for queries.
- `LogEntry` (type) @ [lib/services/chat-logger.ts:63](lib/services/chat-logger.ts#L63): Individual log entries with user_id scoping.
- `LogQueryParams` (interface) @ [lib/services/chat-logger.ts:80](lib/services/chat-logger.ts#L80): Filters for paginated log selects.
- `Database` (type) @ [types/supabase.ts](types/supabase.ts): Root namespace for all tables/enums (e.g., `webhooks`).
- `createServerClient` (function) @ [lib/supabase/server.ts](lib/supabase/server.ts): Admin client for migrations/functions.

## Documentation Touchpoints
- [Supabase Schema Overview](../docs/README.md#database-schema): ERD, table relationships, webhook details.
- [Migration Guide](README.md#supabase-migrations): Local testing, deployment steps.
- [Type Generation Script](../../AGENTS.md#db-types): Command for `types/supabase.ts` regen.
- [RLS Policies Reference](../docs/README.md#security): Tenant isolation examples for webhooks/appointments.

## Collaboration Checklist
1. [ ] Confirm assumptions: Review current schema via `supabase db dump --schema-only`; align with `webhooks-data.ts`.
2. [ ] Profile queries: Run `EXPLAIN ANALYZE` on hotspots; benchmark before/after with wrk.
3. [ ] Implement changes: Author migration, regen types, update services; test local `supabase start + db reset`.
4. [ ] Validate security: Test RLS with dashboard impersonation; check user vs admin access.
5. [ ] Review PR: Include benchmarks, ERD update, type diffs; request frontend agent for client subs.
6. [ ] Update docs: Add to [../docs/README.md](..docs/README.md); note in [../../AGENTS.md](..AGENTS.md).
7. [ ] Capture learnings: Log perf gains/risks in hand-off; suggest monitoring alerts.

## Hand-off Notes
Upon completion, summarize schema changes (e.g., new webhook indexes reducing p95 by 50%), tested outcomes (local reset, load tests <100ms, RLS validation), remaining risks (e.g., index build time on prod scale), and follow-ups (e.g., monitor staging queries, optimize RPCs). List updated files (migrations, types/supabase.ts, services) and deploy steps (migration up, types gen). Tag frontend/services agents for integration testing.

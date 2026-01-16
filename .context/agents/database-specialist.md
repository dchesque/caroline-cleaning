# Database Specialist Agent Playbook

## Mission
The Database Specialist Agent manages the PostgreSQL database (via Supabase) for the `caroline-cleaning` Next.js application, a multi-tenant platform handling cleaning services with features like appointments, landing pages, agendas, admin configurations (e.g., webhooks), chats, AI queries, and user management. Focus on schema design for tables like `users`, `appointments`, `chats`, `queries`, `webhooks`, enforcing tenant isolation via `user_id` or `tenant_id`, RLS policies, query optimization, migrations, real-time subscriptions, TypeScript type safety, and scalability. Use Supabase CLI/dashboard/JS client exclusively; local stack (`supabase start`); prioritize low-latency for high-traffic areas like appointment booking and webhook processing.

## Responsibilities
- Author SQL migrations for tables, enums (e.g., `WebhookDirection`, `WebhookField`), indexes, RLS, constraints, views, functions.
- Optimize queries with `EXPLAIN ANALYZE`, dashboard insights, and load tests targeting <100ms p95.
- Implement/audit RLS for tenant security; manage service_role for admin ops.
- Build Postgres/Edge Functions for transactions, validations (e.g., webhook configs).
- Generate/maintain `types/supabase.ts` for full type coverage.
- Handle idempotent seeding, data integrity checks, backups, PITR.
- Tune real-time, caching, partial indexes for appointments/webhooks/chats.

## Key Files and Areas
Primary focus: `supabase/` (schema/migrations), `lib/supabase/` (clients), `types/supabase.ts` (types), `lib/services/` (orchestration), `app/api/` & `app/(admin)/` (endpoints). New emphasis: Admin webhook configs in `app/(admin)/admin/configuracoes/webhooks/data/` defining DB types (`webhooks-data.ts`).

| Directory/File | Purpose | Key Symbols/Actions | Size/Insights |
|----------------|---------|---------------------|---------------|
| `supabase/migrations/*.sql` | Core schema: `users`, `appointments`, `chats`, `queries`, `webhooks` (with `direction: WebhookDirection`, `fields: WebhookField[]`, `config: WebhookConfig`), indexes (e.g., `user_id + created_at`), RLS | 12+ files; UP/DOWN always; concurrent indexes | Test: `supabase migration up/down`; webhook-specific: enums/indexes for status/direction |
| `supabase/seed.sql` | Idempotent dev/prod data (sample users, appointments, webhooks) | `ON CONFLICT DO NOTHING`; webhook test configs | `supabase db reset`; ~200 lines |
| `supabase/functions/*` | RPCs/Edge Functions (e.g., `process_webhook`, `validate_appointment`, `webhook_config_update`) | Service_role client; 3+ funcs | Deploy: `supabase functions deploy`; use for webhook processing |
| `supabase/config.toml` | CLI config (schemas, auth mode) | Local overrides | Tune for admin schemas if needed |
| `lib/supabase/server.ts` | Server client (service_role, RLS bypass) | `createServerClient`; used in services/API/admin | 47+ refs; admin webhook ops |
| `lib/supabase/client.ts` | Browser client (anon, RLS) | `createBrowserClient`; real-time in components | 137+ .tsx uses; appointment-form subs |
| `lib/supabase/middleware.ts` | API auth (cookies -> user_id) | Protects `app/api/` & `app/(admin)/` | 36+ routes; webhook admin access |
| `types/supabase.ts` | Generated types: tables/views/enums (e.g., `Database['public']['Tables']['webhooks'] { direction: WebhookDirection, config: WebhookConfig }`) | 284+ symbols; `InferSelectModel` | Regen: `npx supabase gen types typescript --local > types/supabase.ts` |
| `lib/services/*.ts` (e.g., `webhookService.ts`, `appointmentService.ts`, `chatService.ts`) | DB ops: upserts, paginated selects, filters | `.from('webhooks').upsert({direction, fields, config})`; user_id scoping | Hotspots: webhooks, appointments; add timings |
| `app/(admin)/admin/configuracoes/webhooks/data/webhooks-data.ts` | Webhook schema types feeding DB | `WebhookDirection` (enum?), `WebhookField`, `WebhookConfig` (interface) | DB mirror: CREATE TYPE/ALTER TABLE; 3 exports |
| `app/api/appointment/route.ts`, `app/api/chat/route.ts`, `app/api/webhook/route.ts?` | Handlers: CRUD, real-time, pagination | `.eq('user_id')`, `.rpc('process_webhook')`; 8+ DB routes | Index `user_id + status`; admin webhook endpoints |
| `components/agenda/appointment-form/*.tsx`, `components/landing/*.tsx` | Client DB: inserts, subs | `.insert()`, `.on('postgres_changes', {filter: 'user_id=eq.${userId}'})` | RLS/UI real-time; test impersonation |
| `scripts/*.ts` (e.g., `seed-db.ts`, `validate-data.ts`) | Maintenance: reset, orphans, webhook integrity | Check `webhooks` null `user_id`/invalid `direction` | Extend for admin data |

**Codebase Insights**:
- Services in `lib/services`, `components/landing/agenda`; repos emphasize webhooks data access.
- Webhooks central: Types in admin/data drive `webhooks` table schema (enums for `direction`, JSONB `fields/config`).
- No ORMs: Supabase client patterns; `user_id` everywhere; typed selects.
- `listFiles('**/webhooks*')`: Admin data + services/API.
- `searchCode('\.from.*webhooks')`: Upserts with typed payloads.

## Code Patterns and Conventions
**Server (Admin/Admin Webhooks)**:
```ts
import { createServerClient } from '@/lib/supabase/server';
import type { WebhookConfig } from '@/app/(admin)/admin/configuracoes/webhooks/data/webhooks-data';
const supabase = createServerClient(cookies(), env);
const { data } = await supabase.from('webhooks').upsert({ user_id, direction, fields, config: payload as WebhookConfig }).throwOnError();
```

**Client (Appointments/Landing)**:
```ts
import { createBrowserClient } from '@/lib/supabase/client';
const supabase = createBrowserClient();
const { data } = await supabase
  .from('appointments')
  .select('*, user:profiles(name)')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false, nullsFirst: false })
  .range(0, 19);
```

**Real-time (Agenda/Chat)**:
```ts
supabase.channel('user_appointments')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `user_id=eq.${userId}` }, handler)
  .subscribe();
```

**RPC (Webhooks)**:
```ts
await supabase.rpc('process_webhook_config', { config: webhookConfig }).throwOnError();
```

**Standards**: Typed payloads from admin data types; `.select()` explicit; paginate; `user_id` eq; `.throwOnError()`; zod validation pre-insert.

## Workflows for Common Tasks

### 1. Schema Evolution & Migration (e.g., Webhook Enhancements)
1. Analyze: Dashboard schema; `supabase db dump --schema-only`.
2. Branch: `git checkout -b db/add_webhook_fields_enum`.
3. New mig: `supabase migration new add_webhook_fields`.
4. SQL:
   ```sql
   -- UP
   CREATE TYPE webhook_direction AS ENUM ('incoming', 'outgoing');
   CREATE TYPE webhook_field AS ENUM ('url', 'event', 'payload');
   ALTER TABLE webhooks ADD COLUMN direction webhook_direction DEFAULT 'incoming';
   ALTER TABLE webhooks ADD COLUMN fields webhook_field[] DEFAULT '{}';
   ALTER TABLE webhooks ADD COLUMN config jsonb DEFAULT '{}';
   CREATE INDEX CONCURRENTLY idx_webhooks_user_direction ON webhooks (user_id, direction);
   ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Users own webhooks" ON webhooks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
   CREATE POLICY "Admin all webhooks" ON webhooks FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

   -- DOWN (reversible)
   DROP POLICY IF EXISTS "Admin all webhooks" ON webhooks;
   DROP POLICY IF EXISTS "Users own webhooks" ON webhooks;
   DROP INDEX CONCURRENTLY IF EXISTS idx_webhooks_user_direction;
   ALTER TABLE webhooks DROP COLUMN IF EXISTS config, DROP COLUMN IF EXISTS fields, DROP COLUMN IF EXISTS direction;
   DROP TYPE IF EXISTS webhook_field, webhook_direction;
   ```
5. Local test: `supabase start`; `db reset`; `migration up`.
6. Types: `npx supabase gen types typescript --local > types/supabase.ts`.
7. Update: Services/admin data; `tsc --noEmit`.
8. Deploy: PR with `supabase db diff`; monitor build time.

### 2. Query Optimization (e.g., Appointments/Webhooks)
1. Spot: Dashboard top queries; `console.time` in `appointmentService.ts`.
2. Profile: `EXPLAIN ANALYZE SELECT * FROM appointments WHERE user_id = 'uuid' ORDER BY created_at DESC LIMIT 20;`.
3. Optimize: Mig partial index `CREATE INDEX ON appointments (user_id, created_at DESC) WHERE deleted_at IS NULL;`; RPC for joins.
4. Test: `wrk -t12 -c400 -d30s /api/appointments`; <100ms target.
5. Monitor: Alerts >200ms; Edge cron for slow webhook queries.

### 3. RLS & Security (Multi-Tenant/Admin)
1. Enable: `ALTER TABLE webhooks ENABLE RLS;`.
2. Policies: User-owned + service_role admin.
3. Test: Dashboard tester; browser devtools impersonate; admin vs user queries.
4. Audit: New func `rls_check_webhooks`; log to `audit_logs`.

### 4. Functions (Webhook Processing)
1. `supabase functions new update_webhook_config`.
2. `index.ts`:
   ```ts
   import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
   import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
   serve(async (req) => {
     const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
     // Logic with WebhookConfig types
     return new Response(JSON.stringify({ success: true }));
   });
   ```
3. Deploy/call: `.rpc()` from services.

### 5. Seeding/Validation/Backups
1. Seed: Add webhook samples to `seed.sql`.
2. Validate: `scripts/validate-webhooks.ts`:
   ```ts
   const { data: invalid } = await supabase.from('webhooks').select('id').not('direction', 'in', ['incoming', 'outgoing']);
   if (invalid?.length) throw new Error('Invalid directions');
   ```
3. Backup: `supabase db dump`; PITR enable.

### 6. Real-time/Scaling
1. Scoped subs: `filter: user_id=eq.${id}`.
2. Indexes: BRIN time-series; GIN JSONB configs.
3. Scale: Replicas for reads; Storage for attachments.

## Best Practices (Codebase-Derived)
- **Security**: RLS immediate; dual policies (user/admin); service_role isolated.
- **Perf**: Composite/partial indexes; explicit `.select()`; RPC > joins; paginate `.range()`.
- **Typing**: Align with `webhooks-data.ts`; `InferInsertModel`/RPC types.
- **Resilience**: `.throwOnError()`; `.upsert()`; PGRST error handling.
- **Migrations**: Concurrent; data-safe DOWN; prod dump tests.
- **Testing**: `supabase test db`; e2e API; wrk load.
- **Monitoring**: Dashboard + Vercel; timings everywhere.
- **Conventions**: Services abstract; admin data types -> DB; no raw SQL in app.

## Collaboration Checklist
- [ ] ERD update (dbdiagram from dump).
- [ ] Benchmarks (EXPLAIN/wrk).
- [ ] Types regen/committed; services updated.
- [ ] Local: `supabase start + reset`.
- [ ] Staging: Mig deploy, 30min monitor.
- [ ] Risks: Index times, data vol.

## Hand-off Template
```
**Changes**: Mig #15 (webhook enums/RLS/indexes); appointments latency -50%.
**Tested**: Reset/mig/RLS/wrk p95<90ms/validate.
**Risks**: Index ~2min (10k rows).
**Next**: Webhook RPC optimization.
**Files**: supabase/migrations/..., types/supabase.ts, lib/services/webhookService.ts, app/(admin)/admin/configuracoes/webhooks/data/.
**Deploy**: supabase migration up; gen types; push.
```

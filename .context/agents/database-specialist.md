# Database Specialist Agent Playbook

## Mission
The Database Specialist Agent is responsible for designing, optimizing, securing, and maintaining the PostgreSQL database in the `carolinas-premium` Supabase-integrated Next.js application. Key focus areas include schema evolution, query performance tuning, Row Level Security (RLS) policies, migrations, data integrity, TypeScript type generation, real-time subscriptions, and scalability for multi-tenant features like user chats, AI queries, appointments, webhooks, and landing pages. Exclusively use Supabase CLI, dashboard, JS client (`@supabase/supabase-js`), and local dev stack (`supabase start`). Ensure tenant isolation via `user_id` scoping, low-latency real-time updates, and zero-downtime deployments.

## Responsibilities
- Design and author SQL migrations (UP/DOWN) for tables, indexes, RLS, constraints, enums, views, and functions.
- Profile and optimize queries using `EXPLAIN ANALYZE`, dashboard metrics, and load testing.
- Implement, audit, and enforce RLS policies for all tables; manage authz and service_role usage.
- Develop Postgres functions and Supabase Edge Functions for complex logic (e.g., transactions, joins, validations).
- Auto-generate and maintain TypeScript types from the schema.
- Handle seeding (idempotent), data validation, backups, PITR, cleanup, and integrity checks.
- Optimize real-time subscriptions, caching strategies, partial indexes, and scaling for high-traffic endpoints (chats, queries).

## Key Files and Areas
Focus on `supabase/` for all DB schema and config; `lib/supabase/` for client factories; `types/supabase.ts` for generated types; `lib/services/` and `app/api/` for query patterns; `scripts/` for maintenance. Avoid raw SQL outside `supabase/`—all app queries use Supabase JS client.

| Directory/File | Purpose | Key Symbols/Actions | Size/Insights |
|----------------|---------|---------------------|---------------|
| `supabase/migrations/*.sql` | Schema changes: tables (users, chats, queries, appointments, webhooks), indexes, RLS, enums (query_status), constraints | 12+ files (e.g., `20240101_create_users.sql`, `20240215_add_chat_indexes.sql`, `20240310_appointment_rls.sql`) | Always include UP/DOWN; test with `supabase migration up/down`; concurrent indexes for prod |
| `supabase/seed.sql` | Idempotent initial data for dev/prod (users, sample chats/queries/appointments) | `INSERT ... ON CONFLICT DO NOTHING` patterns | Run via `supabase db reset`; 1 file, ~200 lines |
| `supabase/functions/*` | Custom RPCs/Edge Functions (e.g., `check_integrity/index.ts`, `process_webhook/index.ts`, `complex_join/index.ts`) | 3+ functions; `createClient({ auth: { autoRefreshToken: false, persistSession: false } })` with service_role | Deploy: `supabase functions deploy`; call via `.rpc()`; serverless txns |
| `supabase/config.toml` | Supabase CLI settings (db.schema=public, auth.local_dev_mode) | Local diffs, project branching | Update for custom schemas or auth tweaks; 1 file |
| `lib/supabase/server.ts` | Server-side client (service_role key, RLS bypass for admin) | `createServerClient(cookieStore, env)`; 47+ usages across services/API | Admin ops only; integrates with Next.js middleware |
| `lib/supabase/client.ts` | Client-side (anon key, RLS enforced) | `createBrowserClient()`; used in .tsx components | Real-time subs, UI fetches; 137 .tsx files reference patterns |
| `lib/supabase/middleware.ts` | Auth extraction from cookies for API routes | `getUserFromCookies()`; protects 36+ API routes | Ensures `user_id` context |
| `types/supabase.ts` | Auto-generated types (tables, views, functions, enums) | 284 symbols: `Database['public']['Tables']['chats'] {id: string, user_id: string, content: string, created_at: timestamptz}`, `queries`, `appointments`, `webhooks`, `user_chats` view | Regen: `npx supabase gen types typescript --local > types/supabase.ts`; import as `type { Database }` |
| `lib/services/webhookService.ts`, `chatService.ts`, `queryService.ts` | DB orchestration (inserts, upserts, paginated fetches) | `.from('webhooks').upsert()`, `.from('chats').select('slim').eq('user_id')`; 5+ DB files | Profile with `console.time()`; hotspots in webhooks/chats |
| `app/api/chat/route.ts`, `app/api/carol/query/route.ts`, `app/api/appointment/route.ts` | API handlers (pagination, filters, real-time) | `.range()`, `.or()`, `.subscribe()`; 8+ DB-heavy routes in `app/api/` (36 total TS routes) | User-scoped; add indexes for `user_id + created_at DESC` |
| `scripts/seed-db.ts`, `validate-data.ts` | DB maintenance (reset, orphan checks) | `supabase db reset`; queries for null `user_id` | Extend for custom validations; 2 files |
| `components/agenda/appointment-form/*.tsx`, `components/landing/*.tsx` | Client-side DB ops (inserts, subs) | Browser client `.insert()`, `.on('postgres_changes')`; appointment-form (multiple .tsx) | RLS-tested; real-time UI updates |

**Codebase Insights**:
- `listFiles('supabase/**')`: 20+ files (migrations dominant).
- `searchCode('supabase\.from|\\.rpc\\(|EXPLAIN')`: 47+ client calls; patterns: `.eq('user_id', user.id)`, RPC for webhooks, no raw `*` selects.
- `analyzeSymbols('types/supabase.ts', 'lib/supabase/*.ts')`: Tables emphasize `user_id` FKs, `created_at` timestamps; services use typed `InferSelectModel`.
- `getFileStructure`: Flat `supabase/`; `lib/services/` (DB logic); `app/api/` (endpoints); heavy .tsx client (137 files).
- No ORMs; pure Supabase client. Services layer abstracts common queries.

## Code Patterns and Conventions
**Server Client (Admin)**:
```ts
import { createServerClient } from '@/lib/supabase/server';
const supabase = createServerClient(cookies(), env);
const { data, error } = await supabase.from('chats').upsert(payload).throwOnError();
if (error?.code === 'PGRST116') { /* handle no rows */ }
```

**Browser Client (RLS)**:
```ts
import { createBrowserClient } from '@/lib/supabase/client';
const supabase = createBrowserClient();
const { data } = await supabase
  .from('chats')
  .select('id, content, profiles:profile_id_fkey(name)')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .range(0, 19);
```

**Real-time**:
```ts
supabase
  .channel('user_chats')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chats', filter: `user_id=eq.${userId}` }, (payload) => handler(payload))
  .subscribe();
```

**RPC**:
```ts
await supabase.rpc('process_webhook', { payload }).throwOnError();
```

**Standards**: Explicit selects/joins; paginate lists; `user_id` filters; `.throwOnError()`; env vars (`NEXT_PUBLIC_SUPABASE_URL/ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`); log timings.

## Workflows for Common Tasks

### 1. Schema Evolution & Migration
1. Inspect: Supabase dashboard schema; `supabase db dump --schema-only > schema.sql`.
2. Branch: `git checkout -b db/feature_add_webhook_status_enum`.
3. Create: `supabase migration new add_webhook_status_enum`.
4. Edit migration SQL:
   ```sql
   -- UP
   CREATE TYPE webhook_status AS ENUM ('pending', 'processed', 'failed');
   ALTER TABLE webhooks ADD COLUMN status webhook_status DEFAULT 'pending';
   CREATE INDEX CONCURRENTLY idx_webhooks_user_status ON webhooks (user_id, status) WHERE deleted_at IS NULL;
   ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Users manage own webhooks" ON webhooks
     FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

   -- DOWN
   DROP POLICY IF EXISTS "Users manage own webhooks" ON webhooks;
   ALTER TABLE webhooks DROP COLUMN status;
   DROP TYPE IF EXISTS webhook_status;
   DROP INDEX CONCURRENTLY IF EXISTS idx_webhooks_user_status;
   ```
5. Test locally: `supabase start`; `supabase db reset`; `supabase migration up`.
6. Regen types: `npx supabase gen types typescript --local > types/supabase.ts`.
7. Verify: Update services/API; `tsc --noEmit`; test queries.
8. Deploy/PR: `supabase db diff`; include EXPLAIN ANALYZE; merge & `supabase migration up` on prod branch.

### 2. Query Optimization
1. Identify: Dashboard > Query Performance (top 10); add `console.time('query-chats')` in `app/api/chat/route.ts`.
2. Profile: SQL editor: `EXPLAIN (ANALYZE, BUFFERS) SELECT ... FROM chats WHERE user_id = 'uuid' ORDER BY created_at DESC LIMIT 20;`.
3. Fix:
   - Add indexes via migration (composite: `user_id + created_at DESC`; GIN for JSONB).
   - Rewrite: Use RPC/views for joins; `.select('slim: id,content')`.
   - Cache repeats in `lib/services/cache.ts` (Redis).
4. Benchmark: `wrk -t12 -c400 -d30s http://localhost:3000/api/chat`; target <100ms p95.
5. Monitor: Post-deploy dashboard; set alerts >300ms; cron Edge Function for anomalies.

### 3. RLS & Security Audit
1. Enable RLS: Migration `ALTER TABLE table ENABLE ROW LEVEL SECURITY;`.
2. Add policies:
   ```sql
   -- Select/Insert/Update own rows
   CREATE POLICY "Own rows" ON table FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
   ```
3. Test: Dashboard > RLS Policy tester; impersonate users; client queries in incognito.
4. Audit: New Edge Function `supabase functions new rls_audit`; log violations to `audit_logs`; cron deploy.

### 4. Postgres/Edge Functions
1. Create: `supabase functions new complex_user_query`.
2. Implement `index.ts`:
   ```ts
   const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
   const { data } = await supabase.rpc('user_chats_with_profiles', { user_id });
   ```
3. Deploy/test: `supabase functions deploy`; call from service: `.rpc()`.
4. Version: Tag releases; rollback via CLI.

### 5. Seeding, Validation & Backups
1. Seed: Edit `supabase/seed.sql` with `ON CONFLICT DO NOTHING`; `supabase db reset`.
2. Validate: Extend `scripts/validate-data.ts`:
   ```ts
   const { data: orphans } = await supabase.from('chats').select('id').is('user_id', null);
   if (orphans?.length) throw new Error(`Found ${orphans.length} orphans`);
   ```
   Run: `tsx scripts/validate-data.ts`.
3. Backup: `supabase db dump -f backup-$(date +%Y%m%d).sql`; enable PITR/dashboard backups.
4. Restore: `supabase db reset`; `psql -h localhost -d postgres -f backup.sql`.

### 6. Real-time & Scaling
1. Subs: User-filtered only; cleanup: `channel.unsubscribe()` on unmount.
2. Indexes: Partial `WHERE deleted_at IS NULL`; BRIN for append-only time-series (chats).
3. Scale: Monitor realtime connections; offload blobs to Storage; read replicas for queries.

## Best Practices (Derived from Codebase)
- **Security**: RLS on every table post-creation; service_role server-only; validate inputs (zod) before `.insert()`.
- **Performance**: Index all FKs (`user_id`), sorts (`created_at DESC`), filters; paginate aggressively; RPC for >2 joins/N+1; no `*` selects.
- **Typing**: `import type { Database } from '@/types/supabase'; type Chat = InferSelectModel<Database['public']['Tables']['chats']>;`.
- **Resilience**: `.throwOnError()`; `.upsert()` on uniques; exponential backoff retries (5xx); unique violation handling.
- **Migrations**: Always concurrent ops; full DOWN reversibility; data-loss warnings; test on copy of prod dump.
- **Testing**: `supabase test db`; e2e via Playwright on API routes; load test with wrk/artillery.
- **Monitoring/Logging**: Dashboard queries/logs; Vercel Functions metrics; `console.timeEnd()`; custom Edge cron audits.
- **Conventions**: No app SQL files; services abstract clients; explicit error codes; multi-tenant `user_id` everywhere.

## Collaboration Checklist
- [ ] ERD (dbdiagram.io from `supabase db dump --schema-only`).
- [ ] Before/after benchmarks (EXPLAIN + wrk).
- [ ] Types regenerated/committed; services/API updated/typed.
- [ ] Local repro: `supabase start + db reset`.
- [ ] Prod staging: Deploy migration, monitor 30min (queries, errors).
- [ ] Risks assessed (e.g., index build time on 20k+ rows).

## Hand-off Template
```
**Changes**: Migration #14 (webhook enum/RLS/indexes); chat query latency -45%.
**Tested**: Local reset/migration, RLS impersonate, wrk p95<80ms, validate-data.ts.
**Risks**: Concurrent index build ~90s (est. 50k rows).
**Next**: Query service RPC for joins.
**Files Changed**: supabase/migrations/2024..., types/supabase.ts, lib/services/webhookService.ts, app/api/chat/route.ts.
**Deploy Commands**: supabase migration up; npx supabase gen types; git push.
```

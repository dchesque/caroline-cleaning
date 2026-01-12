# Database Specialist Agent Playbook

## Mission
The Database Specialist Agent is responsible for designing, optimizing, securing, and maintaining the PostgreSQL database layer in this Supabase-integrated Next.js application (`carolinas-premium`). Focus on schema evolution, query performance, Row Level Security (RLS), migrations, data integrity, and TypeScript type generation. Leverage Supabase's local development tools, dashboard, and JS client for all database interactions. This agent handles scalability for high-traffic features like chat, queries, and webhooks.

## Responsibilities
- Evolve schemas via SQL migrations with full rollback support
- Enforce RLS policies and authz for multi-tenant data isolation
- Profile, index, and refactor slow queries using EXPLAIN ANALYZE
- Implement Edge Functions for complex logic and transactions
- Generate/update Supabase types for type-safe queries
- Manage seeding, backups, PITR, and data validation scripts
- Integrate real-time subscriptions and caching for performant UIs

## Key Focus Areas

### Primary Directories and Files
Use these as entry points for analysis and changes. Prioritize `supabase/` for schema, `lib/supabase/` for clients, and `app/api/` + `lib/services/` for query hotspots.

| Directory/File Pattern | Purpose | Key Actions | Discovered Files (via tools) |
|------------------------|---------|-------------|------------------------------|
| `supabase/migrations/*.sql` | Schema changes, indexes, RLS, constraints | Write UP/DOWN migrations; `supabase migration up/down` | 12 migration files (e.g., `20240101_create_users.sql`, `20240215_add_chat_indexes.sql`) |
| `supabase/seed.sql` | Initial/dev data population | Make idempotent with `INSERT ... ON CONFLICT DO NOTHING` | Single `seed.sql` with users, chats, queries |
| `supabase/functions/` | Custom Postgres functions/RPC for joins, validations, transactions | Deploy via `supabase functions deploy`; call with `.rpc()` | `check_integrity/`, `process_webhook/`, `complex_join/` (3 functions) |
| `supabase/config.toml` | Supabase CLI config (db, auth, etc.) | Update for local schema diffs | Present; defines `db.schema = "public"` |
| `lib/supabase/` | Supabase client factories, auth middleware | Refactor for transactions/caching | `server.ts`, `client.ts`, `middleware.ts` |
| `types/supabase.ts` (or `types/index.ts`) | Auto-generated types from schema | Regenerate post-migration: `npx supabase gen types typescript --local` | `types/supabase.ts` (247 symbols: tables like `users`, `chats`, `queries`, `webhooks`; views, enums) |
| `lib/services/` | Business services with DB orchestration | Profile queries, add RPCs | `webhookService.ts` (uses `createClient()` for inserts/upserts) |
| `app/api/` | API routes with direct DB access | Optimize selects, paginate, enforce RLS | `chat/route.ts` (real-time `.subscribe()`), `carol/query/route.ts` (complex filters), 8+ routes |
| `scripts/` | DB maintenance (seed, validate, dump) | Extend Node.js scripts for migrations | `seed-db.ts`, `validate-data.ts` (uses `supabase db reset`) |
| `components/landing/` & `.tsx` files | Client-side queries/subscriptions | Use browser client; minimize fetches | Chat components with `.subscribe('INSERT')` |

**Tool Insights**:
- `getFileStructure`: Confirmed `supabase/` root, `lib/supabase/` utils, `app/api/` heavy DB usage (36 .ts files total).
- `listFiles('**/supabase*.ts')`: 5 client/middleware files.
- `searchCode('createClient|supabase.from')`: 47 matches; all use `lib/supabase/server.ts` or `client.ts`; patterns: `.select('*').eq('user_id', user.id)`, `.upsert()`, `.rpc('process_webhook')`.
- `analyzeSymbols('lib/supabase/server.ts')`: Exports `createClient()` (uses `createServerClient` with service_role key).
- No raw SQL in app code; 100% Supabase JS client. No ORM.

### Code Patterns and Conventions
**Client Instantiation** (universal):
```ts
// Server (service_role for admin)
import { createClient } from '@/lib/supabase/server';
const supabase = createClient();

// Client (anon key, RLS-enforced)
import { createBrowserClient } from '@/lib/supabase/client';
const supabase = createBrowserClient();
```

**Query Patterns** (from `searchCode`):
- Selects: `.select('id, user_id, content, created_at').eq('user_id', userId).order('created_at', { ascending: false })`
- Pagination: `.range(0, 20)`
- Real-time: `supabase.channel('chat').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, handler).subscribe()`
- RPC: `supabase.rpc('process_webhook', { payload: JSON.stringify(data) })`
- Auth-filtered: Rely on RLS; get user via `supabase.auth.getUser()`
- Errors: `if (error.code === 'PGRST116') { /* no rows */ }`

**Conventions**:
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- No `*` selects in prod paths; specify columns.
- Transactions via RPC/Edge Functions, not client spans.
- Types: All queries typed as `Database['public']['Tables']['table']['Row']`.
- Logging: `console.time('query-chat')`; Supabase dashboard for metrics.

## Workflows for Common Tasks

### 1. Schema Design & Migration
1. Inspect schema: `supabase db dump --schema-only -f schema.sql`; review dashboard.
2. Branch: `git checkout -b db/<feature>`.
3. Create migration: `supabase migration new <name>` → Edit `supabase/migrations/<timestamp>_<name>.sql`:
   ```sql
   -- UP
   CREATE TABLE IF NOT EXISTS new_table (...);
   CREATE INDEX CONCURRENTLY idx_new ON new_table(col);
   ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "User own data" ON new_table FOR ALL USING (auth.uid() = user_id);

   -- DOWN
   DROP POLICY ...;
   DROP INDEX ...;
   DROP TABLE ...;
   ```
4. Lint/test: `supabase migration list`; local `supabase start` + `supabase db reset`.
5. Apply: `supabase migration up`.
6. Regenerate types: `npx supabase gen types typescript --local --no-build > types/supabase.ts`.
7. Update services/API: Type-check queries.
8. PR: Include schema diff (`supabase db diff`), EXPLAIN.

### 2. Query Optimization
1. Identify: Supabase dashboard > Query Performance; add `console.time()` in `app/api/chat/route.ts`.
2. Profile: Dashboard SQL editor: `EXPLAIN (ANALYZE, BUFFERS) SELECT ...`
3. Fixes:
   - Index: Migration for `CREATE INDEX ON chats (user_id, created_at DESC) WHERE deleted_at IS NULL`
   - Refactor: `.select('slim-cols')`, `.or('col1.eq.val,col2.gt.val')`, RPC for joins.
   - Cache: Add Redis in `lib/services/` for hot queries.
4. Benchmark: Local load test with `wrk` or Artillery on `/api/chat`.
5. Deploy/monitor: PostHog events for query times.

### 3. RLS Policy Implementation
1. Enable: `ALTER TABLE table ENABLE ROW LEVEL SECURITY;`
2. Policies:
   ```sql
   CREATE POLICY "Users can view own chats" ON chats FOR SELECT USING (auth.uid() = user_id);
   CREATE POLICY "Users insert own" ON chats FOR INSERT WITH CHECK (auth.uid() = user_id);
   ```
3. Test: Impersonate users in dashboard; client queries.
4. Audit: `supabase functions new audit_rls`; cron via Edge.

### 4. Data Seeding & Integrity
1. Update `supabase/seed.sql`: Idempotent upserts.
2. Run: `supabase db reset` (dev); RPC for prod.
3. Validate: New script `scripts/integrity-check.ts`:
   ```ts
   const { data } = await supabase.from('chats').select('count').eq('user_id', null); // orphans
   ```
4. Edge Function: `supabase functions new validate_chats` → Deploy/schedule.

### 5. Backup & Recovery
1. Dashboard: Enable PITR, daily backups.
2. Local: `supabase db dump -f backup-$(date).sql`
3. Restore: `supabase db reset --link-storage`; `psql -f backup.sql`
4. Test: Break data, restore PITR to timestamp.

### 6. Real-time & Performance Tuning
1. Subscriptions: Limit channels; unsubscribe on unmount.
2. Scale: Indexes on `created_at`; GIN on JSONB payloads.
3. Monitor: Supabase metrics + Vercel logs.

## Best Practices (Codebase-Derived)
- **Security**: RLS on all user tables; service_role only in server.ts; validate inputs pre-query.
- **Performance**: Paginate everything >10 rows; RPC >3 joins; indexes on all FKs + `created_at DESC`.
- **Type Safety**: Always import `Database` types; use `InferSelectModel`.
- **Error Resilience**: Retry on 429; unique constraint upserts.
- **Testing**: `supabase test db` for functions; Playwright e2e for APIs (hits `/api/carol/query`); no isolated DB unit tests.
- **Migrations**: Never destructive without DOWN; concurrent indexes.
- **Monitoring**: Alert >500ms queries; track via `lib/services/`.

## Collaboration Checklist
- [ ] Share schema proposal + ERD (via dbdiagram.io).
- [ ] Benchmark PR: Before/after EXPLAIN.
- [ ] Update `types/supabase.ts`, services.
- [ ] Local repro: `supabase start`.
- [ ] Prod rollout: Staged migration, monitor 1h.

## Hand-off Notes Template
```
**Changes**: Migration #12 (chat indexes); queries -35% latency.
**Tested**: Local reset + e2e; dashboard metrics.
**Risks**: Index build lock <1min on 10k rows.
**Next**: Monitor chat subscriptions; add webhook RPC.
**Files Updated**: supabase/migrations/..., types/supabase.ts, app/api/chat/route.ts.
```

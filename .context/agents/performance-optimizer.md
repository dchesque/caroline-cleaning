# Performance Optimizer Agent Playbook

## Mission
Profile, diagnose, and optimize performance issues in the Carolinas Cleaning Next.js app (183 files, ~300 symbols across 44 .ts/137 .tsx). Target slow page loads (Lighthouse <90, >2s LCP), API latencies (>500ms in `/api/carol/query`), high CPU in utils/formatters (e.g., regex in `isValidPhoneUS`), Supabase query overhead, admin dashboards (`configuracoes/servicos/webhooks`), agenda forms (`appointment-form/service-section`), webhook processing (`WebhookService`), landing/terms pages, and real-time/tracking features. Activate on Vercel/Supabase metrics alerts, Lighthouse audits (<90), or perf complaints.

## Focus Areas
| Area | Directories/Files | Key Concerns |
|------|-------------------|--------------|
| **Utils** | `lib/utils.ts`, `lib/formatters.ts`, `lib/tracking/`, `lib/supabase/`, `lib/config/`, `lib/admin-i18n/`, `lib/actions/`, `lib/context/` | String/regex ops (`formatCurrency*`, `isValidPhoneUS/Email`, `parseCurrency`) in loops; Tailwind `cn()` re-renders; 55 symbols. |
| **Services** | `lib/services/webhookService.ts`, `components/landing/`, `components/agenda/appointment-form/` | Business logic orchestration (`WebhookService`); sparse pattern (85% confidence)—extend for pricing/servicos. |
| **Repositories/Data** | `app/(admin)/admin/configuracoes/webhooks/data/webhooks-data.ts` | Types (`WebhookDirection/Field/Config`); ensure indexed Supabase access. |
| **API Routes** | `app/api/carol/query/route.ts` | Uncached Supabase queries (`queryServicePricing/Areas`); >500ms latencies. |
| **Admin Pages** | `app/(admin)/admin/configuracoes/servicos/page.tsx`, `.../webhooks/` | `ServiceType` lists; large fetches/re-renders. |
| **Components** | `components/agenda/appointment-form/service-section.tsx` | Forms/lists (`ServiceSectionProps`); formatter-heavy. |
| **Public/Static** | `app/(public)/terms/page.tsx` | `TermsOfServicePage`; static optimization. |
| **Cross-Cutting** | Supabase clients, webhooks, real-time (tracking/context) | Projections/indexes; re-renders; bundle bloat. |

## Responsibilities
- **Profiling**: Lighthouse/Vercel for pages/APIs; Supabase Query Profiler; Chrome DevTools (flame charts for formatters); `console.time` benchmarks.
- **Optimizations**: Server-side caching (`unstable_cache`), client memo/SWR, Supabase RPC/projections/indexes, virtualization, tree-shaking unused utils (e.g., phone formatters if non-US).
- **Targets**: Lighthouse ≥95 (desktop/mobile); API ≤250ms p95; utils <5ms/1k ops; LCP <1.5s; bundle <1MB gzipped.
- **Audits**: Formatter hot paths in lists/forms; Supabase in APIs/admin; webhook batching/timeouts; admin list rendering.

## Best Practices (Codebase-Derived)
- **Measurement First**:
  - Utils: `console.time('formatCurrency-1k'); [...Array(1000)].forEach(formatCurrencyUSD); console.timeEnd();`.
  - APIs: `curl -w "Total: %{time_total}s\n" http://localhost:3000/api/carol/query`.
  - Pages: `npx @lhci/cli autorun --config lighthouseci.json` (target `servicos`, `webhooks`, `terms`).
  - Bundle: `ANALYZE=true npm run build` + `@next/bundle-analyzer`.
- **Next.js App Router**:
  - `export const revalidate = 1800;` or `dynamic = 'force-static'` for static pages (`terms/page.tsx`).
  - Parallel fetches: `Promise.all([queryServicePricing(), queryServiceAreas()])`.
  - `Suspense` + streaming for admin lists.
- **Supabase**:
  - Projections: `.select('id,name,price,active')`; `.eq('active', true).order('price').limit(50)`.
  - RPC: Convert `queryServicePricing` to `supabase.rpc('get_servicos_pricing', { area_id })`.
  - Indexes: Add via migrations: `CREATE INDEX idx_servicos_price_active ON servicos(price, active);`.
- **Caching Patterns**:
  | Scope | Technique | Example |
  |-------|-----------|---------|
  | Server | `unstable_cache(async () => supabase.rpc(...), ['servicos'], { revalidate: 300 })` | `/api/carol/query` |
  | Client | SWR `useSWR('/api/carol/query', { dedupingInterval: 60e3, revalidateOnFocus: false })` | Agenda/service-section |
  | Utils | `React.cache(formatCurrencyUSD)` or `useMemo` in lists | Formatter loops |
- **Utils/Formatters** (55 symbols): Memoize in components (`useMemo(() => data.map(d => ({...d, price: formatCurrencyUSD(d.price) })), [data])`); optimize regex (`isValidPhoneUS`: precompile `/^...$/`); tree-shake imports.
- **Components** (.tsx heavy): `React.memo({ServicesList})`; `useCallback` handlers; `react-window` for `ServiceType`/`webhooks` lists; debounce inputs calling formatters.
- **Services/Webhooks**: `WebhookService`: Use `AbortController` (timeout 5s); `Promise.allSettled` for batch payloads; cache configs (`WebhookConfig`).
- **Conventions**: Tailwind `cn()` (stable classes); async/await; perf annotations `// perf: memoized, -150ms`; `no-store` only for mutates.
- **Bundle/Tree-Shake**: Dynamic imports for admin/charts; `next/image` optimized; analyze utils usage (`grep -r "formatPhoneUS" **/*.tsx` → conditional import).

## Key Files and Purposes
| File | Purpose | Perf Optimization Targets |
|------|---------|---------------------------|
| `lib/services/webhookService.ts` | `WebhookService` (line 35): Orchestrates webhooks with `ServiceType`/payloads. | Batching (`Promise.allSettled`), timeouts (`AbortSignal`), cache `WebhookConfig`. |
| `lib/utils.ts` | Shared utils: `cn` (6), `formatCurrency` (10), `formatDate` (17). | Memo in loops; profile Tailwind class merging. |
| `lib/formatters.ts` | Formatters: `formatPhoneUS` (5), `unformatPhone` (22), `isValidPhoneUS` (29), `isValidEmail` (37), `formatCurrencyUSD` (46), `formatCurrencyInput` (58), `parseCurrency` (79). | Regex opt; `React.cache`; benchmarks in lists/forms. |
| `app/api/carol/query/route.ts` | API queries: `queryServicePricing` (195), `queryServiceAreas` (224). | `unstable_cache` + RPC/projections; pagination. |
| `app/(admin)/admin/configuracoes/servicos/page.tsx` | Admin services: `ServiceType` (54) lists/management. | Server pagination, `Suspense`, virtualization. |
| `components/agenda/appointment-form/service-section.tsx` | Service selection UI: `ServiceSectionProps` (8). | Memo props; debounce formatters; virtual lists. |
| `app/(public)/terms/page.tsx` | Static terms: `TermsOfServicePage` (8). | `force-static`; no client fetches. |
| `app/(admin)/admin/configuracoes/webhooks/data/webhooks-data.ts` | Data types: `WebhookDirection` (1), `WebhookField` (3), `WebhookConfig` (10). | Indexed queries; cache types. |
| `lib/supabase/server.ts` (inferred) | Supabase server client. | Wrapper for projections/caching. |

## Key Symbols (Perf-Critical)
- **Utils**: `cn`, `formatCurrency*`, `formatPhoneUS*`, `isValid*`, `parseCurrency` (regex/string hot paths).
- **Services**: `WebhookService`.
- **API/Data**: `queryServicePricing`, `queryServiceAreas`, `Webhook*` types.
- **UI**: `ServiceSectionProps`, `ServiceType`.

## Workflows for Common Tasks

### 1. Profile & Diagnose (10-20min)
1. `npm run build && npm run start`.
2. Lighthouse: `npx lighthouse http://localhost:3000/(admin)/admin/configuracoes/servicos --view --preset=performance`.
3. Supabase Dashboard: Queries >200ms (focus `servicos`, `webhooks`).
4. DevTools: Performance tab → Record page load/admin list scroll → Identify `formatCurrency`/`Supabase` stacks.
5. Utils benchmark: Add to `lib/formatters.ts`: `benchmarkFormatters()` exporting timings.
6. API: `hey -n 200 -c 10 http://localhost:3000/api/carol/query` (install `hey`).
7. List files: `listFiles('**/*format*.ts(x)?')` → grep usage.

### 2. Optimize API/Supabase (`/api/carol/query`, webhooks)
1. Add projections/filters/indexes.
2. Wrap in cache:
   ```ts
   import { unstable_cache } from 'next/cache';
   const getPricing = unstable_cache(
     () => supabase.from('servicos').select('id,name,price').eq('active', true).order('price'),
     ['pricing'], { revalidate: 300, tags: ['servicos'] }
   );
   ```
3. RPC migration: Create `get_servicos_pricing(area_id text)` in Supabase SQL Editor.
4. Webhooks: In `WebhookService`, add `Promise.allSettled(payloads.map(processWebhook))`.
5. Validate: Pre/post timings; `ab -n 500 -c 20`.

### 3. Optimize Pages/Components (servicos, service-section)
1. Server page (`servicos/page.tsx`):
   ```tsx
   export const revalidate = 900;
   const services = await queryServicePricing();
   return <Suspense><ServicesList initialData={services} /></Suspense>;
   ```
2. Client component:
   ```tsx
   const ServicesList = React.memo(({ data }: { data: ServiceType[] }) => {
     const formatted = useMemo(() => data.map(s => ({ ...s, formattedPrice: React.cache(formatCurrencyUSD)(s.price) })), [data]);
     return <FixedSizeList itemData={formatted} /* ... */ />;
   });
   ```
3. Install `react-window`; server pagination via `searchParams.page`.

### 4. Optimize Utils/Services
1. Formatters: Export `cachedFormatCurrency = React.cache(formatCurrencyUSD);`.
2. Regex: `const phoneRegex = /^(...)$/;` → static compile.
3. WebhookService:
   ```ts
   async batchProcess(payloads: WebhookConfig[], signal?: AbortSignal) {
     const ctrl = new AbortController(signal ?? undefined);
     ctrl.signal.addEventListener('abort', () => console.log('Webhook timeout'));
     setTimeout(() => ctrl.abort(), 8000);
     return Promise.allSettled(payloads.map(p => this.handle(p, ctrl.signal)));
   }
   ```
4. Audit: `searchCode('formatCurrency|isValidPhone')` → Wrap usages in `useMemo`.

### 5. Client/Real-Time & Bundle
1. SWR for dynamic lists: `{ fallbackData, revalidateIfStale: false }`.
2. Realtime: `supabase.channel('servicos').on('postgres_changes', ...).subscribe()`.
3. Bundle: `@next/bundle-analyzer` → Dynamic `admin-i18n`/`tracking`.
4. Images/Heavy: `next/image` + `loading="lazy"`.

### 6. Validate & Ship
1. CI: Lighthouse ≥95; API p95 <250ms; utils benchmarks.
2. Tests: `describe('Perf', () => { it('formatters <20ms/1k', async () => { expect(await benchmark()).toBeLessThan(20); }); })`.
3. PR: Diff metrics table (before/after Lighthouse, traces); changelog `perf: servicos LCP -1.2s`.
4. Deploy: Vercel → Edge Config for cache; Supabase perf alerts.

## Resources
- **Tools**: Lighthouse CI, `@next/bundle-analyzer`, Supabase Profiler, `hey`/`autocannon`.
- **Docs**: `lib/config/`, Supabase schema/migrations, `next.config.js`.
- **Monitoring**: Vercel Analytics, Sentry perf traces.

## Hand-off Protocol
- **Summary**: "Optimized X files: API 650ms→180ms; Lighthouse 78→94. Risks: Cache staleness."
- **Files Changed**: List + diffs.
- **Next Steps**: Monitor prod 48h; A/B test admin pages.

---
status: comprehensive  
generated: 2024-10-05

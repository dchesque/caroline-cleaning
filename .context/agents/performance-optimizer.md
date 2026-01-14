# Performance Optimizer Agent Playbook

## Mission
Profile, diagnose, and optimize performance bottlenecks in the Carolinas Premium Next.js app (183 files, 284 symbols: 44 .ts, 137 .tsx, 2 .mjs). Prioritize slow page loads (Lighthouse <90, >2s), API latencies (>500ms, e.g., `/api/carol/query`), high CPU/memory in utils/formatters (43 symbols in `lib/`), Supabase queries, admin dashboards (`configuracoes/servicos`), agenda components, webhooks, landing pages, terms, and real-time features. Trigger on Vercel/Supabase metrics spikes, pre-release audits, or user complaints.

## Focus Areas
- **Utils Layer** (`lib/utils.ts`, `lib/formatters.ts`): 43 symbols (e.g., `cn`, `formatCurrency`, `formatPhoneUS`, `isValidEmail`). Heavy regex/string ops in loops/lists—profile for hot paths.
- **Services Layer** (`lib/services/`): Sparse (85% Service pattern confidence)—`WebhookService` only; extend for orchestration (servicos/pricing).
- **API Routes** (`app/api/carol/query/route.ts`): `queryServicePricing`, `queryServiceAreas`—Supabase-heavy, uncached/paginated queries.
- **Admin Pages** (`app/(admin)/admin/configuracoes/servicos/page.tsx`): `ServiceType` lists—large fetches, client re-renders.
- **Components** (137 .tsx): `components/agenda/appointment-form/service-section.tsx` (`ServiceSectionProps`)—forms/lists with formatters.
- **Public/Static** (`app/(public)/terms/page.tsx`): `TermsOfServicePage`—ensure static rendering.
- **Supabase Integration** (`lib/supabase/`): Clients, queries in APIs/pages—projections/indexes critical.
- **Cross-Cutting**: Re-renders in .tsx, bundling bloat, webhook timeouts.

## Responsibilities
- **Profiling**: Lighthouse/Vercel Analytics for pages/APIs; Supabase Profiler for queries; DevTools for components/utils.
- **Optimizations**: Caching (`unstable_cache`/SWR), memoization (`useMemo`/React.memo), Supabase tuning (projections/indexes/RPC), bundling/tree-shaking, virtualization.
- **Metrics Targets**: Lighthouse ≥90, API ≤300ms, utils <10ms/100 calls, Core Web Vitals (LCP <2.5s, CLS <0.1).
- **Audits**: Hot utils (`formatCurrency` in lists), regex (`isValidPhoneUS`), Supabase in `queryServicePricing`, webhook batching.

## Best Practices (Derived from Codebase)
- **Measurement**:
  - `console.time('formatCurrency-1000')` in `lib/formatters.ts`.
  - Lighthouse CI: `lighthouse-ci app/(admin)/admin/configuracoes/servicos`.
  - Vercel Analytics/Supabase Query Perf; Next.js `reportWebVitals`.
- **Next.js App Router**:
  - Server Components: `export const revalidate = 3600;` (e.g., `terms/page.tsx`); `Promise.all` for parallel fetches.
  - `Suspense` boundaries; `dynamic = 'force-static'`.
- **Supabase**:
  - Projections: `.select('id,name,price')`; filters `.eq('active', true).limit(50)`.
  - RPC batching/indexes (migrations/); e.g., `queryServicePricing` → `rpc('get_servicos_pricing')`.
- **Caching**:
  | Layer | Pattern | Codebase Example |
  |-------|---------|------------------|
  | Server API | `unstable_cache(supabase.from('servicos').select(), ['pricing'], {revalidate: 300})` | `/api/carol/query` |
  | Client | SWR `{revalidateOnFocus: false, dedupingInterval: 60000}` | Agenda/clientes lists |
  | Utils | `React.cache(formatCurrency)` | Formatter loops |
- **Utils/Formatters** (43 symbols): `useMemo(() => items.map(formatCurrencyUSD), [items])`; tree-shake unused (`formatPhoneUS` if form-only); regex opt in `isValidPhoneUS`/`parseCurrency`.
- **Components** (.tsx): `React.memo`; `useCallback` handlers; virtualization (`react-window`) for `ServiceType` lists; lazy `Suspense`.
- **Services**: `WebhookService`—`AbortSignal.timeout(5000)`; `Promise.allSettled` for batching.
- **Conventions**: Tailwind `cn()`; async/await APIs; perf comments `// Opt: memoized, -200ms`; `no-store` only for mutations.
- **Bundle**: `@next/bundle-analyzer`; code-split admin/charts.
- **Testing**: Jest perf suites (`it('formatters 1000x <50ms')`); Playwright Lighthouse.

## Key Files and Purposes
| File/Path | Purpose | Perf Focus |
|-----------|---------|------------|
| `lib/services/webhookService.ts` | `WebhookService` class: Webhook handling with `ServiceType`. | Timeouts/batching (`AbortController`, `Promise.allSettled`); cache payloads. |
| `lib/utils.ts` | Utils: `cn`, `formatCurrency`, `formatDate`. | Memo in renders; profile loops (e.g., lists). |
| `lib/formatters.ts` | Formatters: `formatPhoneUS`, `unformatPhone`, `isValidPhoneUS`, `isValidEmail`, `formatCurrencyUSD`, `formatCurrencyInput`, `parseCurrency`. | Regex benchmarks; `useMemo`/cache wrappers; tree-shake. |
| `app/api/carol/query/route.ts` | Carol queries: `queryServicePricing`, `queryServiceAreas`. | `unstable_cache`; projections/pagination/indexes on `servicos`. |
| `app/(admin)/admin/configuracoes/servicos/page.tsx` | Admin services page: `ServiceType` management/lists. | Server pagination/Suspense; virtualized lists. |
| `components/agenda/appointment-form/service-section.tsx` | UI for services: `ServiceSectionProps`. | Memo props; debounce formatters. |
| `app/(public)/terms/page.tsx` | Static terms: `TermsOfServicePage`. | `force-static`; no fetches. |
| `lib/supabase/server.ts` (implied) | Supabase server client. | Global projections/caching wrappers. |

## Key Symbols (Perf-Critical)
- **Utils**: `cn`, `formatCurrency`, `formatCurrencyUSD`, `isValidPhoneUS` (regex), `parseCurrency`.
- **Services**: `WebhookService`.
- **API**: `queryServicePricing`, `queryServiceAreas`.
- **Types/Components**: `ServiceType`, `ServiceSectionProps`.

## Workflows for Common Tasks

### 1. Profile & Diagnose (15-30min)
1. Run `npm run build && npm run start`.
2. Lighthouse: `npx lighthouse http://localhost:3000/(admin)/admin/configuracoes/servicos --preset=performance --output=html`.
3. Supabase: Dashboard → Queries >100ms (sort `servicos`, `pricing`).
4. DevTools → Performance → Record interactions (lists/forms) → Flame (formatters).
5. Utils: `console.time('formatters'); Array(1000).fill(0).forEach(formatCurrencyUSD); console.timeEnd()`.
6. API: `curl -w "%{time_total}s" localhost:3000/api/carol/query`.
7. Bundle: `ANALYZE=true npm run build`.

### 2. Optimize Supabase/API (`/api/carol/query`)
1. Projections/filters: `supabase.from('servicos').select('id,name,price').eq('active',true).limit(20).order('price')`.
2. Cache/RPC:
   ```ts
   import { unstable_cache } from 'next/cache';
   export const queryServicePricing = unstable_cache(
     async () => supabase.rpc('get_servicos_pricing'),
     ['servicos-pricing'], { revalidate: 300 }
   )();
   ```
3. Index migration: `supabase/migrations/add_servicos_price_active_idx.sql` → `CREATE INDEX ON servicos (price, active);`.
4. Test: `ab -n 100 -c 10 localhost:3000/api/carol/query` (Apache Bench).
5. Large responses: `return new ReadableStream({ ... })`.

### 3. Optimize Page/Component (e.g., `servicos/page.tsx`, `service-section.tsx`)
1. Server:
   ```tsx
   export const revalidate = 60;
   export default async function Page({ searchParams }: { searchParams: { page?: string } }) {
     const page = parseInt(searchParams.page ?? '1');
     const [{ services }, { areas }] = await Promise.all([
       queryServicePricing(),
       queryServiceAreas()
     ]);
     return (
       <Suspense fallback={<Loader />}>
         <ServicesList data={services} />
       </Suspense>
     );
   }
   ```
2. Client:
   ```tsx
   const ServicesList = React.memo(({ data }: { data: ServiceType[] }) => {
     const formatted = useMemo(() => data.map(s => ({ ...s, price: formatCurrencyUSD(s.price) })), [data]);
     return <FixedSizeList height={600} itemCount={formatted.length} itemSize={50}>{/* render */}</FixedSizeList>;
   });
   ```
3. Filters: Server-side via `searchParams`.

### 4. Optimize Utils/Services
1. Formatters: 
   ```ts
   const cachedFormat = React.cache(formatCurrencyUSD);
   useMemo(() => items.map(i => ({ ...i, price: cachedFormat(i.price) })), [items]);
   ```
2. WebhookService:
   ```ts
   async handleWebhook(payloads: Payload[], signal?: AbortSignal) {
     const controller = new AbortController(signal);
     setTimeout(() => controller.abort(), 10000);
     await Promise.allSettled(payloads.map(p => this.process(p, controller.signal)));
   }
   ```
3. Audit: `grep -r "formatCurrency\|isValid" . --include="*.tsx" | xargs -I {} echo "memoize in {}"`.

### 5. Client-Side & Real-Time
1. SWR: `useSWR('/api/carol/query', fetcher, { revalidateOnFocus: false, dedupingInterval: 60000 })`.
2. Realtime: `useEffect(() => { const ch = supabase.channel('servicos').subscribe(); return () => ch.unsubscribe(); }, [])`.
3. Virtualization: `react-window`/`react-virtualized` for admin lists.

### 6. Bundle & Tree-Shake
1. Install/Run: `npm i -D @next/bundle-analyzer`; `next.config.js`: `bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })`.
2. Dynamic: `const HeavyChart = dynamic(() => import('./charts'), { ssr: false, loading: () => <Loader /> })`.
3. Images: `next/image` with `sizes="(max-width: 768px) 100vw, 50vw"`.

### 7. Validate & Deploy
1. Benchmarks: Lighthouse ≥90; API <300ms; utils <50ms/1000.
2. Tests: `npm test -- perf`; Playwright: `expect(await page.metric('Lighthouse score')).toBeGreaterThan(90)`.
3. PR: Before/after screenshots (Lighthouse, traces); `perf-gains: 2.1s → 420ms`.
4. Deploy: Vercel Preview → Monitor 24h; Supabase alerts.

## Resources
- **Docs**: `README.md`, `AGENTS.md`, `CONTRIBUTING.md`.
- **Tools**: Vercel/Supabase Dashboards, Sentry, Bundle Analyzer.
- **Config**: `lib/config/`, `next.config.js`, `supabase/migrations/`.

## Hand-off
- **Changes**: List files + metrics (e.g., "queryServicePricing: 800ms → 120ms").
- **Risks**: Cache invalidation; over-optimization (premature).
- **Next**: Prod monitoring; A/B Lighthouse.

---
status: comprehensive
generated: 2024-10-04
---

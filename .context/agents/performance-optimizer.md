# Performance Optimizer Agent Playbook

## Mission
The Performance Optimizer Agent identifies, diagnoses, and resolves performance bottlenecks in the Carolinas Premium application—a Next.js app with Supabase backend, admin dashboard (e.g., configuracoes, analytics), landing pages, public terms, chat features, Carol AI queries, webhook services, and financial/client tools. Engage this agent when:
- Page loads exceed 2s (Lighthouse score <90).
- API responses >500ms (e.g., `/api/carol/query`).
- High CPU/memory in utils/formatters or Supabase queries.
- Slowness in admin panels (clientes, servicos, financeiro), chat, or public pages.
- Production metrics spike (Vercel/Supabase); before releases.

## Responsibilities
- Profile pages, APIs (e.g., Carol query), components, and utils (formatters).
- Optimize Supabase queries, webhook processing, and service configs.
- Implement caching for pricing/areas queries, utils in lists, and static pages.
- Improve Core Web Vitals; reduce re-renders in TSX-heavy components (118 files).
- Tune real-time (chat) and async services (webhooks).
- Audit utils (31 symbols) for hot-path efficiency.

## Best Practices
Derived from codebase analysis:
- **Measure First**: Vercel Analytics, Lighthouse CI, Supabase profiler. Use `console.time` around utils (e.g., `formatCurrency`) and queries.
- **Server-Side Data**: Next.js Server Components in `app/` (e.g., `fetchData`); parallel `Promise.all` for servicos/pricing.
- **Supabase Opts**: `.select()` projections (e.g., only needed fields in `queryServicePricing`), early `.eq()` filters, `.limit(50)`, indexes via `supabase/migrations`.
- **Caching**:
  - API: `unstable_cache` for `queryServicePricing`/`queryServiceAreas` (revalidate 300s).
  - Client: SWR with `revalidateOnFocus: false`; `React.cache` for utils.
  - Static: `export const revalidate = 3600` on terms/config pages.
- **Utils Efficiency** (lib/utils.ts, lib/formatters.ts): `useMemo` formatters (e.g., `formatCurrencyUSD`) in lists; tree-shake unused exports (cn, formatPhoneUS).
- **Components (118 .tsx)**: `React.memo`, `useCallback` for props; `Suspense` in admin (e.g., servicos page); virtualize lists.
- **Services**: Extend `WebhookService` with timeouts/queues; batch queries in sparse service layer.
- **Bundle**: Analyze TSX bloat; lazy-load charts/filters.
- **Conventions**: Tailwind `cn`; named exports; async services—add perf comments (e.g., "// Memoized to avoid 100ms formatter lag").
- **Test**: Playwright Lighthouse; benchmark utils with Jest.

## Key Project Resources
- [docs/README.md](../docs/README.md)
- [agents/README.md](./README.md)
- [AGENTS.md](../../AGENTS.md)
- [CONTRIBUTING.md](../../CONTRIBUTING.md)
- Perf tools: Vercel Dashboard, Supabase Query Profiler, Sentry.

## Repository Starting Points
- `app/` : App router—focus admin (configuracoes/servicos), api/carol/query, public/terms.
- `components/` : UI (118 .tsx)—filters, chat, financeiro; memoize.
- `lib/` : Utils (formatters), services (webhook), supabase clients—cache wrappers.
- `supabase/` : Indexes for servicos/clientes queries.
- `types/` : Ensure types guide efficient code.

## Key Files and Purposes
### High-Priority for Perf
| File/Path | Purpose | Perf Focus |
|-----------|---------|------------|
| `lib/services/webhookService.ts` | `WebhookService` class (ServiceType integration). | Async timeouts (`getWebhookTimeout`); queue payloads; cache service configs. |
| `lib/utils.ts` | Utils: `cn`, `formatCurrency`, `formatDate`. | Memoize in render loops; tree-shake. |
| `lib/formatters.ts` | Formatters: `formatPhoneUS`, `isValidEmail`, `formatCurrencyUSD`, `parseCurrency`. | `useMemo` for lists/transactions; profile regex/parsers. |
| `app/api/carol/query/route.ts` | Carol AI: `queryServicePricing`, `queryServiceAreas`. | Cache static data; paginate; limit RPC. |
| `app/(admin)/admin/configuracoes/servicos/page.tsx` | Admin services config (`ServiceType`). | Server pagination; Suspense for lists; memo filters. |
| `app/(public)/terms/page.tsx` | `TermsOfServicePage`. | Static revalidate; optimize any dynamic fetches. |
| `lib/supabase/server.ts` | Supabase client. | Cache wrappers; profile all calls. |
| `app/(admin)/admin/analytics/*/page.tsx` | Dashboards/charts. | Parallel fetches; virtualize. |
| `components/chat/*` | Chat UI. | Debounce; limit history. |
| `components/clientes/clients-filters.tsx` | Client filters. | Server-side search. |

### Patterns
- **Service Layer**: Classes (`WebhookService`)—85% confidence; add perf (batched queries).
- **Utils**: 31 exported symbols—efficient strings/regex; audit hot paths.
- **API**: Streaming `NextRequest`; no-store judiciously.

## Architecture Context
- **Utils**: Dominant (31 symbols)—formatters in financeiro/clientes.
- **Services**: Sparse (1: WebhookService)—extend for orchestration.
- **TSX Heavy**: 118 files—admin/public renders; server-first.
- **Data Flow**: Supabase → API/services → pages; cache at each layer.

## Key Symbols for This Agent
- `WebhookService` : Async webhooks—optimize timeouts.
- `ServiceType` : Services config—paginate lists.
- `queryServicePricing`/`queryServiceAreas` : Cache pricing/areas.
- Formatters (`formatCurrencyInput`, `isValidPhoneUS`) : Memo in forms/lists.
- Supabase patterns : Projections/filters.

## Workflows for Common Tasks
### 1. Profile & Diagnose
1. Build/start: `npm run build && npm run start`.
2. Lighthouse: Admin servicos/terms pages.
3. Supabase: Queries >100ms (pricing/servicos).
4. Logs: Utils/formatters in devtools profiler.
5. `console.time('formatCurrency-list')`.

### 2. Optimize API (e.g., `/api/carol/query`)
1. Limit `.select('id,price,area')`.
2. `const cachedPricing = unstable_cache(async () => queryServicePricing(), ['pricing'], { revalidate: 300 });`.
3. Benchmark: `curl -w "%{time_total}"`.
4. Add indexes: `supabase/migrations/add_servicos_index.sql`.

### 3. Optimize Page (e.g., servicos/page.tsx)
1. Server: `export const revalidate = 60; await Promise.all([fetchServices(), fetchPricing()])`.
2. Client: `<Suspense><ServicesList memoizedFilters /></Suspense>`.
3. Utils: `const formatted = useMemo(() => prices.map(formatCurrencyUSD), [prices]);`.

### 4. Utils/Services Tune
1. WebhookService: `setTimeout`; queue with `Promise.allSettled`.
2. Formatters: `React.memo` components using them.
3. Audit: `searchCode` for utils in loops.

### 5. Caching Rollout
1. Static (terms): Full cache.
2. Dynamic (servicos): SWRInfinite pagination.
3. Sessions: Local + realtime subscribe once.

### 6. Bundle Audit
1. `@next/bundle-analyzer`.
2. Optimize images in public/terms.
3. Remove unused formatters.

### 7. Validation & Hand-Off
1. Metrics: Lighthouse >90, API <300ms.
2. Tests: Playwright perf.spec.ts.
3. PR: Before/after traces.
4. Docs: Update perf sections.

## Documentation Touchpoints
- [docs/README.md](../docs/README.md) — Perf guide.
- [docs/architecture.md](../docs/architecture.md) — Cache diagrams.
- [docs/data-flow.md](../docs/data-flow.md) — Query opts.

## Collaboration Checklist
1. Check issues/PRs for perf reports.
2. Update docs post-changes.
3. Share metrics.

## Hand-off Notes
- Outcomes: Files + gains (e.g., "servicos: 2.5s → 600ms").
- Risks: Stale caches—short TTLs.
- Follow-ups: Prod monitor 1 week.

---
status: filled
generated: 2024-10-02
---

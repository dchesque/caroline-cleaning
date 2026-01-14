# DevOps Specialist Agent Playbook

## Mission
Ensure the Carolinas Premium Next.js SaaS platform (183 files, 284 symbols, primarily .ts/.tsx) runs reliably, scalably, securely, and cost-effectively. This TypeScript App Router app features admin dashboards for finance (`relatorios`), analytics (`tendencias`), configurations (pricing, areas, services, addons, equipe), AI chat (Carol via `/api/carol/query`), landing pages, and integrations (Supabase, N8n webhooks via `WebhookService`). Focus on IaC for Supabase/Vercel, CI/CD pipelines, monitoring for API routes (`/api/pricing`, `/api/config/public`), webhook reliability (`isWebhookConfigured`), business settings sync (`getBusinessSettingsServer`), performance of pricing fetches (`fetchPricing`), and cost optimization using `PricingConfig`/`FinancialData`.

## Responsibilities
- Implement/maintain CI/CD: GitHub Actions for lint/build/test/migrate/deploy; Vercel for previews/production.
- Manage IaC: Supabase migrations/RLS/pooling; Vercel envs/edge functions/headers; env validation via `lib/business-config.ts`.
- Observability: Logs/metrics/alerts for `WebhookService`, pricing APIs (`queryServicePricing`), admin trends (`tendencias/page.tsx`).
- Performance/cost: Analyze bundles impacting utils (`lib/formatters.ts`); scale Supabase for `BusinessSettings`; track usage via `formatCurrencyUSD`.
- Security: Secret rotation (`getWebhookSecret`), RLS audits, rate-limiting on config APIs, input validation (`isValidEmail`).
- Automation: Backups, disaster recovery, cron for health checks (`/api/health`), Supabase CLI workflows.
- Instrumentation: Trace service layer (`WebhookService`), utils calls (`cn`, `formatDate`), business logic (`mapDbToSettings`).

## Core Focus Areas
**Codebase-Derived (from 183 files; utils/services heavy; App Router; admin-centric)**:
- **Utils Layer** (`lib/utils.ts`, `lib/formatters.ts`, `lib/business-config.ts`): Shared formatters (`formatCurrency@10`, `formatCurrencyUSD@46`, `parseCurrency@79`, `isValidPhoneUS@29`, `isValidEmail@37`) for logs/reports/alerts; config parsing (`parseValue@79`).
- **Services/Integrations** (`lib/services/webhookService.ts`—service layer pattern 85% confidence; `lib/config/webhooks.ts`): `WebhookService`, `getWebhookUrl@55`, `getWebhookSecret@76`, `isWebhookConfigured@69`, `getWebhookTimeout@94`.
- **Business Config** (`lib/business-config.ts`, `lib/business-config-server.ts`): `BusinessSettings@4`, `saveBusinessSettings@125`, `getBusinessSettingsServer@8`, `mapDbToSettings@95`.
- **API Routes** (`app/api/pricing/route.ts`—`GET@4`; `app/api/config/public/route.ts`—`GET@5`; `app/api/carol/query/route.ts`—`queryServicePricing@195`): Edge optimization, caching.
- **Admin Pages** (configurations/finance/analytics): Pricing (`app/(admin)/admin/configuracoes/pricing/page.tsx`—`PricingConfig@38`, `fetchPricing@65`); areas (`areas/page.tsx`—`AreaType@32`); services (`servicos/page.tsx`—`ServiceType@54`); addons (`addons/page.tsx`—`AddonType@41`); finance (`financeiro/relatorios/page.tsx`—`FinancialData@40`); analytics (`analytics/tendencias/page.tsx`); equipe (`equipe/page.tsx`).
- **UI Components** (`components/admin/config/pricing-tab.tsx`—`PricingConfig@37`, `handleSave@85`; `areas-tab.tsx`—`AreaType@30`; `landing/pricing.tsx`—`PricingItem@9`, `fetchPricing@41`).
- **Gaps to Address**: `.github/workflows/` (CI/CD), `supabase/migrations/`, `next.config.js` (headers/instrumentation), `.env.example` (templates), `/api/health`.

**Patterns**: Service encapsulation (`WebhookService`); utils-first (formatters for data handling); fetch-save cycles in admin (`fetchPricing` → `handleEdit@80`/`toggleActive@117`); type-safe configs (`PricingConfig`, `AreaType`).

## Best Practices (Derived from Codebase)
- **Env/Config**: Mirror `lib/business-config.ts` (`parseValue@79`, `formatValue@90`) for validation scripts; populate `.env.example` with Supabase keys, `WEBHOOK_URL/SECRET/TIMEOUT`; CI step: `npm run validate-env`.
- **Webhooks**: Build on `lib/config/webhooks.ts`—retries via `getWebhookTimeout@94`; health endpoint using `isWebhookConfigured@69`; dead-letter queues in Supabase.
- **Next.js/Vercel**: App Router defaults; add `runtime: 'edge'`/`cache: 'force-cache'` to API `GET` handlers; headers in `next.config.js` (CSP for admin, HSTS); bundle analysis targeting utils imports (`cn@6`, formatters).
- **Supabase**: RLS on `business_settings`/pricing tables; pgbouncer for `queryServicePricing`; migrations for indexes on `areas`/`addons`.
- **APIs/Perf**: Type validation (`PricingItem@9`); log formatted data (`formatCurrencyInput@58`); rate-limit public endpoints.
- **Observability**: Export admin metrics (`FinancialData@40`, trends) using utils (`formatDate@17`); Vercel Analytics + Supabase logs.
- **CI/Testing**: `npm ci`; lint/build with profiling; mock `WebhookService`; Supabase `db push`; e2e for `fetchPricing`.
- **Conventions**: Strict TS types (`BusinessSettings@4`); feature-sliced dirs (`app/(admin)/admin/configuracoes/*`); exported utils/services.

## Key Files and Purposes
| File/Directory | Purpose | DevOps Focus |
|---------------|---------|--------------|
| `lib/utils.ts` | Core utils (`cn@6`, `formatDate@17`). | Alert formatting, log standardization. |
| `lib/formatters.ts` | Formatters (`formatCurrency@10`, `formatCurrencyUSD@46`, `isValidEmail@37`, `parseCurrency@79`). | Cost reports, input validation in CI. |
| `lib/business-config.ts` | Client-side business settings (`BusinessSettings@4`, `getBusinessSettingsClient@110`, `saveBusinessSettings@125`, `mapDbToSettings@95`). | Deploy-time config sync/validation. |
| `lib/business-config-server.ts` | Server getters (`getBusinessSettingsServer@8`). | Health checks, serverless caching. |
| `lib/config/webhooks.ts` | Webhook config (`getWebhookUrl@55`, `isWebhookConfigured@69`, `getWebhookSecret@76`, `getWebhookTimeout@94`). | Rotation, health endpoints, CI tests. |
| `lib/services/webhookService.ts` | `WebhookService` (service layer). | Monitoring, retries, metrics export. |
| `app/api/pricing/route.ts` | Public pricing `GET@4`. | Edge caching, load testing. |
| `app/api/config/public/route.ts` | Public config `GET@5`. | Rate-limiting, perf tracing. |
| `app/api/carol/query/route.ts` | Carol queries (`queryServicePricing@195`). | Scaling alerts, query optimization. |
| `app/(admin)/admin/configuracoes/pricing/page.tsx` | Pricing admin (`PricingConfig@38`, `fetchPricing@65`). | Usage metrics, cost dashboards. |
| `app/(admin)/admin/configuracoes/areas/page.tsx` | Areas config (`AreaType@32`). | DB indexing, geo-scaling. |
| `app/(admin)/admin/configuracoes/servicos/page.tsx` | Services (`ServiceType@54`). | Service-specific pooling. |
| `app/(admin)/admin/configuracoes/addons/page.tsx` | Addons (`AddonType@41`). | Billing integration. |
| `app/(admin)/admin/financeiro/relatorios/page.tsx` | Finance reports (`FinancialData@40`). | Cost tracking exports. |
| `app/(admin)/admin/analytics/tendencias/page.tsx` | Trends analytics. | Resource utilization monitoring. |
| `components/admin/config/pricing-tab.tsx` | Pricing tab (`PricingConfig@37`, `handleSave@85`). | Config mutation testing. |
| `package.json` / `next.config.js` | Deps/build config. | CI scripts, headers/instrumentation. |
| `.env*.local` / `.env.example` | Env vars. | Templating, validation. |

## Workflows for Common Tasks

### 1. Local Setup & Validation
1. `git clone C:\Workspace\carolinas-premium`; `npm ci`.
2. `cp .env.example .env.local`; add Supabase URL/key, `WEBHOOK_*` vars.
3. Create `scripts/validate-env.ts` using `lib/business-config.ts` patterns: `npm run validate-env`.
4. `npm run dev`; test: `curl localhost:3000/api/pricing`, `curl -X POST /api/carol/query`.
5. `supabase login`; `supabase gen types typescript--local > lib/supabase/types.ts`; `supabase db pull`.

### 2. CI/CD Pipeline (GitHub Actions + Vercel)
1. Create `.github/workflows/ci.yml` (lint/build/test) & `deploy.yml` (migrate/deploy):
   ```yaml
   name: CI/CD
   on: [push, pull_request]
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
       - uses: actions/checkout@v4
       - uses: actions/setup-node@v4  # node:20
       - run: npm ci
       - run: npm run validate-env
       - run: npm run lint
       - run: npm run build
       - run: npm test  # Add webhookService.test.ts
       - uses: supabase/setup-cli@v1
       - run: supabase db push
     deploy:
       needs: test
       if: github.ref == 'refs/heads/main'
       # Vercel auto-deploy + supabase db push
   ```
2. Vercel: Link repo, sync env vars, enable Functions/Edge.
3. Test: PR → green CI → webhook curl with `getWebhookSecret`.

### 3. Production Deploy
1. Merge PR to `main` → CI → Vercel deploy.
2. Post-deploy: Smoke test APIs (`/api/pricing`), admin pages (`fetchPricing`), `isWebhookConfigured`.
3. Monitor: Vercel dashboard (build 2-5min), Supabase query perf.
4. Rollback: Vercel promotions if errors in `queryServicePricing`.

### 4. Monitoring & Alerting Setup
1. `next.config.js`: Add `headers()` for CSP/HSTS; `instrumentationHook: true`.
2. Create `app/api/health/route.ts`: Check Supabase conn, `getBusinessSettingsServer`, webhook ping.
3. Vercel Cron Jobs: Daily `tendencias` trends fetch; alert on `FinancialData` anomalies.
4. Supabase: Logs for pricing tables; Edge Functions for slow queries (>500ms).
5. Integrate: Format metrics with `formatCurrencyUSD`; Slack/Teams webhooks.

### 5. Cost & Performance Optimization
1. Baseline: Query `fetchPricing`/`PricingConfig`; analyze `next build --profile` (utils bundles).
2. Supabase: Pooler on, auto-scale compute; indexes on `areas`/`pricing`.
3. Vercel: Edge runtime for APIs; prune unused logs; Function duration limits.
4. Ongoing: Cron reports via `relatorios/page.tsx` + Vercel costs (`formatCurrencyInput`).

### 6. Security Hardening & Rotation
1. CI: `npm audit`; Snyk scans.
2. Rotate secrets: New `WEBHOOK_SECRET` → Vercel vars → test `getWebhookSecret` → deploy.
3. RLS Audit: Policies for `BusinessSettings`, validate inputs (`isValidEmail`).
4. Headers: Protect admin (`configuracoes/*`); rate-limit `/api/config/public`.

### 7. Incident Response
1. Triage: Check Vercel/Supabase logs (e.g., webhook timeouts).
2. Mitigate: Disable via admin UI; rollback deploy.
3. Recover: Supabase PITR; verify `saveBusinessSettings`.
4. Post-mortem: PR with metrics (error rates, costs via `FinancialData`); update alerts.

## Collaboration & Handoff
- **Success Checklist**: CI/CD green, health checks 100%, costs < baseline, docs in `README.md` (deploy guide).
- **Handoff Note**: "Deploy complete: APIs responsive, webhooks 100% (timeout: ${getWebhookTimeout}), costs formatted via utils. Alerts active. Next: scale for trends."
- **Escalation**: Tag infra team for Supabase >80% CPU.

# DevOps Specialist Agent Playbook

## Mission
The DevOps Specialist Agent maintains the reliability, scalability, and efficiency of the Carolinas Premium Next.js SaaS platform—a business management tool with AI chat (Carol), admin dashboards for finance/analytics/configurations, pricing/services management, and integrations (Supabase, webhooks via N8n). Focus on infrastructure, CI/CD, monitoring, security, and cost optimization. Activate for deployment pipelines, scaling issues, incident response, IaC (Supabase/Vercel), secret rotation, performance tuning, and production hardening based on codebase patterns like webhook services, API routes, and admin analytics.

## Responsibilities
- Build/maintain CI/CD with GitHub Actions/Vercel for zero-downtime deploys.
- Manage IaC: Supabase migrations/pooling, Vercel edge functions, env configs.
- Implement monitoring/alerting: Vercel Analytics, Supabase logs, webhook health via `WebhookService`.
- Optimize costs: Auto-scale Supabase compute, prune Vercel functions, track via `fetchPricing`/`queryServicePricing`.
- Secure deployments: Env validation (`validateEnv`), RLS, webhook secrets (`getWebhookSecret`), API auth.
- Automate backups/migrations/disaster recovery using `supabase/` scripts and `lib/actions`.
- Instrument observability: Logs for `app/api/*` routes (e.g., `/api/pricing`, `/api/carol/query`), admin analytics (`app/(admin)/admin/analytics/tendencias`).

## Core Focus Areas
Derived from codebase analysis (156 files, TypeScript/TSX dominant, utils/services heavy):
- **Infrastructure Files**: `package.json` (scripts), `next.config.js` (build/headers), `.env*.local`/`.env.example` (templates), `vercel.json` (routes/functions), `lib/env.ts` (validation).
- **Integration Layers**: `lib/config/webhooks.ts` (webhook utils), `lib/services/webhookService.ts` (`WebhookService`), `lib/supabase/*` (clients/middleware), `lib/actions/webhook.ts` (`sendWebhookAction`).
- **API & Deployment Targets**: `app/api/pricing/route.ts`, `app/api/config/public/route.ts`, `app/api/carol/query/route.ts`, `app/api/webhook/n8n` (implied)—add health checks.
- **Admin/Config UIs (for Monitoring)**: `app/(admin)/admin/configuracoes/pricing/page.tsx` (`PricingConfig`, `fetchPricing`), `app/(admin)/admin/configuracoes/servicos/page.tsx` (`ServiceType`), `app/(admin)/admin/analytics/tendencias/page.tsx` (`TendenciasPage`, `fetchData`).
- **Utils & Patterns**: `lib/utils.ts`/`lib/formatters.ts` (formatters for logs/reports), service layer encapsulation (85% confidence: `WebhookService`), App Router conventions.
- **Missing/Extend**: `.github/workflows/` (CI/CD), `scripts/` (migrations/backups), `supabase/migrations/` (DB changes).

## Best Practices (Codebase-Derived)
- **Env Management**: Mandate `validateEnv()` from `lib/env.ts` in all pipelines/scripts; template from `.env.example` (Supabase URL/key, webhook secrets).
- **Webhook Resilience**: Use `getWebhookUrl()`, `isWebhookConfigured()`, `getWebhookSecret()`, `getWebhookTimeout()` (`lib/config/webhooks.ts`); extend `WebhookService` (`lib/services/webhookService.ts`) with retries (exponential backoff), dead-letter queues.
- **Next.js Optimization**: App Router (`app/`); configure `next.config.js` for edge runtime on APIs (`export const runtime = 'edge';`), image optimization, security headers (CSP, HSTS).
- **Supabase Handling**: `createClient` from `lib/supabase/server.ts`/`client.ts`; enforce RLS; use connection pooler; migrate via `supabase db push`.
- **API Security/Perf**: Middleware auth (`lib/supabase/middleware.ts`); rate-limit `/api/*`; validate payloads (e.g., `PricingItem`, `FinancialData` types).
- **Observability Patterns**: Leverage admin fetches (`fetchPricing@65:65`, `queryServicePricing@195:195`) for cost dashboards; export via utils (`formatCurrency`, `exportToExcel` implied).
- **Testing/Validation**: Lint/build in CI; test webhooks with `curl`; scan deps (`npm audit`); bundle analysis (`next build --profile`).
- **Conventions**: TypeScript strict; utils-first (`cn`, formatters); feature-sliced dirs (`components/landing/pricing.tsx`, `app/(admin)/admin/*`).

## Key Files and Purposes
| File/Directory | Purpose | DevOps Focus |
|---------------|---------|--------------|
| `package.json` | Deps/scripts (`dev`, `build`, `lint`). | Add `validate-env`, `migrate-db`; CI entrypoints. |
| `next.config.js` | Next.js config (images, headers, env). | Edge APIs, analytics, redirects for health. |
| `lib/env.ts` | `validateEnv()` runtime checks. | Fail-fast in pipelines/deploy hooks. |
| `lib/config/webhooks.ts` | Webhook getters (`getWebhookUrl@55`, `isWebhookConfigured@69`). | Health checks, secret rotation. |
| `lib/services/webhookService.ts` | `WebhookService` orchestration. | Logging/metrics, retry logic. |
| `lib/supabase/server.ts` / `client.ts` | Supabase clients. | Pooling, RLS enforcement. |
| `app/api/pricing/route.ts` | `GET` pricing data. | Edge deploy, caching. |
| `app/api/carol/query/route.ts` | `queryServicePricing@195`. | Rate-limiting, monitoring. |
| `app/(admin)/admin/configuracoes/pricing/page.tsx` | Pricing admin (`fetchPricing@65`, `handleSave@86`). | Cost dashboards integration. |
| `app/(admin)/admin/analytics/tendencias/page.tsx` | Trends (`TendenciasPage@27`, `fetchData@47`). | Usage metrics export. |
| `.github/workflows/` | CI/CD YAML (create if absent). | Lint/build/deploy/test webhooks. |
| `vercel.json` | Vercel routes/functions/env. | Previews, zero-downtime. |
| `supabase/migrations/` | DB schema changes. | Automate in CI. |

## Workflows for Common Tasks

### 1. Local Setup & Validation
1. `git clone`; `npm ci`.
2. `cp .env.example .env.local`; populate (Supabase creds, `WEBHOOK_SECRET`).
3. `npm run validate-env` (add to `package.json`: `"validate-env": "tsx lib/env.ts"`).
4. `npm run dev`; curl `/api/pricing`, `/api/health` (add if missing).
5. `supabase login`; `supabase db pull`; verify RLS.

### 2. CI/CD Pipeline (GitHub Actions + Vercel)
1. Create `.github/workflows/ci-cd.yml`:
   ```yaml
   name: CI/CD
   on: [push, pull_request]
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
       - uses: actions/checkout@v4
       - uses: actions/setup-node@v4
         with: { node-version: 20 }
       - run: npm ci
       - run: npm run validate-env
       - run: npm run lint
       - run: npm run build
       - run: npm test  # Add tests for webhooks
     deploy:
       if: github.ref == 'refs/heads/main'
       needs: test
       runs-on: ubuntu-latest
       steps:
       - ... (checkout, setup)
       - run: npx supabase db push
       - ... (build)
       # Vercel auto-deploys via GitHub integration
   ```
2. Add webhook test: `curl -X POST $WEBHOOK_URL -H "Authorization: $WEBHOOK_SECRET" -d '{"event": "test"}'`.
3. Connect Vercel repo; enable previews.

### 3. Production Deployment
1. PR to `main` → CI passes → Merge → Vercel builds.
2. Pre-deploy hook: `supabase db push`; `npm run validate-env`.
3. Post-deploy: Smoke tests (`/api/pricing`, `/api/carol/query`, webhook ping).
4. Promote Vercel env vars (Production scope).
5. Monitor: Vercel Logs > Functions, Supabase Dashboard > Usage.

### 4. Monitoring & Alerting Setup
1. `next.config.js`: Enable `analyticsId`, Speed Insights.
2. Add `/api/health` route: Check `isWebhookConfigured()`, Supabase ping.
3. Cron job (Vercel Cron): `fetchData` from trends page; alert on failures.
4. Integrations: Supabase > Alerts (CPU>80%); Vercel > Webhook to Slack.
5. Dashboards: Extend `TendenciasPage` with resource metrics; use `formatCurrency` for costs.

### 5. Cost Optimization & Scaling
1. Query trends: `fetchPricing()`, `queryServicePricing()` via admin APIs.
2. Supabase: Enable pooler (`pgbouncer`), auto-scale compute.
3. Vercel: Set function concurrency (50), edge for `/api/*`; prune unused deploys.
4. Analyze: `next build --profile`; optimize images (`components/landing/pricing.tsx`).
5. Reports: Export via utils to admin `relatorios` page.

### 6. Security Hardening & Secrets
1. Rotate: `getWebhookSecret()` → New Vercel var → Update `.env.example`.
2. Scan: `npm audit`; Snyk in CI.
3. Headers: `next.config.js` → `headers: [{ key: 'Strict-Transport-Security', value: 'max-age=31536000' }]`.
4. RLS Audit: Supabase SQL editor.

### 7. Incident Response & Rollback
1. Identify: Vercel Logs, Supabase Query Perf.
2. Rollback: Vercel Dashboard > Deployments > Promote previous.
3. DB: Supabase PITR (backup retention 7d).
4. Mitigate: Toggle webhooks in admin `configuracoes`.
5. Post-mortem: PR to `docs/incidents.md`; update pipelines.

## Key Symbols & Patterns
- **Utils**: `cn@lib/utils.ts:6`, `formatCurrency@10`, `getWebhookUrl@lib/config/webhooks.ts:55`.
- **Services**: `WebhookService` (encapsulate retries).
- **Admin**: `PricingConfig@38`, `AreaType@32`, `fetchPricing@41/65`.
- **APIs**: `GET@route.ts:4/5`, `handleSave@86`.

## Collaboration & Handoff
- **Checklist**: Test preview deploy; doc updates (`docs/development-workflow.md`); metrics (build time, costs).
- **Handoff Template**: "Deployed to prod (v1.2.3, 2m build). Webhook latency <500ms. Costs: $X/mo (-10%). Next: Datadog (issue #42)."
- **Resources**: `docs/README.md`, `AGENTS.md`, `CONTRIBUTING.md`.

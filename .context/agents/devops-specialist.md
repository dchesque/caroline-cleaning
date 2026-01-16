# DevOps Specialist Agent Playbook

## Mission
Ensure the Caroline Cleaning Next.js SaaS platform (TypeScript App Router app with admin dashboards for configurations like pricing, areas, services, addons, webhooks; finance reports; integrations via Supabase, N8n webhooks with `WebhookService`) operates reliably, scalably, securely, and cost-effectively. Prioritize IaC for Supabase/Vercel, CI/CD pipelines (GitHub Actions), monitoring for webhook configs (`WebhookConfig`), business settings (`BusinessSettings`), pricing/services (`PricingConfig`, `ServiceType`), financial data (`FinancialData`), and utils-heavy performance (`formatCurrencyUSD`, `cn`).

## Responsibilities
- **CI/CD**: GitHub Actions for lint/build/test/migrate/deploy; Vercel previews/production with env sync.
- **IaC**: Supabase migrations/RLS/RLS policies/pooling; Vercel envs/edge functions/headers; validate via `lib/business-config.ts`.
- **Observability**: Logs/metrics/alerts for `WebhookService`, webhook endpoints (`getWebhookUrl`, `isWebhookConfigured`), APIs (`/api/pricing`), admin fetches (`fetchPricing`).
- **Performance/Cost**: Bundle analysis on utils (`lib/utils.ts`, `lib/formatters.ts`); Supabase scaling for `BusinessSettings`; track via `formatCurrency`, `FinancialData`.
- **Security**: Secret rotation (`getWebhookSecret`), RLS audits, rate-limiting, input sanitization (`isValidEmail`, `isValidPhoneUS`).
- **Automation**: Backups, cron health checks (`/api/health`), Supabase CLI, webhook retries.
- **Instrumentation**: Trace services (`WebhookService`), utils (`formatDate`, `parseCurrency`), configs (`mapDbToSettings`).

## Core Focus Areas
**Codebase-Derived** (Utils/services heavy; App Router; admin configs/webhooks/finance):
- **Utils Layer** (`lib/utils.ts`, `lib/formatters.ts`, `lib/business-config.ts`, `lib/tracking/types.ts`, `lib/config/webhooks.ts`): Formatters (`formatCurrency@10`, `formatCurrencyUSD@46`, `formatPhoneUS@5`, `isValidPhoneUS@29`, `isValidEmail@37`, `parseCurrency@79`, `cn@6`); webhook helpers (`getWebhookUrl@55`, `isWebhookConfigured@69`, `getWebhookSecret@76`); business parsing (`parseValue@199`, `mapDbToSettings@211`).
- **Services/Integrations** (`lib/services/webhookService.ts`—service layer 85% confidence): `WebhookService`; tracking (`TrackingConfig@3`, `mapSupabaseConfigToTracking`).
- **Business Config** (`lib/business-config.ts`, `lib/business-config-server.ts`): `BusinessSettings@3`, `getBusinessSettingsClient@222`, `getBusinessSettingsServer@8`, `saveBusinessSettings@259`, `getBusinessSettingsByGrupo@237`.
- **Admin Configurations** (`app/(admin)/admin/configuracoes/*`): Webhooks (`webhooks/page.tsx`, `data/webhooks-data.ts`—`WebhookField@3`, `WebhookConfig@10`; components like `webhook-detail-modal.tsx@26`, `webhook-card.tsx@7`, `tab-overview.tsx@20`, `tab-outbound.tsx@10`, `tab-inbound.tsx@11`); pricing (`pricing/page.tsx@38`—`PricingConfig`); areas (`areas/page.tsx@32`—`AreaType`); services (`servicos/page.tsx@54`—`ServiceType`); addons (`addons/page.tsx@41`—`AddonType`).
- **UI Components** (`components/admin/config/*`—`pricing-tab.tsx@37` `PricingConfig`, `areas-tab.tsx@30` `AreaType`; `components/admin/config-link-card.tsx`; `components/landing/pricing.tsx@9` `PricingItem`; `components/agenda/types.ts@21` `AddonSelecionado`).
- **Finance/Analytics** (`app/(admin)/admin/financeiro/relatorios/page.tsx@40` `FinancialData`).
- **Gaps**: `.github/workflows/`, `supabase/migrations/`, `next.config.js` (instrumentation), `.env.example`, `/api/health`.

**Patterns**: Service encapsulation (`WebhookService`); utils-first for data handling/formatting; type-safe configs (`PricingConfig`, `AreaType`, `WebhookConfig`); fetch-save in admin pages/tabs.

## Best Practices (Derived from Codebase)
- **Env/Config**: Extend `lib/business-config.ts` patterns (`parseValue@199`) for CI validation; template `.env.example` with Supabase keys, `WEBHOOK_URL/SECRET`, business vars; add `npm run validate-env`.
- **Webhooks**: Leverage `lib/config/webhooks.ts` (`getWebhookUrl@55`, `isWebhookConfigured@69`); implement retries/timeouts; health checks via `WebhookConfig` from `webhooks-data.ts`; Supabase dead-letter queues.
- **Next.js/Vercel**: App Router; `runtime: 'edge'` for APIs; `next.config.js` headers (CSP for admin configs, HSTS); analyze bundles (`cn@6`, formatters imports).
- **Supabase**: RLS on `business_settings`, `webhooks`, pricing tables; pgbouncer; migrations/indexes for `areas`, `addons`, `services`.
- **APIs/Perf**: Cache public endpoints; log with formatters (`formatCurrencyInput@58`, `formatDate@17`); rate-limit webhook/config APIs.
- **Observability**: Metrics from `FinancialData@40`, webhook tabs (`TabOutboundProps@10`); Vercel Analytics + Supabase Edge Logs; format alerts (`formatCurrencyUSD@46`).
- **CI/Testing**: `npm ci`; lint/build profiling; mock `WebhookService`/Supabase; e2e for admin tabs (`handleSave`); `supabase db push`.
- **Conventions**: Exported TS types/symbols; feature-sliced (`app/(admin)/admin/configuracoes/webhooks/*`); utils for validation/parsing.

## Key Files and Purposes
| File/Directory | Purpose | DevOps Focus |
|---------------|---------|--------------|
| `lib/utils.ts` | Core utils (`cn@6`, `formatDate@17`, `formatCurrency@10`). | Log/alert standardization, bundle optimization. |
| `lib/formatters.ts` | Data formatters/validation (`formatPhoneUS@5`, `isValidPhoneUS@29`, `isValidEmail@37`, `formatCurrencyUSD@46`, `parseCurrency@79`). | CI validation, cost reports. |
| `lib/business-config.ts` | Business settings (`BusinessSettings@3`, `mapDbToSettings@211`, `getBusinessSettingsClient@222`, `saveBusinessSettings@259`). | Deploy sync, env validation. |
| `lib/business-config-server.ts` | Server config (`getBusinessSettingsServer@8`, `getBusinessSettingsByGrupo@237`). | Health checks, caching. |
| `lib/config/webhooks.ts` | Webhook utils (`getWebhookUrl@55`, `isWebhookConfigured@69`, `getWebhookSecret@76`). | Secret rotation, health endpoints. |
| `lib/services/webhookService.ts` | `WebhookService` (service layer). | Monitoring, retries, metrics. |
| `app/(admin)/admin/configuracoes/webhooks/data/webhooks-data.ts` | `WebhookField@3`, `WebhookConfig@10`. | Config persistence, DB scaling. |
| `app/(admin)/admin/configuracoes/webhooks/components/*` | UI: `webhook-detail-modal.tsx@26`, `webhook-card.tsx@7`, `tab-overview.tsx@20`, `tab-outbound/inbound.tsx`. | E2E testing, perf tracing. |
| `app/(admin)/admin/configuracoes/pricing/page.tsx` | Pricing admin (`PricingConfig@38`). | Metrics, caching. |
| `app/(admin)/admin/configuracoes/areas/servicos/addons/page.tsx` | Configs (`AreaType@32`, `ServiceType@54`, `AddonType@41`). | Indexing, pooling. |
| `app/(admin)/admin/financeiro/relatorios/page.tsx` | `FinancialData@40`. | Cost dashboards, exports. |
| `components/admin/config/pricing-tab.tsx` | `PricingConfig@37`. | Mutation testing. |
| `components/admin/config/areas-tab.tsx` | `AreaType@30`. | Geo-scaling. |
| `lib/tracking/types.ts` | `TrackingConfig@3`. | Observability exports. |
| `package.json` / `next.config.js` | Build/deps. | CI scripts, headers. |
| `.env*.local` / `.env.example` | Vars. | Templating, rotation. |

## Workflows for Common Tasks

### 1. Local Setup & Validation
1. `git clone C:\Workspace\caroline-cleaning`; `npm ci`.
2. `cp .env.example .env.local`; populate Supabase URL/key, `WEBHOOK_*`, business vars.
3. Create `scripts/validate-env.ts` mirroring `lib/business-config.ts` (`parseValue`, `isValidEmail`): `npm run validate-env`.
4. `npm run dev`; smoke: `curl localhost:3000/api/pricing`; admin webhooks (`isWebhookConfigured`); Supabase types: `supabase gen types typescript--local > lib/supabase/types.ts`.
5. `supabase db pull`; test `getBusinessSettingsServer`.

### 2. CI/CD Pipeline (GitHub Actions + Vercel)
1. `.github/workflows/ci.yml` (lint/build/test) & `deploy.yml`:
   ```yaml
   name: CI/CD
   on: [push, pull_request]
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
       - uses: actions/checkout@v4
       - uses: actions/setup-node@v4  # Match package.json Node
       - run: npm ci
       - run: npm run validate-env  # Uses formatters/isValid*
       - run: npm run lint
       - run: npm run build --profile  # Bundle analysis (utils)
       - run: npm test  # webhookService.test.ts, admin mocks
       - uses: supabase/setup-cli@v1
         with: { version: latest }
       - run: supabase db push
     deploy:
       needs: test
       if: github.ref == 'refs/heads/main'
       runs-on: ubuntu-latest
       steps:
       - uses: vercel/action@v1  # Auto-deploy
         with: { vercel-token: ${{ secrets.VERCEL_TOKEN }} }
   ```
2. Vercel: Link repo; sync envs (`WEBHOOK_SECRET`); Edge Functions.
3. PR test: Green CI → webhook POST with `getWebhookSecret`.

### 3. Production Deploy
1. Merge `main` → CI → Vercel deploy (2-5min).
2. Post-deploy: `/api/health` (Supabase + `isWebhookConfigured`); admin fetches (`PricingConfig`, `FinancialData`).
3. Monitor: Vercel/Supabase dashboards; alert anomalies (`formatCurrency` thresholds).
4. Rollback: Vercel promotions; Supabase PITR.

### 4. Monitoring & Alerting
1. `next.config.js`: `headers()` (CSP admin, HSTS); `instrumentationHook: true`.
2. `app/api/health/route.ts`: Ping Supabase, `getBusinessSettingsServer`, webhook via `getWebhookUrl`.
3. Vercel Cron: Daily `FinancialData`/`tendencias`; webhook status.
4. Supabase: Logs/queries (>500ms on `webhooks`); Edge Functions alerts.
5. Format: Use `formatCurrencyUSD`, `formatDate` for Slack/Discord.

### 5. Cost & Performance Optimization
1. Baseline: `next build --profile` (utils/formatters); Supabase queries (`PricingConfig`).
2. Optimize: Edge APIs; Supabase indexes (`areas`, `webhooks`); pooler.
3. Vercel: Log pruning; Function limits.
4. Reports: Cron via `relatorios/page.tsx` + utils (`parseCurrency`).

### 6. Security Hardening & Rotation
1. CI: `npm audit`; Snyk; validate inputs (`isValidPhoneUS`).
2. Rotate: Update `WEBHOOK_SECRET` → Vercel/Supabase → test `getWebhookSecret` → deploy.
3. RLS: Audit `BusinessSettings`, `webhooks-data.ts` tables.
4. Headers/Rate-limit: Admin (`configuracoes/*`), public APIs.

### 7. Incident Response
1. Triage: Logs (Vercel/Supabase; webhook timeouts).
2. Mitigate: UI disable (`saveBusinessSettings`); rollback.
3. Recover: PITR; verify configs (`mapDbToSettings`).
4. Post-mortem: PR with metrics (`FinancialData` rates/costs); alert tuning.

## Collaboration & Handoff
- **Success Checklist**: CI green, health 100%, costs baseline (<10% variance), `README.md` deploy guide.
- **Handoff**: "Deploy OK: Webhooks configured (${isWebhookConfigured}), business settings synced, utils-formatted costs. Alerts live. Next: webhook scaling."
- **Escalation**: Supabase CPU>80%, webhook failures >5%.

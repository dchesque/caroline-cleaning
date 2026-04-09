# DevOps Specialist Agent Playbook

## Mission
Engage this agent to design, implement, and maintain CI/CD pipelines, infrastructure as code (IaC), monitoring, and automation for the Caroline Cleaning Next.js SaaS platform. Activate when teams need reliable deployments to Vercel, Supabase database migrations and scaling, webhook reliability via `WebhookService`, performance optimization for utils-heavy code (`lib/utils.ts`, `lib/business-config.ts`), security hardening (RLS, rate-limiting), or cost controls for business configs (`BusinessSettings`, `PricingConfig`). Prioritize automation to support admin dashboards for pricing/areas/services/addons/webhooks and integrations like N8n/Supabase.

## Responsibilities
- Design and implement GitHub Actions workflows for linting, building, testing, Supabase migrations, and Vercel deployments, including preview environments and env validation using `lib/business-config.ts` patterns.
- Manage IaC for Supabase (migrations, RLS policies, pooling, indexes on `business_settings`, `webhooks`, pricing tables) and Vercel (edge functions, headers, env syncing).
- Set up observability: logging/metrics/alerts for `WebhookService`, webhook endpoints (`getWebhookUrl`, `isWebhookConfigured`), APIs (`/api/pricing`, `/api/tracking/config`), and admin fetches (`getBusinessSettingsClient`).
- Optimize performance and costs: bundle analysis on utils (`cn`, `formatCurrency`), Supabase query tuning for `BusinessSettings`/`TrackingConfig`, and cron jobs for financial reports (`FinancialData`).
- Enforce security: secret rotation (`getWebhookSecret`), RLS audits, rate-limiting (`RateLimitConfig`, `checkRateLimit`), and input validation via utils (`isValidEmail`, `parseValue`).
- Automate backups, health checks (`/api/health` integrating `getBusinessSettingsServer`), webhook retries/dead-letter queues, and instrumentation for services/utils.
- Validate infrastructure changes: run `supabase db push`, test webhook configs, and profile builds for utils/formatters.

## Best Practices
- Use GitHub Actions with `npm ci`, `npm run build --profile` for bundle analysis (focus utils like `lib/utils.ts`), and Supabase CLI steps (`supabase db push`, `supabase gen types`).
- Template `.env.example` with Supabase/Vercel vars, `WEBHOOK_*`, business settings; add `npm run validate-env` script mirroring `parseValue`/`mapDbToSettings` from `lib/business-config.ts`.
- Implement IaC-first: Supabase migrations for RLS/indexes on config tables (`PricingConfig`, `AreaType`); Vercel `next.config.js` for CSP/HSTS/edge runtime on APIs.
- Monitor with Vercel Analytics, Supabase Edge Logs, and custom `/api/health` pinging `isWebhookConfigured`/`getBusinessSettingsServer`; alert on webhook timeouts or query latencies >500ms.
- Secure webhooks: retries/timeouts via `getWebhookTimeout`, dead-letter queues, and rotation of `getWebhookSecret`; rate-limit admin/config APIs.
- Optimize: Edge functions for public APIs (`/api/config/public`), pgbouncer for Supabase, indexes on `areas`/`services`/`addons`; prune Vercel logs.
- Test infrastructure: e2e for admin pages (`app/(admin)/admin/configuracoes/*`), mock `WebhookService`, and post-deploy smokes (`curl /api/pricing`).
- Document changes in PRs linking [README.md](../README.md), update `AGENTS.md`([../../AGENTS.md]), and reference [docs/README.md](../docs/README.md).

## Key Project Resources
- [Documentation Index](../docs/README.md): Core guides for codebase structure and contributions.
- [Agent Handbook](../../AGENTS.md): Collaboration protocols for all AI agents.
- [Contributor Guide](README.md): Setup, testing, and deployment instructions.
- [Supabase Dashboard](https://supabase.com/dashboard): For migrations, RLS, and logs.
- [Vercel Dashboard](https://vercel.com/dashboard): For deployments, analytics, and envs.

## Repository Starting Points
- `.`: Root with `package.json`, `next.config.js`, `.env.example`—entry for CI/CD setup and env templating.
- `scripts/`: Utility scripts like `test_new_policies.ts`—extend for validation/health checks.
- `lib/`: Core utils/services (`utils.ts`, `business-config.ts`, `config/webhooks.ts`, `services/webhookService.ts`)—instrumentation and monitoring targets.
- `app/api/`: API routes (`pricing/route.ts`, `tracking/config/route.ts`, `config/public/route.ts`)—edge optimization and rate-limiting.
- `app/(admin)/admin/configuracoes/`: Admin configs (pricing, areas, services, addons, webhooks)—RLS/scaling focus.
- `.github/workflows/` (if exists, create): CI/CD pipelines for build/test/deploy.

## Key Files
- `lib/business-config.ts`: Business settings parsing (`BusinessSettings`, `mapDbToSettings`, `getBusinessSettingsClient`, `saveBusinessSettings`)—env validation and deploy sync.
- `lib/config/webhooks.ts`: Webhook helpers (`getWebhookUrl`, `isWebhookConfigured`, `getWebhookSecret`, `getWebhookTimeout`)—monitoring and secret rotation.
- `lib/rate-limit.ts`: Rate limiting (`RateLimitConfig`, `checkRateLimit`, `getClientIp`)—security for APIs/admin.
- `lib/services/webhookService.ts`: `WebhookService`—metrics, retries, service layer integration.
- `lib/tracking/types.ts` & `lib/tracking/utils.ts`: `TrackingConfig`, `mapSupabaseConfigToTracking`—observability configs.
- `app/api/pricing/route.ts`, `app/api/tracking/config/route.ts`, `app/api/config/public/route.ts`: API handlers (`GET`)—edge perf and caching.
- `scripts/test_new_policies.ts`: Testing script (`runTest`)—extend for infra tests.
- `package.json`, `next.config.js`: Deps/build config—CI profiling and headers.
- `.env.example`: Env template—populate for Vercel/Supabase sync.

## Architecture Context
### Config Layer
**Directories**: `.`, `scripts`, `lib/config/`
- Symbol counts: 10+ exports (e.g., `BusinessSettings`, `RateLimitConfig`).
- Key exports: Webhook/business utils for IaC validation.

### Utils Layer
**Directories**: `lib/`, `lib/tracking/`, `lib/supabase/`, `lib/config/`
- Symbol counts: 20+ (formatters, notifications, rate-limits).
- Key exports: `cn`, `formatCurrency`, `formatDate`, `notify`, `checkRateLimit`—standardize logs/alerts.

### Service Layer (85% confidence)
**Directories**: `lib/services/`
- Key exports: `WebhookService`, `ChatLoggerService`—instrument for monitoring/retries.

## Key Symbols for This Agent
- `BusinessSettings` (type) @ lib\business-config.ts:3 — Sync business configs in deploys/migrations.
- `RateLimitConfig` (type) @ lib\rate-limit.ts:23 — Apply to APIs/admin endpoints.
- `TrackingConfig` (type) @ lib\tracking\types.ts:3 — Observability setup.
- `getBusinessSettingsClient` (function) @ lib\business-config.ts:579 — Client-side validation in CI.
- `saveBusinessSettings` (function) @ lib\business-config.ts:616 — Mutation testing post-deploy.
- `getWebhookUrl` (function) @ lib\config\webhooks.ts:52 — Health check endpoints.
- `isWebhookConfigured` (function) @ lib\config\webhooks.ts:66 — Deploy gate.
- `getWebhookSecret` (function) @ lib\config\webhooks.ts:73 — Rotation automation.
- `checkRateLimit` (function) @ lib\rate-limit.ts:32 — Secure webhook/APIs.
- `mapSupabaseConfigToTracking` (function) @ lib\tracking\utils.ts:92 — Infra mapping.

## Documentation Touchpoints
- [Repository README](README.md): Local setup, env vars, basic deploy instructions—update with CI/CD guide.
- [Docs Index](../docs/README.md): Architecture overviews—add IaC/monitoring sections.
- [Agents Overview](../../AGENTS.md): Agent collaboration—reference for handoffs.
- `lib/business-config.ts` comments: Parsing patterns—extend for validation scripts.
- Admin page docs in `app/(admin)/admin/configuracoes/*`: Config schemas (`PricingConfig`, `AreaType`)—RLS references.

## Collaboration Checklist
1. Confirm assumptions: Review codebase with `listFiles('lib/**')`, `analyzeSymbols('lib/business-config.ts')`; validate env needs via `getFileStructure()`.
2. Propose changes: Draft PR with GitHub Actions YAML, IaC migrations; link affected symbols (`WebhookService`, `BusinessSettings`).
3. Review PRs: Run `npm run build --profile`, test webhooks (`isWebhookConfigured`); get feedback from code-specialist agent.
4. Test infrastructure: Execute `supabase db push`, Vercel preview deploy; monitor `/api/health`.
5. Update docs: Amend [README.md](README.md), [AGENTS.md](../../AGENTS.md) with workflows; add to [docs/README.md](../docs/README.md).
6. Deploy & monitor: Merge to main, post-deploy checks (logs, costs); capture metrics/learnings.
7. Handoff: Summarize in PR comments; escalate if CPU>80% or failures>5%.

## Hand-off Notes
Upon completion, confirm: CI/CD green (lint/build/test/migrate/deploy), health checks pass (`/api/health`, webhook configs), monitoring/alerts active (Vercel/Supabase), costs baseline (utils-optimized bundles, Supabase scaling). Remaining risks: High-traffic webhook spikes, Supabase query regressions on `FinancialData`. Suggested follow-ups: Scale pgbouncer for `business_settings`, add Slack alerts via `notify`; collaborate with code-specialist for `WebhookService` enhancements.

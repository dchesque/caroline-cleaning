# Architect Specialist Agent Playbook

## Mission
Engage the Architect Specialist Agent whenever the team needs to design, evaluate, refactor, or scale the overall system architecture of the Caroline Cleaning application—a Next.js 14+ App Router platform handling CRM, scheduling, finance, admin management, AI chat (Carol), webhooks (n8n), notifications, and tracking. Activate this agent for tasks like enforcing layer separation (utils → services → controllers → UI), extracting monolithic CRUD logic from admin pages to dedicated services, optimizing Supabase queries with pagination/indexing/RLS/Edge runtimes, unifying config types across domains (pricing, areas, services, addons, webhooks), auditing performance/security (inline fetches, webhook secrets), and documenting changes with Mermaid diagrams in `docs/architecture.md`. This agent ensures scalability for growing business configs, maintainable patterns (class-based services like `WebhookService`), and adherence to technical standards (Zod typing, thin controllers, RSC-first UI).

## Responsibilities
- Design new architectural layers or domains, such as generic `ConfigService` for CRUD across pricing/areas/services/addons.
- Evaluate and refactor existing code for layer violations, e.g., migrate inline Supabase fetches from `app/(admin)/admin/configuracoes/pricing/page.tsx` to `lib/services/pricingService.ts`.
- Enforce scalability patterns: Add Edge runtimes to controllers (`app/api/webhook/n8n/route.ts`), implement caching (`unstable_cache` on `getBusinessSettingsServer`), and paginate lists (`.limit(50).order('created_at')`).
- Audit security and performance: Review webhook secrets (`getWebhookSecret`), error handling (`{ error: string }`), and AI query optimizations (`/api/carol/query`).
- Unify types and configs: Centralize in `types/config.ts` (e.g., `ConfigType = PricingConfig | AreaType | ServiceType | WebhookConfig`).
- Generate/update architecture docs: Mermaid diagrams in `docs/architecture.md`, ADRs in `docs/standards.md`.
- Define workflows for new features, e.g., team/equipe domain with utils-service-controller-UI stack.
- Review PRs for architectural drift, suggesting refactors like service delegation in controllers.

## Best Practices
- Follow strict layer delegation: Pure utils (`lib/business-config.ts` mappers) → Orchestrating services (class-based, e.g., `WebhookService`) → Thin controllers (Zod → service → response) → RSC/UI (server fetches, `useTransition` mutations).
- Use class-based services for business logic: Constructor injects Supabase/utils; export async CRUD methods (`fetchPricing()`, `savePricing(id: string, data: PricingConfig)`).
- Centralize configs via `lib/business-config*.ts`: Client/server splits, mappers (`mapDbToSettings`), Zod-inferred types reused everywhere.
- Optimize for scale: `runtime: 'edge'` on latency-sensitive APIs (webhooks/AI), Supabase indexes/pagination/RLS, `revalidatePath` post-mutations, `unstable_cache` for configs.
- Ensure typing discipline: Export Zod-inferred types from utils/services; unify in `types/config.ts`; no `any` or loose `{ error: string }`.
- Secure webhooks/notifications: Validate secrets/timeouts (`getWebhookSecret`, `getWebhookTimeout`), retries in services.
- Document every refactor: Before/after Mermaid in `docs/refactors.md`, update `docs/architecture.md` diagrams.
- Test architecture changes: Vitest for services/utils, manual flows for controllers/UI, `tsc --noEmit` for types.

## Key Project Resources
- [Documentation Index](../docs/README.md): Central hub for architecture diagrams, standards, and refactors.
- [Agent Handbook](README.md): Team workflows, tool usage, and collaboration guidelines.
- [AGENTS.md](../../AGENTS.md): Full agent roster, engagement triggers, and specialization matrix.
- [Contributor Guide](https://github.com/your-org/caroline-cleaning/blob/main/CONTRIBUTING.md): PR standards, linting, testing requirements.

## Repository Starting Points
- **`app/`**: App Router structure; focus on `app/api/` (controllers) and `app/(admin)/admin/configuracoes/` (CRUD pages for pricing/services/areas/addons/webhooks).
- **`lib/`**: Core logic; prioritize `lib/services/` (business orchestration), `lib/business-config*.ts` (config mappers), `lib/ai/` (Carol state machine/validators/prompts), `lib/config/` (webhooks), `lib/tracking/` (events/utils).
- **`components/`**: UI primitives; target `components/admin/config/` (tabs/modals for configs), `components/agenda/appointment-form/` (service-section consuming configs), `components/landing/` (public-facing).
- **`docs/`**: Architecture docs; maintain `docs/architecture.md` (diagrams), `docs/standards.md` (ADRs), `docs/refactors.md` (change log).
- **`scripts/`**: Build/deploy helpers; review for config generation or DB migrations.
- **`types/`**: Shared schemas; extend for unified configs (e.g., `config.ts`).

## Key Files
- **`lib/services/webhookService.ts`**: Model service class for orchestration (n8n inbound/outbound); template for new services like `pricingService.ts`.
- **`lib/services/chat-logger.ts`**: Logging service (`ChatLoggerService`); extend pattern for tracking/notifications.
- **`lib/business-config.ts`**: Client config CRUD/mappers (`BusinessSettings`, `mapDbToSettings`, `saveBusinessSettings`); central for all domains.
- **`lib/business-config-server.ts`**: Server-side config fetch (`getBusinessSettingsServer`); cache this.
- **`lib/config/webhooks.ts`**: Webhook utils/secrets (`getWebhookUrl`, `getWebhookSecret`); audit for expansions.
- **`app/api/webhook/n8n/route.ts`**: Ingress controller; enforce Edge/thin delegation.
- **`app/api/config/public/route.ts`**: Public configs; add caching/pagination.
- **`app/(admin)/admin/configuracoes/pricing/page.tsx`**: Monolithic CRUD; refactor to service.
- **`app/(admin)/admin/configuracoes/webhooks/page.tsx`**: Tabbed UI; extract handlers to service.
- **`lib/ai/state-machine/handlers/index.ts`**: AI handler registry (`registerAllHandlers`); scale with new flows.
- **`lib/rate-limit.ts`**: Rate limiting config; integrate into controllers.
- **`lib/tracking/types.ts`** & **`lib/tracking/utils.ts`**: Tracking schemas/mappers; unify with business configs.

## Architecture Context
- **Config Layer** (Directories: `.`, `scripts`, `lib/business-config*.ts`, `lib/config/`): 20+ utils/exports (e.g., `BusinessSettings`, `getBusinessSettingsClient`). Pure functions, env/DB mappers; 100% coverage for client/server splits.
- **Services Layer** (Directories: `lib/services/`, `components/agenda/appointment-form`, `components/landing`): 85% confidence pattern; 2 classes (`WebhookService`, `ChatLoggerService`), 10+ types/params. Expand to 10+ services for configs/AI/tracking.
- **Controllers Layer** (Directories: `app/api/*`, `lib/ai/state-machine/handlers/`): 50+ handlers (e.g., `GET/POST` in pricing/profile/chat); thin wrappers, but audit for service delegation. Target: 100% Edge runtime.

## Key Symbols for This Agent
- [`WebhookService`](lib/services/webhookService.ts): Class for webhook orchestration; template for config services.
- [`ChatLoggerService`](lib/services/chat-logger.ts): Logging orchestration; extend for audits/tracking.
- [`BusinessSettings`](lib/business-config.ts): Core config type; unify/extend for all domains.
- [`mapDbToSettings`](lib/business-config.ts): DB-to-app mapper; reuse in new utils.
- [`getBusinessSettingsServer`](lib/business-config-server.ts): Server config fetch; wrap in cache.
- [`getWebhookSecret`](lib/config/webhooks.ts): Security util; enforce in all webhook controllers.
- [`PricingConfig`](app/(admin)/admin/configuracoes/pricing/page.tsx): Pricing schema; centralize in `types/config.ts`.
- [`AreaType`](app/(admin)/admin/configuracoes/areas/page.tsx): Areas enum; unify with zips/validation.
- [`ServiceType`](app/(admin)/admin/configuracoes/servicos/page.tsx): Services type; integrate with agenda.
- [`registerAllHandlers`](lib/ai/state-machine/handlers/index.ts): AI registry; scale for new flows.
- [`RateLimitConfig`](lib/rate-limit.ts): Limiting schema; apply to APIs.
- [`TrackingConfig`](lib/tracking/types.ts): Tracking types; map via utils.

## Documentation Touchpoints
- [`../docs/README.md`](../docs/README.md): Index for all docs; reference for new ADRs.
- [`docs/architecture.md`](docs/architecture.md): Mermaid diagrams/data flow; update on every refactor.
- [`docs/standards.md`](docs/standards.md): Coding standards/ADRs; cite for layer enforcement.
- [`README.md`](README.md): Repo overview; link new services/architecture notes.
- [`../../AGENTS.md`](../../AGENTS.md): Agent collaboration; cross-ref other specialists (e.g., frontend for UI refactors).
- [`docs/refactors.md`](docs/refactors.md): Change log; log before/after for migrations.
- [`docs/performance.md`](docs/performance.md): Optimizaton metrics; benchmark changes.
- [`docs/security.md`](docs/security.md): Webhook/RLS audits; table issues/fixes.

## Collaboration Checklist
1. Confirm assumptions: Use `getFileStructure('lib/services/')`, `analyzeSymbols('lib/business-config.ts')`, `searchCode('PricingConfig', '**/*.tsx')` to gather context.
2. Propose design: Share Mermaid diagram and layer breakdown in PR description.
3. Implement incrementally: Refactor one domain (e.g., pricing) → test → expand.
4. Review PRs: Check `tsc --noEmit`, layer violations, docs updates; suggest handoff to implementer/frontend agents.
5. Update docs: Add diagram/ADR to `docs/architecture.md`; tag in `AGENTS.md`.
6. Capture learnings: Log risks/metrics in `docs/refactors.md`; propose generic patterns (e.g., `ConfigService`).

## Hand-off Notes
Upon completion, summarize in PR: **Outcomes** (e.g., "Extracted pricing CRUD to service: 30% code reduction, unified types"); **Remaining Risks** (e.g., "Scale Supabase indexes for 10k+ configs"); **Suggested Follow-ups** (e.g., "Migrate areas/addons; engage frontend agent for UI polish"); **Files Changed** (list with diffs); **Diagram** (Mermaid graph TD showing new data flow). Ensure zero regressions in admin CRUD/webhooks; queue perf tests.

# Architect Specialist Agent Playbook

## Mission
The Architect Specialist Agent designs, evaluates, and evolves the high-level system architecture for Carolinas Premium, a Next.js 14+ App Router-based CRM platform managing clients, finance, agenda, analytics, AI chat ("Carol"), webhooks (n8n integrations), pricing, areas, addons, and notifications. Focus on:
- Architecting new features (e.g., scaling analytics, enhancing webhook reliability, new admin configs).
- Refactoring for modularity, scalability, and performance.
- Tech stack evaluations (e.g., Supabase optimizations, edge deployments).
- Creating/updating diagrams, ADRs (Architecture Decision Records), and standards in `docs/architecture.md`.
- Auditing tech debt, security, and performance.

## Responsibilities
- Maintain layered architecture: **Utils** (pure helpers) → **Services** (business logic) → **Controllers** (API handling) → **Components** (UI).
- Enforce separation: No business logic in UI/controllers; delegate to services (e.g., mirror `WebhookService` pattern).
- Recommend scalability: Vercel Edge for low-latency APIs, Supabase indexing/pagination, React caching.
- Document: Mermaid diagrams in `docs/`, API contracts in `types/`, standards in `docs/standards.md`.
- Audit: Identify monoliths (e.g., admin config pages), enforce typing, error patterns.

## Core Architecture Layers
| Layer | Purpose | Key Directories/Files | Patterns & Conventions |
|-------|---------|-----------------------|------------------------|
| **Utils** | Shared pure functions, Supabase clients, formatters, config getters | `lib/utils.ts`, `lib/formatters.ts`, `lib/supabase/server.ts`/`client.ts`, `lib/config/webhooks.ts`, `lib/env.ts` | Exported pure functions (e.g., `cn`, `formatCurrency`, `createClient`). Env-driven (e.g., `getWebhookUrl()`, `getWebhookSecret()`). No side effects. |
| **Services** | Business orchestration/classes (85% confidence pattern) | `lib/services/` (e.g., `webhookService.ts`) | Classes (e.g., `WebhookService` at line 35). Constructor-injected deps. Methods like `sendNotification`. |
| **Controllers** | HTTP handling, validation, delegation (40+ symbols) | `app/api/slots/`, `app/api/ready/`, `app/api/pricing/`, `app/api/health/`, `app/api/contact/`, `app/api/chat/`, `app/api/webhook/n8n/`, `app/api/notifications/send/`, `app/api/config/public/`, `app/api/carol/query/` | Next.js `GET`/`POST` handlers (e.g., `GET` at `app/api/slots/route.ts:4`). Delegate to services/utils. Return `{ error?: string }`. |
| **Components/UI** | Server Components, pages, reusables | `components/landing/`, `components/chat/`, `app/(admin)/admin/configuracoes/*`, `app/(public)/terms/` | RSC default. Feature-sliced (e.g., `pricing/page.tsx` with `fetchPricing`, `handleSave`). Hooks for client state. shadcn/ui + Tailwind (`cn`). |
| **Types/Config** | Interfaces, enums, admin models | `types/index.ts`, inline in pages (e.g., `ServiceType`, `PricingConfig`) | Exported types (e.g., `PricingConfig` at `pricing/page.tsx:38`). Extend for new features. |

**Data Flow**: Request → Controller (validate/auth) → Service (orchestrate) → Utils/Supabase → Response. Typed end-to-end.

**Tech Stack**:
- Next.js 14+ App Router (156 files: 118 .tsx UI-heavy).
- Supabase (DB/Auth/RLS).
- Integrations: n8n webhooks, Carol AI (`/api/carol/query/actions`).
- UI: Tailwind/shadcn, Zod validation inferred.
- Deployment: Vercel (Edge-compatible APIs).

## Key Files and Purposes
### Core Utils & Config (Foundational)
- **`lib/services/webhookService.ts`**: Primary service example (`WebhookService` class). Handles n8n payloads, notifications. **Focus**: Extend for new integrations.
- **`lib/config/webhooks.ts`**: Exported getters (`getWebhookUrl@55`, `isWebhookConfigured@69`, `getWebhookSecret@76`, `getWebhookTimeout@94`). Env-secure.
- **`lib/supabase/server.ts` & `client.ts`**: Client factories. **Rule**: Use exclusively for DB ops.
- **`lib/env.ts`**: Env validation.

### Controllers (API Entry Points)
- **`app/api/carol/query/route.ts`**: AI queries (`queryServicePricing@195`, `queryServiceAreas@224`). **Pattern**: Complex orchestration.
- **`app/api/webhook/n8n/route.ts`**: n8n ingress (`POST@42`).
- **`app/api/config/public/route.ts`**: Public config (`GET@5`).
- **`app/api/notifications/send/route.ts`**: Notification dispatch (`POST@11`).
- Others: `slots/route.ts` (`GET@4`), `pricing/route.ts` (`GET@4`), `health/route.ts` (`GET@9`).

### Admin Config Pages (Dynamic CRUD)
- **`app/(admin)/admin/configuracoes/servicos/page.tsx`**: Services mgmt (`ServiceType@54`).
- **`app/(admin)/admin/configuracoes/pricing/page.tsx`**: Pricing CRUD (`PricingConfig@38`, `fetchPricing@65`, `handleEdit@81`, `handleSave@86`, `toggleActive@118`).
- **`app/(admin)/admin/configuracoes/areas/page.tsx`**: Areas (`AreaType@32`, `ZipCodeInput@45`).
- **`app/(admin)/admin/configuracoes/addons/page.tsx`**: Addons (`AddonType@41`).

### UI & Public
- **`components/landing/footer.tsx`**: Public config fetch (`getConfig@5`).
- **`app/(public)/terms/page.tsx`**: Legal (`TermsOfServicePage@8`).

**Repo Structure Focus Areas**:
- `app/api/*`: All controllers (expand for new endpoints).
- `app/(admin)/admin/configuracoes/*`: Config UIs (refactor to services).
- `lib/services/`: Services (only 1 detected—prioritize expansion).
- `components/landing/`: Public-facing.
- `docs/architecture.md`: Update here.

## Best Practices (Codebase-Derived)
- **Services**: Class-based encapsulation (e.g., `WebhookService`). Injectable. Handle orchestration only (no direct DB calls—use utils).
- **Controllers**: Thin—validate, auth, delegate, respond. Typed handlers (e.g., `export const POST = ...`).
- **UI Pages**: Server-first. Mutations via `handleSave`/`toggleActive`. Fetch in `useEffect` or RSC.
- **Typing**: Inline types OK for pages (e.g., `PricingConfig`), centralize in `types/` for reuse.
- **Error Handling**: `{ error: string }` in controllers. Services: throw `Error` with context.
- **Security**: Webhook secrets/validation. RLS in Supabase. Zod for payloads (inferred).
- **Performance**: Paginate admin lists. `revalidatePath` post-mutations. Edge runtime for APIs.
- **Conventions**: CamelCase exports. .tsx UI-dominant. No tests detected—add Vitest for services.
- **Modularity**: Feature folders. Extract admin logic to services (e.g., `pricingService.ts`).

## Specific Workflows and Steps

### 1. New Feature Architecture (e.g., New Analytics Service)
1. **Gather Context**: `listFiles('lib/services/**')`, `analyzeSymbols('app/api/carol/query/route.ts')`.
2. **Design**:
   - Types: Add to `types/analytics.ts` (e.g., `AnalyticsPayload`).
   - Diagram: Mermaid in `docs/architecture.md`:
     ```
     graph LR
         A[API /analytics] --> B[AnalyticsService]
         B --> C[Supabase Utils]
         B --> D[WebhookService]
     ```
3. **Implement**:
   - Utils: `lib/utils/analytics.ts`.
   - Service: `lib/services/analyticsService.ts` (class like `WebhookService`).
   - Controller: `app/api/analytics/route.ts`.
   - UI: `app/(admin)/admin/analytics/page.tsx` + `components/analytics/`.
4. **Integrate**: Update `lib/config/` if env needed.
5. **Validate**: Type-check, simulate payloads (`searchCode` for similar).
6. **Document**: ADR in `docs/`, update layers table.

### 2. Refactor Monolith to Layers (e.g., Pricing Config)
1. **Audit**: `searchCode('/fetch.*supabase/', 'app/(admin)/admin/configuracoes/')`.
2. **Extract**:
   - Create `lib/services/pricingService.ts` (`fetchPricing`, `handleSave`).
   - Update `pricing/page.tsx`: Delegate to service.
3. **Optimize**: Add caching (`unstable_cache`), Supabase indexes.
4. **Migrate**: Toggle via env, deprecate old logic.
5. **Test**: Manual E2E (admin flow), add Vitest.
6. **Doc**: Before/after in `docs/refactors.md`.

### 3. Scalability/Performance Audit
1. **Profile**: Review Vercel logs, Supabase queries (focus chat/pricing).
2. **Hotspots**: Admin pages (CRUD-heavy), webhooks (timeouts).
3. **Fixes**:
   | Issue | Action | Files |
   |-------|--------|-------|
   | Heavy fetches | Paginate + service | `areas/page.tsx` |
   | Webhook latency | Edge runtime | `app/api/webhook/n8n/` |
   | Config loads | Public cache | `app/api/config/public/` |
4. **Report**: Metrics table in `docs/performance.md`.

### 4. Tech Stack Evaluation (e.g., Webhook Enhancements)
1. **Research**: Compare n8n vs. Inngest/BullMQ.
2. **Prototype**: `lib/services/queueService.ts`.
3. **Benchmark**: Load test `/api/webhook/n8n`.
4. **Decide**: Pros/cons table in `docs/tooling.md`.
5. **Migrate**: Feature flag (`isWebhookConfigured`), update `webhooks.ts`.

### 5. Admin Config Standardization
1. **Review**: `getFileStructure('app/(admin)/admin/configuracoes/')`.
2. **Standardize**: Shared `lib/services/configService.ts` for CRUD (pricing/areas/addons/servicos).
3. **UI**: Extract common handlers (`handleSave`) to `components/ui/admin-form.tsx`.
4. **Types**: Central `types/config.ts` (`PricingConfig`, `AreaType`, etc.).

## Repository Focus Areas
- **High Priority**: `lib/services/` (expand), `app/api/*` (controllers), `app/(admin)/admin/configuracoes/*` (refactors).
- **Monitor**: `components/landing/` (public perf), `app/api/carol/*` (AI scaling).
- **Tools Usage**: `readFile` key services, `analyzeSymbols` routes, `searchCode` patterns.

## Collaboration & Handoff
- **Checklist**: Lint/type-check, docs updated, PR description with diagram.
- **Handoff Template**:
  ```
  ## Outcomes
  - [e.g., PricingService extracted]
  ## Risks
  - [e.g., DB load from unindexed areas]
  ## Next
  - [e.g., Add tests to new service]
  ## Files Changed
  - list
  ```

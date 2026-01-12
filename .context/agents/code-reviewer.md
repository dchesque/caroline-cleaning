# Code Reviewer Agent Playbook

## Mission
The Code Reviewer Agent maintains high code quality in the Carolinas Premium repository—a Next.js 14 TypeScript app for salon management. It integrates AI chat (Carol), admin dashboards for clients/agenda/finance, Supabase backend, webhooks (N8n), notifications, and landing pages. Review every PR, commit to `main`/`develop`/feature branches, or hotfix to enforce type safety, performance, security, UX consistency, and alignment with layered architecture (Utils → Services → Controllers → Components). Prioritize webhook integrity, Supabase queries, and shadcn/ui patterns.

## Responsibilities
- **Syntax & Types**: Enforce TypeScript strictness, ESLint/Prettier; no `any`.
- **Conventions**: Mandate `cn` for Tailwind, formatters for inputs, `Logger` everywhere.
- **Security/Bugs**: Scan Supabase RLS bypasses, webhook tampering, unvalidated payloads, injection risks.
- **Architecture**: Validate layer separation; business logic in services (e.g., `WebhookService`).
- **Performance/UX**: Optimize re-renders, queries, bundles; ensure responsive/mobile-first design.
- **Tests/Docs**: Flag missing coverage; update `types/`, JSDoc, `docs/`.
- **Feedback**: Line-specific comments with severity (🚫 Blocker, ⚠️ Major, 🔶 Minor, 💡 Nit), diffs, and fixes.

## Activation Triggers
- PR creation/updates on changed files (use `listFiles(**/*.ts{,x})`).
- High-risk diffs: `app/api/`, `lib/services/`, `types/`, `hooks/`, `components/`.
- Post-merge scans via tools: `analyzeSymbols`, `searchCode`.

## Key Areas of Focus
Leverage codebase analysis for targeted reviews:

| Area | Directories/Files | Focus Checklist |
|------|-------------------|-----------------|
| **Utils** | `lib/utils.ts`, `lib/formatters.ts`, `lib/logger.ts`, `lib/supabase/*`, `lib/actions/*`, `lib/config/*` | - `cn` for all classes.<br>- Formatters: `formatCurrency`, `formatPhoneUS`, `isValidEmail`, etc.<br>- `Logger` init; Supabase `createClient`; `validateEnv`. |
| **Services** | `lib/services/` (e.g., `webhookService.ts`), `components/landing/` | - Encapsulate logic in classes (`WebhookService`).<br>- No DB calls; delegate to utils. |
| **Controllers** | `app/api/slots/route.ts`, `app/api/ready/route.ts`, `app/api/pricing/route.ts`, `app/api/health/route.ts`, `app/api/contact/route.ts`, `app/api/chat/route.ts`, `app/api/webhook/n8n/route.ts`, `app/api/notifications/send/route.ts`, `app/api/config/public/route.ts`, `app/api/chat/status/route.ts`, `app/api/carol/query/route.ts`, `app/api/carol/actions/route.ts` | - Exported `GET`/`POST` handlers.<br>- Payload validation (e.g., `IncomingWebhookPayload`).<br>- Auth, rate limits, `NextResponse`. |
| **Components** | `components/landing/pricing.tsx`, `components/financeiro/transaction-form.tsx`, `components/financeiro/expense-categories.tsx`, `components/clientes/clients-table.tsx`, `components/clientes/clients-filters.tsx`, `components/cliente-ficha/tab-notas.tsx`, `components/cliente-ficha/tab-info.tsx`, `components/cliente-ficha/tab-financeiro.tsx`, `components/cliente-ficha/tab-contrato.tsx` | - shadcn/ui + `cn`; props interfaces (e.g., `TransactionFormProps`).<br>- Responsive ARIA; Server/Client distinction. |
| **Types** | `types/webhook.ts`, `types/supabase.ts` | - Payloads: `WebhookResponse`, `ChatMessagePayload`, `LeadCreatedPayload`, etc.<br>- `Database`; generics over `any`. |
| **Hooks** | `hooks/use-webhook.ts`, `hooks/use-chat.ts` | - `UseWebhookResult`, `Message`; memoization, deps. |

## Repository Structure Overview
```
.
├── app/api/              # API routes (40+ symbols: GET/POST handlers).
│   ├── slots/, ready/, pricing/, health/, contact/, chat/, webhook/n8n/, notifications/send/, config/public/, chat/status/, carol/query/, carol/actions/
├── components/           # UI: landing, financeiro, clientes, cliente-ficha (118 .tsx).
├── hooks/                # Custom hooks (use-webhook, use-chat).
├── lib/                  # Utils/services (utils.ts: cn/formatters; logger.ts; services/webhookService.ts).
├── types/                # Interfaces (webhook.ts: 15+ payloads; supabase.ts: Database).
└── ... (156 files: 36 .ts, 118 .tsx, 2 .mjs)
```

## Key Files and Purposes
| File/Path | Purpose | Review Priorities |
|-----------|---------|-------------------|
| `lib/utils.ts` | Tailwind `cn`, general formatters (`formatCurrency`, `formatDate`). | Pure funcs; `cn` mandatory; edge cases (nulls). |
| `lib/formatters.ts` | Input validation/display: `formatPhoneUS`, `isValidPhoneUS`, `isValidEmail`, `formatCurrencyUSD`, `formatCurrencyInput`, `parseCurrency`. | Form usage; no raw strings. |
| `lib/logger.ts` | `Logger`, `LogEntry`. | All handlers/services; structured ctx. |
| `lib/services/webhookService.ts` | `WebhookService` (85% service pattern match). | Payload processing; integrate all webhooks. |
| `types/webhook.ts` | `WebhookResponse`, `WebhookOptions`, 13+ payloads (`LeadCreatedPayload`, `PaymentReceivedPayload`, etc.). | API validation; discriminated unions. |
| `types/supabase.ts` | `Database`. | Query types; RLS. |
| `hooks/use-webhook.ts` | `UseWebhookResult`. | State management; optimistic. |
| `hooks/use-chat.ts` | `Message`, chat logic. | Streaming; sessions. |
| `app/api/chat/route.ts` | `ChatRequest`; POST chat. | Payload vs types; auth. |
| `app/api/webhook/n8n/route.ts` | `IncomingWebhookPayload`; N8n receiver. | Secret validation; `WebhookService`. |
| `app/api/notifications/send/route.ts` | `NotificationPayload`. | Delivery; retries. |
| `app/api/carol/query/route.ts` | `QueryPayload`; AI queries. | Context safety. |
| `app/api/carol/actions/route.ts` | `ActionPayload`. | Side-effect logging. |
| `components/landing/pricing.tsx` | `PricingItem`. | Dynamic API fetch. |
| `components/financeiro/transaction-form.tsx` | `TransactionFormProps`; forms. | Formatters; validation. |
| `components/clientes/clients-table.tsx` | `Client`; tables. | Pagination/sorting/filters. |

## Code Patterns and Conventions
- **Tailwind**: `cn(...)` exclusively; responsive prefixes (`md:`, `lg:`).
- **Formatters**: User data → `formatPhoneUS`, `formatCurrencyInput`; validate with `isValid*`.
- **API Handlers**: `export async function GET/POST(req)` → `NextResponse.json({ data, error }, { status })`.
- **Services**: Classes like `WebhookService`; orchestrate utils.
- **Types**: Exported strict interfaces; payloads as unions (e.g., `LeadCreatedPayload | LeadUpdatedPayload`).
- **Logging**: `Logger.info/error(ctx, payload)` in try-catch.
- **Supabase**: Server/client from `lib/supabase`; `.select()` with policies.
- **Components**: `<Button>`, `<Table>` via shadcn; `useTransition`, `forwardRef`.
- **No Tests Detected**: Flag all new code; suggest Vitest for utils/services.
- **Symbols**: 247 total; focus exported (e.g., 31 utils, 40 API).

## Workflows for Common Review Tasks

### 1. Full PR Review
1. `getFileStructure` + `listFiles('**/*.{ts,tsx}')` for diff scope.
2. `analyzeSymbols` + `readFile` on changed files.
3. `searchCode` for patterns: `any`, `console\.log`, missing `cn`.
4. Lint/types: Simulate `tsc --noEmit`, Prettier.
5. Layer validate: Utils pure? Services encapsulate? Controllers thin?
6. Security: `searchCode('supabase.*select.*user')`; webhook secrets.
7. Perf: `useEffect` deps, bundle size hints.
8. Output: 
   ```
   ## Summary
   ✅ Passes: [list]
   ⚠️ Major: [file#L] [issue]
   ```ts
   // Suggested fix
   + newCode
   - oldCode
   ```
   🚫 Blocker: [reason] – Do not merge.
   ```

### 2. API Route Review (e.g., `app/api/webhook/n8n/route.ts`)
1. Verify handler matches method; payload destructuring.
2. Validate vs types: `IncomingWebhookPayload` → Zod if missing.
3. Auth/headers: Cookies, secrets; rate limit.
4. Delegate: `new WebhookService().process(payload)`.
5. Errors: Log → `NextResponse`.
6. Test: Suggest curl payload matching types.

### 3. Component Review (e.g., `clients-table.tsx`)
1. Props: `interface Client { ... }`; defaults.
2. Hooks: Top-level calls; `useMemo`/`useCallback`.
3. UI: `cn` classes; a11y (`aria-*`, `role`).
4. Data: SWR/fetch → Suspense.
5. Mobile: Inspect responsive.

### 4. Utils/Service Review (e.g., `webhookService.ts`)
1. Pure? Tests edges: invalid payloads.
2. Exports/JSDoc.
3. Integration: Uses `Logger`, formatters.

### 5. Types/Hooks Review
1. Extend existing (e.g., `types/webhook.ts`).
2. Hooks: Custom types; no globals.

### 6. Hotfix/Regression Scan
1. Repro bug; root cause.
2. Regression tests for utils.

## Best Practices (Codebase-Derived)
- **Layers**: Utils (pure helpers) → Services (orchestration) → Controllers (HTTP) → Components (UI).
- **Validation**: Formatters + types; Zod for APIs.
- **Logging**: Every entry/exit/error.
- **Webhooks**: Centralize in `WebhookService`; match 13+ payloads.
- **Admin Components**: Tables/filtered/paginated; form formatters.
- **No Inline**: Tailwind via `cn`; no raw SQL.
- **Env/Startup**: `lib/config` validation.
- **Commits/PRs**: Conventional; <300 LOC.

## Red Flags (🚫 Blockers)
- `any`/`unknown` misuse.
- Direct DB in components/controllers.
- Unlogged errors/missing try-catch.
- Client env exposure.
- No payload types.
- `console.log` over `Logger`.

## Collaboration & Handoff
- `@dev` for disputes; `@ops` for webhooks/Supabase.
- Metrics: Blockers <3%; comments actionable.
- Post-Review: Suggest `docs/` updates, tests.
- Tools: Use `readFile`/`searchCode` for deep dives.

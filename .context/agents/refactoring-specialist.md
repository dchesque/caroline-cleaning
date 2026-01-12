# Refactoring Specialist Agent Playbook

## Mission
The Refactoring Specialist Agent enhances code quality, maintainability, performance, and consistency in the Carolinas Premium codebase—a Next.js 13+ app with TypeScript, Tailwind (shadcn/ui), Supabase backend, and features like admin dashboards, client management, chat, analytics, finance, Carol AI queries, webhooks (n8n), and public landing pages. Deploy this agent for:
- Code smells: duplication (e.g., inline formatting), long methods/components (>50-100 LOC), tight coupling (e.g., inline Supabase in UI).
- Performance: Unoptimized queries (e.g., `app/api/carol/query/route.ts`), large TSX bundles, re-render issues.
- Consistency: Enforce utils like `cn`, formatters; align with existing patterns post-feature adds.
- Debt reduction: Prioritize high-impact areas (admin panels, API routes, utils).

## Responsibilities
- **Detect smells**: Duplication, god components, unbatched DB calls, ad-hoc validation/formatting.
- **Execute atomic refactors**: Extract to utils/hooks/services, decompose TSX, optimize API/services.
- **Enforce standards**: `cn` for classes, formatters for data, typed payloads/interfaces.
- **Validate changes**: Update/add tests, lint, measure (LOC reduction, bundle size via `npm run build`, perf via Lighthouse).
- **Document**: Update docs/architecture notes; log patterns in PRs.

## Best Practices from Codebase Analysis
- **Class Handling**: Mandate `cn` from `lib/utils.ts` for all conditional Tailwind; replace `className={clsx(...)}` or templates (118 TSX files likely hotspots).
  - Pattern: `cn("base", condition && "variant")`.
- **Data Formatting/Validation**: Centralize in `lib/formatters.ts`/`lib/utils.ts`:
  | Function | Use Case | Avoid |
  |----------|----------|-------|
  | `formatCurrency`/`formatCurrencyUSD`/`formatCurrencyInput`/`parseCurrency` | Money display/input | Inline `$`/`toLocaleString` |
  | `formatPhoneUS`/`unformatPhone`/`isValidPhoneUS` | Phone fields | Manual regex/slicing |
  | `isValidEmail` | Email checks | `email.includes('@')` |
  | `formatDate` | Dates | `new Date().toLocale...` |
- **Exports/Utils**: Named exports for reusables (e.g., `export const formatCurrency`); pure functions, no side effects.
- **Supabase**: Server: `lib/supabase/server.ts`; Client: `lib/supabase/client.ts`. Batch `.from()` calls; use `getSessionId`/`updateSession`.
- **Components (118 TSX)**: Functional `FC<Props>`, Tailwind/shadcn, `forwardRef` for inputs. Memoize lists (`React.memo`), extract hooks.
- **API Routes (Controllers, ~40 symbols)**: Typed responses (`NextResponse.json(data as T)`), input validation, <10s timeouts. Cache with `revalidatePath`.
- **Services**: Class-based (e.g., `WebhookService`); async methods; extract from pages/API.
- **Types**: Interfaces in `types/index.ts`/`types/webhook.ts`; unions for payloads (e.g., `WebhookPayload`).
- **Changes**: <200 LOC/PR; `npm run lint:fix`, tests (`*.test.tsx`), Cypress if present. Commit: `refactor(area): extract X to utils`.
- **Performance**: `useSWR`/`useQuery` for fetches; virtualize (`react-window`) long lists; tree-shake utils.

## Key Project Resources
- **Docs**: `docs/README.md`, `docs/architecture.md` (update patterns), `docs/development-workflow.md`, `docs/glossary.md` (new utils).
- **Agents/Contrib**: `agents/README.md`, `AGENTS.md`, `CONTRIBUTING.md`.
- **Testing**: `__tests__/*`, `components/**/*.test.tsx`; patterns: `render`, `userEvent`, `@testing-library`.
- **Tools**: ESLint/Prettier (`npm run lint`), Zod (if in deps), Turbopack for builds.

## Repository Focus Areas
Prioritize by impact: Utils (duplication), Services/API (logic), Components (size), Admin pages (traffic).

| Directory | Files Count | Focus | Why Refactor |
|-----------|-------------|-------|--------------|
| `lib/` | High (.ts utils) | `utils.ts`, `formatters.ts`, `export-utils.ts`, `services/webhookService.ts` | Dupe hotspots (31 symbols); extract inline helpers. |
| `app/(admin)/` | Many TSX | `admin/configuracoes/servicos/page.tsx` (`ServiceType`) | Large tables/forms; decompose. |
| `app/api/` | Routes | `api/carol/query/route.ts` (`queryServicePricing`, `queryServiceAreas`) | Unbatched Supabase; dedupe. |
| `app/(public)/` | Pages | `terms/page.tsx` (`TermsOfServicePage`) | Static templates; consistency. |
| `components/` | 118 TSX | UI primitives, admin/chat/analytics | Oversized FCs, prop drilling. |
| `types/` | Interfaces | `index.ts`, `webhook.ts` | Payload coverage. |

**Total Files**: 156 (.tsx:118 primary refactor targets); Symbols: 247 (utils:31, services:1+).

## Key Files and Purposes
### Utils & Formatters (Extract Targets)
| File | Purpose | Symbols | Refactor Opportunity |
|------|---------|---------|----------------------|
| `lib/utils.ts` | UI helpers (clsx+twMerge). | `cn`, `formatCurrency`, `formatDate` | Inline classes/dates → here. |
| `lib/formatters.ts` | Validators/parsers. | `formatPhoneUS`, `unformatPhone`, `isValidPhoneUS`, `isValidEmail`, `formatCurrencyUSD`, `formatCurrencyInput`, `parseCurrency` | Forms → centralized. |
| `lib/export-utils.ts` | Data exports. | `exportToExcel`, `exportToPDF` | Large datasets; async/stream. |

### Services (Orchestration)
| File | Purpose | Symbols | Refactor Opportunity |
|------|---------|---------|----------------------|
| `lib/services/webhookService.ts` | n8n webhook handling. | `WebhookService` | Extract payloads; batch ops. |

### Pages/API (Logic/UI Hotspots)
| File | Purpose | Symbols | Refactor Opportunity |
|------|---------|---------|----------------------|
| `app/(admin)/admin/configuracoes/servicos/page.tsx` | Admin services config. | `ServiceType` | Split table/form; use hooks. |
| `app/api/carol/query/route.ts` | Carol AI service queries. | `queryServicePricing`, `queryServiceAreas` | Batch Supabase; cache. |
| `app/(public)/terms/page.tsx` | Terms page. | `TermsOfServicePage` | Template for others; extract layout. |

## Refactoring Workflows
### 1. Detection (Use Tools)
1. `listFiles("**/*.tsx")` → Prioritize >50 LOC.
2. `searchCode("className={`|new RegExp|supabase.from", "**/*")` → Dupe/inline smells.
3. `analyzeSymbols("app/**/*.tsx")` → Large FCs/classes.
4. `getFileStructure()` → Map utils/services usage.

### 2. Extract Utility (e.g., Inline Currency)
1. `readFile("components/financeiro/Table.tsx")` → Spot `$12.34`.
2. Create/update `lib/utils.ts`: `export const formatPrice = (val: number) => formatCurrencyUSD(val);`.
3. Replace: Import + `formatPrice(amount)`.
4. Lint/test: `npm test`, manual UI check.
5. Commit: `refactor(financeiro): extract formatPrice to utils`.

### 3. Component Decomposition (>50 LOC TSX)
1. `analyzeSymbols("target.tsx")` → Identify sub-patterns.
2. Extract: Static → `<SubComponent />`; Logic → `hooks/useFilters.ts`.
3. Add: `const MemoList = React.memo(List);`, `forwardRef`.
4. Verify: React DevTools (Profiler → minimal re-renders).
5. PR: Before/after bundle size (`npm run build -- --analyze`).

### 4. API/Service Optimization
1. `readFile("app/api/carol/query/route.ts")`.
2. Batch: `const { data: [pricing, areas] } = await supabase.from('services').select('*');`.
3. Type: `type QueryResponse = { pricing: Service[], areas: Area[] };`.
4. Add validation/error: `if (!input.valid) return NextResponse.json({ error: 'Invalid' }, { status: 400 });`.
5. Test: `curl` endpoints; integrate types.

### 5. Service Extraction (e.g., From Page)
1. Target: Inline webhook in `page.tsx`.
2. Extract: To `lib/services/WebhookHandler.ts` extending `WebhookService`.
3. Page: `const handler = new WebhookService(); handler.process(payload);`.
4. Types: Use `types/webhook.ts` unions.

### 6. Full Cycle PR
1. Plan: "Smells: [list]; Changes: [steps]; Metrics: LOC -20%, perf +15%."
2. Incremental: 1-3 files/PR.
3. Post: Update `docs/architecture.md` (e.g., "New: batched queries"); benchmarks.
4. Metrics: LOC (cloc), perf (Lighthouse), coverage (tests).

## Key Symbols to Leverage/Extend
- **Utils (31)**: `cn`, formatters → Extract duplicates.
- **Services**: `WebhookService` → Model for others (e.g., `QueryService`).
- **Queries**: `queryServicePricing`/`queryServiceAreas` → Batch/union.
- **Types**: `ServiceType` → Enums/interfaces.

## Collaboration & Handoff
- **Checklist**: Maintainer ping: "Refactoring [file] for [smell]—test Z?"; `gh pr list --search refactor`.
- **Handoff Template**:
  ```
  **Refactored**: [files list]; LOC: -X%; Perf: +Y% (Lighthouse).
  **Verified**: Tests pass, UI unchanged, API <2s.
  **Risks**: [e.g., Export perf on 10k rows—monitor].
  **Next**: Extract [hook/service]; PR #123.
  ```
- **Docs Updates**: `glossary.md` (new utils), `architecture.md` (patterns).

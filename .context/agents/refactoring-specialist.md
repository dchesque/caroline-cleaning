# Refactoring Specialist Agent Playbook

## Mission
Refactor the Carolinas Premium codebase—a Next.js 13+ application with TypeScript (.ts: 44 files, .tsx: 137 files, .mjs: 2 files), Tailwind CSS via shadcn/ui, Supabase integration, and features like admin dashboards, client/appointment management, services configuration, Carol AI queries, webhooks (n8n), data exports, and public pages. Target technical debt to improve maintainability, performance, and consistency:

- **Code Smells**: Duplicated inline formatting/validation in TSX files, oversized components/methods (>50-100 LOC), tight coupling (e.g., direct Supabase calls in UI/API routes).
- **Performance**: Unbatched Supabase queries (e.g., in `app/api/carol/query/route.ts`), potential re-render issues in 137 TSX components, large bundle sizes.
- **Consistency**: Mandate utils like `cn` and formatters; enforce typed interfaces, shadcn patterns, and service classes.
- **Technical Debt Hotspots**: Utils/services (43 symbols), admin services pages, API routes, agenda components.

**Codebase Stats**: 183 files, 284 symbols. Prioritize .tsx (UI-heavy) for decomposition, .ts (utils/services/API) for extraction/optimization.

## Responsibilities
- **Issue Detection**: Use tools (`searchCode`, `analyzeSymbols`, `listFiles("**/*.tsx")`) to identify duplication, god components, unoptimized queries.
- **Atomic Refactors**: Extract utils/hooks/services, split components, batch DB calls; aim for <150 LOC per PR.
- **Convention Enforcement**: `cn` for all classes, centralized formatters, `React.FC<Props>` with interfaces, pure exports.
- **Validation**: `npm run lint:fix`, add/update tests (`*.test.tsx`), perf checks (`npm run build`, Lighthouse >90), LOC/bundle reduction.
- **Documentation**: PRs with `refactor(area): desc`, metrics tables; update `docs/architecture.md`, `glossary.md`.

## Best Practices Derived from Codebase
Analyzed via symbols (284 total), utils (43), services (2+). Enforce these patterns:

### ClassNames & Styling (All 137 TSX)
- Use `cn("base", condition && "modifier")` from `lib/utils.ts`. Replace `className={condition ? "a b" : "c d"}` or raw Tailwind strings.

### Formatting & Validation (Centralize Duplication)
| Function | File | Purpose | Replace Inline Examples |
|----------|------|---------|-------------------------|
| `cn` | `lib/utils.ts` | Tailwind merging | `clsx(...)` or conditionals |
| `formatCurrency` | `lib/utils.ts` | General currency | `number.toLocaleString()` |
| `formatDate` | `lib/utils.ts` | Date display | `new Date().toLocaleDateString()` |
| `formatPhoneUS` | `lib/formatters.ts` | US phone formatting | Manual string ops/regex |
| `unformatPhone` | `lib/formatters.ts` | Phone parsing | Slicing/digits extraction |
| `isValidPhoneUS` | `lib/formatters.ts` | Phone validation | Custom regex |
| `isValidEmail` | `lib/formatters.ts` | Email check | `email.includes('@')` |
| `formatCurrencyUSD` | `lib/formatters.ts` | USD display | `$` + `toLocaleString()` |
| `formatCurrencyInput` | `lib/formatters.ts` | Input masking | Manual key handlers |
| `parseCurrency` | `lib/formatters.ts` | Currency parsing | `parseFloat(str.replace('$', ''))` |

### Exports & Utils
- Pure named exports (e.g., `exportToExcel`/`exportToPDF` in `lib/export-utils.ts`); stream large data.

### Supabase & DB
- Server/client wrappers (`lib/supabase/server.ts`, `client.ts`).
- Batch: `supabase.from('table').select('col1, col2, related(*)')` instead of multiple calls.

### Components (137 TSX)
- `interface Props { ... }`; `const Comp: React.FC<Props> = ({}) => {...}`.
- Optimize: `React.memo`, `useCallback`/`useMemo`, `forwardRef` for inputs.

### Services (Class-Based, e.g., `WebhookService`)
```ts
export class WebhookService {
  async process(payload: Payload) { /* logic */ }
}
```
- Dependency injection; async methods; extend for new logic (e.g., `ServiceConfigService`).

### API Routes
- Zod validation; `NextResponse.json(data as T, { status })`; `revalidateTag`/`revalidatePath`; <500ms.

### Types
- `interface ServiceType { id: string; name: string; price: number; }`.
- Centralize reusable (`types/index.ts`); inline for local.

### Perf & Builds
- Data fetching: SWR/React Query.
- Lists: Virtualize if >50 items.
- Dynamic imports for heavy components.

## Key Files and Purposes
Focus by priority (symbol density, duplication):

### Utils & Helpers (43 Symbols; High Duplication)
| File | Purpose | Key Symbols | Refactor Opportunities |
|------|---------|-------------|------------------------|
| `lib/utils.ts` | Core Tailwind/formatting utils | `cn`, `formatCurrency`, `formatDate` | Extract all inline class/date logic from TSX |
| `lib/formatters.ts` | Phone/email/currency handlers | `formatPhoneUS`, `unformatPhone`, `isValidPhoneUS`, `isValidEmail`, `formatCurrencyUSD`, `formatCurrencyInput`, `parseCurrency` | Forms/tables in admin/agenda |
| `lib/export-utils.ts` | Excel/PDF generation | `exportToExcel`, `exportToPDF` | Chunking for large exports; client-side opts |
| `lib/services/webhookService.ts` | n8n webhook processing | `WebhookService` | Template for other services; extract page logic |

### Services & Components
| File | Purpose | Key Symbols | Refactor Opportunities |
|------|---------|-------------|------------------------|
| `components/agenda/appointment-form/service-section.tsx` | Service selection in appointment form | `ServiceSectionProps` | Extract hooks (`useServices`), formatters; decompose |
| `app/(admin)/admin/configuracoes/servicos/page.tsx` | Admin services CRUD/config | `ServiceType` | Move logic to `ServiceConfigService`; split table/form |

### API & Pages (Perf Hotspots)
| File | Purpose | Key Symbols | Refactor Opportunities |
|------|---------|-------------|------------------------|
| `app/api/carol/query/route.ts` | Carol AI queries (pricing/areas) | `queryServicePricing`, `queryServiceAreas` | Batch Supabase; caching; Zod |
| `app/(public)/terms/page.tsx` | Public terms page | `TermsOfServicePage` | Extract shared layout; utils for content |

**Directory Priorities** (183 Files):
| Directory | Files | Priority | Why |
|-----------|-------|----------|-----|
| `lib/` (utils, supabase, services, config, actions, context, admin-i18n) | High (.ts) | 1 | 43 symbols; extract targets |
| `components/` (agenda, landing) | 137 TSX | 2 | Decomposition/prop drilling |
| `app/(admin)/` | Many pages | 3 | Services/config CRUD |
| `app/api/` | Routes | 4 | Query optimization |
| `app/(public)/` | Pages | 5 | Consistency/reuse |

## Specific Workflows
Leverage tools: `getFileStructure()`, `listFiles("lib/**/*.ts")`, `searchCode("className\\s*=", "**/*.tsx")`, `analyzeSymbols("app/api/**/*.ts")`, `readFile(file)`.

### Workflow 1: Extract Inline Formatting (High Impact, 137 TSX)
1. Scan: `searchCode("(toLocaleString|format\\(|\\$|regex).*?(className|value)", "**/*.tsx")`.
2. Target file: `readFile("components/agenda/appointment-form/service-section.tsx")`.
3. Add util: In `lib/formatters.ts` → `export const formatServicePrice = (price: number) => formatCurrencyUSD(price);`.
4. Replace: Import + use; lint fix.
5. Validate: Tests (`npm test`), UI check.
6. Commit/PR: `refactor(agenda): extract service price formatter` + before/after LOC.

### Workflow 2: Decompose Oversized Components (>50 LOC)
1. List: `listFiles("components/**/*.tsx")`; `analyzeSymbols(target.tsx)` for large FCs.
2. Split: Extract sub-comp (e.g., `ServiceList.tsx`), hook (`useFormattedServices.ts`).
3. Optimize: `const services = useMemo(() => data.map(formatServicePrice), [data]);`.
4. Types: `interface ServiceSectionProps { services: ServiceType[] }`.
5. Verify: Profiler (<3 re-renders), `npm run build`.
6. PR Metrics:
   | Metric | Before | After |
   |--------|--------|-------|
   | LOC | 120 | 80 |
   | Sub-comps | 0 | 3 |

### Workflow 3: Optimize API Queries (e.g., Multiple Supabase Calls)
1. Read: `readFile("app/api/carol/query/route.ts")`.
2. Refactor:
   ```ts
   const { data } = await supabase
     .from('services')
     .select('*, pricing(*), areas(*)');
   return NextResponse.json(data as Awaited<ReturnType<typeof queryServicePricing>>);
   ```
3. Add: Zod schema, `revalidateTag('carol-query')`.
4. Test: `curl`, time <200ms; integration test.
5. PR: Query count reduction table.

### Workflow 4: Extract to Services (Pages → Classes)
1. Target: `readFile("app/(admin)/admin/configuracoes/servicos/page.tsx")`.
2. Create `lib/services/ServiceConfigService.ts`:
   ```ts
   import { createServerClient } from '@/lib/supabase/server';
   export class ServiceConfigService {
     private supabase;
     constructor() { this.supabase = createServerClient(); }
     async getServices(): Promise<ServiceType[]> {
       const { data } = await this.supabase.from('services').select('*');
       return data ?? [];
     }
   }
   ```
3. Page: `const serviceSvc = new ServiceConfigService(); const services = await serviceSvc.getServices();`.
4. Types: Export `ServiceType`.
5. Validate: Tests, perf.

### Workflow 5: Full PR Cycle
1. **Plan**: Tool scan → "5 inline formatters in agenda; LOC -20%; perf +15%".
2. Branch: `refactor/<area>-<issue>`.
3. Changes: 1-3 files.
4. Validate: `npm run lint test build`; Lighthouse; bundle analyzer.
5. PR Template:
   ```
   ## Refactor Summary
   - Files: [list]
   
   ## Metrics
   | Area | Before | After | Delta |
   |------|--------|-------|-------|
   | LOC  | 250    | 200   | -20%  |
   | Queries | 4   | 1     | -75%  |
   
   ## Validation
   - [x] Tests pass
   - [x] No regressions (screenshots)
   - [x] Perf improved
   ```

## Key Symbols to Leverage/Extend
- **Utils (43)**: `cn`, formatters (10+) → All UI/data.
- **Services**: `WebhookService` (class pattern); extract `ServiceConfigService`.
- **UI/API**: `ServiceSectionProps`, `ServiceType`, `queryServicePricing`/`queryServiceAreas` → Batch/typing.

## Collaboration & Handoff
- **Status**: "Refactored [files]; Metrics: LOC -15%, queries batched. PR #[num]. Next: [priority area]."
- **Docs**: New utils to `glossary.md`; patterns to `architecture.md`; link playbook in `AGENTS.md`.

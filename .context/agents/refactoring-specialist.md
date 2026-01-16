# Refactoring Specialist Agent Playbook

## Mission
Refactor the Caroline Cleaning codebase—a Next.js 13+ app with TypeScript (high .tsx density: UI-heavy components), Tailwind CSS (shadcn/ui), Supabase backend, admin dashboards for services/config, appointment/agenda management, webhook services (n8n), tracking utils, API routes (Carol queries), and public pages. Prioritize technical debt in utils/services layers to boost maintainability, performance, and consistency:

- **Code Smells**: Inline formatting/validation duplication across TSX, oversized components (e.g., service sections), direct Supabase calls in UI/API, unbatched queries.
- **Performance**: Multiple DB calls (e.g., `app/api/carol/query/route.ts`), re-renders in agenda/admin components, export bottlenecks.
- **Consistency**: Centralize utils (`cn`, formatters), enforce typed props/interfaces (`ServiceSectionProps`, `ServiceType`), service classes (`WebhookService` pattern).
- **Hotspots**: Utils (55 symbols: lib/utils.ts, formatters.ts), services (lib/services/webhookService.ts), agenda components, admin services pages, API routes.

**Stats from Analysis**: Focus utils/services (57 symbols), key files (8+), directories: lib/* (high priority), components/agenda, app/(admin), app/api.

## Responsibilities
- **Detection**: `searchCode` for duplication (e.g., `className\\s*\\?`), `analyzeSymbols` on TSX/TS, `listFiles("**/*.tsx")`, `getFileStructure` for hotspots.
- **Refactors**: Extract to utils/services, decompose TSX (<80 LOC/file), batch queries, type everything.
- **Enforcement**: `cn` everywhere, formatters for data, `React.FC<Props>`, pure service classes.
- **Validation**: `npm run lint:fix build`, tests (`*.test.tsx`), perf (Lighthouse >90, bundle <prev).
- **Docs/PRs**: `refactor(area): desc` with metrics tables; update `README.md` or `docs/refactor-log.md`.

## Best Practices Derived from Codebase
From 57 analyzed symbols (utils:55, services:2). Enforce patterns:

### ClassNames & Styling (All TSX Files)
- `import { cn } from '@/lib/utils'; cn("base", condition && "modifier")`. Replace ternaries/strings.

### Formatting & Validation (Centralize 10+ Utils)
| Function | File | Purpose | Inline Replacements |
|----------|------|---------|---------------------|
| `cn` | `lib/utils.ts` | Tailwind merge | `clsx`, ternaries |
| `formatCurrency` | `lib/utils.ts` | Currency display | `toLocaleString()` |
| `formatDate` | `lib/utils.ts` | Date formatting | `toLocaleDateString()` |
| `formatPhoneUS` | `lib/formatters.ts` | US phone format | Regex/string ops |
| `unformatPhone` | `lib/formatters.ts` | Phone parse | Digit extraction |
| `isValidPhoneUS` | `lib/formatters.ts` | Phone validation | Custom checks |
| `isValidEmail` | `lib/formatters.ts` | Email validation | Basic `@` checks |
| `formatCurrencyUSD` | `lib/formatters.ts` | USD currency | `$` + locale |
| `formatCurrencyInput` | `lib/formatters.ts` | Input masking | Key handlers |
| `parseCurrency` | `lib/formatters.ts` | Currency parse | `parseFloat(replace)` |

### Exports & Tracking Utils
- Named exports: `exportToExcel`/`exportToPDF` (`lib/export-utils.ts`), `generateEventId`/`hashData`/`normalizePhone`/`getFacebookCookies`/`getUtmParams`/`mapSupabaseConfigToTracking` (`lib/tracking/utils.ts`).
- Stream exports; hash/track sensitively.

### Services (Class Pattern)
```ts
// From lib/services/webhookService.ts
export class WebhookService {
  async process(payload: any) { /* Supabase + logic */ }
}
```
- Constructor init Supabase; async methods; DI for testing.

### Components & Props
- `interface ServiceSectionProps { services?: ServiceType[]; }`
- `const Comp: React.FC<ServiceSectionProps> = ({ services }) => { useMemo(formatters) }`
- Memoize lists, `forwardRef` inputs.

### Supabase & API
- Batch: `.select('*, related(*)')`.
- Zod + `NextResponse.json(data as T)`.
- Cache: `revalidateTag`.

### Types
- `interface ServiceType { id: string; name: string; price: number; }` from admin pages.
- Central `types/services.ts`.

## Key Files and Purposes
Prioritized by symbols/duplication (use `readFile` for details):

| File | Directory/Layer | Purpose | Key Symbols | Refactor Targets |
|------|-----------------|---------|-------------|------------------|
| `lib/utils.ts` | Utils | Core Tailwind/date/currency | `cn`, `formatCurrency`, `formatDate` | Extract from all TSX |
| `lib/services/webhookService.ts` | Services | Webhook processing (n8n/Supabase) | `WebhookService` | Template services; batch DB |
| `components/agenda/appointment-form/service-section.tsx` | Components | Service picker in forms | `ServiceSectionProps` | Hooks/utils; decompose |
| `app/(admin)/admin/configuracoes/servicos/page.tsx` | Admin | Services CRUD/config | `ServiceType` | To `ServiceConfigService`; table split |
| `lib/export-utils.ts` | Utils | Excel/PDF exports | `exportToExcel`, `exportToPDF` | Chunking/streaming |
| `lib/tracking/utils.ts` | Utils | Tracking/UTM/phone | `generateEventId`, `hashData`, `normalizePhone`, `getFacebookCookies`, `getUtmParams`, `mapSupabaseConfigToTracking` | Centralize tracking calls |
| `app/api/carol/query/route.ts` | API | Carol AI service queries | `queryServicePricing`, `queryServiceAreas` | Batch + Zod |
| `app/(public)/terms/page.tsx` | Public | Terms page | `TermsOfServicePage` | Shared layout/utils |

**Directory Focus**:
| Directory | Files/Key Areas | Priority | Rationale |
|-----------|-----------------|----------|-----------|
| `lib/` (utils.ts, formatters.ts, services/webhookService.ts, export-utils.ts, tracking/utils.ts) | Utils/Services | 1 | 55+ symbols; duplication source |
| `components/agenda/appointment-form/` | UI Components | 2 | Props-heavy; formatting smells |
| `app/(admin)/admin/configuracoes/servicos/` | Admin Pages | 3 | CRUD → services |
| `app/api/carol/query/` | API Routes | 4 | Query perf |
| `app/(public)/` | Public Pages | 5 | Consistency |

## Specific Workflows
Use tools proactively: `listFiles("lib/**/*.ts")`, `searchCode("className\\s*=", "**/*.tsx")`, `analyzeSymbols("components/**/*.tsx")`.

### Workflow 1: Centralize Formatting (Utils Extraction)
1. Scan: `searchCode("(toLocale|formatCurrency|\\$|phone).*?(className|value)", "**/*.tsx")`.
2. Target: `readFile("components/agenda/appointment-form/service-section.tsx")`.
3. Extend `lib/formatters.ts`: `export const formatServiceDisplay = (service: ServiceType) => ({ name: service.name, price: formatCurrencyUSD(service.price) });`.
4. Replace: Import/use in TSX; `services.map(formatServiceDisplay)`.
5. Validate: `npm test`, UI snapshot.
6. PR: `refactor(agenda): centralize service formatters` + LOC table.

### Workflow 2: Decompose Components (TSX Split)
1. List: `listFiles("components/agenda/**/*.tsx")`; pick >50 LOC via `readFile`.
2. Analyze: `analyzeSymbols("components/agenda/appointment-form/service-section.tsx")`.
3. Extract: `ServiceList.tsx` (sub-comp), `useServices` hook (`useMemo` + formatters).
4. Props: Refine `ServiceSectionProps`.
5. Optimize: `React.memo(ServiceList)`.
6. PR Metrics:
   | Metric | Before | After | Δ |
   |--------|--------|-------|---|
   | LOC    | 100    | 60    | -40% |
   | Hooks  | 0      | 2     | + |

### Workflow 3: Service Class Extraction (Pages → Services)
1. Target: `readFile("app/(admin)/admin/configuracoes/servicos/page.tsx")`.
2. Create `lib/services/ServiceConfigService.ts` (pattern from `WebhookService`):
   ```ts
   import { createServerClient } from '@/lib/supabase/server';
   export class ServiceConfigService {
     private supabase = createServerClient();
     async getServices(): Promise<ServiceType[]> {
       const { data } = await this.supabase.from('services').select('*');
       return data ?? [];
     }
     async updateService(id: string, updates: Partial<ServiceType>) { /* ... */ }
   }
   ```
3. Page: `const svc = new ServiceConfigService(); const services = await svc.getServices();`.
4. Export `ServiceType` to `types/services.ts`.
5. Test: Unit for service methods.
6. PR: `refactor(admin): extract ServiceConfigService`.

### Workflow 4: API Query Optimization
1. Read: `readFile("app/api/carol/query/route.ts")`.
2. Batch:
   ```ts
   const { data: services } = await supabase.from('services').select('*, pricing(*), areas(*)');
   return NextResponse.json(services as Awaited<ReturnType<typeof queryServicePricing>>());
   ```
3. Add Zod schema, cache tags.
4. Benchmark: Time queries pre/post.
5. PR Table:
   | Query | Before (ms) | After (ms) | Calls |
   |-------|-------------|------------|-------|
   | Pricing | 300 | 120 | 3→1 |

### Workflow 5: Full PR Cycle
1. **Scan/Plan**: Tools → "Dupe formatters in 5 TSX; extract to utils".
2. Branch: `refactor/utils-formatters`.
3. Changes: 2-4 files max.
4. Validate: Lint/build/test; Lighthouse.
5. PR Template:
   ```
   ## Summary
   Files: lib/formatters.ts, service-section.tsx
   
   ## Metrics
   | Area | Before | After | Δ |
   |------|--------|-------|---|
   | LOC  | 150    | 110   | -27% |
   | Dupe utils | 5 | 0 | -100% |
   
   ## Checks
   - [x] Tests/Lint/Build
   - [x] No UI perf regression
   ```

## Key Symbols to Leverage/Extend
- **Utils (55)**: `cn`/`format*` → UI data; tracking utils → all events.
- **Services (2+)**: `WebhookService` → `ServiceConfigService`.
- **UI/API**: `ServiceSectionProps`/`ServiceType` → typed everywhere; `queryServicePricing` → batched.

## Collaboration & Handoff
- **Updates**: "Refactored service-section.tsx; +formatServiceDisplay util. PR #42. Metrics: LOC -25%. Next: admin servicos page."
- **Docs**: Log refactors in `docs/refactors.md`; link utils in `glossary.md`.

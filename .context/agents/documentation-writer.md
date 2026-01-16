# Documentation Writer Agent Playbook

## Mission
The Documentation Writer Agent ensures comprehensive, accurate, up-to-date documentation for the Caroline Cleaning codebase—a Next.js 13+ App Router app with Supabase backend, shadcn/ui + Tailwind frontend, AI chat (Carol), admin dashboards (clientes, financeiro, analytics), landing pages, and integrations (N8N webhooks, notifications, tracking). **Target audiences**: Developers (architecture, APIs, patterns, utils/services), Admins (dashboard workflows, financeiro tools), End-users (chat widget, landing/forms). Trigger on new features, refactors, API changes, PRs, or codebase scans. Document **functionality**, **usage**, **design rationale**, **runnable examples**, data flows, schemas, errors, auth (Supabase RLS/sessions), and integrations (e.g., lib/tracking, lib/supabase).

## Responsibilities
- Maintain `/docs/` Markdown: `architecture.md`, `api-reference.md`, `workflows.md`, `glossary.md`, `utils.md`.
- Add/update JSDoc for **all exports** (55+ utils symbols, 50+ controllers, services) in `lib/`, `app/api/`, `components/`, `types/`, `hooks/`.
- Create/update directory READMEs: `lib/README.md`, `lib/utils/README.md`, `app/api/README.md`, `lib/services/README.md`, `components/landing/README.md`.
- Document **APIs**: Paths/methods, schemas (types/), request/response examples (curl/JSON), errors, auth/RLS.
- Generate UI/component guides, **Mermaid diagrams** (sequences, flows, class/entity), embed instructions, data flows (e.g., Landing form → `/api/contact` → Supabase → notifications).
- **Audit gaps**: Undocumented exports (`export` sans JSDoc), missing types/READMEs, unlinked files.
- **PR reviews**: Suggest doc updates (e.g., "JSDoc new utils; update api-reference.md").
- Patterns: **Utils** (formatters/validators: cn, formatPhoneUS+), **Services** (WebhookService class), **Controllers** (App Router handlers: GET/POST).

## Key Focus Areas
**183+ files**: TSX (UI: components/landing, agenda/appointment-form), TS (lib/: utils, formatters, services, supabase/config/actions/tracking/admin-i18n/context), API routes (app/api/: slots/ready/profile/pricing/health/contact/chat/webhook/n8n/tracking/event/profile/password/tracking/config/notifications/send/financeiro/categorias/config/public/carol/query/actions). Prioritize:
- **Utils** (lib/utils.ts, lib/formatters.ts: cn/formatters 10+; lib/tracking, lib/supabase, lib/config, lib/actions).
- **Services** (lib/services/: WebhookService class, 85% Service Layer pattern).
- **Controllers** (app/api/: 50+ symbols, 15+ routes: slots, pricing, chat, webhook/n8n, carol/query/actions, notifications/send, financeiro/categorias/[id]).
Use tools: `getFileStructure()`, `listFiles("lib/**.ts")`, `listFiles("app/api/**/route.ts")`, `analyzeSymbols("lib/utils.ts")`, `searchCode("export.*(cn|formatPhoneUS|WebhookService)")`.

### Repository Structure
```
caroline-cleaning/
├── app/
│   └── api/                      # Controllers (50+ symbols: handlers in 15+ routes)
│       ├── slots/route.ts         # GET slots
│       ├── ready/route.ts         # GET ready
│       ├── profile/route.ts       # GET/PUT profile
│       ├── pricing/route.ts       # GET pricing
│       ├── health/route.ts        # GET health
│       ├── contact/route.ts       # POST contact
│       ├── chat/route.ts          # POST chat
│       ├── webhook/n8n/route.ts   # POST N8N webhook
│       ├── tracking/event/route.ts # POST tracking
│       ├── profile/password/route.ts
│       ├── tracking/config/route.ts
│       ├── notifications/send/route.ts
│       ├── financeiro/categorias/route.ts (+ [id]/route.ts)
│       ├── config/public/route.ts
│       ├── carol/query/route.ts   # POST Carol query
│       └── carol/actions/route.ts # POST Carol actions
├── components/                    # UI: landing, agenda/appointment-form (forms w/ utils)
├── lib/                           # Shared (55+ utils symbols)
│   ├── utils.ts                   # cn, formatCurrency/Date
│   ├── formatters.ts              # formatPhoneUS, isValidEmail, formatCurrencyUSD+
│   ├── services/webhookService.ts # WebhookService
│   ├── tracking/                  # Tracking utils
│   ├── supabase/                  # Supabase clients/queries
│   ├── config/                    # Config loaders
│   ├── actions/                   # Actions (Carol?)
│   ├── admin-i18n/                # Admin i18n
│   └── context/                   # React contexts
├── docs/                          # MD docs (regen index)
├── types/                         # Schemas (webhook, financeiro?)
└── ... (hooks/, supabase/)
```

### Key Files and Purposes
| Path | Purpose | Doc Priority | Key Symbols/Notes |
|------|---------|--------------|-------------------|
| `lib/utils.ts` | Core helpers: Tailwind merge, currency/date formatting | **High** | `cn` (clsx/Tailwind), `formatCurrency`, `formatDate` (UI/forms) |
| `lib/formatters.ts` | Input validation/display: phone/email/currency | **High** | `formatPhoneUS`, `unformatPhone`, `isValidPhoneUS`, `isValidEmail`, `formatCurrencyUSD`, `formatCurrencyInput`, `parseCurrency` (forms: appointment/contact) |
| `lib/services/webhookService.ts` | Orchestrates webhooks (N8N → Supabase inserts, validation) | **High** | `WebhookService` class (Service Layer: validate/process/insert; deps: Supabase, types/) |
| `app/api/slots/route.ts` | Available appointment slots (Supabase query, RLS) | **High** | `GET` |
| `app/api/pricing/route.ts` | Retrieve pricing tiers | **High** | `GET` |
| `app/api/chat/route.ts` | Handle chat messages (→ Carol?) | **High** | `POST` |
| `app/api/webhook/n8n/route.ts` | N8N webhook ingestion (→ WebhookService) | **High** | `POST` |
| `app/api/carol/query/route.ts` | Carol AI queries | **High** | `POST` |
| `app/api/carol/actions/route.ts` | Carol AI actions | **High** | `POST` |
| `app/api/notifications/send/route.ts` | Send notifications | **High** | `POST` |
| `app/api/financeiro/categorias/route.ts` | Finance categories list/create | **High** | `GET/POST` |
| `app/api/financeiro/categorias/[id]/route.ts` | Category by ID (update/delete?) | **Medium** | Dynamic route |
| `app/api/contact/route.ts` | Contact form submission | **Medium** | `POST` (formatters?) |
| `app/api/tracking/event/route.ts` | Track events | **Medium** | `POST` |
| `lib/tracking/*` | Tracking helpers (events/config) | **Medium** | Usages in APIs/UI |
| `components/landing/*` | Landing pages (pricing, contact forms w/ utils) | **Medium** | `cn`, formatters |
| `components/agenda/appointment-form/*` | Appointment booking (slots, formatters) | **Medium** | Forms validation |
| `docs/README.md` | Docs index/navigation | **Always** | Links to all |

**107+ Symbols**: Utils (55, e.g., 10 formatters), Controllers (50 handlers), Services (WebhookService).

## Workflows for Common Tasks
Leverage tools for context: `getFileStructure()`, `listFiles("app/api/**/route.ts|lib/utils.ts")`, `analyzeSymbols("lib/formatters.ts")`, `searchCode("(formatPhoneUS|WebhookService|GET.*route.ts)")`, `readFile("lib/services/webhookService.ts")`.

### 1. Document New/Changed API (e.g., `/api/financeiro/categorias`)
1. `listFiles("app/api/financeiro/categorias/**/route.ts")`; `readFile()` each; `analyzeSymbols()` for handlers/imports/returns/errors.
2. `searchCode("categorias.*(Supabase|formatters|WebhookService)")` → deps/usages/cross-links.
3. JSDoc **all handlers**:
   ```ts
   /**
    * Lists financeiro categories (RLS: admin).
    * @returns { categorias: Categoria[] }
    * @throws {401} Unauthorized
    * @throws {403} Forbidden (non-admin)
    * @example curl -H "Authorization: Bearer <token>" https://api.example.com/api/financeiro/categorias
    * // { "categorias": [{id: "1", name: "Limpeza"}] }
    */
   export async function GET() { ... }
   ```
4. Update `docs/api-reference.md` **table/section** (group by category: financeiro, carol, tracking):
   | Endpoint | Method | Auth | Req Schema | Res Schema | Errors |
   |----------|--------|------|------------|------------|--------|
   | `/api/financeiro/categorias` | GET | Supabase | - | `{ categorias: Categoria[] }` | 401,403 |
   | `/api/financeiro/categorias` | POST | Admin | `CategoriaInput` | `{ id: string }` | 400,409 |
5. Add **Mermaid sequence**:
   ```mermaid
   sequenceDiagram
     Client->>+API: POST /api/financeiro/categorias {name: "Limpeza"}
     API->>+Supabase: db.insert('categorias')
     Supabase-->>-API: {id: "1"}
     API-->>-Client: {id: "1"}
   Note right of Supabase: RLS enforced
   ```
6. Link `types/`, validate examples.

### 2. Document Utils/Services (e.g., formatters.ts, WebhookService)
1. `readFile("lib/formatters.ts")`; `analyzeSymbols()` → all 9 exports; `searchCode("formatPhoneUS")` → 10+ usages (forms).
2. JSDoc **every export** (pure fn pattern):
   ```ts
   /**
    * Formats US phone to readable string.
    * @param phone Raw input (e.g., "5551234567")
    * @returns Formatted "(555) 123-4567" or null
    * @example formatPhoneUS("5551234567") // "(555) 123-4567"
    * @see {@link isValidPhoneUS}, [lib/formatters.ts#L5](../lib/formatters.ts#L5)
    */
   export const formatPhoneUS = (phone: string): string | null => { ... };
   ```
3. Update `lib/README.md`/`docs/utils.md` **table**:
   | Function | Params | Returns | Examples | Usages (via searchCode) |
   |----------|--------|---------|----------|------------------------|
   | `formatCurrencyUSD` | number \| string | string | `formatCurrencyUSD(1234.56)` → "$1,234.56" | 15+ forms (appointment/contact) |
   | `isValidEmail` | string | boolean | `isValidEmail("user@ex.com")` → true | Validation hooks |
4. Services: `lib/services/README.md` + `docs/services.md`; **class Mermaid**:
   ```mermaid
   classDiagram
     class WebhookService {
       +constructor(supabase, config)
       +validatePayload(payload: WebhookPayload)
       +processEvent(type: 'LeadCreated')
       +insertToSupabase(data)
     }
     WebhookService ..> Supabase : uses
   ```
   Doc instantiation: `new WebhookService(createClient(...), config)`; flows (validate → process → insert).

### 3. Document UI/Landing Components (e.g., components/landing, agenda/appointment-form)
1. `getFileStructure("components/landing")`; `listFiles("components/agenda/appointment-form/**.tsx")`.
2. Per file: JSDoc **props/exports**:
   ```tsx
   /**
    * Appointment form w/ slot selection + formatters.
    * @param {DateRange} dates - Selected range
    * @param {() => void} onSubmit - Handler
    * @example <AppointmentForm dates={range} onSubmit={book} />
    */
   export function AppointmentForm({ dates, onSubmit }: Props) { ... }
   ```
3. Dir README: File tree, **props table**, usage snippet, utils deps (`cn`, formatPhoneUS), screenshots.
4. `docs/user-guide.md`: Embed steps ("Landing: forms use formatCurrencyInput; Customize Tailwind w/ `cn`").

### 4. Full Audit & Regeneration
1. `getFileStructure()`; `listFiles("**/*.(ts|tsx)")` → 183+ files.
2. `searchCode("export(?!\\/\\*\\*)\\s+(async\\s+)?(function|const|let|var|class|interface|type)", "--no-comments")` → undocumented exports (target 0 gaps).
3. `analyzeSymbols("lib/**.ts", "app/api/**.ts")` → 107+ symbols; flag missing JSDoc.
4. Regen `docs/architecture.md` **layered Mermaid**:
   ```mermaid
   graph TB
     UI[Components: landing/appointment-form] --> Utils[lib/utils/formatters: cn/formatPhoneUS]
     UI --> Controllers[app/api: chat/slots/contact]
     Controllers --> Services[WebhookService]
     Services --> Supabase[Supabase RLS]
     Controllers --> Tracking[lib/tracking]
   ```
5. Auto-gen `docs/api-reference.md`: Loop `listFiles("app/api/**/route.ts")` → parse symbols → grouped tables (carol, financeiro, tracking).

### 5. PR/Change Handling
1. `searchCode("changedFile|symbol")`; trace deps (`searchCode("usesNewUtil")`).
2. Update JSDoc/READMEs/api-reference; validate examples (`formatCurrencyInput("$1,234") → "1234"`).
3. PR comment template: "✅ Docs updated: JSDoc for 3 new utils, api-reference +1 row (/slots), Mermaid flow in workflows.md. Gaps: 0."

## Best Practices (Codebase-Derived)
- **Patterns**: **Utils** (pure, composable: validators → formatters; `cn` everywhere); **Service Layer** (classes encapsulate: WebhookService deps injected); **Controllers** (lean handlers: `async function GET/POST(request)`, Supabase direct/RLS, error JSON); **UI** (shadcn props + `cn`/formatters/hooks/contexts).
- **JSDoc**: Comprehensive (`@param/@returns/@throws/@example/@see/@link`); TS types; line anchors `[lib/utils.ts#L6](../lib/utils.ts#L6)`; all 107+ exports.
- **Markdown**: Tables (symbols/APIs/props), `<details><summary>Example</summary>code</details>`, **Mermaid** (85% flows match Service pattern), YAML frontmatter for indexes.
- **Examples**: Executable (TS snippets, curl w/ real data: phone "5551234567" → "(555) 123-4567"); validate w/ tools.
- **Conventions**: Co-located (file JSDoc + dir README); cross-links (utils→components→APIs); audience sections (`## Developers`, `## Admins: Financeiro Workflow`, `## Users: Chat`).
- **Validation**: Regex scans gaps; schema sync (code vs types/); MD links/lint; example runners.
- **Maintenance**: `docs/README.md` auto-toc; `@todo` in MD; changelog per layer (utils/services).

## Key Resources
- **Stack**: Next.js App Router, TS, Supabase (lib/supabase/), Tailwind/shadcn (`cn`), N8N (webhookService), i18n (lib/admin-i18n).
- **Entry**: `docs/README.md`.
- **Types**: `types/` (webhook payloads, financeiro Categoria).

## Collaboration Checklist
- **PR Label**: `docs`, `@documentation`.
- **Tool Queries**: "Usages of `formatCurrency`? `searchCode('formatCurrency')`."
- **Hand-off**: "Audit: 5 gaps in lib/; Updated: api-reference.md; Next: utils README table."

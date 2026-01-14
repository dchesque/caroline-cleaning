# Documentation Writer Agent Playbook

## Mission
The Documentation Writer Agent maintains comprehensive, accurate, and up-to-date documentation for the Carolinas Premium codebase—a Next.js 13+ App Router application with Supabase backend, shadcn/ui + Tailwind frontend, AI chat (Carol), admin dashboards (clientes, financeiro, analytics), landing pages, and integrations (N8N webhooks, notifications). **Target audiences**: Developers (architecture, APIs, patterns), Admins (dashboard workflows, finance tools), End-users (chat widget, landing UI). Trigger updates on new features, refactors, API changes, PRs, or scans. Document **what it does**, **how to use it**, **why it's designed that way**, **runnable examples**, data flows, schemas, errors, and auth (Supabase RLS/sessions).

## Responsibilities
- Maintain `/docs/` Markdown files: `architecture.md`, `api-reference.md`, `workflows.md`, `glossary.md`.
- Add/update JSDoc for **all exports** in `lib/`, `app/api/`, `components/`, `types/`, `hooks/`.
- Create/update directory READMEs: `lib/README.md`, `app/api/README.md`, `components/chat/README.md`, `lib/services/README.md`.
- Document **APIs**: Paths, methods, schemas (from `types/`), request/response examples (curl/JSON), errors, auth.
- Generate UI/component guides, **Mermaid diagrams** (sequences, flows, class diagrams), embed instructions.
- Map **data flows** (e.g., Chat UI → `/api/carol/query` → Supabase → `/api/webhook/n8n` → WebhookService).
- **Audit gaps**: Undocumented exports (`export` without `/**`), missing types, unlinked READMEs.
- **PR reviews**: Comment doc suggestions (e.g., "Add JSDoc to new POST; update api-reference.md").
- Export patterns: **Utils** (formatters/validators), **Services** (WebhookService class), **Controllers** (App Router handlers).

## Key Focus Areas
**183 files**: .tsx (137 UI in `components/`), .ts (44 lib/utils/services), .mjs (2). Prioritize:
- **Utils** (lib/utils.ts, lib/formatters.ts: 10+ formatters like `cn`, `formatPhoneUS`).
- **Services** (lib/services/webhookService.ts: WebhookService class, 85% Service Layer pattern).
- **Controllers** (app/api/: 44 symbols, 15+ routes like slots, pricing, chat, webhook/n8n).
Scan `lib/` (shared logic), `app/api/` (handlers), `components/` (UI with `cn`). Use tools: `readFile`, `listFiles("app/api/**/route.ts")`, `analyzeSymbols`, `searchCode("export")`, `getFileStructure`.

### Repository Structure
```
carolinas-premium/
├── app/                          # Next.js App Router (admin/public)
│   └── api/                      # Controllers: 15+ routes (44 symbols: GET/POST handlers)
│       ├── slots/route.ts        # Appointment slots
│       ├── pricing/route.ts      # Pricing tiers
│       ├── chat/route.ts         # Chat messages
│       ├── webhook/n8n/route.ts  # N8N payloads
│       ├── carol/query/route.ts  # AI queries
│       ├── carol/actions/route.ts # AI actions
│       ├── notifications/send/route.ts
│       ├── financeiro/categorias/route.ts (+ [id])
│       └── ... (ready, health, contact, config/public)
├── components/                   # 137 TSX: ui (shadcn), chat, landing, admin, financeiro
├── lib/                          # 44 TS: utils (10+), formatters (9+), services, supabase, config, actions
│   ├── utils.ts                  # cn, formatCurrency/Date
│   ├── formatters.ts             # Phone/email/currency
│   └── services/webhookService.ts # WebhookService (Service Layer)
├── docs/                         # Markdown (README.md index)
├── types/                        # Interfaces (webhook, financeiro)
└── ... (hooks/, supabase/)
```

### Key Files and Purposes
| Path | Purpose | Doc Priority | Key Symbols/Notes |
|------|---------|--------------|-------------------|
| `lib/utils.ts` | UI helpers: clsx/Tailwind merge, basic formatting | **High** | `cn`, `formatCurrency`, `formatDate` (used in 100+ TSX) |
| `lib/formatters.ts` | Validation/display: phone (US), email, currency (USD/input) | **High** | `formatPhoneUS`, `unformatPhone`, `isValidPhoneUS`, `isValidEmail`, `formatCurrencyUSD`, `formatCurrencyInput`, `parseCurrency` (forms-heavy) |
| `lib/services/webhookService.ts` | Business logic: N8N webhook orchestration (LeadCreated, AppointmentCancelled → Supabase) | **High** | `WebhookService` class (methods: validate, process, insert; deps: Supabase, types/webhook.ts) |
| `app/api/slots/route.ts` | Fetch available slots (Supabase query) | **High** | `GET` (RLS-aware) |
| `app/api/pricing/route.ts` | Pricing tiers retrieval | **High** | `GET` |
| `app/api/chat/route.ts` | Process chat messages (→ Carol?) | **High** | `POST` |
| `app/api/webhook/n8n/route.ts` | Ingest N8N payloads (→ WebhookService) | **High** | `POST` (uses types/webhook.ts) |
| `app/api/carol/query/route.ts` | Carol AI query handling | **High** | `POST` |
| `app/api/carol/actions/route.ts` | Carol action execution | **High** | `POST` |
| `app/api/notifications/send/route.ts` | Notification dispatch | **High** | `POST` |
| `app/api/financeiro/categorias/route.ts` | Finance categories CRUD | **Medium** | `GET`, `POST` |
| `app/api/financeiro/categorias/[id]/route.ts` | Category by ID | **Medium** | Dynamic |
| `app/api/contact/route.ts` | Contact form | **Medium** | `POST` |
| `types/webhook.ts` | Payload schemas (ChatMessagePayload+) | **High** | Validation examples |
| `docs/README.md` | Docs index (regen always) | **Always** | Navigation/links |
| `components/chat/chat-widget.tsx` | Carol chat UI | **Medium** | Props: `isOpen`; hooks + `cn` |

**89+ Symbols**: Utils (19), Services (WebhookService), Controllers (44 handlers).

## Workflows for Common Tasks
Use tools for context: `getFileStructure()`, `listFiles("lib/**.ts")`, `analyzeSymbols("lib/formatters.ts")`, `searchCode("formatPhoneUS|WebhookService")`, `readFile("app/api/webhook/n8n/route.ts")`.

### 1. Document New/Changed API Endpoint (e.g., `/api/financeiro/categorias`)
1. `readFile("app/api/financeiro/categorias/route.ts")`; `analyzeSymbols()` for handlers/imports/returns.
2. `searchCode("categorias.*(Supabase|WebhookService|formatters)")` for deps/usages.
3. Add JSDoc to **each handler**:
   ```ts
   /**
    * Lists finance categories (RLS: admin/cliente).
    * @returns { categorias: Categoria[] }
    * @throws {401} No session
    * @throws {403} Insufficient role
    * @example
    * curl -H "Authorization: Bearer <supabase-token>" https://api.example.com/api/financeiro/categorias
    * // { "categorias": [{id: "cat1", name: "Serviços"}] }
    */
   export async function GET(request: Request) { ... }
   ```
4. Update `docs/api-reference.md` **table + section**:
   | Endpoint | Method | Auth | Response Schema | Errors |
   |----------|--------|------|-----------------|--------|
   | `/api/financeiro/categorias` | GET | Supabase | `{ categorias: Categoria[] }` | 401,403 |
   | `/api/financeiro/categorias` | POST | Admin | `{ id: string }` | See types/ |
5. Add **Mermaid**:
   ```mermaid
   sequenceDiagram
     Client->>API: POST /api/financeiro/categorias
     API->>WebhookService: process(payload)
     WebhookService->>Supabase: insert (RLS)
   ```
6. Link types/; test examples.

### 2. Document Utils/Services (e.g., formatters.ts, WebhookService)
1. `readFile("lib/formatters.ts")`; `analyzeSymbols()` → list all 9 exports.
2. `searchCode("formatPhoneUS")` → usages (e.g., 5+ forms).
3. JSDoc **every export**:
   ```ts
   /**
    * Formats US phone (10 digits).
    * @param phone - Raw string (e.g., "5551234567")
    * @returns "(555) 123-4567" or null (invalid)
    * @example formatPhoneUS("5551234567") // "(555) 123-4567"
    * @see {@link isValidPhoneUS}
    */
   export const formatPhoneUS = (phone: string): string | null => { ... };
   ```
4. Create/update `lib/README.md` **table**:
   | Function | Params | Returns | Examples | Usages |
   |----------|--------|---------|----------|--------|
   | `formatCurrencyUSD` | number/string | string | `formatCurrencyUSD(1234.56)` → "$1,234.56" | Forms (10+) |
5. Services: `docs/services.md` with **class Mermaid**:
   ```mermaid
   classDiagram
     class WebhookService {
       +handleEvent(payload: WebhookPayload)
       +validate()
       +processToSupabase()
     }
   ```
   Include instantiation, method flows.

### 3. Document UI Components (e.g., components/chat/*)
1. `listFiles("components/chat/**")`; `getFileStructure("components/chat")`.
2. Per TSX: JSDoc **props/stories**:
   ```tsx
   /**
    * Carol chat widget (shadcn + hooks).
    * @param {boolean} isOpen - Visibility toggle
    * @param {() => void} onClose - Handler
    * @example
    * <ChatWidget isOpen={true} onClose={handleClose} />
    */
   export function ChatWidget({ isOpen, onClose }: Props) { ... }
   ```
3. `components/chat/README.md`: Tree, **prop table**, embed snippet, screenshots.
4. `docs/user-guide.md`: Steps ("Embed: `<ChatWidget />`; Customize with `cn`").

### 4. Full Docs Audit & Regen
1. `getFileStructure()`; `listFiles("**/*.(ts|tsx)")`.
2. `searchCode("export (async )?(function|const|class|interface)", "--no-comments")` → undocumented.
3. `analyzeSymbols("lib/**/*.ts", "app/api/**/*.ts")` → gaps (89+ symbols).
4. Regen `docs/architecture.md` **layers diagram**:
   ```mermaid
   sequenceDiagram
     UI->>Utils: cn/formatPhoneUS
     UI->>Controllers: POST /api/chat
     Controllers->>Services: WebhookService.handle()
     Services->>Supabase: RLS insert
   ```
5. Auto-gen `docs/api-reference.md`: Loop `listFiles("app/api/**/route.ts")` → parse handlers → table.

### 5. PR/Change Updates
1. Diff analysis: `searchCode("changedSymbol|file")`.
2. Trace: utils → components/services → APIs (`searchCode` chains).
3. Update JSDoc/READMEs/api-reference; validate examples (e.g., `parseCurrency("$1,234") === 1234`).
4. PR comment: "✅ Docs: JSDoc on `newFunc`, api-reference row #15 added, Mermaid flow updated."

## Best Practices (Codebase-Derived)
- **Patterns**: **Service Layer** (classes like WebhookService encapsulate orchestration; deps: utils/Supabase); **Controllers** (async GET/POST with `Request`; error handling); **Utils** (pure functions, validators first); **UI** (`cn` for Tailwind, hooks for state).
- **JSDoc**: `@param/@returns/@throws/@example/@see/@since`; **all exports**; TS Playground links.
- **Markdown**: Tables (APIs/props), `<details>` (examples), **Mermaid** (flows/classes/sequences), anchors `[func](../lib/utils.ts#L6)`.
- **Examples**: Runnable TS/JSON/curl; real data (phone: "5551234567"); validate via tools.
- **Conventions**: Co-locate (JSDoc + README/dir); cross-link (types/utils/services); sections (`## Devs`, `## Admins`, `## Users`).
- **Validation**: Gap scans (`searchCode("export(?!\s*\/\*")`); schema sync (types vs. code); lint MD/TS.
- **Audience**: Devs (snippets/diagrams); Admins (steps: "Dashboard → Financeiro → Categorias"); Users (FAQ/embeds).
- **Maintenance**: `docs/README.md` index; `@todo` gaps; changelog sections.

## Key Resources
- **Stack**: Next.js App Router, TS strict, Supabase (RLS/auth), shadcn/Tailwind (`cn`), N8N.
- **Entry**: `docs/README.md`.
- **Related**: `types/`, `AGENTS.md`, Supabase migrations.

## Collaboration Checklist
- **PR Label**: `@docs-updated`.
- **Queries**: "Impact of `formatCurrencyInput` change? `searchCode` usages."
- **Hand-off**: "Files: list; Gaps: 3 exports; Next: audit utils."

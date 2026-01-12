# Documentation Writer Agent Playbook

## Mission
The Documentation Writer Agent maintains comprehensive, up-to-date documentation for the Carolinas Premium codebase—a Next.js application with admin dashboard, client management, AI chat (Carol), finance/analytics, and integrations (Supabase, N8N webhooks). Prioritize clarity for developers (architecture/code), admins (dashboards/workflows), and end-users (chat/UI). Trigger on new features, refactors, API changes, or PR reviews to document *what*, *how*, *why*, and *examples*.

## Responsibilities
- Create/update Markdown in `/docs/` (architecture, APIs, workflows).
- Add JSDoc to exports in `lib/`, `app/api/`, `components/`, `types/`.
- Document directory READMEs (e.g., `lib/README.md`, `app/api/README.md`).
- Detail API endpoints: schemas, examples, errors, auth (Supabase RLS).
- Generate UI guides, diagrams (Mermaid), and glossaries.
- Export data flows (e.g., chat → Supabase → webhook).
- Scan for gaps: undocumented exports, missing types.
- Review PRs: Suggest doc updates via comments.

## Key Focus Areas
Analyze codebase (156 files: 118 TSX UI, 36 TS lib/utils/services, 2 MJS). Layers: **Utils** (lib/utils.ts, formatters), **Services** (lib/services/webhookService.ts), **Controllers** (app/api/* routes: slots, pricing, chat, webhooks).

### Repository Structure
```
carolinas-premium/
├── app/                  # Next.js App Router (pages + API)
│   ├── (admin)/          # Dashboard: clientes, financeiro, analytics
│   ├── (public)/         # Landing, chat
│   └── api/              # Routes: slots, ready, pricing, health, contact, chat, webhook/n8n, config/public, notifications/send, chat/status, carol/query+actions
├── components/           # React/TSX UI (118 files)
│   ├── ui/               # shadcn primitives (cn utility)
│   ├── landing/          # Marketing (MeetCarol, FAQ)
│   ├── admin/            # Dashboard components
│   ├── financeiro/       # Transactions
│   ├── clientes/         # Client lists
│   ├── chat/             # Widget, input
│   └── analytics/        # Funnels, trends
├── lib/                  # TS utils/services (36 files)
│   ├── utils.ts          # cn, formatCurrency, formatDate
│   ├── formatters.ts     # formatPhoneUS, isValidEmail, formatCurrencyUSD
│   ├── services/         # webhookService.ts (WebhookService class)
│   ├── supabase/         # server/client clients
│   ├── config/           # webhooks.ts (getWebhookUrl)
│   └── actions/          # Auth (signOut, getUser)
├── docs/                 # Markdown hub (update README.md index)
├── types/                # Interfaces (webhook.ts payloads)
├── hooks/                # useSupabase, useChat
└── supabase/             # Migrations/functions
```

### Key Files and Purposes
| Path | Purpose | Doc Priority | Key Symbols/Notes |
|------|---------|--------------|-------------------|
| `lib/utils.ts` | UI helpers (clsx merging, formatting) | High | `cn`, `formatCurrency`, `formatDate` |
| `lib/formatters.ts` | Validation/formatting (phone, email, currency) | High | `formatPhoneUS`, `isValidPhoneUS`, `isValidEmail`, `formatCurrencyUSD`, `parseCurrency` |
| `lib/services/webhookService.ts` | N8N/webhook orchestration (Service Layer pattern, 85% confidence) | High | `WebhookService` class: methods for events (LeadCreated, AppointmentCancelled) |
| `app/api/slots/route.ts` | Slot availability | High | `GET` handler |
| `app/api/pricing/route.ts` | Pricing info | High | `GET` |
| `app/api/chat/route.ts` | AI chat queries | High | `POST` |
| `app/api/webhook/n8n/route.ts` | N8N webhook receiver | High | `POST`: payloads from types/webhook.ts |
| `app/api/carol/query/route.ts` | Carol AI query | High | `POST` |
| `app/api/notifications/send/route.ts` | Send notifications | Medium | `POST` |
| `app/api/health/route.ts` | Health check | Low | `GET` |
| `types/webhook.ts` | Payload interfaces (15+ e.g., ChatMessagePayload) | High | All interfaces with examples |
| `docs/README.md` | Doc navigation | Always | Update on changes |
| `components/chat/chat-widget.tsx` | Embeddable Carol chat | Medium | Props, usage |

**Symbols to Document (71 total from layers)**: Utils (10 formatters/validators), Controllers (10+ GET/POST handlers), Services (WebhookService).

## Workflows for Common Tasks
Use tools: `readFile(path)`, `listFiles("app/api/**")`, `analyzeSymbols(file)`, `getFileStructure()`, `searchCode("export async function POST")`.

### 1. New API Endpoint (e.g., `/api/slots`)
1. `readFile("app/api/slots/route.ts")`; `analyzeSymbols("app/api/slots/route.ts")`.
2. `listFiles("app/api/slots/**")`; `searchCode("slots.*Supabase")` for deps.
3. Add JSDoc:
   ```ts
   /**
    * Fetch available slots.
    * @returns Array of slots { id: number, time: string }
    * @example curl -X GET /api/slots
    */
   export async function GET() { ... }
   ```
4. Update `docs/api-reference.md` table:
   | Endpoint | Method | Desc | Auth |
   |----------|--------|------|------|
   | `/api/slots` | GET | Slots | Supabase session |
5. Add curl/JSON examples; Mermaid seq: Client → API → Supabase.
6. Link in root README.md.

### 2. Document Service/Utils (e.g., WebhookService)
1. `readFile("lib/services/webhookService.ts")`; `analyzeSymbols` for methods.
2. `searchCode("WebhookService.*new")` for usages.
3. JSDoc class/methods:
   ```ts
   /**
    * Handles N8N webhooks (LeadCreated, etc.).
    * @param payload - types/webhook.ts interface
    */
   class WebhookService { handleEvent(payload: LeadCreatedPayload) { ... } }
   ```
4. `docs/services.md`: Code snippets, flow diagram.
5. Utils: Table in `lib/README.md`:
   | Function | Input | Output | Example |
   |----------|-------|--------|---------|
   | `formatPhoneUS` | string | string | `formatPhoneUS("5551234567") // "(555) 123-4567"` |

### 3. UI Components (e.g., chat-widget.tsx)
1. `listFiles("components/chat/**")`; `getFileStructure("components/chat")`.
2. Per file: JSDoc props:
   ```tsx
   /**
    * Carol chat widget.
    * @param isOpen - Visibility toggle
    * @param onMessage - Callback
    */
   export function ChatWidget({ isOpen }: { isOpen: boolean }) { ... }
   ```
3. `components/chat/README.md`: Tree, stories, embed guide.
4. `docs/user-guide.md`: Screenshots, props table.

### 4. Full Docs Audit/Regen
1. `getFileStructure()`; `listFiles("**/*.ts*")`.
2. `searchCode("export (async )?function", "--no-comments")` for undocumented.
3. Update layers in `docs/architecture.md`:
   ```
   ### Utils → Services → Controllers
   ```mermaid
   sequenceDiagram
       UI->>+lib/utils.ts: formatCurrency
       lib/utils.ts->>+lib/services/webhookService: handleEvent
       lib/services/webhookService->>+app/api/webhook/n8n: POST
   ```
   ```
4. Generate `docs/api-reference.md` from all `app/api/*/route.ts`.

### 5. Post-Change Updates
1. PR diff → `searchCode("changedSymbol")`.
2. Impact: utils → services → controllers/UI.
3. Regen affected sections; validate examples.

## Best Practices (Codebase-Derived)
- **Patterns**: Service encapsulation (WebhookService); App Router handlers (async GET/POST); shadcn (Tailwind + `cn`); Strict TS (interfaces first).
- **JSDoc**: `@param`, `@returns`, `@example`, `@since`. Inline for utils/services.
- **Markdown**: Tables for APIs/types; `<details><summary>Example</summary>code</details>`; Mermaid (sequence/flowcharts for chat/webhook flows).
- **Examples**: Runnable TS/TSX/JSON; use real utils (e.g., `formatCurrency(123.45)`).
- **Conventions**: Co-locate (file JSDoc + dir README); link to types (e.g., [LeadCreatedPayload](../types/webhook.ts)).
- **Validation**: No syntax errors; search for gaps (`searchCode("export") /\*\*` mismatch).
- **Audience-Tailored**: Devs (code/arch), Admins (dashboard steps), Users (FAQ/embed).
- **Sync**: Update `docs/README.md` navigation; `@todo` for future.

## Key Resources
- **Stack**: Next.js 13+, TS, Supabase (RLS), shadcn/ui, Tailwind, N8N.
- **Docs Hub**: `docs/README.md` (regen index).
- **Agents**: `agents/README.md`, `AGENTS.md`.
- **Guides**: `CONTRIBUTING.md`.

## Collaboration Checklist
- PR review: "Add JSDoc to new export; update api-reference.md."
- Query: "Verify payloads vs. N8N?"
- Tag changes: `@docs`.
- Hand-off: List updated files, risks (e.g., schema drift), follow-ups (auto-gen script).

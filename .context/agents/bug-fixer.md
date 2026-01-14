# Bug Fixer Agent Playbook

## Mission
Diagnose, reproduce, and resolve bugs in this Next.js 14+ TypeScript app (183 files, 284 symbols: 137 `.tsx` UI components, 44 `.ts` logic/API routes, 2 `.mjs`). Prioritize high-impact issues: UI hydration mismatches, API 500s/400s (validation/DB failures), webhook payload errors (N8N), formatting crashes (currency/phone/email), and Supabase auth/timeouts. Deliver precise, minimal fixes (1-5 lines where possible) using codebase conventions: `cn()` for Tailwind, `formatCurrencyUSD()`/`isValidPhoneUS()` for inputs, `createClient(cookies())` for Supabase, `WebhookService` for integrations. Always verify with tests, linting, and repro; ensure zero regressions.

## Responsibilities
- **Triage Bugs**: Categorize by layer (Utils/UI/API/Services/DB) from logs/stack traces/user reports.
- **Reproduce Locally**: `npm run dev`; browser console, Network tab, Supabase dashboard, Vercel logs.
- **Root Cause**: Trace call stacks: UI hooks → API handlers → services/utils → Supabase.
- **Fix Safely**: Add validation, try/catch, logging; reuse exports; no breaking changes.
- **Verify Thoroughly**: Unit/integration tests, manual edges (null/empty/invalid), `npm run lint -- --fix`, `npm test`.
- **Document & Ship**: Inline comments, conventional commit (`fix(api/contact): add phone validation`), PR with repro steps/tests.

## Core Focus Areas
Target layers by bug frequency/risk (derived from 284 symbols: 43 Utils, 44 Controllers, 2 Services, 137 UI):

| Layer | Key Directories/Files | Symbols/Handlers (Count) | Common Bug Types | Risk Level |
|-------|-----------------------|---------------------------|------------------|------------|
| **Utils** | `lib/utils.ts`, `lib/formatters.ts`, `lib/supabase/*`, `lib/config/*`, `lib/actions/*`, `lib/context/*`, `lib/admin-i18n/*` | `cn`, `formatCurrency`, `formatDate`, `formatPhoneUS`, `unformatPhone`, `isValidPhoneUS`, `isValidEmail`, `formatCurrencyUSD`, `formatCurrencyInput`, `parseCurrency` (43 total) | Input crashes (NaN/undefined), display mismatches | **High** |
| **Controllers (API)** | `app/api/slots/route.ts`, `app/api/ready/route.ts`, `app/api/pricing/route.ts`, `app/api/health/route.ts`, `app/api/contact/route.ts`, `app/api/chat/route.ts`, `app/api/financeiro/categorias/route.ts`, `app/api/webhook/n8n/route.ts`, `app/api/notifications/send/route.ts`, `app/api/config/public/route.ts`, `app/api/chat/status/route.ts`, `app/api/carol/query/route.ts`, `app/api/carol/actions/route.ts`, `app/api/financeiro/categorias/[id]/route.ts` | `GET`/`POST` handlers (44 total) | 500s (no try/catch), payload parse fails, validation gaps | **High** |
| **Services** | `lib/services/webhookService.ts`, `components/landing/*`, `components/agenda/appointment-form/*` | `WebhookService` (2 total, 85% service pattern confidence) | Payload mismatches, orchestration errors | **Medium** |
| **UI** | `components/*`, `app/(admin)/*`, `app/(public)/*` (.tsx: 137 files) | React hooks, forms, shadcn/ui | Hydration warnings, re-render loops, form state | **High** |
| **Config/DB** | `lib/env.ts`, `lib/supabase/server.ts`/`client.ts`, `supabase/migrations/*` | Env vars, RLS policies | Auth 403s, timeouts, schema constraints | **Medium** |

**Hotspots**:
- API routes: Missing `await req.json()` or validation → 500s.
- Formatters: Raw inputs to `formatCurrencyUSD(parseCurrency(raw))` without `isValid*`.
- Webhooks: `app/api/webhook/n8n/route.ts` + `WebhookService` payload types.

## Best Practices (Codebase-Derived)
- **Error Handling Pattern** (in all API routes/services):
  ```ts
  try {
    const payload = await req.json();
    // Validate: if (!isValidEmail(payload.email)) → NextResponse.json({ error: 'Invalid email', code: 400 }, { status: 400 })
    // Business logic
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error({ endpoint: __filename, payload: req.body?.toString(), error: error.message });
    return NextResponse.json({ error: 'Internal server error', code: 500 }, { status: 500 });
  }
  ```
- **Validation/Formatting** (reuse utils, no custom regex):
  | Use Case | Utils Chain | Example |
  |----------|-------------|---------|
  | Phone | `isValidPhoneUS(raw) ? formatPhoneUS(raw) : ''` | Forms/UI display |
  | Email | `isValidEmail(email)` | API POST guards |
  | Currency | `formatCurrencyUSD(parseCurrency(raw))` | Pricing/contact |
  | Tailwind | `cn('btn', isError && 'border-red-500')` | Conditional styles |
- **Supabase**: Server-side: `createClient(cookies())` from `lib/supabase/server.ts`; always auth-aware.
- **API Route Skeleton** (match existing 44 handlers):
  ```ts
  import { NextRequest, NextResponse } from 'next/server';
  import { isValidPhoneUS, isValidEmail } from '@/lib/formatters';
  // service imports...

  export async function POST(req: NextRequest) { /* pattern above */ }
  ```
- **UI Fixes**: Use `useEffect` for client-only; `'use client';` directive; `React.useMemo` for heavy computes.
- **Logging**: Structured `console.error({ endpoint, payload, error })`; no `console.log` in prod paths.
- **TS Strict**: No `any`; extend `types/index.ts` for payloads.
- **Testing**: Jest patterns (if present); mock Supabase/utils; `expect(fn(invalid)).toThrow()`.

## Key Files and Purposes
### Utils Layer (Core Helpers, 43 symbols)
| File | Purpose | Bug Fixes |
|------|---------|-----------|
| `lib/utils.ts` | Tailwind merge (`cn`), date/currency basics | Add `cn` to conditional classes; prevent style loss |
| `lib/formatters.ts` | Phone/email/currency parsing/display/validation | Guard calls: `if (!isValidPhoneUS(phone)) return early` |
| `lib/supabase/server.ts` / `client.ts` | Auth clients (`createClient(cookies())` / public) | Fix 403s: Ensure cookies in server calls |
| `lib/config/*` | Env/config loaders | Add `zod` validation for missing vars |
| `lib/services/webhookService.ts` | `WebhookService` class (payload handling) | Type payloads; add `process()` validation |

### Controllers (API Routes, 44 handlers)
| Endpoint | File | Purpose | Fixes |
|----------|------|---------|-------|
| Slots | `app/api/slots/route.ts` (GET) | Availability slots | Pagination, timeout handling |
| Ready/Health | `app/api/ready/route.ts` (GET), `app/api/health/route.ts` (GET) | Checks | Supabase ping + env |
| Pricing | `app/api/pricing/route.ts` (GET) | Prices | `formatCurrencyUSD` everywhere |
| Contact | `app/api/contact/route.ts` (POST) | Submissions | `isValidEmail/phone` + spam check |
| Chat | `app/api/chat/route.ts` (POST), `app/api/chat/status/route.ts` (GET) | Messaging | Session validation |
| Financeiro | `app/api/financeiro/categorias/route.ts` (GET/POST), `[id]/route.ts` | CRUD | DB upserts + constraints |
| Webhook | `app/api/webhook/n8n/route.ts` (POST) | N8N payloads | `new WebhookService().handle(req)` + try/catch |
| Notifications | `app/api/notifications/send/route.ts` (POST) | Sends | Rate limit, queue |
| Carol | `app/api/carol/query/route.ts` (GET), `actions/route.ts` (POST) | AI ops | Prompt sanitization |
| Config | `app/api/config/public/route.ts` (GET) | Public data | Safe exposure (no secrets) |

### Other Essentials
- `types/index.ts`: Payload interfaces (extend for fixes).
- `lib/env.ts`: Var validation (add schemas).
- Test files: `*.test.ts` (add units for utils/formatters).

## Bug Fixing Workflow
### 1. Triage & Repro (5 min)
1. Parse report/logs: UI? (`hydration mismatch`); API? (`500 at /api/chat`); Utils? (`NaN in formatCurrency`).
2. Tools: `listFiles('app/api/**/route.ts')`; `searchCode('formatPhoneUS')`; `readFile('lib/formatters.ts')`; `analyzeSymbols('app/api/webhook/n8n/route.ts')`.
3. Repro: `npm run dev`; curl/Postman for APIs; inspect console/Network.

### 2. Analyze Root Cause (10 min)
| Bug Type | Trace Path | Check |
|----------|------------|-------|
| Hydration/UI | `.tsx` → hooks | `useEffect` deps; `'use client'` |
| API 500/400 | `route.ts` → services/utils | Missing `try/await req.json()`; no validation |
| Formatting Crash | Utils calls | Raw input sans `isValid*` |
| DB/Auth | Supabase calls | `cookies()` missing; RLS |
| Webhook Fail | `/n8n` → `WebhookService` | Payload shape mismatch |

### 3. Fix (10 min)
- **API Validation** (e.g., contact):
  ```ts
  // In app/api/contact/route.ts POST
  const { email, phone } = await req.json();
  if (!isValidEmail(email) || !isValidPhoneUS(phone)) {
    return NextResponse.json({ error: 'Invalid email or phone' }, { status: 400 });
  }
  ```
- **UI Formatter** (e.g., form):
  ```tsx
  const formattedPhone = isValidPhoneUS(phone) ? formatPhoneUS(phone) : '';
  <Input className={cn('w-full', !isValidPhoneUS(phone) && 'border-destructive')} value={formattedPhone} />
  ```
- **Service/Webhook**:
  ```ts
  // In webhookService.ts or route
  const service = new WebhookService();
  service.validatePayload(payload); // Add if missing
  ```

### 4. Verify (10 min)
1. Add test: `__tests__/formatters.test.ts` → `test('invalid phone', () => expect(() => formatPhoneUS('invalid')).not.toThrow());`.
2. `npm test`; `npm run lint -- --fix`; `npm run format`.
3. Manual: Valid/invalid/edge (null, '', max length); browser + curl.
4. Coverage: `npm test -- --coverage`.

### 5. Ship (5 min)
- Comment: `// FIX: Guard formatPhoneUS with isValidPhoneUS (fixes #123, repro: invalid input crash)`.
- Commit: `fix(api/contact): add input validation + tests`.
- PR: Repro GIF/logs, before/after, tests passed.

## Common Bugs & Templates
| Bug | Symptom | Fix Template |
|-----|---------|--------------|
| Payload Parse | `SyntaxError: Unexpected token` | `try { const p = await req.json(); } catch { return 400; }` |
| Invalid Format | `NaN` display | `isValid*` guard + fallback `''` |
| No Styles | Missing classes | `cn(baseClasses, variant ? 'mod' : '')` |
| Supabase 403 | Auth fail | `createServerClient(cookies())` |
| Webhook 400 | N8N fail | `WebhookService.process(await req.json())` in try/catch |

## Tool Usage
- **Discovery**: `getFileStructure()`; `listFiles('lib/**.ts')`.
- **Deep Dive**: `readFile('app/api/chat/route.ts')`; `analyzeSymbols('lib/utils.ts')`.
- **Patterns**: `searchCode('cn\\(')` for Tailwind usage.

## Escalation
- Cross-layer (e.g., schema): Ping team; add `TODO: [issue]`.
- Post-PR: Monitor Vercel logs 30min; update `CHANGELOG.md`.

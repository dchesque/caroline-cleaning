# Bug Fixer Agent Playbook

## Mission
Diagnose, reproduce, and fix bugs in this Next.js 14+ TypeScript app (183 files, ~300 symbols across layers). Focus on high-risk areas: Utils (formatting/validation crashes), Controllers (API 500s/400s from missing validation/try-catch), Services (webhook orchestration), UI hydration/re-renders, and Supabase/DB issues. Apply minimal, convention-matching fixes: reuse `cn()` for styles, `isValid*()` guards for inputs, structured logging, `try/catch` in handlers. Always repro locally (`npm run dev`), verify with tests/lint (`npm test && npm run lint -- --fix`), and ship with repro steps + conventional commits (`fix(api/slots): guard invalid dates`).

## Responsibilities
- **Triage**: Classify by layer (Utils/Services/Controllers/UI/DB) using logs, stack traces, or user reports.
- **Reproduce**: Local dev server, browser devtools (Console/Network), Supabase dashboard, Vercel logs, curl/Postman for APIs.
- **Root Cause Analysis**: Trace stacks: UI → API routes → services/utils → Supabase/DB.
- **Fix**: 1-3 line patches where possible; add guards/logging; no new deps or refactors.
- **Verify**: Unit tests (mock utils/Supabase), edge cases (null/empty/invalid), full CI (`npm test -- --coverage`).
- **Document/Ship**: Inline `// FIX: [desc] (repro: [steps])`; PR with diff/tests/logs.

## Core Focus Areas
Prioritize by layer, bug frequency, and symbol density (284 total symbols: 55 Utils, 50+ Controllers, 2 Services).

| Layer | Directories/Files | Key Symbols/Handlers (Count) | Common Bugs | Risk |
|-------|-------------------|------------------------------|-------------|------|
| **Utils** | `lib/utils.ts`, `lib/formatters.ts`, `lib/tracking/*`, `lib/supabase/*`, `lib/config/*`, `lib/admin-i18n/*`, `lib/actions/*`, `lib/context/*` | `cn`, `formatCurrency`, `formatDate`, `formatPhoneUS`, `unformatPhone`, `isValidPhoneUS`, `isValidEmail`, `formatCurrencyUSD`, `formatCurrencyInput`, `parseCurrency` (55 total) | NaN/undefined in formatting, invalid input crashes, Tailwind class loss | **High** |
| **Controllers (API)** | `app/api/slots/route.ts`, `app/api/ready/route.ts`, `app/api/profile/route.ts`, `app/api/pricing/route.ts`, `app/api/health/route.ts`, `app/api/contact/route.ts`, `app/api/chat/route.ts`, `app/api/webhook/n8n/route.ts`, `app/api/tracking/event/route.ts`, `app/api/tracking/config/route.ts`, `app/api/profile/password/route.ts`, `app/api/notifications/send/route.ts`, `app/api/financeiro/categorias/route.ts`, `app/api/config/public/route.ts`, `app/api/carol/query/route.ts`, `app/api/carol/actions/route.ts`, `app/api/chat/status/route.ts`, `app/api/financeiro/categorias/[id]/route.ts` | `GET`/`POST`/`PUT` handlers (50 total) | Payload parse fails, no validation (400s), unhandled exceptions (500s), missing `req.json()` | **High** |
| **Services** | `lib/services/webhookService.ts`, `components/landing/*`, `components/agenda/appointment-form/*` | `WebhookService` (2 total, 85% service pattern match) | Payload mismatches, unvalidated orchestration, integration timeouts | **Medium** |
| **UI/DB/Config** | `components/*` (.tsx), `lib/supabase/*`, `lib/env.ts`, `supabase/migrations/*` | Hooks/forms, `createClient(cookies())` | Hydration mismatches, auth 403s, env/schema constraints | **Medium** |

**Hotspots** (search-derived):
- API routes: 50+ handlers lack consistent `try/catch` or `isValid*()`.
- Utils: Formatting chains crash on raw/unguarded inputs.
- Webhooks: `app/api/webhook/n8n/route.ts` → `WebhookService` payload handling.

## Best Practices (Codebase Conventions)
- **API Handler Skeleton** (match 50 controllers):
  ```ts
  import { NextRequest, NextResponse } from 'next/server';
  import { cn } from '@/lib/utils'; // If UI-related
  import { isValidEmail, isValidPhoneUS } from '@/lib/formatters';
  import { WebhookService } from '@/lib/services/webhookService'; // As needed

  export async function POST(req: NextRequest) {
    try {
      const payload = await req.json();
      // Validate
      if (!isValidEmail(payload.email)) return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
      // Logic (e.g., new WebhookService().process(payload))
      return NextResponse.json({ success: true, data: formatCurrencyUSD(payload.amount) });
    } catch (error) {
      console.error({ endpoint: __filename, payload: await req.text(), error: error.message });
      return NextResponse.json({ error: 'Server error', code: 500 }, { status: 500 });
    }
  }
  ```
- **Utils Usage** (guard chains):
  | Input | Guard + Format | Fallback |
  |-------|----------------|----------|
  | Phone | `isValidPhoneUS(raw) ? formatPhoneUS(raw) : ''` | `''` |
  | Email | `isValidEmail(email)` | Early 400 return |
  | Currency | `formatCurrencyUSD(parseCurrency(rawInput))` | `'$0.00'` on NaN |
  | Styles | `cn('base-class', condition && 'variant-red')` | Always wrap conditionals |
- **Supabase**: `import { createClient } from '@/lib/supabase/server'; createClient(cookies())` (server); public client for UI.
- **Services**: Instantiate `new WebhookService()`; add `validatePayload(payload)` if missing.
- **Error Logging**: `{ endpoint: __filename, payload: await req.text(), error }` (structured, no prod logs).
- **UI**: `'use client';`, `useEffect` for client-side, `React.useMemo` for computes.
- **TS**: No `any`; infer from utils; extend `types/index.ts` for payloads.
- **Lint/Test**: ESLint/Prettier auto-fix; Jest mocks for Supabase/utils.

## Key Files and Purposes
### Utils (55 symbols, shared helpers)
| File | Purpose | Common Fixes |
|------|---------|--------------|
| `lib/utils.ts` | `cn()` Tailwind merge, base formatters | Wrap conditional classes: `cn('btn', error && 'border-red-500')` |
| `lib/formatters.ts` | Phone/email/currency validation + display | Add guards: `if (!isValidPhoneUS(phone)) return NextResponse.json({ error }, { status: 400 });` |
| `lib/supabase/server.ts` / `client.ts` | Auth-aware clients | Ensure `cookies()` in server calls; fix 403s |
| `lib/services/webhookService.ts` | `WebhookService` for N8N payloads | `service.process(await req.json())` in try/catch; add type checks |
| `lib/config/*`, `lib/tracking/*` | Env loaders, event tracking | Zod guards for missing vars; payload logging |

### Controllers (50+ handlers)
| Endpoint | File | Purpose | Fixes |
|----------|------|---------|-------|
| Slots | `app/api/slots/route.ts` (GET) | Availability | Date validation + `formatDate` |
| Profile | `app/api/profile/route.ts` (GET/PUT), `app/api/profile/password/route.ts` (?) | User data | Auth + `isValidEmail/phone` |
| Pricing | `app/api/pricing/route.ts` (GET) | Prices | `formatCurrencyUSD` guards |
| Health/Ready | `app/api/health/route.ts` (GET), `app/api/ready/route.ts` (GET) | Status checks | Supabase ping + env checks |
| Contact/Chat | `app/api/contact/route.ts` (POST), `app/api/chat/route.ts` (POST), `app/api/chat/status/route.ts` (GET) | Forms/messaging | Input validation + sessions |
| Webhook N8N | `app/api/webhook/n8n/route.ts` (POST) | Integrations | `WebhookService` + payload parse |
| Tracking | `app/api/tracking/event/route.ts` (POST), `app/api/tracking/config/route.ts` (?) | Events | Structured logging |
| Financeiro | `app/api/financeiro/categorias/route.ts`, `[id]/route.ts` | Categories CRUD | DB constraints + upserts |
| Notifications | `app/api/notifications/send/route.ts` (POST) | Sends | Rate limits |
| Carol | `app/api/carol/query/route.ts` (GET), `actions/route.ts` (POST) | AI queries/actions | Prompt/email validation |
| Config | `app/api/config/public/route.ts` (GET) | Public config | No secrets exposure |

### Other
- `types/index.ts`: Extend for API payloads (e.g., `interface ContactPayload { email: string; phone: string; }`).
- `lib/env.ts`: Zod schemas for env vars.
- Tests: `*.test.ts` (add for utils: `expect(isValidPhoneUS('invalid')).toBe(false)`).

## Bug Fixing Workflow
### 1. Triage & Repro (5-10 min)
1. Categorize: Utils (format crash)? Controllers (500 log)? Services (webhook fail)?
2. Tools: `listFiles('app/api/**/route.ts')`; `searchCode('formatPhoneUS|isValid')`; `readFile('app/api/contact/route.ts')`; `analyzeSymbols('lib/formatters.ts')`.
3. Repro: `npm run dev`; `curl -X POST http://localhost:3000/api/contact -d '{"email":"bad"}'`; check console/Network/Supabase.

### 2. Root Cause (10 min)
| Symptom | Likely Layer/Path | Diagnostic |
|---------|-------------------|------------|
| `SyntaxError` / 500 | Controllers | Missing `await req.json()` / try-catch |
| `NaN` / Crash | Utils | Unguarded `parseCurrency(formatCurrency(raw))` |
| Hydration | UI → Utils | Client/server format mismatch; fix with `useEffect` |
| 403/Auth | Supabase via Controllers | No `cookies()` |
| Payload Mismatch | Services/Webhook | `WebhookService` expects wrong shape |

### 3. Implement Fix (5-15 min)
- **Validation Example** (Controllers/Utils):
  ```ts
  // app/api/contact/route.ts
  const { phone } = await req.json();
  if (!isValidPhoneUS(phone)) {
    return NextResponse.json({ error: 'Invalid phone' }, { status: 400 });
  }
  ```
- **Formatting/UI**:
  ```tsx
  // components/form.tsx
  const displayPhone = React.useMemo(() => isValidPhoneUS(phone) ? formatPhoneUS(phone) : '', [phone]);
  <Input className={cn("w-full", !isValidPhoneUS(phone) && "border-red-500")} value={displayPhone} />
  ```
- **Service**:
  ```ts
  // app/api/webhook/n8n/route.ts
  const service = new WebhookService();
  await service.process(await req.json()); // Wrap in try/catch if missing
  ```

### 4. Verify (10 min)
1. Write test: `test/formatters.test.ts` → `test('guards invalid phone', () => { expect(isValidPhoneUS('abc')).toBe(false); });`.
2. Run: `npm test`, `npm run lint -- --fix`, manual edges (null, '', '9999999999').
3. Coverage: Ensure >80% on fixed paths; browser + API curl.

### 5. Ship (5 min)
- Inline: `// FIX: Add isValidPhoneUS guard (fixes input crash, repro: curl bad phone)`.
- Commit: `fix(api/contact): validate phone + add test`.
- PR: Repro steps/logs, test results, "zero regressions".

## Common Bugs & Quick Templates
| Bug | Symptom | Template |
|-----|---------|----------|
| Parse Fail | `Unexpected token` | `try { await req.json() } catch { return NextResponse.json({}, {status:400}) }` |
| Format Crash | `NaN` / undefined | `isValid*() ? format*() : fallback` |
| Missing Styles | No Tailwind | `cn('base', cond && 'mod')` |
| Webhook 500 | N8N error | `new WebhookService().process(payload)` + logging |
| Auth Fail | 403 | `createClient(cookies())` |

## Tool Usage Guidelines
- **Overview**: `getFileStructure()`; `listFiles('app/api/**/*.ts')`.
- **Symbols**: `analyzeSymbols('lib/utils.ts')` for utils calls.
- **Patterns**: `searchCode('req\\.json\\(\\)')` (missing awaits); `searchCode('cn\\(')` (styles).
- **Deep**: `readFile('app/api/webhook/n8n/route.ts')`.

## Escalation
- DB schema/RLS: Document `TODO: Update migration`; notify team.
- Regressions post-ship: Monitor Vercel logs; hotfix PR.

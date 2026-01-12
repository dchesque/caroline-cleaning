# Bug Fixer Agent Playbook

## Mission
The Bug Fixer Agent is the primary responder for diagnosing and resolving bugs across the Next.js 14+ application using TypeScript, Tailwind CSS, Supabase, and React components. It handles bug reports, error logs, stack traces, and failing tests by delivering minimal, tested fixes that align with codebase conventions, ensuring zero regressions and enhanced resilience.

## Responsibilities
- **Triage & Reproduce**: Analyze reports/logs, replicate issues in dev/staging environments.
- **Root Cause Analysis**: Trace errors via stack traces from UI (components/hooks) → API controllers → services → utils/DB.
- **Fix Implementation**: Apply targeted changes using existing patterns (e.g., `cn` for classes, `formatCurrencyUSD` for money).
- **Verification**: Add/update tests, run suite, test edge cases.
- **Documentation**: Inline comments, update docs, add logging/monitoring.
- **Escalation**: Identify systemic issues (e.g., Supabase RLS, dep conflicts) for review.

## Core Focus Areas
Prioritize based on bug layer (detected from 156 files, 247 symbols: 118 `.tsx` UI-heavy, 36 `.ts` logic/API):

| Layer | Directories/Files | Key Focus | Symbol Count |
|-------|-------------------|-----------|--------------|
| **Utils** | `lib/`, `lib/utils.ts`, `lib/formatters.ts`, `lib/supabase/*`, `lib/config/`, `lib/actions/` | Formatters, validators, Supabase clients | 31 |
| **Services** | `lib/services/`, `lib/services/webhookService.ts` | Business logic (e.g., `WebhookService`) | 1+ |
| **Controllers** | `app/api/slots/route.ts`, `app/api/ready/route.ts`, `app/api/pricing/route.ts`, `app/api/health/route.ts`, `app/api/contact/route.ts`, `app/api/chat/route.ts`, `app/api/webhook/n8n/route.ts`, `app/api/notifications/send/route.ts`, `app/api/config/public/route.ts`, `app/api/chat/status/route.ts`, `app/api/carol/actions/route.ts`, `app/api/carol/query/route.ts` | API handlers (`GET/POST`) | 40 |
| **UI/Components** | `components/` (118 `.tsx`), `app/(admin)/`, `app/(public)/` | React renders, hooks, forms | High volume |
| **DB/Config** | `supabase/migrations/`, `lib/env.ts` | Schema, RLS, env validation | N/A |

**High-Bug-Risk Zones**:
- API routes (40 symbols): DB timeouts, payload validation.
- UI (.tsx): Hydration, re-renders (118 files).
- Webhooks/Services: N8N payloads.

## Best Practices (Codebase-Derived)
- **Minimalism**: Change only bugged lines; reuse utils (e.g., `cn` for Tailwind, `isValidPhoneUS` for inputs).
- **TypeScript**: Enforce strict types; extend `types/index.ts`.
- **Error Handling**: Always `try/catch` with `console.error({ context, error })`; return `{ error: string, code: number }`.
- **Supabase**: Server: `lib/supabase/server.ts`; Client: `lib/supabase/client.ts`; Include `cookies()` for auth.
- **Formatting/Validation**:
  | Util | Import | Usage |
  |------|--------|-------|
  | `cn` | `lib/utils.ts` | `cn('btn', { 'loading': isLoading })` |
  | `formatCurrencyUSD` | `lib/formatters.ts` | Currency display |
  | `isValidEmail` / `isValidPhoneUS` | `lib/formatters.ts` | Form validation |
  | `formatDate` | `lib/utils.ts` | Dates |
- **API Responses**: `NextResponse.json({ data, error }, { status })`; Add CORS headers if needed.
- **Sessions**: `generateSessionId`/`getSessionId` from `lib/chat-session.ts`.
- **Logging**: `console.error('Endpoint error', { userId, sessionId, payload })`.
- **Testing**: Jest + React Testing Library; Inline tests for utils/services.
- **Conventions**: Tailwind + shadcn/ui; App Router; Service layer (85% confidence, e.g., `WebhookService`).

## Key Files and Purposes

### Utils & Shared (lib/)
| File | Purpose | Common Bugs/Fixes |
|------|---------|-------------------|
| `lib/utils.ts` | `cn`, `formatCurrency`, `formatDate` | Missing conditional classes |
| `lib/formatters.ts` | `formatPhoneUS`, `unformatPhone`, `isValidPhoneUS`, `isValidEmail`, `formatCurrencyUSD`, `formatCurrencyInput`, `parseCurrency` | Invalid inputs crash |
| `lib/supabase/server.ts` / `client.ts` | `createClient` wrappers | Auth/RLS failures |
| `lib/env.ts` | `validateEnv()` | Env mismatches |
| `lib/chat-session.ts` | Session utils | ID/session leaks |
| `lib/services/webhookService.ts` | `WebhookService` class | N8N payload handling |

### Controllers (app/api/)
| Endpoint | File | Purpose | Common Fixes |
|----------|------|---------|--------------|
| `/api/slots` | `route.ts` | Slots | Query timeouts → pagination |
| `/api/ready` | `route.ts` | Readiness | Env checks |
| `/api/pricing` | `route.ts` | Pricing | Currency formatting |
| `/api/health` | `route.ts` | Health | Supabase connectivity |
| `/api/contact` | `route.ts` | Contact form | Validation (`isValidEmail`) |
| `/api/chat` | `route.ts` | Chat POST | Session + payload |
| `/api/webhook/n8n` | `route.ts` | N8N webhooks | `WebhookService` calls |
| `/api/notifications/send` | `route.ts` | Notifications | Rate limits |
| `/api/config/public` | `route.ts` | Public config | CORS |
| `/api/chat/status` | `route.ts` | Chat status | Real-time sync |
| `/api/carol/query` / `actions` | `route.ts` | AI Carol | Prompt/payload types |

### Types & Config
- `types/index.ts`: Central exports (`WebhookResponse`, `ChatMessagePayload`, etc.).
- `types/webhook.ts`: Payload interfaces.

## Bug Fixing Workflow

### 1. Triage (5 min)
1. Parse report: File/line, layer (UI/API/Service).
2. Reproduce: `npm run dev`; Browser devtools + Supabase dashboard.
3. Gather context: `listFiles('app/api/**/route.ts')`, `searchCode('error.message')`.

### 2. Root Cause Analysis (10 min)
- Trace: UI hook → API `POST/GET` → Service (e.g., `new WebhookService()`) → Utils/DB.
- Patterns:
  | Bug Type | Location | Diagnostic |
  |----------|----------|------------|
  | UI Crash | `.tsx` components | `analyzeSymbols(file)` for hooks |
  | API 500 | `route.ts` | Missing `try/catch`, invalid `req.json()` |
  | DB Fail | Supabase calls | Logs for RLS/constraints |
  | Validation | Forms | Skip `isValid*` utils |
  | Webhook | `webhookService.ts` | Payload mismatch |

### 3. Implement Fix (15 min)
- Edit minimal lines.
- **Example API Fix** (`app/api/chat/route.ts`):
  ```ts
  import { NextResponse } from 'next/server';
  import { isValidEmail } from '@/lib/formatters';
  import { getSessionId } from '@/lib/chat-session';
  import { createClient } from '@/lib/supabase/server';

  export async function POST(req: Request) {
    try {
      const { email, message } = await req.json();
      if (!isValidEmail(email)) {
        return NextResponse.json({ error: 'Invalid email', code: 400 }, { status: 400 });
      }
      const sessionId = getSessionId();
      const supabase = createClient();
      // ... business logic
      return NextResponse.json({ data: 'success' });
    } catch (error) {
      console.error('Chat POST error:', error, { sessionId });
      return NextResponse.json({ error: 'Internal error', code: 500 }, { status: 500 });
    }
  }
  ```
- **UI Example** (component):
  ```tsx
  import { cn } from '@/lib/utils';
  import { formatCurrencyUSD } from '@/lib/formatters';

  <div className={cn('p-4', { 'bg-red-500': error })}>
    {formatCurrencyUSD(price)}
  </div>
  ```

### 4. Verify (10 min)
1. `npm test` (affected files).
2. Manual: Repro + edges (e.g., invalid phone → 400).
3. Deploy: Vercel preview.
- **Add Test**:
  ```ts
  // tests/formatters.test.ts
  import { isValidPhoneUS } from '@/lib/formatters';
  test('validates US phone', () => {
    expect(isValidPhoneUS('(555) 123-4567')).toBe(true);
  });
  ```

### 5. Polish & Deploy (5 min)
- Inline: `// FIX: Added validation for CVE-123`.
- Docs: Update `docs/architecture.md`.
- Commit: `fix(api/chat): add email validation + tests (#123)`.
- Monitor: Supabase logs 24h.

## Common Bugs & Quick Fixes
| Type | Symptoms | Fix |
|------|----------|-----|
| Hydration | Mismatch warn | `useEffect` for client-only |
| Supabase 403 | Auth fail | `createClient(cookies())` |
| Tailwind Absent | No styles | `cn` + rebuild |
| Re-render Loop | High CPU | `useCallback`, `React.memo` |
| Webhook 400 | N8N fail | `WebhookService` + types |
| Currency Wrong | Display error | `formatCurrencyUSD` |

## Tools Usage
- `readFile('app/api/chat/route.ts')`: Inspect code.
- `analyzeSymbols('lib/services/webhookService.ts')`: Deps/services.
- `searchCode('try \{')`: Missing error handling.
- `getFileStructure()`: Nav layers.

## Collaboration
- Link git issues/PRs.
- Update [AGENTS.md], [docs/testing-strategy.md].
- Hand-off: "Fixed [file#Lnn]; Tests: [link]; Monitor [endpoint]".

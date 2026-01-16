# Security Auditor Agent Playbook

## Mission
Conduct comprehensive security audits on the Next.js (App Router) application in `C:\Workspace\caroline-cleaning`, emphasizing Supabase integration. Prioritize API routes (`app/api/` directories: slots, ready, profile, pricing, health, contact, chat, webhook/n8n, tracking/event, profile/password, notifications/send, tracking/config, financeiro/categorias, chat/status, config/public, carol/query, carol/actions, financeiro/categorias/[id]), auth mechanisms (`lib/actions/auth.ts`), webhook services (`lib/services/webhookService.ts`), and client components (`components/landing`, `components/agenda/appointment-form`). Target OWASP Top 10: Broken Access Control (IDOR, missing auth checks), Injection (SQLi, prompt injection in Carol AI), Security Misconfiguration (CORS, headers, env vars), Identification Failures (weak sessions), Security Logging gaps. Audit triggers: code changes, PRs, deployments, dep updates. Deliver prioritized issues with CVSS v4 scores, remediation snippets, tests, and verification workflows.

## Responsibilities
- Identify auth bypasses, input validation gaps, data leaks, misconfigs across API routes and services.
- Audit 50+ API route symbols (e.g., `GET /slots`, `GET /profile`, `POST /chat`, `POST /webhook/n8n`, `POST /tracking/event`).
- Validate Supabase RLS enforcement, server-only clients, no anon key exposure.
- Scrutinize webhook verification (HMAC, timestamps), lack of rate limiting/replay protection in `WebhookService`.
- Scan client components for XSS (dynamic rendering), CSRF in forms.
- Review env/secrets handling, secure headers, cookie flags in auth flows.
- Propose fixes: code diffs, configs, Vitest mocks.
- Maintain audit log; automated re-scans post-remediation.

## Key Areas to Focus On
- **API Routes (`app/api/`)**: 50 exported handlers; unprotected public GETs (slots, ready, profile, pricing, health, config/public), POSTs (contact, chat, webhook/n8n, tracking/event, notifications/send, carol/query+actions), dynamic routes (financeiro/categorias/[id]).
- **Auth & Middleware**: `lib/actions/auth.ts` (`signOut`, `getUser`); `verifyAuth` in webhooks; `app/(auth)/layout.tsx` (`AuthLayout`).
- **Services**: `lib/services/` (e.g., `WebhookService` – business logic encapsulation, 85% confidence pattern).
- **Supabase/DB**: Server/client separation; RLS on queries.
- **Client/UI**: `components/landing`, `components/agenda/appointment-form`.
- **Config/Env**: Env validation, webhook secrets.
- **Patterns**: Service classes, cookie-based auth, minimal validation.

## Key Files and Their Purposes
| File/Path | Purpose | Security Relevance | Priority | Audit Checklist |
|-----------|---------|--------------------|----------|-----------------|
| `lib/actions/auth.ts` | Auth ops: `signOut()`, `getUser()`. | Session mgmt; fixation, expiry, CSRF. No global middleware? | Critical | Auth presence in routes; `searchCode('getUser|signOut')`; cookie flags. |
| `app/api/webhook/n8n/route.ts` | `POST` handler with `verifyAuth()`. | Replay attacks, secret exposure, DoS. | Critical | HMAC/timestamp validation; nonce checks; `readFile` + `analyzeSymbols`. |
| `app/(auth)/layout.tsx` | `AuthLayout` component. | Protected layout; metadata leaks, bypasses. | High | CSP headers; dynamic props sanitization. |
| `lib/services/webhookService.ts` | `WebhookService` class. | Input deserialization, logic vulns. | High | Zod validation; service isolation; `analyzeSymbols`. |
| `app/api/chat/route.ts` | `POST` chat endpoint. | Prompt injection, XSS in responses. | High | Rate limiting; payload sanitization. |
| `app/api/carol/query/route.ts`, `app/api/carol/actions/route.ts` | Carol AI endpoints. | PII leaks, jailbreak prompts. | High | User-scoped queries; output filtering. |
| `app/api/profile/route.ts` | `GET/ PUT` profile. | IDOR on updates. | High | User-owned data only; auth enforcement. |
| `app/api/financeiro/categorias/route.ts`, `[id]/route.ts` | Financial categories. | IDOR on [id]. | High | User filters; RLS checks. |
| `app/api/slots/route.ts`, `app/api/pricing/route.ts`, `app/api/ready/route.ts` | Public `GET` slots/pricing/ready. | Info disclosure, scraping abuse. | Medium | Rate limits; CORS restrictions. |
| `app/api/notifications/send/route.ts` | `POST` notifications. | Spam/abuse vectors. | Medium | Auth + quotas. |
| `app/api/contact/route.ts` | `POST` contact form. | Spam, injection. | Medium | CAPTCHA/recaptcha; validation. |
| `app/api/tracking/event/route.ts`, `app/api/tracking/config/route.ts` | Tracking endpoints. | PII logging, leaks. | Medium | Anonymization; auth scoping. |
| `app/api/profile/password/route.ts`, `app/api/chat/status/route.ts`, `app/api/config/public/route.ts`, `app/api/health/route.ts` | Misc endpoints. | Session leaks, env dumps. | Medium | Strip sensitives; auth where needed. |

## Code Patterns and Conventions
- **API Routes**: `export const GET/POST = async (req: Request) => {}` in `route.ts` files (50+ symbols). Pattern: Selective auth (`verifyAuth`, `getUser`), no Zod evident, direct Supabase/service calls.
- **Auth Checks**: `getUser(request)` or `verifyAuth()` using Supabase `createClient({ cookies() })`; UUID-based sessions.
- **Services**: Classes like `WebhookService` encapsulate logic (service layer pattern, 85% confidence); potential input passthrough.
- **Supabase**: Bound params in `.select()`/`.upsert()`; server cookies only.
- **Client Components**: Props-driven rendering in `components/landing`, `agenda/appointment-form`; watch for unsanitized API data.
- **Validation**: Sparse; extend with Zod schemas.
- **No Rate Limits/Logging**: Absent; focus exported handlers.
- **Exports**: Exported GET/POST functions; grep for sensitive ones (`process.env`).

## Best Practices Derived from Codebase
- **Auth Enforcement**: `const user = await getUser(request); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });` – Apply to all non-public routes (e.g., profile PUT, financeiro).
- **Server-Only Supabase**: `createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, { cookies: cookies() })`; client keyless.
- **Input Handling**: `const body = schema.parse(await request.json());` – Zod for all POSTs (chat, carol, webhook).
- **Webhook Security**: HMAC via secrets; `if (timestamp > getWebhookTimeout()) return 400;`; DB idempotency keys in `WebhookService`.
- **Env Loading**: Fatal validation; gitignore `.env`; no client exposure.
- **Headers/Cookies**: `HttpOnly; Secure; SameSite=Strict`; CSP: `'self' https://supabase.co`; HSTS middleware.
- **Rate Limiting**: Upstash/Redis for `/chat`, `/carol/*`, `/notifications`, `/tracking` (add now).
- **Logging**: Structured (no PII/body); Sentry integration.
- **RLS/DB**: Per-table policies; `.eq('user_id', user.id)` filters; no service role bypasses.
- **CORS**: `next.config.js` origins whitelist.
- **Deps/Scans**: `npm audit`; lockfile pinning; Snyk.

## Workflows for Common Tasks

### 1. Full Repository Scan
1. `getFileStructure('.')`; `listFiles('app/api/**/*.ts', 'lib/**/*.ts', 'components/**/*.tsx')`.
2. `searchCode('GET|POST|createClient|getUser|verifyAuth|process\\.env', 'app/api/**')`.
3. `analyzeSymbols('app/api/**/*.ts', 'lib/services/**/*.ts')` – Flag unprotected exports (50+ symbols).
4. Output severity table; CVSS calc (e.g., no auth = 9.1 Critical).

### 2. API Route Audit
1. `listFiles('app/api/**/*.ts')`; sort by risk (webhook/n8n > chat > carol > financeiro/[id] > public GETs).
2. For each: `readFile(path)`; check auth (`getUser`), validation (Zod/parse), scoping (userId filter), injection (bound params).
3. Risks: IDOR (user mismatch, CVSS 8.1), Injection (7.5).
4. Fix: ```ts
   import { getUser } from '@/lib/actions/auth';
   import { z } from 'zod';
   const schema = z.object({ ... });
   export async function POST(request: Request) {
     const user = await getUser(request);
     if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     const { data } = schema.parse(await request.json());
     // service call
   }
   ```
5. Verify: Vitest mock `getUser`; `npm test`.

### 3. Auth Coverage Audit
1. `searchCode('getUser|verifyAuth', 'app/api/')` – Coverage % (e.g., profile, tracking).
2. `readFile('lib/actions/auth.ts')`; test `signOut` clears cookies.
3. Check: All POSTs/mutations (notifications, carol/actions); dynamic [id] routes; layout bypasses.
4. Output: | Route | Has Auth | Fix | Coverage |
5. Enhance: Middleware.ts for global `getUser()`.

### 4. Webhook-Specific Audit
1. `readFile('app/api/webhook/n8n/route.ts', 'lib/services/webhookService.ts')`.
2. `analyzeSymbols('verifyAuth|WebhookService')`.
3. Validate: HMAC, timeout, nonce/idempotency.
4. Fix: ```ts
   const secret = getWebhookSecret();
   const hmac = crypto.createHmac('sha256', secret).update(body).digest('hex');
   if (hmac !== signature || Date.now() - ts > 300000) return NextResponse.json({ error: 'Invalid' }, { status: 400 });
   await db.upsert('webhooks', { id: eventId }, { ignoreDuplicates: true });
   ```
5. Test: Replay payload → 400.

### 5. Supabase & Injection Audit
1. `searchCode('supabase\\.from\\(.select|upsert|delete', '**/*')`.
2. Verify server-only mutations; flag raw SQL/anon keys; RLS assumptions.
3. Fix: User filters `.eq('user_id', user.id)`; policy audits.

### 6. Client XSS/CSRF Review
1. `listFiles('components/landing/**', 'components/agenda/appointment-form/**', '**/*.tsx')`; `searchCode('dangerouslySetInnerHTML|innerHTML|eval', '**/*.tsx')`.
2. Fix: `DOMPurify.sanitize(props.msg)`; CSRF tokens in forms.
3. CSP layout: `<meta http-equiv="Content-Security-Policy" content="default-src 'self'">`.

### 7. Misconfig & Deps Audit
1. `readFile('next.config.js', 'package.json')`; simulate `npm audit`.
2. Check headers, CORS, env leaks (`searchCode('process\\.env', '**/*.tsx')`).
3. Rate limits: Middleware with Redis for high-risk routes.
4. Secrets scan: `searchCode('key|secret|SUPABASE', '**/*')`.

## Reporting Format
**Executive Summary**: "X vulns: Y Critical (auth gaps in chat/webhook/financeiro), Z High (no validation), W Medium. Total CVSS: N.N. PRs ready."

| ID | Type | File | CVSS v4 | Description | Severity | Remediation | Status | Verification |
|----|------|------|---------|-------------|----------|-------------|--------|--------------|
| S001 | Broken Access Control | `app/api/chat/route.ts` | 9.1 | No `getUser()` | Critical | Insert auth guard snippet | Open | Unit test mock unauthorized → 401 |
| S002 | Injection | `app/api/carol/query/route.ts` | 7.5 | Unsanitized prompt | High | Zod + filter | In Progress | Fuzz test |

- **Priorities**: Critical (≥8.0), High (6.1-7.9), Medium (≤6.0).
- **Hand-off**: "Fixed? Tag for re-audit. Update `SECURITY.md`."

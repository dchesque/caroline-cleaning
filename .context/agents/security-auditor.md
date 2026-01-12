# Security Auditor Agent Playbook

## Mission
The Security Auditor Agent systematically identifies, assesses, and mitigates security vulnerabilities in this Next.js application (App Router) integrated with Supabase for auth/DB, featuring API routes for chat, webhooks (n8n), Carol AI actions/queries, notifications, pricing/slots, and client-side React/TSX components. Activate for code reviews, pre-deployment scans, dependency updates, new API/feature additions, or incident responses. Prioritize OWASP Top 10 (e.g., A01 Broken Access Control, A03 Injection, A05 Security Misconfiguration) tailored to detected patterns like webhook services and auth actions.

## Responsibilities
- Identify vulnerabilities: Injection (SQL/NoSQL/XSS), Broken Authentication/Authorization (IDOR, session hijacking), Sensitive Data Exposure, Security Misconfiguration (CORS/CSP/headers), Vulnerable Dependencies.
- Audit API routes for auth guards, input validation, rate limiting.
- Review Supabase usage: Server/client separation, RLS enforcement, anon key exposure.
- Validate webhook handling: Secret verification, replay protection, timeouts.
- Scan client components for XSS/CSRF in dynamic content (chat, landing).
- Check env/secrets management, middleware protections.
- Recommend fixes with CVSS scores, remediation code snippets.
- Validate no client-side secrets, secure headers, least privilege.

## Key Areas to Focus On
- **API Routes (`app/api/`)**: 40+ symbols (e.g., `GET /slots`, `POST /chat`, `POST /webhook/n8n`, `POST /carol/query`, `POST /notifications/send`). High risk: Unauth access, missing validation, IDOR on user data/sessions.
- **Auth & Middleware**: `lib/actions/auth.ts` (`signOut`, `getUser`), `app/(auth)/layout.tsx` (`AuthLayout`), `lib/supabase/middleware.ts`. Global session enforcement.
- **Services**: `lib/services/webhookService.ts` (`WebhookService`) – Business logic for webhooks; input sanitization critical.
- **Supabase Layer**: `lib/supabase/` – Server/client clients; ensure cookie-based auth, no leaks.
- **Client Components**: `components/landing/`, `app/(public)/chat/` (118 .tsx files) – Dynamic rendering (chat messages, queries).
- **Config/Utils**: `lib/config/webhooks.ts`, `lib/env.ts` – Secrets, timeouts; `lib/formatters.ts` for validation.
- **Other Routes**: `app/api/config/public`, `app/api/health`, `app/api/pricing/slots` – Public endpoints need CORS/rate limits.

## Key Files and Their Purposes
| File/Path | Purpose | Security Relevance | Priority |
|-----------|---------|--------------------|----------|
| `lib/actions/auth.ts` | Exports `signOut`, `getUser` for session management. | Core auth verification; audit session fixation, CSRF, incomplete sign-out. | Critical |
| `app/api/webhook/n8n/route.ts` | `POST` handler with `verifyAuth`. | Webhook secret checks (`getWebhookSecret`), replay/IDOR; HMAC validation. | Critical |
| `app/(auth)/layout.tsx` | `AuthLayout` component for auth pages. | Layout-level protections (headers, metadata); bypass risks. | High |
| `lib/services/webhookService.ts` | `WebhookService` class for orchestration. | Input deserialization, business logic vulns; 85% service pattern match. | High |
| `app/api/chat/route.ts` | `POST` for chat; `app/api/chat/status/route.ts` (`GET`). | Session IDs, message sanitization; XSS/injection in payloads. | High |
| `app/api/carol/query/route.ts`, `app/api/carol/actions/route.ts` | `POST` for AI queries/actions. | PII handling, injection in prompts; auth on user data. | High |
| `app/api/slots/route.ts`, `app/api/pricing/route.ts` | `GET` for slots/pricing. | Public data leaks, rate limiting needed. | Medium |
| `app/api/notifications/send/route.ts` | `POST` notifications. | Spam/abuse vectors; auth + rate limits. | Medium |
| `app/api/config/public/route.ts`, `app/api/health/route.ts` | `GET` public config/health. | Info disclosure; CORS hardening. | Medium |
| `lib/supabase/server.ts`, `lib/supabase/client.ts` | Server/client Supabase clients. | Cookie auth on server; no keys client-side. | Critical |
| `lib/supabase/middleware.ts` | `updateSession` middleware. | Global auth enforcement; coverage gaps. | Critical |
| `lib/config/webhooks.ts` | `getWebhookSecret`, `getWebhookTimeout`. | Env-based secrets; validation on load. | High |
| `lib/env.ts` | `validateEnv`. | Missing secrets lead to defaults/exposure. | High |

## Code Patterns and Conventions
- **API Handlers**: Named exports (`GET`, `POST`) in `route.ts`; e.g., `export const POST = async (...)`. Always prepend `getUser`/`verifyAuth`.
- **Auth Pattern**: `verifyAuth` (webhook) + Supabase `createClient({ cookies })`; mirror in all protected routes.
- **Service Layer**: Classes like `WebhookService` encapsulate logic; inject deps, validate inputs pre-call.
- **Sessions**: UUID-based (`generateSessionId`); tie to user ID to prevent takeover.
- **Validation**: Utils like `isValidEmail`/`isValidPhoneUS`; extend with Zod schemas for bodies.
- **No Tests**: `__tests__/` absent; recommend Vitest/Jest for auth/webhook mocks.
- **Exports**: 247 symbols, mostly TS/TSX; scan for unused (dead code injection risks).
- **Directives**: No `dangerouslySetInnerHTML` detected; enforce `textContent` for dynamic data.

## Best Practices Derived from Codebase
- **Auth Everywhere**: Use `getUser` from `lib/actions/auth.ts` or `verifyAuth` pattern before DB/API calls; fallback to middleware.
- **Server-Only Secrets**: `createClient` in `lib/supabase/server.ts` with `headers().get('cookies')`; client.ts browser-only.
- **Input Handling**: Sanitize with `lib/formatters.ts`; Zod for JSON bodies; `revalidatePath` post-mutation.
- **Webhook Security**: HMAC via `getWebhookSecret`, timeout `getWebhookTimeout`; add nonces/IP checks.
- **Env Loading**: `validateEnv` on init; `.env.local` gitignored; no `process.env` logs.
- **Headers/Middleware**: Secure cookies (`HttpOnly`, `Secure`); CSP in layouts; CORS origin whitelist.
- **Rate Limiting**: Absent; add Upstash/Upstash Redis for `/chat`, `/carol`, `/notifications`.
- **Logging**: Structure without PII; no `console.log(req.body)`.
- **Dependencies**: `npm audit`; pin in `package.json`; Snyk for Supabase/Next.js vulns.
- **RLS**: Assume Supabase RLS; verify policies block unauthorized selects/inserts.

## Workflows for Common Tasks

### 1. New/Existing API Route Audit
1. `readFile('app/api/[path]/route.ts')`; `analyzeSymbols(file)`.
2. Verify: Auth call (`getUser`/`verifyAuth`) first; input validation (Zod/body schema).
3. Check: IDOR (userId/sessionId match), SQLi (Supabase params), rate limit.
4. Tools: `searchCode('createClient|supabase.from', file)` for client misuse.
5. Test: Mock unauth req; recommend guard: `if (!user) return NextResponse.json({error: 'Unauthorized'}, {status: 401})`.
6. Report: CVSS + fix snippet.

### 2. Authentication & Middleware Review
1. `listFiles('lib/actions/auth*.ts', 'lib/supabase/middleware.ts', 'app/(auth)/*.tsx')`.
2. `analyzeSymbols('lib/actions/auth.ts')` – Confirm `signOut` clears all (cookies, Supabase).
3. `searchCode('updateSession|getUser|verifyAuth', 'app/api/')` – Coverage %.
4. Edge: Anon to protected (`app/(admin)/`), session expiry.
5. Recommend: Refresh tokens, CSRF tokens in forms.
6. Output: Auth matrix table (Route \| Auth Method \| Coverage).

### 3. Webhook Security Audit
1. `readFile('app/api/webhook/n8n/route.ts', 'lib/services/webhookService.ts')`.
2. Verify: `verifyAuth` + HMAC/timestamp; no full payload trust.
3. `searchCode('webhook|WebhookService', 'lib/')`; `getFileStructure('lib/services/')`.
4. Risks: Replay (add nonce DB check), DoS (timeout enforce).
5. Recommend: Idempotency keys, IP allowlist env var.
6. Test: Invalid secret → 401.

### 4. Supabase & DB Review
1. `getFileStructure('lib/supabase/')`; read `server.ts`/`client.ts`.
2. Confirm: Server uses cookies; client no keys.
3. `searchCode('supabase.from.*(select|insert|update)', 'app/')` – RLS bypasses.
4. Audit: Edge functions, storage buckets.
5. Recommend: Service Role sparingly; log queries.

### 5. Client-Side & XSS Audit
1. `listFiles('**/*.tsx')`; prioritize `components/chat/`, `app/(public)/`.
2. `searchCode('dangerouslySetInnerHTML|innerHTML|eval', '**/*.tsx')`.
3. Check: Props sanitization in chat messages/queries.
4. Recommend: `DOMPurify`, `textContent`; CSP `script-src 'self'`.

### 6. Full Codebase/Dependency Scan
1. `getFileStructure('.')`; `listFiles('package*.json')`.
2. `searchCode('process.env\.[A-Z]+|secret|key=|eval|exec', '**/*')`.
3. `analyzeSymbols('**/*.ts')` – Exported secrets/unused funcs.
4. Run: `npm audit`, `next lint`; Snyk scan.
5. Report: Sorted table by severity.

### 7. Dependency & Static Analysis
1. Focus: Supabase, Next.js, React deps.
2. Vulns: Known CVEs; update/patch paths.
3. Secrets: `git-secrets` scan history.

## Reporting and Hand-off
**Format**:
| Vulnerability | File | Severity (CVSS) | Description | Remediation | Status |
|---------------|------|-----------------|-------------|-------------|--------|
| Missing Auth | `app/api/chat/route.ts` | Critical (9.1) | No `getUser` | Add `const user = await getUser(); if (!user) return 401;` | Open |

- **Priorities**: Critical (auth bypass/injection), High (misconfig/XSS), Medium (best practices).
- **Hand-off**: "Fixed: 5/10 vulns. PR #123. Re-scan post-merge. Risks: Webhook replay."
- Update `docs/security.md`.

## Repository Starting Points & Tools Usage
- **Root**: `app/` (API/routes), `lib/` (core), `components/` (UI).
- **Tools Sequence**: `getFileStructure('.')` → `listFiles('app/api/**/*.ts')` → `readFile(top risks)` → `searchCode(patterns)` → `analyzeSymbols()`.
- **Resources**: `docs/security.md`, `AGENTS.md`. Confirm RLS with maintainers.

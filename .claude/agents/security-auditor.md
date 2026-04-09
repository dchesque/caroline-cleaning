# Security Auditor Agent Playbook

## Mission
Engage the Security Auditor Agent to proactively identify and mitigate security vulnerabilities in the Caroline Cleaning Next.js application, with a focus on OWASP Top 10 risks (e.g., Broken Access Control, Injection, Security Misconfiguration), dependency vulnerabilities via scanning, and adherence to the principle of least privilege. Activate this agent during code reviews, PR submissions, dependency updates, deployments, or when introducing new API routes, auth changes, or Supabase queries. The agent supports the development team by delivering prioritized vulnerability reports with CVSS v4 scores, remediation code snippets, test cases, and verification steps, ensuring robust protection for user data, financial endpoints, and AI-driven features like Carol chat.

## Responsibilities
- Scan all API routes (`app/api/**/*`) for authentication gaps, input validation failures, and IDOR vulnerabilities using `listFiles('app/api/**/*.ts')` and `searchCode('GET|POST|getUser|verifyAuth', 'app/api/**')`.
- Audit Supabase integrations for RLS enforcement, anon key exposure, and server-only client usage across services and controllers.
- Perform dependency scans with `npm audit` simulation via `readFile('package.json', 'package-lock.json')`; flag vulnerable packages and propose pinned updates.
- Review webhook handlers (`app/api/webhook/n8n/route.ts`, `lib/services/webhookService.ts`) for HMAC verification, replay protection, and rate limiting.
- Enforce least privilege by validating user-scoped queries (e.g., `.eq('user_id', user.id)`) in financial (`app/api/financeiro/**`) and profile endpoints.
- Inspect client components (`components/landing`, `components/agenda/appointment-form`) for XSS/CSRF risks and unsanitized API data rendering.
- Generate remediation diffs, Vitest test mocks, and re-scan workflows; maintain an audit log in `SECURITY.md`.
- Prioritize issues: Critical (auth bypasses, injections), High (misconfigs), Medium (logging gaps, deps).

## Best Practices
- Always prefix audits with `getFileStructure('.')` and `analyzeSymbols('app/api/**/*.ts', 'lib/services/**/*.ts')` to map exported handlers (50+ GET/POST) and service classes.
- Enforce auth guards: `const user = await getUser(request); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });` on all non-public routes.
- Validate inputs with Zod schemas: `const schema = z.object({ ... }); const data = schema.parse(await request.json());` before Supabase/service calls.
- Implement least privilege: Append `.eq('user_id', user.id)` to all DB queries; audit RLS policies via Supabase dashboard simulation.
- Secure webhooks: Verify HMAC (`crypto.createHmac`), timestamps (`Date.now() - ts < 300000`), and idempotency (`db.upsert` with unique keys).
- Add rate limiting middleware for high-risk paths (`/chat`, `/carol/*`, `/webhook/*`) using Upstash Redis.
- Scan for secrets: `searchCode('process\\.env|SUPABASE|key|secret', '**/*')`; ensure `.env` gitignore and server-only access.
- Set secure headers: HSTS, CSP (`'self' https://supabase.co`), cookies (`HttpOnly; Secure; SameSite=Strict`).
- Dependency hygiene: Pin versions in `package-lock.json`; integrate `npm audit --audit-level high`; use Snyk for OWASP deps.
- Log structured errors without PII; integrate Sentry for monitoring.
- Verify fixes with Vitest: Mock `getUser` to return null → expect 401; fuzz inputs for injections.

## Key Project Resources
- [Documentation Index](../docs/README.md)
- [Agent Handbook](./AGENTS.md)
- [Main README](README.md)
- [Contributor Guide](../../AGENTS.md)

## Repository Starting Points
- `app/api/`: Core API routes (50+ handlers); prioritize `webhook/n8n`, `chat`, `carol/*`, `financeiro/*`, `profile/*` for access control and injection risks.
- `lib/services/`: Business logic services (`chat-logger.ts`, `webhookService.ts`); audit for passthrough vulns and least privilege.
- `lib/actions/`: Auth utilities (`auth.ts`); central point for session management and verification.
- `lib/ai/`: AI state machine handlers; review for prompt injection in chat flows.
- `components/`: Client-side UI (`landing`, `agenda/appointment-form`); check XSS/CSRF in forms and dynamic content.
- `app/(auth)/`: Auth layouts; validate protection bypasses.

## Key Files
- `lib/actions/auth.ts`: Exports `signOut`, `getUser`; audit session fixation, CSRF, cookie security.
- `app/api/webhook/n8n/route.ts`: POST handler with `verifyAuth`; check HMAC, replay, DoS protections.
- `lib/services/webhookService.ts`: `WebhookService` class; validate input deserialization and idempotency.
- `lib/services/chat-logger.ts`: Exports `HandlerRecord`, `ErrorRecord`, `LogInteractionParams`; review PII logging gaps.
- `app/api/chat/route.ts`: POST/GET chat; audit prompt injection, rate limits.
- `app/api/carol/query/route.ts`, `app/api/carol/actions/route.ts`: AI endpoints; check jailbreaks, PII leaks.
- `app/api/financeiro/categorias/route.ts`, `app/api/financeiro/categorias/[id]/route.ts`: Financial ops; IDOR on dynamic IDs.
- `app/api/profile/route.ts`: GET/PUT profile; enforce user-owned data access.
- `app/(auth)/layout.tsx`: `AuthLayout`; metadata leaks, CSP enforcement.
- `package.json`, `next.config.js`: Deps and configs; OWASP misconfig, vuln scans.

## Architecture Context
- **Config**: `.` (root configs like `next.config.js`); 0 key exports; audit CORS, headers, env validation.
- **Services**: `lib/services`, `components/landing`, `components/agenda/appointment-form`; 6 key exports (e.g., `HandlerRecord`, `LogEntry`); business logic with service layer pattern (85% confidence).
- **Controllers**: `app/api/*` (50+ dirs), `lib/ai/state-machine/handlers`; 20+ key exports (e.g., `GET /slots`, `POST /chat`, `registerAllHandlers`); request handlers lacking uniform auth/validation.

## Key Symbols for This Agent
- `signOut`, `getUser` (auth ops) @ [lib/actions/auth.ts](lib/actions/auth.ts)
- `verifyAuth` (webhook auth) @ [app/api/webhook/n8n/route.ts](app/api/webhook/n8n/route.ts)
- `WebhookService` (service class) @ [lib/services/webhookService.ts](lib/services/webhookService.ts)
- `HandlerRecord`, `ErrorRecord`, `LogInteractionParams`, `SessionSummary`, `LogEntry`, `LogQueryParams` (logging types) @ [lib/services/chat-logger.ts](lib/services/chat-logger.ts)
- `GET`, `POST` handlers (50+ across API routes, e.g., `/chat`, `/profile`, `/carol/query`) @ [app/api/**/route.ts](app/api/)
- `registerAllHandlers` (AI orchestration) @ [lib/ai/state-machine/handlers/index.ts](lib/ai/state-machine/handlers/index.ts)
- `AuthLayout` (protected layout) @ [app/(auth)/layout.tsx](app/(auth)/layout.tsx)

## Documentation Touchpoints
- [Main Documentation](../docs/README.md): App architecture, Supabase setup.
- [AGENTS.md](./AGENTS.md): Agent collaboration guidelines.
- [README.md](README.md): Deployment, env vars, Supabase RLS policies.
- [SECURITY.md] (create if missing): Audit logs, OWASP compliance status.
- Supabase Dashboard (external): RLS policy verification for tables like `categorias`, `chat_logs`.

## Collaboration Checklist
1. [ ] Confirm assumptions: Run `getFileStructure('.')`, `listFiles('app/api/**/*.ts')`, share output with team.
2. [ ] Scan deps: `readFile('package.json')`; report `npm audit` high/critical vulns.
3. [ ] Prioritize routes: Risk-sort (webhook > financeiro/[id] > chat/carol); `searchCode('getUser|createClient', 'app/api/')`.
4. [ ] Propose fixes: Generate code diffs, Zod schemas, test mocks; post as PR comments.
5. [ ] Review PRs: Block merges on Critical/High vulns; verify auth/RLS in diffs.
6. [ ] Update docs: Append to `SECURITY.md`; link remediations.
7. [ ] Capture learnings: Log false positives, new patterns in agent handbook.
8. [ ] Re-scan: Post-fix `analyzeSymbols` on changed files; confirm CVSS drop.
9. [ ] Hand-off: Tag next agent (e.g., tester) with remaining Medium risks.

## Hand-off Notes
Upon completion, summarize in a table: vulnerability ID, status (Fixed/Open), CVSS delta. Highlight remaining risks (e.g., "Medium dep vulns pending Snyk; rate limits unimplemented on /chat"). Suggest follow-ups: "Engage tester for Vitest coverage >80%; schedule quarterly full scans. Update `SECURITY.md` with audit timestamp and compliance score."

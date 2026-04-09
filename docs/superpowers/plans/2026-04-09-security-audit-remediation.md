# Security Audit Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the validated critical/high severity vulnerabilities found in `SECURITY_AUDIT_REPORT.md`, correcting the audit's schema mistakes along the way.

**Architecture:** Mostly database RLS migrations plus targeted Next.js API route hardening. No structural changes. Each fix is isolated and independently deployable, so tasks are ordered by severity, not coupling.

**Tech Stack:** Next.js 15 App Router, Supabase (Postgres + RLS), TypeScript, zod (to be added).

---

## IMPORTANT — Audit Report Corrections

Before touching anything, the executing engineer must know the audit report is partially wrong. I verified its claims against the actual repo (2026-04-09). Do **not** blindly apply the SQL/code snippets from `SECURITY_AUDIT_REPORT.md` — several would fail or cause data loss.

### Errors found in SECURITY_AUDIT_REPORT.md

1. **`.env` is NOT in git history.** `git log --all --full-history -- .env` returns empty. `git log --all -S "sk-or-v1-daae9e6d" --oneline` returns empty. The secrets were never committed. **Skip the BFG/force-push step entirely** — it is destructive and unnecessary. The `seu-segredo-aqui` string visible in git is from `.env.example` (line 33 of that file), which is a placeholder, not a real secret. Only rotate keys if you have independent evidence they leaked (shared in a screenshot, pasted in a ticket, etc.).

2. **`configuracoes` column name is `chave`, not `key`.** See `supabase/migrations/01_phase5_tables.sql:41` (originally `id + settings jsonb`) and `supabase/migrations/08_fix_config_access_and_schema.sql:30` which uses `ON CONFLICT (chave)`. The audit's proposed fix `WHERE key IN (...)` would error at runtime. Use `chave` everywhere.

3. **`chat_sessions` is not tied to auth users.** Per `supabase/migrations/02_phase6_carol_integration.sql:2`, `chat_sessions.id` is `VARCHAR(100)` and the only FK is `cliente_id UUID REFERENCES clientes(id)`. There is **no `user_id` column**. Landing-page chats are anonymous, handled by service_role. The audit's `WHERE user_id = auth.uid()` will fail. Correct approach: **only admins** (authenticated + `user_profiles.role = 'admin'`) can read chat; service_role writes. Drop the "users can read own session" policy idea — there are no end-user chat sessions to own.

4. **`mensagens_chat` likely uses `session_id` not `chat_session_id`.** Verify with `\d mensagens_chat` before writing the policy (Task 2, Step 1).

5. **`user_profiles.role` default is `'admin'`** (see `06_user_profiles.sql:6`). Any seed/trigger-created profile is already admin, which means the `role = 'admin'` check is currently a no-op for all rows. Task 2 must include tightening the default OR verifying existing profiles are intentional admins before shipping the RLS fix, otherwise the fix gives nothing.

6. **CRON_SECRET placeholder is confirmed present** in `.env` (1 match for `seu-segredo-aqui`). This one is real — fix it.

7. **Password validation at 8 chars, no complexity** — confirmed at `app/api/profile/password/route.ts:21`.

8. **`getClientIp` trusts `x-forwarded-for` blindly** — confirmed at `lib/rate-limit.ts:69-75`.

9. **Rate-limit API shape differs from audit.** The audit uses `rateLimit('admin-api', 30, 60, ip)`. Actual API is `checkRateLimit(ip, config)` with config objects in `RATE_LIMITS` (see `lib/rate-limit.ts:32-64`). Use the real API.

---

## File Structure

### Files to create
- `supabase/migrations/19_fix_chat_rls.sql` — replaces permissive `USING (true)` chat policies
- `supabase/migrations/20_fix_tracking_events_rls.sql` — blocks anon inserts
- `supabase/migrations/21_fix_configuracoes_rls.sql` — scoped anon read, uses `chave`
- `lib/validation/schemas.ts` — centralized zod schemas for API payloads
- `lib/security/password.ts` — `validatePassword()` helper (reused across endpoints)

### Files to modify
- `.env` — rotate `CRON_SECRET` only (leave Supabase/OpenRouter unless evidence of leak)
- `.env.example` — update placeholder comment to make it obvious it must be replaced
- `lib/rate-limit.ts` — harden `getClientIp()` with trusted-proxy logic, add `admin` config
- `app/api/profile/password/route.ts` — use `validatePassword()`
- `app/api/chat/route.ts` — add zod validation + size limit
- `app/api/contact/route.ts` — add zod validation (already uses `request.json()`)
- `app/api/carol/query/route.ts` — add zod validation
- `app/api/carol/actions/route.ts` — add zod validation
- `app/api/admin/chat-logs/route.ts` — add rate limiting
- `middleware.ts` — add security headers (HSTS, X-Frame-Options, etc.)

### Files NOT to touch
- Git history (see Correction #1)
- `supabase/migrations/04_chat_rls_policies.sql` — never edit applied migrations; add a new one
- `supabase/migrations/07_tracking_events.sql` — same
- `supabase/migrations/08_fix_config_access_and_schema.sql` — same

---

## Task 0: Pre-flight — verify audit corrections on your machine

**Files:** none

- [ ] **Step 1:** Confirm `.env` is not committed

Run: `git log --all --full-history -- .env && git log --all -S "sk-or-v1-daae9e6d" --oneline`
Expected: both commands produce empty output. If either returns a commit, STOP and escalate — the plan's secret-rotation scope changes.

- [ ] **Step 2:** Confirm CRON_SECRET placeholder in `.env`

Run: `grep -n "seu-segredo-aqui" .env`
Expected: one match on the `CRON_SECRET=` line.

- [ ] **Step 3:** Inspect live DB schema for chat tables

Run against Supabase (SQL editor or `supabase db remote`):
```sql
\d chat_sessions
\d mensagens_chat
```
Write down the actual FK column name in `mensagens_chat` (expected: `session_id`). This column name will be used in Task 2.

- [ ] **Step 4:** Check how many admins exist

```sql
SELECT id, role FROM public.user_profiles;
```
If every row is `role='admin'` and there are non-admin staff in `auth.users` without profiles, the RLS fix in Task 2 is safe as-is. If there are mixed roles, verify no legitimate non-admin currently depends on chat access before proceeding.

---

## Task 1: Rotate CRON_SECRET

**Files:**
- Modify: `.env` (line with `CRON_SECRET=`)
- Modify: production env (Vercel/Railway dashboard)

- [ ] **Step 1:** Generate a strong secret

Run: `openssl rand -base64 48`
Copy the output.

- [ ] **Step 2:** Update local `.env`

Replace `CRON_SECRET=seu-segredo-aqui` with `CRON_SECRET=<generated_value>`. Do not commit.

- [ ] **Step 3:** Update production env var

In the deployment platform dashboard, set `CRON_SECRET` to the same value. Redeploy.

- [ ] **Step 4:** Verify old value is rejected

Run against production:
```bash
curl -i -H "Authorization: Bearer seu-segredo-aqui" \
  https://<prod-host>/api/cron/reminders
```
Expected: 401. If it returns 200, deployment hasn't picked up the new env var yet.

- [ ] **Step 5:** Verify new value works

```bash
curl -i -H "Authorization: Bearer <new_value>" \
  https://<prod-host>/api/cron/reminders
```
Expected: 200 (or the endpoint's normal response).

No commit — `.env` is gitignored.

---

## Task 2: Fix chat RLS policies (CRITICAL)

**Files:**
- Create: `supabase/migrations/19_fix_chat_rls.sql`

- [ ] **Step 1:** Write the migration

```sql
-- 19_fix_chat_rls.sql
-- Replaces overly permissive chat RLS policies that let ANY authenticated
-- user read all chat data. Chat sessions are anonymous (no user_id), so
-- only admins and the service role may read them.

BEGIN;

DROP POLICY IF EXISTS "Admins can read all messages" ON public.mensagens_chat;
DROP POLICY IF EXISTS "Admins can read all sessions" ON public.chat_sessions;

CREATE POLICY "Admins can read all messages" ON public.mensagens_chat
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can read all sessions" ON public.chat_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

COMMIT;
```

(Note: landing-page writes continue to work because they go through the `Service role can insert messages` and `Service role can manage sessions` policies defined in `04_chat_rls_policies.sql`, which are unchanged.)

- [ ] **Step 2:** Apply the migration

Run: `supabase db push` (or `supabase migration up` depending on project convention).

- [ ] **Step 3:** Verify the fix

```sql
-- Should show both policies with non-trivial USING clauses
SELECT policyname, qual FROM pg_policies
WHERE tablename IN ('mensagens_chat', 'chat_sessions')
  AND policyname LIKE 'Admins%';
```
Expected: `qual` column contains the `EXISTS (SELECT 1 FROM user_profiles ...)` clause, not `true`.

- [ ] **Step 4:** End-to-end test — non-admin cannot read

Create a test user without a row in `user_profiles` (or with `role='staff'`), log in as them in a browser/REST client, then:
```bash
curl 'https://<project>.supabase.co/rest/v1/mensagens_chat?select=*&limit=1' \
  -H "apikey: $ANON" -H "Authorization: Bearer $USER_JWT"
```
Expected: `[]`.

- [ ] **Step 5:** End-to-end test — admin can read

Same call with an admin user's JWT. Expected: rows returned.

- [ ] **Step 6:** Smoke-test the landing-page chat still works

Open the landing page in an incognito window and send a message. Expected: reply arrives, row appears in `mensagens_chat` when queried as admin.

- [ ] **Step 7:** Commit

```bash
git add supabase/migrations/19_fix_chat_rls.sql
git commit -m "fix(rls): restrict chat read access to admins only"
```

---

## Task 3: Fix tracking_events RLS (CRITICAL)

**Files:**
- Create: `supabase/migrations/20_fix_tracking_events_rls.sql`

- [ ] **Step 1:** Identify the real server-side insertion path

Before locking down, grep for callers that currently insert into `tracking_events`:
```
Grep pattern: tracking_events
```
Confirm insertions happen from API routes using the service-role client (not from the browser directly). If the browser inserts directly via anon key, the migration below will break analytics — escalate and add a `/api/tracking/event` proxy route first.

- [ ] **Step 2:** Write the migration

```sql
-- 20_fix_tracking_events_rls.sql
-- Remove open-to-world INSERT on tracking_events. Writes go through
-- a backend route using the service role, which bypasses RLS anyway.

BEGIN;

DROP POLICY IF EXISTS "Anyone can insert tracking events" ON public.tracking_events;

-- service_role bypasses RLS, but declare explicitly for clarity/audit:
CREATE POLICY "Service role can insert tracking events" ON public.tracking_events
  FOR INSERT
  TO service_role
  WITH CHECK (true);

COMMIT;
```

- [ ] **Step 3:** Apply and verify

```bash
supabase db push
```
```bash
# Anonymous insert must now fail
curl -i -X POST 'https://<project>.supabase.co/rest/v1/tracking_events' \
  -H "apikey: $ANON" -H "Content-Type: application/json" \
  -d '{"event_name":"test"}'
```
Expected: 401/403.

- [ ] **Step 4:** Smoke-test a real tracked action on the site (e.g. form submit, page view)

Confirm a new row still appears in `tracking_events` via admin query. If not, Step 1's assumption was wrong — revert or add a proxy route.

- [ ] **Step 5:** Commit

```bash
git add supabase/migrations/20_fix_tracking_events_rls.sql
git commit -m "fix(rls): remove anonymous insert on tracking_events"
```

---

## Task 4: Fix configuracoes RLS (CRITICAL)

**Files:**
- Create: `supabase/migrations/21_fix_configuracoes_rls.sql`

- [ ] **Step 1:** Inspect the actual schema

```sql
\d public.configuracoes
```
Confirm the column name used for config keys. Based on `08_fix_config_access_and_schema.sql:30` it is **`chave`** (not `key`). If your DB shows something else, update the migration below accordingly.

- [ ] **Step 2:** List every `chave` the public landing page actually needs

```sql
SELECT DISTINCT chave FROM public.configuracoes ORDER BY chave;
```
Cross-reference against `components/landing/**` and `app/page.tsx` usages of configs. Build a concrete allow-list (likely: business name/phone/email/hours, service areas, pricing copy from migration 08). **Do not** allow-list anything that looks like a token, pixel id, webhook URL, or API credential.

- [ ] **Step 3:** Write the migration

```sql
-- 21_fix_configuracoes_rls.sql
-- Previous policy allowed anon SELECT on all rows, exposing integration
-- tokens / pixel ids / internal settings. Scope anon reads to a safe
-- allow-list of public marketing keys.

BEGIN;

DROP POLICY IF EXISTS "Public read settings" ON public.configuracoes;

CREATE POLICY "Admins can read all configuracoes" ON public.configuracoes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Anon read public marketing configuracoes" ON public.configuracoes
  FOR SELECT
  TO anon
  USING (
    chave IN (
      -- Fill in from Step 2. Example:
      'business_name',
      'business_phone',
      'business_email',
      'business_hours',
      'service_areas',
      'pricing_title',
      'pricing_subtitle',
      'pricing_format',
      'pricing_cta_text',
      'pricing_cta_subtext'
    )
  );

COMMIT;
```

- [ ] **Step 4:** Apply and verify sensitive keys are hidden

```bash
supabase db push
```
```bash
curl -s "https://<project>.supabase.co/rest/v1/configuracoes?select=chave&chave=like.*pixel*" \
  -H "apikey: $ANON"
```
Expected: `[]`.

- [ ] **Step 5:** Verify landing page still renders

Load the production landing page in incognito. Business name, phone, hours, pricing copy must all render. If any config is missing, add its `chave` to the allow-list in a follow-up migration.

- [ ] **Step 6:** Commit

```bash
git add supabase/migrations/21_fix_configuracoes_rls.sql
git commit -m "fix(rls): scope anon read on configuracoes to marketing keys"
```

---

## Task 5: Strong password validation

**Files:**
- Create: `lib/security/password.ts`
- Modify: `app/api/profile/password/route.ts`

- [ ] **Step 1:** Create the helper

```ts
// lib/security/password.ts
export type PasswordValidationResult =
  | { valid: true }
  | { valid: false; error: string };

export function validatePassword(password: string): PasswordValidationResult {
  if (typeof password !== 'string') {
    return { valid: false, error: 'Password must be a string' };
  }
  if (password.length < 12) {
    return { valid: false, error: 'Password must be at least 12 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain an uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain a lowercase letter' };
  }
  if (!/\d/.test(password)) {
    return { valid: false, error: 'Password must contain a number' };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain a special character' };
  }
  if (/(.)\1{3,}/.test(password)) {
    return { valid: false, error: 'Password cannot contain 4+ repeating characters' };
  }
  return { valid: true };
}
```

- [ ] **Step 2:** Wire it into the password-change route

Replace lines 20-26 of `app/api/profile/password/route.ts` with:
```ts
const check = validatePassword(newPassword);
if (!check.valid) {
  return NextResponse.json({ error: check.error }, { status: 400 });
}
```
Add `import { validatePassword } from '@/lib/security/password'` at the top.

- [ ] **Step 3:** Manual verification

```bash
# Weak password rejected
curl -i -X PUT http://localhost:3000/api/profile/password \
  -H "Cookie: <admin session>" -H "Content-Type: application/json" \
  -d '{"currentPassword":"<real>","newPassword":"short1A!"}'
```
Expected: 400, error mentions "12 characters".

```bash
# Strong password accepted
curl -i -X PUT http://localhost:3000/api/profile/password \
  -H "Cookie: <admin session>" -H "Content-Type: application/json" \
  -d '{"currentPassword":"<real>","newPassword":"CorrectHorseBattery1!"}'
```
Expected: 200.

- [ ] **Step 4:** Commit

```bash
git add lib/security/password.ts app/api/profile/password/route.ts
git commit -m "fix(auth): enforce strong password policy on change endpoint"
```

---

## Task 6: Harden `getClientIp` against spoofing

**Files:**
- Modify: `lib/rate-limit.ts:69-75`

- [ ] **Step 1:** Replace `getClientIp`

```ts
// lib/rate-limit.ts
export function getClientIp(request: Request): string {
  // Cloudflare sets this and is trusted end-to-end
  const cf = request.headers.get('cf-connecting-ip');
  if (cf) return cf;

  // On Vercel, x-real-ip is set by the platform and trustworthy.
  // Off Vercel, x-real-ip and x-forwarded-for are client-controlled
  // and cannot be trusted for rate-limiting.
  if (process.env.VERCEL === '1') {
    const real = request.headers.get('x-real-ip');
    if (real) return real;
    const xff = request.headers.get('x-forwarded-for');
    if (xff) return xff.split(',')[0]?.trim() || 'unknown';
  }

  return 'unknown';
}
```

- [ ] **Step 2:** Type-check

Run: `npx tsc --noEmit` (or project's equivalent).
Expected: no new errors.

- [ ] **Step 3:** Local smoke test

Hit a rate-limited endpoint (e.g. `/api/contact`) locally 6+ times within 10 minutes with a bad payload. Outside Vercel, `getClientIp` returns `'unknown'` for everyone, which is fine locally but means a single bucket is shared — document this in a code comment so it's not a surprise later.

- [ ] **Step 4:** Commit

```bash
git add lib/rate-limit.ts
git commit -m "fix(rate-limit): stop trusting client-set x-forwarded-for"
```

---

## Task 7: Add zod validation to API endpoints

**Files:**
- Create: `lib/validation/schemas.ts`
- Modify: `app/api/chat/route.ts`
- Modify: `app/api/contact/route.ts`
- Modify: `app/api/carol/query/route.ts`
- Modify: `app/api/carol/actions/route.ts`

- [ ] **Step 1:** Install zod

Run: `npm install zod`
Expected: adds `zod` to `package.json` dependencies.

- [ ] **Step 2:** Create centralized schemas

```ts
// lib/validation/schemas.ts
import { z } from 'zod';

export const ChatRequestSchema = z.object({
  message: z.string().min(1).max(4000),
  sessionId: z.string().min(1).max(100).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const ContactRequestSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(200),
  phone: z.string().regex(/^\+?[\d\s\-()]{10,}$/).max(30),
  message: z.string().min(10).max(2000),
});

// Read the actual callers before finalizing these two:
export const CarolQuerySchema = z.object({
  // TODO(Task 7.5): fill in from app/api/carol/query/route.ts usage
}).passthrough();

export const CarolActionsSchema = z.object({
  // TODO(Task 7.5): fill in from app/api/carol/actions/route.ts usage
}).passthrough();

export async function parseJson<T>(
  request: Request,
  schema: z.ZodSchema<T>,
  maxBytes = 10_000,
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  const ct = request.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) {
    return { ok: false, status: 415, error: 'Content-Type must be application/json' };
  }
  const text = await request.text();
  if (text.length > maxBytes) {
    return { ok: false, status: 413, error: 'Request body too large' };
  }
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return { ok: false, status: 400, error: 'Invalid JSON' };
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    return { ok: false, status: 400, error: 'Invalid request shape' };
  }
  return { ok: true, data: result.data };
}
```

- [ ] **Step 3:** Wire `ChatRequestSchema` into `app/api/chat/route.ts`

Replace the `const body = await request.json()` block with:
```ts
import { ChatRequestSchema, parseJson } from '@/lib/validation/schemas';

const parsed = await parseJson(request, ChatRequestSchema);
if (!parsed.ok) {
  return NextResponse.json({ error: parsed.error }, { status: parsed.status });
}
const { message, sessionId } = parsed.data;
```

- [ ] **Step 4:** Wire `ContactRequestSchema` into `app/api/contact/route.ts`

Same pattern, using `ContactRequestSchema`.

- [ ] **Step 5:** Read `app/api/carol/query/route.ts` and `app/api/carol/actions/route.ts`

Before editing, read both files end-to-end and list every field the handler reads from the JSON body. Update the `CarolQuerySchema` and `CarolActionsSchema` TODOs with real `z.*` definitions. Then wire them in with `parseJson` the same way.

- [ ] **Step 6:** Manual verification

For each endpoint:
```bash
# Malformed body rejected
curl -i -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" -d '{}'
# Expected: 400

# Wrong content-type rejected
curl -i -X POST http://localhost:3000/api/chat \
  -H "Content-Type: text/plain" -d 'hello'
# Expected: 415

# Oversized body rejected
curl -i -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"$(printf 'a%.0s' {1..11000})\"}"
# Expected: 413

# Valid body works
curl -i -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" -d '{"message":"hi"}'
# Expected: 200
```

- [ ] **Step 7:** Commit

```bash
git add package.json package-lock.json lib/validation/schemas.ts \
  app/api/chat/route.ts app/api/contact/route.ts \
  app/api/carol/query/route.ts app/api/carol/actions/route.ts
git commit -m "feat(api): zod-validate request bodies on public API routes"
```

---

## Task 8: Rate-limit admin endpoints

**Files:**
- Modify: `lib/rate-limit.ts` (add config entry)
- Modify: `app/api/admin/chat-logs/route.ts`

- [ ] **Step 1:** Add an `admin` rate-limit config

In `lib/rate-limit.ts` under `RATE_LIMITS`:
```ts
admin: { prefix: 'admin', limit: 60, windowMs: 60_000 } as RateLimitConfig,
```

- [ ] **Step 2:** Apply it in the chat-logs route

At the top of the GET handler in `app/api/admin/chat-logs/route.ts`:
```ts
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';

const ip = getClientIp(request);
if (!checkRateLimit(ip, RATE_LIMITS.admin)) {
  return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
}
```
(Keep this **after** the auth check, so unauthenticated spam hits 401 before consuming a rate-limit slot.)

- [ ] **Step 3:** Manual verification

```bash
for i in $(seq 1 70); do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -H "Cookie: <admin session>" http://localhost:3000/api/admin/chat-logs
done | sort | uniq -c
```
Expected: ~60 `200`s then `429`s.

- [ ] **Step 4:** Commit

```bash
git add lib/rate-limit.ts app/api/admin/chat-logs/route.ts
git commit -m "feat(api): rate-limit admin chat-logs endpoint"
```

---

## Task 9: Security headers in middleware

**Files:**
- Modify: `middleware.ts`

- [ ] **Step 1:** Read current middleware

Use Read on `middleware.ts` before editing — don't blindly append.

- [ ] **Step 2:** Add headers to the returned response

After the existing response is constructed but before it's returned, add:
```ts
res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
res.headers.set('X-Content-Type-Options', 'nosniff');
res.headers.set('X-Frame-Options', 'DENY');
res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
```
(Skip `X-XSS-Protection` — it's deprecated and can introduce vulnerabilities on older browsers.)

- [ ] **Step 3:** Verify in browser devtools / curl

```bash
curl -sI http://localhost:3000/ | grep -iE "strict-transport|x-frame|x-content-type|referrer-policy|permissions-policy"
```
Expected: all five present.

- [ ] **Step 4:** Commit

```bash
git add middleware.ts
git commit -m "feat(security): add baseline security response headers"
```

---

## Deferred (out of scope for this plan)

These items from the audit report are intentionally skipped here. Track in a follow-up plan if they matter:

- **Replacing 40+ `console.error` calls** with structured `logger.error` (LOW, stylistic).
- **Explicit CORS config** — Next.js already defaults to same-origin for API routes; only needed if we expose a cross-origin API.
- **Session timeout / device tracking** — Supabase auth already expires JWTs; a custom layer needs a real threat model before building.
- **DOMPurify on contact form** — the form output is stored, not rendered as HTML; zod length limits in Task 7 cover the injection surface. Revisit if we ever render message bodies as HTML.
- **BFG / git history rewrite** — not needed (see Correction #1).
- **Supabase / OpenRouter key rotation** — only rotate if there's evidence of leakage. Rotating for its own sake burns service credits and risks a botched cutover. The user should confirm.

---

## Execution order & checkpoints

Run tasks in this order, stopping for human review after each group:

1. **Group A — Zero-risk cleanup:** Task 0 (verification) → Task 1 (CRON_SECRET).  
   *Checkpoint:* confirm cron endpoints still respond in prod.
2. **Group B — Database RLS:** Tasks 2, 3, 4 (each with its own smoke test).  
   *Checkpoint:* landing page, chat, and admin dashboard all still work.
3. **Group C — App-level hardening:** Tasks 5, 6, 7, 8, 9.  
   *Checkpoint:* run `npx tsc --noEmit` and the app's existing test suite.

Do **not** batch all nine into a single PR. One PR per task (or per group at most) — RLS bugs are silent until someone loses access, so small reverts matter.

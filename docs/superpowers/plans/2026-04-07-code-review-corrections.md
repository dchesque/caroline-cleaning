# Code Review Corrections Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 15 Critical, 32 Important, and select Minor issues found in the comprehensive code review of the Caroline Cleaning app.

**Architecture:** Fixes are organized into 6 phases ordered by severity and dependency. Each phase is a self-contained necessity that can be deployed independently. Phases 1-3 are blockers for production. Phases 4-6 are hardening and quality improvements.

**Tech Stack:** Next.js 14 (App Router), Supabase (SSR + Admin), TypeScript, OpenRouter LLM, Twilio, Meta CAPI

---

## Phase 1: Security — Credential Exposure & Data Leaks

> **Necessity:** Credentials and internal data are exposed to the public internet RIGHT NOW. These must be fixed before anything else.

### Task 1.1: Fix tracking config endpoint leaking Meta access token

**Files:**
- Modify: `app/api/tracking/config/route.ts`

- [ ] **Step 1: Add sensitive key filter**

Add a blocklist of keys that must never be returned publicly:

```typescript
// Add after imports
const SENSITIVE_KEY_PATTERNS = [
  'access_token',
  'secret',
  'api_key',
  'service_role',
  'private',
];

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return SENSITIVE_KEY_PATTERNS.some(pattern => lower.includes(pattern));
}
```

- [ ] **Step 2: Filter response data**

In the GET handler, filter out sensitive keys before returning:

```typescript
const safeData = (data || []).filter(
  (item: { chave: string }) => !isSensitiveKey(item.chave)
);
return NextResponse.json({ success: true, data: safeData });
```

- [ ] **Step 3: Verify by checking response doesn't contain tokens**

Run: `curl http://localhost:3000/api/tracking/config | jq '.data[].chave'`
Expected: No keys containing `access_token`, `secret`, etc.

- [ ] **Step 4: Commit**

```bash
git add app/api/tracking/config/route.ts
git commit -m "fix(security): filter sensitive keys from tracking config endpoint"
```

---

### Task 1.2: Remove Meta API response from tracking event endpoint

**Files:**
- Modify: `app/api/tracking/event/route.ts`

- [ ] **Step 1: Remove meta_response from success response (around line 212-217)**

Change the success response to only return boolean status:

```typescript
return NextResponse.json({
  success: true,
  event_id,
  meta_sent: metaSent,
});
```

- [ ] **Step 2: Commit**

```bash
git add app/api/tracking/event/route.ts
git commit -m "fix(security): remove Meta API response from tracking event endpoint"
```

---

### Task 1.3: Remove error details from carol/actions responses

**Files:**
- Modify: `app/api/carol/actions/route.ts`

- [ ] **Step 1: Find all error responses that leak details**

Search for `details: error` in the file. These appear at lines 163 and 269 (2 occurrences only).

- [ ] **Step 2: Replace each occurrence**

Change every instance of:
```typescript
return { status: 'error', message: error.message, details: error }
```
To:
```typescript
return { status: 'error', message: 'Internal error processing request' }
```

The full error is already logged server-side via `console.error` above each return.

- [ ] **Step 3: Commit**

```bash
git add app/api/carol/actions/route.ts
git commit -m "fix(security): remove internal error details from carol actions responses"
```

---

### Task 1.4: Remove raw Twilio error objects from responses

**Files:**
- Modify: `lib/twilio.ts`

- [ ] **Step 1: Sanitize error return (around line 32)**

Change:
```typescript
return { success: false, error };
```
To:
```typescript
return { success: false, error: error instanceof Error ? error.message : 'SMS send failed' };
```

- [ ] **Step 2: Commit**

```bash
git add lib/twilio.ts
git commit -m "fix(security): sanitize Twilio error objects before returning"
```

---

### Task 1.5: Sanitize cron error responses

**Files:**
- Modify: `app/api/cron/reminders/route.ts`
- Modify: `app/api/cron/recurrences/route.ts`

- [ ] **Step 1: Fix reminders error response (around line 119)**

Change:
```typescript
return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
```
To:
```typescript
console.error('[cron/reminders] Fatal error:', err);
return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
```

- [ ] **Step 2: Fix recurrences error response (around line 136)**

Same pattern — replace `error: String(err)` with generic message, log the real error.

- [ ] **Step 3: Commit**

```bash
git add app/api/cron/reminders/route.ts app/api/cron/recurrences/route.ts
git commit -m "fix(security): sanitize error responses in cron endpoints"
```

---

### Task 1.6: Hash IP addresses before database storage (privacy compliance)

**Files:**
- Modify: `app/api/tracking/event/route.ts`

- [ ] **Step 1: Add IP hashing utility (around line 102)**

The file imports `timingSafeEqual` from `crypto` but not `createHash`. Reuse the existing `hashData` function from `@/lib/tracking/utils` (already imported at line 5):

```typescript
// No new import needed — hashData is already imported from @/lib/tracking/utils
function hashIp(ip: string): string {
  return hashData(ip).substring(0, 16);
}
```

- [ ] **Step 2: Hash IP before database storage only**

Find where `clientIp` is stored in the database insert (around line 198) and replace with:

```typescript
ip_address: hashIp(clientIp),
```

**Important:** Do NOT hash the IP in `hashedUserData.client_ip_address` (around line 150) — Meta CAPI **requires** the raw IP for event matching. Only hash before storing in our own database.

- [ ] **Step 3: Commit**

```bash
git add app/api/tracking/event/route.ts
git commit -m "fix(privacy): hash IP addresses before database storage in tracking events"
```

---

## Phase 2: Broken Functionality — Supabase Clients & Logic Bugs

> **Necessity:** Cron jobs are likely returning empty results silently. Notifications are going to wrong channel. Core functionality is broken.

### Task 2.1: Fix cron routes to use createAdminClient

**Files:**
- Modify: `app/api/cron/reminders/route.ts`
- Modify: `app/api/cron/recurrences/route.ts`

- [ ] **Step 1: Fix reminders route (line 30)**

Change:
```typescript
const supabase = await createClient()
```
To:
```typescript
const supabase = createAdminClient()
```

Update the import at the top of the file:
```typescript
import { createAdminClient } from '@/lib/supabase/server'
```

Remove the old `createClient` import if no longer used.

- [ ] **Step 2: Fix recurrences route (line 30)**

Same change — replace `await createClient()` with `createAdminClient()` and update imports.

- [ ] **Step 3: Verify cron endpoints work**

Run locally with CRON_SECRET and check that data is returned:
```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/reminders
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/recurrences
```
Expected: `{ success: true, ... }` with actual data (not empty arrays).

- [ ] **Step 4: Commit**

```bash
git add app/api/cron/reminders/route.ts app/api/cron/recurrences/route.ts
git commit -m "fix(cron): use createAdminClient to bypass RLS in cron routes"
```

---

### Task 2.2: Fix carol/query route to use createAdminClient

**Files:**
- Modify: `app/api/carol/query/route.ts`

- [ ] **Step 1: Replace client (line 39)**

Change:
```typescript
const supabase = await createClient()
```
To:
```typescript
const supabase = createAdminClient()
```

Update import to use `createAdminClient` from `@/lib/supabase/server`.

- [ ] **Step 2: Commit**

```bash
git add app/api/carol/query/route.ts
git commit -m "fix(carol): use admin client in query route for RLS bypass"
```

---

### Task 2.3: Fix carol/actions route to use shared createAdminClient

**Files:**
- Modify: `app/api/carol/actions/route.ts`

- [ ] **Step 1: Replace inline client creation (lines 42-51)**

Remove the inline `createClient(URL, SERVICE_ROLE_KEY, ...)` block and replace with:

```typescript
import { createAdminClient } from '@/lib/supabase/server'

// Inside the POST handler:
const supabase = createAdminClient()
```

Remove the direct `@supabase/supabase-js` import if no longer needed.

- [ ] **Step 2: Commit**

```bash
git add app/api/carol/actions/route.ts
git commit -m "fix(carol): use shared createAdminClient in actions route"
```

---

### Task 2.4: Fix notification channel being ignored (WhatsApp going as SMS)

**Files:**
- Modify: `app/api/notifications/send/route.ts`

- [ ] **Step 1: Validate channel from payload (around lines 46-48)**

Add validation:
```typescript
const validChannels = ['sms', 'whatsapp', 'email'] as const;
if (channel && !validChannels.includes(channel)) {
  return NextResponse.json({ error: 'Invalid channel' }, { status: 400 });
}
```

- [ ] **Step 2: Pass channel to notify function (around line 71)**

Change the notify call to pass the channel (the `notify` function already defaults to `'sms'` if undefined):
```typescript
const result = await notify(recipient, template as any, data, channel)
```

- [ ] **Step 3: Commit**

```bash
git add app/api/notifications/send/route.ts
git commit -m "fix(notifications): pass channel parameter to notify function"
```

---

### Task 2.5: Fix phone handler retry limit and transition

**Files:**
- Modify: `lib/ai/state-machine/handlers/phone.ts`

- [ ] **Step 1: Import shared constant and fix retry limit (around line 19)**

At the top of the file, ensure `MAX_COLLECTION_RETRIES` is imported or defined (check if it exists in types.ts or another handler):

```typescript
const MAX_COLLECTION_RETRIES = 5;
```

Change the retry check from:
```typescript
if (retries >= 3) {
```
To:
```typescript
if (retries >= MAX_COLLECTION_RETRIES) {
```

- [ ] **Step 2: Fix transition on max retries**

Change the max-retry transition from `DONE` to `ASK_CALLBACK_TIME`. The handler uses `contextUpdates` (not `context`) in its return type:

```typescript
const response = await llm.generate('max_retries_phone', {}, lang)
return {
  nextState: 'ASK_CALLBACK_TIME',
  response,
  contextUpdates: { retry_count: retries },
}
```

Apply the same fix to the duplicate retry check at around line 40-46.

- [ ] **Step 3: Run existing tests**

Run: `npx jest lib/ai/state-machine/__tests__/ --verbose`
Expected: All tests pass (update any tests that expected `DONE` transition).

- [ ] **Step 4: Commit**

```bash
git add lib/ai/state-machine/handlers/phone.ts
git commit -m "fix(state-machine): align phone handler retry limit and escalation with other handlers"
```

---

### Task 2.6: Fix handleConfirmReschedule missing error handling

**Files:**
- Modify: `lib/ai/state-machine/handlers/reschedule.ts`

- [ ] **Step 1: Wrap cancelAppointment in try/catch (around line 38)**

Change:
```typescript
if (appointmentId) {
  await services.cancelAppointment(appointmentId, 'Rescheduled via chat')
}
```
To (note: this handler uses `contextUpdates`, not `context`, in its return type):
```typescript
if (appointmentId) {
  try {
    await services.cancelAppointment(appointmentId, 'Rescheduled via chat')
  } catch (cancelError) {
    console.error('[reschedule] Failed to cancel old appointment:', cancelError);
    return {
      nextState: 'DONE',
      response: lang === 'pt'
        ? 'Houve um problema ao cancelar o agendamento anterior. Por favor, entre em contato conosco diretamente.'
        : 'There was an issue cancelling the previous appointment. Please contact us directly.',
    };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/ai/state-machine/handlers/reschedule.ts
git commit -m "fix(state-machine): add error handling for cancelAppointment in reschedule"
```

---

### Task 2.7: Harden US phone normalization

**Files:**
- Modify: `lib/tracking/utils.ts`

- [ ] **Step 1: Improve normalizePhone for US format edge cases (around lines 25-34)**

The current logic correctly assumes US (`+1`) for 10-digit numbers. Harden it to also handle 11-digit numbers that already include the `1` country code and reject obviously invalid formats:

```typescript
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  // Already has US country code (1 + 10 digits)
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits;
  }

  // Standard US number (10 digits: area code + number)
  if (digits.length === 10) {
    return `1${digits}`;
  }

  // International format or already complete
  if (digits.length > 11) {
    return digits;
  }

  // Fallback: return as-is (too short or ambiguous)
  return digits;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/tracking/utils.ts
git commit -m "fix(tracking): harden US phone normalization for edge cases"
```

---

## Phase 3: Authentication & Authorization Gaps

> **Necessity:** Multiple endpoints are missing auth checks or have insufficient protection. Attackers can access admin functions or abuse public endpoints.

### Task 3.1: Add IP-based rate limiting to chat endpoint

**Files:**
- Modify: `app/api/chat/route.ts`

- [ ] **Step 1: Add rate limiter at module level (before the POST handler)**

```typescript
const chatRateLimitMap = new Map<string, { count: number; timestamp: number }>();
const CHAT_RATE_LIMIT = 20; // requests per minute per IP
const CHAT_RATE_WINDOW = 60_000; // 1 minute

function checkChatRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = chatRateLimitMap.get(ip);

  if (!entry || now - entry.timestamp > CHAT_RATE_WINDOW) {
    chatRateLimitMap.set(ip, { count: 1, timestamp: now });
    return true;
  }

  if (entry.count >= CHAT_RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}
```

- [ ] **Step 2: Apply rate limit at the start of POST handler**

Add at the beginning of the POST function, before any other logic:

```typescript
const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
if (!checkChatRateLimit(ip)) {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    { status: 429 }
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/chat/route.ts
git commit -m "fix(security): add IP-based rate limiting to chat endpoint"
```

---

### Task 3.2: Add admin role check to financial routes

**Files:**
- Modify: `app/api/financeiro/categorias/route.ts`
- Modify: `app/api/financeiro/categorias/[id]/route.ts`

- [ ] **Step 1: Add admin check helper to categorias/route.ts**

After the auth check (`if (!user)`), add admin role verification:

```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single();

if (!profile || profile.role !== 'admin') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

Apply to both GET (if admin-only) and POST handlers.

- [ ] **Step 2: Add same check to categorias/[id]/route.ts**

Add the same admin role check to the PATCH and DELETE handlers.

- [ ] **Step 3: Commit**

```bash
git add app/api/financeiro/categorias/route.ts app/api/financeiro/categorias/[id]/route.ts
git commit -m "fix(security): add admin role verification to financial routes"
```

---

### Task 3.3: Rewrite verifyAuth — use request.headers + add replay protection

**Files:**
- Modify: `app/api/webhook/n8n/route.ts`

> **Note:** This task also fixes the issue where `verifyAuth` ignored its `request` parameter and used `headers()` from `next/headers` instead. Both fixes are applied together since they modify the same function.

- [ ] **Step 1: Rewrite verifyAuth to use request.headers and add timestamp check (around line 27-46)**

Replace the entire `verifyAuth` function. Change from `async` (using `await headers()`) to sync (using `request.headers` directly):

```typescript
function verifyAuth(request: NextRequest): boolean {
  const secret = request.headers.get('x-webhook-secret') || '';
  const timestamp = request.headers.get('x-webhook-timestamp') || '';

  if (!secret || !webhookSecret) return false;

  // Timing-safe secret comparison
  const secretBuffer = Buffer.from(secret);
  const expectedBuffer = Buffer.from(webhookSecret);
  if (secretBuffer.length !== expectedBuffer.length) return false;
  if (!timingSafeEqual(secretBuffer, expectedBuffer)) return false;

  // Replay protection: reject requests older than 5 minutes
  if (timestamp) {
    const requestTime = new Date(timestamp).getTime();
    const now = Date.now();
    if (isNaN(requestTime) || Math.abs(now - requestTime) > 5 * 60 * 1000) {
      console.warn('[webhook/n8n] Request rejected: timestamp outside window');
      return false;
    }
  }

  return true;
}
```

- [ ] **Step 2: Update all callers from `await verifyAuth(request)` to `verifyAuth(request)`**

Search for all calls to `verifyAuth` in the file and remove `await`. Remove the `headers` import from `next/headers` if no longer used elsewhere.

- [ ] **Step 3: Commit**

```bash
git add app/api/webhook/n8n/route.ts
git commit -m "fix(security): rewrite verifyAuth with request.headers and replay protection"
```

---

### Task 3.4: Validate Google Analytics ID format

**Files:**
- Modify: `components/analytics/google-analytics.tsx`

- [ ] **Step 1: Add GA ID format validation (around line 26)**

Before using the GA_ID in the script, validate its format:

```typescript
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

// Validate GA4 measurement ID format
const isValidGaId = GA_ID && /^G-[A-Z0-9]+$/.test(GA_ID);

if (!isValidGaId) return null;
```

- [ ] **Step 2: Commit**

```bash
git add components/analytics/google-analytics.tsx
git commit -m "fix(security): validate GA measurement ID format to prevent script injection"
```

---

### Task 3.5: Add rate limiting and basic validation to contact form

**Files:**
- Modify: `app/api/contact/route.ts`

- [ ] **Step 1: Add rate limiter**

```typescript
const contactRateLimitMap = new Map<string, { count: number; timestamp: number }>();
const CONTACT_RATE_LIMIT = 5; // max 5 submissions per 10 minutes per IP
const CONTACT_RATE_WINDOW = 10 * 60_000;

function checkContactRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = contactRateLimitMap.get(ip);
  if (!entry || now - entry.timestamp > CONTACT_RATE_WINDOW) {
    contactRateLimitMap.set(ip, { count: 1, timestamp: now });
    return true;
  }
  if (entry.count >= CONTACT_RATE_LIMIT) return false;
  entry.count++;
  return true;
}
```

- [ ] **Step 2: Apply at start of POST handler**

```typescript
const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
if (!checkContactRateLimit(ip)) {
  return NextResponse.json({ error: 'Too many submissions. Please try again later.' }, { status: 429 });
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/contact/route.ts
git commit -m "fix(security): add rate limiting to contact form endpoint"
```

---

## Phase 4: Input Validation & API Hardening

> **Necessity:** Missing validation allows malformed data, unbounded queries, and type-unsafe operations throughout the API.

### Task 4.1: Validate page_size, sessionId, and export format in admin routes

**Files:**
- Modify: `app/api/admin/chat-logs/route.ts`
- Modify: `app/api/admin/chat-logs/[sessionId]/route.ts`
- Modify: `app/api/admin/chat-logs/[sessionId]/export/route.ts`

- [ ] **Step 1: Clamp page_size in chat-logs list (line 34)**

Change:
```typescript
page_size: parseInt(searchParams.get('page_size') || '20'),
```
To:
```typescript
page_size: Math.max(1, Math.min(parseInt(searchParams.get('page_size') || '20') || 20, 100)),
```

- [ ] **Step 2: Validate sessionId format in detail route (line 29)**

Add before the query:
```typescript
const sessionId = params.sessionId;
if (!sessionId || sessionId.length > 64 || !/^[a-zA-Z0-9_-]+$/.test(sessionId)) {
  return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
}
```

- [ ] **Step 3: Validate export format at runtime (line 31)**

Change:
```typescript
const format = (searchParams.get('format') || 'json') as 'json' | 'csv'
```
To:
```typescript
const formatParam = searchParams.get('format') || 'json';
if (formatParam !== 'json' && formatParam !== 'csv') {
  return NextResponse.json({ error: 'Invalid format. Use json or csv.' }, { status: 400 });
}
const format = formatParam as 'json' | 'csv';
```

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/chat-logs/route.ts app/api/admin/chat-logs/[sessionId]/route.ts app/api/admin/chat-logs/[sessionId]/export/route.ts
git commit -m "fix(admin): validate page_size, sessionId, and export format parameters"
```

---

### Task 4.2: Validate duration in slots route and currentPassword in password route

**Files:**
- Modify: `app/api/slots/route.ts`
- Modify: `app/api/profile/password/route.ts`

- [ ] **Step 1: Validate duration in slots route (around line 11)**

After parsing duration, add:
```typescript
const duration = durationParam ? parseInt(durationParam, 10) : 180;
if (isNaN(duration) || duration < 15 || duration > 480) {
  return NextResponse.json({ error: 'Invalid duration. Must be between 15 and 480 minutes.' }, { status: 400 });
}
```

- [ ] **Step 2: Validate currentPassword presence (around line 13)**

Add before the new password validation:
```typescript
if (!currentPassword || typeof currentPassword !== 'string') {
  return NextResponse.json({ error: 'Current password is required' }, { status: 400 });
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/slots/route.ts app/api/profile/password/route.ts
git commit -m "fix(api): validate duration range and require currentPassword"
```

---

### Task 4.3: Escape LIKE wildcards in service queries

**Files:**
- Modify: `lib/services/carol-services.ts`
- Modify: `app/api/carol/query/route.ts`

- [ ] **Step 1: Add escape helper**

Add this utility function (e.g. in carol-services.ts near the top, and import in query route):

```typescript
function escapeLikePattern(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&');
}
```

- [ ] **Step 2: Apply to carol-services.ts (around line 474)**

Change:
```typescript
query = query.ilike('nome', `%${serviceType}%`)
```
To:
```typescript
query = query.ilike('nome', `%${escapeLikePattern(serviceType)}%`)
```

- [ ] **Step 3: Apply to query/route.ts (around line 216)**

Same pattern for the `service_type` ilike query.

- [ ] **Step 4: Commit**

```bash
git add lib/services/carol-services.ts app/api/carol/query/route.ts
git commit -m "fix(security): escape LIKE wildcards in service name queries"
```

---

### Task 4.4: Validate callback preferredTime instead of using raw input

**Files:**
- Modify: `lib/ai/state-machine/handlers/callback.ts`

- [ ] **Step 1: Add time validation (around line 25-26)**

Replace raw fallback:
```typescript
const preferredTime = extracted?.time ?? extracted?.value ?? message.trim()
```
With validated extraction:
```typescript
const rawTime = extracted?.time ?? extracted?.value;
const timePattern = /^\d{1,2}[:\s]?\d{0,2}\s*(am|pm|h|hrs?)?$/i;
const preferredTime = rawTime && timePattern.test(rawTime.trim())
  ? rawTime.trim()
  : null;

if (!preferredTime) {
  const lang = context.language;
  return {
    nextState: 'ASK_CALLBACK_TIME',
    response: lang === 'pt'
      ? 'Não consegui entender o horário. Pode informar no formato HH:MM? (ex: 14:00)'
      : "I couldn't understand the time. Can you provide it in HH:MM format? (e.g., 2:00 PM)",
    contextUpdates: { _callback_retries: (context._callback_retries || 0) + 1 },
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/ai/state-machine/handlers/callback.ts
git commit -m "fix(state-machine): validate callback time instead of using raw user input"
```

---

### Task 4.5: Fix classifyIntent fuzzy matching false positives

**Files:**
- Modify: `lib/ai/llm.ts`

- [ ] **Step 1: Replace substring match with word-boundary match (around line 512-515)**

Change:
```typescript
const fuzzyMatch = options.find((opt) => normalized.includes(opt.toLowerCase()))
```
To:
```typescript
const fuzzyMatch = options.find((opt) => {
  const pattern = new RegExp(`\\b${opt.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
  return pattern.test(normalized);
});
```

- [ ] **Step 2: Commit**

```bash
git add lib/ai/llm.ts
git commit -m "fix(llm): use word-boundary matching in classifyIntent to prevent false positives"
```

---

## Phase 5: State Machine & Engine Robustness

> **Necessity:** The state machine has edge cases that can cause data loss, incorrect behavior, or poor user experience.

### Task 5.1: Persist session context when primary handler throws

**Files:**
- Modify: `lib/ai/state-machine/engine.ts`

- [ ] **Step 1: Move session persistence into the error handler (around lines 173-207)**

In the catch block where the primary handler throws, before the `return`, add session persistence so the `_same_state_count` is not lost:

```typescript
// Inside the catch block, before the return statement:
try {
  await this.updateSession(sessionId, {
    state: currentState,
    context: { ...context },
  });
} catch (persistError) {
  console.error('[engine] Failed to persist context after handler error:', persistError);
}
```

- [ ] **Step 2: Run engine tests**

Run: `npx jest lib/ai/state-machine/__tests__/engine.test.ts --verbose`
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add lib/ai/state-machine/engine.ts
git commit -m "fix(engine): persist session context when primary handler throws"
```

---

### Task 5.2: Fix CONFIRM_ADDRESS not waiting for user confirmation

**Files:**
- Modify: `lib/ai/state-machine/handlers/booking.ts`

- [ ] **Step 1: Read the current handleConfirmAddress implementation (lines 11-21)**

The current handler is a silent auto-advance — it shows the address via LLM generate and immediately transitions to `ASK_SERVICE_TYPE` without waiting for user input:

```typescript
// CURRENT CODE (confirmed by reading booking.ts):
export const handleConfirmAddress: StateHandler = async (_message, context, _services, llm) => {
  const response = await llm.generate('confirm_address', {
    address: context.cliente_endereco,
    name: context.cliente_nome,
  }, context.language)

  return {
    nextState: 'ASK_SERVICE_TYPE',
    response,
  }
}
```

- [ ] **Step 2: Rewrite to wait for user confirmation**

Change to a two-pass handler. Note: handlers use `contextUpdates` (partial context updates), not `context` (full replacement):

```typescript
export const handleConfirmAddress: StateHandler = async (message, context, _services, llm) => {
  const lang = context.language

  // First visit (silent entry): show address and ask for confirmation
  if (!message) {
    const response = await llm.generate('confirm_address', {
      address: context.cliente_endereco,
      name: context.cliente_nome,
    }, lang)

    return {
      nextState: 'CONFIRM_ADDRESS',
      response,
    }
  }

  // User responded: classify yes/no
  const intent = await llm.classifyIntent(message, ['yes', 'no'])

  if (intent === 'yes') {
    return {
      nextState: 'ASK_SERVICE_TYPE',
      response: '',
      silent: true,
    }
  }

  // User said no — go back to collect a new address
  const response = await llm.generate('ask_address', {
    name: context.cliente_nome,
  }, lang)

  return {
    nextState: 'NEW_CUSTOMER_ADDRESS',
    response,
    contextUpdates: { cliente_endereco: null },
  }
}
```

- [ ] **Step 3: Run booking tests**

Run: `npx jest lib/ai/state-machine/__tests__/ --verbose`
Expected: Update any tests that assumed auto-advance from CONFIRM_ADDRESS.

- [ ] **Step 4: Commit**

```bash
git add lib/ai/state-machine/handlers/booking.ts
git commit -m "fix(state-machine): make CONFIRM_ADDRESS wait for user confirmation"
```

---

### Task 5.3: Add error handling to updateLead in FAQ handlers

**Files:**
- Modify: `lib/ai/state-machine/handlers/faq.ts`

- [ ] **Step 1: Wrap updateLead calls in try/catch (around lines 70-72 and 118-120)**

For `handleSavePetInfo` (around line 70-72, note the actual fields are `tem_pets` and `pets_detalhes`):
```typescript
try {
  await services.updateLead(context.cliente_id, {
    tem_pets: 'true',
    pets_detalhes: petDetails,
  })
} catch (err) {
  console.error('[faq] Failed to save pet info:', err);
  return {
    nextState: 'DETECT_INTENT',
    response: lang === 'pt'
      ? 'Houve um problema ao salvar a informação. Por favor, tente novamente mais tarde.'
      : 'There was an issue saving the information. Please try again later.',
  };
}
```

Apply same pattern to `handleSaveAllergyInfo`.

- [ ] **Step 2: Commit**

```bash
git add lib/ai/state-machine/handlers/faq.ts
git commit -m "fix(state-machine): add error handling for updateLead in FAQ handlers"
```

---

### Task 5.4: Soften GUARDRAIL behavior when previousState is DETECT_INTENT

**Files:**
- Modify: `lib/ai/state-machine/handlers/guardrail.ts`

- [ ] **Step 1: Change DONE to DETECT_INTENT with counter (around lines 104-108)**

The current code at lines 104-108 checks `if (returnState === 'GUARDRAIL' || returnState === 'DETECT_INTENT') { returnState = 'DONE' }`. Replace this block with a retry-with-counter approach using `contextUpdates`:

```typescript
if (returnState === 'GUARDRAIL' || returnState === 'DETECT_INTENT') {
  const guardrailRetries = (context._guardrail_retries || 0) + 1
  if (guardrailRetries >= 3) {
    return {
      nextState: 'ASK_CALLBACK_TIME',
      response,
      contextUpdates: { _guardrail_retries: 0 },
    }
  }
  return {
    nextState: 'DETECT_INTENT',
    response,
    contextUpdates: { _guardrail_retries: guardrailRetries },
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/ai/state-machine/handlers/guardrail.ts
git commit -m "fix(state-machine): soften guardrail to retry DETECT_INTENT before ending conversation"
```

---

## Phase 6: Code Quality, Performance & Cleanup

> **Necessity:** Technical debt, duplicated code, performance issues, and inconsistencies that increase maintenance burden and risk.

### Task 6.1: Eliminate duplicated logic between actions route and CarolServices

**Files:**
- Modify: `app/api/carol/actions/route.ts`
- Modify: `lib/services/carol-services.ts`

- [ ] **Step 1: Identify all action functions that duplicate CarolServices**

The following functions in actions/route.ts duplicate CarolServices methods:
- `actionCreateLead` → `CarolServices.createLead`
- `actionUpdateLead` → `CarolServices.updateLead`
- `actionCreateAppointment` → `CarolServices.createAppointment`
- `actionConfirmAppointment` → `CarolServices.confirmAppointment`
- `actionCancelAppointment` → `CarolServices.cancelAppointment`
- `actionScheduleCallback` → `CarolServices.scheduleCallback`
- `actionSendQuote` → (may not have equivalent)

- [ ] **Step 2: Refactor actions to delegate to CarolServices**

For each duplicated function, replace the inline implementation with a call to the service:

```typescript
import { CarolServices } from '@/lib/services/carol-services';

// Inside POST handler, after auth:
const supabase = createAdminClient();
const services = new CarolServices(supabase);

async function actionCreateLead(data: any) {
  try {
    const result = await services.createLead({
      name: cleanValue(data.name),
      phone: cleanValue(data.phone),
      email: cleanValue(data.email),
      // ... map fields
    });
    return { status: 'success', data: result };
  } catch (error: any) {
    console.error('[actions] createLead error:', error);
    return { status: 'error', message: 'Failed to create lead' };
  }
}
```

Repeat for each duplicated function.

- [ ] **Step 3: Remove the duplicated helper functions**

Remove `cleanValue`, `isValidNumber`, `getSuggestedTimes` from actions/route.ts (keep in carol-services.ts or extract to shared utils if not already there).

- [ ] **Step 4: Run tests**

Run: `npx jest --verbose`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/api/carol/actions/route.ts lib/services/carol-services.ts
git commit -m "refactor(carol): delegate actions route to CarolServices, remove duplicated logic"
```

---

### Task 6.2: Fix generateWithMetrics double template invocation

**Files:**
- Modify: `lib/ai/llm.ts`

- [ ] **Step 1: Remove redundant template lookup (around lines 624-626)**

The `generateWithMetrics` method calls the template function and then calls `_generateRaw` which calls it again. Remove the first call:

```typescript
async generateWithMetrics(template: string, data: any, language: string) {
  const startTime = Date.now();
  // Remove: const templateFn = RESPONSE_TEMPLATES[template]
  // Remove: const instruction = templateFn ? templateFn(data, language) : ''
  const { text, usage } = await this._generateRaw(template, data, language);
  // ... rest of metrics collection
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/ai/llm.ts
git commit -m "fix(llm): remove redundant template function invocation in generateWithMetrics"
```

---

### Task 6.3: Parallelize getAvailableSlotsMultiDay

**Files:**
- Modify: `lib/services/carol-services.ts`

- [ ] **Step 1: Replace sequential loop with Promise.all (around lines 419-441)**

Change:
```typescript
for (let i = 0; i < days; i++) {
  // sequential RPC call per day
}
```
To:
```typescript
const dayPromises = Array.from({ length: days }, (_, i) => {
  const date = new Date(startDate);
  date.setDate(date.getDate() + i);
  const dateStr = date.toISOString().split('T')[0];
  return this.getAvailableSlots(dateStr, duration)
    .then(slots => ({ date: dateStr, slots }))
    .catch(() => ({ date: dateStr, slots: [] }));
});

const results = await Promise.all(dayPromises);
```

- [ ] **Step 2: Commit**

```bash
git add lib/services/carol-services.ts
git commit -m "perf(services): parallelize multi-day slot queries with Promise.all"
```

---

### Task 6.4: Standardize logging — replace console.* with structured logger

**Files:**
- Modify: `lib/ai/llm.ts`
- Modify: `lib/notifications.ts`
- Modify: `lib/twilio.ts`
- Modify: `app/api/cron/reminders/route.ts`
- Modify: `app/api/cron/recurrences/route.ts`

- [ ] **Step 1: Add logger import to each file**

```typescript
import { logger } from '@/lib/logger';
```

- [ ] **Step 2: Replace console.error/warn/log calls**

In each file, replace:
- `console.error(...)` → `logger.error(...)`
- `console.warn(...)` → `logger.warn(...)`
- `console.log(...)` → `logger.info(...)`

Focus on `lib/ai/llm.ts` (lines 422, 441, 501, 514, 518, 521, 608, 677) which has the most instances.

- [ ] **Step 3: Commit**

```bash
git add lib/ai/llm.ts lib/notifications.ts lib/twilio.ts app/api/cron/reminders/route.ts app/api/cron/recurrences/route.ts
git commit -m "refactor(logging): standardize on structured logger across all modules"
```

---

### Task 6.5: Remove dead code and add env validation

**Files:**
- Delete: `lib/supabase/middleware.ts`
- Modify: `app/layout.tsx` (or `instrumentation.ts`)
- Modify: `lib/env.ts`

- [ ] **Step 1: Verify lib/supabase/middleware.ts is truly unused**

Run: grep for imports of this file across the project. If no imports found, delete it.

- [ ] **Step 2: Delete the file**

```bash
rm lib/supabase/middleware.ts
```

- [ ] **Step 3: Call validateEnv() at app startup**

In the root layout or an instrumentation file, add:

```typescript
import { validateEnv } from '@/lib/env';
validateEnv();
```

Or if `instrumentation.ts` exists:
```typescript
export async function register() {
  const { validateEnv } = await import('@/lib/env');
  validateEnv();
}
```

- [ ] **Step 4: Commit**

```bash
git rm lib/supabase/middleware.ts
git add lib/env.ts app/layout.tsx
git commit -m "chore: remove dead supabase middleware, activate env validation at startup"
```

---

### Task 6.6: Add request timeout to carol.chat()

**Files:**
- Modify: `app/api/chat/route.ts`

- [ ] **Step 1: Wrap carol.chat() with timeout (around line 88)**

Change:
```typescript
const response: ChatResponse = await carol.chat(message, currentSessionId)
```
To:
```typescript
const CHAT_TIMEOUT = 60_000; // 60 seconds

const response: ChatResponse = await Promise.race([
  carol.chat(message, currentSessionId),
  new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Chat processing timeout')), CHAT_TIMEOUT)
  ),
]);
```

Make sure the existing error handler catches this timeout and returns a user-friendly 504:

```typescript
catch (error: any) {
  if (error.message === 'Chat processing timeout') {
    return NextResponse.json(
      { error: 'Request took too long. Please try again.' },
      { status: 504 }
    );
  }
  // ... existing error handling
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/chat/route.ts
git commit -m "fix(chat): add 60s timeout to carol.chat() processing"
```

---

### ~~Task 6.7~~ (Merged into Task 3.3)

> The `verifyAuth` rewrite was merged into Task 3.3 to avoid conflicting edits to the same function.

---

## Phase Summary

| Phase | Focus | Tasks | Priority |
|-------|-------|-------|----------|
| **1** | Security — Credential Exposure & Data Leaks | 6 tasks | **BLOCKER** |
| **2** | Broken Functionality — Supabase Clients & Logic Bugs | 7 tasks | **BLOCKER** |
| **3** | Auth & Authorization Gaps | 5 tasks | **BLOCKER** |
| **4** | Input Validation & API Hardening | 5 tasks | HIGH |
| **5** | State Machine & Engine Robustness | 4 tasks | HIGH |
| **6** | Code Quality, Performance & Cleanup | 6 tasks (6.7 merged into 3.3) | MEDIUM |
| **Total** | | **33 tasks** | |

**Estimated execution:** Phases 1-3 can be parallelized (independent concerns). Phase 4-5 can be parallelized. Phase 6 is sequential due to cross-cutting changes.

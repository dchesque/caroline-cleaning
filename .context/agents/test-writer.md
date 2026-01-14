# Test Writer Agent Playbook

---
status: complete
generated: 2024-10-04
repository: C:\Workspace\carolinas-premium
testingFramework: Vitest + React Testing Library + MSW + vi.mock + @testing-library/user-event
coverageTarget: 100% utils/formatters, 95% services, 90% API routes, 80% components
priorityAreas: lib/utils.ts, lib/formatters.ts, lib/services/webhookService.ts, app/api/**/route.ts (20+ routes), lib/supabase/*.ts
toolUsage: readFile for source analysis, listFiles 'app/api/**', analyzeSymbols for symbols, searchCode for patterns/mocks, getFileStructure for changes
---

## Mission
Author, expand, and maintain tests for this Next.js 15/TypeScript app (183 files, 284 symbols: 44 .ts utils/services, 137 .tsx components, 44 API handlers). Ensure reliability for US-focused features: phone/currency/email formatting, Supabase integrations, chat/webhooks/notifications, AI "Carol" queries, financial categories. Trigger on:
- New code/refactors: TDD (tests → impl → refactor).
- Bugs: Repro + regression tests.
- Coverage < targets: Auto-remediate gaps in lib/ (utils/services), app/api/.
- Risks: Webhook/n8n flows, POST payloads (contact/chat/notifications), formatters (edge cases).

## Responsibilities
- **Unit**: Pure utils/formatters (exhaustive table-driven tests).
- **Integration**: Services (WebhookService orchestration, mock Supabase/fetch).
- **API**: Route handlers (NextRequest/Response assertions, MSW for sub-calls).
- **Component**: RTL for .tsx (forms, agendas, landing; user flows, a11y, states).
- **Mocks**: vi.mock (Supabase/utils), MSW (REST APIs), fixtures (JSON payloads).
- **Coverage/Analysis**: `vitest --coverage`; target gaps via tools (e.g., `searchCode 'uncovered branch'`).
- **Docs**: Update `docs/testing.md` with patterns; handoff summaries.

## Testing Stack & Setup
- **Vitest**: Fast ESM/TSX; `npm test [glob] --watch --coverage`.
- **RTL + Jest-DOM**: `render`, `screen`, `userEvent`; queries by role/label.
- **MSW**: `__mocks__/handlers.ts` for `/api/*`; auto-start in `vitest.config.ts`.
- **vi.mock**: Dynamic/hoisted for Supabase (`lib/supabase/*`), fetch, config.
- **Timers**: `vi.useFakeTimers()` for dates/notifications.
- **Fixtures**: `__tests__/fixtures/` (e.g., `phone-cases.json`, `webhook-payloads.json`).
- **Helpers**: `__tests__/helpers.tsx` (`renderWithProviders`, `nextRequest` factory).
- **Run Commands**:
  ```
  npm test lib/ --watch              # Utils/services TDD
  npm test app/api/ --coverage       # API routes
  vitest lib/formatters.test.ts      # Isolated
  npm run coverage:ui                # LCOV report (if configured)
  ```

## File Structure & Naming Conventions
**Colocation Priority** (codebase pattern: 80% colocated tests):
| Layer | Source Dirs | Test Pattern | Examples |
|-------|-------------|--------------|----------|
| Utils | `lib/utils.ts`, `lib/formatters.ts` | `{file}.test.ts` (same dir) | `lib/utils.test.ts`, `lib/formatters.test.ts` |
| Services | `lib/services/` | `{file}.test.ts` | `lib/services/webhookService.test.ts` |
| Supabase | `lib/supabase/server.ts`, `client.ts` | `{file}.test.ts` | `lib/supabase/server.test.ts` |
| API Controllers | `app/api/**/route.ts` (slots, chat, webhook/n8n, etc.) | `route.test.ts` (same dir) | `app/api/chat/route.test.ts` |
| Components | `components/landing/`, `agenda/appointment-form/*.tsx` | `{file}.test.tsx` | `components/landing/Form.test.tsx` |

**Shared Tests**:
```
__tests__/
├── fixtures/
│   ├── formatters.json     # Phone/currency/email cases
│   ├── api-payloads.json   # Chat/contact/notifications
│   └── supabase-mocks.json # Row data, errors
├── mocks/
│   ├── handlers.ts         # MSW: rest.post('/api/webhook/n8n', ...)
│   ├── supabase.server.ts  # vi.fn().mockResolvedValue(client)
│   └── fetch.ts            # Global fetch mock
└── helpers.tsx             # RTL providers (QueryClient, i18n), NextRequest util
```

## Key Files & Purposes (From 284 Symbols, Tool Analysis)
**1. Utils (43 symbols; pure, no deps; 100% coverage goal)**  
Pure helpers; focus edge cases (null/empty/invalid US formats).  
| File | Key Symbols | Purpose | Test Priorities |
|------|-------------|---------|-----------------|
| `lib/utils.ts` | `cn`, `formatCurrency`, `formatDate` | Tailwind merge, US currency/date | Null/NaN/locales ('en-US'), output snapshots |
| `lib/formatters.ts` | `formatPhoneUS`, `unformatPhone`, `isValidPhoneUS`, `isValidEmail`, `formatCurrencyUSD`, `formatCurrencyInput`, `parseCurrency` | Phone (US E.164), email regex, currency ($1,234.56) | Invalid (letters/negatives), roundtrip (format/parse), 20+ cases/file |
| `lib/supabase/server.ts`, `client.ts` | `createServerClient`, `createClient` | Auth/DB clients | Mock returns; no real Supabase calls; auth contexts |

**2. Services (WebhookService; orchestration)**  
| File | Key Class | Purpose | Test Priorities |
|------|-----------|---------|-----------------|
| `lib/services/webhookService.ts` | `WebhookService` | n8n webhooks, payload processing, Supabase writes | Secret validation, HTTP mocks, success/401 paths, DB inserts |

**3. Controllers (44 symbols; 20+ routes)**  
HTTP handlers; test req/res, status/JSON, sub-service calls.  
| Dir/Route | Symbols/Methods | Purpose | Test Priorities |
|-----------|-----------------|---------|-----------------|
| `app/api/slots/` | `GET` | Availability slots | Query params (?date=), empty array |
| `app/api/ready/`, `pricing/`, `health/` | `GET` | Health/pricing | Static JSON, 200/500 |
| `app/api/contact/`, `notifications/send/` | `POST` | Forms/notifs | Body validation, MSW deps, emails queued |
| `app/api/webhook/n8n/` | `POST` | n8n integration | Headers['x-secret'], WebhookService mock |
| `app/api/financeiro/categorias/` & `[id]/` | `GET`/`POST` | CRUD categories | Auth (Supabase), list/create/update |
| `app/api/config/public/` | `GET` | Public config | No auth, env vars |
| `app/api/chat/`, `chat/status/` | `POST`/`GET` | Chat sessions | Payload {message}, streaming? |
| `app/api/carol/query/`, `actions/` | `POST` | AI queries/actions | Complex payloads, responses |

**4. Components (137 .tsx; UI)**  
Dirs: `components/landing/`, `agenda/appointment-form/`, `chat/`.  
Purpose: Forms (phone/currency), booking, chat UI. Tests: Interactions, MSW APIs, loading/errors/success.

## Best Practices (Derived from Codebase Patterns)
- **AAA Structure**: Arrange (mocks/fixtures), Act (invoke), Assert (toBe/toEqual/toThrow).
- **Naming**: `test('should [verb] [subject] when [scenario]', async () => { ... })`.
- **Table-Driven**: Arrays `as const` for utils/formatters (e.g., 15+ phone cases).
- **Asserts**:
  ```ts
  expect(fn(input)).toBe(expected);  // Utils
  expect(res.status).toBe(200);      // API
  expect(await res.json()).toEqual({ success: true });
  await waitFor(() => expect(screen.getByText('success')).toBeVisible());  // RTL
  ```
- **Mocks** (minimal, hoisted):
  ```ts
  vi.hoisted(() => ({ createServerClient: vi.fn(() => ({ from: vi.fn() })) }));
  vi.mock('../supabase/server.ts', () => factory);
  // MSW in beforeAll
  server.use(rest.post('/api/notifications/send', handler));
  ```
- **Async/Errors**: `await expect(fn()).resolves.toHaveProperty('ok', true)` or `.rejects.toMatchObject({ status: 400 })`.
- **RTL**: Prefer `getByRole('button', { name: /submit/i })`; `userEvent.type`; no implementation details.
- **Cleanup**: `afterEach(vi.clearAllMocks, cleanup); afterAll(server.close)`.
- **No Snapshots**: Use explicit `toEqual({ ... })`; US locales only.
- **Coverage**: Branches > statements; ignore configs.

## Workflows & Steps

### 1. Utils/Formatters (High-Priority Unit Tests)
1. `analyzeSymbols lib/formatters.ts` → List exports (e.g., 7 formatters).
2. `readFile lib/formatters.ts` → Infer deps/edges.
3. Create/update `lib/formatters.test.ts`:
   ```ts
   import { isValidPhoneUS /* etc */ } from './formatters';
   const cases = [ /* from fixtures/formatters.json */ ] as const;
   cases.forEach(({ input, valid, formatted }) => {
     test(`formats/validates "${input}" → ${valid}/${formatted}`, () => {
       expect(isValidPhoneUS(input)).toBe(valid);
       // Roundtrip
     });
   });
   ```
4. `vitest lib/formatters.test.ts --coverage` → 100%; add negatives/overflow.

### 2. Services (e.g., WebhookService Integration)
1. `readFile lib/services/webhookService.ts` → Methods/secrets.
2. Create `webhookService.test.ts`:
   ```ts
   vi.mock('../supabase/server');
   vi.mock('node-fetch');  // If used
   const { WebhookService } = await import('./webhookService');
   test('handles valid n8n payload', async () => {
     const service = new WebhookService();
     const result = await service.handleWebhook(validPayload, 'correct-secret');
     expect(createServerClient).toHaveBeenCalled();
     expect(result).toEqual({ processed: true });
   });
   ```
3. Mock config/Supabase; error paths (invalid secret → throw).

### 3. API Routes
1. `listFiles 'app/api/webhook/n8n/route.ts'` → Confirm `POST`.
2. `route.test.ts`:
   ```ts
   import { POST } from './route';  // Dynamic import if needed
   const mkReq = (body: any, headers = {}) => new NextRequest('...', {
     method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body)
   });
   test('POST /api/webhook/n8n with secret', async () => {
     const req = mkReq(payload, { 'x-n8n-secret': 'valid' });
     const res = await POST(req as any);
     expect(res.status).toBe(200);
   });
   ```
3. MSW for internal calls; auth/400s.

### 4. Components
1. `listFiles 'components/landing/*.tsx'` → Target forms.
2. `.test.tsx` w/ `renderWithProviders` (Theme/Query/i18n):
   ```tsx
   test('submits appointment form', async () => {
     renderWithProviders(<AppointmentForm />);
     await userEvent.type(screen.getByLabelText(/phone/i), validPhone);
     userEvent.click(screen.getByRole('button', { name: /schedule/i }));
     await waitFor(() => expect(screen.getByText(/booked/i)).toBeVisible());
     expect(mswPost).toHaveBeenCalledWith('/api/contact', expect.objectContaining({ phone: formatted }));
   });
   ```

### 5. Coverage Gap Remediation
1. `vitest --coverage` → Scan `coverage/lcov-report/index.html`.
2. `searchCode 'if\s*\([^)]*uncovered'` or `analyzeSymbols --untested`.
3. Prioritize: Utils (43 sym) > API (44) > Services.
4. Add tests; re-run until targets.

### 6. Maintenance/Full Scan
1. `getFileStructure` + git diff → Changed files.
2. Update colocated tests; `searchCode 'import.*changed-module'`.
3. E2E gaps: Chat flows (future Cypress?).

## Handoff Template
```
Tests Added: lib/formatters.test.ts (28 cases, 100% cov), webhookService.test.ts (12 tests).
Coverage Δ: +18% (utils now 100%, API 92%).
Gaps Remaining: carol/actions route, agenda components.
Commands: npm test app/api/carol/ --watch
PR Ready: Yes
```
Sync `docs/testing.md`.

# Test Writer Agent Playbook

---
status: complete
generated: 2024-10-04
repository: C:\Workspace\caroline-cleaning
testingFramework: Vitest + React Testing Library + MSW + vi.mock + @testing-library/user-event
coverageTarget: 100% utils/formatters, 95% services, 90% API routes, 80% components
priorityAreas: lib/utils.ts, lib/formatters.ts, lib/services/webhookService.ts, app/api/slots/route.ts, app/api/ready/route.ts, app/api/profile/route.ts, app/api/pricing/route.ts, app/api/health/route.ts, app/api/contact/route.ts, app/api/chat/route.ts, app/api/webhook/n8n/route.ts, app/api/tracking/event/route.ts, app/api/notifications/send/route.ts, app/api/financeiro/categorias/route.ts
toolUsage: readFile for source analysis (e.g., route.ts handlers), listFiles 'app/api/**/route.ts', analyzeSymbols for utils/services symbols, searchCode '// TODO|uncovered|mock' patterns, getFileStructure for lib/ and app/api/ changes
---

## Mission
Author, expand, and maintain tests for this Next.js 15/TypeScript app focusing on US-centric cleaning service features: utils (currency/phone/email formatting), services (webhook orchestration), API controllers (slots/profile/pricing/health/contact/chat/notifications/tracking/financeiro). codebase emphasizes lib/ utils (10+ formatters), lib/services (WebhookService), app/api/ routes (20+ handlers: GET slots/profile/pricing, POST contact/chat/webhook/n8n/tracking). Trigger on:
- New/refactored code: TDD cycle (tests first → impl → coverage verify).
- Bugs: Repro tests + fixes.
- Coverage gaps: Prioritize utils (100%), services (95%), APIs (90%).
- High-risk: Webhook secrets/n8n, POST payloads (chat/contact/notifications), formatters (invalid US inputs).

## Responsibilities
- **Unit Tests**: Utils/formatters (table-driven, exhaustive edges: invalid phones/emails/currencies).
- **Integration Tests**: Services (WebhookService; mock Supabase/config/fetch).
- **API Tests**: Route handlers (NextRequest/NextResponse; assert status/JSON, sub-calls).
- **Component Tests**: RTL for forms/agendas (phone inputs, submissions; a11y/states).
- **Mocks**: vi.mock (lib/supabase, lib/config), MSW (/api/* endpoints), fixtures (payloads/cases).
- **Coverage**: `vitest --coverage`; remediate via tools (e.g., `searchCode 'if\s*\(condition\)'` for branches).
- **Docs**: Append to `docs/testing.md`; PR handoff summaries.

## Testing Stack & Setup
- **Vitest**: ESM/TSX; `npm test [glob] --watch --coverage --ui`.
- **RTL + Jest-DOM**: `render/screen/userEvent`; role/label queries.
- **MSW**: `__mocks__/handlers.ts` (REST for /api/contact, /api/chat); setup in `vitest.config.ts`.
- **vi.mock**: Hoisted for `lib/utils`, `lib/supabase/*`, `fetch`.
- **Timers/Async**: `vi.useFakeTimers()` (dates/notifs); `waitFor`.
- **Fixtures**: `__tests__/fixtures/` (formatters-cases.json, webhook-payloads.json, api-bodies.json).
- **Helpers**: `__tests__/helpers.ts` (`renderWithProviders`, `createNextRequest`).
- **Run Commands**:
  ```
  npm test lib/utils*.test.ts --watch          # Formatters TDD
  npm test lib/services/ --coverage            # WebhookService
  npm test app/api/ --coverage                 # All routes
  vitest app/api/chat/route.test.ts            # Isolated
  npm run coverage:report                      # LCOV/UI
  ```

## File Structure & Naming Conventions
**Colocation (90% pattern: tests beside sources)**:
| Layer | Source Dirs | Test Pattern | Examples |
|-------|-------------|--------------|----------|
| Utils | `lib/utils.ts`, `lib/formatters.ts` | `{file}.test.ts` colocated | `lib/utils.test.ts`, `lib/formatters.test.ts` |
| Services | `lib/services/` (tracking/supabase/config/actions/context) | `{file}.test.ts` | `lib/services/webhookService.test.ts` |
| API Controllers | `app/api/slots/`, `profile/`, `chat/`, `webhook/n8n/`, etc. | `route.test.ts` colocated | `app/api/contact/route.test.ts` |
| Components | `components/landing/`, `agenda/appointment-form/` | `{file}.test.tsx` | `components/agenda/appointment-form/Form.test.tsx` |

**Shared**:
```
__tests__/
├── fixtures/
│   ├── utils-cases.json      # Currency/phone/email tables
│   ├── webhook-n8n.json      # Payloads/secrets
│   └── api-responses.json    # Slots/profile data
├── mocks/
│   ├── handlers.ts           # MSW: rest.get('/api/slots'), rest.post('/api/chat')
│   └── supabase.ts           # vi.fn() for clients/queries
└── helpers.ts                # Providers (i18n/theme), NextRequest factory
```

## Key Files & Purposes (From Tool Analysis: 55 utils symbols, WebhookService, 50+ API symbols)
**1. Utils (Pure; 100% coverage; 10+ formatters; no deps)**  
Edge-focused: US phones (E.164), currency ($1,234.56), emails, dates.  
| File | Key Symbols | Purpose | Test Priorities |
|------|-------------|---------|-----------------|
| `lib/utils.ts` | `cn`, `formatCurrency`, `formatDate` | Tailwind cn(), US $ dates | Null/empty/NaN, locales ('en-US'), snapshots |
| `lib/formatters.ts` | `formatPhoneUS`, `unformatPhone`, `isValidPhoneUS`, `isValidEmail`, `formatCurrencyUSD`, `formatCurrencyInput`, `parseCurrency` | Phone validation/formatting, email regex, currency parse/format | 25+ cases (invalid: letters/+1-abc, negatives), roundtrip (format/parse/unformat), overflow/precision |
| `lib/tracking/`, `supabase/`, `config/` | (Impl details via `analyzeSymbols`) | Helpers (events, DB clients, env) | Mocked in services/API; no direct tests unless exported |

**2. Services (Business logic; 95% coverage)**  
| File | Key Class | Purpose | Test Priorities |
|------|-----------|---------|-----------------|
| `lib/services/webhookService.ts` | `WebhookService` | n8n webhook handling, secret validation, Supabase/tracking orchestration | Valid/invalid secrets (401), payload processing, DB writes (mock), error paths |

**3. Controllers (50+ symbols; HTTP handlers; 90% coverage)**  
Test req.method/body/headers → res.status/headers/json(); MSW sub-APIs.  
| Dir/Route | Symbols/Methods | Purpose | Test Priorities |
|-----------|-----------------|---------|-----------------|
| `app/api/slots/` | `GET` | Time slots availability | Query (?date=), empty/full, 200/400 |
| `app/api/ready/`, `pricing/`, `health/` | `GET` | Status/pricing/health checks | Static responses, env vars, 200/500 errors |
| `app/api/profile/` | `GET`, `PUT` | User profile fetch/update | Auth (Supabase), partial updates, validation |
| `app/api/contact/` | `POST` | Contact form submission | Body (name/email/phone), validation, queued response |
| `app/api/chat/`, `chat/status/` | `POST`, `GET` | Chat messages/status | Payload {message}, sessions, streaming? |
| `app/api/webhook/n8n/` | `POST` | n8n webhook | Headers['x-secret'], WebhookService call, 200/401 |
| `app/api/tracking/event/` | `POST` | Event tracking | Payload validation, utils/formatters usage |
| `app/api/notifications/send/` | `POST` | Send notifications | Body recipients/message, mock queue/DB |
| `app/api/financeiro/categorias/`, `[id]/` | `GET`, `POST` | Financial categories CRUD | Auth, list/create/update/delete, Supabase mocks |
| `app/api/config/public/` | `GET` | Public config | No auth, sanitized env |

**4. Components (UI; forms/agendas; 80% coverage)**  
`components/landing/`, `agenda/appointment-form/` : RTL user flows (phone/currency inputs → API POST).

## Best Practices (Codebase-Derived)
- **AAA**: Arrange (setup mocks/fixtures), Act (call/export), Assert (expect chains).
- **Test Names**: `test('should [action] [entity] when [condition]', async () => {})`.
- **Table-Driven Utils**:
  ```ts
  const cases = [ { input: '(555) 123-4567', expected: '+15551234567', valid: true }, ... ] as const;
  cases.forEach(({ input, expected, valid }) => test(`phoneUS: ${input}`, () => {
    expect(formatPhoneUS(input)).toBe(expected);
    expect(isValidPhoneUS(input)).toBe(valid);
  }));
  ```
- **Asserts**:
  ```ts
  expect(formatCurrency(1234.56)).toBe('$1,234.56');  // Utils
  expect(res.status).toBe(200); expect(await res.json()).toEqual(expectedBody);  // API
  await waitFor(() => expect(screen.getByRole('alert')).toBeVisible());  // RTL
  ```
- **Mocks**:
  ```ts
  vi.hoisted(() => ({ cn: vi.fn((...args) => args.filter(Boolean).join(' ')) })); vi.mock('./utils');
  // MSW
  server.use(rest.post('/api/contact', async (req, res, ctx) => res(ctx.json({ success: true }))));
  ```
- **API Helpers**:
  ```ts
  const createRequest = (method: string, body?: any, headers = {}) => new NextRequest('http://localhost', {
    method, headers: { 'Content-Type': 'application/json', ...headers }, body: body ? JSON.stringify(body) : undefined
  });
  ```
- **Async/Errors**: `await expect(POST(req)).rejects.toThrow('Invalid secret');`.
- **RTL**: `getByRole('textbox', { name: /phone/i })`; `userEvent.type`; avoid CSS/classes.
- **Cleanup**: `afterEach(() => { vi.clearAllMocks(); cleanup(); }); afterAll(server.close);`.
- **Coverage**: Prioritize branches (if/try); no snapshots; US locales.

## Workflows & Steps

### 1. Utils/Formatters (Priority Unit)
1. `analyzeSymbols lib/utils.ts` + `lib/formatters.ts` → Exports list.
2. `readFile lib/formatters.ts` → Edge cases (searchCode '\.test\.?|edge').
3. Generate `lib/formatters.test.ts` w/ fixtures/table-driven (25+ cases/phone-email-currency).
4. Run `vitest lib/formatters.test.ts --coverage` → Verify 100%; add roundtrips/throws.

### 2. Services (WebhookService)
1. `readFile lib/services/webhookService.ts` → Methods/params (secret, payload).
2. `lib/services/webhookService.test.ts`:
   ```ts
   vi.mock('../../supabase/server.ts');
   vi.mock('../../config');
   test('validates secret and processes n8n webhook', async () => {
     const service = new WebhookService();
     const result = await service.handle(validPayload, 'valid-secret');
     expect(createServerClient).toHaveBeenCalledWith(expect.anything(), { ... });
     expect(result).toEqual({ status: 'processed' });
   });
   test('rejects invalid secret', async () => {
     await expect(service.handle(payload, 'wrong')).rejects.toThrow('Unauthorized');
   });
   ```
3. Mock deps; paths: success/DB error/network.

### 3. API Routes (e.g., /contact, /webhook/n8n)
1. `listFiles 'app/api/contact/route.ts'` → Confirm POST.
2. `app/api/contact/route.test.ts`:
   ```ts
   import { POST } from './route';
   test('POST /contact with valid body', async () => {
     const req = createRequest('POST', { name: 'Test', phone: '(555)123-4567' });
     const res = await POST(req as any);
     expect(res.status).toBe(200);
     expect(await res.json()).toEqual({ message: 'Sent' });
   });
   ```
3. MSW internals; 400 invalid body; headers (secrets for n8n).

### 4. Components (Forms)
1. `listFiles 'components/agenda/appointment-form/*.tsx'`.
2. `.test.tsx`:
   ```tsx
   test('submits valid form', async () => {
     renderWithProviders(<AppointmentForm />);
     await userEvent.type(screen.getByLabelText(/phone/i), '(555) 123-4567');
     userEvent.click(screen.getByRole('button', { name: /book/i }));
     await waitFor(() => expect(screen.getByText(/success/i)).toBeInTheDocument());
     expect(postSpy).toHaveBeenCalledWith('/api/contact', expect.objectContaining({ phone: '+15551234567' }));
   });
   ```

### 5. Coverage Remediation
1. `vitest --coverage` → Identify gaps (utils branches, API conditions).
2. `searchCode 'app/api/.*if\s*\('` → Untested branches.
3. Add tests; iterate to targets.

### 6. Full Maintenance
1. `getFileStructure app/api/` + git changes.
2. Update colocated; cross-search imports.
3. Handoff: Tests added, coverage Δ, gaps, commands.

## Handoff Template
```
Tests: lib/formatters.test.ts (35 cases, 100%), webhookService.test.ts (15 tests, 96%), app/api/contact/route.test.ts (8 tests).
Coverage: Utils 100% (+25%), APIs 88% (+12%).
Gaps: app/api/carol/*, components/landing/.
Run: npm test app/api/ --coverage
PR: Ready
```
Update `docs/testing.md`.

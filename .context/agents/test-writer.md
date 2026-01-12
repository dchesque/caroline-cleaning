# Test Writer Agent Playbook

---
status: complete
generated: 2024-10-02
repository: C:\Workspace\carolinas-premium
testingFramework: Vitest + React Testing Library + MSW
coverageTarget: >90% utils/services/API, >70% components
---

## Mission
The Test Writer Agent maintains code quality by creating, expanding, and refactoring tests for unit, integration, and component levels in this Next.js/TSX app. Focus on high-impact areas: utils (pure functions), services (business logic), API controllers (route handlers), and UI components. Trigger on:
- New code/features (TDD: write tests first).
- Refactors or bug fixes (add regression tests).
- Coverage <80% on critical paths (utils/services/API).
- Changes to Supabase integrations, formatters, or chat/webhook flows.

## Responsibilities
- Unit tests: Pure utils/formatters (100% coverage goal).
- Integration tests: Services (e.g., WebhookService) and API routes (e.g., POST /api/chat).
- Component tests: RTL for .tsx in components/ and app/ (user flows, accessibility).
- Mocks: Supabase, HTTP (MSW), sessions; fixtures for chat payloads, currencies.
- Coverage analysis/fixes; update `vitest.config.ts` if needed.
- Document patterns in `docs/testing-strategy.md`.

## Testing Framework & Tools
- **Core**: Vitest (`npm test`); supports TS/JSX, ESM, fast watch mode.
- **Components**: `@testing-library/react`, `@testing-library/jest-dom`, `user-event`.
- **API Mocks**: MSW (`rest` handlers for /api/*); `vi.mock()` for modules.
- **Supabase**: Mock `createServerClient`/`createClient` from `lib/supabase/*`.
- **Coverage**: `vitest --coverage` (Vitest Istanbul); thresholds in `vitest.config.ts`.
- **Helpers**: `vi.spyOn`, `vi.mocked`; fake timers for dates/currency.
- **Run Commands**:
  ```
  npm test                    # All tests
  npm test --watch            # TDD
  npm test --coverage         # Reports (focus lib/, app/api/)
  vitest lib/utils.test.ts    # Specific file
  ```

## File Locations & Naming Conventions
- **Colocation Priority**:
  | Source Type | Test Location | Example |
  |-------------|---------------|---------|
  | Utils | Same dir, `.test.ts` | `lib/utils.test.ts` |
  | Formatters | Same dir | `lib/formatters.test.ts` |
  | Services | Same dir | `lib/services/webhookService.test.ts` |
  | API Routes | Same dir | `app/api/chat/route.test.ts` |
  | Components | Same dir | `components/chat/ChatWindow.test.tsx` |

- **Shared Test Assets**:
  ```
  __tests__/
  ├── fixtures/
  │   ├── chat-payloads.json
  │   ├── currency-inputs.json
  │   └── supabase-responses.json
  ├── mocks/
  │   ├── handlers.ts          # MSW for API
  │   ├── supabase.ts          # Supabase client mocks
  │   └── next-request.ts      # NextRequest helpers
  └── utils/
      ├── renderWithProviders.tsx  # RTL + QueryClient + Theme
      └── test-utils.ts            # Common matchers
  ```

## Key Project Areas & Focus Files
Prioritize based on layers/symbols (247 total; 31 utils, 40 API, 1 service detected).

### 1. Utils Layer (Highest Priority: Pure, 31 symbols)
**Dirs**: `lib/`, `lib/supabase/`, `lib/config/`, `lib/actions/`
**Purpose**: Shared helpers (formatting, validation); no deps.
**Key Files/Symbols**:
| File | Key Exports | Test Focus |
|------|-------------|------------|
| `lib/utils.ts` | `cn`, `formatCurrency`, `formatDate` | Inputs/outputs; locales, invalid strings |
| `lib/formatters.ts` | `formatPhoneUS`, `unformatPhone`, `isValidPhoneUS`, `isValidEmail`, `formatCurrencyUSD`, `formatCurrencyInput`, `parseCurrency` | Edge: malformed phone/email, zero/negative currency, NaN parsing |
| `lib/supabase/server.ts`, `client.ts` | `createServerClient`, `createClient` | Mock entirely; test no real DB calls |

**Patterns**: Synchronous units; exhaustive cases.
```ts
test('formatCurrency formats positive numbers', () => {
  expect(formatCurrency(1000)).toBe('$1,000.00');
});
```

### 2. Services Layer (Business Logic)
**Dirs**: `lib/services/`, `components/landing/`
**Key File**: `lib/services/webhookService.ts` (`WebhookService`)
**Test Focus**: Orchestration; mock HTTP/config/Supabase.

### 3. Controllers Layer (API Routes: 40 symbols)
**Dirs**: `app/api/slots/`, `ready/`, `pricing/`, `health/`, `contact/`, `chat/`, `webhook/n8n/`, `notifications/send/`, `chat/status/`, `config/public/`, `carol/query/`, `carol/actions/`
**Key Patterns**: Exported `GET`/`POST` handlers.
| Dir | Handler | Test Focus |
|-----|---------|------------|
| `app/api/slots/` | `GET` | Availability checks; mocks |
| `app/api/chat/` | `POST`, `status/GET` | Payload validation, sessions |
| `app/api/webhook/n8n/` | `POST` | Webhook payloads, secrets |
| `app/api/pricing/` | `GET` | Currency responses |
| `app/api/notifications/send/` | `POST` | Delivery mocks |

**Patterns**: `NextRequest`/`NextResponse`; assert status/JSON/headers.

### 4. Components (UI: 118 .tsx files)
**Dirs**: `components/` (chat UI, landing pages)
**Test Focus**: RTL behavior; mock API/services.

## Best Practices (Codebase-Derived)
- **AAA**: Arrange (setup/mocks), Act (call), Assert (expect).
- **Naming**: `test('should [verb] [subject] when [scenario]', () => {})`.
- **Coverage**: Branch > line; utils/services 100%, API 90%, components 70%.
- **Mocks**:
  - Supabase: `vi.mock('lib/supabase/server', () => ({ createServerClient: vi.fn() }))`.
  - API: MSW `rest.post('/api/chat', handler)`.
  - Minimal: Only externalities; test real utils/services.
- **Async/Errors**: `await expect(fn()).rejects.toThrow('Expected')`.
- **RTL**: `screen.getByRole('button', { name: /send/i })`; `userEvent` over `fireEvent`.
- **Fixtures**: `as const` TS literals; JSON for payloads.
- **Conventions**:
  - US locales for currency/phone.
  - Chat: Mock sessions, streaming responses.
  - Webhooks: Verify payloads/secrets.
- **Cleanup**: `afterEach(vi.clearAllMocks)`; RTL `cleanup`.

## Specific Workflows & Steps

### Workflow 1: Unit Test Utils/Formatters
1. `analyzeSymbols lib/formatters.ts` → List exports (e.g., `isValidPhoneUS`).
2. Create `lib/formatters.test.ts`.
3. TDD loop:
   ```
   Nominal: valid phone → true
   Edge: empty, non-US, letters → false/null
   ```
4. `vitest lib/formatters.test.ts --coverage`.
5. Commit: "test(formatters): 100% coverage for phone/email validators".

**Example**:
```ts
import { isValidPhoneUS } from './formatters';

const cases = [
  { input: '(555) 123-4567', expected: true },
  { input: 'invalid', expected: false },
] as const;
cases.forEach(({ input, expected }) => {
  test(`isValidPhoneUS ${input}`, () => {
    expect(isValidPhoneUS(input)).toBe(expected);
  });
});
```

### Workflow 2: Service Integration (e.g., WebhookService)
1. `readFile lib/services/webhookService.ts` → Analyze `handleWebhook`.
2. Create `lib/services/webhookService.test.ts`.
3. Mock deps: `vi.mock('../config/webhooks')`, `vi.mock('node-fetch')`.
4. Tests: Valid payload → success; invalid secret → 401.
5. `vitest lib/services/webhookService.test.ts`.

### Workflow 3: API Route Test (e.g., /api/chat POST)
1. `analyzeSymbols app/api/chat/route.ts` → Inspect `POST`.
2. Create `app/api/chat/route.test.ts`.
3. Setup: MSW for sub-calls; mock Supabase/services.
4. Use helper:
   ```ts
   const req = new NextRequest('http://localhost/api/chat', {
     method: 'POST',
     body: JSON.stringify({ message: 'hi' }),
   });
   const res = await POST(req as any);
   expect(res.status).toBe(200);
   ```
5. Test auth/errors; `vitest app/api/chat/route.test.ts --coverage`.

### Workflow 4: Component Test (e.g., Chat Component)
1. `listFiles 'components/chat/*.tsx'` → Target files.
2. Create `.test.tsx`; use `renderWithProviders`.
3. Tests:
   - Mounts: `expect(screen.getByRole('textbox')).toBeVisible()`.
   - Interact: `await userEvent.type(getByRole('textbox'), 'hello');`.
   - States: Loading (Query mock), error.
4. MSW for API; snapshots optional.
5. `vitest components/chat/ChatWindow.test.tsx`.

### Workflow 5: Coverage Gap Remediation
1. `vitest --coverage` → Review `coverage/lcov-report/index.html`.
2. Prioritize: Utils (31 symbols) → Services → API (40 handlers) → Components.
3. `searchCode 'untested function'` for gaps.
4. Add tests; re-run until >90%.

### Workflow 6: Refactor/Maintenance
1. `git diff --name-only` → Changed files.
2. Update colocated tests; mock new deps.
3. `searchCode 'from:changed-file'` → Consumer tests.

## Key Symbols Testing Checklist
- **Utils (31)**: All formatters (phone/email/currency; 10+ functions).
- **API (40)**: Every `GET`/`POST` (slots, chat, webhook, etc.).
- **Services (1+)**: `WebhookService` methods (payload handling).

## Documentation & Handoff
- Update `docs/testing-strategy.md`: Add patterns (e.g., "Mock Supabase universally").
- **Handoff Template**:
  ```
  - Added: X tests for [file], Y% coverage gain.
  - Gaps: [e.g., E2E auth flows].
  - Next: Review PR coverage.
  ```

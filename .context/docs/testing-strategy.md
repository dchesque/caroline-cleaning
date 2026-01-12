# Testing Strategy

This document outlines the testing philosophy, tools, and processes for the Carolinas Premium application—a Next.js 15 (App Router) project with TypeScript, React Server Components, Supabase integration, admin dashboards (`app/(admin)`), client management (`components/clientes`), chat widgets (`components/chat`), webhook handling (`types/webhook.ts`, `hooks/use-webhook.ts`), analytics charts (`components/analytics`), and landing pages. 

The current codebase (156 files: 118 `.tsx`, 36 `.ts`, 2 `.mjs`; 247 symbols) has **zero dedicated test files** (no `__tests__`, `*.test.tsx`, or `e2e/` observed via file listings/symbol analysis). This strategy introduces a **testing pyramid** (unit > integration > E2E) for scalable quality assurance, targeting 80%+ coverage in high-impact areas (utils, hooks, services). Static analysis (ESLint, TypeScript) and CI gates enforce standards.

## Coverage Goals

Prioritize by architecture (Utils: 31 symbols, Components: 119 symbols, Controllers/API: 40+ handlers):

| Module/Area | Target Coverage | Priority | Key Symbols/Files |
|-------------|-----------------|----------|-------------------|
| `lib/utils.ts`, `lib/formatters.ts` | 100% | High | `cn`, `formatCurrency`, `formatCurrencyUSD`, `exportToExcel` |
| `hooks/` | 95% | High | `useChat`, `useWebhook` (and notify hooks), `useChatSession` |
| `lib/supabase/*` | 90% | High | `createClient` (client/server), `Database` types |
| `components/chat/*` | 90% | High | `ChatWidget`, `ChatWindow`, `ChatInput`, `MessageBubbleProps` |
| `types/` & `lib/services/` | 85% | High | `Cliente`, `Agendamento`, `WebhookPayload` types; `WebhookService` |
| `app/api/*` routes | 80% | Medium | `chat/route.ts`, `webhook/n8n/route.ts`, `carol/query/route.ts` |
| `components/admin/*`, `components/analytics/*` | 75% | Medium | `AdminLayout`, `AgendaPage`, `ConversionFunnel`, `TrendsChartProps` |
| `app/(admin)/admin/*` pages | 70% | Low | `ClientesPage`, `ClienteDetalhePage`, `ClientesAnalyticsPage` |
| Landing/UI | 60% | Low | `AboutUs`, `AnnouncementBar`, `FAQ` |

Track via `vitest --coverage --coverage.reporter=html` (exclude `node_modules`, `e2e/`).

## Test Types

### Unit Tests
**Focus**: Pure functions, hooks, utils (no real DB/network). Fast (~100ms/test), isolated.

- **Framework**: Vitest + `@testing-library/react` (components/hooks), `@testing-library/jest-dom`, `jsdom`. Matches Vite/Next.js.
- **Targets**:
  - Utils: `cn('base', { modifier: true })` → `'base modifier'`.
  - Hooks: `useChat` message flow, `useNotifyAppointmentCreated` payloads.
  - Types: Implicit via `tsc --noEmit`; explicit with `expectType` from `@vitest/expect`.
- **File Naming**: Colocated `__tests__/utils.test.tsx` or `lib/utils.test.tsx`.
- **Examples**:
  ```tsx
  // hooks/use-chat.test.tsx
  import { renderHook, act } from '@testing-library/react';
  import { useChat } from './use-chat';
  import { vi } from 'vitest';

  test('useChat appends messages', () => {
    const { result } = renderHook(() => useChat());
    act(() => {
      result.current.append({ id: '1', role: 'user', content: 'Hi' });
    });
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].content).toBe('Hi');
  });

  // lib/utils.test.tsx
  import { cn, formatCurrency } from './utils';

  test('cn handles conditional classes', () => {
    expect(cn('btn', { 'btn-primary': true, 'btn-disabled': false })).toBe('btn btn-primary');
  });

  test('formatCurrency handles BRL', () => {
    expect(formatCurrency(1234.56)).toBe('R$ 1.234,56');
  });
  ```
- **Mocking**: `vi.mock('lib/supabase/client')`, MSW for fetch (e.g., webhook URLs from `lib/config/webhooks.ts`).

### Integration Tests
**Focus**: Hooks + services + DB/API (real/mocked Supabase). Tests real interactions.

- **Framework**: Vitest + Supabase test DB (`supabase start` or Docker).
- **Scenarios**:
  | Area | Examples |
  |------|----------|
  | API Routes | `POST /api/chat` (`ChatRequest`), `/api/webhook/n8n` (`IncomingWebhookPayload` verification). |
  | Hooks/Services | `useSendChatMessage` + `WebhookService`; `createClient` CRUD (`ClienteInsert`). |
  | DB | Insert/update `Agendamento`, query `AgendaHoje`; validate `DashboardStats`. |
- **Tooling**: `@supabase/supabase-js` test client, MSW interceptors, `vi.mock('lib/actions/webhook')`.
- **File Naming**: `**/*.integration.test.tsx`.
- **Example**:
  ```tsx
  // app/api/chat.integration.test.tsx
  import { createClient } from 'lib/supabase/server';
  import { POST } from './route';

  test('POST handles chat request', async () => {
    vi.mocked(createClient).mockReturnValue({ /* mock Supabase */ } as any);
    const res = await POST(new Request(JSON.stringify({ message: 'test' }), { method: 'POST' }));
    expect(await res.json()).toHaveProperty('response');
  });
  ```

### End-to-End (E2E) Tests
**Focus**: User flows across SSR/CSR. Smoke + critical paths.

- **Framework**: Playwright (auto-waits, traces, Next.js SSR support).
- **Scenarios**:
  | Flow | Pages/Components | Assertions |
  |------|------------------|------------|
  | Admin Login | `(auth)/layout.tsx` → `AdminLayout` → `ClientesPage` | Table rows (`Cliente` data), filters (`ClientsFilters`). |
  | Client CRUD | `ClientesPage` → `[id]/page.tsx` (`ClienteDetalhePage`) | Edit `ClienteUpdate`, tabs (`TabAgendamentosProps`). |
  | Agenda | `admin/agenda/page.tsx` (`AgendaPage`) | Switch views (`calendar-view.tsx`), slots (`/api/slots`). |
  | Chat | Landing → `ChatWidget` → `ChatWindow` | Send/receive (`useChat`), notifications (`ChatBubbleNotificationProps`). |
  | Analytics | `admin/analytics/clientes/page.tsx` | Charts (`TrendsChartProps`, `SatisfactionChartProps`), filters. |
  | Webhooks | Mock N8N payloads (`AppointmentCreatedPayload`) → UI updates. | DB changes via `useNotify*` hooks. |
  | Exports | `ClientesPage` → `exportToExcel`/`exportToPDF` | Download triggers. |
- **File Naming**: `e2e/admin.spec.ts`, `e2e/chat.spec.ts`.
- **Setup**: `playwright.config.ts`:
  ```ts
  export default defineConfig({
    projects: [{ name: 'local', use: { baseURL: 'http://localhost:3000' } }],
    use: { storageState: 'e2e/auth.json' }, // Pre-login state
  });
  ```
- **Auth**: `supabase.auth.signInAnonymously()` or storageState.

## Running Tests

**Dev Deps** (`npm i -D vitest@latest @testing-library/react @testing-library/jest-dom @vitest/ui playwright msw jsdom @vitest/expect`):
```bash
npm run test          # Unit + integration
npm run test:watch    # Watch + UI (http://localhost:51204/__vitest__)
npm run test:coverage # HTML report (coverage/)
npx playwright test   # E2E
npx playwright test --ui --project=local
npx playwright test --update-snapshots
```

**package.json Scripts**:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest --ui",
    "test:coverage": "vitest run --coverage --coverage.provider=v8",
    "test:e2e": "playwright test",
    "test:ci": "npm run lint && npm run test:coverage && playwright test --project=ci"
  }
}
```

**Supabase Local**: `npx supabase start` (use `supabase/.env.localtest` for test DB).

## Quality Gates & CI

| Gate | Tool | Threshold |
|------|------|-----------|
| Lint | ESLint (`eslint-config-next`) | 100% |
| Format | Prettier | 100% |
| Types | `tsc --noEmit` | 0 errors |
| Unit | Vitest coverage | 80% utils/hooks (config: `coverage.include=['lib/**','hooks/**']`) |
| E2E | Playwright | 100% critical flows |

**Husky Pre-commit** (`.husky/pre-commit`): `npm run lint && npm run format:check && npm run test`.

**.github/workflows/ci.yml**:
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build  # Next.js build
      - run: npm run test:ci
      - uses: ArtiomTr/jest-coverage-report-action@v2
        if: success()
        with: { testScript: npm run test:coverage }
      - run: npx playwright test --project=ci
```

**Branch Protection**: Require CI, status checks.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Flaky E2E (chat timeouts) | `await page.waitForResponse(/api\/chat`); `expect.poll` for async. |
| Supabase mocks | `vi.mock('lib/supabase/server', () => ({ createClient: vi.fn() }))`. |
| Coverage gaps | `--coverage.exclude='["**/*.d.ts"]'`; focus `hooks/use-*.ts`. |
| Webhook auth (`verifyAuth`) | Env `TEST_WEBHOOK_SECRET=test`; mock `getWebhookSecret`. |
| Next.js SSR | E2E with `next start`; unit with `render(<Component />)`. |
| Recharts mocks | `vi.mock('recharts', () => ({ ComposedChart: () => <div /> }))`. |

**Debug**: Vitest UI, Playwright Trace Viewer (`npx playwright show-trace`), `vitest --reporter=verbose`.

## Future Improvements
- **100% Utils/Hooks**: Automate with GitHub Actions coverage alerts.
- **Visual Regression**: `expect(page).toHaveScreenshot('chat-widget.png')`.
- **Contract Testing**: Supabase schemas vs `types/supabase.ts`.
- **Load/Chaos**: Artillery for `/api/chat`, webhook floods.
- **Cypress Migration?** No—Playwright faster for Next.js.

**Cross-References**:
- [Types](../types/index.ts) (e.g., `WebhookEventType`)
- [Hooks](../hooks/use-chat.ts), [../hooks/use-webhook.ts]
- [API Routes](../app/api/) (chat, webhooks)
- [Contributing](../CONTRIBUTING.md)

Update as tests land (track via PR labels: `test:unit`, `test:e2e`).

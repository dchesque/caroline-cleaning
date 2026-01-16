# Testing Strategy

This document outlines the testing philosophy, tools, and processes for the Carolinas Premium application—a Next.js 15 (App Router) project with TypeScript, React Server Components, Supabase integration, admin dashboards (`app/(admin)`), client management (`components/clientes`), chat widgets (`components/chat`), webhook handling (`types/webhook.ts`, `hooks/use-webhook.ts`), analytics charts (`components/analytics`), and landing pages.

The current codebase (183 files: 137 `.tsx`, 44 `.ts`, 2 `.mjs`; 284 symbols) has **zero dedicated test files** (no `__tests__`, `*.test.tsx`, or `e2e/` observed via file listings/symbol analysis). This strategy introduces a **testing pyramid** (unit > integration > E2E) for scalable quality assurance, targeting 80%+ coverage in high-impact areas (utils, hooks, services). Static analysis (ESLint, TypeScript) and CI gates enforce standards.

## Coverage Goals

Prioritize by architecture (Utils: 55 symbols, Components: 152 symbols, Controllers: 50 symbols, Repositories: 3 symbols):

| Module/Area | Target Coverage | Priority | Key Symbols/Files |
|-------------|-----------------|----------|-------------------|
| `lib/utils.ts`, `lib/formatters.ts` | 100% | High | `cn`, `formatCurrency`, `formatCurrencyUSD`, `formatPhoneUS`, `exportToExcel`, `exportToPDF` |
| `hooks/` | 95% | High | `useChat`, `useChatSession`, `useWebhook`, `useSendChatMessage`, `useNotifyLeadCreated`, `useNotifyAppointmentCreated` |
| `lib/supabase/*` | 90% | High | `createClient` (client/server), `Database` types, `updateSession` |
| `components/chat/*` | 90% | High | `ChatWidget`, `ChatWindow`, `ChatInput`, `ChatMessage` |
| `types/` & `lib/services/` | 85% | High | `Cliente`, `ClienteInsert`, `ClienteUpdate`, `Agendamento`, `WebhookPayload`, `WebhookService` |
| `app/api/*` routes | 80% | Medium | `chat/route.ts` (`ChatRequest`), `webhook/n8n/route.ts` (`IncomingWebhookPayload`), `tracking/event/route.ts` (`EventPayload`) |
| `components/admin/*`, `components/analytics/*` | 75% | Medium | `AdminLayout`, `AdminHeader`, `AgendaPage`, `ConversionFunnel`, `ClientsFilters` |
| `app/(admin)/admin/*` pages | 70% | Low | `ClientesPage`, `ClienteDetalhePage`, `ClientesAnalyticsPage`, `ConfiguracoesPage` |
| Landing/UI | 60% | Low | `AboutUs`, `AnnouncementBar`, `PricingItem` |

Track via `vitest --coverage --coverage.reporter=html` (exclude `node_modules`, `e2e/`, `*.d.ts`).

## Test Types

### Unit Tests
**Focus**: Pure functions, hooks, utils (no real DB/network). Fast (~100ms/test), isolated.

- **Framework**: Vitest + `@testing-library/react` (components/hooks), `@testing-library/jest-dom`, `jsdom`. Matches Vite/Next.js.
- **Targets**:
  - Utils: `cn('base', { modifier: true })` → `'base modifier'`; `formatCurrency(1234.56)` → `'R$ 1.234,56'`.
  - Hooks: `useChat` message append; `useNotifyAppointmentCreated` payload matching (`AppointmentCreatedPayload`).
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
      result.current.append({ id: '1', role: 'user', content: 'Hi' } as ChatMessage);
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
- **Mocking**: `vi.mock('lib/supabase/client')`, MSW for fetch (e.g., `getWebhookUrl` from [`lib/config/webhooks.ts`](../lib/config/webhooks.ts)).

### Integration Tests
**Focus**: Hooks + services + DB/API (real/mocked Supabase). Tests real interactions.

- **Framework**: Vitest + Supabase test DB (`npx supabase start` or Docker).
- **Scenarios**:

  | Area | Examples |
  |------|----------|
  | API Routes | `POST /api/chat` (`ChatRequest`), `/api/webhook/n8n` (`IncomingWebhookPayload` + `WebhookEventType` verification), `/api/notifications/send` (`NotificationPayload`). |
  | Hooks/Services | `useSendChatMessage` + `WebhookService`; `createClient` + `ClienteInsert`/`AgendamentoInsert` CRUD. |
  | DB | Insert/update `Agendamento`/`Cliente`, query `AgendaHoje`/`DashboardStats`; validate `BusinessSettings`. |

- **Tooling**: `@supabase/supabase-js` test client, MSW interceptors, `vi.mock('lib/actions/webhook')`.
- **File Naming**: `**/*.integration.test.tsx`.
- **Example**:
  ```tsx
  // app/api/chat.integration.test.tsx
  import { createClient } from 'lib/supabase/server';
  import { POST } from './route';
  import { vi } from 'vitest';

  test('POST handles chat request', async () => {
    const mockClient = { from: vi.fn() } as any;
    vi.mocked(createClient).mockReturnValue(mockClient);
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
  | Admin Login | `(auth)/layout.tsx` (`AuthLayout`) → `(admin)/layout.tsx` (`AdminLayout`) → `ClientesPage` | Table rows (`ClientsTableProps`), filters (`ClientsFilters`). |
  | Client CRUD | `ClientesPage` → `[id]/page.tsx` (`ClienteDetalhePage`) | Edit `ClienteUpdate`, related tabs (e.g., `AgendaHoje`). |
  | Agenda | `admin/agenda/page.tsx` (`AgendaPage`) | Switch `CalendarView` (`ViewType`), form (`AppointmentFormData`). |
  | Chat | Landing → `ChatWidget` → `ChatWindow` | Send/receive (`useChat`), `ChatMessagePayload` notifications. |
  | Analytics | `admin/analytics/clientes/page.tsx` (`ClientesAnalyticsPage`) | Charts (`ConversionFunnel`), data (`DashboardStats`). |
  | Webhooks | Config (`ConfiguracoesPage` → webhooks tabs) + mock N8N (`AppointmentCreatedPayload`) | UI updates via `useNotify*` hooks, DB persistence. |
  | Financeiro | `admin/financeiro/categorias/page.tsx` (`CategoriasPage`) | `CategoryQuickForm`, `TransactionFormProps`. |
  | Exports | `ClientesPage` → `exportToExcel`/`exportToPDF` | File download triggers. |

- **File Naming**: `e2e/admin.spec.ts`, `e2e/chat.spec.ts`, `e2e/agenda.spec.ts`.
- **Setup**: `playwright.config.ts`:
  ```ts
  import { defineConfig } from '@playwright/test';

  export default defineConfig({
    projects: [
      { name: 'local', use: { baseURL: 'http://localhost:3000' } },
      { name: 'ci', use: { baseURL: 'http://localhost:3000' } }
    ],
    use: { 
      storageState: 'e2e/auth.json', // Pre-login admin state
      trace: 'on-first-retry'
    },
  });
  ```
- **Auth**: Service role key for test DB; `supabase.auth.signInAnonymously()` or storageState.

## Running Tests

**Dev Deps** (`npm i -D vitest@latest @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitest/ui playwright msw jsdom @vitest/expect`):
```bash
npm run test          # Unit + integration
npm run test:watch    # Watch + UI (http://localhost:51204/__vitest__)
npm run test:coverage # HTML report (coverage/)
npx playwright test   # E2E
npx playwright test --ui --project=local
npx playwright test --update-snapshots
npx playwright show-trace e2e/trace.zip  # Debug traces
```

**package.json Scripts**:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest --ui --coverage",
    "test:coverage": "vitest run --coverage --coverage.provider=v8 --coverage.reporter=html",
    "test:e2e": "playwright test",
    "test:ci": "npm run lint && npm run test:coverage && playwright test --project=ci"
  }
}
```

**Supabase Local**: `npx supabase start` (use `supabase/.env.localtest`; reset schema via migrations).

## Quality Gates & CI

| Gate | Tool | Threshold |
|------|------|-----------|
| Lint | ESLint (`eslint-config-next`, `eslint-plugin-testing-library`) | 100% |
| Format | Prettier | 100% |
| Types | `tsc --noEmit` | 0 errors |
| Unit/Integration | Vitest coverage | 80% utils/hooks/services (`coverage.include=['lib/**','hooks/**','types/**']`) |
| E2E | Playwright | 100% pass rate (critical flows) |

**Husky Pre-commit** (`.husky/pre-commit`): 
```bash
npm run lint -- --fix && npm run format:check && npm run test
```

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
        with: { testScript: 'npm run test:coverage' }
      - uses: dorny/paths-filter@v3
        id: changes
        with:
          filters: |
            tests:
              - '**.test.tsx'
              - '**.spec.ts'
      - run: npx playwright test --project=ci
        if: steps.changes.outputs.tests == 'true'
```

**Branch Protection**: Require CI status checks, `test:unit`/`test:e2e` labels for merges.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Flaky E2E (chat/webhook timeouts) | `await page.waitForResponse(/api\/chat/);` `expect.poll(() => page.locator('text=response'));` |
| Supabase mocks inconsistent | `vi.mock('lib/supabase/server', () => ({ createClient: vi.fn(() => mockSupabase) }))`; use test DB URL. |
| Coverage gaps | `--coverage.exclude='["**/*.d.ts","node_modules/**"]'`; add tests for `useNotify*` hooks. |
| Webhook auth failures | Env `TEST_WEBHOOK_SECRET=test123`; mock `getWebhookSecret`/`isWebhookConfigured`. |
| Next.js SSR hydration | E2E: `next start`; unit: `render(<Component />, { wrapper: QueryClientWrapper })`. |
| Charts/Recharts mocks | `vi.mock('recharts', () => ({ ComposedChart: () => <div data-testid="chart" /> }))`. |
| Rate limiting | Mock `rateLimit` in `middleware.ts`; increase thresholds in tests. |

**Debug Tools**: Vitest UI (coverage hotspots), Playwright Trace Viewer/Inspector, `DEBUG=pw:api npx playwright test`.

## Future Improvements
- **Automate Coverage**: GitHub Actions alerts on <80% thresholds.
- **Visual Regression**: `@playwright/test` screenshots (`expect(page).toHaveScreenshot('agenda-calendar.png')`).
- **Contract Testing**: Supabase schemas vs `types/supabase.ts`/`types/index.ts` (Pact or JSON Schema).
- **Component Stories**: Storybook for `ChatWidget`, `CalendarView` (visual + interaction tests).
- **Load Testing**: Artillery/K6 for `/api/chat`, webhook bursts (`WebhookService`).
- **Mutation Testing**: Stryker for code resilience.

**Cross-References**:
- [Types](../types/index.ts) (`Cliente`, `Agendamento`, `WebhookEventType`)
- [Hooks](../hooks/use-chat.ts), [../hooks/use-webhook.ts)
- [API Routes](../app/api/) (chat, webhooks, tracking)
- [Utils](../lib/utils.ts), [Supabase](../lib/supabase/server.ts), [Business Config](../lib/business-config.ts)
- [Admin Webhooks UI](../app/(admin)/admin/configuracoes/webhooks/)

Update as tests are implemented (track via PR labels: `test:unit`, `test:integration`, `test:e2e`). Aim for incremental rollout starting with utils/hooks.

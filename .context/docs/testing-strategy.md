# Testing Strategy

This document outlines the testing philosophy, tools, and processes for the Carolinas Premium application—a Next.js 15 (App Router) project with TypeScript, React Server Components, Supabase integration, admin dashboards (`app/(admin)`), client management (`components/clientes`), chat widgets (`components/chat`), webhook handling (`types/webhook.ts`, `lib/services/webhookService.ts`), analytics charts (`components/analytics`), and landing pages.

The current codebase (183 files: 137 `.tsx`, 44 `.ts`, 2 `.mjs`; 284 symbols) has **limited dedicated test files**—primarily unit tests in `lib/ai/state-machine/__tests__/` (e.g., `engine.test.ts`, `flow-new-customer.test.ts`, `flow-cancel.test.ts`) and scenario scripts in `scripts/` (e.g., `test_chat_scenarios.ts`, `run_booking_scenarios.ts`, `test_agent_direct.ts`). No E2E tests (`e2e/` or `*.spec.ts`) or broad coverage for utils/hooks/components. This strategy introduces a **testing pyramid** (unit > integration > E2E) for scalable quality assurance, building on existing AI tests, targeting 80%+ coverage in high-impact areas (utils, hooks, services, AI state machine). Static analysis (ESLint, TypeScript) and CI gates enforce standards.

## Coverage Goals

Prioritize by architecture (Utils: 55 symbols, Components: 152 symbols, Controllers: 50 symbols, AI/State Machine: key classes like `CarolStateMachine`):

| Module/Area | Target Coverage | Priority | Key Symbols/Files |
|-------------|-----------------|----------|-------------------|
| `lib/utils.ts`, `lib/formatters.ts` | 100% | High | `cn`, `formatCurrency`, `formatCurrencyUSD`, `formatPhoneUS`, `isValidEmail` |
| `hooks/` (inferred from usage) | 95% | High | `useChat` (via `components/chat`), `useWebhook` (`UseWebhookResult`), `useCarolChat` (`UseCarolChatReturn`) |
| `lib/supabase/*` | 90% | High | `createClient` (client/server), `Database` types |
| `lib/ai/*`, `lib/ai/state-machine/*` | 90% | High | `CarolAgent`, `CarolStateMachine`, `CarolLLM`, `buildCarolPrompt`; extend existing `__tests__/` |
| `components/chat/*` | 90% | High | `ChatWidget`, `ChatWindow`, `ChatInput`; `ChatMessage`, `ChatResponse` |
| `types/` & `lib/services/` | 85% | High | `Cliente`, `ClienteInsert`, `ClienteUpdate`, `Agendamento`, `WebhookPayload`, `WebhookService`, `ChatLoggerService` |
| `app/api/*` routes | 80% | Medium | `/api/chat` (`ChatMessagePayload`), `/api/webhook/n8n` (`IncomingWebhookPayload`), `/api/tracking/event` (`EventPayload`), `/api/notifications/send` (`NotificationPayload`) |
| `components/admin/*`, `components/analytics/*` | 75% | Medium | `AdminLayout`, `AdminHeader`, `AgendaPage`, `ClientsFilters` |
| `app/(admin)/admin/*` pages | 70% | Low | `ClientesPage`, `ClienteDetalhePage`, `ClientesAnalyticsPage` |
| Landing/UI | 60% | Low | `AnnouncementBar`, landing components |

Track via `vitest --coverage --coverage.reporter=html` (exclude `node_modules`, `e2e/`, `*.d.ts`, `scripts/`).

## Test Types

### Unit Tests
**Focus**: Pure functions, hooks, utils, AI logic (no real DB/network). Fast (~100ms/test), isolated. Build on existing `lib/ai/state-machine/__tests__`.

- **Framework**: Vitest + `@testing-library/react` (components/hooks), `@testing-library/jest-dom`, `jsdom`. Matches Vite/Next.js.
- **Targets**:
  - Utils: `cn('base', { modifier: true })` → `'base modifier'`; `formatCurrency(1234.56)` → `'R$ 1.234,56'`.
  - AI: `CarolStateMachine` transitions (`CarolState`), `buildCarolPrompt` outputs; mock `CarolLLM`.
  - Hooks: Message handling in chat hooks; `useWebhookResult`.
  - Types: `expectTypeOf<ClienteInsert>()`.
- **File Naming**: Colocated `__tests__/utils.test.tsx`, `lib/utils.test.ts`; extend `lib/ai/state-machine/__tests__/`.
- **Examples**:
  ```tsx
  // lib/utils.test.ts
  import { cn, formatCurrency } from './utils';
  import { expect, test } from 'vitest';

  test('cn handles conditional classes', () => {
    expect(cn('btn', { 'btn-primary': true, 'btn-disabled': false })).toBe('btn btn-primary');
  });

  test('formatCurrency handles BRL', () => {
    expect(formatCurrency(1234.56)).toBe('R$ 1.234,56');
  });
  ```
  ```tsx
  // lib/ai/state-machine/engine.test.ts (extend existing)
  import { CarolStateMachine } from './engine';
  import { vi } from 'vitest';

  test('transitions from greeting to booking', () => {
    const machine = new CarolStateMachine({ handlers: {} });
    // Simulate input, assert state change
  });
  ```
- **Mocking**: `vi.mock('lib/supabase/client')`, `vi.mock('lib/ai/llm')`; MSW for API calls (e.g., Supabase).

### Integration Tests
**Focus**: Services + DB/API + hooks (mocked/real Supabase). Test real interactions like `ChatLoggerService`, `WebhookService`.

- **Framework**: Vitest + Supabase test DB (`npx supabase start` or Docker).
- **Scenarios**:

  | Area | Examples |
  |------|----------|
  | API Routes | `POST /api/carol/query`, `/api/carol/actions` (`ActionType`), `/api/webhook/n8n` (`WebhookEventType` verification). |
  | Services | `ChatLoggerService.logInteraction` (`LogInteractionParams`), `WebhookService` payloads (`AppointmentCreatedPayload`). |
  | DB | CRUD `Cliente`/`Agendamento`; query `AgendaHoje`; `BusinessSettings` persistence. |
  | AI Flows | `CarolAgent` + state machine handlers (`lib/ai/state-machine/handlers/*`). |

- **Tooling**: `@supabase/supabase-js` test client, MSW, `vi.mock('lib/services/chat-logger')`.
- **File Naming**: `**/*.integration.test.tsx`.
- **Example**:
  ```tsx
  // lib/services/chat-logger.integration.test.ts
  import { ChatLoggerService } from './chat-logger';
  import { createClient } from 'lib/supabase/server';
  import { vi, test } from 'vitest';

  test('logs chat interaction', async () => {
    const mockSupabase = { from: vi.fn().mockReturnThis() } as any;
    vi.mocked(createClient).mockReturnValue(mockSupabase as any);
    const service = new ChatLoggerService();
    await service.logInteraction({ sessionId: 'test', message: 'Hi' });
    expect(mockSupabase.from).toHaveBeenCalledWith('chat_logs');
  });
  ```

### End-to-End (E2E) Tests
**Focus**: User flows across SSR/CSR. Smoke + critical paths. Test chat scenarios from scripts.

- **Framework**: Playwright (auto-waits, traces, Next.js SSR support).
- **Scenarios**:

  | Flow | Pages/Components | Assertions |
  |------|------------------|------------|
  | Admin Login | `(auth)/login` → `(admin)/layout` (`AdminLayout`) → `ClientesPage` | Table data, `ClientsFilters`. |
  | Client CRUD | `admin/clientes` → `[id]` (`ClienteDetalhePage`) | `ClienteUpdate`, tabs (`AgendaHoje`). |
  | Agenda | `admin/agenda` (`AgendaPage`, `CalendarView`) | Form submission (`AppointmentFormData`). |
  | Chat Widget | Landing → `ChatWidget` → `ChatWindow` | Message exchange (`ChatMessagePayload`), state machine flows. |
  | Analytics | `admin/analytics/*` (`ClientesAnalyticsPage`) | Charts data (`DashboardStats`). |
  | Webhooks/N8N | Config pages + simulate payloads (`LeadCreatedPayload`) | UI notifications, DB inserts. |
  | Financeiro | `admin/financeiro/categorias` (`CategoriasPage`) | `CategoryQuickForm`. |
  | AI Scenarios | Chat → booking/cancel (extend `scripts/run_booking_scenarios.ts` logic) | End states, DB consistency. |

- **File Naming**: `e2e/admin.spec.ts`, `e2e/chat.spec.ts`, `e2e/ai-flows.spec.ts`.
- **Setup**: `playwright.config.ts` (use `storageState` for auth).

## Running Tests

**Dev Deps** (`npm i -D vitest@latest @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitest/ui playwright msw jsdom @vitest/expect`):
```bash
npm run test          # Unit + integration (run existing + new)
npm run test:watch    # Watch + UI (http://localhost:51204/__vitest__)
npm run test:coverage # HTML report (coverage/)
npx playwright test   # E2E
npx playwright test --ui
```

**package.json Scripts**:
```json
{
  "scripts": {
    "test": "vitest run lib/**/__tests__/**/* scripts/test_* && vitest run",
    "test:watch": "vitest --ui --coverage",
    "test:coverage": "vitest run --coverage --coverage.provider=v8 --coverage.reporter=html --coverage.include=['lib/**','hooks/**','components/chat/**','types/**']",
    "test:e2e": "playwright test",
    "test:ci": "npm run lint && npm run test:coverage && playwright test --project=ci"
  }
}
```

**Supabase Local**: `npx supabase start` (test DB).

**Existing Scripts**: Run `node scripts/test_chat_scenarios.ts`, `node scripts/run_booking_scenarios.ts` for AI smoke tests.

## Quality Gates & CI

| Gate | Tool | Threshold |
|------|------|-----------|
| Lint | ESLint | 100% |
| Format | Prettier | 100% |
| Types | `tsc --noEmit` | 0 errors |
| Unit/Integration | Vitest | 80% (utils/hooks/services/AI) |
| E2E | Playwright | 100% pass (critical) |

**Husky**: Lint/format/test on pre-commit.  
**GitHub CI**: Build + test:ci + coverage report.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| AI mocks | `vi.mock('lib/ai/llm', () => ({ CarolLLM: vi.fn() }))` |
| Supabase | Test DB URL; reset via `supabase db reset` |
| Flaky chat | `await page.waitForResponse(/api\/chat/);` |
| Scripts | Env vars for API keys; `DEBUG=true node scripts/...` |
| Coverage | Include `lib/ai/**` |

**Debug**: Vitest UI, Playwright traces, `vitest --reporter=verbose`.

## Future Improvements
- Integrate scenario scripts into Vitest.
- Visual regression, load tests for chat/webhooks.
- Mutation testing, Storybook for components.
- Contract tests for Supabase types.

**Cross-References**:
- [AI State Machine](../lib/ai/state-machine/) (`CarolStateMachine`, handlers)
- [Services](../lib/services/) (`ChatLoggerService`, `WebhookService`)
- [Types](../types/) (`WebhookPayload`, `Cliente`)
- [Utils](../lib/utils.ts)
- Existing tests: [AI Tests](../lib/ai/state-machine/__tests__/), [Scripts](../scripts/)

Update with progress (PR labels: `test:unit`, etc.). Incremental rollout: utils → AI → chat → E2E.

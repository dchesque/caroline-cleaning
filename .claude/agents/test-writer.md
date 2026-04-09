# Test Writer Agent Playbook

## Mission
Engage as the Test Writer Agent to author, expand, and maintain comprehensive tests across unit, integration, edge cases, and API layers in this Next.js 15/TypeScript codebase for a US-centric cleaning service. Support the team by ensuring 100% coverage on utils/formatters, 95% on services, 90% on API routes, and 80% on components. Activate on new code, refactors, bugs (repro + fix), coverage gaps, or high-risk changes (webhooks, notifications, formatters). Prioritize TDD workflows: write tests first, implement, verify coverage. Focus on test maintainability with colocation, mocks (vi.mock/MSW), fixtures, and table-driven cases for US-specific edges (phones E.164, currencies USD, emails).

## Responsibilities
- Write unit tests for utils/formatters using table-driven cases covering invalid inputs, roundtrips, and precision edges.
- Develop integration tests for services like WebhookService and ChatLoggerService, mocking Supabase/config/Twilio with vi.mock.
- Create API route tests for handlers (GET/POST/PUT) using NextRequest/NextResponse, asserting status/JSON/headers, with MSW for sub-calls.
- Author component tests with React Testing Library for forms (appointment/contact), simulating user events, a11y queries, and API interactions.
- Maintain mocks/fixtures/helpers in `__tests__/mocks/`, `__tests__/fixtures/`, `__tests__/helpers.ts`.
- Analyze coverage gaps via `vitest --coverage`, remediate branches/paths using searchCode for 'if' patterns or TODOs.
- Update existing test patterns in `lib/ai/state-machine/__tests__/`, extending flow tests (new-customer, cancel, engine).
- Document test strategies in `docs/testing.md`; generate handoff summaries for PRs.

## Best Practices
- Follow AAA pattern: Arrange (mocks/fixtures/setup), Act (invoke function/handler), Assert (expect chains, no snapshots).
- Use descriptive names: `test('should format US phone to E.164 when input is (555) 123-4567', () => {})`.
- Table-driven for utils: Define `const cases = [...] as const; cases.forEach(...)`.
- Mock hoisted: `vi.hoisted(() => ({ default: vi.fn() })); vi.mock('lib/supabase')`.
- MSW for APIs: `rest.post('/api/chat', handler)` in `__tests__/mocks/handlers.ts`.
- RTL queries: `getByRole/label/text`, `userEvent.type/click`, `waitFor`.
- Fake timers: `vi.useFakeTimers()` for dates/notifications/crons.
- Error paths: `await expect(handler(req)).rejects.toThrow('Expected error')`.
- Cleanup: `afterEach(vi.clearAllMocks, cleanup); afterAll(server.close)`.
- Coverage: Target branches (if/try), US locales ('en-US'), exhaustive edges (null/empty/invalid).
- Colocate tests: `{file}.test.ts` next to source; use fixtures for payloads/cases.

## Key Project Resources
- [Documentation Index](../docs/README.md)
- [Agent Handbook](README.md)
- [AGENTS.md](../../AGENTS.md)
- [Contributor Guide](../CONTRIBUTING.md)

## Repository Starting Points
- `lib/`: Core utils (utils.ts, formatters), services (services/), AI state-machine with existing tests (__tests__/).
- `app/api/`: 20+ route handlers (slots/, profile/, chat/, webhook/n8n/, notifications/, financeiro/); colocate route.test.ts.
- `components/`: UI forms (landing/, agenda/appointment-form/); test user flows and API posts.
- `__tests__/`: Shared fixtures/mocks/helpers for cross-layer reuse.
- `docs/`: Testing guidelines (testing.md) to append strategies.

## Key Files
- `lib/utils.ts`: Entry for cn/formatCurrency/formatDate; pure functions, 100% coverage target.
- `lib/services/webhookService.ts`, `lib/services/chat-logger.ts`: Business logic; mock deps, test orchestration.
- `lib/ai/state-machine/__tests__/flow-new-customer.test.ts`, `flow-cancel.test.ts`, `engine.test.ts`: Existing flow/integration patterns; extend with makeDefaultContext/buildMockServices.
- `app/api/slots/route.ts`, `app/api/chat/route.ts`, `app/api/webhook/n8n/route.ts`: Handler examples; test req/res flows.
- `__tests__/fixtures/utils-cases.json`, `__tests__/mocks/handlers.ts`: Reusable data/MSW setups.
- `vitest.config.ts`: Config for coverage/MSW/vi.mocks.

## Architecture Context
- **Utils** (`lib/`, `lib/tracking/`, etc.): 10+ pure exports (cn, formatCurrency); no deps; focus table-driven units.
- **Services** (`lib/services/`, `components/landing/`): Classes like WebhookService/ChatLoggerService; 95% coverage; mock Supabase/notifications.
- **Controllers** (`app/api/*`, `lib/ai/state-machine/handlers/`): 50+ handlers (GET/POST); 90% coverage; test HTTP lifecycle.

## Key Symbols for This Agent
- `makeDefaultContext` @ lib/ai/state-machine/__tests__/flow-new-customer.test.ts:26: Test setup helper.
- `buildMockServices` @ lib/ai/state-machine/__tests__/flow-new-customer.test.ts:59: In-memory session mocks.
- `buildMockLlm` @ lib/ai/state-machine/__tests__/flow-new-customer.test.ts:117: LLM mocking for flows.
- `driveToCollectPhone` @ lib/ai/state-machine/__tests__/flow-new-customer.test.ts:131: Flow drivers for edges.
- `formatCurrency` @ lib/utils.ts:10: USD formatter; test precision/NaN.
- `notify` @ lib/notifications.ts:56: Notification service; mock in API tests.
- `WebhookService` @ lib/services/webhookService.ts: Service for n8n; secret validation paths.
- `ChatLoggerService` symbols (`HandlerRecord`, `LogInteractionParams`) @ lib/services/chat-logger.ts: Logging integration.

## Documentation Touchpoints
- [Testing Guidelines](../docs/testing.md): Append new strategies, coverage reports.
- [API Routes Docs](../docs/README.md#api-routes): Reference for handler contracts.
- [Utils/Services Patterns](README.md#architecture): Conventions for mocking.
- [AGENTS.md](../../AGENTS.md#test-writer): Workflow integration.

## Collaboration Checklist
1. Confirm assumptions: Use `readFile` on source, `analyzeSymbols` for exports, `listFiles '**/*.test.ts'` for patterns.
2. Review changes: `getFileStructure` on lib/app/api/, `searchCode` for uncovered branches/TODOs.
3. Write/update tests: Colocate, run `vitest --coverage --watch`, iterate to targets.
4. Verify: `npm test [glob] --coverage`; check mocks called, edges (invalid US phones/currencies).
5. Update docs: Append to `docs/testing.md` with examples/fixtures.
6. Handoff PR: Summary of added tests, coverage delta, gaps, run commands.

## Hand-off Notes
Upon completion, summarize: "Added 25 utils cases (100% coverage), 12 WebhookService tests (96%), 10 API route tests (92%). Gaps: app/api/carol/, components/landing/. Run `npm test --coverage`. PR ready; risks mitigated (secrets/notifs). Follow-up: Integrate with code-review agent." Update `docs/testing.md`.

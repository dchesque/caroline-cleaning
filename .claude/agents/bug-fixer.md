# Bug Fixer Agent Playbook

## Mission
Engage this agent whenever a bug report surfaces via user feedback, Vercel logs, Supabase errors, or test failures in this Next.js 14+ TypeScript app for Caroline Cleaning services. The agent supports the team by performing root cause analysis on issues in high-risk areas like API controllers (unhandled exceptions), utils (formatting crashes), services (chat logging/webhook orchestration), and AI state machine handlers. Prioritize minimal fixes with zero side effects—add guards, logging, and tests without refactors—then verify regressions via local repro, unit tests, and CI. This ensures rapid resolution while upholding codebase conventions, preventing escalations to DB schema changes or UI hydration mismatches.

## Responsibilities
- Triage bug reports by layer (Utils, Services, Controllers, AI State Machine) using stack traces, logs, or repro steps.
- Reproduce bugs locally with `npm run dev`, curl/Postman for APIs, browser devtools for UI, and Supabase dashboard for DB issues.
- Conduct root cause analysis: trace from symptom (e.g., 500 error) through call stacks to utils/services/DB.
- Implement targeted fixes: 1-3 line patches like input guards (`isValidPhoneUS`), try/catch wrappers, or structured logging.
- Add or update unit tests covering the fix, edge cases (null/empty/invalid inputs), and >80% coverage on affected paths.
- Verify fixes with `npm test`, `npm run lint -- --fix`, manual curls, and full local E2E flows.
- Document inline with `// FIX: [description] (repro: [steps])` and prepare PRs with conventional commits (e.g., `fix(api/chat: add payload validation`).
- Log learnings in chat-logs or tests to prevent recurrence.

## Best Practices
- Always start with tools: `getFileStructure()`, `listFiles('app/api/**/*.ts')`, `searchCode('req\\.json\\(\\)')` for patterns, `analyzeSymbols('lib/utils.ts')` for dependencies.
- Match conventions: Use `try/catch` in all API handlers; `cn()` for conditional Tailwind; `isValid*()` guards before formatting/parsing.
- Minimize changes: Prefer early returns (400s for invalid inputs) over deep refactors; reuse existing services like `ChatLoggerService` or `WebhookService`.
- Log structured: `console.error({ endpoint: __filename, payload: await req.text(), error: error.message })`.
- Test mocks: Use `buildMockServices`, `buildMockLlm` patterns from `__tests__` for AI flows; mock Supabase with `createClient()`.
- Prevent regressions: Run full suite post-fix; check coverage; simulate production (rate limits, empty payloads).
- No new deps: Extend `types/index.ts` if needed; use Zod from `lib/env.ts` for payloads.
- Commit cleanly: `fix(layer/file: brief desc + test)`; include repro in PR body.

## Key Project Resources
- [Documentation Index](../docs/README.md): Central hub for setup, deployment, and troubleshooting.
- [Repository README](README.md): Quickstart, env setup, and local dev instructions.
- [Agents Handbook](../../AGENTS.md): Guidelines for all AI agents, collaboration protocols, and escalation paths.
- [Contributor Guide](../docs/contributing.md): PR standards, testing requirements, and code review checklists (if present).

## Repository Starting Points
- `lib/`: Core utilities, services, AI state machine—focus here for formatting, logging, and orchestration bugs (e.g., `lib/utils.ts`, `lib/services/`).
- `app/api/`: All API routes and controllers—primary hotspot for 400/500 errors (e.g., `app/api/chat/`, `app/api/webhook/`).
- `lib/ai/state-machine/`: AI conversation handlers and types—target for flow/guardrail failures (e.g., `handlers/`, `__tests__/`)
- `lib/services/`: Business logic like chat-logger and webhooks—check for payload mismatches.
- `components/`: UI forms and landing—hydration or input bugs (e.g., `components/agenda/appointment-form/`).

## Key Files
- `lib/services/chat-logger.ts`: Chat logging service; fix `LogInteractionParams` or `SessionSummary` handling.
- `lib/ai/state-machine/types.ts`: Core types like `HandlerResult`; extend for new payloads.
- `lib/ai/state-machine/handlers/index.ts`: Registers all handlers (`registerAllHandlers`); entry for AI routing bugs.
- `lib/ai/state-machine/handlers/guardrail.ts`: Intent routing (`routeByIntent`); fix classification errors.
- `lib/ai/state-machine/handlers/booking.ts`: Booking logic (`normalizePreference`); date/time validation issues.
- `lib/ai/state-machine/__tests__/flow-new-customer.test.ts`: Repro new customer flows; mock helpers like `buildMockServices`.
- `lib/ai/state-machine/__tests__/flow-cancel.test.ts`: Cancellation flows; extend for edge cases.
- `lib/ai/state-machine/__tests__/engine.test.ts`: Engine tests; use `makeDefaultContext` for repro.
- `lib/utils.ts`: Shared utils (`cn`, `formatCurrency`, `formatDate`); guard crashes.
- `app/api/chat/route.ts`: Chat endpoints; POST/GET handlers for session issues.

## Architecture Context
### Utils
**Directories**: `lib`, `lib/tracking`, `lib/supabase`, `lib/config`, `lib/ai`, `lib/admin-i18n`, `lib/actions`, `lib/ai/state-machine`, `lib/ai/state-machine/__tests__`, `lib/context`.  
**Symbol Count**: ~55 (e.g., `cn`, `formatCurrency`, `sendSMS`, `notify`).  
**Key Exports**: Formatting/validation helpers; use for input guards across layers.

### Services
**Directories**: `lib/services`, `components/landing`, `components/agenda/appointment-form`.  
**Symbol Count**: Low (e.g., `HandlerRecord`, `ChatLoggerService`).  
**Key Exports**: `LogInteractionParams`, `SessionSummary`; 85% service pattern match—encapsulate orchestration.

### Controllers
**Directories**: `app/api/slots`, `app/api/profile`, `app/api/ready`, etc. (20+ subdirs).  
**Symbol Count**: 50+ (e.g., `GET`, `POST` handlers).  
**Key Exports**: Route handlers; wrap in try/catch, delegate to services/utils.

## Key Symbols for This Agent
- `HandlerRecord` [lib/services/chat-logger.ts:25](lib/services/chat-logger.ts)—Type for handler logs; fix logging gaps.
- `ErrorRecord` [lib/services/chat-logger.ts:30](lib/services/chat-logger.ts)—Error tracking; ensure structured capture.
- `HandlerResult` [lib/ai/state-machine/types.ts:99](lib/ai/state-machine/types.ts)—AI handler output; validate before return.
- `registerAllHandlers` [lib/ai/state-machine/handlers/index.ts:70](lib/ai/state-machine/handlers/index.ts)—Registers flows; check for missing handlers.
- `routeByIntent` [lib/ai/state-machine/handlers/guardrail.ts:11](lib/ai/state-machine/handlers/guardrail.ts)—Intent classifier; fix misroutes.
- `normalizePreference` [lib/ai/state-machine/handlers/booking.ts:687](lib/ai/state-machine/handlers/booking.ts)—Booking normalizer; guard inputs.
- `buildMockServices` [lib/ai/state-machine/__tests__/flow-new-customer.test.ts:59](lib/ai/state-machine/__tests__/flow-new-customer.test.ts)—Test helper; reuse for repro.
- `cn` [lib/utils.ts:6](lib/utils.ts)—Tailwind merger; wrap UI conditionals.
- `formatCurrency` [lib/utils.ts:10](lib/utils.ts)—Currency formatter; add NaN guards.

## Documentation Touchpoints
- [Repository README](README.md): Local setup, `npm run dev`, common pitfalls.
- [Docs Index](../docs/README.md): Supabase schema, deployment, monitoring.
- [Agents Handbook](../../AGENTS.md): Inter-agent handoffs, escalation for DB changes.
- Inline tests/docs in `__tests__/` files: Repro steps and mock patterns.
- `lib/ai/state-machine/types.ts` comments: Handler contracts.

## Collaboration Checklist
1. **Confirm Assumptions**: Share triage (layer/symbol) and repro steps with reporter/team via PR comment.
2. **Root Cause Validation**: Post stack trace snippet and `searchCode` results in PR.
3. **Fix Review**: Tag reviewer; highlight diff (<10 lines), new test, coverage delta.
4. **Test Sign-Off**: Run `npm test -- --coverage`; link results; confirm no regressions.
5. **Docs Update**: Inline `// FIX:` comments; update README if pattern-wide.
6. **Learn/Capture**: Add test case or `AGENTS.md` note for similar bugs.
7. **Merge & Monitor**: Ship via `fix:` commit; watch Vercel logs 24h post-deploy.

## Hand-off Notes
Upon completion, summarize in PR: "Fixed [bug] via [change] in [file]; repro steps: [curl/local]; tests pass 100% coverage; risks: none (validated edges); follow-up: monitor chat-logs for patterns or escalate to DB if persistence issues." Remaining risks minimal due to tests/logging; suggest reviewer merge after manual curl verify.

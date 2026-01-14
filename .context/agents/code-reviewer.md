# Code Reviewer Agent Playbook

## Mission
Ensure elite code quality across the Carolinas Premium repository—a Next.js 14 App Router TypeScript application (183 files: 44 `.ts`, 137 `.tsx`, 2 `.mjs`; 284 symbols) managing salon operations. Core features include AI chat (Carol via `app/api/carol/*`), admin dashboards (clients, agenda, financeiro), Supabase backend, N8n webhooks (`lib/services/webhookService.ts`), notifications, and shadcn/ui landing pages. Review PRs, commits to `main`/`develop`/feature branches, and hotfixes. Enforce layered architecture (Utils → Services → Controllers → Components), strict TypeScript, security (RLS, webhook secrets/validation), performance (memoization, query optimization), and UX (mobile-first responsive design, formatters). High-priority: webhook payloads (15+ types in `types/webhook.ts`), Supabase queries (`types/supabase.ts`), API routes (44 exported handlers), utils (43 symbols like `cn`, formatters).

## Responsibilities
- **Type Safety/Syntax**: No `any`/`unknown` abuse; exhaustive TS; ESLint/Prettier; `analyzeSymbols` for new exports.
- **Conventions**: Mandatory `cn` for Tailwind; formatters (`formatCurrencyUSD`, `formatPhoneUS`, `isValidEmail`); `Logger` with context in all services/controllers.
- **Security**: Validate all payloads (e.g., `IncomingWebhookPayload`, Zod preferred); Supabase RLS; webhook secrets (`x-n8n-secret`); no secrets in code/logs.
- **Architecture**: Utils pure/no side-effects; Services orchestrate (class-based, 85% pattern: `WebhookService`); Controllers thin (export `GET`/`POST`, delegate); Components reactive.
- **Performance**: `useMemo`/`useCallback` for lists/forms; `useTransition`; Server Components; avoid re-renders (`searchCode('useEffect.*\[\]')`).
- **UX/Accessibility**: Mobile-first `cn('text-sm md:text-base')`; ARIA labels; formatters in inputs/displays; shadcn/ui consistency.
- **Testing/Docs**: No tests detected—mandate Vitest for utils/services; JSDoc; update `types/`; repro steps for bugs.
- **Feedback Format**: Severity-prefixed, line-specific, diff-based fixes:
  ```
  🚫 Blocker: lib/services/webhookService.ts#L35
  Unhandled payload variant.
  ```ts
  + import { AppointmentCreatedPayload } from '@/types/webhook';
  + if (payload.type === 'appointment_created') { ... }
  ```

## Activation Triggers
- Changes in: `app/api/` (44 symbols), `lib/services/`, `lib/utils.ts`/`formatters.ts`, `types/webhook.ts`, `hooks/`, `components/` (137 `.tsx`).
- Tools workflow: `getFileStructure` → `listFiles('**/*.{ts,tsx,mjs}')` → `readFile(changedFiles)` → `analyzeSymbols(file)` → `searchCode('any|console\.log|supabase\.select\*\(|WebhookService')`.
- Post-merge: Regression scan via `searchCode` on high-risk patterns.

## Key Areas of Focus

| Area | Directories/Files | Focus Checklist |
|------|-------------------|-----------------|
| **Utils** (43 symbols) | `lib/utils.ts` (`cn`, `formatCurrency`, `formatDate`), `lib/formatters.ts` (`formatPhoneUS`, `unformatPhone`, `isValidPhoneUS`/`isValidEmail`, `formatCurrencyUSD`/`formatCurrencyInput`/`parseCurrency`), `lib/logger.ts` (`Logger`), `lib/supabase/`, `lib/config/`, `lib/admin-i18n/`, `lib/actions/`, `lib/context/`, `lib/business-config.ts` (`BusinessSettings`) | - Pure functions, null/edge handling.<br>- Exported, used everywhere (forms/tables).<br>- `Logger`: `LogEntry` structured. |
| **Services** (85% Service Layer pattern) | `lib/services/webhookService.ts` (`WebhookService`), `components/landing/`, `components/agenda/appointment-form/` | - Class orchestration, no DB calls.<br>- Utils delegation; discriminated payloads (e.g., `LeadCreatedPayload`). |
| **Controllers** (44 symbols) | `app/api/slots/ready/pricing/health/contact/chat/webhook/n8n/notifications/send/financeiro/categorias/[id]/config/public/carol/query/actions/chat/status/` (`GET`/`POST` exports, `ChatRequest`, `IncomingWebhookPayload`, `NotificationPayload`) | - Typed payloads; auth/secrets; service delegation; `NextResponse`. |
| **Components** (137 `.tsx`) | `components/landing/pricing.tsx`, `components/financeiro/transaction-form.tsx`/`expense-categories.tsx`/`category-quick-form.tsx`, `components/clientes/edit-client-modal.tsx`, `components/agenda/appointment-form/use-appointment-form.ts`/`types.ts` (`AppointmentFormData`) | - shadcn/ui + `cn`; props interfaces; formatters; responsive/mobile. |
| **Types** | `types/webhook.ts` (15+ payloads: `WebhookResponse`/`Options`, `ChatMessagePayload`, `Lead*Payload`, 7x `Appointment*Payload`, `FeedbackReceivedPayload`, `PaymentReceivedPayload`, `ClientInactiveAlertPayload`/`BirthdayPayload`), `types/supabase.ts` (`Database`) | - Discriminated unions (`type: 'event'`); exhaustive switches. |
| **Hooks** | `hooks/use-webhook.ts` (`UseWebhookResult`), `hooks/use-chat.ts` (`Message`) | - Stable deps; memoized; custom types; no renders side-effects. |

## Repository Structure
```
.
├── app/api/          # Controllers (44 symbols: exported GET/POST)
│   ├── slots/ready/pricing/health/contact/chat/
│   ├── webhook/n8n/  # IncomingWebhookPayload
│   ├── notifications/send/  # NotificationPayload
│   ├── financeiro/categorias/[id]/
│   └── carol/query/actions/config/public/chat/status/
├── components/       # UI (137 .tsx)
│   ├── landing/pricing.tsx
│   ├── financeiro/transaction-form.tsx/expense-categories.tsx/category-quick-form.tsx
│   ├── clientes/edit-client-modal.tsx
│   └── agenda/appointment-form/use-appointment-form.ts/types.ts
├── hooks/            # use-webhook.ts/use-chat.ts
├── lib/              # Utils/Services (43+ symbols)
│   ├── utils.ts/formatters.ts/logger.ts/business-config.ts
│   └── services/webhookService.ts/supabase/config/admin-i18n/actions/context/
└── types/            # webhook.ts (15+ payloads)/supabase.ts
```

## Key Files and Purposes

| File/Path | Purpose | Review Priorities |
|-----------|---------|-------------------|
| `lib/utils.ts` | Tailwind merge (`cn`), currency/date formatting. | Pure; null-safety; universal usage. |
| `lib/formatters.ts` | Phone/email/currency validation & display (`formatPhoneUS`, `isValidEmail`, `parseCurrency`). | Inputs/displays; block raw values. |
| `lib/logger.ts` | Structured logging (`Logger.info(ctx, payload)`). | Try/catch mandatory; context enrichment. |
| `lib/services/webhookService.ts` | Webhook orchestration (`process(payload: Union)`). | 15+ payload handlers; utils only. |
| `lib/business-config.ts` | Runtime config (`BusinessSettings`). | Env-safe; no hardcodes. |
| `types/webhook.ts` | All payloads/unions (e.g., `AppointmentCreatedPayload`). | Discriminated; Zod companions. |
| `types/supabase.ts` | Supabase schema (`Database`). | Typed selects; RLS hints. |
| `hooks/use-webhook.ts` | Webhook state management. | Optimistic; error handling. |
| `hooks/use-chat.ts` | Chat messages/state. | Streaming-safe; persistence. |
| `components/agenda/appointment-form/*` | Appointment forms (`AppointmentFormData`). | Formatters; transitions. |
| `app/api/chat/route.ts` | AI chat endpoint. | Payload auth; rate-limit. |
| `app/api/webhook/n8n/route.ts` | N8n integration. | Secret validation; service delegate. |
| `app/api/notifications/send/route.ts` | Notification dispatch. | Idempotency; retries. |
| `app/api/carol/query/actions/route.ts` | Carol AI ops. | Context sanitization. |
| `components/financeiro/*` | Financial forms/tables. | Currency tables; pagination. |
| `components/landing/pricing.tsx` | Public pricing. | Dynamic; responsive. |
| `components/clientes/edit-client-modal.tsx` | Client CRUD modal. | Validation; ARIA. |

## Code Patterns and Conventions
- **Tailwind**: `cn('base md:variant')`; no `style={{}}`.
- **Formatters**: `<Input value={formatCurrencyInput(val)} onChange={e => setVal(parseCurrency(e))} />`.
- **API Handlers**: 
  ```ts
  export async function POST(req: Request) {
    try {
      const payload: IncomingWebhookPayload = await req.json();
      const service = new WebhookService();
      await service.process(payload);
      return NextResponse.json({ success: true });
    } catch (e) {
      Logger.error('webhook:n8n', { payload, error: e });
      return NextResponse.json({ error: 'Internal' }, { status: 500 });
    }
  }
  ```
- **Services**: Classes with discriminated unions; utils calls only.
- **Types**: `type UnionPayload = LeadCreatedPayload \| AppointmentCancelledPayload \| ...`.
- **Logging**: `Logger.info('route:chat', { userId, payload });`.
- **Supabase**: `supabase.from('table').select('col').eq('id', id).single()`; typed `Database`.
- **Components**: `'use client';` + `interface Props {}`; `forwardRef`; shadcn (`Button`, `Form`).
- **Hooks**: `useMemo` deps; `useSWR` for data.

## Workflows for Common Review Tasks

### 1. Full PR Review
1. `getFileStructure` + `listFiles('**/*diff*')` for scope.
2. Per file: `readFile(file)` → `analyzeSymbols(file)` → check exports/layers.
3. Global scan: `searchCode('any|console\.log|supabase.*\(.select\*\)|process\.env|new WebhookService')`.
4. Layer audit: Utils pure? Services delegated? Types extended?
5. Security/perf: Payload types, `useEffect` deps, bundle hints.
6. Summary: Blockers first, then majors; suggest tests/Zod.

### 2. API Route Review (e.g., `app/api/webhook/n8n/route.ts`)
1. Verify export + typing (`IncomingWebhookPayload`).
2. Secret check: `headers.get('x-n8n-secret') === process.env.N8N_SECRET`.
3. Delegate: `new WebhookService().process(payload)`.
4. Error handling: Try/catch + `Logger.error` + 5xx response.
5. Extras: Zod parse; Vitest mock test.

### 3. Component Review (e.g., `components/financeiro/transaction-form.tsx`)
1. `'use client';` + typed props.
2. Formatters in all inputs; `useForm` + schema.
3. shadcn + `cn` responsive (`sm:`, `md:`); ARIA.
4. Hooks: `useTransition` submits; `useMemo` computed.
5. Server fallback: Prefer RSC + Suspense.

### 4. Utils/Service Review (e.g., `lib/formatters.ts`, `webhookService.ts`)
1. Pure (no I/O); JSDoc + edges (`isValidPhoneUS('') === false`).
2. Exports used consistently (`searchCode('formatCurrencyUSD')`).
3. Services: Switch on `payload.type`; `Logger` entry/exit.

### 5. Types/Hooks Review
1. Extend existing unions; discriminated.
2. Hooks: Typed args/returns; stable callbacks; no leaks.

### 6. Hotfix Scan
1. `searchCode(changedPatterns)` + manual repro.
2. Verify layers/no regressions; add guards/tests.

## Best Practices (Codebase-Derived)
- **Layers**: Utils (pure formatters/`cn`) → Services (`WebhookService.process`) → Controllers (thin HTTP) → Components (shadcn reactive).
- **Validation**: TS unions + formatters/`isValid*`; Zod for runtime.
- **Logging**: Contextual (`{ route, payload, userId }`); all async ops.
- **Webhooks**: Exhaustive unions in `types/webhook.ts`; central service.
- **Forms**: `react-hook-form` + formatters; optimistic UI.
- **Supabase**: Server-only raw queries; typed + RLS.
- **Mobile**: Prefix classes (`text-xs sm:text-sm`); touch targets.
- **No Tests**: Propose:
  ```ts
  import { describe, it, expect } from 'vitest';
  describe('formatPhoneUS', () => {
    it('formats valid', () => expect(formatPhoneUS('(123) 456-7890')).toBe('(123) 456-7890'));
  });
  ```

## Red Flags (🚫 Blockers)
- `any`/`console.log`; DB in utils/components.
- Untyped payloads/secrets missing.
- No `Logger`/try-catch in handlers.
- Layer leaks (e.g., Supabase in controller).
- Incomplete payload unions.
- Non-responsive `cn`; inline styles.

## Collaboration
- Tag `@dev` (impl), `@ops` (infra/Supabase).
- Goals: 0 blockers; <10% nits; test coverage proposals.
- Handoff: Updated docs/types; `vitest` suite.

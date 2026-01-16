# Code Reviewer Agent Playbook

## Mission
Maintain elite code quality in the Caroline Cleaning repository—a Next.js 14 App Router TypeScript app with Supabase integration, N8n webhooks, AI chat (Carol), admin dashboards (agenda, financeiro, clients), tracking, notifications, and shadcn/ui components. Review PRs, commits to `main`/`develop`/feature branches, and hotfixes. Enforce layered architecture (**Utils** → **Services** → **Controllers** → **Components**), strict TypeScript (no `any`), security (webhook validation/RLS/secrets), performance (memoization/server components), and UX (responsive formatters/mobile-first). Prioritize: webhook ecosystem (`types/webhook.ts` 15+ payloads, `WebhookService`), API routes (50+ handlers like `GET`/`POST`), utils (55 symbols: `cn`, formatters), Supabase types, tracking (`lib/tracking/`).

## Responsibilities
- **Type Safety**: Exhaustive unions/discriminated payloads; `analyzeSymbols` for new exports; no `any`/`unknown`.
- **Conventions**: `cn` for Tailwind; formatters everywhere (`formatPhoneUS`, `isValidEmail`, `formatCurrencyUSD`); `Logger` with structured `LogEntry` in services/controllers.
- **Security**: Zod/runtime validation for payloads (e.g., `WebhookOptions`); `x-n8n-secret` checks; RLS on Supabase (`Database`); no secrets/logs exposure.
- **Architecture**: Utils pure (no side-effects); Services class-based orchestration (`WebhookService.process()`); Controllers thin/delegate; Components reactive/shadcn.
- **Performance**: `useMemo`/`useCallback`/`useTransition`; Server Components; optimize Supabase queries; scan re-renders via `searchCode('useEffect.*\[\]')`.
- **UX/Accessibility**: Mobile-first `cn('text-sm md:text-base')`; ARIA; formatters in forms/displays (e.g., `formatCurrencyInput`).
- **Testing/Docs**: Mandate Vitest (utils/services); JSDoc; extend `types/`; repro steps.
- **Feedback Format**: Severity + file:line + diff:
  ```
  🚫 Blocker: lib/services/webhookService.ts#L35
  Missing exhaustive switch for AppointmentCancelledPayload.
  ```ts
  + case 'appointment_cancelled':
  +   return this.handleAppointmentCancelled(payload as AppointmentCancelledPayload);
  ```

## Activation Triggers
- Changes in: `app/api/` (controllers: slots/ready/profile/pricing/health/contact/chat/webhook/n8n/...), `lib/` (utils/services/tracking/supabase/config), `types/` (webhook/supabase), `hooks/` (use-webhook/use-chat), `components/` (agenda/appointment-form, tracking).
- Tools: `getFileStructure` → `listFiles('**/*.{ts,tsx}')` → `readFile(changed)` → `analyzeSymbols(file)` → `searchCode('WebhookService|supabase|any|Logger|cn|format')`.
- Post-merge: Scan regressions (`searchCode('payload\.type|process\.env')`).

## Key Areas of Focus

| Area | Directories/Files | Focus Checklist |
|------|-------------------|-----------------|
| **Utils** (55 symbols) | `lib/utils.ts` (`cn`, `formatCurrency`, `formatDate`), `lib/formatters.ts` (`formatPhoneUS`, `unformatPhone`, `isValidPhoneUS`/`isValidEmail`, `formatCurrencyUSD`/`formatCurrencyInput`/`parseCurrency`), `lib/logger.ts` (`Logger`, `LogEntry`), `lib/tracking/types.ts` (`TrackingConfig`/`EventData`), `lib/supabase/`, `lib/config/`, `lib/admin-i18n/`, `lib/actions/`, `lib/context/`, `lib/business-config.ts` (`BusinessSettings`) | Pure/no I/O; edge cases (null/empty); universal (forms/tables); structured logs. |
| **Services** (Service Layer 85%) | `lib/services/webhookService.ts` (`WebhookService`), `components/landing/`, `components/agenda/appointment-form/` (`use-appointment-form.ts`) | Class-based; discriminated unions (15+ payloads); utils/Supabase delegation; exhaustive handlers. |
| **Controllers** (50+ symbols) | `app/api/slots/ready/profile/pricing/health/contact/chat/webhook/n8n/profile/password/notifications/send/tracking/config/event/financeiro/categorias/[id]/config/public/carol/query/actions/chat/status/` (e.g., `GET`/`POST` exports) | Typed req/res (`NextRequest`); auth/secrets; `new WebhookService()`; `NextResponse`. |
| **Types** | `types/webhook.ts` (15+: `WebhookResponse`/`Options`, `ChatMessagePayload`, `LeadCreated/Updated/ConvertedPayload`, 7x `Appointment*Payload`, `Feedback/Payment/ClientInactive/BirthdayPayload`), `types/supabase.ts` (`Database`), `types/index.ts` (`UserProfile`/`NotificationTypes`), `components/agenda/types.ts` (`ServicoTipo`) | Discriminated (`type: 'appointment_created'`); exhaustive; Zod schemas. |
| **Hooks/Components** | `hooks/use-webhook.ts` (`UseWebhookResult`), `hooks/use-chat.ts` (`Message`), `components/tracking/tracking-provider.tsx`, `components/agenda/appointment-form/`, `app/(admin)/admin/configuracoes/webhooks/data/webhooks-data.ts` | Stable deps/memo; reactive; responsive shadcn; formatters. |

## Repository Structure
```
.
├── app/api/                 # Controllers (50+ handlers)
│   ├── slots/ready/profile/pricing/health/contact/chat/
│   ├── webhook/n8n/         # N8n payloads
│   ├── notifications/send/
│   ├── tracking/config/event/
│   ├── financeiro/categorias/[id]/
│   ├── config/public/
│   └── carol/query/actions/
├── lib/                     # Utils/Services
│   ├── utils.ts/formatters.ts/logger.ts/business-config.ts
│   ├── services/webhookService.ts
│   ├── tracking/types.ts
│   └── supabase/config/admin-i18n/actions/context/
├── components/              # UI/Forms
│   ├── agenda/appointment-form/use-appointment-form.ts/types.ts
│   ├── tracking/tracking-provider.tsx
│   └── landing/
├── hooks/                   # use-webhook.ts/use-chat.ts
├── types/                   # webhook.ts/supabase.ts/index.ts
└── app/(admin)/admin/...    # Admin (webhooks-data.ts)
```

## Key Files and Purposes

| File/Path | Purpose | Review Priorities |
|-----------|---------|-------------------|
| `lib/utils.ts` | Tailwind (`cn`), basic formatters (`formatCurrency`/`formatDate`). | Pure; null-safe; compose with `formatters.ts`. |
| `lib/formatters.ts` | Phone/email/currency ops (`formatPhoneUS`, `isValid*`, `parseCurrency`). | Validation/display; block unformatted values. |
| `lib/logger.ts` | Structured logging (`Logger.info(ctx, data: LogEntry)`). | All async/error paths; context (`{userId, payload}`). |
| `lib/services/webhookService.ts` | Central webhook logic (`process(payload: Union)`). | Exhaustive switch (15+ cases); utils only; no DB. |
| `types/webhook.ts` | Payload unions (e.g., `AppointmentCreatedPayload { type: 'appointment_created', data: {...} }`). | Discriminated; handlers match. |
| `types/supabase.ts` | Supabase schema (`Database`). | Typed queries; RLS/eq/single(). |
| `hooks/use-webhook.ts` | Webhook state (`UseWebhookResult`). | Error boundaries; optimistic. |
| `hooks/use-chat.ts` | Chat state (`Message`). | Streaming; persistence. |
| `lib/tracking/types.ts` | Events/config (`TrackingEventData`/`UserData`/`CustomData`/`TrackingContextValue`). | Privacy (no PII); context prop. |
| `app/api/webhook/n8n/route.ts` | N8n ingress (`POST`). | Secret/validate; service.process(). |
| `app/api/chat/route.ts` | Chat handler. | Payload auth; Carol integration. |
| `app/api/notifications/send/route.ts` | Dispatch notifications. | Idempotent; types. |
| `app/api/tracking/event/route.ts` | Track events. | Config-safe; no leaks. |
| `app/api/carol/query/actions/route.ts` | AI ops. | Sanitize context. |
| `components/agenda/appointment-form/*` | Forms (`ServicoTipo`). | Formatters; transitions; validation. |
| `components/tracking/tracking-provider.tsx` | Tracking context. | Opt-in; memoized. |

## Code Patterns and Conventions
- **Tailwind**: `cn('p-4 md:p-6 text-sm md:text-base')`; shadcn (`Button`, `Input`).
- **Formatters**: 
  ```tsx
  <Input value={formatCurrencyInput(val)} onChange={e => set(val => parseCurrency(e.target.value))} />
  ```
- **API Handlers**:
  ```ts
  export async function POST(req: Request) {
    try {
      const payload = await req.json() as WebhookOptions; // + Zod.parse()
      if (headers.get('x-n8n-secret') !== process.env.N8N_SECRET) throw new Error('Unauthorized');
      const service = new WebhookService();
      await service.process(payload);
      Logger.info('webhook:processed', { type: payload.type });
      return NextResponse.json({ success: true });
    } catch (e) {
      Logger.error('webhook:error', { error: e });
      return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
  }
  ```
- **Services**: 
  ```ts
  switch (payload.type) {
    case 'appointment_created': return this.handleAppointmentCreated(payload as AppointmentCreatedPayload);
    // exhaustive
  }
  ```
- **Types**: `type PayloadUnion = LeadCreatedPayload | AppointmentCancelledPayload | ...`.
- **Supabase**: `supabase.from('appointments').select('*').eq('id', id).single() as Database['public']['Tables']['appointments']['Row']`.
- **Hooks**: `const memoized = useMemo(() => compute(data), [data]);`.
- **Logging**: `Logger.info('service:handleLead', { payload, userId });`.

## Workflows for Common Review Tasks

### 1. Full PR Review
1. `listFiles('**/*.{ts,tsx}')` + `getFileStructure` for scope.
2. `readFile(each changed)` → `analyzeSymbols` (check exports/layers).
3. Global: `searchCode('any|console\.log|supabase\.(from|select)|WebhookService|format|cn')`.
4. Audit: Utils pure? Services exhaustive? Controllers delegate? Types discriminated?
5. Perf/Sec: Re-renders, validations, secrets.
6. Output: Blockers → Majors → Minors; test proposals.

### 2. Controller Review (e.g., `app/api/webhook/n8n/route.ts`)
1. Typed `req.json()` + Zod/discriminated.
2. Headers/secrets (`x-n8n-secret`).
3. `new WebhookService().process()`; no business logic.
4. Try/catch + `Logger`; 4xx/5xx responses.
5. Test: Mock service/payload.

### 3. Service Review (e.g., `lib/services/webhookService.ts`)
1. Class methods; utils/Supabase only.
2. Switch exhaustive on `payload.type` (match `types/webhook.ts`).
3. `Logger` entry/exit; edges (invalid type).
4. No HTTP/DB orchestration.

### 4. Utils Review (e.g., `lib/formatters.ts`)
1. Pure; JSDoc; tests edges (`isValidPhoneUS('abc') === false`).
2. `searchCode('formatPhoneUS')` for usage.
3. No deps/I/O.

### 5. Types/Hooks Review
1. Extend unions; `satisfies PayloadUnion`.
2. Hooks: Typed; `useCallback`; no leaks (`useEffect` cleanup).

### 6. Component Review (e.g., `components/agenda/appointment-form/`)
1. `'use client';` + props interface.
2. shadcn/`cn` responsive; formatters/validators.
3. `useForm` + transitions; ARIA.

### 7. Hotfix/Regression Scan
1. `searchCode(changed regex)` + repro.
2. Layer/no-regress; guards/tests.

## Best Practices (Codebase-Derived)
- **Layers**: Utils (formatters/`cn`/`Logger`) → Services (`WebhookService` switch) → Controllers (validate/delegate) → Components/Hooks (reactive).
- **Validation**: TS unions + `isValid*`/Zod; format inputs.
- **Logging**: Always `{context, payload}`; errors structured.
- **Webhooks**: Central `WebhookService`; 15+ exhaustive cases.
- **Supabase**: Server-only; typed `Database`; RLS.
- **Tracking**: `TrackingContextValue`; config-driven (`TrackingConfig`).
- **Mobile**: `cn` breakpoints; touch-friendly.
- **Tests** (Propose Vitest):
  ```ts
  import { describe, it, expect } from 'vitest';
  import { isValidEmail } from '@/lib/formatters';
  describe('Utils', () => {
    it('validates email', () => expect(isValidEmail('test@example.com')).toBe(true));
  });
  ```

## Red Flags (🚫 Blockers)
- `any`/console.log; DB/HTTP in utils/components.
- Missing validation/secrets; incomplete switches.
- No `Logger`/try-catch; layer violations (Supabase in controller).
- Unformatted displays; non-responsive.
- Untyped payloads; PII in tracking/logs.

## Collaboration
- Tag `@dev` (code), `@admin` (config/webhooks).
- Goals: 0 blockers; tests for utils/services; docs updates.
- Handoff: Extended types; Vitest suites; repro bugs.

# Development Workflow

This guide outlines the engineering processes for **Carolinas Premium**, a Next.js 14+ App Router application using TypeScript, Tailwind CSS, Supabase (PostgreSQL), N8N webhooks, AI-powered chat (`useChat` @ [hooks/use-chat.ts:17](hooks/use-chat.ts#L17)), admin dashboards, analytics (`ConversionFunnel` @ [components/analytics/conversion-funnel.tsx:15](components/analytics/conversion-funnel.tsx#L15)), and financial management (`TransactionFormProps` @ [components/financeiro/transaction-form.tsx:27](components/financeiro/transaction-form.tsx#L27)). Core entities include `Cliente` ([types/index.ts:5](types/index.ts#L5)), `Agendamento` ([types/index.ts:9](types/index.ts#L9)), `Contrato` ([types/index.ts:14](types/index.ts#L14)), and `Financeiro` ([types/index.ts:15](types/index.ts#L15)). Real-time features leverage `useWebhook` hooks ([hooks/use-webhook.ts:31](hooks/use-webhook.ts#L31)) and `WebhookService` ([lib/services/webhookService.ts:35](lib/services/webhookService.ts#L35)).

## Branching Strategy & Releases

### Trunk-Based Development
Use short-lived feature branches from `main` (always production-ready). Avoid long-lived `develop` branches.

| Prefix     | Example                  | Purpose |
|------------|--------------------------|---------|
| `feat/`    | `feat/admin-analytics`   | New features (e.g., `DashboardStats` @ [types/index.ts:26](types/index.ts#L26)) |
| `fix/`     | `fix/chat-leak`          | Bug fixes (e.g., `useChatSession` @ [hooks/use-chat-session.ts:6](hooks/use-chat-session.ts#L6)) |
| `refactor/`| `refactor/webhook-types` | Refactors (e.g., `WebhookEventType` @ [types/webhook.ts:1](types/webhook.ts#L1)) |
| `chore/`   | `chore/supabase-upgrade` | Maintenance (e.g., `createClient` @ [lib/supabase/server.ts:4](lib/supabase/server.ts#L4)) |
| `hotfix/`  | `hotfix/payment-webhook` | Production hotfixes (e.g., `PaymentReceivedPayload` @ [types/webhook.ts:176](types/webhook.ts#L176)) |

- **Pull Requests (PRs)**: Rebase merges for linear history. Require passing lint, build, type-check, and tests. Use GitHub CLI:
  ```bash
  gh pr create --title "feat: add ConversionFunnel" --body "Refs #123. See components/analytics/conversion-funnel.tsx"
  ```
- **Protected Branches**:

| Branch   | Requirements |
|----------|--------------|
| `main`   | 1 approval, status checks (lint/build/type-check), signed commits |
| `staging`| Deploy previews (Vercel) |

### Release Process
Continuous deployment: `main` → staging; tags → production.

1. Update `CHANGELOG.md` (e.g., "Added `ChatWidget` @ [components/chat/chat-widget.tsx:12](components/chat/chat-widget.tsx#L12)").
2. Merge PR to `main`.
3. `npm version patch && git push --tags` (use `minor`/`major` as needed).
4. Auto-deploy via GitHub Actions and Vercel.

## Local Development Setup

### Prerequisites
- Node.js ≥18 (use `.nvmrc`).
- Supabase project (remote preferred; local: `npx supabase start`).
- GitHub CLI (`gh pr create`).
- N8N (optional, for testing `/api/webhook/n8n` @ [app/api/webhook/n8n/route.ts](app/api/webhook/n8n/route.ts)).
- Vercel CLI (for previews: `vercel dev`).

### Quick Start
```bash
git clone <repo>
cd caroline-cleaning
npm ci  # CI-optimized install

cp .env.example .env.local
# Edit: SUPABASE_URL, SUPABASE_ANON_KEY, WEBHOOK_SECRET (see lib/config/webhooks.ts)
npx @envsync/cli@latest || node -e "require('./lib/env').validateEnv()"

npm run db:generate  # Regenerates types/supabase.ts (Database @ types/supabase.ts:9)
```

### Run Commands
| Command              | Purpose                              | Port   |
|----------------------|--------------------------------------|--------|
| `npm run dev`        | Dev server (HMR, fast refresh)       | 3000   |
| `npm run build`      | Production build (bundle/types check)| -      |
| `npm run lint`       | ESLint + Prettier                    | -      |
| `npm run type-check` | `tsc --noEmit`                       | -      |
| `npm run db:generate`| Supabase types (Database)            | -      |
| `npm run db:studio`  | Supabase Studio UI                   | 54323  |
| `npm run db:reset`   | Reset + migrate (dev only)           | -      |
| `npm run test`       | Run Jest tests (e.g., `lib/ai/state-machine/__tests__/engine.test.ts`) | - |

- **Seeding**: Use Supabase Dashboard or `supabase/migrations/` for `ClienteInsert`/`AgendamentoInsert` data.
- **Instrumentation**: `npm run telemetry` for OpenTelemetry setup ([instrumentation.ts:1](instrumentation.ts#L1)).

### Key Routes
| Route                              | Page/Component                          | Notes |
|------------------------------------|-----------------------------------------|-------|
| `/`                                | Landing (`AnnouncementBar` @ [components/landing/announcement-bar.tsx:5](components/landing/announcement-bar.tsx#L5)) | Public, SEO-optimized |
| `/chat`                            | `ChatWidget` @ [components/chat/chat-widget.tsx:12](components/chat/chat-widget.tsx#L12) | AI chat (`CarolAgent` @ [lib/ai/carol-agent.ts:29](lib/ai/carol-agent.ts#L29)) |
| `/admin`                           | `AdminLayout` @ [app/(admin)/layout.tsx:8](app/(admin)/layout.tsx#L8) | Auth via `middleware.ts` ([middleware.ts:8](middleware.ts#L8)) |
| `/admin/agenda`                    | `AgendaPage` @ [app/(admin)/admin/agenda/page.tsx:9](app/(admin)/admin/agenda/page.tsx#L9) (`CalendarView` @ [components/agenda/calendar-view.tsx:25](components/agenda/calendar-view.tsx#L25)) | `appointment-modal.tsx` (imported by 8 files) |
| `/admin/clientes`                  | `ClientesPage` @ [app/(admin)/admin/clientes/page.tsx:12](app/(admin)/admin/clientes/page.tsx#L12) | `ClientsFilters` @ [components/clientes/clients-filters.tsx:24](components/clientes/clients-filters.tsx#L24) |
| `/admin/clientes/[id]`             | `ClienteDetalhePage` @ [app/(admin)/admin/clientes/[id]/page.tsx:11](app/(admin)/admin/clientes/[id]/page.tsx#L11) | Tabs for agendamentos/financeiro |
| `/admin/analytics`                 | Various (`ClientesAnalyticsPage` etc.) | `ConversionFunnel` |
| `/admin/financeiro/categorias`     | `CategoriasPage` @ [app/(admin)/admin/financeiro/categorias/page.tsx:9](app/(admin)/admin/financeiro/categorias/page.tsx#L9) | `CategoryQuickForm` @ [components/financeiro/category-quick-form.tsx:23](components/financeiro/category-quick-form.tsx#L23) |
| `/admin/configuracoes`             | Config pages                           | `BusinessSettings` @ [lib/business-config.ts:3](lib/business-config.ts#L3) |

## Debugging & Testing

### Essential Tools & Examples

- **Supabase Clients**:
  ```ts
  // Server
  import { createClient } from '@/lib/supabase/server';
  const supabase = createClient();
  // Client ('use client')
  import { createClient } from '@/lib/supabase/client';
  ```

- **Webhooks** (`WebhookPayload` @ [types/webhook.ts:214](types/webhook.ts#L214)):
  ```ts
  import { getWebhookUrl, getWebhookSecret } from '@/lib/config/webhooks';
  const payload: AppointmentCreatedPayload = { event: 'appointment.created', data: { id: 1 } };
  await fetch(getWebhookUrl(), {
    method: 'POST',
    headers: { 'x-webhook-secret': getWebhookSecret() },
    body: JSON.stringify(payload)
  });
  ```
  See `WebhookService` ([lib/services/webhookService.ts:29](lib/services/webhookService.ts#L29)), hooks like `useNotifyAppointmentCreated`.

- **AI Chat** (`CarolStateMachine` @ [lib/ai/state-machine/engine.ts:60](lib/ai/state-machine/engine.ts#L60)):
  ```tsx
  'use client';
  import { useChat } from '@/hooks/use-chat';
  import { ChatWindow } from '@/components/chat/chat-window'; // Imported by 3 files

  const { messages, sendMessage, isLoading } = useChat();
  ```
  Embed: `<ChatWidget />`. Handlers: `lib/ai/state-machine/handlers/` (e.g., `booking.ts`, imported by 2 files).

- **Tracking & Logger**:
  ```ts
  import { Logger } from '@/lib/logger'; // Logger @ lib/logger.ts:11
  const logger = new Logger();
  logger.info('Event', { data });

  // Tracking
  import { trackEvent } from '@/lib/tracking'; // TrackingEventData @ lib/tracking/types.ts:37
  trackEvent('appointment_created', { cliente_id: 1 });
  ```

- **Exports & Utils**:
  ```ts
  import { cn, formatCurrency } from '@/lib/utils'; // cn @ lib/utils.ts:6
  import { exportToExcel } from '@/lib/export-utils';
  <div className={cn("p-4", isActive && "bg-blue-500")}>...</div>
  ```

- **Rate Limiting**:
  ```ts
  import { checkRateLimit } from '@/lib/rate-limit'; // checkRateLimit @ lib/rate-limit.ts:32
  if (await checkRateLimit(req)) { /* handle */ }
  ```

### Testing Scripts
Run chat/AI scenarios via scripts (Node.js):
```bash
# Example: Test booking flows
node scripts/run_booking_scenarios.ts
# Or long scenarios
node scripts/run_long_scenarios.ts
```
Scripts cover: `run_chat_scenarios.ts`, `test_agent_direct.ts`, `run_advanced_scenarios.ts`, etc. (22+ scripts for AI testing).

### Console Commands
```bash
npx supabase status    # Local Supabase
npx supabase logs db   # DB logs
npm run db:studio      # http://localhost:54323
vercel logs            # Production logs
```

## Code Standards & Review

### PR Checklist
- [ ] `npm run build && npm run lint && npm run type-check`
- [ ] Types: Extend `types/index.ts`/`types/webhook.ts`; run `npm run db:generate`
- [ ] Components: Typed props, `cn(...)` for Tailwind (e.g., `AdminHeader` @ [components/admin/header.tsx:18](components/admin/header.tsx#L18))
- [ ] Hooks: `'use client'` (e.g., `useCarolChat` @ [hooks/use-carol-chat.ts:8](hooks/use-carol-chat.ts#L8))
- [ ] Server Actions: Validate inputs (e.g., `isValidPhoneUS` @ [lib/formatters.ts:29](lib/formatters.ts#L29))
- [ ] Security: `middleware.ts`, rate limits, `checkRateLimit`
- [ ] i18n: `AdminI18nProvider` ([lib/admin-i18n/context.tsx:14](lib/admin-i18n/context.tsx#L14))
- [ ] No `any`; use `Json`/`Database` from Supabase types
- [ ] Tests: Update/add for new features (e.g., `lib/ai/state-machine/__tests__/flow-new-customer.test.ts`)

### Common Pitfalls & Fixes

| Issue                      | Fix/Reference |
|----------------------------|---------------|
| Client/Server Supabase     | `lib/supabase/server.ts` vs `client.ts` |
| Hooks fail in SSR          | `'use client'`; see `hooks/use-webhook.ts` |
| Env validation fails       | `lib/env.ts`; set `WEBHOOK_SECRET` |
| Webhook timeouts           | `getWebhookTimeout` ([lib/config/webhooks.ts](lib/config/webhooks.ts)) |
| Currency/Phone formatting  | `formatCurrencyInput`/`formatPhoneUS` ([lib/formatters.ts](lib/formatters.ts)) |
| AI state issues            | `CarolState` ([lib/ai/state-machine/types.ts:14](lib/ai/state-machine/types.ts#L14)); check handlers |
| High deps (e.g., appointment-modal.tsx) | Review importers (8 files) |

## Onboarding

### Week 1 Goals
1. Run `npm run dev`; test `/admin/agenda` (`CalendarView`, imported by 5 files), `/chat`.
2. Review core: `types/index.ts`, `hooks/use-chat.ts`, `lib/ai/`, `lib/supabase/`, `components/chat/`, `components/agenda/`.
3. Run a script: `node scripts/run_booking_scenarios.ts`.
4. Submit PR for "good first issue" (e.g., add test for `CategoryQuickForm`).

### Resources
| Category     | Links/Details |
|--------------|---------------|
| **Issues**   | GitHub "good first issue" label |
| **Deploy**   | Vercel; `npm version` → prod |
| **DB**       | Supabase Dashboard; `npm run db:generate` |
| **Webhooks** | `/api/webhook/n8n`; test payloads ([types/webhook.ts](types/webhook.ts)) |
| **Chat/AI**  | `CarolAgent`, handlers (`lib/ai/state-machine/handlers/index.ts`, imported by 10 files) |
| **Analytics**| `components/analytics/` |
| **Finance**  | `components/financeiro/` |
| **Services** | `ChatLoggerService` ([lib/services/chat-logger.ts:109](lib/services/chat-logger.ts#L109)) |
| **Tests**    | `lib/ai/state-machine/__tests__/`, scripts/ |

**Last Updated**: October 2024  
**Roadmap**: Full Jest/Playwright coverage (target 80%), E2E for chat flows, policy expansions (`scripts/test_new_policies.ts`).

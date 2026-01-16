# Development Workflow

This guide outlines the engineering processes for **Carolinas Premium**, a Next.js 14+ App Router application using TypeScript, Tailwind CSS, Supabase (PostgreSQL), N8N webhooks, AI-powered chat (`useChat` @ [hooks/use-chat.ts:17](hooks/use-chat.ts#L17)), admin dashboards, analytics (`ConversionFunnel` @ [components/analytics/conversion-funnel.tsx:15](components/analytics/conversion-funnel.tsx#L15)), and financial management (`TransactionFormProps` @ [components/financeiro/transaction-form.tsx:27](components/financeiro/transaction-form.tsx#L27)). Core entities include `Cliente` (`types/index.ts:5`), `Agendamento` (`types/index.ts:9`), `Contrato` (`types/index.ts:14`), and `Financeiro` (`types/index.ts:15`). Real-time features use `useWebhook` hooks (`hooks/use-webhook.ts:31`) and `WebhookService` (`lib/services/webhookService.ts:35`).

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

- **Pull Requests (PRs)**: Rebase merges for linear history. Require passing lint, build, and type-check checks. Use GitHub CLI:
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
3. `npm version patch && git push --tags` (use `minor` or `major` as needed).
4. Auto-deploy via GitHub Actions and Vercel.

## Local Development Setup

### Prerequisites
- Node.js ≥18 (use `.nvmrc`).
- Supabase project (remote preferred; local: `npx supabase start`).
- GitHub CLI (`gh pr create`).
- N8N (optional, for testing `/api/webhook/n8n` @ [app/api/webhook/n8n/route.ts](app/api/webhook/n8n/route.ts)).

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

- **Seeding**: Use Supabase Dashboard or `supabase/migrations/` to insert `ClienteInsert`/`AgendamentoInsert` data.
- **Key Routes**:

| Route                              | Page/Component                          | Notes |
|------------------------------------|-----------------------------------------|-------|
| `/`                                | Landing (`AboutUs` @ [components/landing/about-us.tsx:14](components/landing/about-us.tsx#L14), `AnnouncementBar`) | Public, SEO-optimized |
| `/admin`                           | `AdminLayout` @ [app/(admin)/layout.tsx:8](app/(admin)/layout.tsx#L8) (`AdminHeader`) | Auth via `middleware.ts` (`rateLimit` @ [middleware.ts:9](middleware.ts#L9)) |
| `/admin/agenda`                    | `AgendaPage` @ [app/(admin)/admin/agenda/page.tsx:9](app/(admin)/admin/agenda/page.tsx#L9) (`CalendarView` @ [components/agenda/calendar-view.tsx:25](components/agenda/calendar-view.tsx#L25)) | `appointment-modal.tsx` (imported by 8 files) |
| `/admin/clientes`                  | `ClientesPage` @ [app/(admin)/admin/clientes/page.tsx:12](app/(admin)/admin/clientes/page.tsx#L12) (`ClientsFilters` @ [components/clientes/clients-filters.tsx:24](components/clientes/clients-filters.tsx#L24)) | `ClientsTableProps` @ [components/clientes/clients-table.tsx:63](components/clientes/clients-table.tsx#L63) |
| `/admin/clientes/[id]`             | `ClienteDetalhePage` @ [app/(admin)/admin/clientes/[id]/page.tsx:11](app/(admin)/admin/clientes/[id]/page.tsx#L11) | Tabs for agendamentos/financeiro |
| `/admin/analytics/clientes`        | `ClientesAnalyticsPage` @ [app/(admin)/admin/analytics/clientes/page.tsx:9](app/(admin)/admin/analytics/clientes/page.tsx#L9) | `ConversionFunnel` |
| `/admin/financeiro/categorias`     | `CategoriasPage` @ [app/(admin)/admin/financeiro/categorias/page.tsx:6](app/(admin)/admin/financeiro/categorias/page.tsx#L6) | `CategoryQuickForm` @ [components/financeiro/category-quick-form.tsx:23](components/financeiro/category-quick-form.tsx#L23) |
| `/admin/configuracoes`             | `ConfiguracoesPage` @ [app/(admin)/admin/configuracoes/page.tsx:7](app/(admin)/admin/configuracoes/page.tsx#L7) | `BusinessSettings` @ [lib/business-config.ts:3](lib/business-config.ts#L3) |

## Debugging & Testing

### Essential Tools & Examples

- **Supabase Clients**:
  ```ts
  // Server-side
  import { createClient } from '@/lib/supabase/server';
  const supabase = createClient();

  // Client-side ('use client')
  import { createClient } from '@/lib/supabase/client';
  ```

- **Webhooks** (`types/webhook.ts` – e.g., `AppointmentCreatedPayload` @ [types/webhook.ts:90](types/webhook.ts#L90)):
  ```ts
  import { getWebhookUrl, getWebhookSecret } from '@/lib/config/webhooks';
  const payload: AppointmentCreatedPayload = { event: 'appointment.created', data: { id: 1, cliente_id: 1 } };
  await fetch(getWebhookUrl(), {
    method: 'POST',
    headers: { 'x-webhook-secret': getWebhookSecret() },
    body: JSON.stringify(payload)
  });
  ```
  Hooks: `useNotifyAppointmentCreated` (`hooks/use-webhook.ts:117`), `sendWebhookAction` (`lib/actions/webhook.ts:9`).

- **Chat** (`useChat` @ [hooks/use-chat.ts:17](hooks/use-chat.ts#L17), `ChatMessage` @ [hooks/use-chat.ts:14](hooks/use-chat.ts#L14)):
  ```tsx
  'use client';
  import { useChat } from '@/hooks/use-chat';
  import { ChatWindow } from '@/components/chat/chat-window'; // Imported by 3 files

  function ChatExample() {
    const { messages, sendMessage, isLoading } = useChat();
    return <ChatWindow messages={messages} onSend={sendMessage} loading={isLoading} />;
  }
  ```
  Embed: `<ChatWidget />` (`components/chat/chat-widget.tsx:12`, imported by 2 files) or `useChatSession`.

- **Exports** (`lib/export-utils.ts`):
  ```ts
  import { exportToExcel } from '@/lib/export-utils';
  const data: Cliente[] = await supabase.from('clientes').select('*');
  exportToExcel(data, 'clientes.xlsx');
  ```

- **Business Settings**: Client: `BusinessSettingsProvider` (`lib/context/business-settings-context.tsx:8`); Server: `getBusinessSettingsServer` (`lib/business-config-server.ts:8`).
- **Utils**: `cn` (`lib/utils.ts:6`), `formatCurrency` (`lib/utils.ts:10`), `formatPhoneUS`/`isValidEmail` (`lib/formatters.ts`).
- **Logger**: `new Logger().info('Event', data)` (`lib/logger.ts:11`).

### Console Commands
```bash
npx supabase status    # Local Supabase
npx supabase logs db   # DB logs
npm run db:studio      # http://localhost:54323

# DevTools: Inspect POST /api/chat (ChatRequest), /api/webhook/n8n (IncomingWebhookPayload)
```

## Code Standards & Review

### PR Checklist
- [ ] `npm run build && npm run lint && npm run type-check`
- [ ] Types: Extend `types/index.ts` (e.g., `ClienteUpdate` @ [types/index.ts:7](types/index.ts#L7)), `types/webhook.ts` (`WebhookPayload` @ [types/webhook.ts:214](types/webhook.ts#L214))
- [ ] Components: Typed props (e.g., `ClientsFiltersProps` @ [components/clientes/clients-filters.tsx:14](components/clientes/clients-filters.tsx#L14)), use `cn(...)` for Tailwind
- [ ] Hooks: `'use client';` directive; e.g., `useWebhook` (`hooks/use-webhook.ts`)
- [ ] Server Actions: `sendWebhookAction`, input validation
- [ ] Security: `isValidPhoneUS` (`lib/formatters.ts:29`), `middleware.ts` auth/rateLimit
- [ ] i18n (Admin): `AdminI18nProvider` (`lib/admin-i18n/context.tsx:14`)
- [ ] No `any`; prefer `Json`/`Database` from `types/supabase.ts`

### Common Pitfalls & Fixes

| Issue                      | Fix/Reference |
|----------------------------|---------------|
| Client/Server Supabase     | `lib/supabase/server.ts` vs `client.ts` |
| Hooks fail in SSR          | Add `'use client'`; see `hooks/use-webhook.ts` |
| Env validation fails       | `validateEnv` (`lib/env.ts:20`), set `WEBHOOK_SECRET` |
| Webhook issues             | `isWebhookConfigured`/`getWebhookTimeout` (`lib/config/webhooks.ts`) |
| Formatting (currency/phone)| `formatCurrencyInput`/`parseCurrency` (`lib/formatters.ts:58`, `:79`) |
| Missing DB types           | `npm run db:generate` |
| Bundle warnings            | Check deps like `components/agenda/appointment-modal.tsx` (8 importers) |

## Onboarding

### Week 1 Goals
1. Run `npm run dev`; navigate `/admin/agenda` (`CalendarView`, imported by 5 files), `/admin/clientes`.
2. Review core: `types/index.ts`, `hooks/use-chat.ts`/`use-webhook.ts`, `lib/supabase/`, `components/chat/`, `components/agenda/`.
3. Submit PR for "good first issue" (e.g., refine `CategoryQuickFormProps` @ [components/financeiro/category-quick-form.tsx:18](components/financeiro/category-quick-form.tsx#L18)).

### Resources
| Category     | Links/Details |
|--------------|---------------|
| **Issues**   | GitHub "good first issue" label |
| **Deploy**   | Vercel dashboard; `npm version` → prod |
| **DB**       | Supabase Dashboard; `npm run db:generate` |
| **Webhooks** | Test `/api/webhook/n8n`; `WebhookConfig` (`app/(admin)/admin/configuracoes/webhooks/data/webhooks-data.ts:10`) |
| **Chat**     | `ChatWidget`/`ChatWindow`; `generateSessionId` (`lib/chat-session.ts:1`) |
| **Analytics**| `components/analytics/` (`ConversionFunnel`) |
| **Finance**  | `components/financeiro/` (`transaction-form.tsx`, imported by 2 files) |
| **Logs**     | Supabase/Vercel Logs, `Logger` class |

**Last Updated**: October 2024  
**Roadmap**: Jest unit tests (`/tests/`), Playwright E2E, 80% CI coverage.

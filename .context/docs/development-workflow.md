# Development Workflow

This guide outlines the engineering processes for **Carolinas Premium**, a Next.js 14+ App Router app using TypeScript, Tailwind CSS, Supabase (PostgreSQL), N8N webhooks, AI-powered chat (`useChat`), admin dashboards, analytics (`ConversionFunnel`), and financial management (`transaction-form.tsx`). Core entities: `Cliente`, `Agendamento`, `Contrato`, `Financeiro`. Real-time features leverage `useWebhook` hooks and `WebhookService`.

## Branching Strategy & Releases

### Trunk-Based Development
Short-lived branches from `main` (always production-ready). No `develop` branch.

| Prefix     | Example                   | Purpose |
|------------|---------------------------|---------|
| `feat/`    | `feat/admin-analytics`    | New features (e.g., `ConversionFunnel` @ `components\analytics\conversion-funnel.tsx:15`, `DashboardStats` @ `types\index.ts:26`) |
| `fix/`     | `fix/chat-leak`           | Bugs (e.g., `useChatSession` @ `hooks\use-chat-session.ts:6`) |
| `refactor/`| `refactor/webhook-types`  | Refactors (e.g., `WebhookEventType` @ `types\webhook.ts:1`) |
| `chore/`   | `chore/supabase-upgrade`  | Maintenance (e.g., `createClient` @ `lib\supabase\server.ts:4`) |
| `hotfix/`  | `hotfix/payment-webhook`  | Prod fixes (e.g., `WebhookService` @ `lib\services\webhookService.ts:35`) |

- **PRs**: Rebase merges for linear history. Require lint, build, type-check. Use GitHub CLI: `gh pr create --title "feat: add X" --body "Refs #123"`.
- **Protected Branches**:

| Branch    | Requirements |
|-----------|--------------|
| `main`    | 1 approval, status checks (lint/build/type-check), signed commits |
| `staging` | Deploy previews (Vercel) |

### Release Process
Continuous deployment: `main` → staging; tags → prod.

1. Update `CHANGELOG.md` (e.g., "Added `ChatWidget` @ `components\chat\chat-widget.tsx:11`").
2. Merge PR to `main`.
3. `npm version patch && git push --tags` (or `minor`/`major`).
4. Auto-deploy via GitHub Actions/Vercel.

## Local Development Setup

### Prerequisites
- Node.js ≥18 (use `.nvmrc`).
- Supabase project (remote recommended; local: `npx supabase start`).
- GitHub CLI (`gh pr create`).
- N8N (optional, for testing `/api/webhook/n8n`).

### Quick Start
```bash
git clone <repo>
cd carolinas-premium
npm ci  # CI-optimized install

cp .env.example .env.local
# Edit: SUPABASE_URL, SUPABASE_ANON_KEY, WEBHOOK_SECRET (used in `lib\config\webhooks.ts`)
npx @envsync/cli@latest || node -e "require('./lib/env').validateEnv()"

npm run db:generate  # Regenerates `types\supabase.ts` (`Database`)
```

### Run Commands
| Command              | Purpose                          | Port    |
|----------------------|----------------------------------|---------|
| `npm run dev`        | Dev server (HMR, fast refresh)   | 3000    |
| `npm run build`      | Prod build (check bundle/types)  | -       |
| `npm run lint`       | ESLint + Prettier                | -       |
| `npm run type-check` | `tsc --noEmit`                   | -       |
| `npm run db:generate`| Supabase types (`Database`)      | -       |
| `npm run db:studio`  | Supabase Studio UI               | 54323   |
| `npm run db:reset`   | Reset + migrate (dev only)       | -       |

- **Seeding**: Edit `supabase/migrations/` or use Supabase Dashboard to insert `ClienteInsert`/`AgendamentoInsert` (`types\index.ts`).
- **Key Routes**:

| Route                          | Page/Component                  | Notes |
|--------------------------------|---------------------------------|-------|
| `/`                            | Landing (`AboutUs`, `AnnouncementBar`) | Public, SEO-optimized |
| `/admin`                       | `AdminLayout` (`AdminHeader`)   | Auth via `middleware.ts` (`rateLimit`) |
| `/admin/agenda`                | `AgendaPage` (`AgendaHoje`)     | Calendar (`calendar-view.tsx`), `appointment-modal.tsx` |
| `/admin/clientes`              | `ClientesPage` (`ClientsFilters`, `clients-table.tsx`) | `ClientsTableProps` |
| `/admin/clientes/[id]`         | `ClienteDetalhePage`            | Tabs (`tab-agendamentos.tsx`, `tab-financeiro.tsx`) |
| `/admin/analytics/clientes`    | `ClientesAnalyticsPage`         | `ConversionFunnel` |
| `/admin/financeiro/categorias` | `CategoriasPage`                | `CategoryQuickForm`, `expense-categories.tsx` |
| `/admin/configuracoes/equipe`  | `EquipeConfigPage`              | `BusinessSettings` |

## Debugging & Testing

### Essential Tools
- **Supabase Clients**:
  ```ts
  // Server
  import { createClient } from '@/lib/supabase/server';
  const supabase = createClient();

  // Client ('use client')
  import { createClient } from '@/lib/supabase/client';
  ```
- **Webhooks** (`types\webhook.ts` – e.g., `AppointmentCreatedPayload`):
  ```ts
  import { getWebhookSecret, getWebhookUrl } from '@/lib/config/webhooks';
  const payload: AppointmentCreatedPayload = { event: 'appointment.created', data: { id: 1, cliente_id: 1 } };
  await fetch(getWebhookUrl(), {
    method: 'POST',
    headers: { 'x-webhook-secret': getWebhookSecret() },
    body: JSON.stringify(payload)
  });
  ```
  Hooks: `useNotifyAppointmentCreated` (`hooks\use-webhook.ts`).

- **Chat** (`useChat` @ `hooks\use-chat.ts:17`):
  ```tsx
  'use client';
  import { useChat, ChatMessage } from '@/hooks/use-chat';
  import { ChatWindow } from '@/components/chat/chat-window';

  function ChatExample() {
    const { messages, sendMessage, isLoading } = useChat();
    return <ChatWindow messages={messages as ChatMessage[]} onSend={sendMessage} loading={isLoading} />;
  }
  ```
  Embed: `<ChatWidget />` or session-based (`useChatSession`).

- **Exports**: `exportToExcel`/`exportToPDF` (`lib\export-utils.ts`):
  ```ts
  import { exportToExcel } from '@/lib/export-utils';
  const data: Cliente[] = await supabase.from('clientes').select('*');
  exportToExcel(data, 'clientes.xlsx');
  ```

- **Auth & Sessions**: `getUser`/`signOut` (`lib\actions\auth.ts`); `updateSession` (`lib\supabase\middleware.ts`).
- **Utils**: `cn` (Tailwind merge, `lib\utils.ts`), `formatCurrency`/`formatPhoneUS`/`isValidEmail` (`lib\formatters.ts`).
- **Business Settings**: Wrap app with `BusinessSettingsProvider` (`lib\context\business-settings-context.tsx`); server: `getBusinessSettingsServer` (`lib\business-config-server.ts`).
- **Logger**: `new Logger().info('Event', data)` (`lib\logger.ts`).

### Console Commands
```bash
npx supabase status  # Local Supabase
npx supabase logs db # Tail DB logs
npm run db:studio    # Browser UI: http://localhost:54323

# Network inspection (DevTools)
# - POST /api/chat (ChatRequest)
# - POST /api/webhook/n8n (IncomingWebhookPayload)
# - GET /api/slots (agenda slots)
```

## Code Standards & Review

### PR Checklist
- [ ] `npm run build && npm run lint && npm run type-check`
- [ ] Types: Extend `types\index.ts` (`ClienteUpdate`), `types\webhook.ts` (`WebhookPayload`); use `Json`/`Database` (`types\supabase.ts`).
- [ ] Components: Typed props (e.g., `ClientsTableProps` @ `components\clientes\clients-table.tsx:63`), `cn(...)` for Tailwind, ARIA labels.
- [ ] Hooks: `'use client';` in `hooks/`; custom: `useWebhook`/`useChat`.
- [ ] Server Actions: `sendWebhookAction` (`lib\actions\webhook.ts`), validate inputs.
- [ ] Security: `isValidEmail`/`isValidPhoneUS`, auth guards (`middleware.ts`), no `any`.
- [ ] i18n (Admin): `AdminI18nProvider` (`lib\admin-i18n\context.tsx`).
- [ ] Docs: Cross-ref symbols (e.g., `useChat` @ `hooks\use-chat.ts:17`).

### Common Pitfalls & Fixes

| Issue                     | Fix/Reference |
|---------------------------|---------------|
| Client/Server mismatch    | Server: `lib\supabase\server.ts`; Client: `lib\supabase\client.ts` |
| Hook not working          | Add `'use client'`; check `hooks\use-webhook.ts` |
| Env errors                | `validateEnv` (`lib\env.ts`); check `WEBHOOK_SECRET` |
| Webhook timeouts/failures | `getWebhookTimeout`/`isWebhookConfigured` (`lib\config\webhooks.ts`) |
| Currency/Phone formatting | `formatCurrencyInput`/`parseCurrency` (`lib\formatters.ts`) |
| No types after DB change  | `npm run db:generate` |

## Onboarding

### Week 1 Goals
1. Run `npm run dev`; explore `/admin/clientes`, `/admin/agenda`, `/admin/financeiro/categorias`.
2. Study core: `types\index.ts`, `hooks\use-chat.ts`/`use-webhook.ts`, `lib\supabase/`, `components\chat/`.
3. Create PR: "good first issue" (e.g., type `CategoryQuickFormProps` @ `components\financeiro\category-quick-form.tsx:18`).

### Resources
| Category     | Links/Details |
|--------------|---------------|
| **Issues**   | GitHub "good first issue" label |
| **Deploy**   | Vercel dashboard; tags → prod |
| **DB**       | Supabase Dashboard; `npm run db:generate` |
| **Webhooks** | Test `/api/webhook/n8n`; `WebhookService` |
| **Chat**     | `ChatWidget`/`ChatWindow`; `generateSessionId` (`lib\chat-session.ts`) |
| **Analytics**| `components\analytics\` (`ConversionFunnel`) |
| **Finance**  | `components\financeiro\` (`TransactionFormProps`) |
| **Logs**     | Supabase Logs, Vercel Analytics, `Logger` |

**Last Updated**: October 2024  
**Roadmap**: Add Jest unit tests (`/tests`), Playwright E2E, 80% CI coverage.

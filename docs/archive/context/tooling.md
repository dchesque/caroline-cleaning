# Tooling & Productivity Guide

This guide covers essential tools, scripts, configurations, workflows, and best practices for developing **Caroline Cleaning**—a Next.js 14+ app with TypeScript, Tailwind CSS, Supabase (client/server), N8N webhooks, AI-powered chat (Carol), admin dashboards (`app/(admin)/layout.tsx:AdminLayout`), analytics (`components/analytics/conversion-funnel.tsx:ConversionFunnel`), and financial tracking (`components/financeiro/transaction-form.tsx:TransactionFormProps`). Tooling enforces code quality, local/prod parity, and webhook reliability across 183+ files and 284+ symbols (e.g., 152 Components, 50 Controllers).

## Prerequisites

Install before starting:

| Tool | Min Version | Install | Purpose |
|------|-------------|---------|---------|
| **Node.js** | 18.17.0+ LTS | [nodejs.org](https://nodejs.org) | Next.js runtime, bundling |
| **pnpm** | 8.0.0+ | `npm i -g pnpm` | Fast package manager (`pnpm-lock.yaml`) |
| **Supabase CLI** | 1.125.0+ | `npm i -g supabase` | Local DB/Auth, migrations, types (`types/supabase.ts:Database`) |
| **ngrok** | Latest | [ngrok.com](https://ngrok.com) | Webhook tunneling (`app/api/webhook/n8n/route.ts`) |
| **Git** | 2.30.0+ | System pkg | VCS + Husky hooks |

### Post-Clone Setup
```bash
pnpm install
cp .env.example .env.local  # Set SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, WEBHOOK_SECRET
pnpm validate-env           # Runs `lib/env.ts:validateEnv()`
supabase gen types typescript --local > types/supabase.ts
supabase start              # Local Supabase (matches prod schema)
pnpm db:generate            # Types + validation (`types/index.ts:Cliente`, `Agendamento`)
```

**After DB changes**: `supabase db pull && pnpm db:generate && pnpm type-check`.

## Core Scripts (`package.json`)

| Script | Command | Description | Key Outputs/Integrations |
|--------|---------|-------------|--------------------------|
| `dev` | `pnpm dev` | Dev server (HMR, Tailwind JIT) | `localhost:3000` (`components/landing/announcement-bar.tsx:AnnouncementBar`) |
| `build` | `pnpm build` | Prod build + tsc strict | `.next/` |
| `start` | `pnpm start` | Prod server | Built app |
| `lint` | `pnpm lint` | ESLint + Prettier (`--fix`) | `lib/utils.ts:cn()`, `lib/formatters.ts:formatCurrency` |
| `format` | `pnpm format` | Prettier all | Consistency across `*.{ts,tsx}` |
| `type-check` | `pnpm type-check` | `tsc --noEmit` strict | `types/index.ts:DashboardStats`, `hooks/use-chat.ts:ChatMessage` |
| `db:generate` | `pnpm db:generate` | Supabase types | `types/supabase.ts:Json` |
| `export:types` | `pnpm export:types` | Types + env/utils | `lib/export-utils.ts:exportToExcel` |
| `validate-env` | `pnpm validate-env` | Env checks | `lib/config/webhooks.ts:getWebhookSecret()` |

**Usage**:
```bash
pnpm lint --fix && pnpm type-check  # Fix `components/admin/header.tsx:AdminHeader`
```

## Git Hooks (Husky + lint-staged)

Auto-quality on commit:

- **Pre-commit** (`.husky/pre-commit`):
  1. Lint/fix staged files.
  2. Incremental tsc.
  3. Regen `types/supabase.ts`.
  4. `pnpm validate-env`.

- **lint-staged.config.js**:
  ```js
  {
    "**/*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "types/supabase.ts": ["pnpm db:generate"]
  }
  ```

Reinstall: `pnpm husky:install`.

## Development Workflows

### 1. Local Prod Parity
```bash
echo "NEXT_PUBLIC_WEBHOOK_URL=https://abc123.ngrok.io" >> .env.local
pnpm validate-env
supabase start
pnpm dev
```
- Landing: `/` (`components/landing/about-us.tsx:AboutUs`).
- Admin: `/admin` (`lib/admin-i18n/context.tsx:AdminI18nProvider`).

### 2. Webhooks (N8N + Carol Integration)
- **Tunnel**: `ngrok http 3000`.
- **Utils**: `lib/config/webhooks.ts:getWebhookUrl()`, `isWebhookConfigured()`.
- **Types** (`types/webhook.ts`):
  ```ts
  import type { AppointmentCreatedPayload, WebhookPayload } from '@/types/webhook';
  const payload: AppointmentCreatedPayload = {
    event: 'appointment.created' as const,
    data: { id: 1, client_id: 'uuid-123' }
  };
  ```
- **Test**:
  ```bash
  curl -X POST "$NGROK_URL/api/webhook/n8n" \
    -H "Content-Type: application/json" \
    -H "Webhook-Secret: $(pnpm validate-env && echo $WEBHOOK_SECRET)" \
    -d @payload.json
  ```
- **Hooks** (`hooks/use-webhook.ts`):
  ```tsx
  import { useNotifyAppointmentCreated } from '@/hooks/use-webhook';
  const { mutate } = useNotifyAppointmentCreated();
  mutate(payload);  // Calls `lib/services/webhookService.ts:WebhookService`
  ```
- **Services**: `lib/services/webhookService.ts:WebhookService` (handles `WebhookResponse`).
- **Protection**: `middleware.ts:rateLimit`, `lib/actions/webhook.ts:sendWebhookAction()`.

### 3. AI Chat (Carol)
- **Components**: `components/chat/chat-widget.tsx:ChatWidget` → `chat-window.tsx:ChatWindow` + `chat-input.tsx:ChatInput`.
- **Hooks**: `hooks/use-chat.ts:useChat()` → `Message[]` / `ChatMessage`.
- **Sessions**: `lib/chat-session.ts:generateSessionId()`, `hooks/use-chat-session.ts:useChatSession()`.
- **API**: `app/api/chat/route.ts:ChatRequest`.
- **Logging**:
  ```tsx
  import Logger from '@/lib/logger';
  new Logger().info('Chat', { sessionId: getSessionId(), messages: payload });
  ```

### 4. Data/Exports/Analytics
- **Tables**: `components/clientes/clients-table.tsx:ClientsTableProps` (`types/index.ts:Cliente`).
- **Exports**:
  ```tsx
  import { exportToExcel, exportToPDF } from '@/lib/export-utils';
  exportToExcel(clients, 'clients.xlsx');
  ```
- **Filters**: `components/clientes/clients-filters.tsx:ClientsFilters`.
- **Stats**: `types/index.ts:DashboardStats`.

### 5. Admin/Agenda/Financeiro
- **Agenda**: `app/(admin)/admin/agenda/page.tsx:AgendaPage`, `components/agenda/calendar-view.tsx:CalendarView`.
- **Forms**: `components/agenda/appointment-form/*` (`AppointmentFormData`), `components/financeiro/category-quick-form.tsx:CategoryQuickForm`.
- **Config**: `lib/business-config.ts:BusinessSettings` + `lib/context/business-settings-context.tsx:BusinessSettingsProvider`.
- **Clientes**: `app/(admin)/admin/clientes/page.tsx:ClientesPage`.

### 6. Tracking
- **Provider**: `components/tracking/tracking-provider.tsx`.
- **Utils**: `lib/tracking/utils.ts:getUtmParams()`, `generateEventId()`.
- **Types**: `lib/tracking/types.ts:TrackingEventName`, `CustomData`.

## IDE Setup (VS Code)

### Extensions
| Extension | ID | Purpose |
|-----------|----|---------|
| Tailwind CSS IntelliSense | `bradlc.vscode-tailwindcss` | `cn()` autocomplete |
| ESLint | `dbaeumer.vscode-eslint` | Linting |
| Prettier | `esbenp.prettier-vscode` | Format on save |
| GitLens | `eamodio.gitlens` | Trace deps (e.g., `components/agenda/appointment-modal.tsx` → 8 importers) |
| Supabase | `supabase.supabase-vscode` | Schema + `lib/supabase/server.ts:createClient()` |
| Thunder Client | `rangav.vscode-thunder-client` | Test `/api/webhook/n8n`, `/api/carol/query` |

### `.vscode/settings.json`
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": { "source.fixAll.eslint": "explicit" },
  "typescript.preferences.importModuleSpecifier": "shortest",
  "tailwindCSS.experimental.classRegex": ["cn\\(([^)]*)\\)"],
  "emmet.includeLanguages": { "typescriptreact": "html" }
}
```

### Snippets (`.vscode/caroline-cleaning.code-snippets`)
```json
{
  "Supabase Client": {
    "prefix": "supabase-client",
    "body": ["import { createClient } from '@/lib/supabase/client';", "const supabase = createClient();"]
  },
  "Webhook Hook": {
    "prefix": "webhook-notify",
    "body": ["import { useNotifyAppointmentCreated } from '@/hooks/use-webhook';", "const { mutate } = useNotifyAppointmentCreated();"]
  },
  "Clients Table": {
    "prefix": "clients-table",
    "body": ["import ClientsTable from '@/components/clientes/clients-table';", "<ClientsTable clients={clients} />"]
  }
}
```

## Shell Aliases (`~/.zshrc` / `~/.bashrc`)
```bash
alias caroline-dev='cd ~/Workspace/caroline-cleaning && pnpm dev'
alias caroline-lint='pnpm lint --fix && pnpm format && pnpm type-check'
alias caroline-db='supabase start & sleep 5 && pnpm db:generate'
alias caroline-tunnel='ngrok http 3000'
alias caroline-env='pnpm validate-env'
alias caroline-webhook='curl -X POST http://localhost:3000/api/webhook/n8n -H "Content-Type: application/json" -d @payload.json'
```

## Debugging & Monitoring

| Area | Tools | References |
|------|--------|------------|
| **Logging** | `new Logger('Module').debug(data)` | `lib/logger.ts:Logger`, `LogEntry` / `LogLevel` |
| **Supabase** | Dashboard, Network | `lib/supabase/client.ts:createClient()`, `types/supabase.ts:Database` |
| **Webhooks** | ngrok inspect, Thunder Client | `types/webhook.ts:WebhookEventType`, `hooks/use-webhook.ts:useSendChatMessage()` |
| **Chat** | Console + Logger | `hooks/use-chat.ts:useChat()`, `types/index.ts:MensagemChat` |
| **Performance** | `pnpm build`, Lighthouse | `middleware.ts:middleware()` |
| **API Health** | `/api/ready` | Route handlers (`app/api/tracking/event/route.ts:EventPayload`) |

## Common Issues & Fixes
- **Type Mismatches**: `pnpm db:generate` after schema diffs.
- **Formatting**: Use `lib/formatters.ts` (`formatPhoneUS()`, `isValidEmail()`, `formatCurrencyUSD()`).
- **Imports**: Barrels (`types/index.ts:AgendamentoUpdate`, `ClienteInsert`).
- **High-Impact Files**: `components/agenda/appointment-modal.tsx` (8 deps), `app/(admin)/admin/configuracoes/webhooks/components/webhooks-tabs.tsx` (6 deps).
- **Security**: Secrets via `lib/config/webhooks.ts:getWebhookSecret()`; `middleware.ts:rateLimit`.
- **Team**: Share settings; PR env checks.

**Architecture**: Utils (55 symbols), Services (2, e.g., `WebhookService`), Components (152), Controllers (50), Repos (3). **Updated**: October 2024.

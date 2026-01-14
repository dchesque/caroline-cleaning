# Tooling & Productivity Guide

This guide documents essential tools, scripts, configurations, workflows, and best practices for developing **Carolinas Premium**—a Next.js 14+ application with TypeScript, Tailwind CSS, Supabase (client/server), N8N webhooks, AI-powered chat (Carol), admin dashboards, analytics, and financial tracking. Tooling ensures code quality, rapid iteration, local production parity, and webhook reliability.

## Prerequisites

Install these tools before development:

| Tool | Minimum Version | Install Command | Purpose |
|------|-----------------|-----------------|---------|
| **Node.js** | 18.17.0+ (LTS) | [nodejs.org](https://nodejs.org) | Runtime for Next.js, TypeScript, bundlers |
| **pnpm** | 8.0.0+ | `npm i -g pnpm` | Package manager (uses `pnpm-lock.yaml` for monorepo efficiency) |
| **Supabase CLI** | 1.125.0+ | `npm i -g supabase` | Local Supabase stack, schema migrations, type generation (`types/supabase.ts`) |
| **ngrok** | Latest | [ngrok.com](https://ngrok.com) | Secure tunneling for webhook testing (`/api/webhook/n8n`) |
| **Git** | 2.30.0+ | System package manager | VCS with Husky pre-commit hooks |

### Post-Clone Setup
```bash
pnpm install
cp .env.example .env.local  # Edit keys: SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, WEBHOOK_SECRET
pnpm validate-env           # Validates via `lib/env.ts:validateEnv()`
supabase gen types typescript --local > types/supabase.ts  # Generates `Database`, `Json` types
supabase start              # Starts local Supabase (DB + Auth, matches prod schema)
pnpm db:generate            # Regenerates types + validates
```

**Pro Tip**: After schema changes: `supabase db pull && pnpm db:generate && pnpm type-check`. Cross-reference `types/index.ts` for app types like `Cliente`, `Agendamento`.

## Core Scripts (`package.json`)

Scripts chain ESLint, Prettier, TypeScript checks, and Supabase sync. Prefix with `pnpm`.

| Script | Command | Description | Integrations & Outputs |
|--------|---------|-------------|-------------------------|
| `dev` | `pnpm dev` | Development server (HMR, Tailwind JIT, Supabase client) | `localhost:3000` (landing: `AboutUs`, `AnnouncementBar`) |
| `build` | `pnpm build` | Production build + strict type-check | `.next/` directory |
| `start` | `pnpm start` | Production server (post-build) | Serves built app |
| `lint` | `pnpm lint` | ESLint + Prettier (`--fix` to auto-correct) | `*.{ts,tsx}` (e.g., `lib/utils.ts:cn()`) |
| `format` | `pnpm format` | Prettier format all sources | Enforces consistency (e.g., `lib/formatters.ts:formatCurrency`) |
| `type-check` | `pnpm type-check` | `tsc --noEmit` (strict mode) | Validates `types/supabase.ts:Database`, `types/index.ts:DashboardStats` |
| `db:generate` | `pnpm db:generate` | Regenerate Supabase types | Updates `types/supabase.ts` |
| `export:types` | `pnpm export:types` | Export types + env/utils validation | Uses `lib/export-utils.ts:exportToExcel` |
| `validate-env` | `pnpm validate-env` | Runtime env checks | Calls `lib/config/webhooks.ts:getWebhookSecret()` |

**Example Usage**:
```bash
pnpm lint --fix  # Fixes issues in `components/admin/header.tsx:AdminHeader`
pnpm type-check  # Ensures `hooks/use-chat.ts:ChatMessage` compatibility
```

## Git Hooks (Husky + lint-staged)

Auto-enforced quality gates on commit. Installed via `postinstall`.

- **Pre-commit** (`.husky/pre-commit`):
  1. ESLint `--fix` + Prettier on staged `*.{ts,tsx}`.
  2. Incremental type-check.
  3. Auto-regenerate `types/supabase.ts`.
  4. Env validation (`pnpm validate-env`).

- **lint-staged.config.js**:
  ```js
  {
    "**/*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "types/supabase.ts": ["pnpm db:generate"]
  }
  ```

Reinstall hooks: `pnpm husky:install`.

## Development Workflows

### 1. Local Production Parity
```bash
# Env setup
echo "NEXT_PUBLIC_WEBHOOK_URL=https://your-ngrok-url.ngrok.io" >> .env.local
pnpm validate-env

# Supabase
supabase start

# Next.js
pnpm dev
```
- **Landing**: `localhost:3000` (`components/landing/about-us.tsx:AboutUs`).
- **Admin**: `/admin` (`app/(admin)/layout.tsx:AdminLayout`, `lib/admin-i18n/context.tsx:AdminI18nProvider`).

### 2. Webhook Development & Testing (N8N Integration)
- **Tunnel**: `ngrok http 3000`
- **Config Utils**: `lib/config/webhooks.ts` (`getWebhookUrl()`, `isWebhookConfigured()`, `getWebhookTimeout()`).
- **Payload Types** (`types/webhook.ts`):
  ```ts
  import type { AppointmentCreatedPayload, WebhookPayload } from '@/types/webhook';
  const payload: AppointmentCreatedPayload = {
    event: 'appointment.created',
    data: { id: 1, client_id: 'uuid', starts_at: new Date().toISOString() }
  };
  // Test via fetch or Thunder Client
  fetch(`${getWebhookUrl()}/n8n`, {
    method: 'POST',
    headers: { 'Webhook-Secret': getWebhookSecret() },
    body: JSON.stringify(payload)
  });
  ```
- **React Hooks** (`hooks/use-webhook.ts`):
  ```tsx
  const { mutate } = useNotifyAppointmentCreated();
  mutate(payload);  // Triggers `lib/services/webhookService.ts:WebhookService`
  ```
- **Middleware Protection**: `middleware.ts` (`rateLimit`, auth checks).

### 3. AI Chat (Carol) Development
- **Components**: `components/chat/chat-widget.tsx:ChatWidget` → `ChatWindow` + `ChatInput`.
- **Hooks**: `hooks/use-chat.ts:useChat()` returns `ChatMessage[]`.
- **Sessions**: `lib/chat-session.ts:generateSessionId()`, `getSessionId()`.
- **API**: `POST /api/chat` (`app/api/chat/route.ts:ChatRequest`).
- **Debug**:
  ```ts
  import Logger from '@/lib/logger';
  const logger = new Logger();
  logger.info('ChatSession', { sessionId: getSessionId(), payload });
  ```

### 4. Data Management & Exports
- **CRUD Pages**: `app/(admin)/admin/clientes/page.tsx:ClientesPage`, `components/clientes/clients-table.tsx:ClientsTableProps`.
- **Exports** (`lib/export-utils.ts`):
  ```ts
  import { exportToExcel, exportToPDF } from '@/lib/export-utils';
  exportToExcel(clients as Cliente[], 'clients.xlsx');  // `types/index.ts:Cliente`
  ```
- **Analytics**: `components/analytics/conversion-funnel.tsx:ConversionFunnel`, `types/index.ts:DashboardStats`.

### 5. Admin Features
- **Agenda**: `app/(admin)/admin/agenda/page.tsx:AgendaPage`, `components/agenda/appointment-form/use-appointment-form.ts:useAppointmentForm`.
- **Financeiro**: `components/financeiro/transaction-form.tsx:TransactionFormProps`, `components/financeiro/category-quick-form.tsx:CategoryQuickForm`.
- **Business Config**: `lib/business-config.ts:BusinessSettings`, `lib/context/business-settings-context.tsx:BusinessSettingsProvider`.

## IDE Configuration (VS Code Recommended)

### Essential Extensions
| Extension | ID | Purpose |
|-----------|----|---------|
| Tailwind CSS IntelliSense | `bradlc.vscode-tailwindcss` | Autocomplete for `lib/utils.ts:cn()` classes |
| ESLint | `dbaeumer.vscode-eslint` | Real-time linting/fixing |
| Prettier | `esbenp.prettier-vscode` | Formatting on save (`lib/formatters.ts:formatPhoneUS`) |
| GitLens | `eamodio.gitlens` | Dependency tracing (e.g., `components/agenda/appointment-modal.tsx` used by 8 files) |
| Supabase | `supabase.supabase-vscode` | Schema explorer, `lib/supabase/client.ts:createClient` |
| Thunder Client | `rangav.vscode-thunder-client` | API testing (`/api/webhook/n8n`, `/api/carol/query`) |

### `.vscode/settings.json`
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": { "source.fixAll.eslint": "explicit" },
  "typescript.preferences.importModuleSpecifier": "shortest",
  "tailwindCSS.experimental.classRegex": ["cn\\(([^)]*)\\)"],
  "emmet.includeLanguages": { "typescriptreact": "html" },
  "supabase.projectRef": "${env:SUPABASE_PROJECT_REF}"
}
```

### Custom Snippets (`.vscode/carolinas.code-snippets`)
```json
{
  "Supabase Server Client": {
    "prefix": "supabase-server",
    "body": ["import { createClient } from '@/lib/supabase/server';", "const supabase = createClient();"]
  },
  "Webhook Payload": {
    "prefix": "webhook-payload",
    "body": ["import type { AppointmentCreatedPayload } from '@/types/webhook';", "const payload: AppointmentCreatedPayload = { event: 'appointment.created', data: {} };"]
  },
  "Clients Table": {
    "prefix": "clients-table",
    "body": ["import { ClientsTableProps } from '@/components/clientes/clients-table';", "<ClientsTable clients={data} filters={filters} />"]
  }
}
```

## Shell Aliases
Add to `~/.zshrc` / `~/.bashrc`:
```bash
alias carol-dev='cd ~/Workspace/carolinas-premium && pnpm dev'
alias carol-lint='pnpm lint --fix && pnpm format && pnpm type-check'
alias carol-db='supabase start & sleep 5 && pnpm db:generate'
alias carol-tunnel='ngrok http 3000'
alias carol-env='pnpm validate-env'
alias carol-test-webhook='curl -X POST http://localhost:3000/api/webhook/n8n -H "Content-Type: application/json" -d @payload.json'
```

## Debugging & Monitoring

| Area | Tools/Commands | Key References |
|------|----------------|---------------|
| **Logging** | `new Logger().debug('Component', data)` | `lib/logger.ts:Logger`, `LogEntry` |
| **Supabase** | Supabase Dashboard, Network tab | `lib/supabase/server.ts:createClient`, `types/supabase.ts:Database` |
| **Webhooks** | ngrok inspect, Thunder Client | `types/webhook.ts:WebhookPayload`, `hooks/use-webhook.ts` |
| **Performance** | `pnpm build`, Lighthouse CI | `middleware.ts:rateLimit` |
| **API Routes** | `/api/ready`, `/api/pricing` | `app/api/ready/route.ts:GET` |

## Common Issues & Best Practices
- **Type Errors**: Regen types post-DB changes (`pnpm db:generate`).
- **Formatting**: Always use `lib/formatters.ts` utils (`formatCurrencyUSD`, `parseCurrency`, `isValidPhoneUS`).
- **Imports**: Prefer barrels (`types/index.ts:AgendamentoInsert`, `types/index.ts:ClienteUpdate`).
- **Dependencies**: High-impact files like `components/agenda/appointment-modal.tsx` (8 importers).
- **Security**: Webhook secrets via `getWebhookSecret()`; rate-limiting in `middleware.ts`.
- **Team Sync**: Share VS Code settings; validate env on PRs.

**Stats**: 183 files, 284 symbols (e.g., 139 Components, 44 Controllers). **Updated**: October 2024.

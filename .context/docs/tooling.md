# Tooling & Productivity Guide

This guide covers essential tools, scripts, configurations, workflows, and best practices for developing **Caroline Cleaning**—a Next.js 14+ app with TypeScript, Tailwind CSS, Supabase (client/server), N8N webhooks, AI-powered chat (Carol via `lib/ai/carol-agent.ts:CarolAgent`), admin dashboards (`app/(admin)/layout.tsx:AdminLayout`), analytics (`components/analytics/*`), and financial tracking (`components/financeiro/*`). Tooling enforces code quality, local/prod parity, and reliability across ~183 files and ~284 symbols (e.g., 152 Components, 50 Controllers, key exports like `CarolStateMachine` from `lib/ai/state-machine/engine.ts`).

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
cp .env.example .env.local  # Set SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, WEBHOOK_SECRET, OPENAI_API_KEY
pnpm validate-env           # Runs `lib/env.ts:validateEnv()` (checks `lib/config/webhooks.ts:getWebhookSecret()`)
supabase gen types typescript --local > types/supabase.ts
supabase start              # Local Supabase (matches prod schema via RLS/policies)
pnpm db:generate            # Regen types (`types/index.ts:Cliente`, `Agendamento`, `DashboardStats`)
```

**After DB changes**: Always run `supabase db pull && pnpm db:generate && pnpm type-check`.

## Core Scripts (`package.json`)

| Script | Command | Description | Key Outputs/Integrations |
|--------|---------|-------------|--------------------------|
| `dev` | `pnpm dev` | Dev server (HMR, Tailwind JIT) | `localhost:3000` (`components/landing/announcement-bar.tsx:AnnouncementBar`) |
| `build` | `pnpm build` | Prod build + `tsc --noEmit` strict | `.next/`, checks `middleware.ts:middleware()` |
| `start` | `pnpm start` | Prod server | Built app (test webhooks/prod parity) |
| `lint` | `pnpm lint` | ESLint + Prettier (`--fix`) | `lib/utils.ts:cn()`, `lib/formatters.ts:formatCurrencyUSD()` |
| `format` | `pnpm format` | Prettier all files | `*.{ts,tsx}` (enforces `lib/utils.ts:cn()` patterns) |
| `type-check` | `pnpm type-check` | `tsc --noEmit` strict | Validates `types/index.ts:AgendamentoUpdate`, `lib/ai/state-machine/types.ts:CarolState` |
| `db:generate` | `pnpm db:generate` | Supabase types + validation | `types/supabase.ts:Json`, `types/index.ts:ServicoTipo` |
| `export:types` | `pnpm export:types` | Bundle types/env/utils | Exports for docs/intellisense |
| `validate-env` | `pnpm validate-env` | Env validation | Ensures `lib/rate-limit.ts:RateLimitConfig`, AI keys |

**Quick quality pass**:
```bash
pnpm lint --fix && pnpm format && pnpm type-check
```

## Git Hooks (Husky + lint-staged)

Auto-enforce quality on commit/push:

- **Pre-commit** (`.husky/pre-commit`): Lint/fix, incremental TSC, regen types, env check.
- **Pre-push** (`.husky/pre-push`): Full type-check + build test.

**lint-staged.config.js**:
```js
{
  "**/*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "types/supabase.ts": ["pnpm db:generate"],
  "*.md": ["prettier --write"]
}
```

Reinstall hooks: `pnpm husky:install`.

## Development Workflows

### 1. Local Prod Parity
```bash
# Tunnel for webhooks
ngrok http 3000  # Note NGROK_URL
echo "NEXT_PUBLIC_WEBHOOK_URL=https://abc123.ngrok.io" >> .env.local
pnpm validate-env
supabase start & sleep 5 && pnpm db:generate
pnpm dev
```
- Public: `/` (`components/landing/*`).
- Admin: `/admin` (`lib/admin-i18n/context.tsx:AdminI18nProvider`, `components/admin/header.tsx:AdminHeader`).
- Auth: `/login` (`app/(auth)/login/page.tsx`).

### 2. Webhooks (N8N + Notifications)
- **Config**: `lib/config/webhooks.ts:getWebhookUrl()`, `isWebhookConfigured()`.
- **Types** (`types/webhook.ts`): `WebhookPayload`, `AppointmentCreatedPayload`, `ClientBirthdayPayload`.
  ```ts
  import type { WebhookEventType, AppointmentConfirmedPayload } from '@/types/webhook';
  const payload: AppointmentConfirmedPayload = {
    event: 'appointment.confirmed' as const,
    data: { id: 1, client_id: 'uuid', datetime: '2024-10-01T10:00:00Z' }
  };
  ```
- **Test endpoint**:
  ```bash
  curl -X POST "$NGROK_URL/api/webhook/n8n" \
    -H "Content-Type: application/json" \
    -H "Webhook-Secret: $WEBHOOK_SECRET" \
    -d '{"event": "appointment.created", "data": {...}}'
  ```
- **Hooks** (`hooks/use-webhook.ts:UseWebhookResult`):
  ```tsx
  import { useNotifyAppointmentCreated } from '@/hooks/use-webhook';
  const { mutate } = useNotifyAppointmentCreated();
  mutate(payload);  // → `lib/services/webhookService.ts:WebhookService`
  ```
- **Services**: `lib/services/webhookService.ts:WebhookService` (returns `types/webhook.ts:WebhookResponse`).
- **Rate Limiting**: `lib/rate-limit.ts:checkRateLimit(clientIp)`, `middleware.ts`.

### 3. AI Chat (Carol)
- **Core**: `lib/ai/carol-agent.ts:CarolAgent` + `lib/ai/state-machine/engine.ts:CarolStateMachine`.
- **Components**: `components/chat/chat-widget.tsx:ChatWidget` → `components/chat/chat-window.tsx:ChatWindow` + `components/chat/chat-input.tsx:ChatInput`.
- **Hooks**: `hooks/use-carol-chat.ts:UseCarolChatReturn` (streams `types/carol.ts:ChatResponse`).
- **API**: `/api/carol/query`, `/api/carol/actions` (`lib/ai/llm.ts:CarolLLM`).
- **Logging**: `lib/services/chat-logger.ts:ChatLoggerService` (`LogInteractionParams`, `SessionSummary`).
  ```tsx
  import Logger from '@/lib/logger';
  const logger = new Logger('Chat');
  logger.info('Session start', { sessionId, userIntent: 'booking' });
  ```
- **Testing**: Scripts like `scripts/run_booking_scenarios.ts:runAllScenarios()` simulate flows.

### 4. Data Management & Exports
- **Tables/Filters**: `components/clientes/clients-table.tsx` + `components/clientes/clients-filters.tsx:ClientsFilters` (`types/index.ts:Cliente`).
- **Agenda**: `components/agenda/calendar-view.tsx:CalendarView`, `components/agenda/appointment-form.tsx` (`components/agenda/types.ts:AppointmentFormData`).
- **Financeiro**: `components/financeiro/category-quick-form.tsx:CategoryQuickForm`.
- **Stats**: `types/index.ts:DashboardStats`, `app/(admin)/admin/analytics/*`.
- **Business Config**: `lib/business-config.ts:BusinessSettings` + `lib/context/business-settings-context.tsx:BusinessSettingsProvider`.

### 5. Tracking & Analytics
- **Provider**: `components/tracking/tracking-provider.tsx`.
- **Events**: `lib/tracking/types.ts:TrackingEventName`, `TrackingEventData` (`lib/tracking/utils.ts`).
  ```tsx
  import { trackEvent } from '@/lib/tracking';
  trackEvent('appointment_booked', { clientId, value: 150 });
  ```

### 6. Testing Scripts (`scripts/`)
Run AI/chat scenarios locally:
```bash
pnpm tsx scripts/run_booking_scenarios.ts  # Tests `lib/ai/state-machine/handlers/booking.ts`
pnpm tsx scripts/test_chat_scenarios.ts    # Multi-scenario (`flow-new-customer.test.ts`)
pnpm tsx scripts/analyze_chats.ts          # Log analysis (`lib/services/chat-logger.ts`)
```
Key scripts: `run_long_scenarios.ts`, `run_agent_direct.ts` (direct LLM streams).

## IDE Setup (VS Code)

### Recommended Extensions
| Extension | ID | Purpose |
|-----------|----|---------|
| Tailwind CSS IntelliSense | `bradlc.vscode-tailwindcss` | `cn('bg-blue-500', cls)` autocomplete |
| ESLint | `dbaeumer.vscode-eslint` | Fixes for `lib/utils.ts`, high-impact files like `components/agenda/appointment-modal.tsx` (8 importers) |
| Prettier | `esbenp.prettier-vscode` | Format on save |
| GitLens | `eamodio.gitlens` | Trace deps (e.g., `lib/ai/state-machine/handlers/index.ts` → 10 importers) |
| Supabase | `supabase.supabase-vscode` | Schema explorer, `lib/supabase/server.ts` |
| Thunder Client | `rangav.vscode-thunder-client` | API tests (`/api/tracking/event`, `/api/notifications/send`) |

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

## Shell Aliases
Add to `~/.zshrc` or `~/.bashrc`:
```bash
alias car-dev='cd ~/Workspace/caroline-cleaning && pnpm dev'
alias car-lint='pnpm lint --fix && pnpm type-check'
alias car-db='supabase start & sleep 5 && pnpm db:generate'
alias car-tunnel='ngrok http 3000'
alias car-webhook='curl -X POST $NGROK_URL/api/webhook/n8n -H "Content-Type: application/json" -d @payload.json'
alias car-ai-test='pnpm tsx scripts/run_10_scenarios.ts'
```

## Debugging & Monitoring

| Area | Tools | Key Refs |
|------|--------|----------|
| **Logging** | Console, `new Logger('AI').debug(data)` | `lib/logger.ts:Logger`, `lib/services/chat-logger.ts:LogEntry` |
| **Supabase** | Local dashboard (`supabase start`), Edge Logs | `types/supabase.ts:Database`, `lib/supabase/client.ts` |
| **Webhooks** | ngrok inspect, `/api/health` | `types/webhook.ts:WebhookEventType`, `app/api/webhook/n8n/route.ts` |
| **AI/Chat** | Browser console + logs | `lib/ai/state-machine/types.ts:UserIntent`, `hooks/use-carol-chat.ts` |
| **Performance** | Lighthouse, `pnpm build` | `middleware.ts:checkRateLimit`, `lib/ai/llm.ts:LLMCallRecord` |
| **Cron/Jobs** | `/api/cron/reminders`, Supabase Edge | `app/api/cron/*` |

**Health Check**: `curl http://localhost:3000/api/ready` (verifies DB, AI, webhooks).

## Common Issues & Fixes
| Issue | Fix | Refs |
|-------|-----|------|
| **Type errors post-DB** | `pnpm db:generate` | `types/supabase.ts` |
| **Invalid formats** | Use `lib/formatters.ts:isValidPhoneUS()`, `formatCurrencyInput()` | Phone/email/price inputs |
| **Webhook 401** | Check `WEBHOOK_SECRET`, `pnpm validate-env` | `lib/rate-limit.ts:getClientIp()` |
| **AI prompt fails** | Update `lib/ai/prompts.ts:buildCarolPrompt()`, test scripts | `lib/ai/llm.ts:CarolLLM` |
| **Husky broken** | `pnpm husky:install` | Git hooks |
| **Tailwind missing** | `pnpm dev` (JIT), check `tailwind.config.ts` | `lib/utils.ts:cn()` |

**High-Impact Files**: `lib/ai/state-machine/handlers/index.ts` (10 deps), `components/agenda/appointment-modal.tsx` (8 deps), `lib/ai/carol-agent.ts` (3 deps).

**Architecture Overview**: Config → Utils (55+ symbols) → Services (`WebhookService`, `ChatLoggerService`) → Components (152) → Controllers (50 API routes).

**Updated**: October 2024. For PRs, run full lint/type-check + test webhooks.

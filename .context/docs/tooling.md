# Tooling & Productivity Guide

This guide provides essential scripts, automation, and configurations for developing the Carolinas Premium repository—a Next.js 14+ application with TypeScript, Tailwind CSS, Supabase integration, N8N webhooks, AI chat (Carol), and admin dashboards. These tools enforce code quality, enable fast iteration, and replicate production environments locally.

## Prerequisites

- **Node.js**: >=18.17.0 (LTS) – Runtime for Next.js, TypeScript, and build tools. Download from [nodejs.org](https://nodejs.org).
- **pnpm**: >=8.0.0 – Fast package manager (matches `pnpm-lock.yaml`). Install: `npm i -g pnpm`.
- **Supabase CLI**: >=1.125.0 – Schema generation and local DB. Install: `npm i -g supabase`.
- **ngrok**: Latest – Local webhook tunneling. Download from [ngrok.com](https://ngrok.com).
- **Git**: >=2.30.0 – With pre-commit hooks enabled.

Post-clone setup:
```bash
pnpm install
cp .env.example .env.local  # Configure SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, WEBHOOK_SECRET, etc.
pnpm validate-env          # Validates env vars via lib/env.ts (e.g., webhook secrets, Supabase keys)
supabase gen types typescript --local > types/supabase.ts  # Generate DB types (Database type)
supabase start             # Local Supabase (DB + Auth) – Mirrors production schema
```

## Core Scripts (`package.json`)

Run with `pnpm <script>`. All integrate ESLint, Prettier, TypeScript checks, and Supabase sync.

| Script | Description | Example Usage |
|--------|-------------|---------------|
| `dev` | Dev server with HMR, Tailwind JIT, Supabase client. | `pnpm dev` (localhost:3000) |
| `build` | Production build + full type-check. | `pnpm build` (check `.next/`) |
| `start` | Production server post-build. | `pnpm start` |
| `lint` | ESLint + Prettier check/fix. | `pnpm lint --fix` |
| `format` | Prettier format all `*.{ts,tsx}`. | `pnpm format` |
| `type-check` | `tsc --noEmit` (strict mode). | `pnpm type-check` |
| `db:generate` | Regenerate `types/supabase.ts` (Json, Database types). | `pnpm db:generate` |
| `export:types` | DB types + env/utils validation. | `pnpm export:types` |
| `validate-env` | Checks required vars (e.g., `getWebhookSecret()` from `lib/config/webhooks.ts`). | `pnpm validate-env` |

**Pro Tip**: After DB schema changes: `supabase db pull && pnpm db:generate && pnpm type-check`.

## Git Hooks (Husky + lint-staged)

Auto-enforce quality on commit.

- **Pre-commit**:
  - ESLint `--fix` + Prettier on `*.{ts,tsx}`.
  - Type-check changed files.
  - Regenerate `types/supabase.ts` if modified.
  - Env validation.

Install: `pnpm husky:install` (auto-runs postinstall).

Config paths:
```
.husky/pre-commit
lint-staged.config.js  # "**/*.{ts,tsx}": ["eslint --fix", "prettier --write"]
```

## Development Workflows

### Local Production Mirror
1. `.env.local`: Set `NEXT_PUBLIC_WEBHOOK_URL=<ngrok-url>`, Supabase creds.
2. `pnpm validate-env`.
3. `supabase start`.
4. `pnpm dev`.

### Webhook Testing (N8N Integration)
- Tunnel: `ngrok http 3000 --path=/api/webhook/n8n`.
- Update `lib/config/webhooks.ts`: `getWebhookUrl()`, `isWebhookConfigured()`.
- Test payloads: `AppointmentCreatedPayload`, `ChatMessagePayload` (see `types/webhook.ts`).
- Hooks: `useNotifyAppointmentCreated()`, `useChat()` from `hooks/use-webhook.ts`, `hooks/use-chat.ts`.
- Verify: `POST /api/webhook/n8n` (auth via `verifyAuth`).

### AI Chat (Carol) Testing
- Client: `<ChatWidget />` embeds `ChatWindow`, `ChatInput`.
- API: `POST /api/chat` (uses `useChatSession`, session ID via `generateSessionId()`).
- Debug: Inspect `ChatMessage` types, `lib/logger.ts` (Logger class).

### Data Exports
- Utils: `exportToExcel(data)`, `exportToPDF(data)` (`lib/export-utils.ts`).
- Usage: Clients table (`components/clientes/clients-table.tsx`), analytics.

### Rate Limiting & Middleware
- `middleware.ts`: `rateLimit()` protects `/api/*` routes.
- Logs: `lib/logger.ts` (LogEntry, LogLevel).

## IDE Setup (VS Code Recommended)

Use `.vscode/settings.json` for overrides.

### Essential Extensions
| Extension | ID | Purpose |
|-----------|----|---------|
| Tailwind CSS IntelliSense | `bradlc.vscode-tailwindcss` | `cn()` classes (`lib/utils.ts`). |
| TypeScript Importer | `pmneo.tsimporter` | Imports from `types/index.ts` (Cliente, Agendamento). |
| ESLint | `dbaeumer.vscode-eslint` | Next.js config integration. |
| Prettier | `esbenp.prettier-vscode` | Format `formatCurrency`, phone utils (`lib/formatters.ts`). |
| GitLens | `eamodio.gitlens` | Trace webhook payloads. |
| Supabase | `supabase.supabase-vscode` | Query `lib/supabase/server.ts`, `client.ts`. |
| Thunder Client | `rangav.vscode-thunder-client` | Test `/api/chat`, `/api/carol/query`. |

### Key Settings (`.vscode/settings.json`)
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
  "Client Ficha Tab": {
    "prefix": "tab-ficha",
    "body": [
      "import { Tab${1:Info}Props } from './tab-${1:info}';",
      "export function Tab${1:Info}({ client }: Tab${1:Info}Props) {",
      "  return <div className=\"p-6\">{/* Content */}</div>;",
      "}"
    ]
  },
  "Webhook Notify": {
    "prefix": "use-notify",
    "body": ["const { mutate } = useNotify${1:AppointmentCreated}();"]
  },
  "Supabase Client": {
    "prefix": "supabase-client",
    "body": ["import { createClient } from '@/lib/supabase/client';", "const supabase = createClient();"]
  }
}
```

## Terminal Aliases (`.zshrc` / `.bashrc`)
```bash
alias carol-dev="cd ~/Workspace/carolinas-premium && pnpm dev"
alias carol-lint="pnpm lint && pnpm format && pnpm type-check"
alias carol-db="supabase start & sleep 5 && pnpm db:generate"
alias carol-tunnel="ngrok http 3000 --path=/api/webhook/n8n"
alias carol-env="pnpm validate-env"
```

## Debugging & Monitoring
- **Logger**: `new Logger().info('msg', { payload })` (`lib/logger.ts`).
- **Supabase**: Browser devtools for `createClient` queries.
- **Performance**: `pnpm build && pnpm start`, Lighthouse on landing (`AboutUs`, `AnnouncementBar`).
- **Analytics**: Inspect `DashboardStats` types, charts (`components/analytics/`).

## Common Pitfalls & Best Practices
- Regenerate `types/supabase.ts` after migrations.
- Restart `dev` after `.env` changes (webhook timeout: `getWebhookTimeout()`).
- Phone/Currency: Use `formatPhoneUS`, `formatCurrencyInput` (`lib/formatters.ts`).
- Imports: Prefer `types/index.ts` (Cliente, Agendamento, etc.).
- Sync team settings via VS Code Settings Sync.

Contribute setups! Updated: 2024-10 (post-symbol analysis: 247 symbols, focus on webhooks/chat).

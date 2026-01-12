# Development Workflow

This guide outlines the daily engineering processes for the **Carolinas Premium** repository—a Next.js 14+ application using the App Router, TypeScript, Tailwind CSS, Supabase (PostgreSQL), and integrations like N8N webhooks, chat widgets, admin dashboards, analytics, and financial tracking. It supports salon/client management with bookings (`Agendamento`), clients (`Cliente`), contracts (`Contrato`), and real-time features via hooks like `useChat` and `useWebhook`.

## Branching Strategy & Releases

### Trunk-Based Development
- **Main Branch (`main`)**: Always production-ready. Create short-lived branches from `main`:
  | Prefix | Example | Purpose |
  |--------|---------|---------|
  | `feat/` | `feat/admin-analytics` | New features (e.g., `components/analytics/conversion-funnel.tsx`) |
  | `fix/` | `fix/chat-session-leak` | Bug fixes (e.g., `hooks/use-chat-session.ts`) |
  | `refactor/` | `refactor/webhook-types` | Refactors (e.g., `types/webhook.ts`) |
  | `chore/` | `chore/upgrade-supabase` | Maintenance (e.g., `lib/supabase/`) |
  | `hotfix/` | `hotfix/payment-webhook` | Urgent prod issues |

- **Merges**: Use Pull Requests (PRs) with rebase for linear history. No `develop` branch.
- **Protected Branches**:
  | Branch | Requirements |
  |--------|--------------|
  | `main` | PR required, 1 approval, status checks (lint, build, type-check), signed commits |
  | `staging` | Deploy previews optional |

### Release Process
- **Cadence**: Continuous deployment to staging on `main` merges. Prod releases via semantic tags (`v1.2.3`).
- **Steps**:
  1. Update `CHANGELOG.md` in PR (reference new exports like `DashboardStats` from `types/index.ts`).
  2. Merge to `main`.
  3. Tag: `npm version patch && git push --tags`.
  4. CI/CD (GitHub Actions/Vercel) deploys automatically.
- **Automation**: See `.github/workflows/` (if present) or Vercel dashboard for builds.

## Local Development Setup

### Prerequisites
- Node.js ≥18 (use `.nvmrc` or `nvm use`).
- Supabase project (remote DB preferred; local via `npx supabase start`).
- GitHub CLI (`gh pr create` for quick PRs).
- PostgreSQL basics (schema in `types/supabase.ts` via `Database` type).
- Optional: N8N for webhook testing.

### Quick Start
```bash
git clone https://github.com/your-org/carolinas-premium.git
cd carolinas-premium
npm install

# Env setup
cp .env.example .env.local
# Edit: SUPABASE_URL, SUPABASE_ANON_KEY, WEBHOOK_SECRET (see `lib/config/webhooks.ts`)
npx @envsync/cli@latest  # Or manually validate with `lib/env.ts:validateEnv()`

# Generate types
npm run db:generate  # `npx supabase gen types typescript --local > types/supabase.ts`
```

### Run Commands
| Command | Purpose | Port |
|---------|---------|------|
| `npm run dev` | Dev server (HMR, App Router) | 3000 |
| `npm run build` | Prod build (verifies types, bundle) | - |
| `npm run start` | Prod server | 3000 |
| `npm run lint` | ESLint + Prettier | - |
| `npm run type-check` | tsc --noEmit | - |
| `npm run db:generate` | Update Supabase types | - |
| `npm run db:studio` | Supabase Studio | 54323 |

- **Database Seeding**: Run migrations in `supabase/migrations/`. Insert sample `Cliente`/`Agendamento` via Supabase dashboard.
- **Key Routes**:
  | Route | Component | Notes |
  |-------|-----------|-------|
  | `/` | Landing (e.g., `AboutUs`, `FAQ`) | Public |
  | `/admin` | `AdminLayout` | Auth via `middleware.ts` |
  | `/admin/agenda` | `AgendaPage` | `AgendaHoje` data |
  | `/admin/clientes/[id]` | `ClienteDetalhePage` | Tabs: `tab-agendamentos.tsx`, etc. |
  | `/admin/analytics` | `ClientesAnalyticsPage` | Charts: `trends-chart.tsx` |

## Debugging & Testing

### Common Tools
- **Supabase**: Logs in dashboard; client creation: `createClient` from `lib/supabase/server.ts` (RSC) or `client.ts` (client).
- **Webhooks**: POST to `/api/webhook/n8n` with `types/webhook.ts` payloads (e.g., `AppointmentCreatedPayload`). Verify: `getWebhookSecret()` from `lib/config/webhooks.ts`.
  ```ts
  // Example payload test
  const payload: AppointmentCreatedPayload = { /* ... */ };
  await fetch('/api/webhook/n8n', { method: 'POST', body: JSON.stringify(payload) });
  ```
- **Chat**: Embed `ChatWidget` or use `useChat()` hook.
  ```tsx
  import { useChat } from '@/hooks/use-chat';
  const { messages, sendMessage } = useChat();  // See `ChatMessage`
  ```
- **Exports**: Trigger `exportToExcel`/`exportToPDF` from `lib/export-utils.ts` in tables (e.g., clients).
- **Auth**: `getUser()` from `lib/actions/auth.ts`; rate-limit in `middleware.ts`.
- **Logger**: `Logger` class in `lib/logger.ts` for custom logs.

### Console Tips
```
# Tail Supabase logs: npx supabase logs
# DevTools: React Query for hooks (`useWebhook`), Supabase auth state
# Network: Inspect `/api/chat/route.ts` for `ChatRequest`
```

## Code Standards & Review

### PR Checklist
- [ ] `npm run build && npm run lint && npm run type-check`
- [ ] Extend types: `types/index.ts` (e.g., `ClienteInsert`), `types/webhook.ts`
- [ ] Utils: `cn()` (`lib/utils.ts`), formatters (`lib/formatters.ts`: `formatCurrency`, `formatPhoneUS`)
- [ ] Components: Typed props (e.g., `ChatWindowProps`), accessible (ARIA), Tailwind via `cn`
- [ ] Hooks: Client-only (`useChat`, `useWebhook`); server: `sendWebhookAction`
- [ ] Security: Auth in actions (`signOut`, `getUser`); validate inputs
- [ ] Docs: Update `CHANGELOG.md`; cross-ref symbols (e.g., `@ components/chat/chat-widget.tsx:11`)
- [ ] No `any`; prefer `Json` from `types/supabase.ts`

### Approvals
- 1 review required.
- Reference symbols: [Public API](#) or [Symbol Index](#).
- AI Assistance: Use agents for symbol analysis (e.g., `analyzeSymbols` on `types/index.ts`).

### Pitfalls
| Issue | Fix |
|-------|-----|
| Supabase client mismatch | Server: `lib/supabase/server.ts`; Client: `client.ts` |
| Hook misuse | `'use client'` dir for `hooks/` |
| Env errors | `validateEnv()` before runtime |
| Webhook timeout | Config: `getWebhookTimeout()` |

## Onboarding

### Week 1
1. Run `npm run dev`; explore `/admin/clientes`, `/admin/agenda`.
2. Read: `types/index.ts`, `hooks/use-chat.ts`, `lib/supabase/`.
3. PR: Good first issues (GitHub label); e.g., enhance `FAQ` component.

### Resources
| Category | Details |
|----------|---------|
| **Issues** | [Good First](https://github.com/your-org/carolinas-premium/issues?q=is%3Aopen+label%3A%22good+first+issue%22) |
| **Deploy** | Vercel dashboard (auto on tags) |
| **DB** | Supabase SQL Editor; `npm run db:generate` |
| **Webhooks** | `lib/config/webhooks.ts`; test `/api/webhook/n8n` |
| **Chat** | `components/chat/chat-widget.tsx` |
| **Analytics** | `components/analytics/` (e.g., `ConversionFunnel`) |
| **Dashboards** | Supabase Logs, Vercel Analytics |
| **Team** | Slack #dev-carolinas |

**Last Updated**: October 2023  
**Next**: Add Jest tests, CI YAML for coverage.

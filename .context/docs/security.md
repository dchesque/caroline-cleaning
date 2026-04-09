# Security & Compliance

**Status**: Active  
**Last Updated**: 2024-11-01  
**Owners**: Security Team / DevOps  
**Repository**: [Carolinas Premium](https://github.com/carolinas-premium) (Next.js 14, Supabase, N8N webhooks, Upstash Redis)

This document outlines security practices for authentication, authorization, data protection, secrets management, webhook security, rate limiting, logging, AI/chat security, compliance, and incident response. All Supabase tables (`Cliente`, `Agendamento`, `Contrato`, `Financeiro`, `Configuracao`, `AreaAtendida`, `ServicoTipo`, `Addon`, etc.) enforce Row Level Security (RLS). Follow codebase conventions: RLS-first queries, PII scrubbing, no client-side secrets.

## Authentication & Authorization

### Identity Provider
- **Supabase Auth**: Email/password + OAuth. Server-side: service role key for admin ops. Client-side: RLS enforced.
  - **Server Client**: [`lib/supabase/server.ts`](lib/supabase/server.ts) → `createClient()` (exported).
  - **Client Client**: [`lib/supabase/client.ts`](lib/supabase/client.ts) → `createClient()` (exported).
  - **Types**: [`types/supabase.ts`](types/supabase.ts) → `Database` (exported), `Json` (exported), `UserProfile` (exported from `types/index.ts`).

### Session Management
- **Cookies/Refresh Tokens**: Supabase-managed.
  - **Middleware**: [`lib/supabase/middleware.ts`](lib/supabase/middleware.ts) → `updateSession()` (exported).
- **Global Middleware** ([`middleware.ts`](middleware.ts) → `middleware()` exported):
  | Feature       | Implementation                  | Dependencies                          |
  |---------------|---------------------------------|---------------------------------------|
  | Rate Limiting | `rateLimit()` (Upstash Redis)   | `lib/rate-limit.ts` → `checkRateLimit()`, `getClientIp()` |
  | Auth Checks   | `getUser()` integration         | `lib/actions/auth.ts`                 |

### Protected Layouts & Routes
| Layout/Provider      | Path/Context             | Key Exports                                      |
|----------------------|--------------------------|--------------------------------------------------|
| `AdminLayout`        | `app/(admin)/`           | [`app/(admin)/layout.tsx`](app/(admin)/layout.tsx) → `AdminLayout` |
| `AuthLayout`         | `app/(auth)/`            | [`app/(auth)/layout.tsx`](app/(auth)/layout.tsx) → `AuthLayout` |
| `AdminI18nProvider`  | Admin-wide i18n          | [`lib/admin-i18n/context.tsx`](lib/admin-i18n/context.tsx) → `AdminI18nProvider` |
| `BusinessSettingsProvider` | Business config     | [`lib/context/business-settings-context.tsx`](lib/context/business-settings-context.tsx) |

### Permissions & RLS
- **Supabase RLS**: Enabled on all tables. Policies: `SELECT/INSERT/UPDATE/DELETE` based on `auth.uid()`.
- **Roles** (from `UserProfile`):
  | Role  | Access Level          | Examples                                      |
  |-------|-----------------------|-----------------------------------------------|
  | admin | Full CRUD             | `ClientesPage`, `AgendaPage`, `CategoriasPage` |
  | user  | Read (own data)       | `DashboardStats`, `AgendaHoje`                 |
  | guest | Public/chat/landing   | `ChatWidget`, `ChatWindow`                     |

**API Route Protection Example** ([`app/api/financeiro/categorias/[id]/route.ts`](app/api/financeiro/categorias/[id]/route.ts)):
```ts
import { getUser } from '@/lib/actions/auth';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const user = await getUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const supabase = createClient();
  const { error } = await supabase.from('categorias').delete().eq('id', params.id);
  // RLS auto-enforced...
}
```

**Server Action Example** (`lib/actions/*`):
```ts
import { getUser } from '@/lib/actions/auth';

export async function deleteCategory(id: string) {
  const user = await getUser();
  if (user?.role !== 'admin') throw new Error('Unauthorized');
  // Use server Supabase client...
}
```

## Secrets & Sensitive Data

### Environment Variables
- **Validation**: [`lib/env.ts`](lib/env.ts) → `validateEnv()` (startup).
| Variable                | Purpose                       | Used In                                      |
|-------------------------|-------------------------------|----------------------------------------------|
| `SUPABASE_SERVICE_KEY`  | Admin Supabase                | `lib/supabase/server.ts`                     |
| `NEXTAUTH_SECRET`       | JWT signing                   | Supabase middleware                          |
| `WEBHOOK_SECRET`        | HMAC verification             | `lib/config/webhooks.ts` → `getWebhookSecret()` |
| `UPSTASH_REDIS_URL`     | Rate limiting                 | `lib/rate-limit.ts`, `middleware.ts`         |
| `N8N_WEBHOOK_URL`       | Outbound webhooks             | `lib/config/webhooks.ts`                     |
| `OPENAI_API_KEY`        | AI/LLM (Carol)                | `lib/ai/llm.ts` → `CarolLLM`                 |

- **Practices**: ESLint no-hardcode. Quarterly rotation (Vercel dashboard). Encrypted business settings: [`lib/business-config.ts`](lib/business-config.ts) → `BusinessSettings` (exported).

### Data Protection
- **Transit**: HTTPS enforced (`next.config.js`).
- **Rest**: Supabase pgCrypto + RLS.
- **PII** (`Cliente.phone`, `email`; `Agendamento` details):
  | Level | Examples              | Protections                              |
  |-------|-----------------------|------------------------------------------|
  | High  | Keys, passwords       | Hashed, log-excluded                     |
  | Medium| Phones/emails         | Mask via `lib/formatters.ts`             |
  | Low   | Names, appts          | RLS only                                 |

**PII Formatting Example**:
```ts
import { formatPhoneUS, isValidPhoneUS, isValidEmail } from '@/lib/formatters';

const safePhone = formatPhoneUS('(555)1234567'); // '(555) 123-4567'
if (isValidEmail(client.email)) console.log('Valid:', client.email); // Safe log
```

**Logging**: [`lib/logger.ts`](lib/logger.ts) → `Logger` class (`LogLevel`: DEBUG/INFO/WARN/ERROR), `LogEntry`. Auto-PII scrub.

## Rate Limiting & Abuse Prevention
- **Core**: [`lib/rate-limit.ts`](lib/rate-limit.ts) → `checkRateLimit(expires: number, limit: number)`, `RateLimitConfig`, `getClientIp()`. Upstash Redis.
  - Limits: 100/min IP, 500/day user. Skips admins/public (`/api/chat`, landing).
- **Usage** (middleware):
```ts
import { checkRateLimit } from '@/lib/rate-limit';
// In middleware.ts
if (!(await checkRateLimit(60, 100))) return new Response('Rate limited');
```
- **Chat-Specific**: Applied to `app/api/carol/query`, `app/api/chat`.

## AI/Chat Security
- **Carol Agent**: [`lib/ai/carol-agent.ts`](lib/ai/carol-agent.ts) → `CarolAgent`, `ChatResponse`. State machine: [`lib/ai/state-machine/engine.ts`](lib/ai/state-machine/engine.ts) → `CarolStateMachine`.
- **LLM**: [`lib/ai/llm.ts`](lib/ai/llm.ts) → `CarolLLM`, `LLMCallRecord`. Prompt guards: system prompts in `lib/ai/prompts.ts` → `buildCarolPrompt()`, `CarolConfig`.
- **Logging**: [`lib/services/chat-logger.ts`](lib/services/chat-logger.ts) → `ChatLoggerService`. Logs: `LogInteractionParams`, `SessionSummary`. Admin view: `app/(admin)/admin/chat-logs/*` → `ChatLogDetailPage`.
- **Protections**: Rate limits, input sanitization (`lib/utils.ts` → `cn()`), no PII in prompts.

## Webhook Security

### Inbound (N8N)
- **Endpoint**: [`app/api/webhook/n8n/route.ts`](app/api/webhook/n8n/route.ts).
  - **Verification**: HMAC-SHA256 (`getWebhookSecret()`).
  - **Payloads** ([`types/webhook.ts`](types/webhook.ts)):
    | Event                    | Payload Type                      |
    |--------------------------|-----------------------------------|
    | Chat Message             | `ChatMessagePayload`             |
    | Lead Created             | `LeadCreatedPayload`             |
    | Appointment Created      | `AppointmentCreatedPayload`      |
    | Appointment Cancelled    | `AppointmentCancelledPayload`    |
    | ... (full list: 13 types)| `WebhookPayload` (union)         |

### Outbound
- **Config**: [`lib/config/webhooks.ts`](lib/config/webhooks.ts) → `getWebhookUrl()`, `getWebhookTimeout()`.
- **Hooks**: [`hooks/use-webhook.ts`](hooks/use-webhook.ts) → `useWebhook()` (`UseWebhookResult`).
- **Service**: [`lib/services/webhookService.ts`](lib/services/webhookService.ts) → `WebhookService`.

**Example**:
```tsx
import { useNotifyAppointmentCreated } from '@/hooks/use-webhook';

const { mutate } = useNotifyAppointmentCreated();
mutate({ appointmentId, clientName: 'John Doe' }); // → AppointmentCreatedPayload
```

## Compliance & Auditing
| Standard | Status            | Controls                               |
|----------|-------------------|----------------------------------------|
| GDPR/CCPA| Compliant         | Consent (`ClienteInsert`), RLS         |
| PCI-DSS  | N/A               | No payments                            |
| SOC 2    | Type 1 Progress   | Audits (`ChatLoggerService`), limits   |

- **Audits**: Supabase logs, `Logger`, `npm audit`.

## Incident Response
| Severity | Time     | Actions                       | Contacts                  |
|----------|----------|-------------------------------|---------------------------|
| Critical | 15 min  | Isolate DB, revoke keys       | security@carolinasp.com  |
| High     | 1 hr    | Rotate secrets, notify        | devops@carolinasp.com    |
| Medium   | 4 hrs   | Review logs                   | #security Slack          |

**Steps**: Triage (`Logger`), notify (`/api/notifications/send`), contain (Redis scale), recover (RLS test), post-mortem (GitHub Issue).

## Cross-References
- **Auth**: `lib/actions/auth.ts` → `getUser()`, `signOut()`.
- **Rate Limit**: `lib/rate-limit.ts` → `RateLimitConfig`.
- **Logger/Chat**: `lib/services/chat-logger.ts`, `lib/logger.ts`.
- **Webhooks**: `types/webhook.ts` (`WebhookEventType`), `hooks/use-webhook.ts`.
- **AI**: `lib/ai/*` → `CarolStateMachine`, `CarolAgent`.
- **Utils**: `lib/formatters.ts`, `lib/utils.ts` → `formatCurrency()`.

## Development Practices
- **PRs**: `@security-owner` review for auth/AI/webhook.
- **CI**: `npm audit`, `validateEnv()`.
- **Scans**: Snyk/Dependabot.
- **Conventions**: Server actions > API routes; hash PII (`lib/tracking/*`).

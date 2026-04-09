# Security & Compliance

**Status**: Active  
**Last Updated**: 2024-10-28  
**Owners**: Security Team / DevOps  
**Repository**: [Carolinas Premium](https://github.com/carolinas-premium) (Next.js 14, Supabase, N8N webhooks, Upstash Redis)

This document outlines security practices for authentication, authorization, data protection, secrets management, webhook security, rate limiting, logging, compliance, and incident response. All Supabase tables (`Cliente`, `Agendamento`, `Contrato`, `Financeiro`, `Configuracao`, `AreaAtendida`, etc.) enforce Row Level Security (RLS). Follow codebase conventions for secure development.

## Authentication & Authorization

### Identity Provider
- **Supabase Auth**: Supports email/password and OAuth. Server-side uses service role key for admin ops; client-side enforces RLS.
  - **Server Client**: [`lib/supabase/server.ts`](lib/supabase/server.ts) → `createClient()` (exported).
  - **Client Client**: [`lib/supabase/client.ts`](lib/supabase/client.ts) → `createClient()` (exported).
  - **Types**: [`types/supabase.ts`](types/supabase.ts) → `Database` (exported), `Json` (exported).

### Session Management
- **Cookies & Refresh Tokens**: Managed by Supabase Auth.
  - **Middleware**: [`lib/supabase/middleware.ts`](lib/supabase/middleware.ts) → `updateSession()` (exported).
- **Global Middleware** ([`middleware.ts`](middleware.ts)):
  | Feature       | Implementation              | Dependencies                     |
  |---------------|-----------------------------|----------------------------------|
  | Rate Limiting | `rateLimit()` (Upstash Redis) | IP/user limits (100/min IP, 500/day user) |
  | Auth Checks   | Integrates `getUser()`      | [`lib/actions/auth.ts`](lib/actions/auth.ts) |

### Protected Layouts & Routes
| Layout/Provider     | Path/Context             | Key Exports                          |
|---------------------|--------------------------|--------------------------------------|
| `AdminLayout`       | `app/(admin)/`          | [`app/(admin)/layout.tsx`](app/(admin)/layout.tsx) → `AdminLayout` (exported) |
| `AuthLayout`        | `app/(auth)/`           | [`app/(auth)/layout.tsx`](app/(auth)/layout.tsx) → `AuthLayout` (exported) |
| `AdminI18nProvider` | Admin-wide i18n         | [`lib/admin-i18n/context.tsx`](lib/admin-i18n/context.tsx) → `AdminI18nProvider` (exported), `AdminI18nContextType` |

### Permissions & RLS
- **Supabase RLS**: Enabled on all core tables with policies for `Cliente*`, `Agendamento*`, `Contrato`, `Financeiro`, `Configuracao`, `AreaAtendida`.
- **Roles**:
  | Role  | Access Level          | Examples                                      |
  |-------|-----------------------|-----------------------------------------------|
  | Admin | Full CRUD             | `ClientesPage`, `AgendaPage`, `ClienteDetalhePage`, `ConfiguracoesPage`, `CategoriasPage` |
  | User  | Read (own data)       | `DashboardStats`, `AgendaHoje`                |
  | Guest | Public/landing/chat   | `ChatWidget`, `AnnouncementBar`, `AboutUs`    |

**API Route Protection Example** ([`app/api/financeiro/categorias/[id]/route.ts`](app/api/financeiro/categorias/[id]/route.ts)):
```ts
import { getUser } from '@/lib/actions/auth';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const user = await getUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // RLS-protected Supabase operation...
}
```

**Server Actions Example** ([`lib/actions/auth.ts`](lib/actions/auth.ts)):
```ts
import { getUser } from '@/lib/actions/auth';

export async function deleteCategory(id: string) {
  const user = await getUser();
  if (user?.role !== 'admin') throw new Error('Unauthorized');
  // RLS-protected delete via `createClient`...
}
```
- Related: `signOut()` (exported from `lib/actions/auth.ts`).

## Secrets & Sensitive Data

### Environment Variables
- **Validation**: [`lib/env.ts`](lib/env.ts) → `validateEnv()` (exported, runs on startup).
| Variable                | Purpose                       | Used In                                      |
|-------------------------|-------------------------------|----------------------------------------------|
| `SUPABASE_SERVICE_KEY`  | Admin Supabase access         | `lib/supabase/server.ts`                     |
| `NEXTAUTH_SECRET`       | Session/JWT signing           | Supabase middleware                          |
| `WEBHOOK_SECRET`        | HMAC verification             | [`lib/config/webhooks.ts`](lib/config/webhooks.ts) → `getWebhookSecret()` (exported) |
| `UPSTASH_REDIS_URL`     | Rate limiting                 | `middleware.ts#rateLimit()`                  |
| `N8N_WEBHOOK_URL`       | Outbound webhooks             | [`lib/config/webhooks.ts`](lib/config/webhooks.ts) → `getWebhookUrl()` (exported) |

- **Practices**: No hardcoding (ESLint enforced). Rotate quarterly via Vercel. Business settings stored encrypted: [`lib/business-config.ts`](lib/business-config.ts) → `BusinessSettings` (exported), `mapDbToSettings()`, `saveBusinessSettings()`.

### Data Protection
- **In Transit**: HTTPS-only (Next.js `config`).
- **At Rest**: Supabase pgCrypto + RLS.
- **PII Handling**:
  | PII Level | Examples                     | Protections                                   |
  |-----------|------------------------------|-----------------------------------------------|
  | High      | Passwords, keys              | Hashed (Supabase Auth), excluded from logs    |
  | Medium    | Phone/email (`Cliente`)      | RLS + masking via [`lib/formatters.ts`](lib/formatters.ts) |
  | Low       | Names, appointments          | Role-based RLS                                |

**PII Masking Example**:
```ts
import { formatPhoneUS, isValidPhoneUS, formatZipCode, isValidZipCode, isValidEmail } from '@/lib/formatters';

const safePhone = formatPhoneUS(client.phone); // '(555) 123-4567'
const safeZip = formatZipCode(client.zip);     // '12345'
if (isValidEmail(client.email)) { /* log safely */ }
```

**Logging**: [`lib/logger.ts`](lib/logger.ts) → `Logger` class, `LogEntry` interface, `LogLevel` enum (DEBUG/INFO/WARN/ERROR). Auto-scrubs PII.

## Rate Limiting & Abuse Prevention
- **Implementation**: [`middleware.ts`](middleware.ts) → `rateLimit()` (exported, Upstash Redis).
  - Limits: 100 req/min (IP), 500/day (user). Bypasses public (`/api/chat`, landing) and admins.
  - Admin check: `getUser().role === 'admin'`.
- **Webhook Timeouts**: [`lib/config/webhooks.ts`](lib/config/webhooks.ts) → `getWebhookTimeout()` (exported).

## Webhook Security

### Inbound (N8N)
- **Endpoint**: [`app/api/webhook/n8n/route.ts`](app/api/webhook/n8n/route.ts) → `IncomingWebhookPayload`, `IncomingEventType`.
  - **Verification**: HMAC-SHA256 with `getWebhookSecret()`.
  - **Payload Types** ([`types/webhook.ts`](types/webhook.ts)):
    | Event                       | Type                          | Line |
    |-----------------------------|-------------------------------|------|
    | Chat Message                | `ChatMessagePayload`         | 39   |
    | Lead Created                | `LeadCreatedPayload`         | 57   |
    | Lead Updated                | `LeadUpdatedPayload`         | 74   |
    | Lead Converted              | `LeadConvertedPayload`       | 80   |
    | Appointment Created         | `AppointmentCreatedPayload`  | 90   |
    | Appointment Confirmed       | `AppointmentConfirmedPayload`| 108  |
    | Appointment Completed       | `AppointmentCompletedPayload`| 118  |
    | Appointment Cancelled       | `AppointmentCancelledPayload`| 130  |
    | Appointment Rescheduled     | `AppointmentRescheduledPayload`| 143 |
    | Feedback Received           | `FeedbackReceivedPayload`    | 159  |
    | Payment Received            | `PaymentReceivedPayload`     | 176  |
    | Client Inactive             | `ClientInactiveAlertPayload` | 191  |
    | Client Birthday             | `ClientBirthdayPayload`      | 202  |
  - Types: `WebhookEventType` (exported), `WebhookPayload` (exported), `WebhookResponse`, `WebhookOptions`.

### Outbound Hooks
- **Config**: [`lib/config/webhooks.ts`](lib/config/webhooks.ts) → `getWebhookUrl()`, `isWebhookConfigured()`, `getWebhookSecret()`, `getWebhookTimeout()` (exported).
- **Hooks**: [`hooks/use-webhook.ts`](hooks/use-webhook.ts) → `useWebhook()` (`UseWebhookResult`), `useSendChatMessage()`, `useNotifyLeadCreated()`, `useNotifyAppointmentCreated()`, etc.
- **Service**: [`lib/services/webhookService.ts`](lib/services/webhookService.ts) → `WebhookService` class.
- **Actions**: [`lib/actions/webhook.ts`](lib/actions/webhook.ts) → `sendWebhookAction()`.

**Usage Example**:
```tsx
import { useNotifyAppointmentCreated } from '@/hooks/use-webhook';

function OnAppointmentCreate({ appointmentId }: { appointmentId: string }) {
  const { mutate } = useNotifyAppointmentCreated();
  mutate({ appointmentId }); // Sends `AppointmentCreatedPayload`
}
```

- **Admin Config**: [`app/(admin)/admin/configuracoes/webhooks/`](app/(admin)/admin/configuracoes/webhooks/) → `WebhookConfig`, `WebhookField`, `WebhookDirection`. Components: `webhooks-tabs.tsx`, `tab-inbound.tsx`, `tab-outbound.tsx`, `webhook-detail-modal.tsx`.

## Compliance & Auditing

| Standard | Status            | Key Controls                          |
|----------|-------------------|---------------------------------------|
| GDPR/CCPA| Compliant        | Consent in `ClienteInsert`, RLS       |
| PCI-DSS  | N/A              | No card storage/processing            |
| SOC 2    | Type 1 In Progress| RLS, rate limits, `Logger` audits     |
| HIPAA    | Not Applicable   | No PHI                                |

- **Audits**:
  - Supabase/Vercel/Upstash logs.
  - `npm audit` (pinned deps).
  - Custom: `Logger` class.

## Incident Response

### Detection
- **Sources**: `Logger`, Supabase logs, webhook payloads (e.g., `ClientInactiveAlertPayload`), metrics.
- **Notifications**: [`app/api/notifications/send/route.ts`](app/api/notifications/send/route.ts) → `NotificationPayload`.

### Escalation
| Severity | Response Time | Actions                          | Contacts                   |
|----------|---------------|----------------------------------|----------------------------|
| Critical | 15 min       | Revoke keys, isolate DB          | security@carolinasp.com   |
| High     | 1 hr         | Tighten limits, notify           | devops@carolinasp.com     |
| Medium   | 4 hrs        | Log review, monitor              | #security Slack           |

**Steps**:
1. Triage: Query `Logger` or Supabase.
2. Notify: POST `/api/notifications/send`.
3. Contain: Rotate secrets (`validateEnv()`), scale Redis.
4. Recover: Test RLS/endpoints.
5. Post-Mortem: GitHub Issue, update doc.

## Cross-References
- **Middleware**: [`middleware.ts`](middleware.ts) → `middleware()` (exported).
- **Supabase**: [`lib/supabase/*`](lib/supabase/) → Clients, `updateSession()`.
- **Auth**: [`lib/actions/auth.ts`](lib/actions/auth.ts) → `getUser()`.
- **Webhooks**: [`types/webhook.ts`](types/webhook.ts), [`hooks/use-webhook.ts`](hooks/use-webhook.ts).
- **Formatters**: [`lib/formatters.ts`](lib/formatters.ts) → `formatPhoneUS()`, `isValidEmail()`.
- **Logger**: [`lib/logger.ts`](lib/logger.ts).
- **Business Config**: [`lib/business-config*.ts`](lib/business-config.ts) → `BusinessSettingsProvider`.
- **Tracking**: [`lib/tracking/*`](lib/tracking/) → `hashData()`, PII-safe.
- **Exports**: [`lib/export-utils.ts`](lib/export-utils.ts) → `exportToExcel()`, `exportToPDF()`.

## Development Practices
- **PRs**: `@security-owner` approval for auth/webhook changes.
- **Pre-merge**: `npm audit`, `validateEnv()`.
- **Scans**: Snyk/Dependabot.
- **Conventions**: Use `cn()` (utils), RLS-first queries. No client-side secrets.

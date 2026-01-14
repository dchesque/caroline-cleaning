# Security & Compliance

**Status**: Active  
**Last Updated**: 2024-10-25  
**Owners**: Security Team / DevOps  
**Repository**: [Carolinas Premium](https://github.com/carolinas-premium) (Next.js 14, Supabase, N8N webhooks, Upstash Redis)

This document details authentication, authorization, data protection, secrets management, webhook security, rate limiting, logging, compliance, and incident response. All practices enforce Row Level Security (RLS) on Supabase tables (`Cliente`, `Agendamento`, `Contrato`, `Financeiro`, `Configuracao`, etc.) and follow codebase conventions.

## Authentication & Authorization

### Identity Provider
- **Supabase Auth**: Email/password and OAuth supported. Server-side uses service role for admin operations; client-side uses RLS.
  - **Server Client**: [`lib/supabase/server.ts`](lib/supabase/server.ts) → `createClient()` (exported).
  - **Client Client**: [`lib/supabase/client.ts`](lib/supabase/client.ts) → `createClient()` (exported).
  - **Types**: [`types/supabase.ts`](types/supabase.ts) → `Database` (exported), `Json` (exported).

### Session Management
- **Cookies & Refresh Tokens**: Handled by Supabase Auth.
  - **Middleware**: [`lib/supabase/middleware.ts`](lib/supabase/middleware.ts) → `updateSession()` (exported).
- **Global Middleware** ([`middleware.ts`](middleware.ts)):
  | Feature       | Implementation              | Dependencies                     |
  |---------------|-----------------------------|----------------------------------|
  | Rate Limiting | `rateLimit()` (Upstash Redis) | IP/user limits (100/min, 500/day)|
  | Auth Checks   | Integrates `getUser()`      | [`lib/actions/auth.ts`](lib/actions/auth.ts) |

### Protected Layouts & Routes
| Layout          | Path                  | Key Exports                          |
|-----------------|-----------------------|--------------------------------------|
| `AdminLayout`   | `app/(admin)/`       | [`app/(admin)/layout.tsx`](app/(admin)/layout.tsx) |
| `AuthLayout`    | `app/(auth)/`        | [`app/(auth)/layout.tsx`](app/(auth)/layout.tsx) |
| `AdminI18nProvider` | Admin context     | [`lib/admin-i18n/context.tsx`](lib/admin-i18n/context.tsx) |

### Permissions & RLS
- **Supabase RLS**: Enabled on core tables (`Cliente`, `AgendamentoInsert`/`Update`, `Contrato`, `Financeiro`, `Configuracao`, `AreaAtendida`).
- **Roles**:
  | Role  | Access Level          | Examples                                      |
  |-------|-----------------------|-----------------------------------------------|
  | Admin | Full CRUD             | `ClientesPage`, `AgendaPage`, `ClienteDetalhePage`, `CategoriasPage` |
  | User  | Read (personal data)  | `DashboardStats`, `AgendaHoje`                |
  | Guest | Public/landing/chat   | `ChatWidget`, `AnnouncementBar`, `AboutUs`    |

**API Route Protection Example** (e.g., [`app/api/financeiro/categorias/[id]/route.ts`](app/api/financeiro/categorias/[id]/route.ts)):
```ts
import { getUser } from '@/lib/actions/auth';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const user = await getUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // RLS-protected Supabase delete...
}
```

**Server Actions Example** ([`lib/actions/auth.ts`](lib/actions/auth.ts)):
```ts
import { getUser } from '@/lib/actions/auth';

export async function deleteCategory(id: string) {
  const user = await getUser();
  if (user?.role !== 'admin') throw new Error('Unauthorized');
  // Proceed with RLS delete...
}
```
- Related: `signOut()` (exported from `lib/actions/auth.ts`).

## Secrets & Sensitive Data

### Environment Variables
- **Validation**: [`lib/env.ts`](lib/env.ts) → `validateEnv()` (exported, runs on app startup).
| Variable                | Purpose                       | Used In                                      |
|-------------------------|-------------------------------|----------------------------------------------|
| `SUPABASE_SERVICE_KEY`  | Elevated Supabase access      | `lib/supabase/server.ts`                     |
| `NEXTAUTH_SECRET`       | Session/JWT signing           | Supabase middleware                          |
| `WEBHOOK_SECRET`        | HMAC verification             | [`lib/config/webhooks.ts`](lib/config/webhooks.ts) → `getWebhookSecret()` |
| `UPSTASH_REDIS_URL`     | Rate limiting                 | `middleware.ts#rateLimit()`                  |
| `N8N_WEBHOOK_URL`       | Outbound webhooks             | [`lib/config/webhooks.ts`](lib/config/webhooks.ts) → `getWebhookUrl()` |

- **Practices**: No hardcoding (ESLint rule). Quarterly rotation via Vercel dashboard. Business settings: [`lib/business-config.ts`](lib/business-config.ts) → `BusinessSettings` (exported).

### Data Protection
- **In Transit**: HTTPS-only (Next.js config).
- **At Rest**: Supabase pgCrypto encryption + RLS.
- **PII Handling**:
  | PII Level | Examples                     | Protections                                   |
  |-----------|------------------------------|-----------------------------------------------|
  | High      | Passwords, keys              | Hashed (Supabase Auth), log-excluded          |
  | Medium    | Phone/email (`Cliente`)      | RLS + masking (`lib/formatters.ts`)           |
  | Low       | Names, appointments          | Role-based via RLS                            |

**PII Masking Example**:
```ts
import { formatPhoneUS, isValidPhoneUS, formatZipCode } from '@/lib/formatters';

const safePhone = formatPhoneUS(client.phone); // '(555) 123-4567'
const safeZip = formatZipCode(client.zip);     // '12345'
```

**Logging**: [`lib/logger.ts`](lib/logger.ts) → `Logger` class, `LogEntry` interface, `LogLevel` (DEBUG/INFO/WARN/ERROR). PII auto-scrubbed.

## Rate Limiting & Abuse Prevention
- **Core Impl**: [`middleware.ts`](middleware.ts) → `rateLimit()` (exported function, Upstash Redis).
  - Limits: 100 req/min (IP), 500/day (user). Skips public endpoints (`/api/chat`, landing).
  - Admin Bypass: Via `getUser().role === 'admin'`.
- **Additional**: Webhook timeouts via [`lib/config/webhooks.ts`](lib/config/webhooks.ts) → `getWebhookTimeout()`.

## Webhook Security

### Inbound (N8N)
- **Endpoint**: [`app/api/webhook/n8n/route.ts`](app/api/webhook/n8n/route.ts).
  - **Verification**: HMAC-SHA256 using `getWebhookSecret()`.
  - **Payload Types** ([`types/webhook.ts`](types/webhook.ts)):
    | Event                       | Type                          | Line |
    |-----------------------------|-------------------------------|------|
    | Chat Message                | `ChatMessagePayload`         | 39   |
    | Lead Created                | `LeadCreatedPayload`         | 57   |
    | Appointment Created         | `AppointmentCreatedPayload`  | 90   |
    | Appointment Confirmed       | `AppointmentConfirmedPayload`| 108  |
    | Appointment Completed       | `AppointmentCompletedPayload`| 118  |
    | Appointment Cancelled       | `AppointmentCancelledPayload`| 130  |
    | Appointment Rescheduled     | `AppointmentRescheduledPayload`| 143 |
    | Feedback Received           | `FeedbackReceivedPayload`    | 159  |
    | Payment Received            | `PaymentReceivedPayload`     | 176  |
    | Client Inactive             | `ClientInactiveAlertPayload` | 191  |
    | Client Birthday             | `ClientBirthdayPayload`      | 202  |
  - Types: `WebhookEventType`, `WebhookPayload` (exported).

### Outbound Hooks
- **Config**: [`lib/config/webhooks.ts`](lib/config/webhooks.ts) → `getWebhookUrl()`, `isWebhookConfigured()`, `getWebhookSecret()`, `getWebhookTimeout()` (all exported).
- **Triggers**: [`hooks/use-webhook.ts`](hooks/use-webhook.ts) → `useWebhook()`, `useSendChatMessage()`, `useNotifyAppointmentCreated()`, `useNotifyAppointmentCompleted()`, etc. (`UseWebhookResult` interface).
- **Service**: [`lib/services/webhookService.ts`](lib/services/webhookService.ts) → `WebhookService` class.
- **Actions**: [`lib/actions/webhook.ts`](lib/actions/webhook.ts) → `sendWebhookAction()`; uses `WebhookResponse`, `WebhookOptions` ([`types/webhook.ts`](types/webhook.ts)).

**Hook Usage Example**:
```tsx
import { useNotifyAppointmentCreated } from '@/hooks/use-webhook';

function OnAppointmentCreate({ appointmentId }: { appointmentId: string }) {
  const { mutate } = useNotifyAppointmentCreated();
  mutate({ appointmentId }); // Triggers webhook
}
```

## Compliance & Auditing

| Standard | Status            | Key Controls                          |
|----------|-------------------|---------------------------------------|
| GDPR/CCPA| Compliant        | Consent flags in `ClienteInsert`, RLS |
| PCI-DSS  | N/A              | No card data stored/processed         |
| SOC 2    | Type 1 In Progress| RLS, rate limits, `Logger` audits     |
| HIPAA    | Not Applicable   | No protected health info              |

- **Audits**:
  - Supabase dashboard logs.
  - Vercel runtime logs.
  - `npm audit` (pinned `package.json` deps).
  - Custom: `Logger` (`lib/logger.ts`).

## Incident Response

### Detection
- **Sources**: `Logger` entries, Supabase/Vercel/Upstash metrics, webhook payloads (e.g., `ClientInactiveAlertPayload`).
- **Notifications**: [`app/api/notifications/send/route.ts`](app/api/notifications/send/route.ts) → `NotificationPayload`.

### Escalation
| Severity | Response Time | Actions                          | Contacts                   |
|----------|---------------|----------------------------------|----------------------------|
| Critical | 15 min       | Revoke keys, isolate DB          | security@carolinasp.com   |
| High     | 1 hr         | Tighten limits, notify team      | devops@carolinasp.com     |
| Medium   | 4 hrs        | Log review, monitor              | #security Slack           |

**Steps**:
1. Triage: Query `Logger` or Supabase logs.
2. Notify: POST `/api/notifications/send`.
3. Contain: Rotate secrets (`validateEnv()`), scale Redis.
4. Recover: Verify RLS, test endpoints.
5. Post-Mortem: GitHub Issue, update this doc.

## Cross-References
- [`middleware.ts`](middleware.ts): Rate limits, auth middleware.
- [Supabase](lib/supabase/): Clients, sessions (`server.ts`, `client.ts`).
- [Auth](lib/actions/auth.ts): `getUser()`, `signOut()`.
- [Webhooks](types/webhook.ts): All payload types/interfaces.
- [Formatters](lib/formatters.ts): PII masking (`formatPhoneUS`, `isValidEmail`).
- [Logger](lib/logger.ts): `Logger` class.
- [Business Config](lib/business-config.ts): Env-derived `BusinessSettings`.
- [Export Utils](lib/export-utils.ts): Secure `exportToExcel()`, `exportToPDF()`.
- [Chat Hooks](hooks/use-chat.ts): `useChat()`, `ChatMessage`.

**Development Practices**:
- PRs: `@security-owner` approval for auth/webhook changes.
- Pre-merge: `npm audit`, `validateEnv()`.
- Scans: Integrate Snyk/GitHub Dependabot.

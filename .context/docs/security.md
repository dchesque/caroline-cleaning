# Security & Compliance

**Status**: Active  
**Last Updated**: 2024-10-15  
**Owners**: Security Team / DevOps  
**Repository**: [Carolinas Premium](https://github.com/carolinas-premium) (Next.js 14, Supabase, N8N webhooks)

This document details authentication, authorization, data protection, secrets management, compliance, webhook security, and incident response. All practices align with codebase conventions (e.g., RLS on Supabase tables like `Cliente`, `Agendamento`).

## Authentication & Authorization

### Identity Provider
- **Supabase Auth**: Handles email/password, OAuth. Server-side uses service role for admin ops; client-side is RLS-compliant.
  - **Server Client**: `lib/supabase/server.ts` → `createClient()`
  - **Client Client**: `lib/supabase/client.ts` → `createClient()`
  - **Schema Types**: `types/supabase.ts` → `Database`, `Json`

### Session Management
- **Cookies + Refresh**: Supabase sessions; `lib/supabase/middleware.ts` → `updateSession()`
- **Middleware** (`middleware.ts`):
  - `rateLimit()`: Upstash Redis (IP/user limits)
  - Auth: `lib/actions/auth.ts` → `getUser()`, `signOut()`
- **Layouts**:
  | Layout          | Routes Protected          | Exports                  |
  |-----------------|---------------------------|--------------------------|
  | `AdminLayout`  | `app/(admin)/`           | `app/(admin)/layout.tsx` |
  | `AuthLayout`   | `app/(auth)/`            | `app/(auth)/layout.tsx`  |

### Permissions & RLS
- **RLS Policies**: Supabase tables (`Cliente`, `Agendamento`, `Contrato`, `Financeiro`)
- **Roles**:
  | Role   | Access Level                  | Key Components/Pages                  |
  |--------|-------------------------------|---------------------------------------|
  | Admin  | Full CRUD                    | `ClientesPage`, `AgendaPage`, `ClienteDetalhePage` |
  | User   | Read dashboard/personal data | `DashboardStats`                     |
  | Guest  | Public/landing/chat          | `ChatWidget`, `AnnouncementBar`      |

**Code Example** (API Route Protection):
```ts
// app/api/example/route.ts
import { getUser } from '@/lib/actions/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const user = await getUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Secure data fetch...
}
```

**Server Actions**: Always wrap with `getUser()` checks.

## Secrets & Sensitive Data

### Environment Variables
Validated on startup: `lib/env.ts` → `validateEnv()`

| Variable              | Purpose                      | Accessed In                          |
|-----------------------|------------------------------|--------------------------------------|
| `SUPABASE_SERVICE_KEY` | Server Supabase access      | `lib/supabase/server.ts`            |
| `NEXTAUTH_SECRET`     | Session signing             | Supabase middleware                 |
| `WEBHOOK_SECRET`      | HMAC signatures             | `lib/config/webhooks.ts#getWebhookSecret()` |
| `UPSTASH_REDIS_URL`   | Rate limiting               | `middleware.ts#rateLimit()`         |

- **No Hardcoding**: Enforced via linting.
- **Rotation**: Quarterly; use platform UI (Vercel/Railway).

### Encryption & Data Handling
- **Transit**: HTTPS (Next.js).
- **Rest**: Supabase-managed; UI masking (e.g., `lib/formatters.ts` → `formatPhoneUS()`, `isValidPhoneUS()`).
- **PII Classification**:
  | Level | Data Examples             | Protections                     |
  |-------|---------------------------|---------------------------------|
  | High  | Passwords, keys           | Hashed (Supabase), never logged |
  | Medium| Phone, email (`Cliente`) | RLS, masked (`formatPhoneUS`)  |
  | Low   | Names, appointments      | Role-based reads               |

**Logging**: `lib/logger.ts` → `Logger` (excludes PII via `LogLevel`: DEBUG/INFO/WARN/ERROR).

## Webhook Security

- **N8N Endpoint**: `app/api/webhook/n8n/route.ts`
  - **Verification**: `verifyAuth()` (HMAC with `getWebhookSecret()`)
  - **Payloads**: Strongly typed (`types/webhook.ts`):
    | Type                          | Exports From `types/webhook.ts` |
    |-------------------------------|---------------------------------|
    | `ChatMessagePayload`         | Line 39                        |
    | `AppointmentCreatedPayload`  | Line 90                        |
    | `ClientBirthdayPayload`      | Line 202                       |

- **Client Hooks**: `hooks/use-webhook.ts` → `useWebhook()`, `useSendChatMessage()`, event-specific (e.g., `useNotifyAppointmentCreated()`)
- **Config**: `lib/config/webhooks.ts` → `getWebhookUrl()`, `isWebhookConfigured()`, `getWebhookTimeout()`
- **Options**: `types/webhook.ts` → `WebhookOptions`, `WebhookResponse`

**Example Client Trigger**:
```tsx
// Trigger appointment notification
const { mutate: notifyAppointment } = useNotifyAppointmentCreated();
notifyAppointment({ appointmentId: '123' });
```

## Compliance & Auditing

- **Standards**:
  | Standard | Status     | Controls                          |
  |----------|------------|-----------------------------------|
  | GDPR/CCPA| Compliant | Consent forms, RLS deletions     |
  | PCI-DSS  | Minimal   | No direct card handling          |
  | SOC 2    | Type 1 Planned | RLS, rate limits, audits     |

- **Auditing**:
  - Supabase: Audit logs.
  - Vercel: Request logs.
  - Deps: `npm audit` (pinned `package.json`).

## Incident Response

### Detection
- Logs: `lib/logger.ts`
- Metrics: Supabase/Vercel/Upstash.
- Alerts: Webhook payloads (e.g., `ClientInactiveAlertPayload`).

### Escalation Matrix
| Severity | Actions                          | Contacts                  | SLA     |
|----------|----------------------------------|---------------------------|---------|
| Critical | Revoke secrets, isolate DB      | security@carolinasp.com  | 15 min |
| High     | Scale rate limits, notify team  | devops@carolinasp.com    | 1 hr   |
| Medium   | Log review, monitor             | #alerts Slack            | 4 hrs  |

**Steps**:
1. Triage logs (`lib/logger.ts`).
2. Notify (`app/api/notifications/send/route.ts`).
3. Contain (secrets rotation).
4. Post-mortem (GitHub Issue → update this doc).

## Cross-References
- [Middleware](middleware.ts) ← Rate limiting
- [Supabase Clients](lib/supabase/) ← Auth setup
- [Webhook Types](types/webhook.ts) ← Payloads
- [Auth Actions](lib/actions/auth.ts) ← `getUser()`
- [Utils](lib/utils.ts) ← `cn()`, `formatCurrency()`
- [Hooks](hooks/use-webhook.ts) ← Client notifications

For updates/audits: `@security-owner` in PRs.

# Security Guide - Chesque Premium Cleaning

**Purpose**: Authentication, authorization, data protection, and security best practices  
**Last Updated**: April 2026

---

## Table of Contents
1. [Authentication](#authentication)
2. [Authorization](#authorization)
3. [Secret Management](#secret-management)
4. [API Security](#api-security)
5. [Database Security](#database-security)
6. [Common Vulnerabilities](#common-vulnerabilities)
7. [Security Checklist](#security-checklist)

---

## Authentication

### Supabase Auth

The app uses **Supabase Auth** (JWT-based) for admin login:

```tsx
// Login page (app/(auth)/login/page.tsx)
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@example.com',
  password: 'secure-password'
});

// Returns JWT token (stored in Supabase session)
```

### How It Works

1. User enters email/password on `/login`
2. Supabase verifies credentials (secure hash)
3. Returns JWT token (short-lived, ~1 hour)
4. Token stored in cookies (HTTP-only)
5. Requests include token in Authorization header
6. Middleware verifies token before each request

### JWT Tokens

- **Payload**: User ID, email, permissions
- **Signature**: Signed with Supabase secret key
- **Expiration**: ~1 hour (refresh token extends)
- **Storage**: HTTP-only cookies (not accessible from JavaScript)

### Session Management

```ts
// lib/supabase/middleware.ts
export async function updateSession(request: Request) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { /* ... */ },
        setAll(cookiesToSet) { /* ... */ }
      }
    }
  );

  // Refresh token if needed
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return response;
}
```

### Password Requirements

- Minimum 8 characters
- Mix of uppercase, lowercase, numbers
- No common patterns (admin, 123456, etc.)

**Enforce in Supabase**:
1. Settings → Auth → User Signups
2. Password Requirements → Enable Strong Password Enforcement

---

## Authorization

### Role-Based Access Control (RBAC)

Users have roles assigned in the `auth.users` table:

| Role | Access |
|------|--------|
| `admin` | Full access (all features) |
| `manager` | Dashboard, agenda, clients (no financials) |
| `team` | View only (appointments, clients) |

### Check Authorization

```ts
// In API route
export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Proceed with request
}
```

### Row-Level Security (RLS)

Database tables enforce RLS policies:

```sql
-- Example RLS policy
CREATE POLICY "Users can view their own clients"
ON clientes
FOR SELECT
USING (empresa_id = auth.uid());
```

This ensures:
- Users only see data they own
- No direct access to other users' data
- Enforced at database level (can't be bypassed)

---

## Secret Management

### Environment Variables

**Never commit secrets to git**:

```bash
# ✅ Good - .env.local (gitignored)
SUPABASE_SERVICE_ROLE_KEY=sk-xxx...

# ❌ Bad - committed to git
# .env file with secrets visible in history
```

### Secrets by Type

| Secret | Storage | Usage |
|--------|---------|-------|
| `SUPABASE_SERVICE_ROLE_KEY` | `.env` (server-side only) | Database admin operations |
| `OPENROUTER_API_KEY` | `.env` (server-side) | LLM API calls |
| `TWILIO_AUTH_TOKEN` | `.env` (server-side) | SMS sending |
| `N8N_WEBHOOK_SECRET` | `.env` (server-side) | Webhook HMAC verification |
| `CRON_SECRET` | `.env` (server-side) | Cron job authentication |

### Safe Secret Handling

```ts
// ✅ Good - server-side only
export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY; // ← Never exposed to client
  const response = await fetch('https://openrouter.ai/api/v1/...', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
}

// ❌ Bad - exposed to client
export const CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_OPENROUTER_KEY // ← Visible in browser!
};
```

### Rotating Secrets

1. **Generate new secret** in Supabase/OpenRouter/Twilio
2. **Update `.env`** with new value
3. **Redeploy app**
4. **Revoke old secret** in source system

---

## API Security

### Input Validation

Use Zod to validate all inputs:

```ts
import { z } from 'zod';

const chatSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message too long'),
  sessionId: z.string().uuid('Invalid session ID')
});

export async function POST(request: Request) {
  try {
    const body = chatSchema.parse(await request.json());
    // ✅ body is guaranteed to match schema
  } catch (error) {
    return Response.json({ error: 'Invalid input' }, { status: 400 });
  }
}
```

### CORS Configuration

Public endpoints allow cross-origin requests, admin endpoints restrict:

```ts
// API route headers
export async function POST(request: Request) {
  // Check origin for sensitive endpoints
  const origin = request.headers.get('origin');
  if (!['https://chesquecleaning.com', 'https://admin.chesquecleaning.com'].includes(origin)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
}
```

### Rate Limiting

```ts
// Simple rate limit (in production, use Redis)
const requestCounts = new Map();

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const count = (requestCounts.get(ip) || 0) + 1;
  
  if (count > 10) { // 10 requests per minute
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }
  
  requestCounts.set(ip, count);
  setTimeout(() => requestCounts.delete(ip), 60000);
}
```

### HTTPS Only

- Never send sensitive data over HTTP
- Set secure cookies: `Secure; HttpOnly; SameSite=Strict`
- HSTS header in production

### Webhook Verification

```ts
// Verify n8n webhook signature
import crypto from 'crypto';

export async function POST(request: Request) {
  const secret = process.env.N8N_WEBHOOK_SECRET;
  const signature = request.headers.get('x-webhook-secret');
  const body = await request.text();

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body);
  const expectedSignature = hmac.digest('hex');

  if (signature !== expectedSignature) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Process webhook
}
```

---

## Database Security

### Row-Level Security (RLS)

Enable on all tables:

```sql
-- Only owners can access their own data
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view their own clients"
ON clientes
FOR SELECT
USING (auth.uid() = proprietario_id);
```

### SQL Injection Prevention

Always use parameterized queries:

```ts
// ✅ Safe - parameterized
const { data } = await supabase
  .from('clientes')
  .select('*')
  .eq('id', userId); // ← parameterized

// ❌ Unsafe - string concatenation
const query = `SELECT * FROM clientes WHERE id = '${userId}'`;
```

### Data Encryption

Sensitive fields should be encrypted at rest:

```sql
-- Enable encryption in Supabase
-- Settings → Database → Column Encryption
CREATE TABLE clientes (
  id UUID PRIMARY KEY,
  nome TEXT NOT NULL,
  phone TEXT ENCRYPTED WITH (key = 'pgsodium'),
  ssn TEXT ENCRYPTED WITH (key = 'pgsodium')
);
```

### Audit Logging

Log all admin actions:

```ts
// Log admin operations
const auditLog = await supabase
  .from('audit_logs')
  .insert({
    admin_id: userId,
    action: 'update_client',
    resource_id: clientId,
    timestamp: new Date()
  });
```

---

## Common Vulnerabilities

### SQL Injection

**Vulnerable**:
```ts
const { data } = await supabase.rpc('execute_query', {
  query: `SELECT * FROM clientes WHERE name LIKE '%${searchTerm}%'`
});
```

**Safe**:
```ts
const { data } = await supabase
  .from('clientes')
  .select('*')
  .ilike('name', `%${searchTerm}%`); // parameterized
```

### Cross-Site Scripting (XSS)

**Vulnerable**:
```tsx
const { data } = props;
return <div dangerouslySetInnerHTML={{ __html: data }} /> // ❌ Unsafe!
```

**Safe**:
```tsx
const { data } = props;
return <div>{data}</div> // ✅ React escapes by default
```

### Cross-Site Request Forgery (CSRF)

**Prevention** (automatic with Next.js):
- Use `Server Actions` (automatic CSRF protection)
- Verify CRON_SECRET on cron endpoints
- SameSite cookies enabled

### Authentication Bypass

- ✅ Always verify token on protected routes
- ✅ Check RLS policies on database
- ✅ Never trust client-side authorization

---

## Security Checklist

### Before Production Deployment

- [ ] SSL/TLS certificate installed (HTTPS only)
- [ ] SUPABASE_SERVICE_ROLE_KEY is server-side only
- [ ] All `.env` secrets are unique and strong
- [ ] Supabase RLS policies enabled
- [ ] Rate limiting configured
- [ ] CORS restricted to known origins
- [ ] SQL queries use parameterization
- [ ] Input validation (Zod) on all endpoints
- [ ] Webhook HMAC verification enabled
- [ ] Error messages don't leak sensitive info
- [ ] Audit logging enabled
- [ ] Backup strategy documented
- [ ] Security updates scheduled

### Ongoing Security

- [ ] Review error logs weekly
- [ ] Monitor failed login attempts
- [ ] Audit database access logs
- [ ] Keep dependencies updated: `npm audit`
- [ ] Rotate secrets quarterly
- [ ] Review user roles quarterly
- [ ] Test disaster recovery quarterly

---

## Incident Response

### If Secret is Leaked

1. **Immediately**: Generate new secret
2. **Update**: `.env` and deployment system
3. **Redeploy**: App with new secret
4. **Revoke**: Old secret in source system
5. **Investigate**: How was it leaked? Prevent future leaks
6. **Audit**: Check logs for unauthorized access

### If Database is Compromised

1. **Restore**: From backup (Supabase Backups)
2. **Review**: Audit logs for unauthorized access
3. **Notify**: Users of potential data breach (if PII exposed)
4. **Strengthen**: RLS policies and access controls
5. **Investigate**: Root cause of breach

### If Admin Account is Compromised

1. **Change password** immediately
2. **Enable 2FA** (if available)
3. **Audit**: All actions since compromise
4. **Reset**: Tokens/sessions
5. **Notify**: Other admins

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/self-hosting/security/overview)
- [Next.js Security](https://nextjs.org/docs/guides/security)
- [npm audit](https://docs.npmjs.com/cli/v10/commands/npm-audit)

---

**Related**: [DEPLOYMENT.md](DEPLOYMENT.md) for production setup checklist.

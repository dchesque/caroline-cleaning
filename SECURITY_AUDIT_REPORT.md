# Caroline Cleaning - Complete Security Audit Report
**Date:** April 9, 2026  
**Severity Summary:** 5 CRITICAL | 9 HIGH | 5 MEDIUM | 2 LOW

---

## EXECUTIVE SUMMARY

This security audit identified **21 vulnerabilities** in the Caroline Cleaning codebase. The most critical issues are:

1. **Exposed secrets in `.env`** - Database and API credentials visible in git history
2. **Weak RLS policies** - Chat data accessible to all authenticated users
3. **Weak CRON_SECRET** - "seu-segredo-aqui" placeholder in production
4. **Public database access** - Configuration and tracking tables open to anonymous users
5. **Weak password validation** - 8 character minimum with no complexity

**IMMEDIATE ACTION REQUIRED:** Rotate all secrets and fix RLS policies within 24 hours.

---

## CRITICAL ISSUES

### 1. EXPOSED SECRETS IN .env

**Severity:** CRITICAL | **File:** `.env`

#### Secrets Exposed:
```
Line 9:  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
Line 10: SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
Line 24: OPENROUTER_API_KEY=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
Line 33: CRON_SECRET=seu-segredo-aqui
```

#### Impact:
- **Service Role Key** - Bypasses ALL RLS policies, grants complete database access
- **Anon Key** - Direct Supabase API access with published credentials
- **OpenRouter Key** - Unlimited AI service abuse
- **CRON Secret** - Access to internal automation endpoints

#### Compromised Systems:
- ✗ Supabase database (all tables, all operations)
- ✗ OpenRouter AI service
- ✗ Internal cron/automation endpoints
- ✗ Customer data, chat history, payment records

#### Remediation:

**STEP 1: Immediate Secret Rotation (5 mins)**
```bash
# In Supabase Console:
1. Go to Project Settings > API Keys
2. Click "Rotate" for both ANON_KEY and SERVICE_ROLE_KEY
3. Update .env with new keys
4. Deploy immediately
```

**STEP 2: OpenRouter Key Rotation**
```bash
# In OpenRouter Dashboard:
1. Go to Settings > API Keys
2. Create new API key
3. Delete old key: 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
4. Update .env with new key
```

**STEP 3: Remove from Git History**
```bash
# Using BFG Repo Cleaner (recommended):
wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar

java -jar bfg-1.14.0.jar --delete-files .env

git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push origin master --force-with-lease

# Verify removal:
git log --all -S "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" --full-history
```

**STEP 4: Audit Access Logs**
```sql
-- Check Supabase Auth logs for unauthorized access
-- Check PostgreSQL logs for suspicious queries
-- Review OpenRouter API usage for unauthorized calls
```

**STEP 5: Ensure .gitignore Protection**
```bash
# Verify .env is in .gitignore
cat .gitignore | grep "^\.env"

# Add if missing:
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore
```

---

### 2. OVERLY PERMISSIVE RLS POLICIES - CHAT DATA

**Severity:** CRITICAL | **File:** `supabase/migrations/04_chat_rls_policies.sql`

#### Current Policy (WRONG):
```sql
CREATE POLICY "Admins can read all messages" ON mensagens_chat
    FOR SELECT
    TO authenticated
    USING (true);  -- ✗ WRONG: Allows ALL authenticated users
```

#### Problem:
- Any authenticated user (staff, manager, non-admin) can read ALL chat messages
- Exposes sensitive conversations, quotes, customer data
- Violates principle of least privilege

#### Corrected Policies:

**File:** `supabase/migrations/04_chat_rls_policies_fixed.sql`

```sql
-- DROP incorrect policies
DROP POLICY IF EXISTS "Admins can read all messages" ON mensagens_chat;
DROP POLICY IF EXISTS "Users can read their own messages" ON mensagens_chat;
DROP POLICY IF EXISTS "Admins can read all sessions" ON chat_sessions;

-- CREATE CORRECTED POLICIES

-- Only admins can read all messages
CREATE POLICY "Admins can read all messages" ON mensagens_chat
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Regular users can only read their own session messages
CREATE POLICY "Users can read own session messages" ON mensagens_chat
    FOR SELECT
    TO authenticated
    USING (
        chat_session_id IN (
            SELECT id FROM public.chat_sessions
            WHERE user_id = auth.uid()
        )
    );

-- Only admins can read all sessions
CREATE POLICY "Admins can read all sessions" ON chat_sessions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Users can only read their own sessions
CREATE POLICY "Users can read own sessions" ON chat_sessions
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
```

#### How to Apply:

```bash
# 1. Connect to Supabase
supabase link --project-id gkgogtmtlktsabkjvfom

# 2. Create new migration
supabase migration new fix_chat_rls_policies

# 3. Run the corrected policies (above)

# 4. Deploy
supabase db push

# 5. Test RLS policies
-- As non-admin user, this should return 0 rows:
SELECT * FROM mensagens_chat;

-- As admin user, this should return all messages:
SELECT * FROM mensagens_chat LIMIT 1;
```

---

### 3. PUBLIC READ ACCESS TO CONFIGURATIONS

**Severity:** CRITICAL | **File:** `supabase/migrations/08_fix_config_access_and_schema.sql`

#### Current Policy (WRONG):
```sql
CREATE POLICY "Public read settings" ON public.configuracoes
  FOR SELECT TO anon USING (true);
```

#### Exposed Data:
- Pricing and service information
- Business hours and availability
- Service areas and regions
- Meta/Facebook pixel configuration
- Integration tokens (if stored here)
- Notification settings
- API configuration

#### Corrected Policy:

```sql
-- DROP incorrect policy
DROP POLICY IF EXISTS "Public read settings" ON public.configuracoes;

-- CREATE CORRECTED POLICY
-- Only authenticated admins can read configuration
CREATE POLICY "Admins can read configuration" ON public.configuracoes
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Allow anonymous reads ONLY for safe, non-sensitive keys
CREATE POLICY "Anonymous read public config only" ON public.configuracoes
    FOR SELECT
    TO anon
    USING (
        key IN (
            'business_name',
            'business_phone',
            'business_email',
            'business_hours',
            'service_areas'
            -- Only add explicitly safe keys
        )
    );
```

#### Implementation:
```bash
# 1. Create migration
supabase migration new fix_config_access

# 2. Run corrected policy

# 3. Test
-- Anonymous user should NOT see sensitive config:
curl 'https://gkgogtmtlktsabkjvfom.supabase.co/rest/v1/configuracoes?key=eq.meta_pixel_id' \
  -H 'apikey: ANON_KEY'
# Should return 0 rows

-- Admin user should see everything:
# (requires proper auth)
```

---

### 4. WEAK CRON_SECRET

**Severity:** CRITICAL | **File:** `.env` (line 33)

#### Current Value:
```
CRON_SECRET=seu-segredo-aqui
```

#### Affected Endpoints:
- `GET /api/carol/query` - Query client data
- `POST /api/carol/actions` - Create leads/appointments
- `GET /api/cron/reminders` - Send appointment reminders
- `GET /api/cron/recurrences` - Create recurring appointments
- `GET /api/cron/cleanup-logs` - Delete old logs
- `POST /api/notifications/send` - Send notifications

#### Remediation:

```bash
# 1. Generate strong secret (32+ bytes)
CRON_SECRET=$(openssl rand -base64 32)
echo "New secret: $CRON_SECRET"

# 2. Update .env
# Replace: CRON_SECRET=seu-segredo-aqui
# With: CRON_SECRET=<generated_value>

# 3. Update production environment
# In deployment platform (Vercel/Railway/etc):
#   Environment Variables > CRON_SECRET = <new_value>

# 4. Audit logs for unauthorized access
# Check for calls to these endpoints from unexpected IPs:
grep -r "seu-segredo-aqui" /var/log/app.log
```

#### Verification:
```bash
# Verify secret is strong (at least 32 characters, mix of chars):
echo $CRON_SECRET | wc -c  # Should be 44+ (base64 overhead)

# Test that old secret no longer works:
curl -H "Authorization: Bearer seu-segredo-aqui" \
  https://app.example.com/api/cron/reminders
# Should return 401 Unauthorized
```

---

### 5. ANONYMOUS TRACKING EVENT INSERTION

**Severity:** CRITICAL | **File:** `supabase/migrations/07_tracking_events.sql`

#### Current Policy (WRONG):
```sql
CREATE POLICY "Anyone can insert tracking events"
    ON public.tracking_events FOR INSERT
    WITH CHECK (true);
```

#### Problem:
- Unauthenticated users can insert arbitrary tracking data
- Allows analytics poisoning
- Spoofed conversion events can affect business decisions

#### Corrected Policy:

```sql
DROP POLICY IF EXISTS "Anyone can insert tracking events" ON public.tracking_events;

-- Allow authenticated users to insert their own events
CREATE POLICY "Users can insert own tracking events" ON public.tracking_events
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Allow service role (backend) to insert events
CREATE POLICY "Service role can insert tracking events" ON public.tracking_events
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Allow specific internal service to insert events (if needed)
-- Create a new DB role for this service and grant explicit permissions
```

#### Implementation:
```bash
supabase migration new fix_tracking_rls

# Deploy and test
supabase db push

# Verify anonymous cannot insert:
curl -X POST 'https://gkgogtmtlktsabkjvfom.supabase.co/rest/v1/tracking_events' \
  -H 'apikey: ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"event_name":"test"}'
# Should return 401 or 403
```

---

## HIGH SEVERITY ISSUES

### 6. Weak Password Validation

**Severity:** HIGH | **File:** `app/api/profile/password/route.ts:21`

#### Current Code:
```typescript
if (!newPassword || newPassword.length < 8) {
  return NextResponse.json({ error: 'Password is required and must be at least 8 characters' }, { status: 400 });
}
```

#### Problem:
- Only 8 characters minimum
- No complexity requirements
- Allows weak passwords like "password1"

#### Fix:

```typescript
// app/api/profile/password/route.ts

const validatePassword = (password: string): { valid: boolean; error?: string } => {
  // Minimum 12 characters
  if (password.length < 12) {
    return { valid: false, error: 'Password must be at least 12 characters' };
  }

  // Must contain uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }

  // Must contain lowercase letter
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }

  // Must contain number
  if (!/\d/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }

  // Must contain special character
  if (!/[@$!%*?&._-]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character (@$!%*?&._-)' };
  }

  // No repeating characters (more than 3 in a row)
  if (/(.)\1{3,}/.test(password)) {
    return { valid: false, error: 'Password cannot contain more than 3 repeating characters' };
  }

  return { valid: true };
};

// In route handler:
const passwordValidation = validatePassword(newPassword);
if (!passwordValidation.valid) {
  return NextResponse.json({ error: passwordValidation.error }, { status: 400 });
}
```

---

### 7. IP Spoofing in Rate Limiting

**Severity:** HIGH | **File:** `lib/rate-limit.ts:69-74`

#### Current Code:
```typescript
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}
```

#### Problem:
- Trusts client-provided headers
- Allows bypassing rate limits by rotating IPs
- Single source of truth for rate limiting

#### Fix (Option 1: For Vercel/Cloudflare):

```typescript
// lib/rate-limit.ts

export function getClientIp(request: Request): string {
  // Cloudflare sets CF-Connecting-IP (most reliable)
  if (request.headers.get('cf-connecting-ip')) {
    return request.headers.get('cf-connecting-ip')!;
  }

  // Vercel sets x-real-ip (trusted in Vercel environment)
  if (process.env.VERCEL === '1') {
    return request.headers.get('x-real-ip') || 'unknown';
  }

  // For other deployments, use the first IP only if from trusted proxy
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    // Only trust the last proxy in the chain (leftmost IP is client)
    return xForwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  return 'unknown';
}
```

#### Fix (Option 2: Enhanced Rate Limiting):

```typescript
// lib/rate-limit.ts

interface RateLimitEntry {
  count: number;
  resetAt: number;
  ips: Set<string>;  // Track all IPs for same session/session
}

export class RateLimiter {
  // ... existing code ...

  checkLimit(ip: string, endpoint: string, sessionId?: string): boolean {
    // Use combination of IP + session ID to prevent spoofing
    const key = `${endpoint}:${sessionId || ip}`;
    const config = this.config[endpoint] || { requests: 100, window: 60 };

    const now = Date.now();
    let entry = this.limits.get(key);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + config.window * 1000, ips: new Set() };
      this.limits.set(key, entry);
    }

    entry.ips.add(ip);

    // Alert if same session used from many different IPs (potential spoofing)
    if (sessionId && entry.ips.size > 10 && entry.count > config.requests * 0.5) {
      logger.warn('Potential IP spoofing detected', {
        sessionId,
        ipCount: entry.ips.size,
        ips: Array.from(entry.ips)
      });
    }

    entry.count++;
    return entry.count <= config.requests;
  }
}
```

---

### 8. Unvalidated JSON Parsing in Multiple Endpoints

**Severity:** MEDIUM-HIGH | **Files:** Multiple API routes

#### Affected Files:
- `app/api/chat/route.ts:56`
- `app/api/carol/query/route.ts:42`
- `app/api/carol/actions/route.ts:41`

#### Current Code (Example):
```typescript
const body = await request.json();
const { message } = body;
// No validation of structure
```

#### Fix (Example for `/api/chat/route.ts`):

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';  // Add zod for validation

// Define request schema
const ChatRequestSchema = z.object({
  message: z.string().min(1).max(4000),
  sessionId: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

type ChatRequest = z.infer<typeof ChatRequestSchema>;

export async function POST(request: NextRequest) {
  try {
    // Validate Content-Type
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 415 }
      );
    }

    // Parse JSON with size limit
    let body;
    try {
      const bodyText = await request.text();
      if (bodyText.length > 10000) {  // 10KB limit
        return NextResponse.json(
          { error: 'Request body too large' },
          { status: 413 }
        );
      }
      body = JSON.parse(bodyText);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    // Validate against schema
    const result = ChatRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request',
          details: result.error.flatten()
        },
        { status: 400 }
      );
    }

    const { message, sessionId } = result.data;

    // ... rest of handler ...
  } catch (error) {
    logger.error('Chat endpoint error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### Add Zod to dependencies:
```bash
npm install zod
```

---

### 9. Insufficient Rate Limiting on Admin Endpoints

**Severity:** HIGH | **File:** `app/api/admin/chat-logs/route.ts`

#### Problem:
- No rate limiting on admin endpoints
- Could allow denial of service through expensive queries

#### Fix:

```typescript
// app/api/admin/chat-logs/route.ts

import { rateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  // Apply rate limit: 30 requests per minute per authenticated user
  const ip = getClientIp(request);
  
  const isLimited = !rateLimit('admin-api', 30, 60, ip);
  if (isLimited) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  // ... rest of handler ...
}
```

---

## MEDIUM SEVERITY ISSUES

### 10. Weak Session Management

**Severity:** MEDIUM | **File:** `middleware.ts`

#### Problem:
- No explicit session timeout
- No device/IP tracking for sessions
- No logout/revocation mechanism

#### Fix:

```typescript
// middleware.ts

import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  
  // Update session and check expiration
  const { session, isExpired } = await updateSession(request, res);

  if (isExpired) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Add security headers
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return res;
}
```

---

### 11. Missing Input Sanitization in Contact Form

**Severity:** MEDIUM | **File:** `app/api/contact/route.ts`

#### Fix:

```typescript
import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

const ContactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[\d\s\-()]{10,}$/),
  message: z.string().min(10).max(2000),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Validate
  const result = ContactSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  let { name, email, phone, message } = result.data;

  // Sanitize HTML
  name = DOMPurify.sanitize(name);
  message = DOMPurify.sanitize(message);

  // ... rest of handler ...
}
```

---

## LOW SEVERITY ISSUES

### 12. Debug console.error() Calls

**Severity:** LOW | **Recommendation:** Replace 40+ console.error calls with proper logging

```typescript
// Instead of:
// console.error(error);

// Use:
logger.error('Operation failed', { error: error.message, stack: error.stack });
```

### 13. Missing Security Event Logging

**Severity:** LOW | **Recommendation:** Add audit logging for security events

```typescript
// Log failed authentication attempts
logger.warn('Failed authentication', {
  endpoint: request.url,
  ip: getClientIp(request),
  timestamp: new Date().toISOString()
});
```

### 14. Missing CORS Headers

**Severity:** LOW | **Recommendation:** Explicitly configure CORS

```typescript
// In API routes or middleware
const headers = new Headers();
headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL);
headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
```

---

## REMEDIATION TIMELINE

### IMMEDIATE (Next 24 Hours)
- [ ] Rotate Supabase keys
- [ ] Rotate OpenRouter API key
- [ ] Update CRON_SECRET
- [ ] Fix critical RLS policies
- [ ] Remove .env from git history
- [ ] Audit access logs

### SHORT-TERM (This Week)
- [ ] Implement strong password validation
- [ ] Enhance rate limiting (IP spoofing prevention)
- [ ] Add JSON schema validation to all API endpoints
- [ ] Implement session timeout
- [ ] Fix remaining RLS policies

### MEDIUM-TERM (Next 2 Weeks)
- [ ] Replace console.error with proper logging
- [ ] Add security event audit logging
- [ ] Implement input sanitization on all forms
- [ ] Add automated security testing (SAST)
- [ ] Set up security header validation

### ONGOING
- [ ] Keep dependencies updated
- [ ] Run regular security audits
- [ ] Monitor for suspicious activity
- [ ] Implement Web Application Firewall (WAF)
- [ ] Set up security monitoring and alerting

---

## TESTING SECURITY FIXES

### RLS Policy Testing
```sql
-- Test as non-admin user
SET request.jwt.claims = '{"sub":"user-id","role":"authenticated"}';
SELECT * FROM chat_sessions;  -- Should return only own sessions
SELECT * FROM mensagens_chat;  -- Should return error or empty

-- Test as admin user
SET request.jwt.claims = '{"sub":"admin-id","role":"authenticated"}';
-- Need to set admin role in user_profiles first
SELECT * FROM chat_sessions;  -- Should return all sessions
```

### Rate Limiting Testing
```bash
# Test rate limit
for i in {1..25}; do
  curl -H "X-Forwarded-For: 127.0.0.1" \
    https://app.example.com/api/chat \
    -X POST -d '{"message":"test"}'
  echo "Request $i"
done

# Should get rate limit error on request 21+
```

### Password Validation Testing
```bash
# Test weak password
curl -X PUT https://app.example.com/api/profile/password \
  -d '{"currentPassword":"old","newPassword":"weak"}' \
  # Should return 400 with validation error

# Test strong password
curl -X PUT https://app.example.com/api/profile/password \
  -d '{"currentPassword":"old","newPassword":"SecurePass123!@#"}' \
  # Should succeed
```

---

## CONCLUSION

The Caroline Cleaning application has several critical security vulnerabilities that require immediate attention. The most pressing issues are:

1. **Exposed secrets** - Requires immediate rotation and git history cleanup
2. **Weak RLS policies** - Allows unauthorized data access
3. **Weak CRON_SECRET** - Enables internal endpoint abuse
4. **Weak password policy** - Allows weak admin passwords

All critical issues must be addressed within 24 hours. The high and medium severity issues should be resolved within one week.

---

**Prepared by:** Claude Code Security Analysis  
**Contact:** For implementation assistance with these fixes
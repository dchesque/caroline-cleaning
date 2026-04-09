# Deployment Guide - Chesque Premium Cleaning

**Purpose**: Production deployment, Docker configuration, and environment setup  
**Last Updated**: April 2026

---

## Table of Contents
1. [Local Production Build](#local-production-build)
2. [Docker Deployment](#docker-deployment)
3. [Environment Configuration](#environment-configuration)
4. [Deployment Platforms](#deployment-platforms)
5. [Post-Deployment Checks](#post-deployment-checks)
6. [Monitoring & Logs](#monitoring--logs)

---

## Local Production Build

### Build the App

```bash
npm run build
```

**Output**: Optimized production build in `.next/` directory

### Run Production Server

```bash
npm run start
```

**Output**: App runs on http://localhost:3000 in production mode

### Verify Build

```bash
npm run type-check
npm run lint
npm run build
```

All should pass before deploying.

---

## Docker Deployment

### Docker Configuration

The project includes a `Dockerfile` optimized for production:

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

### Build Docker Image

```bash
docker build -t chesque-cleaning:latest .
```

### Run Docker Container

```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... \
  -e SUPABASE_SERVICE_ROLE_KEY=eyJ... \
  -e OPENROUTER_API_KEY=sk-or-... \
  -e CRON_SECRET=your-secret \
  chesque-cleaning:latest
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.9'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      NEXT_PUBLIC_APP_URL: ${NEXT_PUBLIC_APP_URL}
      OPENROUTER_API_KEY: ${OPENROUTER_API_KEY}
      CRON_SECRET: ${CRON_SECRET}
      TWILIO_ACCOUNT_SID: ${TWILIO_ACCOUNT_SID}
      TWILIO_AUTH_TOKEN: ${TWILIO_AUTH_TOKEN}
      TWILIO_PHONE_NUMBER: ${TWILIO_PHONE_NUMBER}
      OWNER_PHONE_NUMBER: ${OWNER_PHONE_NUMBER}
      N8N_WEBHOOK_SECRET: ${N8N_WEBHOOK_SECRET}
      NEXT_PUBLIC_N8N_WEBHOOK_URL: ${NEXT_PUBLIC_N8N_WEBHOOK_URL}
    restart: unless-stopped
```

**Run with Docker Compose**:

```bash
docker-compose up -d
```

---

## Environment Configuration

### Production `.env` Variables

**Required**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
OPENROUTER_API_KEY=sk-or-...
CAROL_DEFAULT_MODEL=anthropic/claude-3.5-sonnet
CRON_SECRET=your-long-random-secret-here
```

**Twilio (if using SMS notifications)**:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+15551234567
OWNER_PHONE_NUMBER=+15551234567
```

**n8n Webhooks**:
```env
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://your-n8n.com/webhook/carolinas
N8N_WEBHOOK_SECRET=your-hmac-secret
```

**Analytics (optional)**:
```env
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
SENTRY_DSN=https://...
```

### Generate Secure Secrets

```bash
# CRON_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# N8N_WEBHOOK_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Deployment Platforms

### Easypanel (Recommended)

1. **Create Project** in Easypanel dashboard
2. **Connect Git** repository
3. **Configure Build**:
   - Build command: `npm run build`
   - Start command: `npm run start`
   - Port: `3000`

4. **Set Environment Variables**:
   - Add all from production `.env` file
   - Do NOT commit `.env` to git

5. **Deploy**:
   - Push to main branch
   - Easypanel auto-deploys

### Vercel

1. **Import Project** from GitHub
2. **Environment Variables**:
   - Framework: Next.js
   - Root directory: ./

3. **Configure Env Vars**:
   - Add all from production `.env`

4. **Deploy**:
   - Auto-deploys on push to main

### Docker (Self-Hosted)

1. **Build image**: `docker build -t app .`
2. **Push to registry**: `docker push registry/app:latest`
3. **Deploy container**: `docker run -e ... app:latest`
4. **Reverse proxy**: Use Nginx/Caddy in front

### Coolify

1. **New Application** → Docker
2. **Build from GitHub**
3. **Set environment variables**
4. **Deploy** (similar to Easypanel)

---

## Post-Deployment Checks

### 1. Health Check

```bash
curl https://your-domain.com/api/health
```

**Expected**:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

### 2. Landing Page

Visit `https://your-domain.com` and verify:
- ✅ Page loads without errors
- ✅ Chat widget appears (bottom right)
- ✅ Hero section displays
- ✅ Images load correctly

### 3. Chat Functionality

1. Open chat widget
2. Type test message
3. Verify Carol AI responds
4. Check console for errors (F12 → Console)

### 4. Admin Login

1. Navigate to `https://your-domain.com/login`
2. Log in with credentials
3. Verify dashboard loads
4. Check sidebar navigation

### 5. Database Connection

```bash
# Query test from admin
curl https://your-domain.com/api/config/public
```

Should return app configuration without errors.

### 6. SSL/TLS Certificate

```bash
# Check certificate is valid
curl -I https://your-domain.com
```

Look for `SSL certificate problem` errors.

---

## Monitoring & Logs

### View Logs

**Easypanel/Coolify**:
- Dashboard → Logs section
- Real-time log streaming

**Docker**:
```bash
docker logs -f container-name
```

**Self-hosted**:
```bash
tail -f /var/log/app/error.log
```

### Error Tracking (Sentry)

If `SENTRY_DSN` is configured:

1. Go to [sentry.io](https://sentry.io)
2. View errors in real-time
3. Set up alerts for critical errors

### Performance Monitoring

**Check response times**:
```bash
curl -w "Time: %{time_total}s\n" https://your-domain.com
```

**Monitor database**:
- Supabase Dashboard → Logs
- Check slow queries
- Monitor connections

### Uptime Monitoring

Set up external uptime monitoring:
1. [Uptimerobot.com](https://uptimerobot.com) — Free uptime checks
2. Configure to check `/api/health` every 5 minutes
3. Get alerts if down

---

## Database Migrations

### Production Migration

```bash
# Backup current database
# (via Supabase dashboard or pg_dump)

# Apply pending migrations
supabase migration up
```

### Backup & Restore

**Supabase**:
1. Dashboard → Backups
2. Create backup before major changes
3. Restore if needed

**Manual PostgreSQL**:
```bash
# Backup
pg_dump -h db.supabase.co -U postgres postgres > backup.sql

# Restore
psql -h db.supabase.co -U postgres < backup.sql
```

---

## Scaling

### Horizontal Scaling

- App is stateless (can run multiple instances)
- Use load balancer (Nginx, Caddy, Easypanel)
- Each instance connects to same Supabase database

### Vertical Scaling

- Increase container memory/CPU
- Upgrade Supabase database tier
- Cache frequently accessed data (Redis)

### Performance Optimization

1. **Enable caching**:
   ```typescript
   // In API route
   res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
   ```

2. **Compress responses**:
   - Next.js does this automatically
   - Verify: `curl -I -H "Accept-Encoding: gzip" url`

3. **Optimize images**:
   - Use `next/image` component
   - Serve WebP format when supported

---

## Security in Production

- ✅ Use HTTPS only (automatic on Easypanel/Vercel)
- ✅ Set strong `CRON_SECRET` (32+ random characters)
- ✅ Keep `SUPABASE_SERVICE_ROLE_KEY` secret (server-side only)
- ✅ Enable database backups
- ✅ Monitor error logs for exploits
- ✅ Keep dependencies updated: `npm audit`

---

## Troubleshooting Deployment

| Issue | Solution |
|-------|----------|
| Build fails | Check `npm run build` locally first |
| Blank page | Check browser console (F12), verify env vars |
| 502 Bad Gateway | Restart container, check logs |
| Database connection error | Verify Supabase credentials in env |
| Chat not responding | Check `OPENROUTER_API_KEY` is valid |
| Webhooks not working | Verify `N8N_WEBHOOK_SECRET` matches n8n config |
| Performance slow | Check database queries, enable caching |

---

## Rollback

### Quick Rollback

If deployment is broken:

**Easypanel/Vercel**:
- Dashboard → Deployments
- Click previous working deployment
- Click "Rollback"

**Docker**:
```bash
# Stop current
docker stop app

# Run previous image
docker run -d app:previous-tag
```

---

## Deployment Checklist

- [ ] `.env` file created with all production values
- [ ] `npm run build` succeeds locally
- [ ] `npm run type-check` passes
- [ ] Secrets generated (CRON_SECRET, etc.)
- [ ] Database backup created
- [ ] SSL certificate provisioned
- [ ] Domain DNS pointing to server
- [ ] Container resources configured (memory, CPU)
- [ ] Monitoring/uptime alerts set up
- [ ] Backup strategy documented
- [ ] Post-deployment checks pass
- [ ] Admin can log in
- [ ] Chat is working
- [ ] API endpoints return data

---

**Before First Production Push**: Review [SECURITY.md](SECURITY.md) for hardening recommendations.

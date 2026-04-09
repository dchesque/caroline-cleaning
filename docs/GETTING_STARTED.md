# Getting Started - Chesque Premium Cleaning

**Purpose**: Installation, setup, and first run of the application  
**Last Updated**: April 2026

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Environment Configuration](#environment-configuration)
4. [Running the App](#running-the-app)
5. [Verification & Health Checks](#verification--health-checks)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Required software:
- **Node.js** 20+ ([download](https://nodejs.org/))
- **npm** 10+ (included with Node.js)
- **Git** for version control
- **Code Editor** (VS Code recommended)

External accounts:
- **Supabase** account ([supabase.com](https://supabase.com)) — PostgreSQL database
- **Twilio** account (optional, for SMS) — Phone/WhatsApp notifications
- **OpenRouter** account (optional, for Carol AI) — LLM gateway

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd caroline-cleaning
```

### 2. Install Dependencies

```bash
npm install
```

This installs all packages from `package.json` and generates the lock file.

### 3. Verify Installation

```bash
npm --version
node --version
```

Expected output: Node 20.x+, npm 10.x+

---

## Environment Configuration

### Copy Environment Template

```bash
cp .env.example .env.local
```

### Configure Variables

Edit `.env.local` and fill in real values for all **Required** variables:

#### Supabase (Required)
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**How to get:**
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → API Keys
4. Copy `Project URL`, `anon key`, and `service_role key`

#### App Configuration (Required)
```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com  # or http://localhost:3000 for dev
NODE_ENV=development  # or production
PORT=3000
HOSTNAME=0.0.0.0
```

#### Carol AI (Required for chat features)
```env
OPENROUTER_API_KEY=sk-or-...
CAROL_DEFAULT_MODEL=anthropic/claude-3.5-sonnet
```

**How to get:**
1. Create account at [openrouter.ai](https://openrouter.ai)
2. Go to API Keys
3. Create new key and copy
4. Model should be `anthropic/claude-3.5-sonnet` or similar

#### Security & Cron (Required for production)
```env
CRON_SECRET=generate-a-long-random-string-here
```

**Generate CRON_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Twilio (Optional - for SMS notifications)
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+15551234567
OWNER_PHONE_NUMBER=+15551234567
```

**How to get:**
1. Create account at [twilio.com](https://twilio.com)
2. Go to Console → Account SID & Auth Token
3. Provision a phone number
4. Copy credentials

#### n8n Webhook (Optional - for workflow automation)
```env
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://your-n8n.com/webhook/carolinas
N8N_WEBHOOK_SECRET=your-hmac-secret
```

#### Analytics (Optional)
```env
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
SENTRY_DSN=https://...
```

---

## Running the App

### Development Server

```bash
npm run dev
```

**Output:**
```
> next dev

  ▲ Next.js 15.x.x
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 2.5s
```

**Access the app:**
- Public pages: http://localhost:3000
- Chat: http://localhost:3000/chat
- Admin login: http://localhost:3000/login
- API endpoints: http://localhost:3000/api/*

### Build for Production

```bash
npm run build
npm run start
```

---

## Verification & Health Checks

### 1. Database Connection

**Test Supabase connection:**
```bash
curl http://localhost:3000/api/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-04-09T..."
}
```

### 2. Chat Endpoint

**Test Carol AI chat:**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello Carol","sessionId":"test-123"}'
```

### 3. Auth Check

Navigate to:
- http://localhost:3000/login — Should show login form
- http://localhost:3000/admin — Should redirect to login (protected)

### 4. Landing Page

Navigate to http://localhost:3000 and verify:
- ✅ Hero section displays
- ✅ Chat widget appears (bottom right)
- ✅ Menu button works (top right)
- ✅ "Schedule a Visit" button is clickable

### 5. Configuration Check

```bash
curl http://localhost:3000/api/config/public
```

Should return app configuration.

---

## Troubleshooting

### Port Already in Use

```bash
# Find process on port 3000
lsof -i :3000

# Kill process (macOS/Linux)
kill -9 <PID>

# Or use a different port
PORT=3001 npm run dev
```

### Module Not Found

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Environment Variables Not Loading

```bash
# Verify .env.local exists and has correct values
cat .env.local

# Restart dev server (important!)
npm run dev
```

### Supabase Connection Error

```
Error: Could not connect to database
```

**Fix:**
1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct (not truncated)
3. Check Supabase project is active
4. Check internet connectivity

### Carol AI Not Responding

```bash
# Check OpenRouter API key
curl -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  https://openrouter.ai/api/v1/auth/key

# Check if CAROL_DEFAULT_MODEL is valid
# Currently: anthropic/claude-3.5-sonnet
```

### Port/Hostname Issues in Docker

If running in Docker:
```env
HOST=0.0.0.0  # Listen on all interfaces
PORT=3000
```

---

## Next Steps

After setup:

1. **Explore the app**
   - Visit http://localhost:3000 (landing page)
   - Try http://localhost:3000/chat (chat interface)

2. **Create admin account**
   - Go to http://localhost:3000/login
   - Sign up with Supabase (if auth is enabled)

3. **Review documentation**
   - [ARCHITECTURE.md](ARCHITECTURE.md) — System overview
   - [ROUTES_SCREENS.md](ROUTES_SCREENS.md) — All pages and routes
   - [API.md](API.md) — Endpoints

4. **Read development guidelines**
   - [DEVELOPMENT.md](DEVELOPMENT.md) — Workflow and contributing
   - [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) — UI guidelines

---

## Common Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm test             # Run tests (if configured)
npm run type-check   # Check TypeScript types
```

---

## Environment Files Summary

| File | Purpose | Tracked |
|---|---|---|
| `.env.example` | Template with all variables | ✅ Yes |
| `.env.local` | Local development config | ❌ No (gitignored) |
| `.env.production` | Production config | ❌ No (gitignored) |
| `.env.staging` | Staging config | ❌ No (gitignored) |

**Security**: Never commit `.env.local` or `.env.production`. Use `.env.example` as template.

---

**Need help?** Check [DEVELOPMENT.md](DEVELOPMENT.md) for workflow questions or [ARCHITECTURE.md](ARCHITECTURE.md) for system design questions.

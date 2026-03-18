# FASE 8: DEPLOY E PRODUÇÃO
## Chesque Premium Cleaning - Plataforma de Atendimento e Gestão

**Versão:** 1.0  
**Data:** Dezembro 2024  
**Duração Estimada:** 2-3 dias  
**Prioridade:** 🔴 CRITICAL  
**Pré-requisito:** Fases 1-7 completas e testadas

---

## 📋 RESUMO EXECUTIVO

Esta fase cobre todo o processo de **deploy para produção** usando **Easypanel** com Docker, incluindo configuração de domínio, SSL, variáveis de ambiente, monitoramento e boas práticas.

### Escopo da Fase 8:
- ✅ Dockerfile otimizado para produção
- ✅ Configuração Easypanel
- ✅ Variáveis de ambiente de produção
- ✅ Domínio personalizado e SSL
- ✅ Healthchecks e monitoramento
- ✅ Backup e recuperação
- ✅ CI/CD com GitHub Actions
- ✅ Checklist de lançamento

---

## 1. DOCKERFILE OTIMIZADO

### 1.1 Dockerfile para Produção

```dockerfile
# Dockerfile
# ============================================
# Chesque PREMIUM CLEANING - PRODUCTION BUILD
# ============================================

# ============================================
# STAGE 1: Dependencies
# ============================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production

# ============================================
# STAGE 2: Builder
# ============================================
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the application
RUN npm run build

# ============================================
# STAGE 3: Runner (Production)
# ============================================
FROM node:20-alpine AS runner
WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set correct ownership
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set port environment variable
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", "server.js"]
```

### 1.2 Arquivo .dockerignore

```dockerignore
# .dockerignore

# Dependencies
node_modules
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Next.js
.next
out

# Build
dist
build

# Testing
coverage
.nyc_output

# IDE
.idea
.vscode
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Environment (IMPORTANTE: não incluir em produção)
.env
.env.local
.env.development
.env.test

# Git
.git
.gitignore

# Docker
Dockerfile*
docker-compose*
.docker

# Documentation
README.md
docs

# Misc
*.log
*.md
!README.md
```

### 1.3 Configuração next.config.js para Standalone

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Habilitar output standalone para Docker
  output: 'standalone',
  
  // Otimizações de produção
  reactStrictMode: true,
  swcMinify: true,
  
  // Comprimir respostas
  compress: true,
  
  // Otimização de imagens
  images: {
    domains: [
      'localhost',
      // Adicionar domínio do Supabase Storage
      process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').split('.')[0] + '.supabase.co',
    ].filter(Boolean),
    formats: ['image/avif', 'image/webp'],
  },
  
  // Headers de segurança
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
    ]
  },
  
  // Redirecionamentos
  async redirects() {
    return [
      // Redirecionar www para não-www
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.Chesquecleaning.com' }],
        destination: 'https://Chesquecleaning.com/:path*',
        permanent: true,
      },
    ]
  },
  
  // Logging em produção
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
}

module.exports = nextConfig
```

---

## 2. HEALTH CHECK API

### 2.1 API de Health Check - app/api/health/route.ts

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  checks: {
    database: boolean
    memory: {
      used: number
      total: number
      percentage: number
    }
    uptime: number
  }
}

export async function GET() {
  const startTime = Date.now()
  
  try {
    // Check database connection
    const supabase = await createClient()
    const { error: dbError } = await supabase
      .from('configuracoes')
      .select('id')
      .limit(1)
      .single()
    
    const dbHealthy = !dbError

    // Memory usage (Node.js)
    const memUsage = process.memoryUsage()
    const memoryCheck = {
      used: Math.round(memUsage.heapUsed / 1024 / 1024),
      total: Math.round(memUsage.heapTotal / 1024 / 1024),
      percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
    }

    // Determine overall status
    let status: HealthStatus['status'] = 'healthy'
    if (!dbHealthy) {
      status = 'unhealthy'
    } else if (memoryCheck.percentage > 90) {
      status = 'degraded'
    }

    const health: HealthStatus = {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: dbHealthy,
        memory: memoryCheck,
        uptime: process.uptime()
      }
    }

    const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503

    return NextResponse.json(health, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    })

  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-store'
      }
    })
  }
}
```

### 2.2 API de Readiness - app/api/ready/route.ts

```typescript
// app/api/ready/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Verificar se todos os serviços estão prontos
    const supabase = await createClient()
    
    // Test database
    const { error } = await supabase.from('configuracoes').select('id').limit(1)
    
    if (error) {
      return NextResponse.json(
        { ready: false, reason: 'Database not ready' },
        { status: 503 }
      )
    }

    return NextResponse.json({ ready: true }, { status: 200 })

  } catch (error) {
    return NextResponse.json(
      { ready: false, reason: 'Service initialization failed' },
      { status: 503 }
    )
  }
}
```

---

## 3. CONFIGURAÇÃO EASYPANEL

### 3.1 Arquivo easypanel.yml (opcional)

```yaml
# easypanel.yml
# Configuração declarativa para Easypanel

name: Chesque-cleaning
description: Chesque Premium Cleaning Platform

services:
  web:
    type: app
    source:
      type: github
      owner: your-github-username
      repo: Chesque-cleaning
      branch: main
    build:
      type: dockerfile
      file: Dockerfile
    deploy:
      replicas: 1
      resources:
        limits:
          cpu: "1"
          memory: "1Gi"
        requests:
          cpu: "0.5"
          memory: "512Mi"
    domains:
      - host: Chesquecleaning.com
        https: true
      - host: www.Chesquecleaning.com
        https: true
        redirect: Chesquecleaning.com
    healthCheck:
      path: /api/health
      interval: 30s
      timeout: 10s
    env:
      - name: NODE_ENV
        value: production
      - name: NEXT_PUBLIC_SUPABASE_URL
        secret: true
      - name: NEXT_PUBLIC_SUPABASE_ANON_KEY
        secret: true
      - name: SUPABASE_SERVICE_ROLE_KEY
        secret: true
      - name: N8N_WEBHOOK_SECRET
        secret: true
```

### 3.2 Passo a Passo - Configuração Manual no Easypanel

```markdown
# GUIA DE DEPLOY NO EASYPANEL

## Pré-requisitos
- Conta no Easypanel (https://easypanel.io)
- Servidor configurado (VPS com Docker)
- Repositório Git com o código

## Passo 1: Criar Projeto

1. Acesse o painel do Easypanel
2. Clique em "Create Project"
3. Nome: `Chesque-cleaning`
4. Clique em "Create"

## Passo 2: Criar Serviço

1. Dentro do projeto, clique em "Create Service"
2. Selecione "App"
3. Configure:
   - Name: `web`
   - Source: GitHub (conecte sua conta)
   - Repository: `seu-usuario/Chesque-cleaning`
   - Branch: `main`
   - Build: Dockerfile
   - Dockerfile Path: `Dockerfile`

## Passo 3: Configurar Domínio

1. Na aba "Domains", clique em "Add Domain"
2. Domain: `Chesquecleaning.com`
3. Habilite HTTPS (Let's Encrypt)
4. Repita para `www.Chesquecleaning.com` com redirect

## Passo 4: Variáveis de Ambiente

1. Na aba "Environment", adicione:

```
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
N8N_WEBHOOK_SECRET=seu-secret-seguro
N8N_CHAT_WEBHOOK_URL=https://seu-n8n.com/webhook/carol
EVOLUTION_API_URL=https://sua-evolution.com
EVOLUTION_API_KEY=sua-api-key
EVOLUTION_INSTANCE=Chesque
```

## Passo 5: Configurar Resources

1. Na aba "Deploy":
   - CPU Limit: 1 core
   - Memory Limit: 1GB
   - CPU Request: 0.5 core
   - Memory Request: 512MB

## Passo 6: Health Check

1. Na aba "Deploy" > "Health Check":
   - Path: `/api/health`
   - Port: 3000
   - Interval: 30s
   - Timeout: 10s

## Passo 7: Deploy

1. Clique em "Deploy"
2. Aguarde o build completar
3. Verifique os logs para erros
4. Acesse o domínio para testar
```

---

## 4. VARIÁVEIS DE AMBIENTE

### 4.1 Template .env.production

```env
# .env.production.example
# Copie para .env.local e preencha os valores

# ============================================
# AMBIENTE
# ============================================
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://Chesquecleaning.com

# ============================================
# SUPABASE
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# N8N INTEGRATION
# ============================================
N8N_WEBHOOK_SECRET=gere-um-secret-seguro-aqui
N8N_CHAT_WEBHOOK_URL=https://seu-n8n.com/webhook/carol-chat
N8N_TRIGGER_WEBHOOK_URL=https://seu-n8n.com/webhook/carol-trigger

# ============================================
# WHATSAPP (EVOLUTION API)
# ============================================
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua-api-key-evolution
EVOLUTION_INSTANCE=Chesque

# ============================================
# OPENAI (para IA no n8n)
# ============================================
OPENAI_API_KEY=sk-xxxxx

# ============================================
# ANALYTICS (OPCIONAL)
# ============================================
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# ============================================
# SENTRY (OPCIONAL - MONITORAMENTO DE ERROS)
# ============================================
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### 4.2 Validação de Variáveis - lib/env.ts

```typescript
// lib/env.ts
// Validação de variáveis de ambiente em runtime

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const

const optionalEnvVars = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'N8N_WEBHOOK_SECRET',
  'N8N_CHAT_WEBHOOK_URL',
  'EVOLUTION_API_URL',
  'EVOLUTION_API_KEY',
  'OPENAI_API_KEY',
  'NEXT_PUBLIC_GA_ID',
  'SENTRY_DSN',
] as const

type RequiredEnvVar = typeof requiredEnvVars[number]
type OptionalEnvVar = typeof optionalEnvVars[number]

export function validateEnv() {
  const missing: string[] = []
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar)
    }
  }
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.join('\n')}`
    )
  }
  
  // Log warning for missing optional vars in production
  if (process.env.NODE_ENV === 'production') {
    const missingOptional: string[] = []
    for (const envVar of optionalEnvVars) {
      if (!process.env[envVar]) {
        missingOptional.push(envVar)
      }
    }
    if (missingOptional.length > 0) {
      console.warn(
        `Warning: Missing optional environment variables:\n${missingOptional.join('\n')}`
      )
    }
  }
}

// Chamar no início do app
// validateEnv()

export const env = {
  // Supabase
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  
  // N8N
  n8nWebhookSecret: process.env.N8N_WEBHOOK_SECRET,
  n8nChatWebhookUrl: process.env.N8N_CHAT_WEBHOOK_URL,
  
  // Evolution API
  evolutionUrl: process.env.EVOLUTION_API_URL,
  evolutionKey: process.env.EVOLUTION_API_KEY,
  evolutionInstance: process.env.EVOLUTION_INSTANCE || 'Chesque',
  
  // Analytics
  gaId: process.env.NEXT_PUBLIC_GA_ID,
  
  // App
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
}
```

---

## 5. GITHUB ACTIONS - CI/CD

### 5.1 Workflow de Deploy - .github/workflows/deploy.yml

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # ============================================
  # JOB 1: Test
  # ============================================
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run type check
        run: npm run type-check

      - name: Run tests
        run: npm test --if-present

  # ============================================
  # JOB 2: Build and Push Docker Image
  # ============================================
  build:
    name: Build Docker Image
    runs-on: ubuntu-latest
    needs: test
    permissions:
      contents: read
      packages: write
    outputs:
      image_tag: ${{ steps.meta.outputs.tags }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=
            type=raw,value=latest

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # ============================================
  # JOB 3: Deploy to Easypanel
  # ============================================
  deploy:
    name: Deploy to Easypanel
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy via Easypanel API
        run: |
          curl -X POST "${{ secrets.EASYPANEL_WEBHOOK_URL }}" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${{ secrets.EASYPANEL_API_KEY }}" \
            -d '{
              "project": "Chesque-cleaning",
              "service": "web",
              "action": "deploy"
            }'

      - name: Wait for deployment
        run: sleep 30

      - name: Health check
        run: |
          for i in {1..10}; do
            response=$(curl -s -o /dev/null -w "%{http_code}" https://Chesquecleaning.com/api/health)
            if [ "$response" = "200" ]; then
              echo "✅ Health check passed"
              exit 0
            fi
            echo "Waiting for service to be ready... (attempt $i/10)"
            sleep 10
          done
          echo "❌ Health check failed"
          exit 1

      - name: Notify on success
        if: success()
        run: |
          echo "✅ Deployment successful!"
          # Opcional: enviar notificação para Slack/Discord

      - name: Notify on failure
        if: failure()
        run: |
          echo "❌ Deployment failed!"
          # Opcional: enviar alerta
```

### 5.2 Workflow de Preview - .github/workflows/preview.yml

```yaml
# .github/workflows/preview.yml
name: Preview Deployment

on:
  pull_request:
    branches: [main]

jobs:
  preview:
    name: Build Preview
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run checks
        run: |
          npm run lint
          npm run type-check

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

      - name: Comment on PR
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '✅ Build successful! Ready for review.'
            })
```

---

## 6. MONITORAMENTO E LOGS

### 6.1 Integração Sentry (Opcional)

```bash
# Instalar Sentry
npm install @sentry/nextjs
```

```javascript
// sentry.client.config.js
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
})
```

```javascript
// sentry.server.config.js
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
})
```

### 6.2 Google Analytics (Opcional)

```tsx
// components/analytics/google-analytics.tsx
'use client'

import Script from 'next/script'

const GA_ID = process.env.NEXT_PUBLIC_GA_ID

export function GoogleAnalytics() {
  if (!GA_ID) return null

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  )
}
```

```tsx
// app/layout.tsx - Adicionar
import { GoogleAnalytics } from '@/components/analytics/google-analytics'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <GoogleAnalytics />
      </body>
    </html>
  )
}
```

### 6.3 Logging Estruturado

```typescript
// lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, any>
}

class Logger {
  private isDev = process.env.NODE_ENV === 'development'

  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    }

    if (this.isDev) {
      // Console colorido em dev
      const colors = {
        debug: '\x1b[36m',
        info: '\x1b[32m',
        warn: '\x1b[33m',
        error: '\x1b[31m',
      }
      console.log(
        `${colors[level]}[${level.toUpperCase()}]\x1b[0m ${message}`,
        context || ''
      )
    } else {
      // JSON em produção (para agregadores de log)
      console.log(JSON.stringify(entry))
    }

    // Enviar para Sentry se for erro
    if (level === 'error' && typeof window !== 'undefined') {
      import('@sentry/nextjs').then(Sentry => {
        Sentry.captureMessage(message, {
          level: 'error',
          extra: context,
        })
      })
    }
  }

  debug(message: string, context?: Record<string, any>) {
    if (this.isDev) this.log('debug', message, context)
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context)
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context)
  }

  error(message: string, context?: Record<string, any>) {
    this.log('error', message, context)
  }
}

export const logger = new Logger()
```

---

## 7. BACKUP E RECUPERAÇÃO

### 7.1 Script de Backup do Supabase

```bash
#!/bin/bash
# scripts/backup.sh
# Backup do banco de dados Supabase

set -e

# Configurações
SUPABASE_PROJECT_REF="seu-project-ref"
SUPABASE_DB_PASSWORD="sua-db-password"
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${DATE}.sql"

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Fazer backup via pg_dump
PGPASSWORD=$SUPABASE_DB_PASSWORD pg_dump \
  -h db.${SUPABASE_PROJECT_REF}.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -F c \
  -b \
  -v \
  -f $BACKUP_FILE

# Comprimir
gzip $BACKUP_FILE

echo "✅ Backup criado: ${BACKUP_FILE}.gz"

# Limpar backups antigos (manter últimos 7 dias)
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "✅ Backups antigos removidos"
```

### 7.2 Política de Backup

```markdown
# POLÍTICA DE BACKUP - Chesque CLEANING

## Frequência
- **Banco de dados**: Diário (via Supabase automático)
- **Storage/Arquivos**: Semanal
- **Código**: Contínuo (Git)

## Retenção
- Backups diários: 7 dias
- Backups semanais: 4 semanas
- Backups mensais: 12 meses

## Recuperação
1. Acessar dashboard do Supabase
2. Settings > Database > Backups
3. Selecionar ponto de restauração
4. Confirmar restore

## Teste de Recuperação
- Realizar teste trimestral
- Documentar resultado
- Atualizar procedimentos se necessário
```

---

## 8. SEGURANÇA

### 8.1 Checklist de Segurança

```markdown
# CHECKLIST DE SEGURANÇA - PRÉ-DEPLOY

## Variáveis de Ambiente
- [ ] Todas as secrets estão no Easypanel (não no código)
- [ ] .env não está no repositório Git
- [ ] Service Role Key não está exposta no frontend

## Autenticação
- [ ] RLS habilitado em todas as tabelas
- [ ] Policies configuradas corretamente
- [ ] Senhas fortes para usuário admin
- [ ] Rate limiting nas APIs

## Headers de Segurança
- [ ] HTTPS forçado
- [ ] HSTS configurado
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] Referrer-Policy configurado

## API
- [ ] Webhook secrets configurados
- [ ] Validação de entrada em todas as APIs
- [ ] Error handling não expõe informações sensíveis

## Monitoramento
- [ ] Logs de acesso configurados
- [ ] Alertas de erro configurados
- [ ] Health checks ativos
```

### 8.2 Rate Limiting Middleware

```typescript
// middleware.ts - Adicionar rate limiting
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; timestamp: number }>()

function rateLimit(ip: string, limit: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now - record.timestamp > windowMs) {
    rateLimitMap.set(ip, { count: 1, timestamp: now })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}

export function middleware(request: NextRequest) {
  // Rate limiting para APIs
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    
    if (!rateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }
  }

  // ... resto do middleware existente
}
```

---

## 9. CHECKLIST DE LANÇAMENTO

### 9.1 Pré-Deploy

```markdown
# CHECKLIST PRÉ-DEPLOY

## Código
- [ ] Todos os testes passando
- [ ] Lint sem erros
- [ ] Build local funciona
- [ ] Console sem erros/warnings críticos

## Configuração
- [ ] next.config.js com output: 'standalone'
- [ ] Dockerfile testado localmente
- [ ] .dockerignore configurado
- [ ] Variáveis de ambiente documentadas

## Supabase
- [ ] Migrations aplicadas
- [ ] RLS policies verificadas
- [ ] Indexes criados
- [ ] Functions testadas

## Domínio
- [ ] DNS configurado (A record ou CNAME)
- [ ] SSL/HTTPS habilitado
- [ ] Redirect www → não-www

## Integrações
- [ ] n8n workflow testado
- [ ] WhatsApp conectado (Evolution API)
- [ ] Webhooks configurados
```

### 9.2 Pós-Deploy

```markdown
# CHECKLIST PÓS-DEPLOY

## Verificação Funcional
- [ ] Página inicial carrega
- [ ] Chat da Carol funciona
- [ ] Login admin funciona
- [ ] Dashboard carrega dados
- [ ] Agendamento funciona
- [ ] Notificações funcionam

## Performance
- [ ] Tempo de carregamento < 3s
- [ ] Health check retorna 200
- [ ] Sem erros no console

## Monitoramento
- [ ] Logs sendo capturados
- [ ] Alertas configurados
- [ ] Sentry recebendo erros (se configurado)

## Backup
- [ ] Backup automático ativo no Supabase
- [ ] Primeiro backup verificado
```

### 9.3 Runbook de Incidentes

```markdown
# RUNBOOK - INCIDENTES COMUNS

## Site Fora do Ar
1. Verificar status do Easypanel
2. Checar logs do container
3. Verificar health check: `curl https://Chesquecleaning.com/api/health`
4. Se necessário, reiniciar serviço no Easypanel
5. Verificar se Supabase está operacional

## Erros 500
1. Acessar logs do Easypanel
2. Verificar conexão com Supabase
3. Checar variáveis de ambiente
4. Verificar rate limits

## Chat não Responde
1. Verificar status do n8n
2. Checar webhook URL
3. Testar endpoint: `curl -X POST /api/chat`
4. Verificar logs de erro

## Deploy Falhou
1. Verificar logs do build
2. Checar se Dockerfile está correto
3. Verificar se todas env vars estão configuradas
4. Rebuild: `docker build --no-cache .`

## Rollback
1. No Easypanel, ir em "Deployments"
2. Selecionar versão anterior estável
3. Clicar em "Rollback"
4. Verificar funcionamento
```

---

## 10. COMANDOS ÚTEIS

### 10.1 Docker Local

```bash
# Build local
docker build -t Chesque-cleaning .

# Run local
docker run -p 3000:3000 --env-file .env.local Chesque-cleaning

# Ver logs
docker logs -f <container_id>

# Shell no container
docker exec -it <container_id> sh

# Limpar imagens antigas
docker system prune -a
```

### 10.2 Produção

```bash
# Ver status (via SSH no servidor)
docker ps

# Logs em tempo real
docker logs -f Chesque-cleaning-web

# Restart
docker restart Chesque-cleaning-web

# Health check manual
curl -s https://Chesquecleaning.com/api/health | jq

# Verificar uso de recursos
docker stats
```

### 10.3 Supabase

```bash
# Listar migrations
supabase migration list

# Aplicar migrations
supabase db push

# Reset banco (CUIDADO: apaga dados!)
supabase db reset

# Gerar types
supabase gen types typescript --local > types/supabase.ts
```

---

## ✅ DEFINIÇÃO DE PRONTO

A Fase 8 está COMPLETA quando:

1. ✅ Dockerfile otimizado e testado
2. ✅ Deploy no Easypanel funcionando
3. ✅ Domínio configurado com SSL
4. ✅ Variáveis de ambiente em produção
5. ✅ Health check respondendo 200
6. ✅ CI/CD configurado (GitHub Actions)
7. ✅ Monitoramento básico ativo
8. ✅ Backup configurado
9. ✅ Checklist de lançamento verificado
10. ✅ Site acessível publicamente

---

## 🎉 PROJETO COMPLETO!

Com a conclusão da Fase 8, o projeto **Chesque Premium Cleaning** está completo e em produção!

### Resumo das Fases:

| Fase | Descrição | Status |
|------|-----------|--------|
| 1 | Setup Inicial | ✅ |
| 2 | Database & Supabase | ✅ |
| 3 | Landing Page & Chat | ✅ |
| 4 | Painel Admin Core | ✅ |
| 5 | Módulos Avançados | ✅ |
| 6 | Integração Carol/n8n | ✅ |
| 7 | Analytics & Relatórios | ✅ |
| 8 | Deploy & Produção | ✅ |

### Próximos Passos Sugeridos:

1. **Monitorar métricas** de uso e performance
2. **Coletar feedback** dos usuários
3. **Iterar** com melhorias baseadas em dados
4. **Expandir** funcionalidades conforme necessário

---

**— FIM DA FASE 8 E DO PROJETO —**

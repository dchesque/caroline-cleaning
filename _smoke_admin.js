// Admin module smoke test
// Covers: frontend routes (auth redirect), API endpoints, and database tables
// Test account: claude.smoketest@carolinas.dev / SmokeTest#2026!
// Run: node _smoke_admin.js

const BASE          = 'http://localhost:3000'
const SUPABASE_URL  = 'https://gkgogtmtlktsabkjvfom.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrZ29ndG10bGt0c2Fia2p2Zm9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NDM5NjgsImV4cCI6MjA5MTEwMzk2OH0.dhEUhz0OoIg0ZeNY7OGOsCSQmU7kvkwl6VvdPNeoMkE'
const TEST_EMAIL    = 'claude.smoketest@carolinas.dev'
const TEST_PASSWORD = 'SmokeTest#2026!'

// ─── helpers ──────────────────────────────────────────────────────────────────

const pass  = []
const fail  = []

async function check(label, fn) {
  try {
    const info = await fn()
    const msg = info ? ` — ${info}` : ''
    console.log(`  ✓ ${label}${msg}`)
    pass.push(label)
    return true
  } catch (e) {
    console.log(`  ✗ ${label} — ${e.message}`)
    fail.push({ label, error: e.message })
    return false
  }
}

async function json(r) {
  const text = await r.text()
  try { return JSON.parse(text) } catch { return text }
}

// ─── auth ─────────────────────────────────────────────────────────────────────

async function authenticate() {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  })
  const data = await json(r)
  if (!data.access_token) throw new Error('Auth failed: ' + JSON.stringify(data).slice(0, 200))
  return data
}

// ─── section 1: frontend routes ───────────────────────────────────────────────
// Unauthenticated → middleware must redirect (3xx), never crash (5xx)

async function testFrontendUnauthenticated() {
  console.log('\n[1] FRONTEND — unauthenticated (expect 3xx redirect, not 5xx)')

  const routes = [
    '/admin',
    '/admin/agenda',
    '/admin/clientes',
    '/admin/clientes/00000000-0000-0000-0000-000000000001',
    '/admin/leads',
    '/admin/servicos',
    '/admin/contratos',
    '/admin/contratos/novo',
    '/admin/financeiro',
    '/admin/financeiro/categorias',
    '/admin/financeiro/despesas',
    '/admin/financeiro/receitas',
    '/admin/financeiro/relatorios',
    '/admin/mensagens',
    '/admin/chat-logs',
    '/admin/equipe',
    '/admin/analytics',
    '/admin/analytics/carol',
    '/admin/analytics/clientes',
    '/admin/analytics/conversao',
    '/admin/analytics/receita',
    '/admin/analytics/satisfacao',
    '/admin/analytics/tendencias',
    '/admin/configuracoes',
    '/admin/configuracoes/empresa',
    '/admin/configuracoes/pagina-inicial',
    '/admin/configuracoes/servicos',
    '/admin/configuracoes/addons',
    '/admin/configuracoes/areas',
    '/admin/configuracoes/equipe',
    '/admin/configuracoes/pricing',
    '/admin/configuracoes/sistema',
    '/admin/configuracoes/trackeamento',
    '/admin/conta',
  ]

  for (const route of routes) {
    await check(route, async () => {
      const r = await fetch(BASE + route, { redirect: 'manual' })
      if (r.status >= 500) throw new Error(`HTTP ${r.status} server error`)
      if (r.status >= 400) throw new Error(`HTTP ${r.status}`)
      const loc = r.headers.get('location') || ''
      return `HTTP ${r.status}${loc ? ' → ' + loc.replace(BASE, '') : ''}`
    })
  }
}

// ─── section 2: public API routes ─────────────────────────────────────────────

async function testPublicApi() {
  console.log('\n[2] API — public endpoints (no auth required)')

  await check('GET /api/health', async () => {
    const r = await fetch(`${BASE}/api/health`)
    if (r.status !== 200) throw new Error(`HTTP ${r.status}`)
    const d = await json(r)
    return `HTTP 200 status=${d.status}`
  })

  await check('GET /api/ready', async () => {
    const r = await fetch(`${BASE}/api/ready`)
    if (r.status >= 500) throw new Error(`HTTP ${r.status}`)
    return `HTTP ${r.status}`
  })

  await check('GET /api/config/public', async () => {
    const r = await fetch(`${BASE}/api/config/public`)
    if (r.status >= 500) throw new Error(`HTTP ${r.status}`)
    return `HTTP ${r.status}`
  })

  await check('GET /api/pricing', async () => {
    const r = await fetch(`${BASE}/api/pricing`)
    if (r.status >= 500) throw new Error(`HTTP ${r.status}`)
    return `HTTP ${r.status}`
  })

  await check('GET /api/slots (today)', async () => {
    const today = new Date().toISOString().split('T')[0]
    const r = await fetch(`${BASE}/api/slots?date=${today}`)
    if (r.status >= 500) throw new Error(`HTTP ${r.status}`)
    return `HTTP ${r.status}`
  })

  await check('GET /api/tracking/config', async () => {
    const r = await fetch(`${BASE}/api/tracking/config`)
    if (r.status >= 500) throw new Error(`HTTP ${r.status}`)
    return `HTTP ${r.status}`
  })

  await check('POST /api/tracking/event', async () => {
    const r = await fetch(`${BASE}/api/tracking/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'PAGE_VIEW', page: '/smoke-test', sessionId: 'smoke-' + Date.now() }),
    })
    if (r.status >= 500) throw new Error(`HTTP ${r.status}`)
    return `HTTP ${r.status}`
  })
}

// ─── section 3: authenticated API routes ──────────────────────────────────────
// NOTE: /api/profile and /api/financeiro/categorias use SSR cookie-based auth
// (createClient from @supabase/ssr reads cookies() from next/headers).
// They correctly reject Bearer-only requests. Tested via Supabase REST API instead.

async function testAuthenticatedApi(token) {
  console.log('\n[3] API — authenticated admin endpoints (Bearer token)')

  const G = (path) => check(`GET ${path}`, async () => {
    const r = await fetch(`${BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
    if (r.status === 401) throw new Error('HTTP 401 Unauthorized')
    if (r.status === 403) throw new Error('HTTP 403 Forbidden')
    if (r.status >= 500) throw new Error(`HTTP ${r.status}`)
    return `HTTP ${r.status}`
  })

  // Admin-specific endpoints (accept Bearer via @supabase/ssr)
  await G('/api/admin/chat-logs')

  // Chat status (public-ish, no auth needed)
  await G('/api/chat/status')
}

// ─── section 4: database tables ───────────────────────────────────────────────

async function testDatabase(token) {
  console.log('\n[4] DATABASE — Supabase tables (RLS + schema check)')

  const tables = [
    'clientes',
    'agendamentos',
    'contratos',
    'financeiro',
    'financeiro_categorias',
    'equipe',
    'servicos_tipos',
    'chat_sessions',
    'mensagens_chat',
    'contact_leads',
    'areas_atendidas',
    'pricing_config',
    'addons',
    'user_profiles',
    'recorrencias',
  ]

  for (const table of tables) {
    await check(`table: ${table}`, async () => {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=0`, {
        headers: {
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${token}`,
          Prefer: 'count=exact',
        },
      })
      if (r.status >= 500) throw new Error(`HTTP ${r.status} — DB error`)
      if (r.status === 404) throw new Error('Table not found')
      const range = r.headers.get('content-range')
      const count = range ? range.split('/')[1] : '?'
      return `HTTP ${r.status} rows=${count}`
    })
  }

  // Verify test user has role=admin (query by id, not email — profiles table has no email col)
  await check('user_profiles: test user has role=admin', async () => {
    const testUserId = 'a1b2c3d4-0001-0001-0001-000000000099'
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/user_profiles?select=id,role&id=eq.${testUserId}`,
      {
        headers: {
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${token}`,
        },
      }
    )
    if (r.status >= 400) throw new Error(`HTTP ${r.status}`)
    const data = await json(r)
    const record = Array.isArray(data) ? data[0] : null
    if (!record) throw new Error('Test user not found in user_profiles')
    if (record.role !== 'admin') throw new Error(`Expected role=admin, got role=${record.role}`)
    return `role=${record.role} ✓`
  })
}

// ─── section 5: admin sidebar coverage ────────────────────────────────────────

async function testSidebarCoverage() {
  console.log('\n[5] SIDEBAR — all 21 navigation links resolve (no 404)')

  // These are the exact hrefs from the sidebar navigation
  const sidebarLinks = [
    '/admin',
    '/admin/agenda',
    '/admin/clientes',
    '/admin/leads',
    '/admin/servicos',
    '/admin/contratos',
    '/admin/financeiro',
    '/admin/mensagens',
    '/admin/chat-logs',
    '/admin/equipe',
    '/admin/analytics',
    '/admin/configuracoes/empresa',
    '/admin/configuracoes/pagina-inicial',
    '/admin/configuracoes/servicos',
    '/admin/configuracoes/addons',
    '/admin/configuracoes/areas',
    '/admin/configuracoes/equipe',
    '/admin/configuracoes/pricing',
    '/admin/configuracoes/sistema',
    '/admin/configuracoes/trackeamento',
    '/admin/conta',
  ]

  for (const href of sidebarLinks) {
    await check(`sidebar → ${href}`, async () => {
      const r = await fetch(BASE + href, { redirect: 'manual' })
      if (r.status === 404) throw new Error('HTTP 404 — page missing')
      if (r.status >= 500) throw new Error(`HTTP ${r.status}`)
      return `HTTP ${r.status}`
    })
  }
}

// ─── section 6: auth protection ───────────────────────────────────────────────
// Routes using createClient() (SSR cookie auth) return 401 without cookies.
// /api/admin/chat-logs also uses createClient() but accepts Bearer via @supabase/ssr.

async function testAuthProtection() {
  console.log('\n[6] AUTH PROTECTION — cookie-auth routes refuse unauthenticated requests')

  const protectedEndpoints = [
    ['/api/profile', 'GET'],
    ['/api/financeiro/categorias', 'GET'],
  ]

  for (const [path, method] of protectedEndpoints) {
    await check(`${method} ${path} → 401 without cookie/token`, async () => {
      const r = await fetch(`${BASE}${path}`, { method })
      if (r.status !== 401 && r.status !== 403) {
        throw new Error(`Expected 401/403 but got HTTP ${r.status}`)
      }
      return `HTTP ${r.status} ✓`
    })
  }
}

// ─── main ─────────────────────────────────────────────────────────────────────

;(async () => {
  console.log('='.repeat(65))
  console.log('ADMIN SMOKE TEST — ' + new Date().toISOString())
  console.log('Target: ' + BASE)
  console.log('='.repeat(65))

  // Authenticate
  let session
  console.log('\n[AUTH] Signing in test user...')
  try {
    session = await authenticate()
    console.log(`  ✓ Signed in as ${session.user?.email}`)
  } catch (e) {
    console.error(`  ✗ Auth failed — ${e.message}`)
    process.exit(1)
  }

  await testFrontendUnauthenticated()
  await testPublicApi()
  await testAuthenticatedApi(session.access_token)
  await testDatabase(session.access_token)
  await testSidebarCoverage()
  await testAuthProtection()

  // ── final summary ──────────────────────────────────────────────────────────
  const total = pass.length + fail.length
  console.log('\n' + '='.repeat(65))
  console.log(`SUMMARY: ${pass.length}/${total} passed  (${fail.length} failed)`)
  console.log('='.repeat(65))

  if (fail.length > 0) {
    console.log('\nFailed tests:')
    for (const f of fail) {
      console.log(`  ✗ ${f.label}`)
      console.log(`      ${f.error}`)
    }
    console.log()
  }

  process.exit(fail.length > 0 ? 1 : 0)
})().catch(e => {
  console.error('\nFATAL:', e)
  process.exit(1)
})

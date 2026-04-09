// lib/rate-limit.ts
// Centralized in-memory rate limiter with auto-cleanup

// In-memory layer (fast, per-instance)
const memoryMap = new Map<string, { count: number; timestamp: number }>()

// Periodic cleanup of expired entries (prevent memory leak)
const CLEANUP_INTERVAL = 5 * 60_000 // 5 minutes
let lastCleanup = Date.now()

function cleanupExpiredEntries(windowMs: number): void {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now

  for (const [key, entry] of memoryMap) {
    if (now - entry.timestamp > windowMs * 2) {
      memoryMap.delete(key)
    }
  }
}

export interface RateLimitConfig {
  /** Unique prefix for this limiter (e.g., 'chat', 'contact') */
  prefix: string
  /** Max requests per window */
  limit: number
  /** Window duration in ms */
  windowMs: number
}

export function checkRateLimit(
  ip: string,
  config: RateLimitConfig
): boolean {
  const key = `${config.prefix}:${ip}`
  const now = Date.now()

  cleanupExpiredEntries(config.windowMs)

  const entry = memoryMap.get(key)

  if (!entry || now - entry.timestamp > config.windowMs) {
    memoryMap.set(key, { count: 1, timestamp: now })
    return true
  }

  if (entry.count >= config.limit) {
    return false
  }

  entry.count++
  return true
}

/**
 * Rate limit configurations for all endpoints.
 */
export const RATE_LIMITS = {
  chat: { prefix: 'chat', limit: 20, windowMs: 60_000 } as RateLimitConfig,
  contact: { prefix: 'contact', limit: 5, windowMs: 10 * 60_000 } as RateLimitConfig,
  api: { prefix: 'api', limit: 100, windowMs: 60_000 } as RateLimitConfig,
  slots: { prefix: 'slots', limit: 30, windowMs: 60_000 } as RateLimitConfig,
  admin: { prefix: 'admin', limit: 60, windowMs: 60_000 } as RateLimitConfig,
} as const

/**
 * Helper: extract client IP from request headers.
 *
 * Only trusts headers set by known-good infrastructure:
 *   - `cf-connecting-ip` from Cloudflare (trusted end-to-end)
 *   - On Vercel, `x-real-ip` and the first hop of `x-forwarded-for`
 *
 * Off Vercel / without Cloudflare, `x-forwarded-for` and `x-real-ip` are
 * client-controlled and cannot be trusted for rate-limiting, so we fall
 * back to `'unknown'`. In local development this means every caller
 * shares a single `'unknown'` rate-limit bucket, which is acceptable
 * because there is no attacker to spoof against.
 */
export function getClientIp(request: Request): string {
  // Cloudflare sets this and is trusted end-to-end
  const cf = request.headers.get('cf-connecting-ip')
  if (cf) return cf

  // On Vercel, x-real-ip is set by the platform and trustworthy.
  // Off Vercel, x-real-ip and x-forwarded-for are client-controlled
  // and cannot be trusted for rate-limiting.
  if (process.env.VERCEL === '1') {
    const real = request.headers.get('x-real-ip')
    if (real) return real
    const xff = request.headers.get('x-forwarded-for')
    if (xff) return xff.split(',')[0]?.trim() || 'unknown'
  }

  return 'unknown'
}

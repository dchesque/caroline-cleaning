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
} as const

/**
 * Helper: extract client IP from request headers.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

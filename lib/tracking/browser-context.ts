// lib/tracking/browser-context.ts
//
// Shared type + client helper for propagating browser context through the
// chat APIs so server-side Meta CAPI calls include fbc/fbp/UA/page_url/referrer.
//
// IP is intentionally NOT collected here — API routes extract it from the
// request headers (x-forwarded-for / x-real-ip) and merge it server-side.

export interface BrowserContext {
    fbc?: string
    fbp?: string
    clientIp?: string
    userAgent?: string
    eventSourceUrl?: string
    referrer?: string
}

function readCookie(name: string): string | null {
    if (typeof document === 'undefined') return null
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) {
        return parts.pop()?.split(';').shift() ?? null
    }
    return null
}

/**
 * Client-side: read Facebook cookies + navigator/location and build a
 * BrowserContext payload to send to the chat APIs. Safe on SSR (returns empty
 * object).
 */
export function getClientBrowserContext(): BrowserContext {
    if (typeof window === 'undefined') return {}
    return {
        fbc: readCookie('_fbc') ?? undefined,
        fbp: readCookie('_fbp') ?? undefined,
        userAgent: navigator.userAgent || undefined,
        eventSourceUrl: window.location.href || undefined,
        referrer: document.referrer || undefined,
    }
}

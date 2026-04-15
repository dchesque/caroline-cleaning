import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit'

// Forçar Node.js runtime (Supabase SSR não é compatível com Edge Runtime)
export const runtime = 'nodejs'

/**
 * Baseline security headers applied to every middleware response.
 * X-XSS-Protection is intentionally omitted — it is deprecated and can
 * introduce XSS vectors on legacy browsers.
 */
function applySecurityHeaders<T extends NextResponse>(res: T): T {
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    res.headers.set('X-Content-Type-Options', 'nosniff')
    res.headers.set('X-Frame-Options', 'DENY')
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    return res
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // 1. Skip middleware for health, ready, static assets and favicon early
    if (
        pathname === '/api/health' ||
        pathname === '/api/ready' ||
        pathname.startsWith('/_next/') ||
        pathname.includes('/favicon.ico') ||
        pathname.includes('.') // common for static files
    ) {
        return applySecurityHeaders(NextResponse.next())
    }

    // 2. Rate limiting for APIs
    if (pathname.startsWith('/api/')) {
        const ip = getClientIp(request)
        const config = pathname === '/api/chat'
            ? RATE_LIMITS.chat
            : pathname === '/api/lead-chat'
                ? RATE_LIMITS.leadChat
                : pathname === '/api/slots'
                    ? RATE_LIMITS.slots
                    : RATE_LIMITS.api

        if (!checkRateLimit(ip, config)) {
            return applySecurityHeaders(
                NextResponse.json(
                    { error: 'Too many requests' },
                    { status: 429 }
                )
            )
        }
    }

    // 3. Supabase session handling
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return request.cookies.getAll() },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: getUser() is expensive (50-100ms + Roundtrip). 
    // Only call it if we are on a protected route or login page.
    const isProtectedRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin')
    const isLoginPage = pathname === '/login'

    if (isProtectedRoute || isLoginPage) {
        const { data: { user } } = await supabase.auth.getUser()

        if (isProtectedRoute && !user) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            // Keep original query params if needed
            return applySecurityHeaders(NextResponse.redirect(url))
        }

        if (isLoginPage && user) {
            // Exception: the password-recovery flow lands on /login?mode=new-password
            // *with* an active recovery session. Without this guard the middleware
            // would bounce the user to /admin before they can set their new password.
            const mode = request.nextUrl.searchParams.get('mode')
            if (mode !== 'new-password') {
                const url = request.nextUrl.clone()
                url.pathname = '/admin'
                return applySecurityHeaders(NextResponse.redirect(url))
            }
        }
    }

    return applySecurityHeaders(supabaseResponse)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (specifically excluding health/ready if needed, though handled in code)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}

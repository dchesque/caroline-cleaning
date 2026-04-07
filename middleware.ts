import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Forçar Node.js runtime (Supabase SSR não é compatível com Edge Runtime)
export const runtime = 'nodejs'

// NOTE: This in-memory rate limiter is best-effort in serverless environments.
// The Map resets on every cold start, so it won't persist across instances.
// For stricter enforcement, use an external store (e.g., Redis/Upstash).
// This still provides protection within a single instance's lifetime.
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
        return NextResponse.next()
    }

    // 2. Rate limiting for APIs
    if (pathname.startsWith('/api/')) {
        const ip = (request as any).ip || request.headers.get('x-forwarded-for') || 'unknown'
        const limit = pathname === '/api/chat' ? 30 : 100

        if (!rateLimit(ip, limit)) {
            return NextResponse.json(
                { error: 'Too many requests' },
                { status: 429 }
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
            return NextResponse.redirect(url)
        }

        if (isLoginPage && user) {
            const url = request.nextUrl.clone()
            url.pathname = '/admin'
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
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

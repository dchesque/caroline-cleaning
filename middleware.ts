import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Forçar Node.js runtime (Supabase SSR não é compatível com Edge Runtime)
export const runtime = 'nodejs'

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
    // Skip middleware for health and ready endpoints
    if (request.nextUrl.pathname === '/api/health' ||
        request.nextUrl.pathname === '/api/ready') {
        return NextResponse.next()
    }

    // Rate limiting for APIs
    if (request.nextUrl.pathname.startsWith('/api/')) {
        const ip = (request as any).ip || request.headers.get('x-forwarded-for') || 'unknown'

        // Stricter limit for chat
        const limit = request.nextUrl.pathname === '/api/chat' ? 30 : 100

        if (!rateLimit(ip, limit)) {
            return NextResponse.json(
                { error: 'Too many requests' },
                { status: 429 }
            )
        }
    }

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

    const { data: { user } } = await supabase.auth.getUser()
    const { pathname } = request.nextUrl

    // Rotas protegidas
    if (pathname.startsWith('/admin')) {
        if (!user) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }
    }

    // Redirecionar se já logado
    if (pathname === '/login' && user) {
        const url = request.nextUrl.clone()
        url.pathname = '/admin'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/login',
        // Excluir explicitamente rotas de saúde do matcher
        '/((?!api/health|api/ready|_next/static|_next/image|favicon.ico).*)',
    ],
}

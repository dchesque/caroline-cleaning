import { NextResponse } from 'next/server'

// Força runtime Node.js
export const runtime = 'nodejs'

// Desabilita cache para health checks
export const dynamic = 'force-dynamic'

export async function GET() {
    return NextResponse.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    }, { status: 200 })
}

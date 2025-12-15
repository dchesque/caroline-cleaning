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

        // Note: It's okay if configuracoes is empty, as long as the query executes (no connection error)
        // However, .single() might error if no rows. Let's try .limit(1) and maybe just check connection.
        // Actually, .single() returns error if 0 rows. 
        // Let's assume dbHealthy is true if error is null OR error code is PGRST116 (0 rows) but that might still be an error object.
        // A safer check for connection is usually just a simple query.
        // If table doesn't exist, that's a problem. 
        // If table exists but empty, .single() gives error. 
        // Let's use maybeSingle() or just check if error is connection related.
        // Or just check auth.
        // But let's stick to the prompt's logic but maybe refine if needed. 
        // Prompt used .single(). I will stick directly to the prompt code but maybe handle the "no rows" case if I knew for sure.
        // Actually, checking "configuracoes" table seems safer. 

        // If the table is empty, .single() returns an error. 
        // Let's use `limit(1)` without single() and check `error`.
        // The prompt code:
        // .from('configuracoes').select('id').limit(1).single()
        // It's possible the user has this table populated.

        const dbHealthy = !dbError || dbError.code === 'PGRST116' // PGRST116 is "The result contains 0 rows" which means DB is up

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

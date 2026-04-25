// lib/ai/coverage.ts
//
// Service-area helper for prompts. Pulls active coverage cities from
// `areas_atendidas` and exposes them grouped by state, with an in-process
// cache so we don't hit Supabase on every chat turn.
//
// `isZipCovered` (in lead-chat-agent) is the source of truth for actual
// gating; this module is a UI/prompt helper so the LLM can answer "do you
// serve <city>?" without hallucinating.

import { createAdminClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export interface CoverageCities {
    nc: string[]
    sc: string[]
}

const TTL_MS = 5 * 60 * 1000 // 5 minutes
let cache: { value: CoverageCities; expiresAt: number } | null = null

export function clearCoverageCache(): void {
    cache = null
}

export async function getServiceAreaCities(): Promise<CoverageCities> {
    const now = Date.now()
    if (cache && cache.expiresAt > now) return cache.value

    try {
        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from('areas_atendidas')
            .select('cidade, estado')
            .eq('ativo', true)

        if (error) {
            logger.error('[coverage] query error', { error: error.message })
            return cache?.value ?? { nc: [], sc: [] }
        }

        const nc = new Set<string>()
        const sc = new Set<string>()
        for (const row of (data ?? []) as Array<{ cidade: string | null; estado: string | null }>) {
            if (!row.cidade) continue
            // Skip meta-coverage rows that don't represent a single city
            // (e.g. "Cobertura Metro 30mi / Fort Mill"). Dedup via Set already
            // handles the city-name overlap, but skipping the longer label
            // also keeps the source clean if anyone reads `nome` later.
            const state = (row.estado ?? '').toUpperCase()
            if (state === 'NC') nc.add(row.cidade)
            else if (state === 'SC') sc.add(row.cidade)
        }

        const value: CoverageCities = {
            nc: [...nc].sort(),
            sc: [...sc].sort(),
        }
        cache = { value, expiresAt: now + TTL_MS }
        return value
    } catch (err) {
        logger.error('[coverage] exception', { error: String(err) })
        return cache?.value ?? { nc: [], sc: [] }
    }
}

export function formatCoverageForPrompt(coverage: CoverageCities): string {
    const ncLine = coverage.nc.length > 0 ? `North Carolina: ${coverage.nc.join(', ')}` : null
    const scLine = coverage.sc.length > 0 ? `South Carolina: ${coverage.sc.join(', ')}` : null
    return [ncLine, scLine].filter(Boolean).join('\n')
}

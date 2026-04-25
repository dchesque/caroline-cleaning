// app/api/tracking/cache-invalidate/route.ts
//
// Invalidates the in-process Meta CAPI settings cache. Called by the admin
// trackeamento page right after saving config so a freshly rotated pixel id /
// access token / test event code is picked up on the very next event instead
// of waiting for the TTL to expire.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { clearMetaSettingsCache } from '@/lib/tracking/meta-capi'
import { logger } from '@/lib/logger'

export async function POST() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    clearMetaSettingsCache()
    logger.info('[tracking] meta settings cache invalidated', { userId: user.id })
    return NextResponse.json({ success: true })
}

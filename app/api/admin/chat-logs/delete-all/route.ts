// app/api/admin/chat-logs/delete-all/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    // Get count before deleting for logging
    const { count: beforeCount } = await adminClient
      .from('chat_logs')
      .select('*', { count: 'exact', head: true })

    // Delete all logs
    const { error } = await adminClient
      .from('chat_logs')
      .delete()
      .gte('created_at', '1970-01-01') // Delete all (always matches)

    if (error) {
      logger.error('[chat-logs] delete-all error', { error: error.message })
      return NextResponse.json({ error: 'Failed to delete logs' }, { status: 500 })
    }

    logger.info('[chat-logs] delete-all success', {
      deleted: beforeCount,
      userId: user.id,
    })

    return NextResponse.json({
      success: true,
      deleted: beforeCount || 0,
    })
  } catch (error) {
    logger.error('[chat-logs] delete-all exception', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

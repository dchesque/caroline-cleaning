'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UnifiedLead } from '@/types/leads'
import type { LeadFilters } from '@/types/leads'
import { normalizeToUnifiedLead } from '@/lib/utils/leads-normalizer'
import type { ContactLead } from '@/types/supabase'
import type { Cliente } from '@/types/supabase'

export function useLeads(filters: LeadFilters) {
  const [leads, setLeads] = useState<UnifiedLead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchLeads = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch both sources in parallel
      const [chatResult, formResult] = await Promise.all([
        // Chat AI leads from clientes table
        supabase
          .from('clientes')
          .select('*')
          .in('status', ['lead', 'lead_incomplete'])
          .is('deleted_at', null)
          .order('created_at', { ascending: false }),

        // Contact form leads
        supabase
          .from('contact_leads')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
      ])

      if (chatResult.error) throw chatResult.error
      if (formResult.error) throw formResult.error

      // Normalize both sources
      const chatLeads = (chatResult.data as Cliente[] || []).map(record =>
        normalizeToUnifiedLead('chat', record)
      )

      const formLeads = (formResult.data as ContactLead[] || []).map(record =>
        normalizeToUnifiedLead('form', record)
      )

      // Merge and sort by created_at
      const allLeads = [...chatLeads, ...formLeads].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      setLeads(allLeads)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leads')
      console.error('useLeads error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, []) // NOTE: Filtering is client-side via filterLeads(), so we don't refetch on filter change

  return { leads, isLoading, error, refetch: fetchLeads }
}

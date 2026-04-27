'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { LeadStats } from '@/types/leads'

export function useLeadStats() {
  const [stats, setStats] = useState<LeadStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true)

      try {
        const today = new Date().toISOString().split('T')[0]

        // Count chat leads
        const { data: chatLeads } = await supabase
          .from('clientes')
          .select('status, created_at')
          .in('status', ['lead', 'lead_incomplete'])
          .is('deleted_at', null)

        // Count form leads
        const { data: formLeads } = await supabase
          .from('contact_leads')
          .select('status, created_at')
          .is('deleted_at', null)

        const calculateStats = (): LeadStats => {
          const allLeads = [
            ...(chatLeads || []).map(l => ({ ...l, source: 'chat' })),
            ...(formLeads || []).map(l => ({ ...l, source: 'form' }))
          ]

          // Normalize status for consistent counting
          // chat: 'lead' → 'novo', 'lead_incomplete' → 'novo_incompleto'
          // form: 'novo' → 'novo', others already match
          return {
            total: allLeads.length,
            hoje: allLeads.filter(l => l.created_at.startsWith(today)).length,
            novos: allLeads.filter(l =>
              l.status === 'novo' || l.status === 'novo_incompleto' ||
              l.status === 'lead' || l.status === 'lead_incomplete'
            ).length,
            contatados: allLeads.filter(l => l.status === 'contatado').length,
            convertidos: allLeads.filter(l => l.status === 'convertido').length
          }
        }

        setStats(calculateStats())
      } catch (err) {
        console.error('useLeadStats error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  return { stats, isLoading }
}

import type { Database } from '@/types/supabase'
import type { UnifiedLead, UnifiedLeadStatus, UnifiedLeadSource } from '@/types/leads'

// Type aliases for cleaner code
type ContactLead = Database['public']['Tables']['contact_leads']['Row']
type Cliente = Database['public']['Tables']['clientes']['Row']

function mapStatus(source: UnifiedLeadSource, originalStatus: string | null): UnifiedLeadStatus {
  if (!originalStatus) return 'novo'

  // Chat IA status mapping
  if (source === 'chat') {
    if (originalStatus === 'lead_incomplete') return 'novo_incompleto'
    if (originalStatus === 'lead') return 'novo'
    return originalStatus as UnifiedLeadStatus
  }

  // Form status mapping (already uses our convention)
  return originalStatus as UnifiedLeadStatus
}

export function normalizeToUnifiedLead(
  source: UnifiedLeadSource,
  record: ContactLead | Cliente
): UnifiedLead {
  if (source === 'chat') {
    const cliente = record as Cliente
    return {
      id: cliente.id,
      source: 'chat',
      nome: cliente.nome,
      telefone: cliente.telefone,
      cidade: cliente.cidade,
      location_display: cliente.cidade || cliente.zip_code || '—',
      status: mapStatus('chat', cliente.status),
      mensagem: null,
      notas: cliente.notas_internas || null,
      created_at: cliente.created_at,
      contacted_at: cliente.contacted_at || null,
      data_retorno: cliente.data_retorno || null,
      deleted_at: cliente.deleted_at || null,
      original_record: cliente
    }
  }

  // Form source
  const lead = record as ContactLead
  return {
    id: lead.id,
    source: 'form',
    nome: lead.nome,
    telefone: lead.telefone,
    cidade: lead.cidade,
    location_display: lead.cidade || '—',
    status: mapStatus('form', lead.status),
    mensagem: lead.mensagem || null,
    notas: lead.notas || null,
    created_at: lead.created_at,
    contacted_at: lead.contacted_at || null,
    data_retorno: lead.data_retorno || null,
    deleted_at: lead.deleted_at || null,
    original_record: lead
  }
}

export function filterLeads(
  leads: UnifiedLead[],
  filters: { search: string; source: 'all' | 'chat' | 'form'; status: 'all' | UnifiedLeadStatus }
): UnifiedLead[] {
  return leads.filter(lead => {
    // Source filter
    if (filters.source !== 'all' && lead.source !== filters.source) return false

    // Status filter
    if (filters.status !== 'all' && lead.status !== filters.status) return false

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchName = lead.nome.toLowerCase().includes(searchLower)
      const matchPhone = lead.telefone.includes(searchLower)
      const matchCity = lead.cidade?.toLowerCase().includes(searchLower)
      const matchMessage = lead.mensagem?.toLowerCase().includes(searchLower)
      if (!matchName && !matchPhone && !matchCity && !matchMessage) return false
    }

    return true
  })
}

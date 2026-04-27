import { Database } from './supabase'

type ContactLead = Database['public']['Tables']['contact_leads']['Row']
type Cliente = Database['public']['Tables']['clientes']['Row']

export type UnifiedLeadSource = 'chat' | 'form'

export type UnifiedLeadStatus =
  | 'novo_incompleto'
  | 'novo'
  | 'contatado'
  | 'convertido'
  | 'descartado'
  | 'retorno_futuro'

export interface UnifiedLead {
  id: string
  source: UnifiedLeadSource
  nome: string
  telefone: string
  cidade: string | null
  location_display: string
  status: UnifiedLeadStatus
  mensagem: string | null
  notas: string | null
  created_at: string
  contacted_at: string | null
  data_retorno: string | null
  deleted_at: string | null
  original_record: ContactLead | Cliente
}

export interface LeadFilters {
  search: string
  source: 'all' | 'chat' | 'form'
  status: 'all' | UnifiedLeadStatus
}

export interface LeadStats {
  total: number
  hoje: number
  novos: number
  contatados: number
  convertidos: number
}

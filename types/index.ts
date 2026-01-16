import { Database } from './supabase'

// Atalhos para tipos de tabelas
// Nota: Esses tipos funcionarão corretamente apenas após gerar o types/supabase.ts real
export type Cliente = Database['public']['Tables']['clientes']['Row']
export type ClienteInsert = Database['public']['Tables']['clientes']['Insert']
export type ClienteUpdate = Database['public']['Tables']['clientes']['Update']

export type Agendamento = Database['public']['Tables']['agendamentos']['Row']
export type AgendamentoInsert = Database['public']['Tables']['agendamentos']['Insert']
export type AgendamentoUpdate = Database['public']['Tables']['agendamentos']['Update']

export type Recorrencia = Database['public']['Tables']['recorrencias']['Row']
export type Contrato = Database['public']['Tables']['contratos']['Row']
export type Financeiro = Database['public']['Tables']['financeiro']['Row']
export type MensagemChat = Database['public']['Tables']['mensagens_chat']['Row']
export type Feedback = Database['public']['Tables']['feedback']['Row']
export type Configuracao = Database['public']['Tables']['configuracoes']['Row']
export type AreaAtendida = Database['public']['Tables']['areas_atendidas']['Row']
export type ServicoTipo = Database['public']['Tables']['servicos_tipos']['Row']
export type Addon = Database['public']['Tables']['addons']['Row']
export type PrecoBase = Database['public']['Tables']['precos_base']['Row']

// Views
export type AgendaHoje = Database['public']['Views']['v_agenda_hoje']['Row']
export type DashboardStats = Database['public']['Views']['v_dashboard_stats']['Row']

// User Profile
export interface UserProfile {
    id: string
    full_name: string | null
    phone: string | null
    role: 'admin' | 'manager' | 'staff'
    avatar_url: string | null
    language: string
    theme: 'light' | 'dark' | 'system'
    email_notifications: boolean
    push_notifications: boolean
    sms_notifications: boolean
    notification_types: NotificationTypes
    last_login_at: string | null
    created_at: string
    updated_at: string
    email?: string // Campo virtual vindo do auth.users
}

export interface NotificationTypes {
    newLead: boolean
    newAppointment: boolean
    appointmentReminder: boolean
    paymentReceived: boolean
    lowRating: boolean
}

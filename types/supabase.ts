// Temporary Database type for build purposes
// This should be regenerated using `npm run db:generate` after migration
export type Database = {
  public: {
    Tables: {
      clientes: {
        Row: {
          id: string
          nome: string
          telefone?: string | null
          cidade?: string | null
          zip_code?: string | null
          status: string
          notas_internas?: string | null
          contacted_at?: string | null
          data_retorno?: string | null
          deleted_at?: string | null
          origem?: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          telefone?: string | null
          cidade?: string | null
          zip_code?: string | null
          status?: string
          notas_internas?: string | null
          contacted_at?: string | null
          data_retorno?: string | null
          deleted_at?: string | null
          origem?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          telefone?: string | null
          cidade?: string | null
          zip_code?: string | null
          status?: string
          notas_internas?: string | null
          contacted_at?: string | null
          data_retorno?: string | null
          deleted_at?: string | null
          origem?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      contact_leads: {
        Row: {
          id: string
          nome: string
          telefone: string
          cidade?: string | null
          mensagem?: string | null
          origem?: string | null
          pagina_origem?: string | null
          status: string
          cliente_id?: string | null
          notas?: string | null
          data_retorno?: string | null
          contacted_at?: string | null
          deleted_at?: string | null
          user_agent?: string | null
          ip_address?: string | null
          created_at: string
          updated_at?: string | null
        }
        Insert: {
          id?: string
          nome: string
          telefone: string
          cidade?: string | null
          mensagem?: string | null
          origem?: string | null
          pagina_origem?: string | null
          status?: string
          cliente_id?: string | null
          notas?: string | null
          data_retorno?: string | null
          contacted_at?: string | null
          deleted_at?: string | null
          user_agent?: string | null
          ip_address?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          nome?: string
          telefone?: string
          cidade?: string | null
          mensagem?: string | null
          origem?: string | null
          pagina_origem?: string | null
          status?: string
          cliente_id?: string | null
          notas?: string | null
          data_retorno?: string | null
          contacted_at?: string | null
          deleted_at?: string | null
          user_agent?: string | null
          ip_address?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      before_after: {
        Row: {
          id: string
          titulo: string
          imagem_antes: string
          imagem_depois: string
          tipo_servico?: string | null
          cidade?: string | null
          ordem: number
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          titulo: string
          imagem_antes: string
          imagem_depois: string
          tipo_servico?: string | null
          cidade?: string | null
          order?: number
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          titulo?: string
          imagem_antes?: string
          imagem_depois?: string
          tipo_servico?: string | null
          cidade?: string | null
          ordem?: number
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      agendamentos: {
        Row: {
          id: string
          cliente_id: string
          data: string
          servico_tipo: string
          duracao_minutos: number
          valor_base: number
          addons?: any[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cliente_id: string
          data: string
          servico_tipo: string
          duracao_minutos?: number
          valor_base?: number
          addons?: any[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cliente_id?: string
          data?: string
          servico_tipo?: string
          duracao_minutos?: number
          valor_base?: number
          addons?: any[] | null
          created_at?: string
          updated_at?: string
        }
      }
      recorrencias: {
        Row: {
          id: string
          cliente_id: string
          frequencia: string
          created_at: string
        }
        Insert: {
          id?: string
          cliente_id: string
          frequencia: string
          created_at?: string
        }
        Update: {
          id?: string
          cliente_id?: string
          frequencia?: string
          created_at?: string
        }
      }
      contratos: {
        Row: {
          id: string
          cliente_id: string
          created_at: string
        }
        Insert: {
          id?: string
          cliente_id: string
          created_at?: string
        }
        Update: {
          id?: string
          cliente_id?: string
          created_at?: string
        }
      }
      financeiro: {
        Row: {
          id: string
          created_at: string
        }
        Insert: {
          id?: string
          created_at?: string
        }
        Update: {
          id?: string
          created_at?: string
        }
      }
      mensagens_chat: {
        Row: {
          id: string
          created_at: string
        }
        Insert: {
          id?: string
          created_at?: string
        }
        Update: {
          id?: string
          created_at?: string
        }
      }
      feedback: {
        Row: {
          id: string
          created_at: string
        }
        Insert: {
          id?: string
          created_at?: string
        }
        Update: {
          id?: string
          created_at?: string
        }
      }
      configuracoes: {
        Row: {
          id: string
          created_at: string
        }
        Insert: {
          id?: string
          created_at?: string
        }
        Update: {
          id?: string
          created_at?: string
        }
      }
      areas_atendidas: {
        Row: {
          id: string
          created_at: string
        }
        Insert: {
          id?: string
          created_at?: string
        }
        Update: {
          id?: string
          created_at?: string
        }
      }
      servicos_tipos: {
        Row: {
          id: string
          created_at: string
        }
        Insert: {
          id?: string
          created_at?: string
        }
        Update: {
          id?: string
          created_at?: string
        }
      }
      addons: {
        Row: {
          id: string
          created_at: string
        }
        Insert: {
          id?: string
          created_at?: string
        }
        Update: {
          id?: string
          created_at?: string
        }
      }
      precos_base: {
        Row: {
          id: string
          created_at: string
        }
        Insert: {
          id?: string
          created_at?: string
        }
        Update: {
          id?: string
          created_at?: string
        }
      }
    }
    Views: {
      v_agenda_hoje: {
        Row: {
          id: string
        }
      }
      v_dashboard_stats: {
        Row: {
          id: string
        }
      }
    }
  }
}

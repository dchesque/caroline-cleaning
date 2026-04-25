export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      action_logs: {
        Row: {
          action_type: string
          created_at: string | null
          id: string
          params: Json | null
          result: Json | null
          session_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          id?: string
          params?: Json | null
          result?: Json | null
          session_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          id?: string
          params?: Json | null
          result?: Json | null
          session_id?: string | null
        }
        Relationships: []
      }
      addons: {
        Row: {
          ativo: boolean | null
          codigo: string
          created_at: string | null
          descricao: string | null
          id: string
          minutos_adicionais: number | null
          nome: string
          ordem: number | null
          preco: number
          tipo_cobranca: string | null
          unidade: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          codigo: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          minutos_adicionais?: number | null
          nome: string
          ordem?: number | null
          preco: number
          tipo_cobranca?: string | null
          unidade?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          codigo?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          minutos_adicionais?: number | null
          nome?: string
          ordem?: number | null
          preco?: number
          tipo_cobranca?: string | null
          unidade?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      agendamento_equipe: {
        Row: {
          agendamento_id: string
          created_at: string | null
          funcao: string | null
          id: string
          membro_id: string
        }
        Insert: {
          agendamento_id: string
          created_at?: string | null
          funcao?: string | null
          id?: string
          membro_id: string
        }
        Update: {
          agendamento_id?: string
          created_at?: string | null
          funcao?: string | null
          id?: string
          membro_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agendamento_equipe_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamento_equipe_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "v_agenda_hoje"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamento_equipe_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "v_agendamentos_com_equipe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamento_equipe_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "v_proximos_agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamento_equipe_membro_id_fkey"
            columns: ["membro_id"]
            isOneToOne: false
            referencedRelation: "equipe"
            referencedColumns: ["id"]
          },
        ]
      }
      agendamentos: {
        Row: {
          addons: Json | null
          canal_preferencia: string | null
          checklist: Json | null
          cliente_id: string
          confirmacao_enviada: boolean | null
          created_at: string | null
          data: string
          desconto_percentual: number | null
          duracao_minutos: number | null
          duracao_real_minutos: number | null
          e_recorrente: boolean | null
          equipe_id: string | null
          hora_chegada: string | null
          hora_saida: string | null
          horario_fim_estimado: string | null
          horario_inicio: string
          id: string
          lembrete_24h_enviado: boolean | null
          lembrete_30min_enviado: boolean | null
          motivo_cancelamento: string | null
          notas: string | null
          notas_internas: string | null
          origem: string | null
          reagendado_de: string | null
          reagendado_para: string | null
          recorrencia_id: string | null
          status: string | null
          tipo: string
          updated_at: string | null
          valor: number | null
          valor_addons: number | null
          valor_final: number | null
        }
        Insert: {
          addons?: Json | null
          canal_preferencia?: string | null
          checklist?: Json | null
          cliente_id: string
          confirmacao_enviada?: boolean | null
          created_at?: string | null
          data: string
          desconto_percentual?: number | null
          duracao_minutos?: number | null
          duracao_real_minutos?: number | null
          e_recorrente?: boolean | null
          equipe_id?: string | null
          hora_chegada?: string | null
          hora_saida?: string | null
          horario_fim_estimado?: string | null
          horario_inicio: string
          id?: string
          lembrete_24h_enviado?: boolean | null
          lembrete_30min_enviado?: boolean | null
          motivo_cancelamento?: string | null
          notas?: string | null
          notas_internas?: string | null
          origem?: string | null
          reagendado_de?: string | null
          reagendado_para?: string | null
          recorrencia_id?: string | null
          status?: string | null
          tipo: string
          updated_at?: string | null
          valor?: number | null
          valor_addons?: number | null
          valor_final?: number | null
        }
        Update: {
          addons?: Json | null
          canal_preferencia?: string | null
          checklist?: Json | null
          cliente_id?: string
          confirmacao_enviada?: boolean | null
          created_at?: string | null
          data?: string
          desconto_percentual?: number | null
          duracao_minutos?: number | null
          duracao_real_minutos?: number | null
          e_recorrente?: boolean | null
          equipe_id?: string | null
          hora_chegada?: string | null
          hora_saida?: string | null
          horario_fim_estimado?: string | null
          horario_inicio?: string
          id?: string
          lembrete_24h_enviado?: boolean | null
          lembrete_30min_enviado?: boolean | null
          motivo_cancelamento?: string | null
          notas?: string | null
          notas_internas?: string | null
          origem?: string | null
          reagendado_de?: string | null
          reagendado_para?: string | null
          recorrencia_id?: string | null
          status?: string | null
          tipo?: string
          updated_at?: string | null
          valor?: number | null
          valor_addons?: number | null
          valor_final?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "v_clientes_inativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "v_conversas_recentes"
            referencedColumns: ["cliente_id"]
          },
          {
            foreignKeyName: "agendamentos_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_reagendado_de_fkey"
            columns: ["reagendado_de"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_reagendado_de_fkey"
            columns: ["reagendado_de"]
            isOneToOne: false
            referencedRelation: "v_agenda_hoje"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_reagendado_de_fkey"
            columns: ["reagendado_de"]
            isOneToOne: false
            referencedRelation: "v_agendamentos_com_equipe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_reagendado_de_fkey"
            columns: ["reagendado_de"]
            isOneToOne: false
            referencedRelation: "v_proximos_agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_recorrencia_id_fkey"
            columns: ["recorrencia_id"]
            isOneToOne: false
            referencedRelation: "recorrencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_recorrencia_id_fkey"
            columns: ["recorrencia_id"]
            isOneToOne: false
            referencedRelation: "v_recorrencias_expandidas"
            referencedColumns: ["id"]
          },
        ]
      }
      areas_atendidas: {
        Row: {
          ativo: boolean | null
          cidade: string
          created_at: string | null
          estado: string
          id: string
          nome: string
          ordem: number | null
          taxa_deslocamento: number | null
          tempo_deslocamento_minutos: number | null
          updated_at: string | null
          zip_codes: string[] | null
        }
        Insert: {
          ativo?: boolean | null
          cidade: string
          created_at?: string | null
          estado?: string
          id?: string
          nome: string
          ordem?: number | null
          taxa_deslocamento?: number | null
          tempo_deslocamento_minutos?: number | null
          updated_at?: string | null
          zip_codes?: string[] | null
        }
        Update: {
          ativo?: boolean | null
          cidade?: string
          created_at?: string | null
          estado?: string
          id?: string
          nome?: string
          ordem?: number | null
          taxa_deslocamento?: number | null
          tempo_deslocamento_minutos?: number | null
          updated_at?: string | null
          zip_codes?: string[] | null
        }
        Relationships: []
      }
      before_after: {
        Row: {
          ativo: boolean
          cidade: string | null
          created_at: string
          id: string
          imagem_antes: string
          imagem_depois: string
          ordem: number
          tipo_servico: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cidade?: string | null
          created_at?: string
          id?: string
          imagem_antes: string
          imagem_depois: string
          ordem?: number
          tipo_servico?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cidade?: string | null
          created_at?: string
          id?: string
          imagem_antes?: string
          imagem_depois?: string
          ordem?: number
          tipo_servico?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      callbacks: {
        Row: {
          atendido_em: string | null
          atendido_por: string | null
          cliente_id: string | null
          created_at: string | null
          horario_preferido: string | null
          id: string
          notas: string | null
          session_id: string | null
          status: string | null
          telefone: string | null
        }
        Insert: {
          atendido_em?: string | null
          atendido_por?: string | null
          cliente_id?: string | null
          created_at?: string | null
          horario_preferido?: string | null
          id?: string
          notas?: string | null
          session_id?: string | null
          status?: string | null
          telefone?: string | null
        }
        Update: {
          atendido_em?: string | null
          atendido_por?: string | null
          cliente_id?: string | null
          created_at?: string | null
          horario_preferido?: string | null
          id?: string
          notas?: string | null
          session_id?: string | null
          status?: string | null
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "callbacks_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "callbacks_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "v_clientes_inativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "callbacks_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "v_conversas_recentes"
            referencedColumns: ["cliente_id"]
          },
        ]
      }
      chat_logs: {
        Row: {
          cliente_id: string | null
          context_snapshot: Json | null
          created_at: string | null
          direction: string
          errors: Json | null
          extracted_data: Json | null
          handlers_executed: Json | null
          id: string
          llm_calls: Json | null
          message_content: string
          response_time_ms: number | null
          session_id: string
          state_after: string | null
          state_before: string | null
          tool_calls: Json | null
        }
        Insert: {
          cliente_id?: string | null
          context_snapshot?: Json | null
          created_at?: string | null
          direction: string
          errors?: Json | null
          extracted_data?: Json | null
          handlers_executed?: Json | null
          id?: string
          llm_calls?: Json | null
          message_content: string
          response_time_ms?: number | null
          session_id: string
          state_after?: string | null
          state_before?: string | null
          tool_calls?: Json | null
        }
        Update: {
          cliente_id?: string | null
          context_snapshot?: Json | null
          created_at?: string | null
          direction?: string
          errors?: Json | null
          extracted_data?: Json | null
          handlers_executed?: Json | null
          id?: string
          llm_calls?: Json | null
          message_content?: string
          response_time_ms?: number | null
          session_id?: string
          state_after?: string | null
          state_before?: string | null
          tool_calls?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_logs_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_logs_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "v_clientes_inativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_logs_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "v_conversas_recentes"
            referencedColumns: ["cliente_id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          cliente_id: string | null
          contexto: Json | null
          created_at: string | null
          id: string
          last_activity: string | null
          last_intent: string | null
          source: string | null
          status: string | null
        }
        Insert: {
          cliente_id?: string | null
          contexto?: Json | null
          created_at?: string | null
          id: string
          last_activity?: string | null
          last_intent?: string | null
          source?: string | null
          status?: string | null
        }
        Update: {
          cliente_id?: string | null
          contexto?: Json | null
          created_at?: string | null
          id?: string
          last_activity?: string | null
          last_intent?: string | null
          source?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_sessions_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "v_clientes_inativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_sessions_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "v_conversas_recentes"
            referencedColumns: ["cliente_id"]
          },
        ]
      }
      clientes: {
        Row: {
          acesso_codigo: string | null
          acesso_instrucoes: string | null
          acesso_tipo: string | null
          bathrooms: number | null
          bedrooms: number | null
          canal_preferencia: string | null
          cidade: string | null
          contrato_id: string | null
          created_at: string | null
          data_aniversario: string | null
          data_cancelamento: string | null
          data_primeiro_contato: string | null
          data_primeiro_servico: string | null
          dia_preferido: string | null
          email: string | null
          endereco_completo: string | null
          endereco_linha2: string | null
          estado: string | null
          frequencia: string | null
          horario_preferido: string | null
          id: string
          latitude: number | null
          longitude: number | null
          motivo_cancelamento: string | null
          nome: string
          notas: string | null
          notas_internas: string | null
          origem: string | null
          origem_detalhe: string | null
          pets_detalhes: string | null
          referido_por: string | null
          session_id_origem: string | null
          square_feet: number | null
          status: string | null
          telefone: string
          tem_pets: boolean | null
          tipo_residencia: string | null
          tipo_servico_padrao: string | null
          updated_at: string | null
          valor_servico: number | null
          zip_code: string | null
        }
        Insert: {
          acesso_codigo?: string | null
          acesso_instrucoes?: string | null
          acesso_tipo?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          canal_preferencia?: string | null
          cidade?: string | null
          contrato_id?: string | null
          created_at?: string | null
          data_aniversario?: string | null
          data_cancelamento?: string | null
          data_primeiro_contato?: string | null
          data_primeiro_servico?: string | null
          dia_preferido?: string | null
          email?: string | null
          endereco_completo?: string | null
          endereco_linha2?: string | null
          estado?: string | null
          frequencia?: string | null
          horario_preferido?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          motivo_cancelamento?: string | null
          nome: string
          notas?: string | null
          notas_internas?: string | null
          origem?: string | null
          origem_detalhe?: string | null
          pets_detalhes?: string | null
          referido_por?: string | null
          session_id_origem?: string | null
          square_feet?: number | null
          status?: string | null
          telefone: string
          tem_pets?: boolean | null
          tipo_residencia?: string | null
          tipo_servico_padrao?: string | null
          updated_at?: string | null
          valor_servico?: number | null
          zip_code?: string | null
        }
        Update: {
          acesso_codigo?: string | null
          acesso_instrucoes?: string | null
          acesso_tipo?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          canal_preferencia?: string | null
          cidade?: string | null
          contrato_id?: string | null
          created_at?: string | null
          data_aniversario?: string | null
          data_cancelamento?: string | null
          data_primeiro_contato?: string | null
          data_primeiro_servico?: string | null
          dia_preferido?: string | null
          email?: string | null
          endereco_completo?: string | null
          endereco_linha2?: string | null
          estado?: string | null
          frequencia?: string | null
          horario_preferido?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          motivo_cancelamento?: string | null
          nome?: string
          notas?: string | null
          notas_internas?: string | null
          origem?: string | null
          origem_detalhe?: string | null
          pets_detalhes?: string | null
          referido_por?: string | null
          session_id_origem?: string | null
          square_feet?: number | null
          status?: string | null
          telefone?: string
          tem_pets?: boolean | null
          tipo_residencia?: string | null
          tipo_servico_padrao?: string | null
          updated_at?: string | null
          valor_servico?: number | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_referido_por_fkey"
            columns: ["referido_por"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_referido_por_fkey"
            columns: ["referido_por"]
            isOneToOne: false
            referencedRelation: "v_clientes_inativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_referido_por_fkey"
            columns: ["referido_por"]
            isOneToOne: false
            referencedRelation: "v_conversas_recentes"
            referencedColumns: ["cliente_id"]
          },
          {
            foreignKeyName: "fk_clientes_contrato"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes: {
        Row: {
          categoria: string | null
          chave: string
          created_at: string | null
          descricao: string | null
          grupo: string | null
          id: string
          updated_at: string | null
          valor: Json
        }
        Insert: {
          categoria?: string | null
          chave: string
          created_at?: string | null
          descricao?: string | null
          grupo?: string | null
          id?: string
          updated_at?: string | null
          valor: Json
        }
        Update: {
          categoria?: string | null
          chave?: string
          created_at?: string | null
          descricao?: string | null
          grupo?: string | null
          id?: string
          updated_at?: string | null
          valor?: Json
        }
        Relationships: []
      }
      contact_leads: {
        Row: {
          cidade: string | null
          cliente_id: string | null
          contacted_at: string | null
          contacted_by: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          nome: string
          notas: string | null
          origem: string | null
          pagina_origem: string | null
          status: string | null
          telefone: string
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          cidade?: string | null
          cliente_id?: string | null
          contacted_at?: string | null
          contacted_by?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          nome: string
          notas?: string | null
          origem?: string | null
          pagina_origem?: string | null
          status?: string | null
          telefone: string
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          cidade?: string | null
          cliente_id?: string | null
          contacted_at?: string | null
          contacted_by?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          nome?: string
          notas?: string | null
          origem?: string | null
          pagina_origem?: string | null
          status?: string | null
          telefone?: string
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      contratos: {
        Row: {
          assinatura_digital: string | null
          cliente_id: string
          created_at: string | null
          data_assinatura: string | null
          data_fim: string | null
          data_inicio: string
          desconto_percentual: number | null
          documento_path: string | null
          documento_url: string | null
          frequencia: string | null
          id: string
          ip_assinatura: string | null
          numero: string | null
          renovacao_automatica: boolean | null
          status: string | null
          tipo_servico: string
          updated_at: string | null
          valor_acordado: number
        }
        Insert: {
          assinatura_digital?: string | null
          cliente_id: string
          created_at?: string | null
          data_assinatura?: string | null
          data_fim?: string | null
          data_inicio: string
          desconto_percentual?: number | null
          documento_path?: string | null
          documento_url?: string | null
          frequencia?: string | null
          id?: string
          ip_assinatura?: string | null
          numero?: string | null
          renovacao_automatica?: boolean | null
          status?: string | null
          tipo_servico: string
          updated_at?: string | null
          valor_acordado: number
        }
        Update: {
          assinatura_digital?: string | null
          cliente_id?: string
          created_at?: string | null
          data_assinatura?: string | null
          data_fim?: string | null
          data_inicio?: string
          desconto_percentual?: number | null
          documento_path?: string | null
          documento_url?: string | null
          frequencia?: string | null
          id?: string
          ip_assinatura?: string | null
          numero?: string | null
          renovacao_automatica?: boolean | null
          status?: string | null
          tipo_servico?: string
          updated_at?: string | null
          valor_acordado?: number
        }
        Relationships: [
          {
            foreignKeyName: "contratos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "v_clientes_inativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "v_conversas_recentes"
            referencedColumns: ["cliente_id"]
          },
        ]
      }
      equipe: {
        Row: {
          ativo: boolean | null
          cargo: string | null
          cor: string | null
          created_at: string | null
          data_admissao: string | null
          email: string | null
          foto_url: string | null
          id: string
          nome: string
          notas: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          cargo?: string | null
          cor?: string | null
          created_at?: string | null
          data_admissao?: string | null
          email?: string | null
          foto_url?: string | null
          id?: string
          nome: string
          notas?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          cargo?: string | null
          cor?: string | null
          created_at?: string | null
          data_admissao?: string | null
          email?: string | null
          foto_url?: string | null
          id?: string
          nome?: string
          notas?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      equipe_membros: {
        Row: {
          created_at: string | null
          equipe_id: string
          id: string
          membro_id: string
        }
        Insert: {
          created_at?: string | null
          equipe_id: string
          id?: string
          membro_id: string
        }
        Update: {
          created_at?: string | null
          equipe_id?: string
          id?: string
          membro_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipe_membros_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipe_membros_membro_id_fkey"
            columns: ["membro_id"]
            isOneToOne: false
            referencedRelation: "equipe"
            referencedColumns: ["id"]
          },
        ]
      }
      equipes: {
        Row: {
          ativo: boolean | null
          cor: string | null
          created_at: string | null
          id: string
          nome: string
          notas: string | null
          tipo: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string | null
          id?: string
          nome: string
          notas?: string | null
          tipo?: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string | null
          id?: string
          nome?: string
          notas?: string | null
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          acao_tomada: string | null
          agendamento_id: string
          cliente_id: string
          comentario: string | null
          created_at: string | null
          google_review_deixado: boolean | null
          google_review_solicitado: boolean | null
          id: string
          origem: string | null
          rating: number
          rating_comunicacao: number | null
          rating_pontualidade: number | null
          rating_qualidade: number | null
          respondido_em: string | null
        }
        Insert: {
          acao_tomada?: string | null
          agendamento_id: string
          cliente_id: string
          comentario?: string | null
          created_at?: string | null
          google_review_deixado?: boolean | null
          google_review_solicitado?: boolean | null
          id?: string
          origem?: string | null
          rating: number
          rating_comunicacao?: number | null
          rating_pontualidade?: number | null
          rating_qualidade?: number | null
          respondido_em?: string | null
        }
        Update: {
          acao_tomada?: string | null
          agendamento_id?: string
          cliente_id?: string
          comentario?: string | null
          created_at?: string | null
          google_review_deixado?: boolean | null
          google_review_solicitado?: boolean | null
          id?: string
          origem?: string | null
          rating?: number
          rating_comunicacao?: number | null
          rating_pontualidade?: number | null
          rating_qualidade?: number | null
          respondido_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "v_agenda_hoje"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "v_agendamentos_com_equipe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "v_proximos_agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "v_clientes_inativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "v_conversas_recentes"
            referencedColumns: ["cliente_id"]
          },
        ]
      }
      financeiro: {
        Row: {
          agendamento_id: string | null
          categoria: string
          cliente_id: string | null
          contrato_id: string | null
          created_at: string | null
          data: string
          data_pagamento: string | null
          descricao: string | null
          forma_pagamento: string | null
          id: string
          referencia_externa: string | null
          status: string | null
          subcategoria: string | null
          tipo: string
          updated_at: string | null
          valor: number
        }
        Insert: {
          agendamento_id?: string | null
          categoria: string
          cliente_id?: string | null
          contrato_id?: string | null
          created_at?: string | null
          data?: string
          data_pagamento?: string | null
          descricao?: string | null
          forma_pagamento?: string | null
          id?: string
          referencia_externa?: string | null
          status?: string | null
          subcategoria?: string | null
          tipo: string
          updated_at?: string | null
          valor: number
        }
        Update: {
          agendamento_id?: string | null
          categoria?: string
          cliente_id?: string | null
          contrato_id?: string | null
          created_at?: string | null
          data?: string
          data_pagamento?: string | null
          descricao?: string | null
          forma_pagamento?: string | null
          id?: string
          referencia_externa?: string | null
          status?: string | null
          subcategoria?: string | null
          tipo?: string
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "v_agenda_hoje"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "v_agendamentos_com_equipe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "v_proximos_agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "v_clientes_inativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "v_conversas_recentes"
            referencedColumns: ["cliente_id"]
          },
          {
            foreignKeyName: "financeiro_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      financeiro_categorias: {
        Row: {
          ativo: boolean | null
          cor: string | null
          created_at: string | null
          descricao: string | null
          icone: string | null
          id: string
          nome: string
          tipo: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string | null
          descricao?: string | null
          icone?: string | null
          id?: string
          nome: string
          tipo: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string | null
          descricao?: string | null
          icone?: string | null
          id?: string
          nome?: string
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      mensagens_chat: {
        Row: {
          cliente_id: string | null
          confidence: number | null
          content: string
          created_at: string | null
          entities: Json | null
          execution_logs: string | null
          id: string
          intent: string | null
          intent_confidence: number | null
          intent_detected: string | null
          ip_address: string | null
          metadata: Json | null
          role: string
          session_id: string
          source: string | null
          tool_calls: Json | null
          tool_results: Json | null
          user_agent: string | null
        }
        Insert: {
          cliente_id?: string | null
          confidence?: number | null
          content: string
          created_at?: string | null
          entities?: Json | null
          execution_logs?: string | null
          id?: string
          intent?: string | null
          intent_confidence?: number | null
          intent_detected?: string | null
          ip_address?: string | null
          metadata?: Json | null
          role: string
          session_id: string
          source?: string | null
          tool_calls?: Json | null
          tool_results?: Json | null
          user_agent?: string | null
        }
        Update: {
          cliente_id?: string | null
          confidence?: number | null
          content?: string
          created_at?: string | null
          entities?: Json | null
          execution_logs?: string | null
          id?: string
          intent?: string | null
          intent_confidence?: number | null
          intent_detected?: string | null
          ip_address?: string | null
          metadata?: Json | null
          role?: string
          session_id?: string
          source?: string | null
          tool_calls?: Json | null
          tool_results?: Json | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_chat_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_chat_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "v_clientes_inativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_chat_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "v_conversas_recentes"
            referencedColumns: ["cliente_id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          canal: string
          created_at: string | null
          dados: Json | null
          destinatario: string
          enviado_em: string | null
          erro: string | null
          id: string
          metadata: Json | null
          status: string | null
          template: string | null
        }
        Insert: {
          canal: string
          created_at?: string | null
          dados?: Json | null
          destinatario: string
          enviado_em?: string | null
          erro?: string | null
          id?: string
          metadata?: Json | null
          status?: string | null
          template?: string | null
        }
        Update: {
          canal?: string
          created_at?: string | null
          dados?: Json | null
          destinatario?: string
          enviado_em?: string | null
          erro?: string | null
          id?: string
          metadata?: Json | null
          status?: string | null
          template?: string | null
        }
        Relationships: []
      }
      orcamentos: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          detalhes: Json | null
          expires_at: string | null
          id: string
          session_id: string | null
          status: string | null
          tipo_servico: string | null
          valor_estimado: number | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          detalhes?: Json | null
          expires_at?: string | null
          id?: string
          session_id?: string | null
          status?: string | null
          tipo_servico?: string | null
          valor_estimado?: number | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          detalhes?: Json | null
          expires_at?: string | null
          id?: string
          session_id?: string | null
          status?: string | null
          tipo_servico?: string | null
          valor_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "v_clientes_inativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "v_conversas_recentes"
            referencedColumns: ["cliente_id"]
          },
        ]
      }
      precos_base: {
        Row: {
          bathrooms: number
          bedrooms: number
          created_at: string | null
          duracao_minutos: number | null
          id: string
          preco_maximo: number
          preco_minimo: number
          updated_at: string | null
        }
        Insert: {
          bathrooms: number
          bedrooms: number
          created_at?: string | null
          duracao_minutos?: number | null
          id?: string
          preco_maximo: number
          preco_minimo: number
          updated_at?: string | null
        }
        Update: {
          bathrooms?: number
          bedrooms?: number
          created_at?: string | null
          duracao_minutos?: number | null
          id?: string
          preco_maximo?: number
          preco_minimo?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      pricing_config: {
        Row: {
          badge: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          notes: string | null
          price_max: number
          price_min: number
          price_unit: string | null
          service_name: string
          service_type: string
          updated_at: string | null
        }
        Insert: {
          badge?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          price_max: number
          price_min: number
          price_unit?: string | null
          service_name: string
          service_type: string
          updated_at?: string | null
        }
        Update: {
          badge?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          price_max?: number
          price_min?: number
          price_unit?: string | null
          service_name?: string
          service_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      recorrencias: {
        Row: {
          addons_selecionados: string[] | null
          ativo: boolean | null
          cliente_id: string
          created_at: string | null
          data_fim: string | null
          data_inicio: string
          data_pausa: string | null
          dia_preferido: string
          dias_semana: string[] | null
          duracao_minutos: number | null
          frequencia: string
          horario: string
          id: string
          motivo_pausa: string | null
          proximo_agendamento: string | null
          servicos_por_dia: Json | null
          tipo_servico: string
          total_agendamentos: number | null
          ultimo_agendamento: string | null
          updated_at: string | null
          valor: number
        }
        Insert: {
          addons_selecionados?: string[] | null
          ativo?: boolean | null
          cliente_id: string
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string
          data_pausa?: string | null
          dia_preferido: string
          dias_semana?: string[] | null
          duracao_minutos?: number | null
          frequencia: string
          horario: string
          id?: string
          motivo_pausa?: string | null
          proximo_agendamento?: string | null
          servicos_por_dia?: Json | null
          tipo_servico?: string
          total_agendamentos?: number | null
          ultimo_agendamento?: string | null
          updated_at?: string | null
          valor: number
        }
        Update: {
          addons_selecionados?: string[] | null
          ativo?: boolean | null
          cliente_id?: string
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string
          data_pausa?: string | null
          dia_preferido?: string
          dias_semana?: string[] | null
          duracao_minutos?: number | null
          frequencia?: string
          horario?: string
          id?: string
          motivo_pausa?: string | null
          proximo_agendamento?: string | null
          servicos_por_dia?: Json | null
          tipo_servico?: string
          total_agendamentos?: number | null
          ultimo_agendamento?: string | null
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "recorrencias_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recorrencias_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "v_clientes_inativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recorrencias_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "v_conversas_recentes"
            referencedColumns: ["cliente_id"]
          },
        ]
      }
      servicos_tipos: {
        Row: {
          ativo: boolean | null
          codigo: string
          cor: string | null
          created_at: string | null
          descricao: string | null
          disponivel_agendamento_online: boolean | null
          duracao_base_minutos: number | null
          icone: string | null
          id: string
          multiplicador_preco: number | null
          nome: string
          ordem: number | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          codigo: string
          cor?: string | null
          created_at?: string | null
          descricao?: string | null
          disponivel_agendamento_online?: boolean | null
          duracao_base_minutos?: number | null
          icone?: string | null
          id?: string
          multiplicador_preco?: number | null
          nome: string
          ordem?: number | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          codigo?: string
          cor?: string | null
          created_at?: string | null
          descricao?: string | null
          disponivel_agendamento_online?: boolean | null
          duracao_base_minutos?: number | null
          icone?: string | null
          id?: string
          multiplicador_preco?: number | null
          nome?: string
          ordem?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sistema_heartbeat: {
        Row: {
          id: number
          observacao: string | null
          origem: string | null
          ultimo_ping: string | null
        }
        Insert: {
          id?: number
          observacao?: string | null
          origem?: string | null
          ultimo_ping?: string | null
        }
        Update: {
          id?: number
          observacao?: string | null
          origem?: string | null
          ultimo_ping?: string | null
        }
        Relationships: []
      }
      tracking_events: {
        Row: {
          client_id: string | null
          created_at: string | null
          custom_data: Json | null
          event_id: string | null
          event_name: string
          fbc: string | null
          fbp: string | null
          id: string
          ip_address: string | null
          meta_attempts: number | null
          meta_error: string | null
          meta_fbtrace_id: string | null
          meta_http_status: number | null
          meta_response: Json | null
          page_url: string | null
          referrer: string | null
          sent_to_google: boolean | null
          sent_to_meta: boolean | null
          sent_to_tiktok: boolean | null
          session_id: string | null
          updated_at: string | null
          user_agent: string | null
          user_email_hash: string | null
          user_phone_hash: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          custom_data?: Json | null
          event_id?: string | null
          event_name: string
          fbc?: string | null
          fbp?: string | null
          id?: string
          ip_address?: string | null
          meta_attempts?: number | null
          meta_error?: string | null
          meta_fbtrace_id?: string | null
          meta_http_status?: number | null
          meta_response?: Json | null
          page_url?: string | null
          referrer?: string | null
          sent_to_google?: boolean | null
          sent_to_meta?: boolean | null
          sent_to_tiktok?: boolean | null
          session_id?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_email_hash?: string | null
          user_phone_hash?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          custom_data?: Json | null
          event_id?: string | null
          event_name?: string
          fbc?: string | null
          fbp?: string | null
          id?: string
          ip_address?: string | null
          meta_attempts?: number | null
          meta_error?: string | null
          meta_fbtrace_id?: string | null
          meta_http_status?: number | null
          meta_response?: Json | null
          page_url?: string | null
          referrer?: string | null
          sent_to_google?: boolean | null
          sent_to_meta?: boolean | null
          sent_to_tiktok?: boolean | null
          session_id?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_email_hash?: string | null
          user_phone_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracking_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracking_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_clientes_inativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracking_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_conversas_recentes"
            referencedColumns: ["cliente_id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email_notifications: boolean | null
          full_name: string | null
          id: string
          language: string | null
          last_login_at: string | null
          notification_types: Json | null
          phone: string | null
          push_notifications: boolean | null
          role: string | null
          sms_notifications: boolean | null
          theme: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email_notifications?: boolean | null
          full_name?: string | null
          id: string
          language?: string | null
          last_login_at?: string | null
          notification_types?: Json | null
          phone?: string | null
          push_notifications?: boolean | null
          role?: string | null
          sms_notifications?: boolean | null
          theme?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email_notifications?: boolean | null
          full_name?: string | null
          id?: string
          language?: string | null
          last_login_at?: string | null
          notification_types?: Json | null
          phone?: string | null
          push_notifications?: boolean | null
          role?: string | null
          sms_notifications?: boolean | null
          theme?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      contact_leads_stats: {
        Row: {
          contatados: number | null
          convertidos: number | null
          descartados: number | null
          hoje: number | null
          novos: number | null
          total: number | null
          ultimos_30_dias: number | null
          ultimos_7_dias: number | null
        }
        Relationships: []
      }
      v_agenda_hoje: {
        Row: {
          cliente_endereco: string | null
          cliente_id: string | null
          cliente_nome: string | null
          cliente_telefone: string | null
          data: string | null
          duracao_minutos: number | null
          horario_fim_estimado: string | null
          horario_inicio: string | null
          id: string | null
          notas: string | null
          status: string | null
          tipo: string | null
          valor: number | null
          valor_final: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "v_clientes_inativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "v_conversas_recentes"
            referencedColumns: ["cliente_id"]
          },
        ]
      }
      v_agendamentos_com_equipe: {
        Row: {
          addons: Json | null
          checklist: Json | null
          cliente_endereco: string | null
          cliente_id: string | null
          cliente_nome: string | null
          cliente_telefone: string | null
          confirmacao_enviada: boolean | null
          created_at: string | null
          data: string | null
          desconto_percentual: number | null
          duracao_minutos: number | null
          duracao_real_minutos: number | null
          e_recorrente: boolean | null
          equipe: Json | null
          hora_chegada: string | null
          hora_saida: string | null
          horario_fim_estimado: string | null
          horario_inicio: string | null
          id: string | null
          lembrete_24h_enviado: boolean | null
          lembrete_30min_enviado: boolean | null
          motivo_cancelamento: string | null
          notas: string | null
          notas_internas: string | null
          reagendado_de: string | null
          reagendado_para: string | null
          recorrencia_id: string | null
          status: string | null
          tipo: string | null
          updated_at: string | null
          valor: number | null
          valor_addons: number | null
          valor_final: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "v_clientes_inativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "v_conversas_recentes"
            referencedColumns: ["cliente_id"]
          },
          {
            foreignKeyName: "agendamentos_reagendado_de_fkey"
            columns: ["reagendado_de"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_reagendado_de_fkey"
            columns: ["reagendado_de"]
            isOneToOne: false
            referencedRelation: "v_agenda_hoje"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_reagendado_de_fkey"
            columns: ["reagendado_de"]
            isOneToOne: false
            referencedRelation: "v_agendamentos_com_equipe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_reagendado_de_fkey"
            columns: ["reagendado_de"]
            isOneToOne: false
            referencedRelation: "v_proximos_agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_recorrencia_id_fkey"
            columns: ["recorrencia_id"]
            isOneToOne: false
            referencedRelation: "recorrencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_recorrencia_id_fkey"
            columns: ["recorrencia_id"]
            isOneToOne: false
            referencedRelation: "v_recorrencias_expandidas"
            referencedColumns: ["id"]
          },
        ]
      }
      v_clientes_inativos: {
        Row: {
          data_primeiro_contato: string | null
          email: string | null
          id: string | null
          nome: string | null
          status: string | null
          telefone: string | null
          ultimo_agendamento: string | null
        }
        Relationships: []
      }
      v_configuracoes_por_grupo: {
        Row: {
          categoria: string | null
          configs: Json | null
          grupo: string | null
        }
        Relationships: []
      }
      v_conversas_recentes: {
        Row: {
          cliente_id: string | null
          cliente_nome: string | null
          cliente_telefone: string | null
          contexto: Json | null
          last_activity: string | null
          session_id: string | null
          source: string | null
          status: string | null
          total_mensagens: number | null
          ultima_mensagem: string | null
          ultima_mensagem_role: string | null
        }
        Relationships: []
      }
      v_dashboard_stats: {
        Row: {
          agendamentos_hoje: number | null
          clientes_ativos: number | null
          confirmados_hoje: number | null
          novos_leads_semana: number | null
          rating_medio: number | null
          receita_mes: number | null
          receita_mes_anterior: number | null
        }
        Relationships: []
      }
      v_proximos_agendamentos: {
        Row: {
          cliente_id: string | null
          cliente_nome: string | null
          cliente_telefone: string | null
          data: string | null
          horario_inicio: string | null
          id: string | null
          status: string | null
          tipo: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "v_clientes_inativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "v_conversas_recentes"
            referencedColumns: ["cliente_id"]
          },
        ]
      }
      v_recorrencias_expandidas: {
        Row: {
          ativo: boolean | null
          cliente_endereco: string | null
          cliente_id: string | null
          cliente_nome: string | null
          cliente_telefone: string | null
          dia_preferido: string | null
          dias_semana: string[] | null
          frequencia: string | null
          horario: string | null
          id: string | null
          proximo_agendamento: string | null
          tipo_servico: string | null
          total_agendamentos: number | null
          valor: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recorrencias_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recorrencias_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "v_clientes_inativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recorrencias_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "v_conversas_recentes"
            referencedColumns: ["cliente_id"]
          },
        ]
      }
      v_resumo_mensal: {
        Row: {
          cancelados: number | null
          concluidos: number | null
          mes: string | null
          receita_total: number | null
          total_agendamentos: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_next_recurrence: {
        Args: {
          p_data_base?: string
          p_dia_preferido: string
          p_frequencia: string
        }
        Returns: string
      }
      calculate_service_price: {
        Args: {
          p_bathrooms: number
          p_bedrooms: number
          p_tipo_servico?: string
        }
        Returns: number
      }
      check_zip_code_coverage: {
        Args: { p_zip_code: string }
        Returns: {
          area_id: string
          area_nome: string
          taxa_deslocamento: number
          tempo_deslocamento: number
        }[]
      }
      get_available_slots: {
        Args: {
          p_data: string
          p_duracao_minutos?: number
          p_equipe_id?: string
        }
        Returns: {
          disponivel: boolean
          slot_fim: string
          slot_inicio: string
        }[]
      }
      get_client_stats: {
        Args: { p_cliente_id: string }
        Returns: {
          agendamentos_concluidos: number
          proximo_servico: string
          rating_medio: number
          total_agendamentos: number
          total_gasto: number
          ultimo_servico: string
        }[]
      }
      get_configs_by_grupo: {
        Args: { p_grupo: string }
        Returns: {
          chave: string
          valor: Json
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

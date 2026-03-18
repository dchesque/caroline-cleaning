# FLOWCHARTS - Chesque PREMIUM CLEANING

**Versão:** 1.0  
**Data:** Dezembro 2024  
**Referência:** PRD v5.0, Schema Supabase, Rotas e Telas

---

## ÍNDICE

- [1. Arquitetura Geral do Sistema](#1-arquitetura-geral-do-sistema)
- [2. Jornada do Novo Lead](#2-jornada-do-novo-lead)
- [3. Fluxo do Chat (Carol IA)](#3-fluxo-do-chat-carol-ia)
- [4. Fluxo de Agendamento](#4-fluxo-de-agendamento)
- [5. Jornada do Cliente Recorrente](#5-jornada-do-cliente-recorrente)
- [6. Fluxo de Notificações](#6-fluxo-de-notificações)
- [7. Fluxo Financeiro](#7-fluxo-financeiro)
- [8. Estados do Cliente](#8-estados-do-cliente)
- [9. Estados do Agendamento](#9-estados-do-agendamento)
- [10. Diagrama de Entidades (ER)](#10-diagrama-de-entidades-er)
- [11. Fluxo de Navegação (Frontend)](#11-fluxo-de-navegação-frontend)
- [12. Fluxo de Autenticação](#12-fluxo-de-autenticação)
- [13. Carol IA - AI Agent Tools](#13-carol-ia---ai-agent-tools)
- [14. Fluxo de Recorrência](#14-fluxo-de-recorrência)
- [15. Fluxo de Feedback](#15-fluxo-de-feedback)

---

## 1. ARQUITETURA GERAL DO SISTEMA

```mermaid
flowchart TB
    subgraph Cliente["👤 CLIENTE"]
        LP[Landing Page]
        CW[Chat Widget]
        CF[Chat Fullscreen]
    end

    subgraph Frontend["🖥️ NEXT.JS 15"]
        direction TB
        PUB[Rotas Públicas]
        ADM[Painel Admin]
        API[API Routes]
    end

    subgraph Backend["⚙️ N8N"]
        direction TB
        CAROL[Carol AI Agent]
        TOOLS[Tools]
        WORKFLOWS[Workflows Automação]
    end

    subgraph Database["🗄️ SUPABASE"]
        direction TB
        DB[(PostgreSQL)]
        AUTH[Auth]
        STORAGE[Storage]
        RT[Realtime]
    end

    subgraph External["🌐 SERVIÇOS EXTERNOS"]
        TWILIO[Twilio SMS]
        RESEND[Resend Email]
        OPENAI[OpenAI/Claude]
    end

    Cliente --> Frontend
    Frontend <--> |Webhook| Backend
    Frontend <--> |API REST| Database
    Backend <--> Database
    Backend --> External
    
    LP --> CW
    LP --> CF
    CW --> API
    CF --> API
    API --> |POST /api/chat| CAROL
    CAROL --> TOOLS
    TOOLS --> DB
    WORKFLOWS --> TWILIO
    WORKFLOWS --> RESEND
    CAROL --> OPENAI
```

---

## 2. JORNADA DO NOVO LEAD

```mermaid
flowchart TD
    START((🎯 Início)) --> ADS[Cliente vê anúncio<br/>Facebook/Google]
    ADS --> LP[Acessa Landing Page]
    LP --> CTA{Clica no CTA<br/>'Chat with Carol'}
    
    CTA -->|Sim| CHAT[Abre Chat]
    CTA -->|Não| SCROLL[Continua navegando]
    SCROLL --> CTA
    
    CHAT --> CAROL[Carol: 'Hi! How can I help?']
    CAROL --> USER1[Cliente: 'Looking for cleaning']
    USER1 --> CAPTURE[Carol captura dados]
    
    subgraph CAPTURE_FLOW[" 📝 Captura de Dados"]
        CAPTURE --> Q1[Nome]
        Q1 --> Q2[Endereço]
        Q2 --> Q3[Bedrooms/Bathrooms]
        Q3 --> Q4[Tipo de serviço]
        Q4 --> Q5[Frequência desejada]
        Q5 --> Q6[Telefone]
        Q6 --> Q7[Email]
    end
    
    Q7 --> VALIDATE{Área atendida?}
    VALIDATE -->|Não| SORRY[Carol: 'Sorry, we don't<br/>serve that area yet']
    VALIDATE -->|Sim| SLOTS[Carol oferece slots]
    
    SLOTS --> CHOOSE[Cliente escolhe horário]
    CHOOSE --> CONFIRM[Carol confirma visita]
    
    CONFIRM --> CREATE_LEAD[Criar Lead no Supabase]
    CREATE_LEAD --> CREATE_AGEND[Criar Agendamento<br/>tipo: 'visit']
    CREATE_AGEND --> NOTIF[Disparar notificações]
    
    subgraph NOTIF_FLOW[" 📱 Notificações"]
        NOTIF --> SMS_CLIENT[SMS para Cliente]
        NOTIF --> EMAIL_CLIENT[Email para Cliente]
        NOTIF --> SMS_THAYNA[SMS para Thayna]
        NOTIF --> DASH_ALERT[Alerta no Dashboard]
    end
    
    SMS_CLIENT --> WAIT[Aguardar visita]
    WAIT --> LEMBRETE24[Lembrete 24h antes]
    LEMBRETE24 --> LEMBRETE30[Lembrete 30min antes]
    LEMBRETE30 --> VISITA[🏠 Visita realizada]
    
    VISITA --> ACEITA{Cliente aceita<br/>orçamento?}
    ACEITA -->|Sim| CONTRATO[Assinar contrato]
    ACEITA -->|Não| FOLLOWUP[Follow-up posterior]
    
    CONTRATO --> PRIMEIRA[Agendar primeira limpeza]
    PRIMEIRA --> RECORRENCIA[Configurar recorrência]
    RECORRENCIA --> ATIVO((✅ Cliente Ativo))
    
    SORRY --> END_NO((❌ Fim))
    FOLLOWUP --> END_MAYBE((⏳ Pendente))
```

---

## 3. FLUXO DO CHAT (CAROL IA)

```mermaid
flowchart TD
    START((Mensagem<br/>do Cliente)) --> API[POST /api/chat]
    API --> WEBHOOK[Webhook para n8n]
    
    WEBHOOK --> LOAD_HIST[Carregar histórico<br/>da sessão]
    LOAD_HIST --> AGENT[AI Agent Carol]
    
    AGENT --> INTENT{Identificar<br/>Intent}
    
    INTENT -->|Agendar| TOOL_SLOTS[Tool: buscar_slots]
    INTENT -->|Reagendar| TOOL_RESCHEDULE[Tool: reagendar]
    INTENT -->|Informação| TOOL_FAQ[Responder FAQ]
    INTENT -->|Preço| TOOL_PRICE[Tool: calcular_preco]
    INTENT -->|Problema| TOOL_ESCALATE[Tool: escalar_humano]
    INTENT -->|Outro| TOOL_GENERAL[Resposta geral]
    
    TOOL_SLOTS --> CHECK_CLIENT{Cliente<br/>identificado?}
    CHECK_CLIENT -->|Não| CREATE_LEAD[Tool: criar_lead]
    CHECK_CLIENT -->|Sim| GET_SLOTS[Buscar slots disponíveis]
    CREATE_LEAD --> GET_SLOTS
    
    GET_SLOTS --> OFFER[Oferecer opções de horário]
    OFFER --> WAIT_CHOICE[Aguardar escolha]
    WAIT_CHOICE --> BOOK[Tool: agendar_visita]
    BOOK --> CONFIRM_MSG[Mensagem de confirmação]
    
    TOOL_RESCHEDULE --> FIND_BOOKING[Buscar agendamento]
    FIND_BOOKING --> NEW_SLOTS[Buscar novos slots]
    NEW_SLOTS --> UPDATE_BOOKING[Atualizar agendamento]
    UPDATE_BOOKING --> CONFIRM_MSG
    
    TOOL_FAQ --> RESPOND[Resposta do FAQ]
    TOOL_PRICE --> PRICE_RANGE[Informar range de preço]
    PRICE_RANGE --> SUGGEST_VISIT[Sugerir visita]
    
    TOOL_ESCALATE --> NOTIFY_THAYNA[Notificar Thayna]
    NOTIFY_THAYNA --> HUMAN_MSG[Carol: 'Thayna will<br/>reach out shortly']
    
    TOOL_GENERAL --> AI_RESPONSE[Resposta contextual]
    
    CONFIRM_MSG --> SAVE[Salvar mensagens]
    RESPOND --> SAVE
    SUGGEST_VISIT --> SAVE
    HUMAN_MSG --> SAVE
    AI_RESPONSE --> SAVE
    
    SAVE --> RETURN[Retornar resposta<br/>para frontend]
    RETURN --> END((Exibir no Chat))
```

---

## 4. FLUXO DE AGENDAMENTO

```mermaid
flowchart TD
    START((Novo<br/>Agendamento)) --> SOURCE{Origem}
    
    SOURCE -->|Chat| CHAT_FLOW[Via Carol]
    SOURCE -->|Admin| ADMIN_FLOW[Via Dashboard]
    SOURCE -->|Recorrência| REC_FLOW[Automático]
    
    CHAT_FLOW --> SELECT_CLIENT[Identificar/Criar cliente]
    ADMIN_FLOW --> SEARCH_CLIENT[Buscar cliente]
    REC_FLOW --> AUTO_CLIENT[Cliente da recorrência]
    
    SELECT_CLIENT --> CHECK_SLOTS
    SEARCH_CLIENT --> CHECK_SLOTS
    AUTO_CLIENT --> CHECK_SLOTS
    
    CHECK_SLOTS[Verificar disponibilidade]
    CHECK_SLOTS --> AVAILABLE{Slot<br/>disponível?}
    
    AVAILABLE -->|Não| ALT_SLOTS[Sugerir alternativos]
    ALT_SLOTS --> CHECK_SLOTS
    
    AVAILABLE -->|Sim| CREATE[Criar agendamento]
    
    CREATE --> SET_VALUES[Definir valores]
    SET_VALUES --> CALC_DURATION[Calcular duração]
    CALC_DURATION --> CALC_PRICE[Calcular preço]
    
    CALC_PRICE --> SAVE_DB[(Salvar no Supabase)]
    
    SAVE_DB --> TRIGGER_NOTIF[Disparar notificações]
    
    TRIGGER_NOTIF --> N1[SMS confirmação<br/>cliente]
    TRIGGER_NOTIF --> N2[Email confirmação<br/>cliente]
    TRIGGER_NOTIF --> N3[Notificação<br/>Thayna]
    
    N1 --> SCHEDULE_REMINDERS[Agendar lembretes]
    N2 --> SCHEDULE_REMINDERS
    N3 --> SCHEDULE_REMINDERS
    
    SCHEDULE_REMINDERS --> R1[Cron: 24h antes]
    SCHEDULE_REMINDERS --> R2[Cron: 30min antes]
    SCHEDULE_REMINDERS --> R3[Cron: 2h depois]
    
    R1 --> END((✅ Agendado))
    R2 --> END
    R3 --> END
```

---

## 5. JORNADA DO CLIENTE RECORRENTE

```mermaid
flowchart TD
    START((Cliente<br/>Recorrente)) --> CHECK[Sistema verifica<br/>próximo agendamento]
    
    CHECK --> HAS{Tem agendamento<br/>futuro?}
    
    HAS -->|Não| CREATE[Criar próximo<br/>agendamento]
    HAS -->|Sim| WAIT[Aguardar data]
    
    CREATE --> WAIT
    
    WAIT --> D1[📅 24h antes]
    D1 --> REMIND24[Enviar lembrete SMS]
    REMIND24 --> CONFIRM{Cliente<br/>confirma?}
    
    CONFIRM -->|Sim| D2[📅 Dia do serviço]
    CONFIRM -->|Reagendar| RESCHEDULE[Processo de<br/>reagendamento]
    CONFIRM -->|Cancelar| CANCEL[Processo de<br/>cancelamento]
    
    RESCHEDULE --> NEW_DATE[Nova data definida]
    NEW_DATE --> WAIT
    
    CANCEL --> FEE{Menos de<br/>24h?}
    FEE -->|Sim| CHARGE[Cobrar taxa $50]
    FEE -->|Não| NO_CHARGE[Sem taxa]
    CHARGE --> UPDATE_STATUS[Atualizar status]
    NO_CHARGE --> UPDATE_STATUS
    
    D2 --> D3[⏰ 30min antes]
    D3 --> REMIND30[SMS: 'On my way']
    REMIND30 --> ARRIVE[Thayna chega]
    
    ARRIVE --> SERVICE[🧹 Executar serviço]
    SERVICE --> CHECKLIST[Preencher checklist]
    CHECKLIST --> MARK_DONE[Marcar como concluído]
    
    MARK_DONE --> POST[⏰ 2h depois]
    POST --> FEEDBACK_SMS[SMS pedindo rating]
    
    FEEDBACK_SMS --> RATING{Rating<br/>recebido}
    
    RATING -->|5⭐| THANK[Agradecer +<br/>pedir Google Review]
    RATING -->|4⭐| THANK_SIMPLE[Agradecer]
    RATING -->|3⭐| ALERT[Alertar Thayna]
    RATING -->|1-2⭐| URGENT[Alerta URGENTE<br/>Thayna liga]
    
    THANK --> NEXT[Próximo ciclo]
    THANK_SIMPLE --> NEXT
    ALERT --> FOLLOWUP[Follow-up]
    FOLLOWUP --> NEXT
    URGENT --> RESOLVE[Resolver problema]
    RESOLVE --> NEXT
    
    NEXT --> CALC_NEXT[Calcular próxima data<br/>baseado na frequência]
    CALC_NEXT --> CHECK
```

---

## 6. FLUXO DE NOTIFICAÇÕES

```mermaid
flowchart LR
    subgraph Triggers["🎯 TRIGGERS"]
        T1[Novo agendamento]
        T2[24h antes]
        T3[30min antes]
        T4[Serviço concluído]
        T5[Feedback recebido]
        T6[Cliente inativo]
        T7[Aniversário]
        T8[Marketing sazonal]
    end
    
    subgraph N8N["⚙️ N8N WORKFLOWS"]
        W1[Workflow Confirmação]
        W2[Workflow Lembretes]
        W3[Workflow Feedback]
        W4[Workflow Marketing]
    end
    
    subgraph Channels["📱 CANAIS"]
        SMS[Twilio SMS]
        EMAIL[Resend Email]
        DASH[Dashboard Alert]
    end
    
    subgraph Recipients["👥 DESTINATÁRIOS"]
        CLIENT[Cliente]
        THAYNA[Thayna]
    end
    
    T1 --> W1
    T2 --> W2
    T3 --> W2
    T4 --> W3
    T5 --> W3
    T6 --> W4
    T7 --> W4
    T8 --> W4
    
    W1 --> SMS
    W1 --> EMAIL
    W1 --> DASH
    
    W2 --> SMS
    W3 --> SMS
    W4 --> SMS
    
    SMS --> CLIENT
    SMS --> THAYNA
    EMAIL --> CLIENT
    DASH --> THAYNA
```

---

## 7. FLUXO FINANCEIRO

```mermaid
flowchart TD
    subgraph Receitas["💰 RECEITAS"]
        R1[Serviço concluído]
        R2[Add-on realizado]
        R3[Taxa no-show]
        R4[Taxa cancelamento]
    end
    
    subgraph Custos["💸 CUSTOS"]
        C1[Produtos limpeza]
        C2[Transporte/Gasolina]
        C3[Equipamentos]
        C4[Marketing]
        C5[Outros]
    end
    
    R1 --> |Automático via Trigger| DB[(Tabela financeiro)]
    R2 --> |Automático| DB
    R3 --> |Automático| DB
    R4 --> |Automático| DB
    
    C1 --> |Manual via Admin| DB
    C2 --> |Manual| DB
    C3 --> |Manual| DB
    C4 --> |Manual| DB
    C5 --> |Manual| DB
    
    DB --> CALC[Calcular totais]
    
    CALC --> METRICS[Métricas]
    
    subgraph METRICS["📊 DASHBOARD FINANCEIRO"]
        M1[Receita do mês]
        M2[Custos do mês]
        M3[Lucro líquido]
        M4[Receita por tipo]
        M5[Ticket médio]
        M6[Projeção mensal]
    end
    
    METRICS --> REPORT[Relatório mensal]
    REPORT --> EXPORT[Exportar CSV]
```

---

## 8. ESTADOS DO CLIENTE

```mermaid
stateDiagram-v2
    [*] --> Lead: Primeiro contato
    
    Lead --> Ativo: Primeiro serviço<br/>realizado
    Lead --> Lead: Visita agendada<br/>(ainda lead)
    Lead --> Cancelado: Desistiu antes<br/>do primeiro serviço
    
    Ativo --> Ativo: Serviços<br/>recorrentes
    Ativo --> Pausado: Solicitou pausa<br/>temporária
    Ativo --> Inativo: 90+ dias sem<br/>serviço
    Ativo --> Cancelado: Solicitou<br/>cancelamento
    
    Pausado --> Ativo: Retomou<br/>serviços
    Pausado --> Cancelado: Decidiu<br/>encerrar
    
    Inativo --> Ativo: Reativado via<br/>campanha
    Inativo --> Cancelado: Sem resposta<br/>após tentativas
    
    Cancelado --> Ativo: Cliente voltou<br/>(raro)
    Cancelado --> [*]
    
    note right of Lead
        Status inicial
        de todo contato
    end note
    
    note right of Ativo
        Cliente com serviços
        recorrentes ativos
    end note
    
    note right of Pausado
        Pausa temporária
        (férias, viagem, etc)
    end note
    
    note right of Inativo
        Automático após
        90 dias sem serviço
    end note
```

---

## 9. ESTADOS DO AGENDAMENTO

```mermaid
stateDiagram-v2
    [*] --> Agendado: Criado
    
    Agendado --> Confirmado: Cliente confirma<br/>(resposta SMS)
    Agendado --> Cancelado: Cancelamento<br/>> 24h antes
    Agendado --> Reagendado: Mudança de data
    
    Confirmado --> EmAndamento: Thayna chegou<br/>e iniciou
    Confirmado --> Cancelado: Cancelamento<br/>< 24h (taxa)
    Confirmado --> NoShow: Cliente não<br/>disponível
    Confirmado --> Reagendado: Mudança de data
    
    EmAndamento --> Concluido: Serviço<br/>finalizado
    
    Concluido --> [*]
    
    Cancelado --> [*]
    
    NoShow --> [*]
    
    Reagendado --> Agendado: Novo agendamento<br/>criado
    
    note right of Agendado
        Estado inicial
    end note
    
    note right of Confirmado
        Cliente respondeu
        lembrete 24h
    end note
    
    note right of EmAndamento
        Serviço em
        execução
    end note
    
    note right of Concluido
        Gera registro
        financeiro
    end note
    
    note right of NoShow
        Gera taxa
        de $50
    end note
    
    note right of Cancelado
        Pode gerar taxa
        se < 24h
    end note
```

---

## 10. DIAGRAMA DE ENTIDADES (ER)

```mermaid
erDiagram
    CLIENTES ||--o{ AGENDAMENTOS : "tem"
    CLIENTES ||--o| RECORRENCIAS : "pode ter"
    CLIENTES ||--o{ CONTRATOS : "tem"
    CLIENTES ||--o{ FINANCEIRO : "gera"
    CLIENTES ||--o{ MENSAGENS_CHAT : "envia"
    CLIENTES ||--o{ FEEDBACK : "avalia"
    
    AGENDAMENTOS ||--o| RECORRENCIAS : "pertence a"
    AGENDAMENTOS ||--o{ FINANCEIRO : "gera"
    AGENDAMENTOS ||--o| FEEDBACK : "recebe"
    
    SERVICOS_TIPOS ||--o{ AGENDAMENTOS : "define tipo"
    
    CLIENTES {
        uuid id PK
        string nome
        string telefone
        string email
        string endereco_completo
        int bedrooms
        decimal bathrooms
        string status
        string frequencia
        decimal valor_servico
        timestamp created_at
    }
    
    AGENDAMENTOS {
        uuid id PK
        uuid cliente_id FK
        uuid recorrencia_id FK
        string tipo
        date data
        time horario_inicio
        time horario_fim_estimado
        decimal valor_final
        string status
        jsonb checklist
        timestamp created_at
    }
    
    RECORRENCIAS {
        uuid id PK
        uuid cliente_id FK
        string frequencia
        string dia_preferido
        time horario_preferido
        decimal valor_com_desconto
        boolean ativo
        date proximo_agendamento
    }
    
    CONTRATOS {
        uuid id PK
        uuid cliente_id FK
        string documento_url
        decimal valor_acordado
        string status
        date data_assinatura
    }
    
    FINANCEIRO {
        uuid id PK
        uuid cliente_id FK
        uuid agendamento_id FK
        string tipo
        decimal valor
        string categoria
        date data
    }
    
    MENSAGENS_CHAT {
        uuid id PK
        string session_id
        uuid cliente_id FK
        string role
        text content
        timestamp created_at
    }
    
    FEEDBACK {
        uuid id PK
        uuid agendamento_id FK
        uuid cliente_id FK
        int rating
        text comentario
    }
    
    SERVICOS_TIPOS {
        uuid id PK
        string codigo
        string nome
        decimal multiplicador_preco
        string cor
    }
    
    ADDONS {
        uuid id PK
        string codigo
        string nome
        decimal preco
    }
    
    PRECOS_BASE {
        uuid id PK
        int bedrooms
        decimal bathrooms
        decimal preco_sugerido
    }
    
    AREAS_ATENDIDAS {
        uuid id PK
        string nome
        string cidade
        boolean ativo
    }
    
    CONFIGURACOES {
        uuid id PK
        string chave
        jsonb valor
    }
```

---

## 11. FLUXO DE NAVEGAÇÃO (FRONTEND)

```mermaid
flowchart TD
    subgraph Public["🌐 ROTAS PÚBLICAS"]
        HOME[/ Landing Page]
        CHAT_PAGE[/chat Chat Fullscreen]
        LOGIN[/login Login]
    end
    
    subgraph Admin["🔐 ROTAS ADMIN"]
        DASH[/admin Dashboard]
        AGENDA[/admin/agenda Calendário]
        CLIENTS[/admin/clientes Lista Clientes]
        CLIENT_DETAIL[/admin/clientes/id Ficha Cliente]
        CONTRACTS[/admin/contratos Contratos]
        FINANCIAL[/admin/financeiro Financeiro]
        SETTINGS[/admin/configuracoes Configurações]
    end
    
    HOME -->|CTA Chat| CHAT_WIDGET[Chat Widget]
    HOME -->|Link direto| CHAT_PAGE
    HOME -->|Footer link| LOGIN
    
    CHAT_WIDGET -->|Mobile| CHAT_PAGE
    
    LOGIN -->|Sucesso| DASH
    LOGIN -->|Falha| LOGIN
    
    DASH -->|Menu| AGENDA
    DASH -->|Menu| CLIENTS
    DASH -->|Menu| CONTRACTS
    DASH -->|Menu| FINANCIAL
    DASH -->|Menu| SETTINGS
    DASH -->|Quick action| CLIENTS
    DASH -->|Today card| AGENDA
    
    AGENDA -->|Click cliente| CLIENT_DETAIL
    AGENDA -->|Novo agendamento| MODAL_AGEND[Modal Agendamento]
    
    CLIENTS -->|Click row| CLIENT_DETAIL
    CLIENTS -->|Novo cliente| MODAL_CLIENT[Modal Cliente]
    
    CLIENT_DETAIL -->|Tab contratos| CONTRACTS
    CLIENT_DETAIL -->|Tab financeiro| FINANCIAL
    
    CONTRACTS -->|Novo contrato| MODAL_CONTRACT[Modal Contrato]
    
    FINANCIAL -->|Nova transação| MODAL_TRANS[Modal Transação]
    
    subgraph Modals["📦 MODAIS"]
        MODAL_AGEND
        MODAL_CLIENT
        MODAL_CONTRACT
        MODAL_TRANS
    end
```

---

## 12. FLUXO DE AUTENTICAÇÃO

```mermaid
sequenceDiagram
    autonumber
    participant U as Usuário
    participant F as Frontend
    participant S as Supabase Auth
    participant DB as Supabase DB
    
    U->>F: Acessa /login
    F->>U: Exibe formulário
    
    U->>F: Submete email/senha
    F->>S: signInWithPassword()
    
    alt Credenciais válidas
        S->>S: Valida credenciais
        S->>F: Retorna session + user
        F->>F: Armazena session
        F->>U: Redirect para /admin
        
        U->>F: Acessa rota protegida
        F->>S: getSession()
        S->>F: Session válida
        F->>DB: Fetch dados
        DB->>F: Dados
        F->>U: Renderiza página
    else Credenciais inválidas
        S->>F: Erro de autenticação
        F->>U: Exibe mensagem de erro
    end
    
    Note over F,S: Sessão persistida via cookies
    
    U->>F: Click em Logout
    F->>S: signOut()
    S->>F: Session removida
    F->>U: Redirect para /login
```

---

## 13. CAROL IA - AI AGENT TOOLS

```mermaid
flowchart TD
    subgraph Agent["🤖 CAROL AI AGENT"]
        ROUTER[AI Router<br/>GPT-4/Claude]
    end
    
    subgraph Tools["🔧 TOOLS DISPONÍVEIS"]
        T1[buscar_slots]
        T2[criar_lead]
        T3[agendar_visita]
        T4[buscar_cliente]
        T5[reagendar]
        T6[cancelar]
        T7[escalar_humano]
        T8[responder_faq]
    end
    
    subgraph Actions["⚡ AÇÕES"]
        A1[(Query Supabase)]
        A2[(Insert Supabase)]
        A3[Enviar SMS]
        A4[Enviar Email]
        A5[Notificar Dashboard]
    end
    
    ROUTER --> T1
    ROUTER --> T2
    ROUTER --> T3
    ROUTER --> T4
    ROUTER --> T5
    ROUTER --> T6
    ROUTER --> T7
    ROUTER --> T8
    
    T1 -->|"get_available_slots()"| A1
    T2 -->|"INSERT clientes"| A2
    T3 -->|"INSERT agendamentos"| A2
    T3 --> A3
    T3 --> A4
    T4 -->|"SELECT clientes"| A1
    T5 -->|"UPDATE agendamentos"| A2
    T5 --> A3
    T6 -->|"UPDATE status"| A2
    T6 --> A3
    T7 --> A3
    T7 --> A5
    T8 -->|Knowledge base| ROUTER
```

### Tool: buscar_slots

```mermaid
flowchart LR
    INPUT[/data, duração/] --> FUNC[get_available_slots]
    FUNC --> QUERY[(Query agendamentos<br/>do dia)]
    QUERY --> CALC[Calcular slots<br/>disponíveis]
    CALC --> BUFFER[Aplicar buffer<br/>60min]
    BUFFER --> OUTPUT[/Lista de slots/]
```

### Tool: criar_lead

```mermaid
flowchart LR
    INPUT[/nome, telefone,<br/>email, endereço/] --> VALIDATE{Validar<br/>dados}
    VALIDATE -->|OK| CHECK[Verificar se<br/>já existe]
    VALIDATE -->|Erro| ERROR[/Erro validação/]
    CHECK -->|Existe| RETURN[/Cliente existente/]
    CHECK -->|Não existe| INSERT[(INSERT clientes)]
    INSERT --> OUTPUT[/Novo cliente criado/]
```

### Tool: agendar_visita

```mermaid
flowchart TD
    INPUT[/cliente_id, data,<br/>horário/] --> CHECK_SLOT{Slot<br/>disponível?}
    CHECK_SLOT -->|Não| ERROR[/Erro: slot ocupado/]
    CHECK_SLOT -->|Sim| INSERT[(INSERT agendamentos)]
    INSERT --> UPDATE[UPDATE cliente<br/>se necessário]
    UPDATE --> NOTIF[Disparar notificações]
    NOTIF --> SMS[SMS cliente]
    NOTIF --> EMAIL[Email cliente]
    NOTIF --> THAYNA[Notificar Thayna]
    SMS --> OUTPUT[/Visita agendada/]
```

---

## 14. FLUXO DE RECORRÊNCIA

```mermaid
flowchart TD
    START((⏰ Cron<br/>Semanal)) --> QUERY[(Buscar recorrências<br/>ativas)]
    
    QUERY --> LOOP{Para cada<br/>recorrência}
    
    LOOP --> CHECK{Próximo<br/>agendamento<br/>< 7 dias?}
    
    CHECK -->|Não| SKIP[Pular]
    CHECK -->|Sim| CALC[Calcular próxima data]
    
    CALC --> ADJUST[Ajustar para<br/>dia preferido]
    
    ADJUST --> EXISTS{Já existe<br/>agendamento?}
    
    EXISTS -->|Sim| SKIP
    EXISTS -->|Não| CREATE[(Criar agendamento)]
    
    CREATE --> UPDATE[(Atualizar recorrência<br/>proximo_agendamento)]
    
    UPDATE --> INCREMENT[Incrementar<br/>total_agendamentos]
    
    INCREMENT --> NEXT[Próxima recorrência]
    SKIP --> NEXT
    
    NEXT --> LOOP
    
    LOOP -->|Fim| END((✅ Concluído))
    
    subgraph Frequências["📅 CÁLCULO DE DATA"]
        F1[Weekly: +7 dias]
        F2[Biweekly: +14 dias]
        F3[Monthly: +1 mês]
    end
```

---

## 15. FLUXO DE FEEDBACK

```mermaid
flowchart TD
    START((Serviço<br/>Concluído)) --> MARK[Marcar como<br/>concluído]
    
    MARK --> WAIT[⏰ Aguardar 2h]
    
    WAIT --> SMS[Enviar SMS<br/>'How was it? 1-5⭐']
    
    SMS --> RECEIVE{Resposta<br/>recebida?}
    
    RECEIVE -->|Timeout 24h| SKIP[Registrar<br/>sem resposta]
    RECEIVE -->|Sim| PARSE[Extrair rating]
    
    PARSE --> SAVE[(Salvar feedback)]
    
    SAVE --> EVALUATE{Rating?}
    
    EVALUATE -->|5⭐| FLOW_5[Agradecer]
    EVALUATE -->|4⭐| FLOW_4[Agradecer]
    EVALUATE -->|3⭐| FLOW_3[Alertar Thayna]
    EVALUATE -->|1-2⭐| FLOW_12[Alerta URGENTE]
    
    FLOW_5 --> GOOGLE{3º serviço<br/>do cliente?}
    GOOGLE -->|Sim| REVIEW[Pedir Google Review]
    GOOGLE -->|Não| END1((✅))
    REVIEW --> END1
    
    FLOW_4 --> END2((✅))
    
    FLOW_3 --> THAYNA_CALL[Thayna liga<br/>em 24h]
    THAYNA_CALL --> RESOLVE[Registrar ação]
    RESOLVE --> END3((✅))
    
    FLOW_12 --> URGENT_CALL[Thayna liga<br/>IMEDIATAMENTE]
    URGENT_CALL --> RESOLVE
    
    SKIP --> END4((⏭️))
```

---

## LEGENDA

### Símbolos Mermaid

| Símbolo | Significado |
|---------|-------------|
| `[Retângulo]` | Processo/Ação |
| `{Losango}` | Decisão |
| `((Círculo))` | Início/Fim |
| `[(Cilindro)]` | Banco de dados |
| `[/Paralelo/]` | Input/Output |
| `-->` | Fluxo |
| `-->\|texto\|` | Fluxo com condição |

### Cores dos Serviços

| Cor | Tipo |
|-----|------|
| 🟢 Verde | Regular Cleaning |
| 🟡 Amarelo | Deep Cleaning |
| 🔵 Azul | Move-in/out |
| 🟣 Roxo | Office |
| 🟠 Laranja | Airbnb |
| ⚪ Cinza | Estimate Visit |
| 🔴 Vermelho | Cancelado |

---

**— FIM DOS FLOWCHARTS —**

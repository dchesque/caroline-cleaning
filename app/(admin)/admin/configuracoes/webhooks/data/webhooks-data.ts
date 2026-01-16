export type WebhookDirection = 'outbound' | 'inbound'

export interface WebhookField {
    name: string
    type: string
    required: boolean
    description: string
}

export interface WebhookConfig {
    id: string
    direction: WebhookDirection
    category: string
    categoryIcon: string
    description: string    // Nova curta descrição
    endpoint: string
    method: 'POST'
    timeout: number
    retries?: number
    hook?: string           // Para outbound
    handler?: string        // Para inbound
    interfaceName: string
    fields: WebhookField[]
    example: Record<string, any>
}

export const WEBHOOKS_DATA: WebhookConfig[] = [
    // OUTBOUND
    {
        id: 'chat.message_received',
        direction: 'outbound',
        category: 'Chat',
        categoryIcon: '💬',
        description: 'Envia mensagem do chat para processamento IA',
        endpoint: '/chat/message-received',
        method: 'POST',
        timeout: 60000,
        retries: 3,
        hook: 'useSendChatMessage()',
        interfaceName: 'ChatMessagePayload',
        fields: [
            { name: 'session_id', type: 'string', required: true, description: 'ID único da sessão do chat' },
            { name: 'message_id', type: 'string', required: false, description: 'ID da mensagem' },
            { name: 'content', type: 'string', required: true, description: 'Conteúdo da mensagem' },
            { name: 'source', type: "'website' | 'whatsapp'", required: true, description: 'Origem da mensagem' },
            { name: 'timestamp', type: 'string', required: true, description: 'Data/hora ISO 8601' },
            { name: 'client_info', type: '{ name?: string; phone?: string; email?: string }', required: false, description: 'Informações do cliente' },
            { name: 'metadata', type: 'Record<string, any>', required: false, description: 'Metadados adicionais' },
        ],
        example: {
            session_id: "sess_abc123xyz",
            content: "Olá, gostaria de agendar uma limpeza",
            source: "website",
            timestamp: "2025-01-16T14:30:00.000Z",
            client_info: {
                name: "Maria Silva",
                phone: "+15551234567"
            }
        }
    },
    {
        id: 'lead.created',
        direction: 'outbound',
        category: 'Leads',
        categoryIcon: '🎯',
        description: 'Notifica quando novo lead é capturado',
        endpoint: '/leads/created',
        method: 'POST',
        timeout: 30000,
        retries: 3,
        hook: 'useNotifyLeadCreated()',
        interfaceName: 'LeadCreatedPayload',
        fields: [
            { name: 'lead_id', type: 'string', required: true, description: 'UUID do lead' },
            { name: 'nome', type: 'string', required: true, description: 'Nome do lead' },
            { name: 'telefone', type: 'string', required: true, description: 'Telefone do lead' },
            { name: 'email', type: 'string', required: false, description: 'Email do lead' },
            { name: 'endereco', type: 'string', required: false, description: 'Endereço' },
            { name: 'cidade', type: 'string', required: false, description: 'Cidade' },
            { name: 'cep', type: 'string', required: false, description: 'CEP/ZIP Code' },
            { name: 'bedrooms', type: 'number', required: false, description: 'Número de quartos' },
            { name: 'bathrooms', type: 'number', required: false, description: 'Número de banheiros' },
            { name: 'service_type', type: 'string', required: false, description: 'Tipo de serviço desejado' },
            { name: 'frequency', type: 'string', required: false, description: 'Frequência desejada' },
            { name: 'source', type: "'website' | 'whatsapp' | 'manual'", required: true, description: 'Origem do lead' },
            { name: 'session_id', type: 'string', required: false, description: 'ID da sessão de chat' },
            { name: 'created_at', type: 'string', required: true, description: 'Data/hora de criação' },
        ],
        example: {
            lead_id: "550e8400-e29b-41d4-a716-446655440000",
            nome: "João Santos",
            telefone: "+15551234567",
            email: "joao@email.com",
            cidade: "Miami",
            bedrooms: 3,
            bathrooms: 2,
            service_type: "regular",
            frequency: "biweekly",
            source: "website",
            created_at: "2025-01-16T14:30:00.000Z"
        }
    },
    {
        id: 'lead.updated',
        direction: 'outbound',
        category: 'Leads',
        categoryIcon: '🎯',
        description: 'Notifica quando lead é atualizado',
        endpoint: '/leads/updated',
        method: 'POST',
        timeout: 30000,
        retries: 3,
        hook: "useWebhook('lead.updated')",
        interfaceName: 'LeadUpdatedPayload',
        fields: [
            { name: 'lead_id', type: 'string', required: true, description: 'UUID do lead' },
            { name: 'changes', type: 'Record<string, any>', required: true, description: 'Campos alterados com novos valores' },
            { name: 'updated_at', type: 'string', required: true, description: 'Data/hora da atualização' },
        ],
        example: {
            lead_id: "550e8400-e29b-41d4-a716-446655440000",
            changes: {
                status: "contatado",
                notas: "Cliente interessado em limpeza semanal"
            },
            updated_at: "2025-01-16T15:00:00.000Z"
        }
    },
    {
        id: 'lead.converted',
        direction: 'outbound',
        category: 'Leads',
        categoryIcon: '🎯',
        description: 'Notifica quando lead vira cliente',
        endpoint: '/leads/converted',
        method: 'POST',
        timeout: 30000,
        retries: 3,
        hook: "useWebhook('lead.converted')",
        interfaceName: 'LeadConvertedPayload',
        fields: [
            { name: 'lead_id', type: 'string', required: true, description: 'UUID do lead original' },
            { name: 'client_id', type: 'string', required: true, description: 'UUID do novo cliente criado' },
            { name: 'converted_at', type: 'string', required: true, description: 'Data/hora da conversão' },
        ],
        example: {
            lead_id: "550e8400-e29b-41d4-a716-446655440000",
            client_id: "123e4567-e89b-12d3-a456-426614174000",
            converted_at: "2025-01-16T16:00:00.000Z"
        }
    },
    {
        id: 'appointment.created',
        direction: 'outbound',
        category: 'Agendamentos',
        categoryIcon: '📅',
        description: 'Notifica novo agendamento criado',
        endpoint: '/appointments/created',
        method: 'POST',
        timeout: 30000,
        retries: 3,
        hook: 'useNotifyAppointmentCreated()',
        interfaceName: 'AppointmentCreatedPayload',
        fields: [
            { name: 'appointment_id', type: 'string', required: true, description: 'UUID do agendamento' },
            { name: 'client_id', type: 'string', required: true, description: 'UUID do cliente' },
            { name: 'client_name', type: 'string', required: true, description: 'Nome do cliente' },
            { name: 'client_phone', type: 'string', required: true, description: 'Telefone do cliente' },
            { name: 'client_email', type: 'string', required: false, description: 'Email do cliente' },
            { name: 'service_type', type: "'visit' | 'regular' | 'deep' | 'move_in_out' | 'office' | 'airbnb'", required: true, description: 'Tipo de serviço' },
            { name: 'date', type: 'string', required: true, description: 'Data no formato YYYY-MM-DD' },
            { name: 'time_start', type: 'string', required: true, description: 'Horário início HH:MM' },
            { name: 'time_end', type: 'string', required: false, description: 'Horário fim HH:MM' },
            { name: 'duration_minutes', type: 'number', required: true, description: 'Duração em minutos' },
            { name: 'address', type: 'string', required: true, description: 'Endereço completo' },
            { name: 'price', type: 'number', required: false, description: 'Valor do serviço' },
            { name: 'notes', type: 'string', required: false, description: 'Observações' },
            { name: 'source', type: "'chat' | 'admin' | 'recurrence'", required: true, description: 'Origem do agendamento' },
            { name: 'created_at', type: 'string', required: true, description: 'Data/hora de criação' },
        ],
        example: {
            appointment_id: "550e8400-e29b-41d4-a716-446655440000",
            client_id: "123e4567-e89b-12d3-a456-426614174000",
            client_name: "Maria Silva",
            client_phone: "+15551234567",
            client_email: "maria@email.com",
            service_type: "regular",
            date: "2025-01-20",
            time_start: "09:00",
            time_end: "12:00",
            duration_minutes: 180,
            address: "123 Main St, Miami, FL 33101",
            price: 150.00,
            source: "admin",
            created_at: "2025-01-16T14:30:00.000Z"
        }
    },
    {
        id: 'appointment.confirmed',
        direction: 'outbound',
        category: 'Agendamentos',
        categoryIcon: '📅',
        description: 'Notifica quando cliente confirma',
        endpoint: '/appointments/confirmed',
        method: 'POST',
        timeout: 30000,
        retries: 3,
        hook: "useWebhook('appointment.confirmed')",
        interfaceName: 'AppointmentConfirmedPayload',
        fields: [
            { name: 'appointment_id', type: 'string', required: true, description: 'UUID do agendamento' },
            { name: 'client_id', type: 'string', required: true, description: 'UUID do cliente' },
            { name: 'client_name', type: 'string', required: true, description: 'Nome do cliente' },
            { name: 'client_phone', type: 'string', required: true, description: 'Telefone do cliente' },
            { name: 'date', type: 'string', required: true, description: 'Data YYYY-MM-DD' },
            { name: 'time_start', type: 'string', required: true, description: 'Horário HH:MM' },
            { name: 'confirmed_at', type: 'string', required: true, description: 'Data/hora da confirmação' },
        ],
        example: {
            appointment_id: "550e8400-e29b-41d4-a716-446655440000",
            client_id: "123e4567-e89b-12d3-a456-426614174000",
            client_name: "Maria Silva",
            client_phone: "+15551234567",
            date: "2025-01-20",
            time_start: "09:00",
            confirmed_at: "2025-01-17T10:00:00.000Z"
        }
    },
    {
        id: 'appointment.completed',
        direction: 'outbound',
        category: 'Agendamentos',
        categoryIcon: '📅',
        description: 'Notifica serviço finalizado',
        endpoint: '/appointments/completed',
        method: 'POST',
        timeout: 30000,
        retries: 3,
        hook: 'useNotifyAppointmentCompleted()',
        interfaceName: 'AppointmentCompletedPayload',
        fields: [
            { name: 'appointment_id', type: 'string', required: true, description: 'UUID do agendamento' },
            { name: 'client_id', type: 'string', required: true, description: 'UUID do cliente' },
            { name: 'client_name', type: 'string', required: true, description: 'Nome do cliente' },
            { name: 'client_phone', type: 'string', required: true, description: 'Telefone do cliente' },
            { name: 'service_type', type: 'string', required: true, description: 'Tipo de serviço' },
            { name: 'date', type: 'string', required: true, description: 'Data do serviço' },
            { name: 'duration_actual', type: 'number', required: false, description: 'Duração real em minutos' },
            { name: 'price', type: 'number', required: true, description: 'Valor cobrado' },
            { name: 'completed_at', type: 'string', required: true, description: 'Data/hora de conclusão' },
        ],
        example: {
            appointment_id: "550e8400-e29b-41d4-a716-446655440000",
            client_id: "123e4567-e89b-12d3-a456-426614174000",
            client_name: "Maria Silva",
            client_phone: "+15551234567",
            service_type: "regular",
            date: "2025-01-20",
            duration_actual: 165,
            price: 150.00,
            completed_at: "2025-01-20T12:45:00.000Z"
        }
    },
    {
        id: 'appointment.cancelled',
        direction: 'outbound',
        category: 'Agendamentos',
        categoryIcon: '📅',
        description: 'Notifica cancelamento',
        endpoint: '/appointments/cancelled',
        method: 'POST',
        timeout: 30000,
        retries: 3,
        hook: 'useNotifyAppointmentCancelled()',
        interfaceName: 'AppointmentCancelledPayload',
        fields: [
            { name: 'appointment_id', type: 'string', required: true, description: 'UUID do agendamento' },
            { name: 'client_id', type: 'string', required: true, description: 'UUID do cliente' },
            { name: 'client_name', type: 'string', required: true, description: 'Nome do cliente' },
            { name: 'client_phone', type: 'string', required: true, description: 'Telefone do cliente' },
            { name: 'date', type: 'string', required: true, description: 'Data do agendamento' },
            { name: 'time_start', type: 'string', required: true, description: 'Horário do agendamento' },
            { name: 'reason', type: 'string', required: false, description: 'Motivo do cancelamento' },
            { name: 'cancelled_by', type: "'client' | 'admin'", required: true, description: 'Quem cancelou' },
            { name: 'late_cancellation', type: 'boolean', required: true, description: 'Se foi cancelamento tardio (< 24h)' },
            { name: 'cancelled_at', type: 'string', required: true, description: 'Data/hora do cancelamento' },
        ],
        example: {
            appointment_id: "550e8400-e29b-41d4-a716-446655440000",
            client_id: "123e4567-e89b-12d3-a456-426614174000",
            client_name: "Maria Silva",
            client_phone: "+15551234567",
            date: "2025-01-20",
            time_start: "09:00",
            reason: "Imprevisto pessoal",
            cancelled_by: "client",
            late_cancellation: false,
            cancelled_at: "2025-01-18T14:00:00.000Z"
        }
    },
    {
        id: 'appointment.rescheduled',
        direction: 'outbound',
        category: 'Agendamentos',
        categoryIcon: '📅',
        description: 'Notifica reagendamento',
        endpoint: '/appointments/rescheduled',
        method: 'POST',
        timeout: 30000,
        retries: 3,
        hook: "useWebhook('appointment.rescheduled')",
        interfaceName: 'AppointmentRescheduledPayload',
        fields: [
            { name: 'appointment_id', type: 'string', required: true, description: 'UUID do agendamento' },
            { name: 'client_id', type: 'string', required: true, description: 'UUID do cliente' },
            { name: 'client_name', type: 'string', required: true, description: 'Nome do cliente' },
            { name: 'client_phone', type: 'string', required: true, description: 'Telefone do cliente' },
            { name: 'old_date', type: 'string', required: true, description: 'Data anterior' },
            { name: 'old_time', type: 'string', required: true, description: 'Horário anterior' },
            { name: 'new_date', type: 'string', required: true, description: 'Nova data' },
            { name: 'new_time', type: 'string', required: true, description: 'Novo horário' },
            { name: 'rescheduled_at', type: 'string', required: true, description: 'Data/hora do reagendamento' },
        ],
        example: {
            appointment_id: "550e8400-e29b-41d4-a716-446655440000",
            client_id: "123e4567-e89b-12d3-a456-426614174000",
            client_name: "Maria Silva",
            client_phone: "+15551234567",
            old_date: "2025-01-20",
            old_time: "09:00",
            new_date: "2025-01-22",
            new_time: "14:00",
            rescheduled_at: "2025-01-18T10:00:00.000Z"
        }
    },
    {
        id: 'feedback.received',
        direction: 'outbound',
        category: 'Feedback',
        categoryIcon: '⭐',
        description: 'Notifica avaliação recebida',
        endpoint: '/feedback/received',
        method: 'POST',
        timeout: 30000,
        retries: 3,
        hook: 'useNotifyFeedbackReceived()',
        interfaceName: 'FeedbackReceivedPayload',
        fields: [
            { name: 'feedback_id', type: 'string', required: true, description: 'UUID do feedback' },
            { name: 'appointment_id', type: 'string', required: true, description: 'UUID do agendamento avaliado' },
            { name: 'client_id', type: 'string', required: true, description: 'UUID do cliente' },
            { name: 'client_name', type: 'string', required: true, description: 'Nome do cliente' },
            { name: 'client_phone', type: 'string', required: true, description: 'Telefone do cliente' },
            { name: 'rating', type: '1 | 2 | 3 | 4 | 5', required: true, description: 'Nota de 1 a 5' },
            { name: 'comment', type: 'string', required: false, description: 'Comentário do cliente' },
            { name: 'service_type', type: 'string', required: true, description: 'Tipo de serviço avaliado' },
            { name: 'service_date', type: 'string', required: true, description: 'Data do serviço' },
            { name: 'received_at', type: 'string', required: true, description: 'Data/hora do feedback' },
        ],
        example: {
            feedback_id: "550e8400-e29b-41d4-a716-446655440000",
            appointment_id: "123e4567-e89b-12d3-a456-426614174000",
            client_id: "789e0123-e45b-67d8-a901-234567890000",
            client_name: "Maria Silva",
            client_phone: "+15551234567",
            rating: 5,
            comment: "Excelente serviço! Casa ficou impecável.",
            service_type: "regular",
            service_date: "2025-01-20",
            received_at: "2025-01-20T18:00:00.000Z"
        }
    },
    {
        id: 'payment.received',
        direction: 'outbound',
        category: 'Pagamentos',
        categoryIcon: '💰',
        description: 'Notifica pagamento registrado',
        endpoint: '/payments/received',
        method: 'POST',
        timeout: 30000,
        retries: 3,
        hook: 'useNotifyPaymentReceived()',
        interfaceName: 'PaymentReceivedPayload',
        fields: [
            { name: 'payment_id', type: 'string', required: true, description: 'UUID do pagamento' },
            { name: 'appointment_id', type: 'string', required: false, description: 'UUID do agendamento relacionado' },
            { name: 'client_id', type: 'string', required: true, description: 'UUID do cliente' },
            { name: 'client_name', type: 'string', required: true, description: 'Nome do cliente' },
            { name: 'amount', type: 'number', required: true, description: 'Valor pago' },
            { name: 'method', type: "'cash' | 'zelle' | 'other'", required: true, description: 'Forma de pagamento' },
            { name: 'notes', type: 'string', required: false, description: 'Observações' },
            { name: 'received_at', type: 'string', required: true, description: 'Data/hora do recebimento' },
        ],
        example: {
            payment_id: "550e8400-e29b-41d4-a716-446655440000",
            appointment_id: "123e4567-e89b-12d3-a456-426614174000",
            client_id: "789e0123-e45b-67d8-a901-234567890000",
            client_name: "Maria Silva",
            amount: 150.00,
            method: "zelle",
            received_at: "2025-01-20T13:00:00.000Z"
        }
    },
    {
        id: 'client.inactive_alert',
        direction: 'outbound',
        category: 'Clientes',
        categoryIcon: '👥',
        description: 'Alerta cliente inativo há X dias',
        endpoint: '/clients/inactive-alert',
        method: 'POST',
        timeout: 30000,
        retries: 3,
        hook: "useWebhook('client.inactive_alert')",
        interfaceName: 'ClientInactiveAlertPayload',
        fields: [
            { name: 'client_id', type: 'string', required: true, description: 'UUID do cliente' },
            { name: 'client_name', type: 'string', required: true, description: 'Nome do cliente' },
            { name: 'client_phone', type: 'string', required: true, description: 'Telefone do cliente' },
            { name: 'client_email', type: 'string', required: false, description: 'Email do cliente' },
            { name: 'last_service_date', type: 'string', required: true, description: 'Data do último serviço' },
            { name: 'days_inactive', type: 'number', required: true, description: 'Dias sem serviço' },
            { name: 'total_services', type: 'number', required: true, description: 'Total de serviços realizados' },
            { name: 'lifetime_value', type: 'number', required: true, description: 'Valor total gasto pelo cliente' },
        ],
        example: {
            client_id: "550e8400-e29b-41d4-a716-446655440000",
            client_name: "Maria Silva",
            client_phone: "+15551234567",
            client_email: "maria@email.com",
            last_service_date: "2024-11-15",
            days_inactive: 62,
            total_services: 24,
            lifetime_value: 3600.00
        }
    },
    {
        id: 'client.birthday',
        direction: 'outbound',
        category: 'Clientes',
        categoryIcon: '👥',
        description: 'Notifica aniversário de cliente',
        endpoint: '/clients/birthday',
        method: 'POST',
        timeout: 30000,
        retries: 3,
        hook: "useWebhook('client.birthday')",
        interfaceName: 'ClientBirthdayPayload',
        fields: [
            { name: 'client_id', type: 'string', required: true, description: 'UUID do cliente' },
            { name: 'client_name', type: 'string', required: true, description: 'Nome do cliente' },
            { name: 'client_phone', type: 'string', required: true, description: 'Telefone do cliente' },
            { name: 'client_email', type: 'string', required: false, description: 'Email do cliente' },
        ],
        example: {
            client_id: "550e8400-e29b-41d4-a716-446655440000",
            client_name: "Maria Silva",
            client_phone: "+15551234567",
            client_email: "maria@email.com"
        }
    },

    // INBOUND
    {
        id: 'chat.response',
        direction: 'inbound',
        category: 'Chat',
        categoryIcon: '💬',
        description: 'Recebe resposta da Carol IA',
        endpoint: '/api/webhook/n8n',
        method: 'POST',
        timeout: 30000,
        handler: 'handleChatResponse()',
        interfaceName: 'ChatResponsePayload',
        fields: [
            { name: 'event', type: "'chat.response'", required: true, description: 'Tipo do evento' },
            { name: 'timestamp', type: 'string', required: true, description: 'Data/hora ISO 8601' },
            { name: 'data.session_id', type: 'string', required: true, description: 'ID da sessão do chat' },
            { name: 'data.message', type: 'string', required: true, description: 'Resposta da Carol' },
            { name: 'data.source', type: "'website' | 'whatsapp'", required: true, description: 'Canal de origem' },
            { name: 'data.metadata', type: 'Record<string, any>', required: false, description: 'Metadados (intent, confidence)' },
        ],
        example: {
            event: "chat.response",
            timestamp: "2025-01-16T14:30:00.000Z",
            data: {
                session_id: "sess_abc123xyz",
                message: "Olá! Ficarei feliz em ajudar com seu agendamento. Qual o melhor dia para você?",
                source: "website",
                metadata: {
                    intent: "scheduling",
                    confidence: 0.95
                }
            }
        }
    },
    {
        id: 'notification.dashboard',
        direction: 'inbound',
        category: 'Notificações',
        categoryIcon: '🔔',
        description: 'Recebe notificação para admin',
        endpoint: '/api/webhook/n8n',
        method: 'POST',
        timeout: 30000,
        handler: 'handleDashboardNotification()',
        interfaceName: 'DashboardNotificationPayload',
        fields: [
            { name: 'event', type: "'notification.dashboard'", required: true, description: 'Tipo do evento' },
            { name: 'timestamp', type: 'string', required: true, description: 'Data/hora ISO 8601' },
            { name: 'data.type', type: 'string', required: true, description: 'Tipo da notificação' },
            { name: 'data.title', type: 'string', required: true, description: 'Título da notificação' },
            { name: 'data.message', type: 'string', required: true, description: 'Mensagem da notificação' },
            { name: 'data.priority', type: "'low' | 'medium' | 'high'", required: false, description: 'Prioridade' },
        ],
        example: {
            event: "notification.dashboard",
            timestamp: "2025-01-16T14:30:00.000Z",
            data: {
                type: "new_lead",
                title: "Novo Lead",
                message: "Maria Silva acabou de solicitar orçamento",
                priority: "high"
            }
        }
    },
    {
        id: 'client.update',
        direction: 'inbound',
        category: 'Clientes',
        categoryIcon: '👥',
        description: 'Recebe atualização de cliente',
        endpoint: '/api/webhook/n8n',
        method: 'POST',
        timeout: 30000,
        handler: 'handleClientUpdate()',
        interfaceName: 'ClientUpdatePayload',
        fields: [
            { name: 'event', type: "'client.update'", required: true, description: 'Tipo do evento' },
            { name: 'timestamp', type: 'string', required: true, description: 'Data/hora ISO 8601' },
            { name: 'data.client_id', type: 'string', required: true, description: 'UUID do cliente' },
            { name: 'data.updates', type: 'Record<string, any>', required: true, description: 'Campos a atualizar' },
        ],
        example: {
            event: "client.update",
            timestamp: "2025-01-16T14:30:00.000Z",
            data: {
                client_id: "550e8400-e29b-41d4-a716-446655440000",
                updates: {
                    status: "ativo",
                    notas: "Cliente confirmou interesse em plano mensal"
                }
            }
        }
    },
    {
        id: 'appointment.update',
        direction: 'inbound',
        category: 'Agendamentos',
        categoryIcon: '📅',
        description: 'Recebe atualização de agendamento',
        endpoint: '/api/webhook/n8n',
        method: 'POST',
        timeout: 30000,
        handler: 'handleAppointmentUpdate()',
        interfaceName: 'AppointmentUpdatePayload',
        fields: [
            { name: 'event', type: "'appointment.update'", required: true, description: 'Tipo do evento' },
            { name: 'timestamp', type: 'string', required: true, description: 'Data/hora ISO 8601' },
            { name: 'data.appointment_id', type: 'string', required: true, description: 'UUID do agendamento' },
            { name: 'data.updates', type: 'Record<string, any>', required: true, description: 'Campos a atualizar' },
        ],
        example: {
            event: "appointment.update",
            timestamp: "2025-01-16T14:30:00.000Z",
            data: {
                appointment_id: "550e8400-e29b-41d4-a716-446655440000",
                updates: {
                    status: "confirmado",
                    notas: "Cliente confirmou via WhatsApp"
                }
            }
        }
    }
]

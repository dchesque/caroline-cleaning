// lib/ai/carol-agent.ts
import { openrouter, MODELS } from './openrouter'
import { CAROL_SYSTEM_PROMPT, TOOLS } from './prompts'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import type {
    ChatMessage,
    ChatResponse,
    CheckAvailabilityParams,
    CreateLeadParams,
    CreateBookingParams,
    CheckZipCoverageParams,
    ToolCall
} from '@/types/carol'

export class CarolAgent {
    private model: string

    constructor(model: string = MODELS.CLAUDE_SONNET) {
        this.model = model
    }

    /**
     * Processa uma mensagem do usuário e retorna a resposta da Carol
     */
    async chat(message: string, sessionId: string): Promise<ChatResponse> {
        logger.info('Carol processing message', { sessionId, messageLength: message.length })

        const supabase = await createClient() // Para leitura
        const adminSupabase = createAdminClient() // Para escrita (bypass RLS)

        // 1. Buscar histórico da conversa (últimas 20 mensagens)
        const { data: history, error: historyError } = await supabase
            .from('mensagens_chat')
            .select('role, content, created_at')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true })
            .limit(20)

        if (historyError) {
            logger.error('Error fetching chat history', { sessionId, error: historyError })
        }

        // 2. Salvar mensagem do usuário (usando admin para bypass RLS)
        const { error: saveUserError } = await adminSupabase
            .from('mensagens_chat')
            .insert({
                session_id: sessionId,
                role: 'user',
                content: message,
                source: 'website'
            })

        if (saveUserError) {
            logger.error('Error saving user message', { sessionId, error: saveUserError })
        }

        // 3. Preparar mensagens para o LLM com data atual e contexto de dias
        const today = new Date()
        const weekdays = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']

        // Gerar os próximos 7 dias com dia da semana
        const nextDays = []
        for (let i = 0; i < 7; i++) {
            const date = new Date(today)
            date.setDate(date.getDate() + i)
            const dayName = weekdays[date.getDay()]
            const formatted = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
            const isoDate = date.toISOString().split('T')[0]
            nextDays.push(`${dayName} = ${formatted} (${isoDate})`)
        }

        const dateContext = `
DATA DE HOJE: ${today.toISOString().split('T')[0]} (${weekdays[today.getDay()]}, ${today.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })})

CALENDARÍO DOS PRÓXIMOS 7 DIAS:
${nextDays.join('\n')}

IMPORTANTE: Quando o cliente disser "próxima terça", "semana que vem", etc., use o calendário acima para calcular a data CORRETA.
Ao confirmar agendamento, SEMPRE informe: dia da semana + data (ex: "terça-feira, dia 10/02").
`

        const apiMessages: any[] = [
            { role: 'system', content: CAROL_SYSTEM_PROMPT + '\n\n' + dateContext },
            ...(history || []).map(h => ({ role: h.role, content: h.content })),
            { role: 'user', content: message }
        ]

        let toolCallsExecuted = 0
        let finalContent = ''

        try {
            // 4. Loop de processamento IA (suporta tool calling)
            let keepProcessing = true
            let currentMessages = [...apiMessages]

            while (keepProcessing) {
                const response = await openrouter.chat.completions.create({
                    model: this.model,
                    messages: currentMessages,
                    tools: TOOLS as any,
                    tool_choice: 'auto',
                    temperature: 0.7,
                    max_tokens: 1000
                })

                const assistantMessage = response.choices[0].message
                currentMessages.push(assistantMessage)

                if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
                    logger.info('Carol executing tool calls', {
                        sessionId,
                        count: assistantMessage.tool_calls.length
                    })

                    for (const toolCall of assistantMessage.tool_calls) {
                        const toolResult = await this.executeTool(toolCall as unknown as ToolCall, sessionId)
                        toolCallsExecuted++

                        currentMessages.push({
                            role: 'tool',
                            tool_call_id: toolCall.id,
                            content: JSON.stringify(toolResult)
                        })
                    }
                    // Loop continua para a IA processar os resultados das tools
                } else {
                    finalContent = assistantMessage.content || ''
                    keepProcessing = false
                }
            }

            // 5. Salvar resposta final da Carol (usando admin para bypass RLS)
            const { error: saveAssistantError } = await adminSupabase
                .from('mensagens_chat')
                .insert({
                    session_id: sessionId,
                    role: 'assistant',
                    content: finalContent,
                    source: 'website'
                })

            if (saveAssistantError) {
                logger.error('Error saving assistant message', { sessionId, error: saveAssistantError })
            }

            // 6. Atualizar última atividade da sessão (usando admin para bypass RLS)
            await adminSupabase
                .from('chat_sessions')
                .upsert({
                    id: sessionId,
                    last_activity: new Date().toISOString(),
                    status: 'active'
                })

            return {
                message: finalContent,
                session_id: sessionId,
                tool_calls_executed: toolCallsExecuted,
                timestamp: new Date().toISOString()
            }

        } catch (error) {
            logger.error('Carol Agent chat error', { sessionId, error })
            throw error
        }
    }

    /**
     * Roteador de execução de ferramentas
     */
    private async executeTool(toolCall: ToolCall, sessionId: string) {
        const { name, arguments: argsString } = toolCall.function
        const params = JSON.parse(argsString)

        logger.info('Executing tool', { toolName: name, sessionId, params })

        try {
            switch (name) {
                case 'check_availability':
                    return await this.checkAvailability(params)
                case 'create_lead':
                    return await this.createLead(params, sessionId)
                case 'create_booking':
                    return await this.createBooking(params)
                case 'check_zip_coverage':
                    return await this.checkZipCoverage(params)
                case 'find_customer':
                    return await this.findCustomer(params)
                default:
                    return { error: `Tool ${name} not implemented` }
            }
        } catch (error) {
            logger.error('Tool execution error', { toolName: name, sessionId, error })
            return { error: 'Failed to execute tool' }
        }
    }

    // TOOL EXECUTORS

    private async checkAvailability(params: CheckAvailabilityParams) {
        const supabase = await createClient()
        const { data, error } = await supabase.rpc('get_available_slots', {
            p_data: params.date,
            p_duracao_minutos: params.duration_minutes
        })

        if (error) throw error
        return {
            success: true,
            slots: data || [],
            date: params.date
        }
    }


    private async createLead(params: CreateLeadParams, sessionId: string) {
        // Usar admin client para bypass de RLS em operações de escrita
        const supabase = createAdminClient()

        const { data, error } = await supabase
            .from('clientes')
            .insert({
                nome: params.name,
                telefone: params.phone,
                email: params.email,
                endereco_completo: params.address?.street || '',
                zip_code: params.address?.zip_code,
                notas: params.notes,
                status: 'lead',
                origem: 'website',
                origem_detalhe: 'carol-chat'
            })
            .select()
            .single()

        if (error) throw error

        // Vincular cliente à sessão
        await supabase
            .from('chat_sessions')
            .update({ cliente_id: data.id })
            .eq('id', sessionId)

        return { success: true, cliente_id: data.id }
    }

    private async createBooking(params: CreateBookingParams) {
        // Usar admin client para bypass de RLS em operações de escrita
        const supabase = createAdminClient()

        // 1. Re-validar disponibilidade no momento exato da criação para evitar conflitos
        const { data: availability, error: availError } = await supabase.rpc('get_available_slots', {
            p_data: params.date,
            p_duracao_minutos: params.duration_minutes
        })

        if (availError) throw availError

        const isStillAvailable = availability?.some((slot: any) =>
            slot.slot_inicio === (params.time_slot + ':00') && slot.disponivel
        )

        if (!isStillAvailable) {
            return {
                success: false,
                error: 'Horário não está mais disponível. Por favor, escolha outra opção.',
                suggest_refresh: true
            }
        }

        // 2. Calcular horário de fim para verificação de conflitos
        const [hours, minutes] = params.time_slot.split(':').map(Number)
        const startMinutes = hours * 60 + minutes
        const endMinutes = startMinutes + params.duration_minutes
        const endHours = Math.floor(endMinutes / 60)
        const endMins = endMinutes % 60
        const horarioFimEstimado = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}:00`

        // 3. Prosseguir com o agendamento
        const { data, error } = await supabase
            .from('agendamentos')
            .insert({
                cliente_id: params.cliente_id,
                data: params.date,
                horario_inicio: params.time_slot + ':00',
                horario_fim_estimado: horarioFimEstimado,
                tipo: params.service_type,
                duracao_minutos: params.duration_minutes,
                valor: params.total_price,
                status: 'agendado',
                notas: params.special_instructions
            })
            .select()
            .single()

        if (error) throw error
        return { success: true, booking_id: data.id }
    }

    private async checkZipCoverage(params: CheckZipCoverageParams) {
        const supabase = await createClient()
        const { data, error } = await supabase.rpc('check_zip_code_coverage', {
            p_zip_code: params.zip_code
        })

        if (error) throw error

        const result = data && data[0] ? data[0] : { atendido: false }
        return { success: true, covered: result.atendido }
    }

    private async findCustomer(params: { phone: string }) {
        const supabase = await createClient()

        // Buscar cliente por telefone (status != lead para ser considerado cliente ativo)
        const { data, error } = await supabase
            .from('clientes')
            .select('id, nome, telefone, endereco_completo, email, status')
            .eq('telefone', params.phone)
            .single()

        if (error || !data) {
            return {
                found: false,
                message: 'Cliente não encontrado com este telefone.'
            }
        }

        return {
            found: true,
            customer: {
                id: data.id,
                name: data.nome,
                phone: data.telefone,
                email: data.email,
                address: data.endereco_completo,
                status: data.status
            }
        }
    }
}

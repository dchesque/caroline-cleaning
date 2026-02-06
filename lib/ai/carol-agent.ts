// lib/ai/carol-agent.ts
import { openrouter, MODELS } from './openrouter'
import { CAROL_SYSTEM_PROMPT, TOOLS } from './prompts'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import type {
    ChatMessage,
    ChatResponse,
    CheckAvailabilityParams,
    CalculatePriceParams,
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

        const supabase = await createClient()

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

        // 2. Salvar mensagem do usuário
        const { error: saveUserError } = await supabase
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

        // 3. Preparar mensagens para o LLM
        const apiMessages: any[] = [
            { role: 'system', content: CAROL_SYSTEM_PROMPT },
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

            // 5. Salvar resposta final da Carol
            const { error: saveAssistantError } = await supabase
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

            // 6. Atualizar última atividade da sessão
            await supabase
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
                case 'calculate_price':
                    return await this.calculatePrice(params)
                case 'create_lead':
                    return await this.createLead(params, sessionId)
                case 'create_booking':
                    return await this.createBooking(params)
                case 'check_zip_coverage':
                    return await this.checkZipCoverage(params)
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

    private async calculatePrice(params: CalculatePriceParams) {
        const supabase = await createClient()
        const { data, error } = await supabase.rpc('calculate_service_price', {
            p_bedrooms: params.bedrooms,
            p_bathrooms: params.bathrooms,
            p_tipo_servico: params.service_type,
            p_frequencia: params.frequency || 'one_time'
        })

        if (error) throw error

        // Calcular add-ons manualmente (lógica de negócio frontend/agente)
        let addonsPrice = 0
        if (params.addons) {
            const addonPrices: Record<string, number> = {
                cabinets: 30,
                fridge: 35,
                oven: 30,
                laundry: 25,
                windows: 45
            }
            addonsPrice = params.addons.reduce((sum, addon) => sum + (addonPrices[addon] || 0), 0)
        }

        const basePrices = data && data[0] ? data[0] : { preco_sugerido: 0 }

        return {
            success: true,
            base_price: basePrices.preco_sugerido,
            addons_price: addonsPrice,
            total_price: (basePrices.preco_sugerido || 0) + addonsPrice,
            currency: 'USD',
            service_details: params
        }
    }

    private async createLead(params: CreateLeadParams, sessionId: string) {
        const supabase = await createClient()

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
        const supabase = await createClient()

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

        // 2. Prosseguir com o agendamento
        const { data, error } = await supabase
            .from('agendamentos')
            .insert({
                cliente_id: params.cliente_id,
                data: params.date,
                horario_inicio: params.time_slot + ':00',
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
}

// lib/ai/carol-agent.ts
import { openrouter, MODELS } from './openrouter'
import { buildCarolPrompt, CarolConfig, TOOLS } from './prompts'
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
     * Busca configurações dinâmicas do banco: horários e serviços
     */
    private async getSystemConfig(): Promise<CarolConfig> {
        const supabase = await createClient()

        // Buscar configs do sistema
        const { data: settings } = await supabase
            .from('business_settings')
            .select('chave, valor')
            .in('chave', ['operating_start', 'operating_end', 'booking_default_duration'])

        // Buscar serviços ativos
        const { data: services } = await supabase
            .from('servicos_tipos')
            .select('codigo, nome, duracao_base_minutos')
            .eq('ativo', true)
            .eq('disponivel_agendamento_online', true)
            .order('ordem', { ascending: true })

        // Montar config com valores padrão se não existirem
        const settingsMap = new Map(settings?.map(s => [s.chave, s.valor]) || [])

        return {
            services: services || [],
            operatingStart: settingsMap.get('operating_start') || '08:00',
            operatingEnd: settingsMap.get('operating_end') || '17:00',
            visitDuration: parseInt(settingsMap.get('booking_default_duration') || '60', 10)
        }
    }

    /**
     * Atualiza o contexto da sessão (memória persistente)
     */
    private async updateSessionContext(sessionId: string, updates: Record<string, any>) {
        const supabase = createAdminClient()

        // Buscar contexto atual
        const { data: session } = await supabase
            .from('chat_sessions')
            .select('contexto')
            .eq('id', sessionId)
            .single()

        const currentContext = session?.contexto || {}
        const newContext = { ...currentContext, ...updates }

        // Atualizar contexto
        await supabase
            .from('chat_sessions')
            .update({ contexto: newContext })
            .eq('id', sessionId)

        logger.info('Session context updated', { sessionId, updates })
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

        // 1.1 Buscar contexto da sessão (memória persistente)
        const { data: sessionData } = await supabase
            .from('chat_sessions')
            .select('contexto')
            .eq('id', sessionId)
            .single()

        const sessionContext = sessionData?.contexto || {}


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

        // Calcular primeiro horário disponível para hoje (+3h)
        const minTimeToday = new Date(today.getTime() + 3 * 60 * 60 * 1000)
        const minHour = minTimeToday.getHours()
        const firstAvailableSlot = minHour >= 17 ? 'NÃO DISPONÍVEL HOJE (após fechamento)' : `${String(minHour + (minTimeToday.getMinutes() > 0 ? 1 : 0)).padStart(2, '0')}:00`

        const dateContext = `
DATA E HORA ATUAL: ${today.toISOString().split('T')[0]} ${today.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} (${weekdays[today.getDay()]})

PRIMEIRO HORÁRIO DISPONÍVEL PARA HOJE: ${firstAvailableSlot}
NUNCA ofereça horários antes deste para o dia de hoje!

CALENDARÍO DOS PRÓXIMOS 7 DIAS:
${nextDays.join('\n')}

IMPORTANTE: Quando o cliente disser "próxima terça", "semana que vem", etc., use o calendário acima para calcular a data CORRETA.
Ao confirmar agendamento, SEMPRE informe: dia da semana + data (ex: "terça-feira, dia 10/02").
`

        // Gerar contexto de sessão para injetar no prompt
        let sessionContextStr = ''
        if (Object.keys(sessionContext).length > 0) {
            sessionContextStr = `\n\n📋 MEMÓRIA DA CONVERSA (use estas informações!):\n`
            if (sessionContext.cliente_id) sessionContextStr += `- Cliente ID: ${sessionContext.cliente_id}\n`
            if (sessionContext.cliente_nome) sessionContextStr += `- Nome: ${sessionContext.cliente_nome}\n`
            if (sessionContext.cliente_telefone) sessionContextStr += `- Telefone: ${sessionContext.cliente_telefone}\n`
            if (sessionContext.servico_selecionado) sessionContextStr += `- Serviço escolhido: ${sessionContext.servico_selecionado}\n`
            if (sessionContext.data_selecionada) sessionContextStr += `- Data escolhida: ${sessionContext.data_selecionada}\n`
            if (sessionContext.horario_selecionado) sessionContextStr += `- Horário escolhido: ${sessionContext.horario_selecionado}\n`
            sessionContextStr += `\nUSE o cliente_id acima ao chamar create_booking! NÃO peça o telefone novamente!\n`
        }

        // Buscar configurações dinâmicas
        const config = await this.getSystemConfig()
        const systemPrompt = buildCarolPrompt(config)

        const apiMessages: any[] = [
            { role: 'system', content: systemPrompt + '\n\n' + dateContext + sessionContextStr },
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
            let result: any

            switch (name) {
                case 'check_availability':
                    result = await this.checkAvailability(params)
                    // Salvar data selecionada no contexto
                    if (result.success && params.date) {
                        await this.updateSessionContext(sessionId, {
                            data_selecionada: params.date
                        })
                    }
                    return result

                case 'create_lead':
                    result = await this.createLead(params, sessionId)
                    // Salvar dados do novo lead no contexto
                    if (result.success && result.cliente_id) {
                        await this.updateSessionContext(sessionId, {
                            cliente_id: result.cliente_id,
                            cliente_nome: params.name,
                            cliente_telefone: params.phone
                        })
                    }
                    return result

                case 'create_booking':
                    result = await this.createBooking(params)
                    // Salvar dados do agendamento no contexto
                    if (result.success) {
                        await this.updateSessionContext(sessionId, {
                            agendamento_confirmado: true,
                            agendamento_id: result.booking_id,
                            horario_selecionado: params.time || params.time_slot
                        })
                    }
                    return result

                case 'check_zip_coverage':
                    return await this.checkZipCoverage(params)

                case 'find_customer':
                    result = await this.findCustomer(params)
                    // IMPORTANTE: Salvar dados do cliente no contexto para não esquecer!
                    if (result.found && result.cliente_id) {
                        await this.updateSessionContext(sessionId, {
                            cliente_id: result.cliente_id,
                            cliente_nome: result.customer?.name,
                            cliente_telefone: result.customer?.phone
                        })
                    }
                    return result

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

        // Filtrar apenas slots disponíveis (disponivel = true)
        const now = new Date()
        const todayStr = now.toISOString().split('T')[0]
        let availableSlots = (data || []).filter((s: { disponivel: boolean }) => s.disponivel)

        // Se for hoje, filtrar slots passados (+3h)
        if (params.date === todayStr) {
            const minTime = new Date(now.getTime() + 3 * 60 * 60 * 1000)
            const minHour = minTime.getHours()
            const minMinutes = minTime.getMinutes()

            availableSlots = availableSlots.filter((slot: { slot_inicio: string }) => {
                const timeParts = slot.slot_inicio.split(':')
                const slotHour = parseInt(timeParts[0], 10)
                const slotMin = parseInt(timeParts[1], 10)
                return slotHour > minHour || (slotHour === minHour && slotMin >= minMinutes)
            })
        }

        // Formatar para resposta
        const formattedSlots = availableSlots.map((s: { slot_inicio: string, slot_fim: string }) => ({
            horario: s.slot_inicio.substring(0, 5),
            horario_fim: s.slot_fim.substring(0, 5)
        }))

        return {
            success: true,
            slots: formattedSlots,
            date: params.date,
            message: formattedSlots.length === 0
                ? 'Não há horários disponíveis para esta data.'
                : `Horários disponíveis: ${formattedSlots.map((s: { horario: string }) => s.horario).join(', ')}`
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

    private async createBooking(params: CreateBookingParams & { time?: string }) {
        // Usar admin client para bypass de RLS em operações de escrita
        const supabase = createAdminClient()

        // Suportar tanto `time` quanto `time_slot` (a IA pode enviar qualquer um)
        const timeSlot = params.time_slot || params.time
        if (!timeSlot) {
            return {
                success: false,
                error: 'Horário não informado. Por favor, informe o horário desejado.'
            }
        }

        // 1. Re-validar disponibilidade no momento exato da criação para evitar conflitos
        const { data: availability, error: availError } = await supabase.rpc('get_available_slots', {
            p_data: params.date,
            p_duracao_minutos: params.duration_minutes
        })

        if (availError) throw availError

        // Normalizar formato do horário para comparação (slot_inicio pode ter segundos)
        const normalizedTime = timeSlot.length === 5 ? timeSlot + ':00' : timeSlot
        const isStillAvailable = availability?.some((slot: any) =>
            slot.slot_inicio === normalizedTime && slot.disponivel
        )

        if (!isStillAvailable) {
            return {
                success: false,
                error: 'Horário não está mais disponível. Por favor, escolha outra opção.',
                suggest_refresh: true
            }
        }

        // 2. Calcular horário de fim para verificação de conflitos
        const [hours, minutes] = timeSlot.split(':').map(Number)
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
                horario_inicio: normalizedTime,
                horario_fim_estimado: horarioFimEstimado,
                tipo: params.service_type,
                duracao_minutos: params.duration_minutes,
                valor: params.total_price || 0,
                status: 'agendado',
                notas: params.special_instructions
            })
            .select()
            .single()

        if (error) throw error
        return {
            success: true,
            booking_id: data.id,
            message: `Agendamento criado com sucesso! ID: ${data.id}`
        }
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

        // IMPORTANTE: Retornar cliente_id em destaque para a IA usar corretamente
        return {
            found: true,
            cliente_id: data.id, // USE ESTE ID ao chamar create_booking!
            customer: {
                id: data.id,
                name: data.nome,
                phone: data.telefone,
                email: data.email,
                address: data.endereco_completo,
                status: data.status
            },
            instrucao: `IMPORTANTE: Para agendar, use cliente_id="${data.id}" no create_booking.`
        }
    }
}

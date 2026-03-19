import { openrouter } from './openrouter'
import { buildCarolPrompt, CarolConfig, TOOLS } from './prompts'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { env } from '@/lib/env'
import type {
    ChatMessage,
    ChatResponse,
    CheckAvailabilityParams,
    CreateLeadParams,
    CreateBookingParams,
    CheckZipCoverageParams,
    UpdatePreferenceParams,
    ToolCall
} from '@/types/carol'

export class CarolAgent {
    private model: string
    private executionLogs: string[] = []

    constructor(model: string = env.defaultModel) {
        this.model = model
    }

    /**
     * Extrai ZIP code de um endereÃ§o (Ãºltimos 5 dÃ­gitos numÃ©ricos)
     */
    private extractZipCode(address: string): string | undefined {
        if (!address) return undefined
        // Procura por padrÃ£o de ZIP americano: 5 dÃ­gitos, opcionalmente com -4 dÃ­gitos extras
        const match = address.match(/\b(\d{5})(-\d{4})?\b/)
        return match ? match[1] : undefined
    }

    /**
     * Grava logs tÃ©cnicos tanto no logger global quanto no acumulador da sessÃ£o
     */
    private trace(message: string, context?: Record<string, any>, level: 'info' | 'debug' | 'error' = 'info') {
        const timestamp = new Date().toISOString()
        const logEntry = `[${timestamp}] ${level.toUpperCase()}: ${message} ${context ? JSON.stringify(context) : ''}`
        this.executionLogs.push(logEntry)

        // Propagar para o logger global
        if (level === 'info') logger.info(message, context)
        else if (level === 'debug') logger.debug(message, context)
        else if (level === 'error') logger.error(message, context)
    }

    /**
     * Busca configuraÃ§Ãµes dinÃ¢micas do banco: horÃ¡rios e serviÃ§os
     */
    private async getSystemConfig(): Promise<CarolConfig> {
        const supabase = await createClient()

        // Buscar configs do sistema
        const { data: settings } = await supabase
            .from('business_settings')
            .select('chave, valor')
            .in('chave', ['operating_start', 'operating_end', 'booking_default_duration'])

        // Buscar serviÃ§os ativos
        const { data: services } = await supabase
            .from('servicos_tipos')
            .select('codigo, nome, duracao_base_minutos')
            .eq('ativo', true)
            .eq('disponivel_agendamento_online', true)
            .order('ordem', { ascending: true })

        // Montar config com valores padrÃ£o se nÃ£o existirem
        const settingsMap = new Map(settings?.map(s => [s.chave, s.valor]) || [])

        return {
            services: services || [],
            operatingStart: settingsMap.get('operating_start') || '08:00',
            operatingEnd: settingsMap.get('operating_end') || '17:00',
            visitDuration: parseInt(settingsMap.get('booking_default_duration') || '60', 10)
        }
    }

    /**
     * Atualiza o contexto da sessÃ£o (memÃ³ria persistente)
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

        this.trace('Session context updated', { sessionId, updates })
    }


    /**
     * Processa uma mensagem do usuÃ¡rio e retorna a resposta da Carol
     */
    async chat(message: string, sessionId: string): Promise<ChatResponse> {
        this.trace('Carol processing message', { sessionId, messageLength: message.length })

        const supabase = await createClient() // Para leitura
        const adminSupabase = createAdminClient() // Para escrita (bypass RLS)

        // 1. Buscar histÃ³rico da conversa (Ãºltimas 20 mensagens)
        const { data: history, error: historyError } = await supabase
            .from('mensagens_chat')
            .select('role, content, created_at')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true })
            .limit(20)

        if (historyError) {
            this.trace('Error fetching chat history', { sessionId, error: historyError }, 'error')
        }

        // 1.1 Buscar contexto da sessÃ£o (memÃ³ria persistente)
        const { data: sessionData } = await supabase
            .from('chat_sessions')
            .select('contexto')
            .eq('id', sessionId)
            .single()

        const sessionContext = sessionData?.contexto || {}


        // 2. Salvar mensagem do usuÃ¡rio (usando admin para bypass RLS)
        const { error: saveUserError } = await adminSupabase
            .from('mensagens_chat')
            .insert({
                session_id: sessionId,
                role: 'user',
                content: message,
                source: 'website'
            })

        if (saveUserError) {
            this.trace('Error saving user message', { sessionId, error: saveUserError }, 'error')
        }

        // 3. Preparar mensagens para o LLM com data atual e contexto de dias
        const nowInNyStr = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
        const today = new Date(nowInNyStr)
        const weekdays = ['domingo', 'segunda-feira', 'terÃ§a-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sÃ¡bado']

        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const nyIsoDate = `${yyyy}-${mm}-${dd}`;

        // Gerar os prÃ³ximos 7 dias com dia da semana
        const nextDays = []
        for (let i = 0; i < 7; i++) {
            const date = new Date(today)
            date.setDate(date.getDate() + i)
            const dayName = weekdays[date.getDay()]
            const formatted = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
            const isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            nextDays.push(`${dayName} = ${formatted} (${isoDate})`)
        }

        // Calcular primeiro horÃ¡rio disponÃ­vel para hoje (+3h)
        const minTimeToday = new Date(today.getTime() + 3 * 60 * 60 * 1000)
        const minHour = minTimeToday.getHours()
        const firstAvailableSlot = minHour >= 17 ? 'NÃƒO DISPONÃVEL HOJE (apÃ³s fechamento)' : `${String(minHour + (minTimeToday.getMinutes() > 0 ? 1 : 0)).padStart(2, '0')}:00`

        const dateContext = `
DATA E HORA ATUAL: ${nyIsoDate} ${today.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} (${weekdays[today.getDay()]})

PRIMEIRO HORÃRIO DISPONÃVEL PARA HOJE: ${firstAvailableSlot}
NUNCA ofereÃ§a horÃ¡rios antes deste para o dia de hoje!

CALENDARÃO DOS PRÃ“XIMOS 7 DIAS:
${nextDays.join('\n')}

IMPORTANTE: Quando o cliente disser "prÃ³xima terÃ§a", "semana que vem", etc., use o calendÃ¡rio acima para calcular a data CORRETA.
Ao confirmar agendamento, SEMPRE informe: dia da semana + data (ex: "terÃ§a-feira, dia 10/02").
`

        // Gerar contexto de sessÃ£o para injetar no prompt
        let sessionContextStr = ''
        if (Object.keys(sessionContext).length > 0) {
            sessionContextStr = `\n\nðŸ“‹ MEMÃ“RIA DA CONVERSA (use estas informaÃ§Ãµes!):\n`
            if (sessionContext.cliente_id) sessionContextStr += `- Cliente ID: ${sessionContext.cliente_id}\n`
            if (sessionContext.cliente_nome) sessionContextStr += `- Nome: ${sessionContext.cliente_nome}\n`
            if (sessionContext.cliente_telefone) sessionContextStr += `- Telefone: ${sessionContext.cliente_telefone}\n`
            if (sessionContext.servico_selecionado) sessionContextStr += `- ServiÃ§o escolhido: ${sessionContext.servico_selecionado}\n`
            if (sessionContext.data_selecionada) sessionContextStr += `- Data escolhida: ${sessionContext.data_selecionada}\n`
            if (sessionContext.horario_selecionado) sessionContextStr += `- HorÃ¡rio escolhido: ${sessionContext.horario_selecionado}\n`
            sessionContextStr += `\nUSE o cliente_id acima ao chamar create_booking! NÃƒO peÃ§a o telefone novamente!\n`
        }

        const config = await this.getSystemConfig()
        const systemPrompt = buildCarolPrompt(config)

        if (process.env.NODE_ENV === 'development') {
            console.group(`ðŸ¤– CAROL CHAT - ${sessionId}`)
            this.trace('Context constructed', {
                dateContext: dateContext.trim(),
                sessionContext: sessionContextStr.trim()
            }, 'debug')
        }

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
                    this.trace('Carol deciding to use tools', {
                        sessionId,
                        tools: (assistantMessage.tool_calls as any[]).map(tc => tc.function?.name)
                    })

                    for (const toolCall of assistantMessage.tool_calls) {
                        const toolResult = await this.executeTool(toolCall as unknown as ToolCall, sessionId)
                        toolCallsExecuted++

                        this.trace('Tool execution result', {
                            tool: (toolCall as any).function?.name,
                            result: toolResult
                        }, 'debug')

                        currentMessages.push({
                            role: 'tool',
                            tool_call_id: toolCall.id,
                            content: JSON.stringify(toolResult)
                        })
                    }
                    // Loop continua para a IA processar os resultados das tools
                } else {
                    finalContent = assistantMessage.content || ''
                    this.trace('Carol generated final response', {
                        sessionId,
                        charCount: finalContent.length
                    })
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
                    source: 'website',
                    execution_logs: this.executionLogs.join('\n')
                })

            if (saveAssistantError) {
                this.trace('Error saving assistant message', { sessionId, error: saveAssistantError }, 'error')
            }

            // 6. Atualizar Ãºltima atividade da sessÃ£o (usando admin para bypass RLS)
            await adminSupabase
                .from('chat_sessions')
                .upsert({
                    id: sessionId,
                    last_activity: new Date().toISOString(),
                    status: 'active'
                })

            if (process.env.NODE_ENV === 'development') {
                console.groupEnd()
            }

            return {
                message: finalContent,
                session_id: sessionId,
                tool_calls_executed: toolCallsExecuted,
                timestamp: new Date().toISOString()
            }

        } catch (error) {
            this.trace('Carol Agent chat error', { sessionId, error }, 'error')
            throw error
        }
    }

    /**
     * Roteador de execuÃ§Ã£o de ferramentas
     */
    private async executeTool(toolCall: ToolCall, sessionId: string) {
        const { name, arguments: argsString } = toolCall.function
        const params = JSON.parse(argsString)

        this.trace('Executing tool', { toolName: name, sessionId, params })

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
                            cliente_telefone: params.phone,
                            cliente_endereco: params.address,
                            cliente_zip: params.zip_code
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

                case 'update_communication_preference':
                    return await this.updateCommunicationPreference(params, sessionId)

                default:
                    return { error: `Tool ${name} not implemented` }
            }
        } catch (error) {
            this.trace('Tool execution error', { toolName: name, sessionId, error }, 'error')
            return { error: 'Failed to execute tool' }
        }
    }

    // TOOL EXECUTORS

    private async checkAvailability(params: CheckAvailabilityParams) {
        this.trace('checkAvailability called', { date: params.date, duration: params.duration_minutes })

        const supabase = await createClient()
        const { data, error } = await supabase.rpc('get_available_slots', {
            p_data: params.date,
            p_duracao_minutos: params.duration_minutes
        })

        if (error) {
            this.trace('checkAvailability RPC error', { error }, 'error')
            throw error
        }

        // Log resultado bruto para debug
        const totalSlots = data?.length || 0
        const occupiedSlots = (data || []).filter((s: { disponivel: boolean }) => !s.disponivel)
        this.trace('checkAvailability raw result', {
            totalSlots,
            occupiedCount: occupiedSlots.length,
            occupiedTimes: occupiedSlots.map((s: { slot_inicio: string }) => s.slot_inicio.substring(0, 5))
        })

        // Filtrar apenas slots disponÃ­veis (disponivel = true)
        const nowInNyStr = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
        const now = new Date(nowInNyStr);
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        let availableSlots = (data || []).filter((s: { disponivel: boolean }) => s.disponivel)

        // Se for hoje, filtrar slots passados (+3h)
        if (params.date === todayStr) {
            const minTime = new Date(now.getTime() + 3 * 60 * 60 * 1000)
            const minHour = minTime.getHours()
            const minMinutes = minTime.getMinutes()

            const beforeFilter = availableSlots.length
            availableSlots = availableSlots.filter((slot: { slot_inicio: string }) => {
                const timeParts = slot.slot_inicio.split(':')
                const slotHour = parseInt(timeParts[0], 10)
                const slotMin = parseInt(timeParts[1], 10)
                return slotHour > minHour || (slotHour === minHour && slotMin >= minMinutes)
            })
            this.trace('Filtered past slots for today', { beforeFilter, afterFilter: availableSlots.length, minHour })
        }

        // Formatar para resposta
        const formattedSlots = availableSlots.map((s: { slot_inicio: string, slot_fim: string }) => ({
            horario: s.slot_inicio.substring(0, 5),
            horario_fim: s.slot_fim.substring(0, 5)
        }))

        this.trace('checkAvailability result', { availableCount: formattedSlots.length })

        return {
            success: true,
            slots: formattedSlots,
            date: params.date,
            message: formattedSlots.length === 0
                ? 'NÃ£o hÃ¡ horÃ¡rios disponÃ­veis para esta data.'
                : `HorÃ¡rios disponÃ­veis: ${formattedSlots.map((s: { horario: string }) => s.horario).join(', ')}`
        }
    }


    private async createLead(params: CreateLeadParams, sessionId: string) {
        // Usar admin client para bypass de RLS em operaÃ§Ãµes de escrita
        const supabase = createAdminClient()

        // Tentar extrair ZIP do endereÃ§o se nÃ£o foi fornecido
        let zipCode = params.zip_code
        if (!zipCode && params.address) {
            zipCode = this.extractZipCode(params.address)
            if (zipCode) {
                this.trace('ZIP extracted from address', { address: params.address, extractedZip: zipCode })
            }
        }

        // Verificar cobertura do ZIP antes de criar o lead
        if (zipCode) {
            const coverageResult = await this.checkZipCoverage({ zip_code: zipCode })
            this.trace('ZIP coverage check in createLead', { zipCode, covered: coverageResult.covered })

            if (!coverageResult.covered) {
                return {
                    success: false,
                    error: `Desculpe, ainda nÃ£o atendemos a regiÃ£o do CEP ${zipCode}. Atualmente atendemos Fort Mill (SC), Charlotte (NC) e cidades prÃ³ximas.`,
                    zip_not_covered: true
                }
            }
        }

        const { data, error } = await supabase
            .from('clientes')
            .insert({
                nome: params.name,
                telefone: params.phone,
                email: params.email,
                endereco_completo: params.address || '',
                zip_code: zipCode,
                notas: params.notes,
                status: 'lead',
                origem: 'website',
                origem_detalhe: 'carol-chat',
                canal_preferencia: params.canal_preferencia || 'sms'
            })
            .select()
            .single()

        if (error) throw error

        this.trace('Lead created successfully', { clienteId: data.id, name: params.name, zipCode })

        // Vincular cliente Ã  sessÃ£o
        await supabase
            .from('chat_sessions')
            .update({ cliente_id: data.id })
            .eq('id', sessionId)

        return { success: true, cliente_id: data.id }
    }

    private async createBooking(params: CreateBookingParams & { time?: string }) {
        // Usar admin client para bypass de RLS em operaÃ§Ãµes de escrita
        const supabase = createAdminClient()

        // Suportar tanto `time` quanto `time_slot` (a IA pode enviar qualquer um)
        const timeSlot = params.time_slot || params.time
        if (!timeSlot) {
            return {
                success: false,
                error: 'HorÃ¡rio nÃ£o informado. Por favor, informe o horÃ¡rio desejado.'
            }
        }

        // 1. Re-validar disponibilidade no momento exato da criaÃ§Ã£o para evitar conflitos
        const { data: availability, error: availError } = await supabase.rpc('get_available_slots', {
            p_data: params.date,
            p_duracao_minutos: params.duration_minutes
        })

        if (availError) throw availError

        // Normalizar formato do horÃ¡rio para comparaÃ§Ã£o (slot_inicio pode ter segundos)
        const normalizedTime = timeSlot.length === 5 ? timeSlot + ':00' : timeSlot
        const isStillAvailable = availability?.some((slot: any) =>
            slot.slot_inicio === normalizedTime && slot.disponivel
        )

        if (!isStillAvailable) {
            return {
                success: false,
                error: 'HorÃ¡rio nÃ£o estÃ¡ mais disponÃ­vel. Por favor, escolha outra opÃ§Ã£o.',
                suggest_refresh: true
            }
        }

        // 2. Calcular horÃ¡rio de fim para verificaÃ§Ã£o de conflitos
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
                notas: params.special_instructions,
                canal_preferencia: params.canal_preferencia || 'sms'
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
        this.trace('checkZipCoverage called', { zipCode: params.zip_code })

        const supabase = await createClient()
        const { data, error } = await supabase.rpc('check_zip_code_coverage', {
            p_zip_code: params.zip_code
        })

        if (error) {
            this.trace('checkZipCoverage RPC error', { error }, 'error')
            throw error
        }

        const result = data && data[0] ? data[0] : { atendido: false }
        this.trace('checkZipCoverage result', { zipCode: params.zip_code, covered: result.atendido, areaName: result.area_nome })

        return {
            success: true,
            covered: result.atendido,
            area_name: result.area_nome || null,
            message: result.atendido
                ? `Ã“timo! Atendemos a regiÃ£o de ${result.area_nome || 'sua Ã¡rea'}!`
                : `Desculpe, nÃ£o atendemos o CEP ${params.zip_code} no momento.`
        }
    }

    private async findCustomer(params: { phone: string }) {
        const supabase = await createClient()

        // Get today's date in New York timezone as an ISO string (YYYY-MM-DD)
        const nowInNyStr = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
        const todayStr = new Date(nowInNyStr).toISOString().split('T')[0]

        const { data, error } = await supabase
            .from('clientes')
            .select(`
                id, nome, telefone, endereco_completo, email, status,
                agendamentos (id, data, horario_inicio, horario_fim_estimado, status, tipo)
            `)
            .eq('telefone', params.phone)
            .single()

        if (error || !data) {
            return {
                found: false,
                message: 'Cliente nÃ£o encontrado com este telefone.'
            }
        }

        // Filter and map agendamentos to show upcoming ones
        let agendamentos_futuros: any[] = []
        if (data.agendamentos && Array.isArray(data.agendamentos)) {
            agendamentos_futuros = data.agendamentos
                .filter(a => a.status !== 'cancelado' && a.data >= todayStr)
                .sort((a, b) => a.data.localeCompare(b.data) || a.horario_inicio.localeCompare(b.horario_inicio))
                .slice(0, 5) // Limit to next 5 upcoming
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
                status: data.status,
                agendamentos_futuros: agendamentos_futuros.length > 0 ? agendamentos_futuros : 'Nenhum agendamento futuro encontrado.'
            },
            instrucao: `IMPORTANTE: Para agendar um novo horário, use cliente_id="${data.id}" no create_booking. Atenção aos agendamentos futuros para evitar sobreposição no mesmo dia.`
        }
    }

    private async updateCommunicationPreference(params: UpdatePreferenceParams, sessionId: string) {
        this.trace('updateCommunicationPreference called', { preference: params.canal_preferencia, sessionId })

        // Usar admin client para bypass de RLS em operações de escrita
        const supabase = createAdminClient()

        // Buscar a memória da sessão para saber o agendamento atual
        const { data: sessionData } = await supabase
            .from('chat_sessions')
            .select('contexto')
            .eq('id', sessionId)
            .single()

        const sessionContext = sessionData?.contexto || {}

        if (sessionContext.agendamento_id) {
            const { error: agendamentoError } = await supabase
                .from('agendamentos')
                .update({ canal_preferencia: params.canal_preferencia })
                .eq('id', sessionContext.agendamento_id)

            if (agendamentoError) {
                this.trace('Error updating agendamento preference', { error: agendamentoError }, 'error')
            }
        }

        if (sessionContext.cliente_id) {
            const { error: clienteError } = await supabase
                .from('clientes')
                .update({ canal_preferencia: params.canal_preferencia })
                .eq('id', sessionContext.cliente_id)

            if (clienteError) {
                this.trace('Error updating cliente preference', { error: clienteError }, 'error')
            }
        }

        this.trace('Communication preference updated successfully', { preference: params.canal_preferencia })

        return {
            success: true,
            message: `Preferência de comunicação atualizada para ${params.canal_preferencia} com sucesso!`
        }
    }
}



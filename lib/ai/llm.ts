// lib/ai/llm.ts
import { openrouter } from './openrouter'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'

// ═══ TYPES ═══

export interface LLMCallRecord {
  type: 'extract' | 'classify' | 'generate' | 'faq'
  model: string
  prompt_preview: string
  tokens_used?: number
  prompt_tokens?: number
  completion_tokens?: number
  duration_ms: number
}

export type ExtractionType =
  | 'phone'
  | 'name'
  | 'address'
  | 'date'
  | 'time'
  | 'service_type'
  | 'preference'
  | 'correction'
  | 'appointment_selection'
  | 'callback_time'
  | 'client_update'
  | 'pet_info'
  | 'allergy_info'

// ═══ EXTRACTION PROMPTS ═══

function getExtractionPrompt(type: ExtractionType, extraContext?: any): string {
  const base = 'You are a data extraction assistant. Return ONLY valid JSON, no extra text.'

  switch (type) {
    case 'phone':
      return `${base} Extract a US phone number from the message. Return {"phone": "1234567890"} with 10 digits only, no formatting. If no valid phone found, return {"phone": null}.`

    case 'name':
      return `${base} Extract the person's name from the message. Return {"name": "First Last"} or {"name": null} if no name found.`

    case 'address':
      return `${base} Extract the full street address and ZIP code. Return {"address": "full address here", "zip_code": "12345"}. Use null for any field not found.`

    case 'date': {
      const now = new Date()
      const eastern = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
      const days: string[] = []
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      for (let i = 0; i < 7; i++) {
        const d = new Date(eastern)
        d.setDate(d.getDate() + i)
        const yyyy = d.getFullYear()
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        days.push(`${dayNames[d.getDay()]} ${yyyy}-${mm}-${dd}`)
      }
      return `${base} Extract the date from the message. Today is ${days[0]} (America/New_York). Next 7 days: ${days.join(', ')}. Resolve relative dates like "tomorrow", "next friday", etc. Return {"date": "YYYY-MM-DD"} or {"date": null} if no date found.`
    }

    case 'time':
      return `${base} Extract the time from the message. Return {"time": "HH:MM"} in 24h format. If no time found, return {"time": null}.`

    case 'service_type':
      return `${base} Extract the cleaning service type. Options: "regular" (recurring/weekly/biweekly), "deep" (deep clean/spring clean), "move_in_out" (move in/move out), "visit" (first visit/evaluation). Return {"service_type": "type"} or {"service_type": null}.`

    case 'preference':
      return `${base} Detect if the user prefers SMS or WhatsApp for communication. Return {"canal": "sms"}, {"canal": "whatsapp"}, or {"canal": null} if unclear.`

    case 'correction':
      return `${base} The user is correcting previously provided info. Detect which field they are correcting and the new value. Fields: phone, address, date, time, name. Return {"field": "field_name", "new_value": "corrected value"} or {"field": null, "new_value": null}.`

    case 'appointment_selection': {
      const appointments = extraContext?.appointments
        ? JSON.stringify(extraContext.appointments)
        : '[]'
      return `${base} The user is selecting an appointment from this list: ${appointments}. Identify which one by ID or list index (1-based). Return {"appointment_id": "id_here", "index": 1} or {"appointment_id": null, "index": null} if unclear.`
    }

    case 'callback_time':
      return `${base} Extract the preferred callback time from the message. Return {"time": "HH:MM"} in 24h format or {"time": null} if not specified.`

    case 'client_update':
      return `${base} Extract fields the user wants to update. Possible fields: name, phone, address, email. Return {"updates": {"field": "new_value"}} with only the fields mentioned. Return {"updates": {}} if none found.`

    case 'pet_info':
      return `${base} Extract pet information from the message. Return {"pets": "description of pets", "details": "any special notes"} or {"pets": null} if no pet info found.`

    case 'allergy_info':
      return `${base} Extract allergy or sensitivity information from the message. Return {"allergies": "description of allergies", "details": "any special notes"} or {"allergies": null} if no allergy info found.`

    default:
      return base
  }
}

// ═══ RESPONSE TEMPLATES ═══

const RESPONSE_TEMPLATES: Record<string, (data: any, lang: 'pt' | 'en') => string> = {
  'ask_phone': (_data, lang) => lang === 'pt'
    ? 'Cumprimente e peça o telefone de forma amigável. Max 2 frases.'
    : 'Greet and ask for phone number in a friendly way. Max 2 sentences.',

  'confirm_phone': (data, lang) => lang === 'pt'
    ? `Confirme o telefone ${data.phone} de forma amigável. Peça confirmação.`
    : `Confirm the phone number ${data.phone} in a friendly way. Ask for confirmation.`,

  'greet_returning': (data, lang) => lang === 'pt'
    ? `Cumprimente ${data.name} como cliente que voltou. Pergunte como pode ajudar. Max 2 frases.`
    : `Greet ${data.name} as a returning customer. Ask how you can help. Max 2 sentences.`,

  'ask_name': (_data, lang) => lang === 'pt'
    ? 'Peça o nome da pessoa de forma amigável. Max 2 frases.'
    : 'Ask for the person\'s name in a friendly way. Max 2 sentences.',

  'explain_first_visit': (data, lang) => lang === 'pt'
    ? `Explique a ${data.name || 'o cliente'} que a primeira visita é gratuita para avaliação do imóvel. Peça o endereço completo com ZIP. Max 3 frases.`
    : `Explain to ${data.name || 'the customer'} that the first visit is free for property evaluation. Ask for the full address with ZIP. Max 3 sentences.`,

  'ask_address_again': (_data, lang) => lang === 'pt'
    ? 'Não entendeu o endereço. Peça novamente com rua, número, cidade e CEP. Max 2 frases.'
    : 'Did not understand the address. Ask again with street, number, city and ZIP. Max 2 sentences.',

  'ask_zip': (_data, lang) => lang === 'pt'
    ? 'Peça o código postal (ZIP code). Max 1-2 frases.'
    : 'Ask for the ZIP code. Max 1-2 sentences.',

  'zip_not_covered': (_data, lang) => lang === 'pt'
    ? 'Informe que não atendemos essa região. Atendemos Charlotte NC, Fort Mill SC e arredores. Lamente de forma simpática. Max 2 frases.'
    : 'Inform that we don\'t cover this area. We serve Charlotte NC, Fort Mill SC and surrounding areas. Apologize kindly. Max 2 sentences.',

  'ask_intent': (data, lang) => lang === 'pt'
    ? `Pergunte a ${data.name || 'o cliente'} como pode ajudar. Pode agendar, cancelar, reagendar ou tirar dúvidas. Max 2 frases.`
    : `Ask ${data.name || 'the customer'} how you can help. Can schedule, cancel, reschedule or answer questions. Max 2 sentences.`,

  'max_retries_phone': (_data, lang) => lang === 'pt'
    ? 'Não conseguimos capturar o telefone. Peça desculpas e ofereça tentar novamente ou ligar para nós. Max 2 frases.'
    : 'We couldn\'t capture the phone number. Apologize and offer to try again or call us directly. Max 2 sentences.',

  'confirm_address': (data, lang) => lang === 'pt'
    ? `Mostre o endereço: ${data.address}. Pergunte se está correto. Max 2 frases.`
    : `Show the address: ${data.address}. Ask if it's correct. Max 2 sentences.`,

  'ask_service_type': (_data, lang) => lang === 'pt'
    ? 'Liste os serviços: Limpeza Regular, Limpeza Profunda, Mudança (entrada/saída), Visita de avaliação. Pergunte qual desejam. Max 3 frases.'
    : 'List services: Regular Cleaning, Deep Cleaning, Move In/Out Cleaning, Evaluation Visit. Ask which one they\'d like. Max 3 sentences.',

  'ask_date': (_data, lang) => lang === 'pt'
    ? 'Pergunte qual data preferem para o agendamento. Max 2 frases.'
    : 'Ask what date they prefer for the appointment. Max 2 sentences.',

  'invalid_date': (_data, lang) => lang === 'pt'
    ? 'Não conseguiu entender a data. Peça novamente com exemplo (ex: próxima sexta, 04/15). Max 2 frases.'
    : 'Could not understand the date. Ask again with an example (e.g., next Friday, 04/15). Max 2 sentences.',

  'date_is_sunday': (_data, lang) => lang === 'pt'
    ? 'Informe que não trabalhamos aos domingos. Peça outra data. Max 2 frases.'
    : 'Inform that we don\'t work on Sundays. Ask for another date. Max 2 sentences.',

  'date_in_past': (_data, lang) => lang === 'pt'
    ? 'Informe que a data já passou. Peça uma data futura. Max 2 frases.'
    : 'Inform that the date is in the past. Ask for a future date. Max 2 sentences.',

  'ask_time': (data, lang) => {
    const timeList = data.available_times || (data.slots || []).map((s: any) => s.time).join(', ')
    return lang === 'pt'
      ? `Mostre os horários disponíveis para ${data.date}: ${timeList}. Pergunte qual preferem. Max 3 frases.`
      : `Show available time slots for ${data.date}: ${timeList}. Ask which one they prefer. Max 3 sentences.`
  },

  'invalid_time': (data, lang) => {
    const timeList = data.available_times || (data.slots || []).map((s: any) => s.time).join(', ')
    return lang === 'pt'
      ? `Horário não reconhecido. Horários disponíveis: ${timeList}. Peça para escolher um. Max 2 frases.`
      : `Time not recognized. Available times: ${timeList}. Ask to choose one. Max 2 sentences.`
  },

  'time_not_available': (_data, lang) => lang === 'pt'
    ? 'Informe que esse horário não está disponível. Peça outro horário. Max 2 frases.'
    : 'Inform that this time is not available. Ask for another time. Max 2 sentences.',

  'booking_conflict': (_data, lang) => lang === 'pt'
    ? 'Esse horário já não está mais disponível. Peça para escolher outro horário ou outra data. Max 2 frases.'
    : 'That time slot is no longer available. Ask to choose another time or date. Max 2 sentences.',

  'need_address': (_data, lang) => lang === 'pt'
    ? 'Explique que precisamos do endereço antes de agendar. Peça o endereço. Max 2 frases.'
    : 'Explain that we need the address before scheduling. Ask for the address. Max 2 sentences.',

  'booking_error': (_data, lang) => lang === 'pt'
    ? 'Houve um erro ao agendar. Peça desculpas e peça para tentar novamente. Max 2 frases.'
    : 'There was an error booking. Apologize and ask to try again. Max 2 sentences.',

  'no_slots_alternatives': (data, lang) => {
    const dayList = (data.days || [])
      .map((d: any) => `${d.day_name} (${d.date}): ${(d.slots || []).length} slots`)
      .join('\n')
    return lang === 'pt'
      ? `Essa data não tem horários. Sugira estas alternativas:\n${dayList}\nMax 3 frases.`
      : `That date has no slots. Suggest these alternatives:\n${dayList}\nMax 3 sentences.`
  },

  'no_slots_at_all': (_data, lang) => lang === 'pt'
    ? 'Não há horários disponíveis no momento. Peça desculpas e sugira ligar para nós. Max 2 frases.'
    : 'No slots available at the moment. Apologize and suggest calling us. Max 2 sentences.',

  'confirm_summary': (data, lang) => lang === 'pt'
    ? `Mostre o resumo do agendamento:\n- Nome: ${data.name}\n- Telefone: ${data.phone}\n- Endereço: ${data.address}\n- Data: ${data.date}\n- Horário: ${data.time}\n- Serviço: ${data.service}\nPergunte se está tudo certo e se prefere SMS ou WhatsApp. Max 4 frases.`
    : `Show the booking summary:\n- Name: ${data.name}\n- Phone: ${data.phone}\n- Address: ${data.address}\n- Date: ${data.date}\n- Time: ${data.time}\n- Service: ${data.service}\nAsk if everything is correct and if they prefer SMS or WhatsApp. Max 4 sentences.`,

  'booking_correction': (data, lang) => lang === 'pt'
    ? `O cliente quer corrigir algo${data.field ? ' (' + data.field + ')' : ''}. Pergunte o que deseja alterar. Max 2 frases.`
    : `The customer wants to correct something${data.field ? ' (' + data.field + ')' : ''}. Ask what they'd like to change. Max 2 sentences.`,

  'booking_cancelled_by_user': (_data, lang) => lang === 'pt'
    ? 'Sem problema! Pergunte se gostaria de agendar para outra data ou se precisa de mais alguma coisa. Max 2 frases.'
    : 'No problem! Ask if they\'d like to schedule for another date or need anything else. Max 2 sentences.',

  'done_booking': (data, lang) => lang === 'pt'
    ? `Confirme que enviaremos a confirmação por ${data.canal || 'mensagem'}. Agradeça e despeça-se. Max 2 frases.`
    : `Confirm we'll send confirmation via ${data.canal || 'message'}. Thank them and say goodbye. Max 2 sentences.`,

  'ask_preference_again': (_data, lang) => lang === 'pt'
    ? 'Não entendeu a preferência. Pergunte: SMS ou WhatsApp? Max 1 frase.'
    : 'Didn\'t understand the preference. Ask: SMS or WhatsApp? Max 1 sentence.',

  'ask_preference': (_data, lang) => lang === 'pt'
    ? 'Pergunte se preferem receber confirmação por SMS ou WhatsApp. Max 1-2 frases.'
    : 'Ask if they prefer confirmation via SMS or WhatsApp. Max 1-2 sentences.',

  'no_client_id': (_data, lang) => lang === 'pt'
    ? 'Houve um erro no sistema. Peça desculpas e peça o telefone novamente para recomeçar. Max 2 frases.'
    : 'There was a system error. Apologize and ask for the phone number again to restart. Max 2 sentences.',

  'no_upcoming_appointments': (data, lang) => lang === 'pt'
    ? `${data.name ? data.name + ', v' : 'V'}ocê não tem agendamentos futuros. Pergunte se gostaria de agendar um. Max 2 frases.`
    : `${data.name ? data.name + ', y' : 'Y'}ou have no upcoming appointments. Ask if they'd like to schedule one. Max 2 sentences.`,

  'invalid_selection': (_data, lang) => lang === 'pt'
    ? 'Não conseguiu identificar qual agendamento. Peça para escolher pelo número da lista. Max 2 frases.'
    : 'Could not identify which appointment. Ask to choose by list number. Max 2 sentences.',

  'cancel_error': (_data, lang) => lang === 'pt'
    ? 'Houve um erro ao cancelar. Peça desculpas e sugira tentar novamente. Max 2 frases.'
    : 'There was an error cancelling. Apologize and suggest trying again. Max 2 sentences.',

  'cancel_success': (_data, lang) => lang === 'pt'
    ? 'Agendamento cancelado com sucesso. Pergunte se pode ajudar com mais algo. Max 2 frases.'
    : 'Appointment cancelled successfully. Ask if you can help with anything else. Max 2 sentences.',

  'show_appointments': (data, lang) => {
    const list = (data.appointments || [])
      .map((a: any, i: number) => `${i + 1}. ${a.date} ${a.time} - ${a.service || 'Cleaning'}`)
      .join('\n')
    return lang === 'pt'
      ? `Mostre a lista de agendamentos:\n${list}\nPergunte qual desejam gerenciar. Max 3 frases.`
      : `Show the appointments list:\n${list}\nAsk which one they'd like to manage. Max 3 sentences.`
  },

  'confirm_cancel': (data, lang) => lang === 'pt'
    ? `Confirme o cancelamento do agendamento em ${data.date} às ${data.time}. Peça confirmação (sim/não). Max 2 frases.`
    : `Confirm cancellation of the appointment on ${data.date} at ${data.time}. Ask for confirmation (yes/no). Max 2 sentences.`,

  'confirm_reschedule': (data, lang) => lang === 'pt'
    ? `Confirme reagendamento do agendamento em ${data.date} às ${data.time}. Peça confirmação. Max 2 frases.`
    : `Confirm rescheduling of the appointment on ${data.date} at ${data.time}. Ask for confirmation. Max 2 sentences.`,

  'cancel_aborted': (_data, lang) => lang === 'pt'
    ? 'O cancelamento foi cancelado. Pergunte se pode ajudar com mais algo. Max 2 frases.'
    : 'Cancellation was aborted. Ask if you can help with anything else. Max 2 sentences.',

  'reschedule_aborted': (_data, lang) => lang === 'pt'
    ? 'O reagendamento foi cancelado. Pergunte se pode ajudar com mais algo. Max 2 frases.'
    : 'Rescheduling was aborted. Ask if you can help with anything else. Max 2 sentences.',

  'reschedule_pick_date': (_data, lang) => lang === 'pt'
    ? 'O antigo agendamento foi cancelado. Pergunte qual a nova data preferida. Max 2 frases.'
    : 'The old appointment was cancelled. Ask what new date they prefer. Max 2 sentences.',

  'ask_callback_time': (_data, lang) => lang === 'pt'
    ? 'Pergunte qual o melhor horário para retornarmos a ligação. Max 2 frases.'
    : 'Ask what time works best for a callback. Max 2 sentences.',

  'callback_need_phone': (_data, lang) => lang === 'pt'
    ? 'Precisamos do telefone para agendar o retorno. Peça o telefone. Max 2 frases.'
    : 'We need a phone number to schedule the callback. Ask for the phone. Max 2 sentences.',

  'callback_error': (_data, lang) => lang === 'pt'
    ? 'Houve um erro ao agendar o retorno. Peça desculpas e sugira ligar diretamente. Max 2 frases.'
    : 'There was an error scheduling the callback. Apologize and suggest calling us directly. Max 2 sentences.',

  'callback_scheduled': (_data, lang) => lang === 'pt'
    ? 'Confirme que agendamos o retorno. Alguém entrará em contato. Max 2 frases.'
    : 'Confirm the callback is scheduled. Someone will reach out. Max 2 sentences.',

  'ask_pet_info': (data, lang) => lang === 'pt'
    ? `Pergunte a ${data.name || 'o cliente'} sobre os pets. Quantos, que tipo, algo especial? Max 2 frases.`
    : `Ask ${data.name || 'the customer'} about their pets. How many, what type, anything special? Max 2 sentences.`,

  'pet_info_saved': (_data, lang) => lang === 'pt'
    ? 'Confirme que anotou as informações dos pets. Sem problema, a equipe adora animais! Max 2 frases.'
    : 'Confirm the pet info was saved. No problem, our team loves animals! Max 2 sentences.',

  'ask_allergy_info': (data, lang) => lang === 'pt'
    ? `Pergunte a ${data.name || 'o cliente'} sobre a alergia. Quais produtos devemos evitar? Max 2 frases.`
    : `Ask ${data.name || 'the customer'} about the allergy. What products should we avoid? Max 2 sentences.`,

  'allergy_info_saved': (_data, lang) => lang === 'pt'
    ? 'Confirme que anotou as alergias. Vamos tomar cuidado com os produtos. Max 2 frases.'
    : 'Confirm the allergy info was saved. We\'ll be careful with cleaning products. Max 2 sentences.',

  'ask_update_details': (_data, lang) => lang === 'pt'
    ? 'Pergunte quais informações gostariam de atualizar (nome, telefone, endereço, email). Max 2 frases.'
    : 'Ask what information they\'d like to update (name, phone, address, email). Max 2 sentences.',

  'info_updated': (data, lang) => lang === 'pt'
    ? `Confirme que os campos ${data.fields} foram atualizados com sucesso. Max 2 frases.`
    : `Confirm that ${data.fields} was updated successfully. Max 2 sentences.`,

  'deflect_price': (_data, lang) => lang === 'pt'
    ? 'Explique que não fornecemos orçamentos pelo chat. A primeira visita é gratuita e presencial para avaliar o imóvel. Sugira agendar a visita. Max 3 frases.'
    : 'Explain that we don\'t provide estimates via chat. The first visit is free and in-person to evaluate the property. Suggest scheduling the visit. Max 3 sentences.',

  'guardrail': (_data, lang) => lang === 'pt'
    ? 'Explique educadamente que só pode ajudar com assuntos de limpeza e agendamento. Pergunte se pode ajudar com algo nessa área. Max 2 frases.'
    : 'Politely explain you can only help with cleaning and scheduling matters. Ask if you can help with something in that area. Max 2 sentences.',

  'goodbye': (_data, lang) => lang === 'pt'
    ? 'Despeça-se de forma calorosa e simpática. Max 1-2 frases.'
    : 'Say goodbye warmly and friendly. Max 1-2 sentences.',

  'invalid_phone': (_data, lang) => lang === 'pt'
    ? 'O telefone parece inválido. Peça um número de telefone americano válido (10 dígitos). Max 2 frases.'
    : 'The phone number seems invalid. Ask for a valid US phone number (10 digits). Max 2 sentences.',

}

// ═══ FAQ KNOWLEDGE BASE ═══

const FAQ_KNOWLEDGE = `
Chesque Premium Cleaning - Company Knowledge Base:
- Service areas: Charlotte NC, Fort Mill SC, and surrounding areas
- No contracts ever, cancel anytime
- All professionals are background-checked
- We provide all equipment; most cleaning products come from the client (can be arranged if needed)
- 100% satisfaction guarantee
- Same professional assigned each visit when possible
- Pets are OK - just let us know in advance
- You don't need to be home during cleaning
- 24-hour cancellation policy
- Damages: report within 24 hours, manager (Thayna) evaluates personally
- First visit is done by Thayna personally; on cleaning days: Thayna + 1-2 helpers
- IMPORTANT: NEVER give price estimates via chat - explain that the first visit is free and in-person for property evaluation
`.trim()

// ═══ CAROL PERSONA ═══

function carolPersona(language: 'pt' | 'en'): string {
  return `You are Carol, virtual assistant for Chesque Premium Cleaning.
Personality: warm, friendly, casual (never robotic).
Style: SHORT messages (max 3-4 sentences). Use 1-2 emojis max per message. Never use em-dashes (\u2014).
Language: ${language === 'pt' ? 'Respond in Brazilian Portuguese' : 'Respond in English'}.`
}

// ═══ INPUT SANITIZATION ═══

/**
 * Sanitize user input before sending to LLM.
 * Strips control characters (except newlines), trims whitespace, and enforces max length.
 */
function sanitizeInput(input: string, maxLength = 2000): string {
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
    .slice(0, maxLength)
}

// ═══ LLM CLASS ═══

export class CarolLLM {
  private model: string

  constructor(model?: string) {
    this.model = model || env.defaultModel
  }

  // ═══ EXTRACTION ═══

  async extract(
    type: ExtractionType,
    message: string,
    extraContext?: any
  ): Promise<any> {
    const { data } = await this._extractRaw(type, message, extraContext)
    return data
  }

  /** Internal: returns parsed data + raw usage from the API response */
  private async _extractRaw(
    type: ExtractionType,
    message: string,
    extraContext?: any
  ): Promise<{ data: any; usage?: { total_tokens?: number; prompt_tokens?: number; completion_tokens?: number } }> {
    const sanitizedMessage = sanitizeInput(message)
    const systemPrompt = getExtractionPrompt(type, extraContext)

    let response
    try {
      response = await openrouter.chat.completions.create({
        model: this.model,
        temperature: 0.1,
        max_tokens: 200,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: sanitizedMessage },
        ],
      })
    } catch (error) {
      logger.error(`[CarolLLM] extract(${type}) API error:`, error instanceof Error ? error.message : String(error))
      return { data: {} }
    }

    const usage = response.usage
      ? {
          total_tokens: response.usage.total_tokens ?? undefined,
          prompt_tokens: response.usage.prompt_tokens ?? undefined,
          completion_tokens: response.usage.completion_tokens ?? undefined,
        }
      : undefined

    const content = response.choices[0]?.message?.content || '{}'
    try {
      const parsed = JSON.parse(content)
      // Detect empty or error responses and return null-safe defaults
      if (parsed._error) return { data: {}, usage }
      return { data: parsed, usage }
    } catch (error) {
      logger.error(`[CarolLLM] JSON parse error in extract(${type}):`, { content, error: error instanceof Error ? error.message : String(error) })
      return { data: {}, usage }
    }
  }

  // ═══ EXTRACTION WITH METRICS (for logging) ═══

  async extractWithMetrics(
    type: ExtractionType,
    message: string,
    extraContext?: any
  ): Promise<{ data: any; metrics: LLMCallRecord }> {
    const startTime = Date.now()
    const systemPrompt = getExtractionPrompt(type, extraContext)

    const { data, usage } = await this._extractRaw(type, message, extraContext)

    return {
      data,
      metrics: {
        type: 'extract',
        model: this.model,
        prompt_preview: systemPrompt.substring(0, 100),
        tokens_used: usage?.total_tokens,
        prompt_tokens: usage?.prompt_tokens,
        completion_tokens: usage?.completion_tokens,
        duration_ms: Date.now() - startTime,
      }
    }
  }

  // ═══ CLASSIFICATION ═══

  async classifyIntent(
    message: string,
    options: string[]
  ): Promise<string> {
    if (!options || options.length === 0) {
      return 'unknown'
    }
    if (!message || !message.trim()) {
      return 'unknown'
    }

    const sanitizedMessage = sanitizeInput(message)
    const systemPrompt = `Classify the user message into ONE of these categories: ${options.join(', ')}. Return ONLY the category name, nothing else.`

    try {
      const response = await openrouter.chat.completions.create({
        model: this.model,
        temperature: 0.1,
        max_tokens: 50,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: sanitizedMessage },
        ],
      })

      const result = (response.choices[0]?.message?.content || '').trim()
      if (!result) {
        logger.warn('[CarolLLM] classifyIntent: empty LLM response')
        return 'unknown'
      }

      const normalized = result.toLowerCase()

      // Exact match first
      const exactMatch = options.find((opt) => opt.toLowerCase() === normalized)
      if (exactMatch) return exactMatch

      // Fuzzy match: check if any option is contained within the response (word-boundary)
      const fuzzyMatch = options.find((opt) => {
        const pattern = new RegExp(`\\b${opt.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
        return pattern.test(normalized);
      })
      if (fuzzyMatch) {
        logger.warn(`[CarolLLM] classifyIntent: fuzzy matched "${result}" to "${fuzzyMatch}"`)
        return fuzzyMatch
      }

      logger.warn(`[CarolLLM] classifyIntent: LLM returned "${result}" not in [${options.join(', ')}]`)
      return 'unknown'
    } catch (error) {
      logger.error('[CarolLLM] classifyIntent error:', error instanceof Error ? error.message : String(error))
      return 'unknown'
    }
  }

  // ═══ LANGUAGE DETECTION ═══

  async detectLanguage(message: string): Promise<'pt' | 'en'> {
    const sanitizedMessage = sanitizeInput(message)
    try {
      const response = await openrouter.chat.completions.create({
        model: this.model,
        temperature: 0.1,
        max_tokens: 10,
        messages: [
          {
            role: 'system',
            content:
              'Detect the language of the user message. Return ONLY "pt" for Portuguese or "en" for English. If unclear, return "en".',
          },
          { role: 'user', content: sanitizedMessage },
        ],
      })

      const result = (response.choices[0]?.message?.content || 'en')
        .trim()
        .toLowerCase()
      return result === 'pt' ? 'pt' : 'en'
    } catch {
      return 'en'
    }
  }

  // ═══ RESPONSE GENERATION ═══

  async generate(
    template: string,
    data: Record<string, any>,
    language: 'pt' | 'en'
  ): Promise<string> {
    const { text } = await this._generateRaw(template, data, language)
    return text
  }

  /** Internal: returns generated text + raw usage from the API response */
  private async _generateRaw(
    template: string,
    data: Record<string, any>,
    language: 'pt' | 'en'
  ): Promise<{ text: string; usage?: { total_tokens?: number; prompt_tokens?: number; completion_tokens?: number } }> {
    const templateFn = RESPONSE_TEMPLATES[template]
    if (!templateFn) {
      logger.error(`[CarolLLM] Unknown response template: ${template}`)
      const fallback = language === 'pt'
        ? 'Desculpe, houve um problema. Pode repetir?'
        : "I'm sorry, something went wrong. Could you say that again?"
      return { text: fallback }
    }

    const instruction = templateFn(data, language)
    const persona = carolPersona(language)

    try {
      const response = await openrouter.chat.completions.create({
        model: this.model,
        temperature: 0.6,
        max_tokens: 300,
        messages: [
          { role: 'system', content: `${persona}\n\nInstruction: ${instruction}` },
          {
            role: 'user',
            content: 'Generate the message following the instruction above.',
          },
        ],
      })

      const usage = response.usage
        ? {
            total_tokens: response.usage.total_tokens ?? undefined,
            prompt_tokens: response.usage.prompt_tokens ?? undefined,
            completion_tokens: response.usage.completion_tokens ?? undefined,
          }
        : undefined

      const text = (response.choices[0]?.message?.content || '').trim()
      return { text, usage }
    } catch (error) {
      logger.error(`[CarolLLM] generate(${template}) API error:`, error instanceof Error ? error.message : String(error))
      const fallback = language === 'pt'
        ? 'Desculpe, tive um problema técnico. Pode tentar novamente?'
        : "I'm sorry, I had a technical issue. Could you try again?"
      return { text: fallback }
    }
  }

  // ═══ GENERATION WITH METRICS (for logging) ═══

  async generateWithMetrics(
    template: string,
    data: Record<string, any>,
    language: 'pt' | 'en'
  ): Promise<{ response: string; metrics: LLMCallRecord }> {
    const startTime = Date.now()

    const { text, usage } = await this._generateRaw(template, data, language)

    return {
      response: text,
      metrics: {
        type: 'generate',
        model: this.model,
        prompt_preview: text.substring(0, 100),
        tokens_used: usage?.total_tokens,
        prompt_tokens: usage?.prompt_tokens,
        completion_tokens: usage?.completion_tokens,
        duration_ms: Date.now() - startTime,
      }
    }
  }

  // ═══ FAQ GENERATION ═══

  async generateFaq(
    question: string,
    context: { businessInfo?: any; pricing?: any; sessionContext?: any }
  ): Promise<string> {
    const sanitizedQuestion = sanitizeInput(question)
    const lang = await this.detectLanguage(sanitizedQuestion)
    const persona = carolPersona(lang)

    const extraContext = context.sessionContext
      ? `\nSession context: ${JSON.stringify(context.sessionContext)}`
      : ''

    const systemPrompt = `${persona}

${FAQ_KNOWLEDGE}
${extraContext}

Answer the customer's question using ONLY the knowledge base above. If the question is about pricing, explain that the first visit is free and in-person for evaluation - never give price estimates. If the question is outside the knowledge base, politely say you don't have that information and suggest contacting us directly.`

    try {
      const response = await openrouter.chat.completions.create({
        model: this.model,
        temperature: 0.7,
        max_tokens: 500,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: sanitizedQuestion },
        ],
      })

      return (response.choices[0]?.message?.content || '').trim()
    } catch (error) {
      logger.error('[CarolLLM] generateFaq API error:', error instanceof Error ? error.message : String(error))
      return lang === 'pt'
        ? 'Desculpe, não consigo responder agora. Pode entrar em contato conosco diretamente?'
        : "I'm sorry, I can't answer right now. Could you contact us directly?"
    }
  }
}


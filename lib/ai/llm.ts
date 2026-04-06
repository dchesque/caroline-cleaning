// lib/ai/llm.ts
import { openrouter } from './openrouter'
import { env } from '@/lib/env'

// ═══ TYPES ═══

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

  'ask_name_again': (_data, lang) => lang === 'pt'
    ? 'Não conseguiu entender o nome. Peça novamente de forma gentil. Max 2 frases.'
    : 'Could not understand the name. Ask again gently. Max 2 sentences.',

  'explain_visit_ask_address': (_data, lang) => lang === 'pt'
    ? 'Explique que a primeira visita é gratuita para avaliação do imóvel. Peça o endereço completo. Max 3 frases.'
    : 'Explain that the first visit is free for property evaluation. Ask for the full address. Max 3 sentences.',

  'ask_address_again': (_data, lang) => lang === 'pt'
    ? 'Não entendeu o endereço. Peça novamente com rua, número, cidade e CEP. Max 2 frases.'
    : 'Did not understand the address. Ask again with street, number, city and ZIP. Max 2 sentences.',

  'ask_zip': (_data, lang) => lang === 'pt'
    ? 'Peça o código postal (ZIP code). Max 1-2 frases.'
    : 'Ask for the ZIP code. Max 1-2 sentences.',

  'zip_not_covered': (_data, lang) => lang === 'pt'
    ? 'Informe que não atendemos essa região. Atendemos Charlotte NC, Fort Mill SC e arredores. Lamente de forma simpática. Max 2 frases.'
    : 'Inform that we don\'t cover this area. We serve Charlotte NC, Fort Mill SC and surrounding areas. Apologize kindly. Max 2 sentences.',

  'lead_created_ask_date': (data, lang) => lang === 'pt'
    ? `Confirme o cadastro de ${data.name}. Pergunte quando gostaria de agendar a visita gratuita. Max 2 frases.`
    : `Confirm ${data.name}'s registration. Ask when they'd like to schedule the free visit. Max 2 sentences.`,

  'confirm_address': (data, lang) => lang === 'pt'
    ? `Mostre o endereço: ${data.address}. Pergunte se está correto. Max 2 frases.`
    : `Show the address: ${data.address}. Ask if it's correct. Max 2 sentences.`,

  'ask_service_type': (_data, lang) => lang === 'pt'
    ? 'Liste os serviços: Limpeza Regular, Limpeza Profunda, Mudança (entrada/saída), Visita de avaliação. Pergunte qual desejam. Max 3 frases.'
    : 'List services: Regular Cleaning, Deep Cleaning, Move In/Out Cleaning, Evaluation Visit. Ask which one they\'d like. Max 3 sentences.',

  'ask_date': (_data, lang) => lang === 'pt'
    ? 'Pergunte qual data preferem para o agendamento. Max 2 frases.'
    : 'Ask what date they prefer for the appointment. Max 2 sentences.',

  'ask_date_again': (_data, lang) => lang === 'pt'
    ? 'Não entendeu a data. Peça novamente com exemplo de formato. Max 2 frases.'
    : 'Could not understand the date. Ask again with a format example. Max 2 sentences.',

  'date_in_past': (_data, lang) => lang === 'pt'
    ? 'Informe que a data já passou. Peça uma data futura. Max 2 frases.'
    : 'Inform that the date is in the past. Ask for a future date. Max 2 sentences.',

  'show_slots': (data, lang) => {
    const slotList = (data.slots || [])
      .map((s: any, i: number) => `${i + 1}. ${s.time} - ${s.end_time}`)
      .join('\n')
    return lang === 'pt'
      ? `Mostre os horários disponíveis para ${data.date}:\n${slotList}\nPergunte qual preferem. Max 3 frases.`
      : `Show available time slots for ${data.date}:\n${slotList}\nAsk which one they prefer. Max 3 sentences.`
  },

  'ask_time_again': (_data, lang) => lang === 'pt'
    ? 'Não entendeu o horário. Peça novamente. Max 2 frases.'
    : 'Could not understand the time. Ask again. Max 2 sentences.',

  'time_not_available': (_data, lang) => lang === 'pt'
    ? 'Informe que esse horário não está disponível. Peça outro horário. Max 2 frases.'
    : 'Inform that this time is not available. Ask for another time. Max 2 sentences.',

  'slot_taken': (_data, lang) => lang === 'pt'
    ? 'Esse horário já foi reservado. Peça outro horário ou outra data. Max 2 frases.'
    : 'That slot is already taken. Ask for another time or date. Max 2 sentences.',

  'need_address': (_data, lang) => lang === 'pt'
    ? 'Explique que precisamos do endereço antes de agendar. Peça o endereço. Max 2 frases.'
    : 'Explain that we need the address before scheduling. Ask for the address. Max 2 sentences.',

  'booking_error': (_data, lang) => lang === 'pt'
    ? 'Houve um erro ao agendar. Peça desculpas e peça para tentar novamente. Max 2 frases.'
    : 'There was an error booking. Apologize and ask to try again. Max 2 sentences.',

  'suggest_other_dates': (data, lang) => {
    const dayList = (data.days || [])
      .map((d: any) => `${d.day_name} (${d.date}): ${d.slots} slots`)
      .join('\n')
    return lang === 'pt'
      ? `Essa data não tem horários. Sugira estas alternativas:\n${dayList}\nMax 3 frases.`
      : `That date has no slots. Suggest these alternatives:\n${dayList}\nMax 3 sentences.`
  },

  'no_slots_at_all': (_data, lang) => lang === 'pt'
    ? 'Não há horários disponíveis no momento. Peça desculpas e sugira ligar para nós. Max 2 frases.'
    : 'No slots available at the moment. Apologize and suggest calling us. Max 2 sentences.',

  'booking_summary': (data, lang) => lang === 'pt'
    ? `Mostre o resumo do agendamento:\n- Nome: ${data.name}\n- Telefone: ${data.phone}\n- Endereço: ${data.address}\n- Data: ${data.date}\n- Horário: ${data.time}\n- Serviço: ${data.service}\nPergunte se prefere confirmação por SMS ou WhatsApp. Max 4 frases.`
    : `Show the booking summary:\n- Name: ${data.name}\n- Phone: ${data.phone}\n- Address: ${data.address}\n- Date: ${data.date}\n- Time: ${data.time}\n- Service: ${data.service}\nAsk if they prefer confirmation via SMS or WhatsApp. Max 4 sentences.`,

  'ask_preference': (_data, lang) => lang === 'pt'
    ? 'Pergunte se preferem receber confirmação por SMS ou WhatsApp. Max 1-2 frases.'
    : 'Ask if they prefer confirmation via SMS or WhatsApp. Max 1-2 sentences.',

  'all_done': (data, lang) => lang === 'pt'
    ? `Confirme que enviaremos por ${data.canal}. Agradeça e se despeça de forma calorosa. Max 2 frases.`
    : `Confirm we'll send via ${data.canal}. Thank them and say goodbye warmly. Max 2 sentences.`,

  'show_appointments': (data, lang) => {
    const list = (data.appointments || [])
      .map((a: any, i: number) => `${i + 1}. ${a.date} ${a.time} - ${a.service || 'Cleaning'}`)
      .join('\n')
    return lang === 'pt'
      ? `Mostre a lista de agendamentos:\n${list}\nPergunte qual desejam gerenciar. Max 3 frases.`
      : `Show the appointments list:\n${list}\nAsk which one they'd like to manage. Max 3 sentences.`
  },

  'which_appointment': (_data, lang) => lang === 'pt'
    ? 'Pergunte qual agendamento (pelo número da lista). Max 1-2 frases.'
    : 'Ask which appointment (by list number). Max 1-2 sentences.',

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

  'cancelled_ok': (_data, lang) => lang === 'pt'
    ? 'Confirme que o agendamento foi cancelado com sucesso. Pergunte se pode ajudar com mais algo. Max 2 frases.'
    : 'Confirm the appointment was cancelled successfully. Ask if you can help with anything else. Max 2 sentences.',

  'ask_callback_time': (_data, lang) => lang === 'pt'
    ? 'Pergunte qual o melhor horário para retornarmos a ligação. Max 2 frases.'
    : 'Ask what time works best for a callback. Max 2 sentences.',

  'callback_scheduled': (_data, lang) => lang === 'pt'
    ? 'Confirme que agendamos o retorno. Alguém entrará em contato. Max 2 frases.'
    : 'Confirm the callback is scheduled. Someone will reach out. Max 2 sentences.',

  'info_updated': (data, lang) => lang === 'pt'
    ? `Confirme que os campos ${data.fields} foram atualizados com sucesso. Max 2 frases.`
    : `Confirm that ${data.fields} was updated successfully. Max 2 sentences.`,

  'what_to_update': (_data, lang) => lang === 'pt'
    ? 'Pergunte quais informações gostariam de atualizar (nome, telefone, endereço, etc). Max 2 frases.'
    : 'Ask what information they\'d like to update (name, phone, address, etc). Max 2 sentences.',

  'deflect_price': (_data, lang) => lang === 'pt'
    ? 'Explique que não fornecemos orçamentos pelo chat. A primeira visita é gratuita e presencial para avaliar o imóvel. Sugira agendar a visita. Max 3 frases.'
    : 'Explain that we don\'t provide estimates via chat. The first visit is free and in-person to evaluate the property. Suggest scheduling the visit. Max 3 sentences.',

  'guardrail': (_data, lang) => lang === 'pt'
    ? 'Explique educadamente que só pode ajudar com assuntos de limpeza e agendamento. Pergunte se pode ajudar com algo nessa área. Max 2 frases.'
    : 'Politely explain you can only help with cleaning and scheduling matters. Ask if you can help with something in that area. Max 2 sentences.',

  'anything_else': (_data, lang) => lang === 'pt'
    ? 'Pergunte se pode ajudar com mais alguma coisa. Max 1-2 frases.'
    : 'Ask if you can help with anything else. Max 1-2 sentences.',

  'goodbye': (_data, lang) => lang === 'pt'
    ? 'Despeça-se de forma calorosa e simpática. Max 1-2 frases.'
    : 'Say goodbye warmly and friendly. Max 1-2 sentences.',

  'ask_phone_again': (_data, lang) => lang === 'pt'
    ? 'Não entendeu o telefone. Peça novamente de forma gentil. Max 2 frases.'
    : 'Could not understand the phone number. Ask again gently. Max 2 sentences.',

  'invalid_phone': (_data, lang) => lang === 'pt'
    ? 'O telefone parece inválido. Peça um número de telefone americano válido (10 dígitos). Max 2 frases.'
    : 'The phone number seems invalid. Ask for a valid US phone number (10 digits). Max 2 sentences.',

  'resume_greeting': (data, lang) => lang === 'pt'
    ? `Cumprimente ${data.name} e diga que é bom vê-lo(a) de volta. Pergunte como pode ajudar. Max 2 frases.`
    : `Greet ${data.name} and say it's good to see them back. Ask how you can help. Max 2 sentences.`,

  'ok_change_date': (_data, lang) => lang === 'pt'
    ? 'Confirme que vamos trocar a data. Pergunte qual a nova data preferida. Max 2 frases.'
    : 'Confirm we\'ll change the date. Ask what new date they prefer. Max 2 sentences.',

  'ok_lets_redo': (_data, lang) => lang === 'pt'
    ? 'Sem problema, vamos recomeçar. Pergunte o que gostariam de corrigir. Max 2 frases.'
    : 'No problem, let\'s start over. Ask what they\'d like to fix. Max 2 sentences.',

  'no_appointments': (_data, lang) => lang === 'pt'
    ? 'Informe que não encontramos agendamentos. Pergunte se gostariam de agendar um novo. Max 2 frases.'
    : 'Inform that we found no appointments. Ask if they\'d like to schedule a new one. Max 2 sentences.',

  'ask_new_date': (_data, lang) => lang === 'pt'
    ? 'Pergunte qual a nova data preferida para o reagendamento. Max 2 frases.'
    : 'Ask what new date they prefer for rescheduling. Max 2 sentences.',
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
    const systemPrompt = getExtractionPrompt(type, extraContext)

    const response = await openrouter.chat.completions.create({
      model: this.model,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
    })

    const content = response.choices[0]?.message?.content || '{}'
    try {
      return JSON.parse(content)
    } catch {
      return {}
    }
  }

  // ═══ CLASSIFICATION ═══

  async classifyIntent(
    message: string,
    options: string[]
  ): Promise<string> {
    const systemPrompt = `Classify the user message into ONE of these categories: ${options.join(', ')}. Return ONLY the category name, nothing else.`

    const response = await openrouter.chat.completions.create({
      model: this.model,
      temperature: 0.1,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
    })

    const result = (response.choices[0]?.message?.content || '').trim()

    // Validate against options (case-insensitive match)
    const match = options.find(
      (opt) => opt.toLowerCase() === result.toLowerCase()
    )
    return match || options[0]
  }

  // ═══ LANGUAGE DETECTION ═══

  async detectLanguage(message: string): Promise<'pt' | 'en'> {
    const response = await openrouter.chat.completions.create({
      model: this.model,
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content:
            'Detect the language of the user message. Return ONLY "pt" for Portuguese or "en" for English. If unclear, return "en".',
        },
        { role: 'user', content: message },
      ],
    })

    const result = (response.choices[0]?.message?.content || 'en')
      .trim()
      .toLowerCase()
    return result === 'pt' ? 'pt' : 'en'
  }

  // ═══ RESPONSE GENERATION ═══

  async generate(
    template: string,
    data: Record<string, any>,
    language: 'pt' | 'en'
  ): Promise<string> {
    const templateFn = RESPONSE_TEMPLATES[template]
    if (!templateFn) {
      throw new Error(`Unknown response template: ${template}`)
    }

    const instruction = templateFn(data, language)
    const persona = carolPersona(language)

    const response = await openrouter.chat.completions.create({
      model: this.model,
      temperature: 0.6,
      messages: [
        { role: 'system', content: `${persona}\n\nInstruction: ${instruction}` },
        {
          role: 'user',
          content: 'Generate the message following the instruction above.',
        },
      ],
    })

    return (response.choices[0]?.message?.content || '').trim()
  }

  // ═══ FAQ GENERATION ═══

  async generateFaq(
    question: string,
    context: { businessInfo?: any; pricing?: any; sessionContext?: any }
  ): Promise<string> {
    const lang = await this.detectLanguage(question)
    const persona = carolPersona(lang)

    const extraContext = context.sessionContext
      ? `\nSession context: ${JSON.stringify(context.sessionContext)}`
      : ''

    const systemPrompt = `${persona}

${FAQ_KNOWLEDGE}
${extraContext}

Answer the customer's question using ONLY the knowledge base above. If the question is about pricing, explain that the first visit is free and in-person for evaluation - never give price estimates. If the question is outside the knowledge base, politely say you don't have that information and suggest contacting us directly.`

    const response = await openrouter.chat.completions.create({
      model: this.model,
      temperature: 0.5,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
    })

    return (response.choices[0]?.message?.content || '').trim()
  }
}

// Default singleton
export const carol = new CarolLLM()

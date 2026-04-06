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
      return `${base} Extract pet details from the message. Return {"pets": "type and description of pets", "details": "any special notes about the pets"} or {"pets": null, "details": null} if no pet info found.`

    case 'allergy_info':
      return `${base} Extract allergy or sensitivity details from the message. Return {"allergy": "type of allergy or sensitivity", "details": "any special notes or precautions"} or {"allergy": null, "details": null} if no allergy info found.`

    default:
      return base
  }
}

// ═══ RESPONSE TEMPLATES ═══

const RESPONSE_TEMPLATES: Record<string, (data: any, lang: 'pt' | 'en') => string> = {
  'ask_phone': (_data, lang) => lang === 'pt'
    ? 'Cumprimente e peca o telefone de forma amigavel. Max 2 frases.'
    : 'Greet and ask for phone number in a friendly way. Max 2 sentences.',

  'confirm_phone': (data, lang) => lang === 'pt'
    ? `Confirme o telefone ${data.phone} de forma amigavel. Peca confirmacao.`
    : `Confirm the phone number ${data.phone} in a friendly way. Ask for confirmation.`,

  'greet_returning': (data, lang) => lang === 'pt'
    ? `Cumprimente ${data.name} como cliente que voltou. Pergunte como pode ajudar. Max 2 frases.`
    : `Greet ${data.name} as a returning customer. Ask how you can help. Max 2 sentences.`,

  'ask_name': (_data, lang) => lang === 'pt'
    ? 'Peca o nome da pessoa de forma amigavel. Max 2 frases.'
    : 'Ask for the person\'s name in a friendly way. Max 2 sentences.',

  'explain_first_visit': (data, lang) => lang === 'pt'
    ? `${data.name}, explique que a primeira visita e gratuita para avaliacao do imovel. Peca o endereco completo. Max 3 frases.`
    : `${data.name}, explain that the first visit is free for property evaluation. Ask for the full address. Max 3 sentences.`,

  'ask_address_again': (_data, lang) => lang === 'pt'
    ? 'Nao entendeu o endereco. Peca novamente com rua, numero, cidade e CEP. Max 2 frases.'
    : 'Did not understand the address. Ask again with street, number, city and ZIP. Max 2 sentences.',

  'ask_zip': (_data, lang) => lang === 'pt'
    ? 'Peca o codigo postal (ZIP code). Max 1-2 frases.'
    : 'Ask for the ZIP code. Max 1-2 sentences.',

  'zip_not_covered': (_data, lang) => lang === 'pt'
    ? 'Informe que nao atendemos essa regiao. Atendemos Charlotte NC, Fort Mill SC e arredores. Lamente de forma simpatica. Max 2 frases.'
    : 'Inform that we don\'t cover this area. We serve Charlotte NC, Fort Mill SC and surrounding areas. Apologize kindly. Max 2 sentences.',

  'confirm_address': (data, lang) => lang === 'pt'
    ? `Mostre o endereco: ${data.address}. Pergunte se esta correto. Max 2 frases.`
    : `Show the address: ${data.address}. Ask if it's correct. Max 2 sentences.`,

  'ask_service_type': (_data, lang) => lang === 'pt'
    ? 'Liste os servicos: Limpeza Regular, Limpeza Profunda, Mudanca (entrada/saida), Visita de avaliacao. Pergunte qual desejam. Max 3 frases.'
    : 'List services: Regular Cleaning, Deep Cleaning, Move In/Out Cleaning, Evaluation Visit. Ask which one they\'d like. Max 3 sentences.',

  'ask_date': (_data, lang) => lang === 'pt'
    ? 'Pergunte qual data preferem para o agendamento. Max 2 frases.'
    : 'Ask what date they prefer for the appointment. Max 2 sentences.',

  'invalid_date': (_data, lang) => lang === 'pt'
    ? 'Nao conseguimos entender a data. Por favor, informe novamente em um formato como "15 de abril" ou "next Monday". Max 2 frases.'
    : 'We couldn\'t understand the date. Please provide it again in a format like "April 15" or "next Monday". Max 2 sentences.',

  'date_in_past': (_data, lang) => lang === 'pt'
    ? 'Informe que a data ja passou. Peca uma data futura. Max 2 frases.'
    : 'Inform that the date is in the past. Ask for a future date. Max 2 sentences.',

  'date_is_sunday': (_data, lang) => lang === 'pt'
    ? 'Informe que nao trabalhamos aos domingos. Peca outra data, de segunda a sabado. Max 2 frases.'
    : 'Inform that we don\'t work on Sundays. Ask for another day, Monday through Saturday. Max 2 sentences.',

  'no_slots_alternatives': (data, lang) => lang === 'pt'
    ? `Nao ha horarios para a data escolhida. Mostre estas alternativas:\n${data.alternatives}\nPeca para escolher uma dessas datas. Max 3 frases.`
    : `No slots available for the chosen date. Show these alternatives:\n${data.alternatives}\nAsk them to pick one of these dates. Max 3 sentences.`,

  'no_slots_at_all': (_data, lang) => lang === 'pt'
    ? 'Nao ha horarios disponiveis no momento. Peca desculpas e sugira ligar para nos. Max 2 frases.'
    : 'No slots available at the moment. Apologize and suggest calling us. Max 2 sentences.',

  'ask_time': (data, lang) => lang === 'pt'
    ? `Mostre os horarios disponiveis: ${data.available_times}. Pergunte qual preferem. Max 2 frases.`
    : `Show the available time slots: ${data.available_times}. Ask which one they prefer. Max 2 sentences.`,

  'invalid_time': (data, lang) => lang === 'pt'
    ? `Nao conseguimos entender o horario. Horarios disponiveis: ${data.available_times}. Peca para escolher um deles. Max 2 frases.`
    : `We couldn't recognize the time. Available slots: ${data.available_times}. Please pick one of these. Max 2 sentences.`,

  'time_not_available': (_data, lang) => lang === 'pt'
    ? 'Informe que esse horario nao esta disponivel. Peca outro horario. Max 2 frases.'
    : 'Inform that this time is not available. Ask for another time. Max 2 sentences.',

  'need_address': (_data, lang) => lang === 'pt'
    ? 'Explique que precisamos do endereco antes de agendar. Peca o endereco. Max 2 frases.'
    : 'Explain that we need the address before scheduling. Ask for the address. Max 2 sentences.',

  'booking_error': (_data, lang) => lang === 'pt'
    ? 'Houve um erro ao agendar. Peca desculpas e peca para tentar novamente. Max 2 frases.'
    : 'There was an error booking. Apologize and ask to try again. Max 2 sentences.',

  'booking_conflict': (data, lang) => lang === 'pt'
    ? `O horario ${data.time} ja nao esta mais disponivel.${data.suggested_times ? ` Sugestoes: ${data.suggested_times}.` : ''} Peca para escolher outro horario. Max 2 frases.`
    : `The ${data.time} slot is no longer available.${data.suggested_times ? ` Suggestions: ${data.suggested_times}.` : ''} Ask them to pick another time. Max 2 sentences.`,

  'confirm_summary': (data, lang) => lang === 'pt'
    ? `Mostre o resumo do agendamento:\n- Nome: ${data.name}\n- Telefone: ${data.phone || 'em arquivo'}\n- Endereco: ${data.address}\n- Data: ${data.date}\n- Horario: ${data.time}\n- Servico: ${data.service}\nPergunte se esta tudo correto. Max 4 frases.`
    : `Show the booking summary:\n- Name: ${data.name}\n- Phone: ${data.phone || 'on file'}\n- Address: ${data.address}\n- Date: ${data.date}\n- Time: ${data.time}\n- Service: ${data.service}\nAsk if everything looks correct. Max 4 sentences.`,

  'booking_correction': (data, lang) => lang === 'pt'
    ? `Entendido, vamos corrigir.${data.field ? ` Campo: ${data.field}.` : ''} Pergunte o que gostariam de mudar. Max 2 frases.`
    : `Understood, let's fix that.${data.field ? ` Field: ${data.field}.` : ''} Ask what they'd like to change. Max 2 sentences.`,

  'booking_cancelled_by_user': (_data, lang) => lang === 'pt'
    ? 'Entendido, sem problemas. Pergunte se gostaria de reagendar ou se pode ajudar com outra coisa. Max 2 frases.'
    : 'Understood, no problem. Ask if they\'d like to reschedule or if you can help with something else. Max 2 sentences.',

  'ask_preference': (_data, lang) => lang === 'pt'
    ? 'Pergunte se preferem receber confirmacao por SMS ou WhatsApp. Max 1-2 frases.'
    : 'Ask if they prefer confirmation via SMS or WhatsApp. Max 1-2 sentences.',

  'ask_preference_again': (_data, lang) => lang === 'pt'
    ? 'Nao entendemos a preferencia. Pergunte novamente: SMS ou WhatsApp? Max 1-2 frases.'
    : 'We didn\'t catch the preference. Ask again: SMS or WhatsApp? Max 1-2 sentences.',

  'done_booking': (data, lang) => lang === 'pt'
    ? `Confirme que enviaremos por ${data.preference}. Agradeca e se despeca de forma calorosa. Max 2 frases.`
    : `Confirm we'll send confirmation via ${data.preference}. Thank them and say goodbye warmly. Max 2 sentences.`,

  'max_retries_phone': (_data, lang) => lang === 'pt'
    ? 'Muitas tentativas para o telefone. Ofereca tentar novamente ou entrar em contato de outra forma. Max 2 frases.'
    : 'Too many attempts for the phone number. Offer to try again or get help another way. Max 2 sentences.',

  'invalid_phone': (_data, lang) => lang === 'pt'
    ? 'O telefone parece invalido. Peca um numero de telefone americano valido (10 digitos). Max 2 frases.'
    : 'The phone number seems invalid. Ask for a valid US phone number (10 digits). Max 2 sentences.',

  'ask_intent': (data, lang) => lang === 'pt'
    ? `Pergunte a ${data.name || 'o cliente'} o que gostaria de fazer: agendar, cancelar, reagendar ou tirar duvidas. Max 2 frases.`
    : `Ask ${data.name || 'the customer'} what they'd like to do: schedule, cancel, reschedule, or ask a question. Max 2 sentences.`,

  'ask_pet_info': (_data, lang) => lang === 'pt'
    ? 'Pergunte sobre os pets: tipo, quantidade e qualquer detalhe importante. Max 2 frases.'
    : 'Ask about their pets: type, how many, and any important details. Max 2 sentences.',

  'pet_info_saved': (data, lang) => lang === 'pt'
    ? `Confirme que as informacoes sobre os pets (${data.pets}) foram salvas. Max 1-2 frases.`
    : `Confirm that the pet info (${data.pets}) has been saved. Max 1-2 sentences.`,

  'ask_allergy_info': (_data, lang) => lang === 'pt'
    ? 'Pergunte sobre alergias ou sensibilidades: tipo e detalhes importantes para a equipe de limpeza. Max 2 frases.'
    : 'Ask about allergies or sensitivities: type and important details for the cleaning team. Max 2 sentences.',

  'allergy_info_saved': (data, lang) => lang === 'pt'
    ? `Confirme que as informacoes sobre alergias (${data.allergies}) foram salvas. Max 1-2 frases.`
    : `Confirm that the allergy info (${data.allergies}) has been saved. Max 1-2 sentences.`,

  'ask_update_details': (_data, lang) => lang === 'pt'
    ? 'Pergunte quais informacoes gostariam de atualizar (nome, telefone, endereco, etc). Max 2 frases.'
    : 'Ask what information they\'d like to update (name, phone, address, etc). Max 2 sentences.',

  'no_client_id': (_data, lang) => lang === 'pt'
    ? 'Houve um erro no sistema. Peca para comecar novamente com o numero de telefone. Max 2 frases.'
    : 'There was a system error. Ask them to start again with their phone number. Max 2 sentences.',

  'callback_need_phone': (_data, lang) => lang === 'pt'
    ? 'Precisamos do numero de telefone para agendar o retorno. Peca o telefone. Max 2 frases.'
    : 'We need a phone number to schedule the callback. Ask for the phone number. Max 2 sentences.',

  'callback_error': (_data, lang) => lang === 'pt'
    ? 'Houve um erro ao agendar o retorno. Peca desculpas e sugira tentar novamente. Max 2 frases.'
    : 'There was an error scheduling the callback. Apologize and suggest trying again. Max 2 sentences.',

  'no_upcoming_appointments': (_data, lang) => lang === 'pt'
    ? 'Informe que nao encontramos agendamentos futuros. Pergunte se gostariam de agendar um novo. Max 2 frases.'
    : 'Inform that we found no upcoming appointments. Ask if they\'d like to schedule a new one. Max 2 sentences.',

  'invalid_selection': (data, lang) => lang === 'pt'
    ? `Nao conseguimos identificar qual agendamento.${data.count ? ` Escolha um numero de 1 a ${data.count}.` : ''} Peca para tentar novamente. Max 2 frases.`
    : `We couldn't identify which appointment.${data.count ? ` Pick a number from 1 to ${data.count}.` : ''} Ask them to try again. Max 2 sentences.`,

  'cancel_error': (_data, lang) => lang === 'pt'
    ? 'Houve um erro ao cancelar. Peca desculpas e sugira tentar novamente. Max 2 frases.'
    : 'There was an error cancelling. Apologize and suggest trying again. Max 2 sentences.',

  'cancel_success': (_data, lang) => lang === 'pt'
    ? 'Confirme que o agendamento foi cancelado com sucesso. Pergunte se pode ajudar com mais algo. Max 2 frases.'
    : 'Confirm the appointment was cancelled successfully. Ask if you can help with anything else. Max 2 sentences.',

  'show_appointments': (data, lang) => lang === 'pt'
    ? `Mostre a lista de agendamentos:\n${data.list}\nPergunte qual desejam ${data.action === 'reschedule' ? 'reagendar' : 'cancelar'}. Max 3 frases.`
    : `Show the appointments list:\n${data.list}\nAsk which one they'd like to ${data.action || 'manage'}. Max 3 sentences.`,

  'confirm_cancel': (data, lang) => lang === 'pt'
    ? `Confirme o cancelamento do agendamento em ${data.date} as ${data.time}. Peca confirmacao (sim/nao). Max 2 frases.`
    : `Confirm cancellation of the appointment on ${data.date} at ${data.time}. Ask for confirmation (yes/no). Max 2 sentences.`,

  'cancel_aborted': (_data, lang) => lang === 'pt'
    ? 'O cancelamento foi cancelado. Pergunte se pode ajudar com mais algo. Max 2 frases.'
    : 'Cancellation was aborted. Ask if you can help with anything else. Max 2 sentences.',

  'confirm_reschedule': (data, lang) => lang === 'pt'
    ? `Confirme reagendamento do agendamento em ${data.date} as ${data.time}. Peca confirmacao. Max 2 frases.`
    : `Confirm rescheduling of the appointment on ${data.date} at ${data.time}. Ask for confirmation. Max 2 sentences.`,

  'reschedule_aborted': (_data, lang) => lang === 'pt'
    ? 'O reagendamento foi cancelado. Pergunte se pode ajudar com mais algo. Max 2 frases.'
    : 'Rescheduling was aborted. Ask if you can help with anything else. Max 2 sentences.',

  'reschedule_pick_date': (_data, lang) => lang === 'pt'
    ? 'Pergunte qual a nova data preferida para o reagendamento. Max 2 frases.'
    : 'Ask what new date they prefer for rescheduling. Max 2 sentences.',

  'ask_callback_time': (_data, lang) => lang === 'pt'
    ? 'Pergunte qual o melhor horario para retornarmos a ligacao. Max 2 frases.'
    : 'Ask what time works best for a callback. Max 2 sentences.',

  'callback_scheduled': (_data, lang) => lang === 'pt'
    ? 'Confirme que agendamos o retorno. Alguem entrara em contato. Max 2 frases.'
    : 'Confirm the callback is scheduled. Someone will reach out. Max 2 sentences.',

  'info_updated': (data, lang) => lang === 'pt'
    ? `Confirme que os campos ${data.fields} foram atualizados com sucesso. Max 2 frases.`
    : `Confirm that ${data.fields} was updated successfully. Max 2 sentences.`,

  'deflect_price': (_data, lang) => lang === 'pt'
    ? 'Explique que nao fornecemos orcamentos pelo chat. A primeira visita e gratuita e presencial para avaliar o imovel. Sugira agendar a visita. Max 3 frases.'
    : 'Explain that we don\'t provide estimates via chat. The first visit is free and in-person to evaluate the property. Suggest scheduling the visit. Max 3 sentences.',

  'guardrail': (_data, lang) => lang === 'pt'
    ? 'Explique educadamente que so pode ajudar com assuntos de limpeza e agendamento. Pergunte se pode ajudar com algo nessa area. Max 2 frases.'
    : 'Politely explain you can only help with cleaning and scheduling matters. Ask if you can help with something in that area. Max 2 sentences.',

  'goodbye': (_data, lang) => lang === 'pt'
    ? 'Despeca-se de forma calorosa e simpatica. Max 1-2 frases.'
    : 'Say goodbye warmly and friendly. Max 1-2 sentences.',
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

    try {
      const response = await openrouter.chat.completions.create({
        model: this.model,
        temperature: 0.1,
        max_tokens: 200,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
      })

      const content = response.choices[0]?.message?.content || '{}'
      try {
        return JSON.parse(content)
      } catch (parseError) {
        console.error(`[CarolLLM.extract] JSON parse error for type="${type}". Raw content: ${content}`, parseError)
        return { _error: true }
      }
    } catch (apiError) {
      console.error(`[CarolLLM.extract] API error for type="${type}":`, apiError)
      return {}
    }
  }

  // ═══ CLASSIFICATION ═══

  async classifyIntent(
    message: string,
    options: string[]
  ): Promise<string> {
    if (!options || options.length === 0) {
      throw new Error('[CarolLLM.classifyIntent] options array must not be empty')
    }

    const systemPrompt = `Classify the user message into ONE of these categories: ${options.join(', ')}. Return ONLY the category name, nothing else.`

    try {
      const response = await openrouter.chat.completions.create({
        model: this.model,
        temperature: 0.1,
        max_tokens: 50,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
      })

      const result = (response.choices[0]?.message?.content || '').trim()

      if (!result) {
        console.error(`[CarolLLM.classifyIntent] Empty LLM response. Options: ${options.join(', ')}. Message: "${message}"`)
        return 'unknown'
      }

      // Validate against options (case-insensitive match)
      const match = options.find(
        (opt) => opt.toLowerCase() === result.toLowerCase()
      )

      if (!match) {
        console.error(`[CarolLLM.classifyIntent] Unexpected LLM result "${result}". Expected one of: ${options.join(', ')}. Message: "${message}"`)
        return 'unknown'
      }

      return match
    } catch (apiError) {
      console.error('[CarolLLM.classifyIntent] API error:', apiError)
      return 'unknown'
    }
  }

  // ═══ LANGUAGE DETECTION ═══

  async detectLanguage(message: string): Promise<'pt' | 'en'> {
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
          { role: 'user', content: message },
        ],
      })

      const result = (response.choices[0]?.message?.content || 'en')
        .trim()
        .toLowerCase()
      return result === 'pt' ? 'pt' : 'en'
    } catch (apiError) {
      console.error('[CarolLLM.detectLanguage] API error:', apiError)
      return 'en'
    }
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

      return (response.choices[0]?.message?.content || '').trim()
    } catch (apiError) {
      console.error(`[CarolLLM.generate] API error for template="${template}":`, apiError)
      return "I'm sorry, could you say that again?"
    }
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

    try {
      const response = await openrouter.chat.completions.create({
        model: this.model,
        temperature: 0.5,
        max_tokens: 500,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
      })

      return (response.choices[0]?.message?.content || '').trim()
    } catch (apiError) {
      console.error('[CarolLLM.generateFaq] API error:', apiError)
      return lang === 'pt'
        ? 'Desculpe, nao consegui processar sua pergunta. Por favor, tente novamente ou entre em contato conosco diretamente.'
        : "I'm sorry, I couldn't process your question. Please try again or contact us directly."
    }
  }
}

// Default singleton
export const carol = new CarolLLM()
